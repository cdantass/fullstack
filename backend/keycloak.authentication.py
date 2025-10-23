import os
import jwt
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken

class KeycloakJWTAuthentication(JWTAuthentication):
    def get_validated_token(self, raw_token):
        audience = os.getenv("KEYCLOAK_BACKEND_CLIENT_ID", "sefaz-backend")
        issuer = os.getenv("KEYCLOAK_EXPECTED_ISS", "http://keycloak:8080/realms/sefaz-realm")

        try:
            decoded = jwt.decode(
                raw_token,
                options={"verify_signature": False},  # ⚠️ Em produção, mude para True e use a chave pública
                algorithms=["RS256"],
                audience=audience,
                issuer=issuer
            )

            aud = decoded.get("aud")
            if isinstance(aud, list):
                if audience not in aud:
                    raise InvalidToken(f"Audience inválida: {aud}")
            elif aud != audience:
                raise InvalidToken(f"Audience inválida: {aud}")

            return decoded

        except jwt.ExpiredSignatureError:
            raise InvalidToken("Token expirado")
        except jwt.InvalidAudienceError:
            raise InvalidToken("Audience inválida no token")
        except jwt.InvalidIssuerError:
            raise InvalidToken("Issuer inválido no token")
        except jwt.PyJWTError as e:
            raise InvalidToken(f"Token inválido: {str(e)}")
