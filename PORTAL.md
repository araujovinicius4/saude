# Bolsa Saúde Cidadão — Etapas 1, 2 e 3

O portal continua em React + Vite e React Router. As rotas anteriores e a persistência `minha-saude:v1` (`goals`, `records`, `sharing`) foram preservadas.

- `/app`: Visão Geral e gráficos existentes.
- `/app/prevencao`: acesso aos componentes existentes de registros, metas, evolução e pontos.
- `/app/prontuario`: seis seções acessíveis por `?secao=`: dados pessoais, condições e alergias, medicamentos, exames, consultas e linha do tempo.
- `/app/atendimentos`: quatro seções por `?secao=`: meus atendimentos, profissionais vinculados, registros clínicos e autorizações de acesso.
- `/app/beneficios`: saldo derivado de créditos e pagamentos simulados, em centavos inteiros.
- `/app/perfil`: perfil fictício e informação sobre a sessão demonstrativa.

## Dados e integração futura

`src/data/prevention.js` concentra os mocks de prevenção e da semana ilustrativa. `src/data/portal.js` concentra os mocks dos novos módulos e da sessão. Os componentes consomem os dados novos via `PortalContext`, cujo repositório é injetável. `demoPortalRepository` entrega cópias dos mocks, sem rede ou persistência adicional. O Context anterior de prevenção não foi substituído.

Na Etapa 2, `src/data/healthRecord.js` fornece os registros fictícios padronizados de `portalMock.healthRecord.records`. Cada item tem ID, data do registro, data do evento quando aplicável, tipo, origem e autor fictício. `src/portal/health-record/` separa página, formulário, apresentação do registro e regras puras de manipulação e ordenação. A navegação usa React Router e não recarrega o documento.

As operações de inclusão, edição e exclusão passam pelo repositório e atualizam somente o estado do `PortalContext`. Permanecem durante a navegação interna e são descartadas ao recarregar a aplicação. Não há escrita de dados do prontuário no `localStorage` ou outro armazenamento. A persistência de prevenção não foi alterada.

Somente itens autodeclarados do cidadão da sessão demonstrativa podem ser editados ou excluídos. O formulário não controla origem, autoria, ID ou data original do registro. As regras recusam alterações em itens profissionais ou de outro autor, além de ocultar essas ações na interface. Isso não substitui autorização do backend. O cadastro fictício de referência é somente leitura; os formulários permitem informações pessoais adicionais autodeclaradas.

A linha do tempo reúne condições, alergias, medicamentos, exames, consultas e anotações históricas, do evento mais recente ao mais antigo. Utiliza a data de registro se não houver data de evento e desempata por data do registro e ID. Anotações cadastrais pessoais ficam em Dados pessoais. Consultas futuras ilustram agendamentos; não constituem atendimentos realizados.

Para integrar um backend, substituir o adaptador e a sessão por um provedor autenticado, tratando também carregamento e erros. O servidor deverá autenticar e autorizar cada operação e limitar os dados retornados ao perfil autorizado. `visibleDemoModules` organiza apenas a apresentação: não protege rotas, dados ou ações. Nenhuma pessoa está autenticada neste MVP.

## Limitações

Os módulos são demonstrativos. Registros autodeclarados e atendimentos em rascunho são editáveis em memória conforme o perfil simulado; registros profissionais finalizados são imutáveis e aceitam retificações vinculadas. Benefícios e o cadastro de referência do cidadão continuam somente de leitura. Não há cadastro real, backend, prontuário externo integrado, agendamento real, validação de elegibilidade, integração bancária ou pagamentos reais. Datas dos mocks são exemplos fixos. Não há diagnóstico, prescrição ou interpretação automatizada de exames. Informações clínicas, hábitos e pontos não concedem nem suspendem benefícios. Os registros de prevenção continuam locais e editáveis; use apenas dados fictícios. A autorização de compartilhamento existente é uma simulação independente no navegador.

## Etapa 3 — Atendimentos e profissionais

`src/data/appointments.js` centraliza profissionais, cidadãos de exemplo adicionais, vínculos, atendimentos, autorizações iniciais e auditoria fictícia. `src/data/portal.js` compõe esse snapshot com o cidadão e os registros do prontuário. Os componentes de `src/portal/appointments/` separam navegação, seletor de perfil, formulários, listagem, cadastro profissional, registros e autorizações. O cidadão pode cadastrar um profissional fictício e seu vínculo em memória; isso não concede autorização clínica automaticamente.

O seletor alterna entre cidadão e profissional, sem autenticação, e oferece ao profissional somente cidadãos com vínculo ativo. O estado selecionado é compartilhado por Atendimentos e Prontuário. Uma barreira de apresentação evita exibir os módulos pessoais do cidadão enquanto o perfil profissional está selecionado; ela não representa segurança real. Sem vínculo, nenhum cidadão ou dado clínico é exibido. Os dados fictícios ainda fazem parte do frontend e não são protegidos contra inspeção do código.

As transições puras em `appointments/model.js`, expostas pelo repositório, validam vínculo, autoria, finalidade e escopo. O escopo `read` permite consultar o prontuário; `write`, concedido junto com `read`, permite registrar e retificar atendimentos próprios. Solicitações profissionais não concedem acesso por si só. O cidadão concede, atualiza ou revoga a autorização; a revogação invalida novas consultas e alterações sem apagar documentos anteriores. Nova concessão exige nova consulta explícita. Consultas aceitas e recusadas, alterações de perfil, cadastro, concessões, revogações, finalizações e retificações geram eventos em memória.

Atendimentos têm ID, cidadão, profissional, unidade e especialidade fictícias, data, horário e situação (`scheduled`, `completed`, `cancelled`). Os filtros podem combinar data, profissional e situação. O profissional autorizado pode criar ou editar rascunhos de seus atendimentos. Finalizar exige resumo, evolução e orientações fictícias, limpa o rascunho e gera um registro profissional bloqueado. Os exemplos cancelados não podem ser editados ou finalizados; esta etapa não inclui um fluxo operacional de cancelamento.

`healthRecord.records` é a fonte clínica única: o atendimento finalizado guarda `recordId`, não uma cópia editável do registro. Um exemplo agendado que já tinha entrada no prontuário reutiliza seu ID ao finalizar. A finalização repetida é recusada. Uma retificação cria um novo registro `rectification`, com `originalRecordId`, motivo, conteúdo corrigido, autor e data próprios, sem sobrescrever o original. Registros e retificações aparecem na linha do tempo da Etapa 2. O cidadão não pode editar documentos profissionais; o profissional não ganha edição direta dos itens autodeclarados.

Toda a sessão, incluindo novos profissionais, rascunhos, documentos, autorizações e eventos, é descartada ao recarregar. Nenhum dado clínico vai para `localStorage`, rede ou banco de dados. O backend futuro deverá implementar autenticação, autorização em cada operação, trilha de auditoria persistente e integridade das transições. Os controles e o registro de auditoria atuais são apenas demonstrações e não atendem requisitos de segurança de um sistema clínico real.

## Validação

`npm.cmd test`, `npx.cmd playwright test` e `npm.cmd run build`. Os testes de navegador cobrem navegação, renderização e ausência de transbordamento em desktop e smartphones, além dos fluxos anteriores. Capturas são gravadas em `test-results/` (ignorado pelo Git).

Etapa 2: testes unitários de metadados, validações de campos e datas, unicidade, autoria, imutabilidade e ordenação. Playwright verifica as seis seções sem recarga, CRUD em todas as categorias autodeclaradas, confirmação de exclusão, leitura de registros profissionais, atualização da linha do tempo, manutenção do estado na navegação e descarte na recarga, sem persistência clínica. Capturas das seis seções são geradas em 1440 e 390 pixels; ausência de transbordamento também é verificada em 320 pixels.

Etapa 3: testes unitários de filtros, vínculos, escopos, cadastro fictício, transições, bloqueio após finalização, prevenção de duplicações, colisões de IDs, retificações imutáveis, concessão e revogação, isolamento de cidadãos e auditoria. Playwright cobre os quatro menus sem recarga, filtros combinados, criação/edição de rascunho, finalização, retificação e integração canônica ao prontuário em 1440, 390 e 320 pixels, além de solicitações, concessões, revogações, registro profissional fictício e reset da sessão. A suíte anterior é mantida.

## Arquivos da Etapa 3

Criados:

- `src/data/appointments.js`
- `src/portal/appointments/Appointments.jsx`
- `src/portal/appointments/AppointmentList.jsx`
- `src/portal/appointments/AppointmentForm.jsx`
- `src/portal/appointments/Professionals.jsx`
- `src/portal/appointments/ClinicalRecords.jsx`
- `src/portal/appointments/Authorizations.jsx`
- `src/portal/appointments/ProfileSelector.jsx`
- `src/portal/appointments/ProfileBoundary.jsx`
- `src/portal/appointments/model.js`
- `tests/appointments.test.js`
- `tests/browser/appointments.spec.js`

Modificados:

- `src/data/portal.js`
- `src/data/healthRecord.js`
- `src/portal/PortalContext.jsx`
- `src/portal/repository.js`
- `src/portal/PortalPages.jsx`
- `src/portal/health-record/model.js`
- `src/portal/health-record/HealthRecord.jsx`
- `src/portal/health-record/RecordCard.jsx`
- `src/main.jsx`
- `src/styles.css`
- `tests/health-record.test.js`
- `PORTAL.md`

Validação final da Etapa 3: 32 testes unitários aprovados, 27 testes Playwright aprovados e build de produção concluído. As capturas de desktop e smartphone foram inspecionadas visualmente.
