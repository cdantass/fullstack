import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ReactKeycloakProvider } from '@react-keycloak/web';
import keycloak from './keycloak';
import { AuthProvider } from './pages/context/AdminContext';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Elemento root não encontrado!");
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={{
        onLoad: 'login-required',
        checkLoginIframe: false,
        pkceMethod: 'S256',
      }}
      onEvent={(event, error) => {
        if (event === 'onReady') console.log('🔄 Keycloak pronto');
        if (event === 'onAuthSuccess') console.log('✅ Autenticado com sucesso');
        if (event === 'onAuthError') console.error('❌ Erro na autenticação', error);
      }}
    >
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </ReactKeycloakProvider>
  </React.StrictMode>
);
