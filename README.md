# Sefaz Veículos

Sistema de gerenciamento e reserva de veículos da SEFAZ, composto por um backend em Django e um frontend em React.

## Estrutura do Repositório

- `backend/`: API desenvolvida em Django.
- `frontend/`: Aplicação web desenvolvida em React + Vite.
- `docs/`: Documentação detalhada do sistema.

## Documentação

Para detalhes sobre o funcionamento do sistema, consulte os documentos abaixo:

- [Arquitetura do Frontend](./docs/ARCHITECTURE.md)
- [Funcionalidades da Aplicação](./docs/FEATURES.md)

## Configuração e Instalação (Frontend)

Para configurar o frontend, siga os passos abaixo:

### Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn

### Instalação

1. Clone o repositório:

   ```bash
   git clone <link-do-repositorio>
   ```

2. Entre no diretório do frontend:

   ```bash
   cd frontend
   ```

3. Instale as dependências:
   ```bash
   npm install
   ```

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz da pasta `frontend` seguindo o modelo abaixo:

```env
VITE_API_URL=http://localhost:8000
```

## Desenvolvimento

Para rodar o frontend em modo de desenvolvimento:

```bash
cd frontend
npm run dev
```

O servidor iniciará em `http://localhost:5173`.

## Licença

Este projeto é de uso interno da SEFAZ.
