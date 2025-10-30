from rest_framework.authentication import BaseAuthentication  
from keycloak_oidc import KeycloakOIDC  
  
class KeycloakAuthentication(BaseAuthentication):  
    def authenticate(self, request):  
        # Your authentication logic here using python-keycloak  
        # Example:  
        token = request.META.get('HTTP_AUTHORIZATION', '').split('Bearer ')[-1]  
        keycloak = KeycloakOIDC(server_url='http://keycloak-server/auth',  
                               client_id='your-client-id',  
                               realm_name='your-realm')  
          
        user_info = keycloak.decode_token(token)  
          
        # Create or retrieve Django user based on user_info  
        # Example:  
        user, created = User.objects.get_or_create(username=user_info['preferred_username'])  
          
        return user, None