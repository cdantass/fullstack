from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import Veiculo, Motorista, Chamado, Municipio, Parada

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']


class CreateUserSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password')
        extra_kwargs = {'password': {'write_only': True}}

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Um utilizador com este email já existe.")
        return value

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )

class VeiculoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Veiculo
        fields = ['id', 'placa', 'modelo', 'ano', 'status']


class MotoristaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Motorista
        fields = ['id', 'nome_motorista', 'status']


class MunicipioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Municipio
        fields = ['id', 'nome']


class ParadaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Parada
        fields = ['local']

class ChamadoSerializer(serializers.ModelSerializer):
    solicitante_nome = serializers.SerializerMethodField()
    autorizador_nome = serializers.SerializerMethodField()

    municipio = serializers.CharField(source='municipio.nome', read_only=True)
    motorista_designado = serializers.StringRelatedField(read_only=True)
    veiculo_designado = serializers.StringRelatedField(read_only=True)
    paradas = ParadaSerializer(many=True, read_only=True)

    class Meta:
        model = Chamado
        fields = [
            'id', 'veiculo_designado', 'solicitante', 'solicitante_nome',
            'motorista_designado', 'data_saida', 'horario_saida', 'data_retorno',
            'horario_retorno', 'passageiro1', 'passageiro2', 'passageiro3',
            'passageiro4', 'municipio', 'observacao', 'status', 'data_criacao',
            'autorizador', 'autorizador_nome', 'observacao_autorizador', 'data_autorizacao',
            'paradas'
        ]
        read_only_fields = ['solicitante', 'autorizador']

    def get_solicitante_nome(self, obj):
        if obj.solicitante:
            return obj.solicitante.username
        return None

    def get_autorizador_nome(self, obj):
        if obj.autorizador:
            return obj.autorizador.username
        return None



class ChamadoCreateSerializer(serializers.ModelSerializer):
    paradas = ParadaSerializer(many=True, required=False)

    veiculo_designado = serializers.PrimaryKeyRelatedField(
        queryset=Veiculo.objects.all(),
        required=False,
        allow_null=True
    )
    motorista_designado = serializers.PrimaryKeyRelatedField(
        queryset=Motorista.objects.all(),
        required=False,
        allow_null=True
    )
    municipio = serializers.PrimaryKeyRelatedField(
        queryset=Municipio.objects.all(),
        required=False,
        allow_null=True
    )

    passageiro1 = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    passageiro2 = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    passageiro3 = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    passageiro4 = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Chamado
        fields = [
            'veiculo_designado',
            'motorista_designado',
            'data_saida',
            'horario_saida',
            'data_retorno',
            'horario_retorno',
            'passageiro1',
            'passageiro2',
            'passageiro3',
            'passageiro4',
            'municipio',
            'observacao',
            'paradas'
        ]

    def create(self, validated_data):
        paradas_data = validated_data.pop('paradas', [])
        chamado = Chamado.objects.create(**validated_data)

        for parada in paradas_data:
            Parada.objects.create(chamado=chamado, **parada)

        return chamado


class ChamadoGestorSerializer(serializers.ModelSerializer):
    solicitante_nome = serializers.SerializerMethodField()
    autorizador_nome = serializers.SerializerMethodField()

    municipio = serializers.StringRelatedField(read_only=True)
    motorista_designado = MotoristaSerializer(read_only=True)
    veiculo_designado = VeiculoSerializer(read_only=True)
    paradas = ParadaSerializer(many=True, read_only=True)

    motorista_id = serializers.PrimaryKeyRelatedField(
        queryset=Motorista.objects.all(),
        source='motorista_designado',
        write_only=True,
        allow_null=True,
        required=False
    )
    veiculo_id = serializers.PrimaryKeyRelatedField(
        queryset=Veiculo.objects.all(),
        source='veiculo_designado',
        write_only=True,
        allow_null=True,
        required=False
    )

    passageiro1 = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    passageiro2 = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    passageiro3 = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    passageiro4 = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Chamado
        fields = [
            'id', 'solicitante', 'solicitante_nome', 'data_saida', 'horario_saida',
            'data_retorno', 'horario_retorno', 'passageiro1', 'passageiro2',
            'passageiro3', 'passageiro4', 'municipio', 'observacao', 'status',
            'data_criacao', 'autorizador', 'autorizador_nome', 'observacao_autorizador',
            'data_autorizacao', 'motorista_designado', 'veiculo_designado',
            'paradas', 'motorista_id', 'veiculo_id'
        ]
        read_only_fields = ['solicitante', 'autorizador', 'data_criacao', 'data_autorizacao']

    def get_solicitante_nome(self, obj):
        if obj.solicitante:
            return obj.solicitante.username
        return None

    def get_autorizador_nome(self, obj):
        if obj.autorizador:
            return obj.autorizador.username
        return None


class MergeChamadoSerializer(serializers.Serializer):
    chamados = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False
    )

    motorista_id = serializers.PrimaryKeyRelatedField(
        queryset=Motorista.objects.all(),
        required=True
    )

    veiculo_id = serializers.PrimaryKeyRelatedField(
        queryset=Veiculo.objects.all(),
        required=True
    )

    observacao = serializers.CharField(
        required=False,
        allow_blank=True
    )

    def validate_chamados(self, ids):
        if len(ids) < 2:
            raise serializers.ValidationError("Selecione pelo menos duas viagens para mesclar.")
        if Chamado.objects.filter(id__in=ids).count() != len(ids):
            raise serializers.ValidationError("Um ou mais IDs não existem.")
        return ids

    class Meta:
        fields = ['chamados', 'motorista_id', 'veiculo_id', 'observacao']

class UserProfileSerializer(serializers.ModelSerializer):
    is_gestor = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_gestor', 'is_superuser', 'is_staff']
        read_only_fields = fields

    def get_is_gestor(self, obj):
        return obj.groups.filter(name='Gestores').exists() or obj.is_superuser
