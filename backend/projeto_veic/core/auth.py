from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from keycloak import KeycloakOpenID
from django.conf import settings

class KeycloakAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return None

        token = auth_header.split(" ")[1]

        keycloak_openid = KeycloakOpenID(
            server_url=settings.KEYCLOAK_SERVER_URL,
            client_id=settings.KEYCLOAK_CLIENT_ID,
            realm_name=settings.KEYCLOAK_REALM,
            client_secret_key=settings.KEYCLOAK_CLIENT_SECRET,
            verify=True
        )

        try:
            userinfo = keycloak_openid.userinfo(token)
            return (userinfo, None)
        except Exception:
            raise AuthenticationFailed("Token inválido.")
