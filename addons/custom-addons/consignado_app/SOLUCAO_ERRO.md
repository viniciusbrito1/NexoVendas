# Solução para Erro de Instalação

## Problemas Identificados

### Problema 1: Ordem de Carregamento
O erro inicial ocorreu porque o arquivo `ir.model.access.csv` estava tentando referenciar grupos de segurança que ainda não foram criados. A ordem de carregamento dos arquivos estava incorreta.

### Problema 2: Tipo de View Obsoleto
No Odoo 18.0, o tipo de view `tree` foi renomeado para `list`. Todas as referências a `tree` precisam ser atualizadas.

### Problema 3: Atributos Obsoletos
No Odoo 17.0+, os atributos `attrs` e `states` foram removidos. Precisam ser substituídos por `invisible`, `readonly`, etc.

### Problema 4: Widgets Obsoletos
Alguns widgets foram removidos ou renomeados no Odoo 18.0:
- `statusbar` → removido
- `boolean_toggle` → `toggle`
- `badge` → removido

### Problema 5: Campos Obsoletos no ir.cron
No Odoo 18.0, o campo `numbercall` foi removido do modelo `ir.cron`.

## Correções Aplicadas

### 1. Ordem dos Arquivos no Manifest

**Antes:**
```python
'data': [
    'security/ir.model.access.csv',  # ❌ Tentava referenciar grupos não criados
    'security/consignado_security.xml',
    # ...
]
```

**Depois:**
```python
'data': [
    'security/consignado_security.xml',  # ✅ Cria os grupos primeiro
    'security/ir.model.access.csv',      # ✅ Agora pode referenciar os grupos
    # ...
]
```

### 2. Dados de Demonstração Simplificados

Removidas as referências a países e estados que podem não existir:
- Removido: `ref="base.br"`
- Removido: `ref="base.state_br_sp"`

### 3. Cron Job Corrigido

Removida a referência problemática ao usuário root.

### 4. Views Atualizadas para Odoo 18.0

**Antes:**
```xml
<tree string="Rotas de Consignados">
    <!-- campos -->
</tree>
```

**Depois:**
```xml
<list string="Rotas de Consignados">
    <!-- campos -->
</list>
```

**Alterações:**
- `tree` → `list` em todas as views
- `view_mode="tree,kanban,form"` → `view_mode="list,kanban,form"`
- `view_consignado_rota_tree` → `view_consignado_rota_list`

### 5. Atributos Obsoletos Corrigidos

**Antes:**
```xml
<button attrs="{'invisible': [('status', 'in', ['concluida'])]}"/>
```

**Depois:**
```xml
<button invisible="status in ['concluida']"/>
```

### 6. Widgets Obsoletos Corrigidos

**Antes:**
```xml
<field name="status" widget="statusbar" statusbar_visible="pendente,em_andamento,concluida"/>
<field name="ativa" widget="boolean_toggle"/>
<field name="status" widget="badge"/>
```

**Depois:**
```xml
<field name="status"/>
<field name="ativa" widget="toggle"/>
<field name="status"/>
```

### 7. Campos Obsoletos no ir.cron Corrigidos

**Antes:**
```xml
<field name="numbercall">-1</field>
```

**Depois:**
```xml
<!-- Campo removido - não é mais necessário -->
```

## Como Resolver

### Opção 1: Reinstalar o Módulo

1. **Desinstale o módulo** (se já foi instalado):
   - Acesse **Aplicativos**
   - Procure por "Consignado App"
   - Clique em **Desinstalar**

2. **Reinicie o container**:
   ```bash
   docker-compose restart odoo
   ```

3. **Instale novamente**:
   - Acesse **Aplicativos**
   - Procure por "Consignado App"
   - Clique em **Instalar**

### Opção 2: Atualizar o Módulo

1. **Atualize a lista de aplicativos**:
   - Acesse **Aplicativos**
   - Clique em **Atualizar Lista de Aplicativos**

2. **Atualize o módulo**:
   - Procure por "Consignado App"
   - Clique em **Atualizar**

### Opção 3: Limpeza Completa (se necessário)

Se ainda houver problemas:

1. **Pare o container**:
   ```bash
   docker-compose down
   ```

2. **Remova o módulo do banco** (opcional):
   ```bash
   docker-compose exec db psql -U odoo -d your_database -c "DELETE FROM ir_module_module WHERE name = 'consignado_app';"
   ```

3. **Reinicie**:
   ```bash
   docker-compose up -d
   ```

4. **Instale o módulo**:
   - Acesse **Aplicativos**
   - Procure por "Consignado App"
   - Clique em **Instalar**

## Verificação

Após a instalação bem-sucedida, você deve ver:

1. **Menu "Consignado App"** no menu principal
2. **Submenus**:
   - Gestão > Rotas
   - Relatórios > Análise de Rotas
   - Configurações
   - Minhas Rotas (para vendedores)

3. **Dados de demonstração** carregados:
   - 5 clientes de exemplo
   - 4 rotas de demonstração

## Logs de Sucesso

Quando a instalação funcionar, você verá nos logs:
```
INFO your_database odoo.modules.loading: Module consignado_app loaded in X.XXs, XXX queries
```

## Suporte

Se ainda houver problemas:

1. Verifique os logs do container:
   ```bash
   docker-compose logs odoo
   ```

2. Verifique se todos os arquivos estão no lugar correto
3. Verifique as permissões dos arquivos
4. Entre em contato com a equipe de desenvolvimento

## Arquivos Corrigidos

- ✅ `__manifest__.py` - Ordem dos arquivos corrigida
- ✅ `data/demo_data.xml` - Referências externas removidas
- ✅ `data/ir_cron_data.xml` - Referência problemática removida
- ✅ `security/consignado_security.xml` - Grupos de segurança
- ✅ `security/ir.model.access.csv` - Permissões de acesso
- ✅ `views/consignado_rota_views.xml` - Views atualizadas para Odoo 18.0
- ✅ `models/consignado_rota.py` - Métodos atualizados para usar `list`
- ✅ Atributos `attrs` → `invisible` corrigidos
- ✅ Widgets obsoletos removidos/substituídos
- ✅ Campo `numbercall` removido do ir.cron
