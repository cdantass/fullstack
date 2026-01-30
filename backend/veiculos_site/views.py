from datetime import datetime, timedelta
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import generics, viewsets, status, exceptions
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Veiculo, Motorista, Chamado, Municipio, Parada, Avaliacao
from .serializers import (
    CreateUserSerializer,
    VeiculoSerializer,
    MotoristaSerializer,
    MunicipioSerializer,
    ChamadoSerializer,
    ChamadoCreateSerializer,
    ChamadoGestorSerializer,
    UserProfileSerializer,
    AvaliacaoSerializer
)

User = get_user_model()

class UserProfileView(generics.RetrieveAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [AllowAny]

    def get_object(self):
        return self.request.user


class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = CreateUserSerializer
    permission_classes = [AllowAny]


class VeiculoViewSet(viewsets.ModelViewSet):
    queryset = Veiculo.objects.all()
    serializer_class = VeiculoSerializer
    permission_classes = [AllowAny]


class MotoristaViewSet(viewsets.ModelViewSet):
    queryset = Motorista.objects.all()
    serializer_class = MotoristaSerializer
    permission_classes = [AllowAny]


class ChamadoViewSet(viewsets.ModelViewSet):

    def get_permissions(self):
        self.permission_classes = [AllowAny]
        return super().get_permissions()

    def get_queryset(self):
        user = self.request.user

        if user.is_superuser or user.groups.filter(name="Gestores").exists():
            return Chamado.objects.all().order_by('-data_criacao')

        return Chamado.objects.filter(
            solicitante=user
        ).order_by('-data_criacao')

    def get_serializer_class(self):
        user = self.request.user

        if self.action == 'create':
            return ChamadoCreateSerializer

        if self.action in ['update', 'partial_update']:
            return ChamadoGestorSerializer

        if user.is_superuser or user.groups.filter(name="Gestores").exists():
            return ChamadoGestorSerializer

        return ChamadoSerializer

    def perform_create(self, serializer):
        serializer.save(solicitante=self.request.user)

    def perform_update(self, serializer):
        status_novo = self.request.data.get('status')
        user = self.request.user
        
        # Rule: Only cancel up to 30 min before (except for admins/gestores)
        if status_novo == 'cancelado' and not (user.is_superuser or user.groups.filter(name="Gestores").exists()):
            instance = self.get_object()
            
            # Combine data_saida and horario_saida
            departure_datetime = timezone.make_aware(datetime.combine(instance.data_saida, instance.horario_saida))
            now = timezone.now()
            
            if departure_datetime - now < timedelta(minutes=30):
                raise exceptions.ValidationError({"detail": "Não é possível cancelar uma reserva com menos de 30 minutos de antecedência."})

        extra_fields = {}
        
        if status_novo == 'aprovado':
            extra_fields['autorizador'] = self.request.user
            extra_fields['data_autorizacao'] = timezone.now()
        elif status_novo == 'concluido':
            extra_fields['concluidor'] = self.request.user
            extra_fields['data_conclusao'] = timezone.now()
        elif status_novo == 'cancelado':
            extra_fields['cancelador'] = self.request.user
            extra_fields['data_cancelamento'] = timezone.now()
            
        instance = serializer.save(**extra_fields)

        # Cascata de informações para os filhos (viagens vinculadas)
        from .models import Chamado
        filhos = Chamado.objects.filter(viagem_compartilhada=instance)
        if filhos.exists():
            update_data = {}
            if status_novo in ['aprovado', 'concluido', 'cancelado']:
                update_data['status'] = status_novo
                update_data.update(extra_fields)
            
            # Propagar motorista e veículo se definidos no pai
            if instance.motorista_designado:
                update_data['motorista_designado'] = instance.motorista_designado
            if instance.veiculo_designado:
                update_data['veiculo_designado'] = instance.veiculo_designado
            
            if update_data:
                filhos.update(**update_data)




class MunicipioListView(generics.ListAPIView):
    queryset = Municipio.objects.all().order_by('nome')
    serializer_class = MunicipioSerializer
    permission_classes = [AllowAny]


class MotoristaDisponivelListView(generics.ListAPIView):
    queryset = Motorista.objects.filter(status='disponivel').order_by('nome_motorista')
    serializer_class = MotoristaSerializer
    permission_classes = [AllowAny]


class VeiculoDisponivelListView(generics.ListAPIView):
    queryset = Veiculo.objects.filter(status='disponivel').order_by('placa')
    serializer_class = VeiculoSerializer
    permission_classes = [AllowAny]


class MeusChamadosListView(generics.ListAPIView):
    serializer_class = ChamadoSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Chamado.objects.filter(
            solicitante_id=str(self.request.user.id)
        ).order_by('-data_criacao')


class CombinarChamadosView(APIView):
    """
    Combines multiple chamados into a new shared trip (viagem compartilhada).
    - Creates new parent chamado with status 'viagem_compartilhada'
    - Marks originals as 'combinado' with FK to the new parent
    """
    permission_classes = [AllowAny]

    def post(self, request):
        ids = request.data.get("chamados", [])
        motorista_id = request.data.get("motorista_id")
        veiculo_id = request.data.get("veiculo_id")
        data_saida = request.data.get("data_saida")
        horario_saida = request.data.get("horario_saida")
        data_retorno = request.data.get("data_retorno")
        horario_retorno = request.data.get("horario_retorno")
        observacao = request.data.get("observacao", "")

        if not ids or len(ids) < 2:
            return Response(
                {"detail": "Selecione ao menos dois chamados."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not motorista_id or not veiculo_id:
            return Response(
                {"detail": "Motorista e veículo são obrigatórios."},
                status=status.HTTP_400_BAD_REQUEST
            )

        chamados = Chamado.objects.filter(id__in=ids)

        if chamados.count() != len(ids):
            return Response(
                {"detail": "Algum chamado informado não existe."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Collect all passengers from original chamados
        todos_passageiros = []
        for ch in chamados:
            for p in [ch.passageiro1, ch.passageiro2, ch.passageiro3, ch.passageiro4]:
                if p and p not in todos_passageiros:
                    todos_passageiros.append(p)

        # Collect unique paradas
        todas_paradas = []
        for ch in chamados:
            for p in ch.paradas.all():
                if p.local not in todas_paradas:
                    todas_paradas.append(p.local)

        # Get motorista and veiculo
        try:
            motorista = Motorista.objects.get(id=motorista_id)
            veiculo = Veiculo.objects.get(id=veiculo_id)
        except (Motorista.DoesNotExist, Veiculo.DoesNotExist):
            return Response(
                {"detail": "Motorista ou veículo não encontrado."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Pad passengers to 4 slots
        passageiros_final = (todos_passageiros + ["", "", "", ""])[:4]

        # Create new parent chamado (viagem compartilhada)
        novo_chamado = Chamado.objects.create(
            solicitante=request.user if request.user.is_authenticated else None,
            municipio=chamados.first().municipio,
            data_saida=data_saida,
            horario_saida=horario_saida,
            data_retorno=data_retorno,
            horario_retorno=horario_retorno,
            passageiro1=passageiros_final[0],
            passageiro2=passageiros_final[1],
            passageiro3=passageiros_final[2],
            passageiro4=passageiros_final[3],
            motorista_designado=motorista,
            veiculo_designado=veiculo,
            autorizador=request.user if request.user.is_authenticated else None,
            data_autorizacao=timezone.now(),
            observacao_autorizador=observacao,
            status="viagem_compartilhada"
        )

        # Create paradas for the new chamado
        for local in todas_paradas:
            Parada.objects.create(chamado=novo_chamado, local=local)

        # Mark original chamados as 'combinado' and link to parent
        for ch in chamados:
            ch.status = "combinado"
            ch.viagem_compartilhada = novo_chamado
            ch.autorizador = novo_chamado.autorizador
            ch.data_autorizacao = novo_chamado.data_autorizacao
            ch.motorista_designado = novo_chamado.motorista_designado
            ch.veiculo_designado = novo_chamado.veiculo_designado
            ch.save(update_fields=['status', 'viagem_compartilhada', 'autorizador', 'data_autorizacao', 'motorista_designado', 'veiculo_designado'])

        serializer = ChamadoGestorSerializer(novo_chamado)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class AvaliacaoViewSet(viewsets.ModelViewSet):
    queryset = Avaliacao.objects.all()
    serializer_class = AvaliacaoSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

