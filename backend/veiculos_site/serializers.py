from rest_framework import serializers
from .models import Veiculo, Motorista, Chamado, Municipio, Parada
from django.contrib.auth import get_user_model


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
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

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
    solicitante = serializers.StringRelatedField(read_only=True)
    solicitante_email = serializers.EmailField(source='solicitante.email', read_only=True)
    municipio = serializers.SlugRelatedField(
        queryset=Municipio.objects.all(),
        slug_field='nome',
        required=False,
        allow_null=True
    )
    motorista_designado = serializers.StringRelatedField(read_only=True)
    veiculo_designado = serializers.StringRelatedField(read_only=True)
    autorizador = serializers.StringRelatedField(read_only=True)
    paradas = ParadaSerializer(many=True, required=False)

    class Meta:
        model = Chamado
        fields = [
            'id', 'veiculo_designado', 'solicitante', 'solicitante_email', 'motorista_designado',
            'veiculo_designado', 'data_saida', 'horario_saida', 'data_retorno',
            'horario_retorno', 'passageiro1', 'passageiro2', 'passageiro3',
            'passageiro4', 'municipio', 'observacao', 'status', 'data_criacao', 'autorizador',
            'observacao_autorizador', 'data_autorizacao', 'paradas'
        ]

    def create(self, validated_data):
        paradas_data = validated_data.pop('paradas', [])
        chamado = Chamado.objects.create(**validated_data)
        for parada_data in paradas_data:
            Parada.objects.create(chamado=chamado, **parada_data)
        return chamado

class ChamadoCreateSerializer(serializers.ModelSerializer):
    paradas = ParadaSerializer(many=True, required=False)
    veiculo_designado = serializers.PrimaryKeyRelatedField(
        queryset=Veiculo.objects.all(),
        allow_null=True,
        required=False
    )
    motorista_designado = serializers.PrimaryKeyRelatedField(
        queryset=Motorista.objects.all(),
        allow_null=True,
        required=False
    )
    municipio = serializers.PrimaryKeyRelatedField(
        queryset=Municipio.objects.all(),
        required=False,
        allow_null=True
    )

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
        for parada_data in paradas_data:
            Parada.objects.create(chamado=chamado, **parada_data)
        return chamado    
class ChamadoGestorSerializer(serializers.ModelSerializer):
    solicitante = serializers.StringRelatedField(read_only=True)
    solicitante_email = serializers.EmailField(source='solicitante.email', read_only=True)
    autorizador = serializers.StringRelatedField(read_only=True)
    municipio = serializers.StringRelatedField(read_only=True)
    motorista_designado = MotoristaSerializer(read_only=True)
    veiculo_designado = VeiculoSerializer(read_only=True)
    paradas = ParadaSerializer(many=True, read_only=True)
    
    motorista_id = serializers.PrimaryKeyRelatedField(
        queryset=Motorista.objects.all(), source='motorista_designado', write_only=True, required=False, allow_null=True
    )
    veiculo_id = serializers.PrimaryKeyRelatedField(
        queryset=Veiculo.objects.all(), source='veiculo_designado', write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = Chamado
        fields = [
            'id', 'solicitante', 'solicitante_email', 'data_saida', 'horario_saida',
            'data_retorno', 'horario_retorno', 'passageiro1', 'passageiro2',
            'passageiro3', 'passageiro4', 'municipio', 'observacao', 'status', 'data_criacao',
            'autorizador', 'observacao_autorizador', 'data_autorizacao',
            'motorista_designado', 'veiculo_designado', 'paradas',
            'motorista_id', 'veiculo_id'
        ]
        read_only_fields = ['data_criacao', 'data_autorizacao']


class UserProfileSerializer(serializers.ModelSerializer):
    is_gestor = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_gestor']
        read_only_fields = fields

    def get_is_gestor(self, obj):
        return obj.groups.filter(name='Gestores').exists() or obj.is_superuser