from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import generics, status, viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from drf_keycloak_auth.permissions import HasRole 

from .models import Veiculo, Motorista, Chamado, Municipio, Parada
from .serializers import (
    CreateUserSerializer,
    VeiculoSerializer,
    MotoristaSerializer,
    MunicipioSerializer,
    ChamadoSerializer,
    ChamadoCreateSerializer,
    ChamadoGestorSerializer,
    UserProfileSerializer
)
from .permissions import IsGestor

User = get_user_model()

class UserProfileView(generics.RetrieveAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = CreateUserSerializer
    permission_classes = [AllowAny]


class VeiculoViewSet(viewsets.ModelViewSet):
    queryset = Veiculo.objects.all()
    serializer_class = VeiculoSerializer
    permission_classes = [IsAuthenticated]


class MotoristaViewSet(viewsets.ModelViewSet):
    queryset = Motorista.objects.all()
    serializer_class = MotoristaSerializer
    permission_classes = [IsAuthenticated]


class ChamadoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerir os Chamados com lógica de permissão baseada em roles do Keycloak.
    """
    
    def get_permissions(self):
        """
        Define as permissões com base na ação que está a ser executada.
        """
        if self.action in ['update', 'partial_update', 'destroy']:
            self.permission_classes = [IsAuthenticated, HasRole.from_keycloak('access-gestor')]
        
        else:
            self.permission_classes = [IsAuthenticated]
        
        return super().get_permissions()

    def get_queryset(self):
        """
        Filtra a lista de chamados com base no role do utilizador.
        """
        user = self.request.user

        if user.has_role('access-gestor'):
            return Chamado.objects.all().order_by('-data_criacao')
        
        return Chamado.objects.filter(solicitante_id=user.sub).order_by('-data_criacao')

    def get_serializer_class(self):
        """
        Seleciona o serializer apropriado com base na ação e no role do utilizador.
        """
        user = self.request.user

        if self.action == 'create':
            return ChamadoCreateSerializer
        
        if self.action in ['update', 'partial_update']:
            return ChamadoGestorSerializer
        
        if user.has_role('access-gestor'):
            return ChamadoGestorSerializer
        
        return ChamadoSerializer

    def perform_create(self, serializer):
        """
        Ao criar um chamado, associa automaticamente o ID do utilizador do Keycloak.
        """
        # SALVA o ID do Keycloak (user.sub) em vez do objeto user.
        serializer.save(solicitante_id=self.request.user.sub)

    def perform_update(self, serializer):
        """
        Ao atualizar um chamado, regista quem foi o gestor que autorizou e a data.
        """
        serializer.save(
            autorizador_id=self.request.user.sub,
            data_autorizacao=timezone.now()
        )

class MunicipioListView(generics.ListAPIView):
    queryset = Municipio.objects.all().order_by('nome')
    serializer_class = MunicipioSerializer
    permission_classes = [IsAuthenticated]


class MotoristaDisponivelListView(generics.ListAPIView):
    queryset = Motorista.objects.filter(status='disponivel').order_by('nome_motorista')
    serializer_class = MotoristaSerializer
    permission_classes = [IsAuthenticated]


class VeiculoDisponivelListView(generics.ListAPIView):
    queryset = Veiculo.objects.filter(status='disponivel').order_by('placa')
    serializer_class = VeiculoSerializer
    permission_classes = [IsAuthenticated]


class MeusChamadosListView(generics.ListAPIView):
    serializer_class = ChamadoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Chamado.objects.filter(solicitante=self.request.user).order_by('-data_criacao')