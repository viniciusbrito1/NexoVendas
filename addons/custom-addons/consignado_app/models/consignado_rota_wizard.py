# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import ValidationError
from datetime import datetime, timedelta


class ConsignadoRotaReagendarWizard(models.TransientModel):
    """
    Wizard para reagendar rotas de consignados
    
    Permite ao usuário alterar a data da próxima execução de uma rota
    """
    _name = 'consignado.rota.reagendar.wizard'
    _description = 'Wizard para Reagendar Rota'

    rota_id = fields.Many2one(
        'consignado.rota',
        string='Rota',
        required=True,
        help='Rota que será reagendada'
    )
    
    nova_data = fields.Date(
        string='Nova Data',
        required=True,
        help='Nova data para execução da rota'
    )
    
    motivo = fields.Text(
        string='Motivo do Reagendamento',
        help='Motivo para o reagendamento da rota'
    )

    @api.model
    def default_get(self, fields_list):
        """Define valores padrão para o wizard"""
        defaults = super().default_get(fields_list)
        
        # Se uma rota foi passada no contexto, usa ela como padrão
        if 'default_rota_id' in self.env.context:
            rota_id = self.env.context['default_rota_id']
            rota = self.env['consignado.rota'].browse(rota_id)
            defaults['rota_id'] = rota_id
            # Define a próxima data como padrão
            defaults['nova_data'] = rota.proxima_data or fields.Date.today()
            
        return defaults

    @api.constrains('nova_data')
    def _check_nova_data(self):
        """Valida se a nova data é válida"""
        for wizard in self:
            if wizard.nova_data and wizard.nova_data < fields.Date.today():
                raise ValidationError(
                    _('A nova data não pode ser anterior à data atual.')
                )

    def action_reagendar(self):
        """Executa o reagendamento da rota"""
        self.ensure_one()
        
        if not self.rota_id:
            raise ValidationError(_('Nenhuma rota foi selecionada.'))
        
        # Atualiza a próxima data da rota
        self.rota_id.proxima_data = self.nova_data
        
        # Se há motivo, pode ser registrado em um log ou campo adicional
        if self.motivo:
            # Aqui você pode implementar um sistema de log se necessário
            pass
        
        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': _('Rota Reagendada'),
                'message': _('A rota "%s" foi reagendada para %s.' % (
                    self.rota_id.name, 
                    self.nova_data.strftime('%d/%m/%Y')
                )),
                'type': 'success',
            }
        }

    def action_cancel(self):
        """Cancela o wizard"""
        return {'type': 'ir.actions.act_window_close'}
