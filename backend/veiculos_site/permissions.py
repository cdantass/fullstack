from rest_framework.permissions import BasePermission
from rolepermissions.checkers import has_role

class IsGestor(BasePermission):
    
    def has_permission(self, request, view):
        return request.user.has_role('Gestores')
    
    