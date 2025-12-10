from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import generics, viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
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
            solicitante_id=str(user.id)
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
        serializer.save(solicitante_id=str(self.request.user.id))

    def perform_update(self, serializer):
        serializer.save(
            autorizador_id=str(self.request.user.id),
            data_autorizacao=timezone.now()
        )


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


class MesclarChamadosView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        ids = request.data.get("chamados", [])

        if not ids or len(ids) < 2:
            return Response(
                {"detail": "Selecione ao menos dois chamados."},
                status=status.HTTP_400_BAD_REQUEST
            )

        chamados = Chamado.objects.filter(id__in=ids)

        if chamados.count() != len(ids):
            return Response(
                {"detail": "Algum chamado informado não existe."},
                status=status.HTTP_400_BAD_REQUEST
            )

        todos_passageiros = []

        for ch in chamados:
            for p in [
                ch.passageiro1,
                ch.passageiro2,
                ch.passageiro3,
                ch.passageiro4
            ]:
                if p:
                    todos_passageiros.append(p)

        if len(todos_passageiros) > 4:
            return Response(
                {"detail": "A junção ultrapassa o limite de passageiros (4)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        menor_saida = min(ch.data_saida for ch in chamados)
        maior_retorno = max(ch.data_retorno for ch in chamados)

        chosen_saida = menor_saida
        chosen_retorno = maior_retorno

        todas_paradas = []
        for ch in chamados:
            for p in ch.paradas.all():
                todas_paradas.append(p.local)

        paradas_unicas = list(dict.fromkeys(todas_paradas))

        novo_chamado = Chamado.objects.create(
            solicitante_id=str(request.user.id),
            municipio=chamados.first().municipio,
            data_saida=chosen_saida,
            horario_saida=chamados.first().horario_saida,
            data_retorno=chosen_retorno,
            horario_retorno=chamados.first().horario_retorno,
            autorizador_id=str(request.user.id),
            data_autorizacao=timezone.now(),
            status="pendente"
        )
        passageiros_final = todos_passageiros + [None, None, None, None]
        passageiros_final = passageiros_final[:4]

        novo_chamado.passageiro1 = passageiros_final[0]
        novo_chamado.passageiro2 = passageiros_final[1]
        novo_chamado.passageiro3 = passageiros_final[2]
        novo_chamado.passageiro4 = passageiros_final[3]
        novo_chamado.save()

        for local in paradas_unicas:
            Parada.objects.create(chamado=novo_chamado, local=local)

        serializer = ChamadoGestorSerializer(novo_chamado)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
