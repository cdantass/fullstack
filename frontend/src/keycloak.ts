import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'http://localhost:8080/',
  realm: 'sefaz-realm',
  clientId: 'sefaz-frontend',
});

export default keycloak;