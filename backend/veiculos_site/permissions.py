from rest_framework.permissions import BasePermission

class IsGestor(BasePermission):
    def has_permission(self, request, view):
        # Superusuários podem tudo
        if request.user and request.user.is_superuser:
            return True
        
        # Gestores podem acessar
        return request.user.groups.filter(name="Gestores").exists()
