import { useKeycloak } from '@react-keycloak/web';
import { Navigate } from 'react-router-dom';

function LoginPage() {
  const { keycloak } = useKeycloak();

  if (keycloak.authenticated) {
    return <Navigate to="/" />;
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>Sistema de Gestão de Frota</h1>
      <p>Você precisa de se autenticar para aceder ao sistema.</p>
      <button
        style={{ padding: '15px 30px', fontSize: '18px', cursor: 'pointer' }}
        onClick={() => keycloak.login()}
      >
        Fazer Login
      </button>
    </div>
  );
}

export default LoginPage;