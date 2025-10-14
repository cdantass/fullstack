from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils import timezone
from django.utils.html import format_html
from .models import Veiculo, Motorista, Municipio, Chamado, Parada

class VeiculoAdmin(admin.ModelAdmin):
    list_display = ('placa', 'modelo', 'ano', 'status')
    list_filter = ('status', 'ano')
    search_fields = ('placa', 'modelo')

class MotoristaAdmin(admin.ModelAdmin):
    list_display = ('nome_motorista', 'status')
    list_filter = ('status',)
    search_fields = ('nome_motorista',)

class MunicipioAdmin(admin.ModelAdmin):
    search_fields = ('nome',)

class ParadaInline(admin.TabularInline):
    model = Parada
    extra = 1
    fields = ('local',)

class ParadaAdmin(admin.ModelAdmin):
    list_display = ('id', 'chamado', 'local')

class ChamadoAdmin(admin.ModelAdmin):
    inlines = [ParadaInline]
    list_display = ('id', 'solicitante_id', 'data_saida', 'itinerario', 'municipio', 'status_colorido', 'autorizador_id')
    list_filter = ('status', 'data_saida', 'municipio')
    autocomplete_fields = ['municipio', 'veiculo_designado', 'motorista_designado']
    search_fields = ('id', 'solicitante__username', 'passageiro1', 'paradas__local')

    @admin.display(description='Status')
    def status_colorido(self, obj):
        cores = {
            'pendente': 'warning',
            'aprovado': 'success',
            'em_andamento': 'primary',
            'concluido': 'secondary',
            'recusado': 'danger',
        }
        cor = cores.get(obj.status, 'light')
        return format_html(
            f'<span class="badge bg-{cor} text-dark">{obj.get_status_display()}</span>'
        )

    @admin.display(description='Origem / Destino')
    def itinerario(self, obj):
        paradas = obj.paradas.all()
        if not paradas.exists():
            return "Nenhuma parada definida"
        partida = paradas.first().local
        destino = paradas.last().local if paradas.count() > 1 else partida
        return f"{partida} → {destino}"

    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.solicitante_id = request.user
        
        if change and 'status' in form.changed_data and request.user.groups.filter(name='Gestor').exists():
            obj.autorizador_id = request.user
            obj.data_autorizacao = timezone.now()
            
        super().save_model(request, obj, form, change)

admin.site.register(Veiculo, VeiculoAdmin)
admin.site.register(Motorista, MotoristaAdmin)
admin.site.register(Municipio, MunicipioAdmin)
admin.site.register(Chamado, ChamadoAdmin)
admin.site.register(Parada, ParadaAdmin)