# Arquitetura do Frontend - Sefaz Veículos

Este documento detalha as decisões arquiteturais, a estrutura de pastas e os fluxos principais do frontend. Para uma lista detalhada das funcionalidades do usuário, consulte [docs/FEATURES.md](./FEATURES.md).

## Estrutura de Pastas

Abaixo está uma visão geral da organização do diretório `src/`:

- `assets/`: Arquivos estáticos como imagens e SVGs.
- `components/`: Componentes React reutilizáveis.
  - `ui/`: Componentes base (botões, inputs, etc.) baseados no shadcn/ui.
  - `MainLayout.tsx`: Layout principal que envolve as páginas protegidas.
- `context/`: Provedores de contexto para gerenciamento de estado global.
  - `AdminContext.tsx`: Gerencia o estado de autenticação e informações do administrador.
  - `ReservaContext.tsx`: Gerencia o estado relacionado às reservas.
- `hooks/`: Hooks personalizados para lógica reutilizável.
- `lib/`: Configurações de bibliotecas externas (ex: `utils.ts` para Tailwind Merge).
- `pages/`: Componentes de página que correspondem às rotas da aplicação.
- `api.ts`: Configuração do Axios e interceptadores para comunicação com o backend.
- `App.tsx`: Ponto de entrada que define as rotas e os provedores de contexto.
- `main.tsx`: Ponto de entrada do React que renderiza o componente `App`.

## Autenticação

O sistema utiliza Keycloak para autenticação (em transição/configuração) e armazenamento de tokens JWT no `localStorage`.

- **Intercepção de Requisições**: O arquivo `src/api.ts` contém um interceptador que anexa automaticamente o `access_token` ao cabeçalho `Authorization` de todas as requisições API, se o token estiver presente.
- **Rotas Protegidas**: O componente `ProtectedRoute` é usado para envolver rotas que exigem autenticação.
- **Rotas de Admin**: O componente `AdminRoute` restringe o acesso a funcionalidades administrativas.

## Integração com API

Toda a comunicação com o backend é feita através de uma instância centralizada do Axios em `src/api.ts`.

- **Base URL**: Definida através da variável de ambiente `VITE_API_URL`.
- **Credenciais**: A configuração `withCredentials: true` é usada para lidar com cookies, se necessário.

## Temas e Estilização

- **Tailwind CSS**: Usado para toda a estilização baseada em utilitários.
- **Dark Mode**: Implementado via `ThemeProvider` e classes `dark:` do Tailwind. O estado do tema é persistido no `localStorage`.
- **Componentes UI**: Utilizamos o shadcn/ui, que fornece componentes acessíveis e facilmente personalizáveis.

## Fluxos de Dados

1. **Reservas**: O usuário preenche o formulário em `ReservaPage`, os dados são enviados via Contexto/API e a lista é atualizada em `ConsultarReservaPage`.
2. **Autorização**: Administradores acessam `AutorizarPage` para aprovar ou rejeitar solicitações pendentes.
