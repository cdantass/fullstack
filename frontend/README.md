# Sefaz Veículos - Frontend

Sistema de gerenciamento e reserva de veículos da SEFAZ, desenvolvido com tecnologias modernas de desenvolvimento web.

## Tecnologias

Este projeto utiliza:

- **React 19** - Biblioteca para interfaces de usuário.
- **Vite** - Build tool rápida e moderna.
- **TypeScript** - Superconjunto de JavaScript com tipagem estática.
- **Tailwind CSS 4** - Framework de estilização utilitário.
- **shadcn/ui** - Componentes de UI reutilizáveis e acessíveis.
- **React Router 7** - Gerenciamento de rotas.
- **Axios** - Cliente HTTP para chamadas à API.
- **Lucide React** - Conjunto de ícones.

## Estrutura do Projeto e Funcionalidades

Para detalhes sobre a arquitetura e organização de pastas, consulte [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).

Para uma lista detalhada das funcionalidades da aplicação, consulte [docs/FEATURES.md](./docs/FEATURES.md).

## Configuração e Instalação

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

Para rodar o projeto em modo de desenvolvimento:

```bash
npm run dev
```

O servidor iniciará em `http://localhost:5173`.

## Build

Para gerar a versão de produção:

```bash
npm run build
```

Os arquivos otimizados serão gerados na pasta `dist/`.

## Licença

Este projeto é de uso interno da SEFAZ.
