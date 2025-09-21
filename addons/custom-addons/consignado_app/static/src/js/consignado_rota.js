/** @odoo-module **/

import { registry } from "@web/core/registry";
import { Component, useState, onMounted } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

/**
 * Componente para melhorar a interface das rotas de consignados
 * Adiciona funcionalidades interativas e validações em tempo real
 */
export class ConsignadoRotaWidget extends Component {
    setup() {
        this.orm = useService("orm");
        this.notification = useService("notification");
        this.state = useState({
            loading: false,
            showAdvanced: false,
        });
    }

    /**
     * Valida a frequência em tempo real
     */
    async onFrequenciaChange(ev) {
        const value = parseInt(ev.target.value);
        if (value <= 0) {
            this.notification.add("A frequência deve ser um número positivo", {
                type: "warning",
            });
        }
    }

    /**
     * Calcula e exibe a próxima data baseada na frequência
     */
    async calculateProximaData() {
        const frequencia = this.props.record.data.frequencia_dias;
        const ultimaData = this.props.record.data.ultima_data_percorrida;
        
        if (frequencia && ultimaData) {
            const ultimaDataObj = new Date(ultimaData);
            const proximaData = new Date(ultimaDataObj);
            proximaData.setDate(ultimaDataObj.getDate() + frequencia);
            
            this.props.record.update({
                proxima_data: proximaData.toISOString().split('T')[0]
            });
        }
    }

    /**
     * Marca a rota como concluída
     */
    async marcarConcluida() {
        this.state.loading = true;
        try {
            await this.orm.call(
                "consignado.rota",
                "action_marcar_concluida",
                [this.props.record.resId]
            );
            this.notification.add("Rota marcada como concluída!", {
                type: "success",
            });
            await this.props.record.load();
        } catch (error) {
            this.notification.add("Erro ao marcar rota como concluída", {
                type: "danger",
            });
        } finally {
            this.state.loading = false;
        }
    }

    /**
     * Alterna visibilidade dos campos avançados
     */
    toggleAdvanced() {
        this.state.showAdvanced = !this.state.showAdvanced;
    }
}

ConsignadoRotaWidget.template = "consignado_app.ConsignadoRotaWidget";
ConsignadoRotaWidget.props = ["record"];

registry.category("view_widgets").add("consignado_rota_widget", ConsignadoRotaWidget);

/**
 * Serviço para funcionalidades offline do aplicativo móvel
 */
export class OfflineService {
    constructor() {
        this.isOnline = navigator.onLine;
        this.pendingActions = [];
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncPendingActions();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    /**
     * Armazena ação para execução quando voltar online
     */
    storeAction(action) {
        this.pendingActions.push({
            ...action,
            timestamp: Date.now()
        });
        this.saveToLocalStorage();
    }

    /**
     * Sincroniza ações pendentes quando voltar online
     */
    async syncPendingActions() {
        if (!this.isOnline || this.pendingActions.length === 0) return;

        const actions = [...this.pendingActions];
        this.pendingActions = [];

        for (const action of actions) {
            try {
                await this.executeAction(action);
            } catch (error) {
                console.error('Erro ao sincronizar ação:', error);
                this.pendingActions.push(action);
            }
        }

        this.saveToLocalStorage();
    }

    /**
     * Executa uma ação armazenada
     */
    async executeAction(action) {
        // Implementar lógica de execução das ações
        console.log('Executando ação:', action);
    }

    /**
     * Salva ações pendentes no localStorage
     */
    saveToLocalStorage() {
        localStorage.setItem('consignado_pending_actions', 
            JSON.stringify(this.pendingActions));
    }

    /**
     * Carrega ações pendentes do localStorage
     */
    loadFromLocalStorage() {
        const stored = localStorage.getItem('consignado_pending_actions');
        if (stored) {
            this.pendingActions = JSON.parse(stored);
        }
    }
}

// Inicializar serviço offline
const offlineService = new OfflineService();
offlineService.loadFromLocalStorage();

/**
 * Utilitários para o módulo Consignado
 */
export const ConsignadoUtils = {
    /**
     * Formata data para exibição brasileira
     */
    formatDateBR(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('pt-BR');
    },

    /**
     * Calcula dias entre duas datas
     */
    daysBetween(date1, date2) {
        const oneDay = 24 * 60 * 60 * 1000;
        const firstDate = new Date(date1);
        const secondDate = new Date(date2);
        return Math.round(Math.abs((firstDate - secondDate) / oneDay));
    },

    /**
     * Valida se uma data é válida
     */
    isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    },

    /**
     * Gera cor baseada no status da rota
     */
    getStatusColor(status) {
        const colors = {
            'pendente': '#17a2b8',
            'em_andamento': '#ffc107',
            'concluida': '#28a745',
            'atrasada': '#dc3545'
        };
        return colors[status] || '#6c757d';
    }
};
