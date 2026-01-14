# Funcionalidades da Aplicação - Sefaz Veículos

Este documento detalha as funcionalidades de cada módulo do sistema de gerenciamento de frota.

## Autenticação e Acesso

- Login de Usuário: Acesso restrito via usuário e senha.
- Controle de Perfil: Diferenciação entre usuários comuns e gestores (administradores).
- Sessão Segura: Uso de tokens JWT armazenados localmente para manter a autenticação.

## Página Inicial (Dashboard)

- Boas-vindas: Mensagem personalizada para o usuário autenticado.
- Resumo de Atividades: Atalhos e informações rápidas sobre o status da frota (em desenvolvimento).

## Reserva de Veículos

- Município de Destino: Seleção da cidade para onde a viagem será realizada.
- Gerenciamento de Paradas: Adição dinâmica de múltiplos locais de parada durante o trajeto.
- Lista de Passageiros: Registro de até 4 passageiros por veículo, com inclusão dinâmica via tags.
- Agendamento: Definição de data e horário tanto para a saída quanto para o retorno.
- Validação Automática: Impedimento de datas de retorno anteriores à data de saída.
- Observações: Campo livre para informações adicionais relevantes à solicitação.

## Consulta de Reservas

- Histórico Pessoal: Usuários comuns visualizam apenas suas solicitações; gestores visualizam todas.
- Monitoramento de Status: Acompanhamento em tempo real (Pendente, Autorizado, Negado, Concluído, Cancelado).
- Busca Avançada: Filtros por nome, motorista, veículo, município, passageiros e datas.
- Exportação de Dados: Possibilidade de baixar a lista de reservas filtrada em formato Excel.
- Detalhes da Reserva: Visualização expandida com todas as informações, incluindo motorista e veículo designados.
- Cancelamento: Opção para o solicitante cancelar uma reserva ainda não concluída.
- Avaliação: Módulo para avaliar a qualidade da viagem após a conclusão.

## Autorização de Reservas (Acesso Gestor)

- Análise de Pendências: Interface centralizada para aprovação ou recusa de solicitações.
- Designação de Recursos: Seleção de motorista e veículo disponíveis no sistema para cada aprovação.
- Combinar Viagens: Funcionalidade para agrupar múltiplas solicitações em uma única "Viagem Compartilhada", otimizando o uso da frota.
- Conclusão de Viagens: Registro final da realização da viagem, liberando o motorista e o veículo para novos serviços.
- Observação do Autorizador: Campo para justificar recusas ou adicionar instruções para o motorista.

## Viagens Compartilhadas

- Otimização de Frota: Permite que várias solicitações com destinos próximos e horários compatíveis utilizem o mesmo veículo.
- Relação Pai-Filho: Uma viagem principal (grupo) gerencia os recursos, enquanto as solicitações vinculadas herdam o status e os recursos designados.
- Visualização em Árvore: Na tabela de consulta, as viagens vinculadas aparecem aninhadas sob a viagem principal.

## Interface e Experiência do Usuário

- Design Responsivo: Interface adaptável para diferentes tamanhos de tela.
- Temas: Suporte a modo claro (Light) e modo escuro (Dark), respeitando a preferência do sistema ou seleção manual.
- Notificações: Avisos visuais (toasts) para confirmação de ações e alertas de erros.
