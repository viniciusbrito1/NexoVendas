# Guia de Instalação - Consignado App

## Pré-requisitos

- Odoo 18.0 ou superior
- PostgreSQL 12 ou superior
- Python 3.8 ou superior
- Módulos dependentes: `base`, `web`, `sale_management`, `stock`

## Instalação

### 1. Preparação do Ambiente

Certifique-se de que o Odoo está configurado e funcionando corretamente:

```bash
# Verificar se o Odoo está rodando
docker-compose ps
```

### 2. Instalação do Módulo

1. **Copie o módulo** para o diretório de addons:
   ```bash
   # O módulo já está em addons/custom-addons/consignado_app/
   ```

2. **Reinicie o container Odoo**:
   ```bash
   docker-compose restart odoo
   ```

3. **Atualize a lista de aplicativos**:
   - Acesse o Odoo como administrador
   - Vá em **Aplicativos**
   - Clique em **Atualizar Lista de Aplicativos**

4. **Instale o módulo**:
   - Procure por "Consignado App"
   - Clique em **Instalar**

### 3. Configuração Inicial

#### Grupos de Segurança

Após a instalação, configure os grupos de segurança:

1. **Consignado Manager**: Para administradores com acesso total
2. **Consignado User**: Para usuários com acesso padrão
3. **Sales Team**: Para vendedores (já existe no Odoo)

#### Configuração de Usuários

1. Acesse **Configurações > Usuários e Empresas > Usuários**
2. Atribua os grupos apropriados aos usuários:
   - **Gerentes**: Consignado Manager
   - **Usuários**: Consignado User
   - **Vendedores**: Sales Team

### 4. Dados de Demonstração

O módulo inclui dados de demonstração que são carregados automaticamente:

- **5 clientes** de exemplo
- **4 rotas** de demonstração
- **Dados de teste** para facilitar a exploração

## Primeiros Passos

### 1. Criar uma Rota

1. Acesse **Consignado App > Gestão > Rotas**
2. Clique em **Criar**
3. Preencha os campos:
   - **Nome da Rota**: Ex: "Rota Centro"
   - **Vendedor Responsável**: Selecione um usuário
   - **Frequência (dias)**: Ex: 7 (semanal)
4. Adicione clientes à rota
5. Salve

### 2. Visualizar Rotas

O módulo oferece várias visualizações:

- **Lista**: Tabela com filtros
- **Kanban**: Cards por status
- **Calendário**: Cronograma visual
- **Gráficos**: Análise estatística

### 3. Usar o Aplicativo Móvel

1. Acesse o Odoo em um dispositivo móvel
2. Faça login como vendedor
3. Acesse **Consignado App > Minhas Rotas**
4. Visualize suas rotas e marque como concluídas

## Funcionalidades Principais

### Gestão de Rotas

- ✅ Criação e edição de rotas
- ✅ Associação de vendedores
- ✅ Gestão de clientes por rota
- ✅ Controle de frequência
- ✅ Cálculo automático de datas
- ✅ Status inteligente

### Aplicativo Móvel

- ✅ Interface responsiva
- ✅ Funcionalidade offline
- ✅ Sincronização automática
- ✅ Dashboard de estatísticas
- ✅ Ações rápidas

### Relatórios e Análises

- ✅ Visualização em calendário
- ✅ Gráficos estatísticos
- ✅ Análise pivot
- ✅ Filtros avançados

## Troubleshooting

### Problemas Comuns

#### 1. Módulo não aparece na lista

**Solução**:
- Verifique se o módulo está no diretório correto
- Reinicie o container Odoo
- Atualize a lista de aplicativos

#### 2. Erro de permissões

**Solução**:
- Verifique se o usuário tem os grupos corretos
- Configure as regras de segurança
- Verifique as permissões de acesso

#### 3. Dados não sincronizam no mobile

**Solução**:
- Verifique a conexão com a internet
- Limpe o cache do navegador
- Verifique se o serviço offline está funcionando

### Logs e Debug

Para debug, verifique os logs do Odoo:

```bash
# Ver logs do container
docker-compose logs odoo

# Ver logs em tempo real
docker-compose logs -f odoo
```

## Suporte

Para suporte técnico:

1. Verifique este guia primeiro
2. Consulte o README.md do módulo
3. Verifique os logs do sistema
4. Entre em contato com a equipe de desenvolvimento

## Atualizações

Para atualizar o módulo:

1. Faça backup dos dados
2. Substitua os arquivos do módulo
3. Atualize o módulo no Odoo
4. Verifique se tudo está funcionando

## Backup

Antes de fazer alterações importantes:

1. **Backup do banco de dados**:
   ```bash
   docker-compose exec db pg_dump -U odoo postgres > backup.sql
   ```

2. **Backup dos arquivos**:
   ```bash
   cp -r addons/custom-addons/consignado_app backup_consignado_app
   ```
