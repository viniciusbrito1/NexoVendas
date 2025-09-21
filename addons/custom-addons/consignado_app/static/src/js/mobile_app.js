/** @odoo-module **/

import { Component, useState, onMounted, onWillUnmount } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

/**
 * Aplicativo móvel para vendedores com funcionalidade offline
 * Permite que vendedores visualizem e gerenciem suas rotas mesmo sem conexão
 */
export class ConsignadoMobileApp extends Component {
    setup() {
        this.orm = useService("orm");
        this.notification = useService("notification");
        this.rpc = useService("rpc");
        
        this.state = useState({
            isOnline: navigator.onLine,
            rotas: [],
            loading: false,
            selectedRota: null,
            offlineData: {},
            pendingSync: []
        });

        this.setupEventListeners();
        this.loadOfflineData();
    }

    setupEventListeners() {
        window.addEventListener('online', () => {
            this.state.isOnline = true;
            this.syncOfflineData();
        });

        window.addEventListener('offline', () => {
            this.state.isOnline = false;
        });
    }

    onWillUnmount() {
        window.removeEventListener('online', this.handleOnline);
        window.removeEventListener('offline', this.handleOffline);
    }

    /**
     * Carrega dados offline do localStorage
     */
    loadOfflineData() {
        const stored = localStorage.getItem('consignado_offline_data');
        if (stored) {
            this.state.offlineData = JSON.parse(stored);
        }
    }

    /**
     * Salva dados offline no localStorage
     */
    saveOfflineData() {
        localStorage.setItem('consignado_offline_data', 
            JSON.stringify(this.state.offlineData));
    }

    /**
     * Carrega rotas do vendedor logado
     */
    async loadRotas() {
        this.state.loading = true;
        try {
            if (this.state.isOnline) {
                const rotas = await this.orm.searchRead(
                    "consignado.rota",
                    [["vendedor_id", "=", this.env.user.id]],
                    ["name", "clientes_ids", "frequencia_dias", "ultima_data_percorrida", 
                     "proxima_data", "status", "total_clientes"]
                );
                this.state.rotas = rotas;
                this.state.offlineData.rotas = rotas;
                this.saveOfflineData();
            } else {
                // Usar dados offline
                this.state.rotas = this.state.offlineData.rotas || [];
            }
        } catch (error) {
            console.error('Erro ao carregar rotas:', error);
            this.notification.add("Erro ao carregar rotas", { type: "danger" });
        } finally {
            this.state.loading = false;
        }
    }

    /**
     * Seleciona uma rota para visualização
     */
    selectRota(rota) {
        this.state.selectedRota = rota;
    }

    /**
     * Marca uma rota como concluída
     */
    async marcarRotaConcluida(rotaId) {
        const action = {
            type: 'marcar_concluida',
            rota_id: rotaId,
            timestamp: Date.now()
        };

        if (this.state.isOnline) {
            try {
                await this.orm.call("consignado.rota", "action_marcar_concluida", [rotaId]);
                this.notification.add("Rota marcada como concluída!", { type: "success" });
                await this.loadRotas();
            } catch (error) {
                this.state.pendingSync.push(action);
                this.notification.add("Ação salva para sincronização", { type: "warning" });
            }
        } else {
            this.state.pendingSync.push(action);
            this.notification.add("Ação salva para sincronização offline", { type: "info" });
        }
    }

    /**
     * Sincroniza dados offline quando voltar online
     */
    async syncOfflineData() {
        if (this.state.pendingSync.length === 0) return;

        this.notification.add("Sincronizando dados...", { type: "info" });

        for (const action of this.state.pendingSync) {
            try {
                switch (action.type) {
                    case 'marcar_concluida':
                        await this.orm.call("consignado.rota", "action_marcar_concluida", [action.rota_id]);
                        break;
                    // Adicionar outros tipos de ação conforme necessário
                }
            } catch (error) {
                console.error('Erro ao sincronizar ação:', error);
            }
        }

        this.state.pendingSync = [];
        await this.loadRotas();
        this.notification.add("Dados sincronizados com sucesso!", { type: "success" });
    }

    /**
     * Calcula status da rota baseado na data
     */
    getRotaStatus(rota) {
        if (!rota.proxima_data) return 'pendente';
        
        const hoje = new Date();
        const proximaData = new Date(rota.proxima_data);
        const diffTime = proximaData - hoje;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'atrasada';
        if (diffDays === 0) return 'em_andamento';
        return 'pendente';
    }

    /**
     * Formata data para exibição
     */
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    /**
     * Filtra rotas por status
     */
    getRotasByStatus(status) {
        return this.state.rotas.filter(rota => this.getRotaStatus(rota) === status);
    }

    /**
     * Obtém estatísticas das rotas
     */
    getEstatisticas() {
        const total = this.state.rotas.length;
        const pendentes = this.getRotasByStatus('pendente').length;
        const atrasadas = this.getRotasByStatus('atrasada').length;
        const emAndamento = this.getRotasByStatus('em_andamento').length;

        return { total, pendentes, atrasadas, emAndamento };
    }
}

ConsignadoMobileApp.template = "consignado_app.MobileApp";

/**
 * Componente para exibir lista de rotas
 */
export class RotasList extends Component {
    setup() {
        this.state = useState({
            filter: 'todas'
        });
    }

    get filteredRotas() {
        if (this.state.filter === 'todas') {
            return this.props.rotas;
        }
        return this.props.rotas.filter(rota => 
            this.getRotaStatus(rota) === this.state.filter
        );
    }

    getRotaStatus(rota) {
        if (!rota.proxima_data) return 'pendente';
        
        const hoje = new Date();
        const proximaData = new Date(rota.proxima_data);
        const diffTime = proximaData - hoje;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'atrasada';
        if (diffDays === 0) return 'em_andamento';
        return 'pendente';
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }
}

RotasList.template = "consignado_app.RotasList";
RotasList.props = ["rotas", "onSelectRota", "onMarcarConcluida"];

/**
 * Componente para exibir detalhes de uma rota
 */
export class RotaDetails extends Component {
    setup() {
        this.state = useState({
            showClientes: false
        });
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    getRotaStatus(rota) {
        if (!rota.proxima_data) return 'pendente';
        
        const hoje = new Date();
        const proximaData = new Date(rota.proxima_data);
        const diffTime = proximaData - hoje;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'atrasada';
        if (diffDays === 0) return 'em_andamento';
        return 'pendente';
    }
}

RotaDetails.template = "consignado_app.RotaDetails";
RotaDetails.props = ["rota", "onMarcarConcluida"];

/**
 * Utilitários para o aplicativo móvel
 */
export const MobileUtils = {
    /**
     * Verifica se o dispositivo é móvel
     */
    isMobile() {
        return window.innerWidth <= 768;
    },

    /**
     * Obtém informações do dispositivo
     */
    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            online: navigator.onLine,
            timestamp: Date.now()
        };
    },

    /**
     * Salva dados no cache do navegador
     */
    saveToCache(key, data) {
        try {
            localStorage.setItem(`consignado_cache_${key}`, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Erro ao salvar no cache:', error);
            return false;
        }
    },

    /**
     * Carrega dados do cache do navegador
     */
    loadFromCache(key) {
        try {
            const data = localStorage.getItem(`consignado_cache_${key}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Erro ao carregar do cache:', error);
            return null;
        }
    },

    /**
     * Limpa cache expirado (mais de 7 dias)
     */
    clearExpiredCache() {
        const now = Date.now();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 dias

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('consignado_cache_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data.timestamp && (now - data.timestamp) > maxAge) {
                        localStorage.removeItem(key);
                    }
                } catch (error) {
                    // Remove chaves corrompidas
                    localStorage.removeItem(key);
                }
            }
        }
    }
};
