# Sistema de Gestão de Atendimento - TODO

## Arquitetura e Banco de Dados
- [x] Definir schema de tabelas (operadores, fila, casos)
- [x] Criar migrações do banco de dados

## Autenticação e Login
- [x] Implementar login simplificado sem senha (Nome + PA)
- [x] Criar endpoints de autenticação
- [x] Adicionar proteção de rotas para operador vs monitor

## Interface do Operador
- [x] Criar página de login do operador
- [x] Implementar botão "Chamar Monitor" com estado "Aguardando..."
- [x] Criar formulário de casos estilo post-it (Título + Descrição)
- [x] Listar casos criados pelo operador

## Dashboard do Monitor
- [x] Criar página do monitor
- [x] Implementar coluna esquerda com fila FIFO (Nome + PA)
- [x] Adicionar botão "Atender" para remover da fila
- [x] Implementar coluna direita com grid de casos estilo Trello
- [x] Adicionar botão "Concluir" para marcar casos como resolvidos

## Exportação e Limpeza de Dados
- [x] Implementar funcionalidade "Fechar o Dia"
- [x] Gerar arquivo Excel (.csv) com atendimentos do dia
- [x] Implementar limpeza automática de dados após download
- [x] Adicionar confirmação antes de limpar dados

## Design e Estilo
- [x] Aplicar design elegante e sofisticado
- [x] Configurar paleta de cores profissional
- [x] Implementar responsividade
- [x] Adicionar animações suaves

## Testes e Validação
- [x] Testar fluxo de login
- [x] Testar fila FIFO
- [x] Testar criação e conclusão de casos
- [x] Testar exportação Excel
- [x] Testar limpeza de dados


## Rastreamento de Monitores (Nova Funcionalidade)
- [x] Adicionar coluna monitorName na tabela de casos
- [x] Criar dropdown com lista de monitores na autenticação
- [x] Implementar atribuição automática de monitor ao atender caso
- [x] Exibir monitor responsável no painel do operador
- [x] Exibir monitor responsável no painel do monitor
- [x] Atualizar testes para incluir rastreamento de monitores


## Alterações Solicitadas
- [x] Alterar senha do monitor para Monitor@123
- [x] Remover dica de senha do formulário de login

- [x] Adicionar botão "Assumir Caso" no quadro de casos do monitor
- [x] Atribuição de monitor só ocorre ao clicar em "Assumir Caso"
- [x] Casos assumidos mudam de cor (amarelo → verde)
- [x] Operador vê monitor responsável em tempo real

## Casos Concluídos com Comentários (Nova Funcionalidade)
- [x] Adicionar coluna resolution na tabela de casos
- [x] Criar modal/formulário para monitor registrar resolução ao concluir
- [x] Exibir casos concluídos em seção separada no painel do monitor
- [x] Exibir casos concluídos em seção separada no painel do operador
- [x] Mostrar comentários/resolução nos casos concluídos
- [x] Atualizar testes para incluir campo de resolução


## Notificações do Navegador (Nova Funcionalidade)
- [x] Implementar Notification API para notificações do navegador
- [x] Notificar monitor quando novo caso é criado
- [x] Notificar monitor quando operador chama (novo item na fila)
- [x] Notificar operador quando caso é resolvido
- [x] Solicitar permissão de notificação ao usuário
- [x] Testar notificações em diferentes navegadores


## Alterações na Tela Inicial
- [x] Remover seção "Recursos Principais"
- [x] Mudar título para "Sistema SupPaciente"
- [x] Remover subtítulo "Gestão elegante de atendimentos para ambientes compartilhados"


## Separação de Botões de Relatório
- [x] Substituir "Fechar o Dia" por "Baixar Relatório do Dia"
- [x] Adicionar botão "Zerar Relatório/Casos"
- [x] Botão de download exporta CSV sem limpar dados
- [x] Botão de zerar limpa apenas os casos resolvidos
- [x] Adicionar confirmação antes de zerar dados


## Seção de Operadores Logados (Nova Funcionalidade)
- [x] Criar rota para obter lista de operadores logados
- [x] Adicionar terceira coluna no dashboard do monitor
- [x] Exibir operadores logados com Nome e PA
- [x] Atualizar lista em tempo real (a cada 2-3 segundos)
- [x] Testar funcionalidade de acompanhamento de operadores


## Bug Fix - Persistência de Sessão do Operador
- [x] Salvar dados do operador no localStorage ao fazer login
- [x] Recuperar dados do localStorage ao carregar a página
- [x] Restaurar sessão automaticamente se dados existirem
- [x] Limpar localStorage apenas ao clicar em "Sair"
- [x] Testar recarregamento da página (F5) mantendo sessão


## Modal de Visualizau00e7u00e3o de Casos Completos
- [x] Adicionar botão "Ver Caso" nos cards de casos do operador
- [x] Adicionar botão "Ver Caso" nos cards de casos do monitor
- [x] Criar modal que exibe Tu00edtulo, Descriu00e7u00e3o e Resoluçu00e3o completos
- [x] Exibir informações do monitor responsável no modal
- [x] Testar modal em casos com textos longos

## Melhorias Adicionais (Nova Solicitau00e7u00e3o)
- [x] Adicionar botão "Ver Caso" nos cards de casos resolvidos (seu00e7u00e3o azul)
- [x] Implementar botão "Cancelar" na fila de espera do operador
- [x] Remover operador da fila ao clicar em "Cancelar"
- [x] Testar fluxo de cancelamento de fila

## Atualizações Solicitadas (Nova Solicitação)
- [x] Alterar campo PA para type="number" no login do operador
- [x] Validar entrada de PA para aceitar apenas números
- [x] Implementar notificação ao operador quando monitor clica em "Atender"
- [x] Notificação deve mostrar nome do monitor que está indo até o operador
- [x] Testar notificação de atendimento


## Bug Fix - Login e Validação de PA
- [x] Validar campo PA para aceitar APENAS números (sem letras)
- [x] Investigar bug de volta para tela de login após logar
- [x] Revisar fluxo completo de login do operador
- [x] Testar persistência de sessão após login


## Remoções Solicitadas
- [x] Remover seção de "Operadores Logados" do dashboard do monitor


## Bug Critical - Login Volta para Tela de Login
- [x] Investigar por que após login bem-sucedido volta para tela de login
- [x] Corrigir fluxo de navegação/redirecionamento após login
- [x] Testar persistência de sessão após login bem-sucedido


## Animações Solicitadas
- [x] Adicionar animação de piscar (pulse) nos itens da fila de atendimento do monitor

## Atualização de Lista de Monitores
- [x] Trocar "Eduardo Furtado" por "Maria Eduarda" na lista de monitores
- [x] Adicionar "Elivelton Oliveira", "Geiciele Rodrigues", "Pedro Costa" e "Albislene Neves" à lista

## Correção de Sistema de Notificações com Som
- [x] Investigar por que notificações não funcionam 100%
- [x] Criar hook robusto de notificações com polling contínuo
- [x] Gerar arquivos de som para notificações (chamado, novo caso, atendimento, conclusão)
- [x] Implementar notificação quando operador chama (monitor recebe)
- [x] Implementar notificação quando operador cria caso (monitor recebe)
- [x] Implementar notificação quando monitor atende chamado (operador recebe)
- [x] Implementar notificação quando monitor conclui caso (operador recebe)
- [x] Adicionar som em todas as notificações
- [x] Testar notificações em múltiplos navegadores

## Melhorias em Visualizacao e Edicao de Casos
- [x] Adicionar botao "Ver Caso" em casos concluidos do operador
- [x] Adicionar botao "Ver Caso" em casos concluidos do monitor
- [x] Implementar funcionalidade de editar titulo e descricao do caso
- [x] Criar modal de edicao com validacao
- [x] Testar edicao de casos

## Implementacao de Push Notifications Reais (Service Worker + Push API)
- [x] Criar/melhorar Service Worker para gerenciar Push Notifications
- [x] Implementar hook para registrar e gerenciar subscricoes de push
- [x] Criar componente de controle de Push Notifications
- [x] Criar backend para gerenciar subscricoes
- [x] Estrutura pronta para enviar notificacoes push
- [x] Garantir que fluxos existentes nao quebrem

## Auditoria e Corre\u00e7\u00e3o de Push Not## Auditoria e Correção de Push Notifications
- [x] Auditar Service Worker e verificar se está realmente ativo
- [x] Verificar se Push API está sendo usada corretamente
- [x] Identificar e remover fallbacks que dependem de aba ativa (polling)
- [x] Validar HTTPS e permissões de notificação
- [x] Criar módulo de Push Notifications no backend
- [x] Documentar configuração e próximos passos
