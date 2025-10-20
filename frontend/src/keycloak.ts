import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'http://localhost/keycloak/',
  realm: 'sefaz-realm',
  clientId: 'sefaz-frontend',
});

export default keycloak;