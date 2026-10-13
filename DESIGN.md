# Sistema de design 1MIND

## Visão geral

Uma interface em português para explorar o enxame, avaliar ideias e conhecer o token e a coleção de agentes. A ideia visual é um **observatório escuro em torno de pequenos mundos vivos e acolhedores**: a estrutura discreta dá espaço a ilhas ilustradas, agentes amigáveis e uma ação principal em verde claro.

A fonte de verdade é `src/styles.css`; as ilustrações estão em `src/components/Art.tsx`. O sistema foi extraído do código final, após a revisão dos seis domínios Better Interface. Não há modo claro ou alternância de tema: os três cenários mudam a arte, preservando a interface escura.

## Cores

Tokens semânticos em `src/styles.css:8`:

| Token              | Valor     | Uso                                                              |
| ------------------ | --------- | ---------------------------------------------------------------- |
| `--bg`             | `#101310` | Fundo geral.                                                     |
| `--surface`        | `#191e19` | Mapa, painéis, modal e agrupamentos.                             |
| `--surface-raised` | `#232a23` | Controles secundários, seleção neutra, avisos.                   |
| `--line`           | `#333b32` | Divisores e estrutura.                                           |
| `--text`           | `#f0f2e9` | Conteúdo principal.                                              |
| `--muted`          | `#a7b1a3` | Descrições, rótulos e informação secundária.                     |
| `--accent`         | `#caf580` | Ação principal, seleção e marca 1MIND.                           |
| `--accent-ink`     | `#202b17` | Texto no botão principal.                                        |
| `--accent-muted`   | `#2a3922` | Fundo da aba ativa e aviso de elegibilidade.                     |
| `--lavender`       | `#c6b6ef` | Carteira na distribuição da taxa, categorias e coleção.          |
| `--peach`          | `#efbe9f` | Estrelas, parcela identificada de staking e detalhes da coleção. |
| `--error`          | `#ffb4a6` | Erros, sobre `#432a26`.                                          |
| `--focus`          | `#e5ffc5` | Contorno de foco de 2 px.                                        |

No gráfico, queima é verde, carteira é lavanda e staking é pêssego. Texto e valores também identificam cada destino; a cor não é a única indicação. A arte usa paletas próprias: verde/água e cogumelos rosados em Gaia, azuis e areia em Aurora, lavanda/rosa/menta em Sinapses. Esses valores pertencem à ilustração, não a novos estados da interface.

Pares medidos no export pelo probe: texto principal/fundo **16,55:1**; texto secundário/fundo **8,43:1**; verde da chamada/fundo **15,04:1**; texto do botão principal/verde **11,90:1**; aba Natureza selecionada **9,89:1**. São medições dos elementos indicados em `artifacts/taste.json`, não uma estimativa sobre todos os pixels da arte. A varredura axe verificou as seis rotas e o modal de agente. Contraste de cada detalhe vetorial não foi certificado.

## Tipografia

Uma família: **Manrope**, fonte variável local em `public/assets/manrope-latin.woff2`, com fallback `sans-serif`. Declaração de pesos 400–700, `font-display: swap` e sem síntese artificial. A implementação usa apenas **400, 500 e 700**.

| Token            | Valor              | Papel                                             |
| ---------------- | ------------------ | ------------------------------------------------- |
| `--font-small`   | `0.875rem` / 14 px | Rótulos, metadados, botões e textos compactos.    |
| `--font-body`    | `1rem` / 16 px     | Corpo, campos e controles de formulário.          |
| `--font-lead`    | `1.25rem` / 20 px  | Títulos menores e cartões.                        |
| `--font-heading` | `1.75rem` / 28 px  | Títulos de seção e dados.                         |
| `--font-title`   | `2.5rem` / 40 px   | Títulos de páginas e chamada móvel.               |
| `--font-display` | `4rem` / 64 px     | Chamada inicial e números de destaque no desktop. |

Corpo com entrelinha 1,6; parágrafos 1,65; títulos em 1,2 e chamada inicial em 1,05 (1,1 no móvel). Títulos usam `text-wrap: balance`; descrições, `pretty`. A chamada de 64 px usa espaçamento `-0.065em`; títulos de página `-0.045em`; títulos pequenos `-0.025em`. O logotipo tem ajuste óptico próprio. Não há rótulos superiores em caixa alta ou espaçamento artificial de letras em texto de leitura.

Inputs usam 16 px, inclusive no celular. Endereços podem quebrar com `overflow-wrap: anywhere`. Avaliações e posições do ranking usam números tabulares. O gráfico e os NFTs não introduzem novas famílias tipográficas. O probe encontrou quatro tamanhos em uso na entrada móvel e cinco na entrada desktop, dentro da escala declarada de seis.

## Layout e responsividade

`App.tsx` define cabeçalho, uma região `main`, navegação por hash e rodapé. `.home-page` e `.page-inner` compartilham largura máxima de 1.408 px e margens internas de 48 px no desktop. Os espaçamentos predominantes são 4, 8, 12, 16, 20, 24, 28, 32, 40 e 48 px, com ajustes pontuais de alinhamento da arte.

- **Acima de 1.250 px:** cabeçalho completo, introdução em duas colunas e mapa ao lado do resumo do enxame. O mapa possui proporção aproximada de 1,88:1.
- **Até 1.250 px:** margens de 32 px, controles mais compactos e redução da coluna lateral.
- **Até 1.000 px:** margens de 24 px; o mapa ocupa a largura; o resumo lateral é removido da composição. A tabela mantém suas duas colunas.
- **Até 720 px:** menu móvel, margens de 20 px, introdução empilhada, título de 40 px, mapa com proporção 1,1:1 e NFTs em coluna única. Áudio continua acessível no canto direito da barra. Rótulos dos mundos ficam sem ícones para caber. O controle de ampliação é reservado ao desktop.
- **Até 370 px:** margens de 16 px e ajustes dos controles. O mapa fica quadrado; arte pode sangrar/cortar nas bordas, mas os nomes, ações e dados permanecem acessíveis.
- **Acima de 1.500 px:** ajuste da proporção do mapa para 1,9:1, mantendo o limite de largura da página.

Na primeira tela de 390 × 844 px, título, descrição, ação “Explorar o enxame” e os nove agentes aparecem. O export foi verificado em 320, 390, 768 e 1440 px nos seis destinos, em Chromium e WebKit, sem rolagem horizontal. O campo de busca precede a tabela; ordenação e elegibilidade ficam junto às ações que alteram. O histórico mantém seus controles acima dos resultados.

## Superfícies e profundidade

Superfícies de conteúdo usam tons, espaçamento e divisores, sem sombras de cartão. Bordas marcam campos, abas ou separação de linhas. Sombras ficam no modal e na notificação flutuante; ambos não têm borda. O modal usa `dialog.showModal()` e fundo escurecido com desfoque de 5 px. Os agentes têm sombra vetorial discreta, como parte da ilustração.

A ordem visual do mapa isola o cenário, os agentes e os controles. O agente em foco aparece acima dos demais; suas dicas se alinham conforme a coluna para permanecerem dentro do mapa. A notificação fica acima da página; o modal nativo utiliza a camada superior do navegador.

## Formas

Raio principal de 16 px; botões 9 px; campos e controles de ícone 8 px; painéis da coleção 14 px; modal 20 px, reduzido a 16 px no móvel. Avatares usam círculos ou retângulos arredondados. A repetição de órbitas aparece apenas na arte e nos NFTs; o restante da interface mantém formas simples.

## Componentes e estados

| Componente ou padrão                   | Origem                             | Uso e comportamento                                                                                                                                                                                                                            |
| -------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mark`, `AgentFace`, `WorldArt`        | `src/components/Art.tsx`           | Marca e SVGs locais. `AgentFace` recebe `large`, `active`, `working` e `equipment`; o rosto permanece igual no mapa e na coleção.                                                                                                              |
| `World`                                | `src/components/World.tsx`         | Recebe cenário, seleção de agente e modo ampliado. Mundos com `aria-pressed`, controle de movimento, áudio, volume e ajuda. Movimento aleatório limitado, atualizado a cada 4,5 s. Agente selecionado congela a posição e olha para o usuário. |
| `Modal`                                | `src/components/Modal.tsx`         | `title`, `children`, `onClose`, `className`. Modal nativo, conteúdo de fundo inerte, Escape, fechamento externo, foco inicial e retorno ao acionador. Sem reconstrução manual do padrão de diálogo.                                            |
| `Projects`, `ProjectRanking`, `Rating` | `src/components/Projects.tsx`      | Tabela de duas colunas, média em estrelas, busca/ordenação, estado vazio recuperável, criação e voto. As estrelas são radios com legendas; duplicação é impedida no estado local.                                                              |
| `Tokenomics`                           | `src/components/Tokenomics.tsx`    | Gráfico com descrição acessível e calculadora; entrada inválida é associada ao texto de erro.                                                                                                                                                  |
| `Nfts`                                 | `src/components/Nfts.tsx`          | Coleção, confirmação explícita da demonstração, imagem para download, preço semanal e histórico carregando/vazio/erro/sucesso. Datas e carteiras vêm do arquivo publicado, sem vencedores fictícios.                                           |
| `Launch`                               | `src/components/Launch.tsx`        | Configuração opcional e exportação JSON; erro associado ao campo com `aria-invalid`, `aria-describedby` e foco. Nenhuma implantação automática.                                                                                                |
| Botões e campos                        | `src/styles.css`                   | `.button.primary`, `.button.secondary`, `.icon-button`, `.text-button`, `.form-stack`. Estados hover, foco, pressão, indisponível e erro. A ação principal recebe fundo verde; ações pares permanecem neutras.                                 |
| Carteira e avisos                      | `src/App.tsx`, `src/lib/wallet.ts` | Estado em andamento, rejeição, rede errada, erro recuperável e saldos. Respostas antigas são invalidadas ao mudar conta/rede. Notificação persistente com `role="status"` e botão para dispensar.                                              |

Ícones Lucide usam `currentColor` e um conjunto consistente. Os alvos passam pelo mínimo de 24 px ou pela exceção de espaçamento; botões principais têm 46 px de altura. O probe registrou 11 controles abaixo do conforto de 44 px na entrada móvel, sobretudo controles compactos do mapa e links; isso é documentado, não declarado como 44 px em toda a página.

O foco usa contorno visível de 2 px; as abas do modal têm setas, Home/End e tabindex móvel. A mudança de rota foca `main` sem deslocar o cabeçalho. Erros usam `role="alert"`; confirmações, uma região de status. O movimento começa pausado quando o sistema pede redução de movimento; essa preferência também remove transições e animações. Hover da arte é limitado a dispositivos com hover. A música começa desligada.

## Continuidade do sistema

Para adicionar uma página, reutilize `.page-inner` e `.page-heading`, um único `h1`, seções com `h2` e os controles existentes. Acrescente a rota por hash em `App.tsx`. Mantenha labels visíveis, instruções próximas à ação e estados de erro recuperáveis. Para novos dados financeiros, indique claramente a origem e diferencie parâmetros previstos de valores confirmados.

Use os tokens de texto para texto e os de linha para divisores. Preserve a fonte local, a escala de seis tamanhos e a ação principal única por contexto. Não transforme detalhes coloridos da ilustração em um segundo sistema de status. Não apresente dados locais como dados globais, nem a reserva demonstrativa como compra ou mint.

A revisão, os achados corrigidos e os limites de observação estão em `artifacts/validation.md`. Não foram testados zoom nativo, leitor de tela, dispositivo físico, RTL ou uma segunda paleta; os dois últimos não fazem parte do produto em português entregue.
