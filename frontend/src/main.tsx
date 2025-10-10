import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ReactKeycloakProvider } from '@react-keycloak/web';
import App from './App';
import keycloak from './keycloak';

import { AuthProvider } from './pages/context/AdminContext';

import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ReactKeycloakProvider
        authClient={keycloak}
        initOptions={{ onLoad: 'check-sso', flow: 'standard' }}
      >
        <AuthProvider>
          <App />
        </AuthProvider>
      </ReactKeycloakProvider>
    </BrowserRouter>
  </React.StrictMode>
);