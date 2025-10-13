from rest_framework import permissions
class IsGestor(permissions.BasePermission):
    """
    Permissão customizada para permitir acesso apenas a usuários do grupo 'Gestor'.
    """
    def has_permission(self, request, view):
        return request.user and request.user.groups.filter(name='Gestor').exists()