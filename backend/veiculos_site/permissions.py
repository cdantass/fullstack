from rest_framework.permissions import BasePermission
from rolepermissions.checkers import has_role

class IsGestor(BasePermission):
    """
    Permissão personalizada que verifica se o utilizador autenticado
    tem o role 'access-gestor' no seu token do Keycloak.
    """
    def has_permission(self, request, view):
        return request.user.has_role('Gestores')