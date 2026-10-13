# 1MIND · Uma mente. Infinitos mundos.

Website em português para o projeto 1MIND, feito com React, TypeScript e Vite. O export de produção está incluído em **`dist/`** e funciona em hospedagem estática e subdiretórios, com URLs relativas e navegação por hash.

**Esta entrega é uma versão de pré-lançamento.** Exploração, projetos, votos e coleção funcionam como demonstrações locais, identificadas na interface. A conexão de carteira e a leitura de saldos ERC-20 são reais quando o responsável configura rede e contratos. O site não envia transações, não emite NFTs e não executa sorteios ou pagamentos.

## Instalar, desenvolver e reconstruir

Ambiente verificado: Node.js 24.21.0 e npm 11.19.0.

```sh
npm ci
npm run dev
```

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

O build faz também a checagem de tipos. O preview usa o export em `dist/`. Publique **o conteúdo inteiro de `dist/`**, incluindo `assets/`, `data/` e `licenses/`. Não há backend, variáveis de ambiente, serviço de fontes ou API secreta. O navegador precisa de JavaScript. Use um servidor HTTP; abrir `index.html` pelo protocolo `file:` não é suportado.

`vite.config.ts` define `base: './'`. Os endereços `#inicio`, `#tokenomics`, `#explorar`, `#votar`, `#nfts` e `#lancamento` não precisam de reescrita de rotas no servidor. A publicação/IPFS é responsabilidade da plataforma após a entrega; nenhum comando de publicação foi executado.

Durante esta execução, as dependências de build foram instaladas em `/tmp/1mind-build`. Uma cópia do código foi compilada ali e o export foi copiado de volta para `dist/`. O manifesto e o lockfile dessa instalação estão na raiz. Diretórios `node_modules/` e caches de ferramentas ficam excluídos da entrega em qualquer profundidade.

## O que funciona

- **Início:** produto e ação principal na primeira tela de 390 px, mapa utilizável, utilidade no ecossistema IMD para votar e colecionar agentes, oferta de 1 bilhão, capitalização inicial de 2.500 IMD, liquidez inicial configurada ou “a definir” e taxa de 2% com incentivo de queima.
- **Tokenomics:** gráfico e descrição de 1% de queima, 0,5% para carteira e 0,5% para staking; simulador da compra com validação de valores.
- **Explorar:** planeta Aurora, jardim de Gaia e rede de sinapses; nove agentes com a mesma aparência, movimento aleatório, atividades comunitárias e de lazer, pausa, ampliação e ajuda. Ao selecionar um agente ele para, olha para o visitante e abre atributos ou os dez projetos melhor avaliados.
- **Música:** três composições instrumentais locais, ativação voluntária, troca de faixa e volume. Falhas ao iniciar áudio recebem uma mensagem após quatro segundos; não há reprodução automática.
- **Votar:** dez projetos de exemplo, busca, classificação por média ou data, criação de projetos, estrelas e impedimento de voto repetido por participante/projeto no armazenamento local. Os nove agentes avaliam cada nova proposta uma vez por critérios determinísticos de clareza e impacto comunitário. Não há LLM conectado. As opções futuras de popularidade e tendências estão identificadas e indisponíveis.
- **NFTs:** imagens com o mesmo rosto dos agentes e ID no canto inferior direito; coleção demonstrativa persistente e download do SVG. Preço inicial de 5 1MIND, aumento composto de 1% a cada sete dias completos, a partir da data de lançamento configurada. Regras de utilidade, três contemplados, 30%/70%, próxima sexta-feira 23:59 UTC e histórico publicado por data.
- **Lançamento:** modelo JSON exportável com oferta, taxas, capitalização, elegibilidade e regras dos NFTs; configuração opcional da rede, tokens, liquidez e data UTC.

## Carteira e configuração do lançamento

A integração usa o provedor injetado `window.ethereum`, conforme [EIP-1193](https://eips.ethereum.org/EIPS/eip-1193), e consultas `balanceOf`/`decimals` do [ERC-20](https://eips.ethereum.org/EIPS/eip-20). Não usa custodiante, chaves, aprovações ou assinatura. A carteira fornece o transporte RPC; nenhum endpoint pago ou endereço interno da máquina é incluído no código.

Em **Lançamento**, o responsável pode preencher valores conhecidos e salvar. Eles valem para aquele navegador. Para configurar o site distribuído, preencha `src/site-config.ts` com os mesmos valores e reconstrua. A configuração salva pelo visitante tem precedência. Campos vazios mantêm o estado de pré-lançamento; endereços zero, endereço de queima e contratos idênticos são rejeitados.

O estado de carteira inclui: provedor ausente, solicitação pendente, rejeição, rede incorreta, troca de rede, leitura em andamento, erro, saldo insuficiente, saldo elegível e desconexão. Mudanças de conta ou rede invalidam a elegibilidade anterior. Limites são comparados com `bigint`, usando as casas decimais consultadas em cada token: **10 IMD ou 1 1MIND**. Não se arredonda saldo para alcançar o limite.

A regra de um voto por carteira é **somente demonstrativa nesta versão**. Os votos não são assinados, compartilhados ou protegidos contra alteração do armazenamento. A leitura de saldo não transforma o armazenamento local em um sistema de votação confiável. Uma implementação global precisa de contrato ou serviço com autenticação e unicidade. Agentes locais não representam identidades autenticadas de IA.

A capitalização de 2.500 IMD e a liquidez inicial são conceitos separados. A quantidade de liquidez não foi informada e permanece configurável. A data de lançamento também começa vazia. O destino de 70% das vendas de NFTs é sempre:

```text
0x721B57f19546D4255Fa351fC02c5EE3B294a3039
```

Os destinatários da taxa de compra para carteira e staking precisam ser definidos no contrato. O JSON exportado é um **modelo de parâmetros**, não um contrato executável nem um formato oficial de importação do Identity.md Launchpad. A implantação, a liquidez, a integração global de projetos/agentes, a venda de NFTs, a aleatoriedade verificável e um executor semanal ainda precisam ser fornecidos e conectados pelo responsável. Não há transações, recibos, saldos, vencedores ou endereços inventados apresentados como reais.

## Histórico de recompensas

`public/data/distributions.json` é carregado pela coleção; `dist/data/distributions.json` contém a mesma versão após o build. O arquivo inicial tem `version: 1` e `rounds: []`, pois nenhuma distribuição real foi fornecida.

Para publicar resultados reais, o responsável adiciona entradas com:

| Campo             | Conteúdo                                                                                                                                                       |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `date`            | Data UTC válida no formato ISO `YYYY-MM-DDTHH:mm:ssZ`, sem duplicação.                                                                                         |
| `weeklySales`     | Total de vendas em 1MIND, em string decimal com até 18 casas.                                                                                                  |
| `transactionHash` | Hash de 32 bytes da distribuição realizada.                                                                                                                    |
| `winners`         | Exatamente três objetos com `address` e `amount`, três carteiras distintas, cada valor igual a 10% das vendas em unidades de 18 casas, arredondado para baixo. |

O formato e a proporção são validados em `src/lib/rewards.ts`; os registros são ordenados pela data mais recente. A seleção de data atualiza os três contemplados. As carteiras aparecem parcialmente, com endereço completo acessível por cópia e título. O histórico é identificado como publicado pelo responsável: o site **não verifica recibos on-chain**. Arquivo inválido ou indisponível exibe erro e permite tentar novamente.

## Verificações executadas

No export final da revisão de 13/10/2026:

| Verificação                        | Resultado                                                                              |
| ---------------------------------- | -------------------------------------------------------------------------------------- |
| `npm run typecheck`                | Passou, sem erros.                                                                     |
| `npm run build`                    | Passou; export local completo.                                                         |
| `npm test`                         | 19 testes de domínio, carteira e histórico passaram.                                   |
| Testes de navegador em Chromium    | 32/32 passaram.                                                                        |
| Testes de navegador em WebKit      | 32/32 passaram, usando as bibliotecas do motor já disponíveis em `/tmp`.               |
| axe, seis rotas e modal de agente  | Nenhuma violação nos critérios automatizados WCAG A/AA selecionados, nos dois motores. |
| Refluxo em 320, 390, 768 e 1440 px | Sem rolagem horizontal nas seis rotas, nos dois motores.                               |
| Probe `taste@1`, em modo offline   | 16/16 critérios passaram; medições em 320, 390 e 1440 px e capturas em 390 e 1440 px.    |
| Recursos/console                   | Sem erro JavaScript ou recurso local ausente nos fluxos principais verificados.        |

Os quatro achados foram reproduzidos antes da alteração, em Chromium e WebKit, e corrigidos sem alterar a integração de carteira ou os parâmetros do token. A revisão cobre nomes e URLs longos na tabela e nos diálogos, a utilidade e a liquidez no Início, o acesso à carteira a partir da votação e valores grandes fracionários na calculadora. As respostas estão em `.imd-responses.json`; medidas anteriores e finais em `artifacts/revision-measurements.json`.

Os testes adicionais usam o texto exato do relato em 320, 390, 768 e 1440 px, verificam a liquidez pendente/configurada e exercitam o voto desconectado, conectado sem saldo elegível e com saldo elegível. A suíte aguarda a conclusão do fechamento de diálogos e da atualização de conta antes de conferir o estado.

Para repetir os testes de navegador em um ambiente com suas bibliotecas de sistema:

```sh
npx playwright install chromium webkit
npm run test:browser
BROWSER=webkit npm run test:browser
```

O teste serve `dist/` em um subdiretório de um servidor temporário e encerra servidor/navegador ao concluir. Evidências temporárias são escritas em `test/scratch/browser-check/`. `PLAYWRIGHT_MODULE`, `AXE_MODULE` e `BROWSER_EXECUTABLE` permitem usar ferramentas instaladas fora do repositório, como nesta execução. O probe fixado foi executado com:

```sh
PLAYWRIGHT_BROWSERS_PATH=/tmp/1mind-browsers \
IMD_PLAYWRIGHT=/tmp/1mind-browser/node_modules/playwright/index.mjs \
node .imd/reads/skills/design-critic/scripts/taste.mjs --offline --out test/scratch/taste
```

Os arquivos `.imd/reads/` são entradas da plataforma e são removidos antes da entrega. Um resumo dos resultados foi preservado em `artifacts/`. Consulte [a revisão consolidada](artifacts/validation.md), [o sistema de design](DESIGN.md) e [o orçamento](artifacts/BUDGET.md).

**Limites da verificação:** os testes de carteira usam provedores EIP-1193 controlados e nunca enviam dinheiro. Não houve carteira real assinando, consulta a contratos de produção, implantação, mint ou sorteio real. A reprodução Web Audio iniciou em ambos os motores; não houve audição em dispositivo físico. Não foram executadas sessões com leitor de tela, testes em iPhone físico, zoom nativo de navegador ou avaliação humana independente. As medições são evidência do trabalho local, não certificação da plataforma.

## Arquivos e tamanho

`src/` guarda a implementação; `public/` os recursos locais; `tests/` os testes; `dist/` o export pronto para hospedagem; `artifacts/` a revisão, licenças e evidências selecionadas. O limite total é 8 MiB. `.gitignore` tem orçamento explícito de 512 bytes e exclui dependências/caches em qualquer profundidade, mas **não exclui `dist/`**.

```sh
node scripts/check-delivery.mjs
```

Esse comando verifica metadados, URLs relativas, manifesto/lockfile, documentos e tamanho. A medição em `artifacts/budget.json` é conservadora sobre os arquivos entregues; não mede o empacotamento interno do publicador. Nenhuma pasta de dependências, cache, arquivo `.tgz` ou submódulo é necessário para servir o export.

## Créditos

Orientações de design adaptadas de **Better Interface**, de Jakub Krehel, commit `267330e1adfc66a718fb65fa6918c1f06d0a689e` (MIT); método documental de **Impeccable**, de Paul Bakaus, commit `9d715cc4f5564a990ca8345abfdd5df6dc9b41c8` (Apache-2.0). As fontes fixadas foram lidas durante a implementação. Avisos e licenças preservados em `artifacts/LICENSE-design-guidance.txt`.

Manrope é distribuída sob SIL Open Font License 1.1; React/React DOM sob MIT; Lucide sob ISC. As licenças acompanham o export em `dist/licenses/`. Cenários, agente e composições instrumentais foram criados para esta interface.
