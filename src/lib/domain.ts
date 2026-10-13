export const TREASURY = "0x721B57f19546D4255Fa351fC02c5EE3B294a3039";
export const SUPPLY = 1_000_000_000;
export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
export type Theme = "nature" | "planet" | "neuron";
export type Route =
  | "inicio"
  | "tokenomics"
  | "explorar"
  | "votar"
  | "nfts"
  | "lancamento";
export type Project = {
  id: string;
  name: string;
  description: string;
  category: string;
  createdAt: number;
  votes: Record<string, number>;
  example: boolean;
};
export type LaunchConfig = {
  chainId: string;
  imdAddress: string;
  tokenAddress: string;
  launchDate: string;
  initialLiquidity: string;
};
export const EMPTY_CONFIG: LaunchConfig = {
  chainId: "",
  imdAddress: "",
  tokenAddress: "",
  launchDate: "",
  initialLiquidity: "",
};
export const AGENTS = [7, 12, 23, 31, 47, 58, 64, 82, 96];
export const themes: Record<
  Theme,
  {
    name: string;
    subtitle: string;
    music: string;
    tasks: string[];
    leisure: string[];
  }
> = {
  nature: {
    name: "Jardim de Gaia",
    subtitle: "Cultivar ideias. Ver o futuro florescer.",
    music: "Raízes sonoras",
    tasks: ["Irrigando a horta", "Ensinando botânica", "Plantando uma árvore"],
    leisure: ["Campeonato de jogos", "Competição de digitação"],
  },
  planet: {
    name: "Órbita Aurora",
    subtitle: "Um novo planeta. A mesma vontade de criar.",
    music: "Além da órbita",
    tasks: [
      "Reparando um veículo",
      "Ensinando astronomia",
      "Cultivando alimentos",
    ],
    leisure: ["Campeonato de jogos", "Competição de digitação"],
  },
  neuron: {
    name: "Sinapse coletiva",
    subtitle: "Cada conexão pode ser uma nova ideia.",
    music: "Ondas da mente",
    tasks: [
      "Ensinando programação",
      "Conectando conhecimentos",
      "Organizando a biblioteca",
    ],
    leisure: ["Competição de digitação", "Campeonato de jogos"],
  },
};
export function activity(id: number, theme: Theme, tick: number) {
  const leisure = (id + tick) % 3 === 0;
  const choices = leisure ? themes[theme].leisure : themes[theme].tasks;
  return {
    leisure,
    text: choices[(Math.floor(id / 3) + tick) % choices.length],
  };
}
export function average(project: Project): number {
  const v = Object.values(project.votes);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
}
export function rateProject(project: Project, agent: number): number {
  // A transparent, local heuristic; no LLM or external service is called.
  const text = `${project.name} ${project.description}`.toLocaleLowerCase(
    "pt-BR",
  );
  const clarity = project.description.trim().length >= 70 ? 1 : 0;
  const impact =
    /comunidade|educa|acess|sustent|abert|públic|recicl|inclus|energia|horta/.test(
      text,
    )
      ? 1
      : 0;
  const hash = [...text].reduce(
    (sum, c) => (sum * 31 + c.charCodeAt(0)) >>> 0,
    agent,
  );
  return Math.min(5, 1 + clarity + impact + (hash % 3));
}
export function analyze(project: Project): Project {
  const votes = { ...project.votes };
  for (const agent of AGENTS)
    if (!votes[`agent:${agent}`])
      votes[`agent:${agent}`] = rateProject(project, agent);
  return { ...project, votes };
}
export function addVote(
  project: Project,
  voter: string,
  stars: number,
): Project {
  if (!Number.isInteger(stars) || stars < 1 || stars > 5)
    throw new Error("Escolha de 1 a 5 estrelas.");
  if (!voter || project.votes[voter])
    throw new Error("Este participante já avaliou este projeto.");
  return { ...project, votes: { ...project.votes, [voter]: stars } };
}
export function sortedProjects(projects: Project[], sort: string, search = "") {
  const q = search.toLocaleLowerCase("pt-BR");
  return projects
    .filter((p) =>
      `${p.name} ${p.description} ${p.category}`
        .toLocaleLowerCase("pt-BR")
        .includes(q),
    )
    .sort((a, b) =>
      sort === "recent"
        ? b.createdAt - a.createdAt
        : average(b) - average(a) || b.createdAt - a.createdAt,
    );
}
export const SEEDS = [
  [
    "Horta do amanhã",
    "Uma rede de hortas comunitárias com irrigação inteligente e oficinas abertas para cultivar alimentos e conhecimento.",
    "Sustentabilidade",
  ],
  [
    "Biblioteca sem fronteiras",
    "Transformar materiais educativos em uma biblioteca aberta, acessível e gratuita para toda a comunidade.",
    "Educação",
  ],
  [
    "Energia que conecta",
    "Conectar pequenos produtores de energia solar para compartilhar conhecimento e reduzir o desperdício de energia.",
    "Sustentabilidade",
  ],
  [
    "Código para todos",
    "Aulas abertas de programação com agentes tutores, exercícios acessíveis e projetos práticos para iniciantes.",
    "Tecnologia",
  ],
  [
    "Floresta de ideias",
    "Mapear árvores nativas e organizar mutirões de reflorestamento com a comunidade local e escolas públicas.",
    "Sustentabilidade",
  ],
  [
    "Mentes em movimento",
    "Encontros de jogos colaborativos e competições de digitação para aprender com diversão e inclusão digital.",
    "Comunidade",
  ],
  [
    "Oficina circular",
    "Criar uma oficina comunitária para reparar bicicletas, reaproveitar materiais e ensinar novas habilidades.",
    "Comunidade",
  ],
  [
    "Vozes do mundo",
    "Construir materiais de aprendizagem de idiomas com acesso gratuito, encontros culturais e práticas em grupo.",
    "Educação",
  ],
  [
    "Pontes digitais",
    "Criar ferramentas acessíveis para conectar voluntários a iniciativas públicas de impacto na comunidade.",
    "Tecnologia",
  ],
  [
    "Atlas dos cogumelos",
    "Um guia colaborativo e educativo sobre a biodiversidade dos fungos para escolas e exploradores curiosos.",
    "Educação",
  ],
];
export function initialProjects(): Project[] {
  return SEEDS.map(([name, description, category], i) =>
    analyze({
      id: `exemplo-${i + 1}`,
      name,
      description,
      category,
      createdAt: Date.UTC(2026, 0, 1 + i),
      votes: {},
      example: true,
    }),
  );
}
export function nftPrice(launchDate: string, now = Date.now()): number {
  const start = Date.parse(launchDate);
  if (!Number.isFinite(start) || now < start) return 5;
  return 5 * 1.01 ** Math.floor((now - start) / WEEK_MS);
}
export function nextFriday(now = new Date()): Date {
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() + ((5 - date.getUTCDay() + 7) % 7));
  date.setUTCHours(23, 59, 0, 0);
  if (date.getTime() <= now.getTime()) date.setUTCDate(date.getUTCDate() + 7);
  return date;
}
export function formatAmount(value: number, maximumFractionDigits = 4) {
  return value.toLocaleString("pt-BR", { maximumFractionDigits });
}
export function shortAddress(value: string) {
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}
export function validAddress(value: string) {
  return (
    /^0x[0-9a-fA-F]{40}$/.test(value) &&
    !/^0x0{40}$/i.test(value) &&
    !/^0x0{36}dead$/i.test(value)
  );
}
export function configIssue(
  c: LaunchConfig,
): { field: keyof LaunchConfig; message: string } | null {
  if (
    c.chainId &&
    (!/^\d+$/.test(c.chainId) ||
      !Number.isSafeInteger(Number(c.chainId)) ||
      Number(c.chainId) <= 0)
  )
    return {
      field: "chainId",
      message: "Informe um ID de rede inteiro e positivo.",
    };
  if (c.imdAddress && !validAddress(c.imdAddress))
    return {
      field: "imdAddress",
      message: "Informe um endereço válido para o contrato IMD.",
    };
  if (c.tokenAddress && !validAddress(c.tokenAddress))
    return {
      field: "tokenAddress",
      message: "Informe um endereço válido para o contrato 1MIND.",
    };
  if (
    c.imdAddress &&
    c.tokenAddress &&
    c.imdAddress.toLowerCase() === c.tokenAddress.toLowerCase()
  )
    return {
      field: "tokenAddress",
      message: "Os contratos IMD e 1MIND devem ser diferentes.",
    };
  if (
    c.launchDate &&
    (!Number.isFinite(Date.parse(c.launchDate)) ||
      new Date(c.launchDate).getUTCFullYear() < 2020)
  )
    return {
      field: "launchDate",
      message: "Informe uma data de lançamento válida, a partir de 2020.",
    };
  if (
    c.initialLiquidity &&
    (!Number.isFinite(Number(c.initialLiquidity)) ||
      Number(c.initialLiquidity) <= 0)
  )
    return {
      field: "initialLiquidity",
      message: "A liquidez inicial precisa ser maior que zero.",
    };
  return null;
}
export function validateConfig(c: LaunchConfig): string | null {
  return configIssue(c)?.message ?? null;
}
export function launchTemplate(c: LaunchConfig) {
  return {
    schema: "1mind.launch.v1",
    name: "1MIND",
    symbol: "1MIND",
    totalSupply: String(SUPPLY),
    decimals: 18,
    initialMarketCap: { amount: "2500", currency: "IMD" },
    initialLiquidityIMD: c.initialLiquidity || null,
    buyTaxBps: { total: 200, burn: 100, wallet: 50, staking: 50 },
    nft: {
      initialPrice: "5",
      currency: "1MIND",
      weeklyIncreaseBps: 100,
      launchDateUTC: c.launchDate ? new Date(c.launchDate).toISOString() : null,
      distribution: {
        dayUTC: "Friday",
        timeUTC: "23:59",
        winners: 3,
        eachWinnerBps: 1000,
        treasuryBps: 7000,
        treasury: TREASURY,
      },
    },
    eligibility: {
      minIMD: "10",
      min1MIND: "1",
      votesPerProjectPerWalletOrAgent: 1,
    },
    deployment: {
      chainId: c.chainId || null,
      imdAddress: c.imdAddress || null,
      tokenAddress: c.tokenAddress || null,
      status: "not-deployed-by-this-application",
    },
  };
}
export function download(
  name: string,
  content: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
