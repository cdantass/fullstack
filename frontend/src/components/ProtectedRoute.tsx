import { useKeycloak } from '@react-keycloak/web';
import { Navigate } from 'react-router-dom';
import React from 'react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { keycloak, initialized } = useKeycloak();

  if (!initialized) {
    return <div>A carregar...</div>;
  }

  return keycloak.authenticated ? <>{children}</> : <Navigate to="/login" />;
}

export default ProtectedRoute;