from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.settings import api_settings
import jwt

class KeycloakJWTAuthentication(JWTAuthentication):
    def get_validated_token(self, raw_token):
        try:
            return jwt.decode(
                raw_token,
                options={"verify_signature": False},
                algorithms=["RS256"],
                audience="sefaz-frontend",
                issuer="http://localhost:8080/realms/sefaz-realm"
            )
        except jwt.PyJWTError as e:
            raise InvalidToken(f"Token inválido: {str(e)}")
