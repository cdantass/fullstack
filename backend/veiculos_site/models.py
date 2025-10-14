from django.db import models
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from datetime import datetime
from django.db.models import Q
from django.utils import timezone
User = get_user_model()

class Veiculo(models.Model):
    placa = models.CharField(max_length=10, unique=True, verbose_name="Placa")
    modelo = models.CharField(max_length=50, verbose_name="Modelo")
    ano = models.IntegerField( verbose_name="Ano", default= 2025)
    
    STATUS_CHOICES = [
        ('disponivel', 'Disponível'),
        ('em_uso', 'Em Uso'),
        ('em_manutencao', 'Em Manutenção'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='disponivel', verbose_name="Status")

    def __str__(self):
        return f"{self.placa} - {self.modelo}"

class Motorista(models.Model):
    nome_motorista = models.CharField(max_length=150, verbose_name="Nome do Motorista")

    STATUS_CHOICES = [
        ('disponivel', 'Disponível'),
        ('em_viagem', 'Em Viagem'),
        ('de_folga', 'De Folga'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='disponivel', verbose_name="Status")

    def __str__(self):
        return self.nome_motorista
    
class Municipio(models.Model):
    nome = models.CharField(max_length=100, unique=True)
    estado = models.CharField(max_length=2, default='SE')

    def __str__(self):
        return self.nome
    
    
class Parada(models.Model):
    chamado = models.ForeignKey('Chamado', on_delete=models.CASCADE, related_name="paradas")
    local = models.CharField(max_length=200, verbose_name="Local da Parada")

    def __str__(self):
        return self.local

class Chamado(models.Model):
    solicitante_id = models.CharField(max_length=255) 
    autorizador_id = models.CharField(max_length=255, null=True, blank=True)
    motorista_designado = models.ForeignKey(Motorista, on_delete=models.SET_NULL, null=True, blank=True)
    veiculo_designado = models.ForeignKey(Veiculo, on_delete=models.SET_NULL, null=True, blank=True)

    data_saida = models.DateField()
    horario_saida = models.TimeField()
    data_retorno = models.DateField()
    horario_retorno = models.TimeField()
    passageiro1 = models.CharField(max_length=150)
    passageiro2 = models.CharField(max_length=150, blank=True)
    passageiro3 = models.CharField(max_length=150, blank=True)
    passageiro4 = models.CharField(max_length=150, blank=True)
    municipio = models.ForeignKey(Municipio, on_delete=models.SET_NULL, null=True, blank=True)
    observacao = models.TextField(blank=True)
    
    STATUS_CHOICES = [
        ('pendente', 'Pendente'),
        ('aprovado', 'Aprovado'),
        ('em_andamento', 'Em Andamento'),
        ('concluido', 'Concluído'),
        ('recusado', 'Recusado'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pendente')
    data_criacao = models.DateTimeField(auto_now_add=True)
    
    observacao_autorizador = models.TextField(blank=True)
    data_autorizacao = models.DateTimeField(null=True, blank=True)

    def clean(self):
        if self.status == 'aprovado' and self.motorista_designado and self.veiculo_designado:
            inicio_chamado = timezone.make_aware(datetime.combine(self.data_saida, self.horario_saida))
            fim_chamado = timezone.make_aware(datetime.combine(self.data_retorno, self.horario_retorno))

            conflitos_motorista = Chamado.objects.filter(
                motorista_designado=self.motorista_designado,
                status__in=['aprovado', 'em_andamento'],
            ).exclude(pk=self.pk).filter(
                data_saida__lte=self.data_retorno,
                data_retorno__gte=self.data_saida
            ).filter(
                Q(horario_saida__lt=self.horario_retorno, horario_retorno__gt=self.horario_saida)
            )

            if conflitos_motorista.exists():
                raise ValidationError(f"Conflito de agendamento: O motorista {self.motorista_designado} já está ocupado neste horário.")

            conflitos_veiculo = Chamado.objects.filter(
                veiculo_designado=self.veiculo_designado,
                status__in=['aprovado', 'em_andamento'],
            ).exclude(pk=self.pk).filter(
                data_saida__lte=self.data_retorno,
                data_retorno__gte=self.data_saida
            ).filter(
                Q(horario_saida__lt=self.horario_retorno, horario_retorno__gt=self.horario_saida)
            )

            if conflitos_veiculo.exists():
                raise ValidationError(f"Conflito de agendamento: O veículo {self.veiculo_designado} já está ocupado neste horário.")

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        if not is_new:
            status_antigo = Chamado.objects.get(pk=self.pk).status
        else:
            status_antigo = None
            
        self.full_clean()
        super().save(*args, **kwargs)
        
        if self.status != status_antigo and self.motorista_designado and self.veiculo_designado:
            if self.status in ['aprovado', 'em_andamento']:
                self.motorista_designado.status = 'em_viagem'
                self.veiculo_designado.status = 'em_uso'
            elif self.status in ['concluido', 'recusado']:
                self.motorista_designado.status = 'disponivel'
                self.veiculo_designado.status = 'disponivel'
            self.motorista_designado.save()
            self.veiculo_designado.save()
    
    def __str__(self):
        return f"Chamado de {self.solicitante_id.username} em {self.data_saida}"