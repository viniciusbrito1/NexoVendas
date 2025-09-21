# -*- coding: utf-8 -*-
{
    'name': 'Consignado App',
    'version': '18.0.1.0.0',
    'category': 'Sales',
    'summary': 'Módulo para gestão de negócios de consignados com rotas recorrentes',
    'description': """
        Módulo Consignado App
        ====================
        
        Este módulo permite a gestão de negócios de consignados com foco em:
        - Gestão central de rotas recorrentes
        - Aplicativo móvel para vendedores com funcionalidade offline
        - Controle de frequência de visitas
        - Gestão de clientes por rota
        
        Funcionalidades principais:
        * Criação e gestão de rotas de vendas
        * Associação de vendedores às rotas
        * Controle de frequência de visitas
        * Cálculo automático de próximas datas
        * Interface web responsiva
    """,
    'author': 'NexoVendas',
    'website': 'https://www.nexovendas.com',
    'depends': [
        'base',
        'web',
        'sale_management',
        'stock',
    ],
    'data': [
        'security/consignado_security.xml',
        'security/ir.model.access.csv',
        'views/consignado_rota_views.xml',
        'views/consignado_rota_wizard_views.xml',
        'views/menu_views.xml',
        'data/ir_cron_data.xml',
        'data/demo_data.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'consignado_app/static/src/js/consignado_rota.js',
            'consignado_app/static/src/css/consignado_rota.css',
        ],
        'web.assets_frontend': [
            'consignado_app/static/src/js/mobile_app.js',
            'consignado_app/static/src/css/mobile_app.css',
            'consignado_app/static/src/xml/mobile_templates.xml',
        ],
    },
    'installable': True,
    'auto_install': False,
    'application': True,
    'license': 'LGPL-3',
}
