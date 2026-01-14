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

## Configuração e Instalação (Frontend + Backend)

Para configurar o frontend, siga os passos abaixo:

### Pré-requisitos
- Python + Django
- Node.js (versão 18 ou superior)
- npm ou yarn


### Instalação
1. Instale o venv (python -m venv venv)

2. Ativar o venv
a) Apertar CTRL + SHIFT + P
b) 

1. Clone o repositório:

   ```bash
   git clone <link-do-repositorio>
   ```

2. Entre no diretório do backend:

   ```bash
   cd fullstack
   cd backend
   ```

3. Instale as dependências:
   ```bash
   pip install django
   pip install celery
   pip install dotenv
   pip install django-jazzmin
   pip install -r requirements.txt
   ```
4. Faça as migrações:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

## Desenvolvimento

Para rodar o backend em modo de desenvolvimento:

```bash
python manage.py runserver
```

O servidor iniciará em `http://`.

## Desenvolvimento

Para rodar o frontend em modo de desenvolvimento:

```bash
cd frontend
npm run dev
```

O servidor iniciará em `http://localhost:5173`.

## Licença

Este projeto é de uso interno da SEFAZ.
