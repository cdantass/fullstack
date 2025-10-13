# veiculos_site/tests/test_api.py

import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User, Group
from django.core.exceptions import ValidationError
from model_bakery import baker
from veiculos_site.models import Chamado, Motorista, Veiculo

@pytest.mark.django_db
def test_meus_chamados_unauthenticated():
    """
    Verifica se um utilizador não autenticado recebe um erro 403 (Forbidden)
    ao tentar aceder a um endpoint protegido.
    """
    client = APIClient()
    response = client.get('/api/meus-chamados/')
    assert response.status_code == 403

@pytest.mark.django_db
def test_meus_chamados_user_sees_only_own_chamados():
    """
    Verifica se um utilizador autenticado vê apenas os seus próprios chamados.
    """
    # 1. Preparação (Arrange)
    user1 = baker.make(User)
    user2 = baker.make(User)
    
    chamado_user1 = baker.make(Chamado, solicitante=user1)
    baker.make(Chamado, solicitante=user2)

    client = APIClient()

    # 2. Ação (Act)
    client.force_authenticate(user=user1)
    response = client.get('/api/meus-chamados/')

    # 3. Verificação (Assert)
    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0]['id'] == chamado_user1.id

@pytest.mark.django_db
def test_aprovar_chamado_com_conflito_de_horario_falha():
    """
    Verifica se a API levanta um ValidationError ao tentar aprovar um chamado
    que conflita com o horário de outro.
    """
    # 1. Preparação (Arrange)
    gestor_group, _ = Group.objects.get_or_create(name='Gestores')
    gestor = baker.make(User)
    gestor.groups.add(gestor_group)
    
    solicitante = baker.make(User)
    motorista = baker.make(Motorista)
    veiculo = baker.make(Veiculo)

    # Chamado já existente e aprovado
    baker.make(
        Chamado,
        solicitante=solicitante,
        motorista_designado=motorista,
        veiculo_designado=veiculo,
        status='aprovado',
        data_saida='2025-09-20',
        horario_saida='09:00:00',
        data_retorno='2025-09-20',
        horario_retorno='11:00:00'
    )

    # Novo chamado pendente com horário conflituante
    chamado_conflituante = baker.make(
        Chamado,
        solicitante=solicitante,
        status='pendente',
        data_saida='2025-09-20',
        horario_saida='10:00:00',
        data_retorno='2025-09-20',
        horario_retorno='12:00:00'
    )

    client = APIClient()
    client.force_authenticate(user=gestor)
    url = f'/chamados/{chamado_conflituante.id}/'
    data_aprovacao = {
        'status': 'aprovado',
        'motorista_id': motorista.id,
        'veiculo_id': veiculo.id
    }

    # 2. Ação (Act) e Verificação (Assert) combinadas
    with pytest.raises(ValidationError) as excinfo:
        client.patch(url, data_aprovacao)

    # 3. Verificação Opcional: Verificamos se a mensagem de erro está correta
    assert 'Conflito de agendamento' in str(excinfo.value)