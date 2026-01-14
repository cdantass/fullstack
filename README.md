# Sefaz Veículos

Sistema de gerenciamento e reserva de veículos da SEFAZ, composto por um backend em Django e um frontend em React.

## Estrutura do Repositório

- `backend/`: API desenvolvida em Python + Django.
- `frontend/`: Aplicação web desenvolvida em React + Vite.
- `docs/`: Documentação detalhada do sistema.

## Documentação

Para detalhes sobre o funcionamento do sistema, consulte os documentos abaixo:

- [Arquitetura do Frontend](./docs/ARCHITECTURE.md)
- [Funcionalidades da Aplicação](./docs/FEATURES.md)

## Configuração e Instalação (Frontend + Backend)

Para configurar o frontend, siga os passos abaixo:

### Pré-requisitos
- Python(3.12.9) + Django
- Node.js (versão 18 ou superior)
- npm ou yarn


### Instalação
1. Instale o venv (python -m venv venv)

2. Ativar o venv
A) Apertar CTRL + SHIFT + P
B) Python Select Interpreter
C) Enter interpreter path...
D)   Find...
E) Pasta criada\venv\Scripts e aqui encontramos o "python" e clicamos nele
F) Abrir outro terminal

1. Clone o repositório:

   ```bash
   git clone -b recesso https://github.com/cdantass/fullstack.git
   ```

2. Entre no diretório do backend:

   ```bash
   cd fullstack
   cd backend
   ```

3. Instale as dependências:
   ```bash
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

O servidor iniciará em `http://127.0.0.1:8000/`.

## Desenvolvimento

Para rodar o frontend em modo de desenvolvimento:
Deixamos um terminal do backend rodando e abrimos outro terminal.

```bash
cd frontend
npm install
npm run dev
```

O servidor iniciará em `http://localhost:5173`.

## Funcionalides

Conseguimos acessar o painel de admin com:
```bash
python manage.py admin
```

Dentro do admin conseguimos criar um usuário e definir se é um gestor, adicionando esse usuário desejado para o grupo "GESTORES"


Para acessar a documentação da API, digitamos: 
```bash
http://127.0.0.1:8000/api/docs/
```

## Licença

Este projeto é de uso interno da SEFAZ.
