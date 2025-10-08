from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import generics, status, viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

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
    queryset = Chamado.objects.all().order_by('-data_criacao')
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.groups.filter(name='Gestores').exists():
            return Chamado.objects.all().order_by('-data_criacao')
        return Chamado.objects.filter(solicitante=user).order_by('-data_criacao')

    def get_serializer_class(self):
        user = self.request.user
        if self.action == 'create':
            return ChamadoCreateSerializer
        if self.action in ['update', 'partial_update']:
            return ChamadoGestorSerializer
        if user.is_superuser or user.groups.filter(name='Gestores').exists():
            return ChamadoGestorSerializer
        return ChamadoSerializer

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            self.permission_classes = [IsAuthenticated, IsGestor]
        else:
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(solicitante=self.request.user)

    def perform_update(self, serializer):
        serializer.save(autorizador=self.request.user, data_autorizacao=timezone.now())


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