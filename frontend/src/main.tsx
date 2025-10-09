import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ReactKeycloakProvider } from '@react-keycloak/web';
import App from './App';
import keycloak from './keycloak';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <ReactKeycloakProvider
    authClient={keycloak}
    initOptions={{ onLoad: 'check-sso', flow: 'standard' }}
  >
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  </ReactKeycloakProvider>
);