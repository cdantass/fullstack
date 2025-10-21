# keycloak_authentication.py
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.settings import api_settings
import jwt

class KeycloakJWTAuthentication(JWTAuthentication):
    def get_validated_token(self, raw_token):
        try:
            # O issuer precisa bater com seu realm
            return jwt.decode(
                raw_token,
                options={"verify_signature": False},  # para testes — ideal seria verificar com a chave pública do Keycloak
                algorithms=["RS256"],
                audience="sefaz-frontend",  # deve bater com o "aud" do token
                issuer="http://localhost:8080/realms/sefaz-realm"
            )
        except jwt.PyJWTError as e:
            raise InvalidToken(f"Token inválido: {str(e)}")
