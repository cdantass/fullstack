from rest_framework.permissions import BasePermission

class IsGestor(BasePermission):

    def has_permission(self, request, view):
        # Se o usuário não estiver autenticado, não tem permissão
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Verifica se o usuário pertence ao grupo "Gestores"
        return request.user.groups.filter(name='Gestores').exists()
