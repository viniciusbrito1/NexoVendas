# -*- coding: utf-8 -*-

import logging
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError
from datetime import datetime, timedelta

_logger = logging.getLogger(__name__)


class ConsignadoRota(models.Model):
    """
    Modelo para gestão de rotas de consignados
    
    Este modelo gerencia as rotas recorrentes de vendas, permitindo:
    - Definir vendedores responsáveis
    - Associar clientes fixos às rotas
    - Controlar frequência de visitas
    - Calcular automaticamente próximas datas
    """
    _name = 'consignado.rota'
    _description = 'Rota de Consignados'
    _order = 'name'
    _rec_name = 'name'

    # Campos básicos
    name = fields.Char(
        string='Nome da Rota',
        required=True,
        help='Nome identificador da rota (ex: "Rota Bairro Sul")'
    )
    
    vendedor_id = fields.Many2one(
        'res.users',
        string='Vendedor Responsável',
        required=True,
        help='Usuário do Odoo responsável por esta rota'
    )
    
    clientes_ids = fields.Many2many(
        'res.partner',
        'consignado_rota_cliente_rel',
        'rota_id',
        'cliente_id',
        string='Clientes da Rota',
        domain="[('is_company', '=', True)]",
        help='Lista dos clientes (pontos de venda) fixos nesta rota'
    )
    
    frequencia_dias = fields.Integer(
        string='Frequência (dias)',
        required=True,
        default=7,
        help='Frequência com que a rota é percorrida em dias (ex: 7 para semanal)'
    )
    
    ultima_data_percorrida = fields.Date(
        string='Última Data Percorrida',
        help='Data da última vez que a rota foi concluída'
    )
    
    proxima_data = fields.Date(
        string='Próxima Data',
        compute='_compute_proxima_data',
        store=True,
        help='Data planejada para a próxima execução da rota'
    )
    
    # Campos de controle
    ativa = fields.Boolean(
        string='Rota Ativa',
        default=True,
        help='Indica se a rota está ativa para execução'
    )
    
    observacoes = fields.Text(
        string='Observações',
        help='Observações adicionais sobre a rota'
    )
    
    # Campos calculados
    total_clientes = fields.Integer(
        string='Total de Clientes',
        compute='_compute_total_clientes',
        store=True
    )
    
    dias_restantes = fields.Integer(
        string='Dias Restantes',
        compute='_compute_dias_restantes'
    )
    
    status = fields.Selection([
        ('pendente', 'Pendente'),
        ('em_andamento', 'Em Andamento'),
        ('concluida', 'Concluída'),
        ('atrasada', 'Atrasada'),
    ], string='Status', compute='_compute_status', store=True)

    @api.depends('clientes_ids')
    def _compute_total_clientes(self):
        """Calcula o total de clientes associados à rota"""
        for rota in self:
            rota.total_clientes = len(rota.clientes_ids)

    @api.depends('ultima_data_percorrida', 'frequencia_dias')
    def _compute_proxima_data(self):
        """Calcula automaticamente a próxima data baseada na frequência"""
        for rota in self:
            if rota.ultima_data_percorrida and rota.frequencia_dias:
                rota.proxima_data = rota.ultima_data_percorrida + timedelta(days=rota.frequencia_dias)
            elif not rota.ultima_data_percorrida and rota.frequencia_dias:
                # Se nunca foi percorrida, define para hoje
                rota.proxima_data = fields.Date.today()
            else:
                rota.proxima_data = False

    @api.depends('proxima_data')
    def _compute_dias_restantes(self):
        """Calcula quantos dias restam para a próxima execução"""
        today = fields.Date.today()
        for rota in self:
            if rota.proxima_data:
                delta = rota.proxima_data - today
                rota.dias_restantes = delta.days
            else:
                rota.dias_restantes = 0

    @api.depends('proxima_data', 'ultima_data_percorrida')
    def _compute_status(self):
        """Determina o status da rota baseado nas datas"""
        today = fields.Date.today()
        for rota in self:
            if not rota.proxima_data:
                rota.status = 'pendente'
            elif rota.proxima_data > today:
                rota.status = 'pendente'
            elif rota.proxima_data == today:
                rota.status = 'em_andamento'
            elif rota.proxima_data < today:
                rota.status = 'atrasada'
            else:
                rota.status = 'pendente'

    @api.constrains('frequencia_dias')
    def _check_frequencia_dias(self):
        """Valida se a frequência é um valor positivo"""
        for rota in self:
            if rota.frequencia_dias <= 0:
                raise ValidationError(_('A frequência deve ser um número positivo de dias.'))

    @api.constrains('vendedor_id')
    def _check_vendedor(self):
        """Valida se o vendedor tem permissões adequadas"""
        for rota in self:
            if not rota.vendedor_id.has_group('sales_team.group_sale_salesman'):
                raise ValidationError(_('O vendedor deve ter permissões de vendas.'))

    def action_marcar_concluida(self):
        """Marca a rota como concluída na data atual"""
        self.ensure_one()
        self.ultima_data_percorrida = fields.Date.today()
        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': _('Rota Concluída'),
                'message': _('A rota "%s" foi marcada como concluída.' % self.name),
                'type': 'success',
            }
        }

    def action_reagendar_rota(self):
        """Abre wizard para reagendar a rota"""
        self.ensure_one()
        return {
            'type': 'ir.actions.act_window',
            'name': _('Reagendar Rota'),
            'res_model': 'consignado.rota.reagendar.wizard',
            'view_mode': 'form',
            'target': 'new',
            'context': {'default_rota_id': self.id},
        }

    def action_visualizar_clientes(self):
        """Abre view dos clientes da rota"""
        self.ensure_one()
        return {
            'type': 'ir.actions.act_window',
            'name': _('Clientes da Rota: %s' % self.name),
            'res_model': 'res.partner',
            'view_mode': 'list,form',
            'domain': [('id', 'in', self.clientes_ids.ids)],
            'context': {'default_is_company': True},
        }

    @api.model
    def cron_atualizar_status_rotas(self):
        """
        Método cron para atualizar status das rotas automaticamente
        Este método pode ser chamado diariamente para manter os status atualizados
        """
        rotas = self.search([('ativa', '=', True)])
        for rota in rotas:
            rota._compute_status()
        _logger.info(f'Status de {len(rotas)} rotas atualizado automaticamente.')

    def name_get(self):
        """Personaliza a exibição do nome do registro"""
        result = []
        for rota in self:
            name = rota.name
            if rota.vendedor_id:
                name += f' - {rota.vendedor_id.name}'
            result.append((rota.id, name))
        return result
