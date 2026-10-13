import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCheck,
  CircleHelp,
  Copy,
  ExternalLink,
  Flame,
  Globe2,
  Layers3,
  Leaf,
  Menu,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Wallet,
  X,
} from "lucide-react";
import {
  AGENTS,
  EMPTY_CONFIG,
  initialProjects,
  shortAddress,
  themes,
  validateConfig,
  type LaunchConfig,
  type Project,
  type Route,
  type Theme,
} from "./lib/domain";
import { useStored, STORAGE_EVENT } from "./lib/storage";
import {
  connect,
  readBalances,
  request,
  walletError,
  type Balances,
} from "./lib/wallet";
import { siteConfig } from "./site-config";
import { AgentFace, Mark } from "./components/Art";
import World from "./components/World";
import Modal from "./components/Modal";
import Projects, { ProjectRanking } from "./components/Projects";
import Tokenomics from "./components/Tokenomics";
import Nfts from "./components/Nfts";
import Launch from "./components/Launch";
const routes: { id: Route; label: string }[] = [
  { id: "inicio", label: "Início" },
  { id: "tokenomics", label: "Tokenomics" },
  { id: "explorar", label: "Explorar" },
  { id: "votar", label: "Votar" },
  { id: "nfts", label: "NFTs do enxame" },
];
function getRoute(): Route {
  const h = location.hash.replace("#", "");
  return [...routes.map((r) => r.id), "lancamento"].includes(h)
    ? (h as Route)
    : "inicio";
}
const isProjects = (v: unknown): v is Project[] =>
  Array.isArray(v) &&
  v.length <= 500 &&
  v.every(
    (p) =>
      p &&
      typeof p.id === "string" &&
      typeof p.name === "string" &&
      p.name.length <= 80 &&
      typeof p.description === "string" &&
      p.description.length <= 600 &&
      typeof p.category === "string" &&
      typeof p.createdAt === "number" &&
      typeof p.example === "boolean" &&
      p.votes &&
      typeof p.votes === "object" &&
      !Array.isArray(p.votes) &&
      Object.values(p.votes).every(
        (n) => typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 5,
      ),
  );
const isConfig = (v: unknown): v is LaunchConfig =>
  typeof v === "object" &&
  v !== null &&
  Object.keys(EMPTY_CONFIG).every(
    (k) => typeof (v as Record<string, unknown>)[k] === "string",
  ) &&
  validateConfig(v as LaunchConfig) === null;
const isCollection = (v: unknown): v is number[] =>
  Array.isArray(v) &&
  v.length <= AGENTS.length &&
  v.every((n) => AGENTS.includes(n)) &&
  new Set(v).size === v.length;
export default function App() {
  const [route, setRoute] = useState<Route>(getRoute),
    [menu, setMenu] = useState(false),
    [theme, setTheme] = useState<Theme>("nature"),
    [agent, setAgent] = useState<number | null>(null),
    [agentTab, setAgentTab] = useState("attributes");
  const [projects, setProjects] = useStored<Project[]>(
    "1mind-projects-v1",
    initialProjects(),
    isProjects,
  );
  const [config, setConfig] = useStored<LaunchConfig>(
    "1mind-launch-v1",
    validateConfig(siteConfig) === null ? siteConfig : EMPTY_CONFIG,
    isConfig,
  );
  const [collection, setCollection] = useStored<number[]>(
    "1mind-collection-v1",
    [],
    isCollection,
  );
  const [walletOpen, setWalletOpen] = useState(false),
    [address, setAddress] = useState(""),
    [chain, setChain] = useState(0),
    [balances, setBalances] = useState<Balances | null>(null),
    [walletBusy, setWalletBusy] = useState(false),
    [walletIssue, setWalletIssue] = useState("");
  const [notification, setNotification] = useState("");
  const generation = useRef(0),
    main = useRef<HTMLElement>(null),
    routeLoaded = useRef(false);
  const notify = useCallback((text: string) => setNotification(text), []);
  useEffect(() => {
    const onHash = () => {
      setRoute(getRoute());
      setMenu(false);
      setAgent(null);
      setWalletOpen(false);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  useEffect(() => {
    document.title = `${route === "inicio" ? "Uma mente. Infinitos mundos." : route === "lancamento" ? "Lançamento" : routes.find((r) => r.id === route)?.label} | 1MIND`;
    if (routeLoaded.current) {
      window.scrollTo({ top: 0, behavior: "instant" });
      main.current?.focus({ preventScroll: true });
    }
    routeLoaded.current = true;
  }, [route]);
  useEffect(() => {
    const fail = () =>
      notify(
        "O navegador bloqueou o armazenamento. Suas alterações duram apenas nesta sessão.",
      );
    window.addEventListener(STORAGE_EVENT, fail);
    return () => window.removeEventListener(STORAGE_EVENT, fail);
  }, [notify]);
  useEffect(() => {
    generation.current++;
    setBalances(null);
    setWalletBusy(false);
    setWalletIssue("");
  }, [config]);
  useEffect(() => {
    const provider = window.ethereum;
    if (!provider) return;
    const accounts = (...args: unknown[]) => {
      generation.current++;
      setWalletBusy(false);
      setBalances(null);
      const value = args[0];
      setAddress(
        Array.isArray(value) && typeof value[0] === "string" ? value[0] : "",
      );
      setWalletIssue(
        "A conta mudou. Atualize os saldos para verificar a elegibilidade.",
      );
      const run = generation.current;
      void request(provider, "eth_chainId")
        .then((value) => {
          if (
            run === generation.current &&
            typeof value === "string" &&
            /^0x[0-9a-f]+$/i.test(value)
          )
            setChain(Number(BigInt(value)));
        })
        .catch(() => {});
    };
    const changed = (...args: unknown[]) => {
      generation.current++;
      setWalletBusy(false);
      setBalances(null);
      setChain(typeof args[0] === "string" ? Number(args[0]) : 0);
      setWalletIssue(
        "A rede mudou. Atualize os saldos para verificar a elegibilidade.",
      );
    };
    const disconnected = () => {
      generation.current++;
      setWalletBusy(false);
      setAddress("");
      setBalances(null);
      setChain(0);
      setWalletIssue(
        "Carteira desconectada. Conecte novamente quando desejar.",
      );
    };
    provider.on?.("accountsChanged", accounts);
    provider.on?.("chainChanged", changed);
    provider.on?.("disconnect", disconnected);
    return () => {
      provider.removeListener?.("accountsChanged", accounts);
      provider.removeListener?.("chainChanged", changed);
      provider.removeListener?.("disconnect", disconnected);
    };
  }, []);
  async function connectWallet() {
    if (!window.ethereum) {
      setWalletIssue(
        "Nenhuma carteira detectada. Abra o site no navegador de uma carteira Ethereum ou instale uma extensão compatível.",
      );
      return;
    }
    const run = ++generation.current;
    setWalletBusy(true);
    setWalletIssue("");
    setBalances(null);
    try {
      const result = await connect(window.ethereum);
      if (run !== generation.current) return;
      setAddress(result.address);
      setChain(result.chain);
      if (config.chainId && config.imdAddress && config.tokenAddress) {
        const b = await readBalances(window.ethereum, result.address, config);
        if (run === generation.current) setBalances(b);
      }
    } catch (e) {
      if (run === generation.current) setWalletIssue(walletError(e));
    } finally {
      if (run === generation.current) setWalletBusy(false);
    }
  }
  async function refreshWallet() {
    if (!window.ethereum || !address) return;
    const run = ++generation.current;
    setWalletBusy(true);
    setWalletIssue("");
    setBalances(null);
    try {
      const accounts = await request(window.ethereum, "eth_accounts");
      if (
        !Array.isArray(accounts) ||
        String(accounts[0]).toLowerCase() !== address.toLowerCase()
      )
        throw new Error("A conta ativa mudou. Reconecte a carteira.");
      const b = await readBalances(window.ethereum, address, config);
      if (run === generation.current) setBalances(b);
    } catch (e) {
      if (run === generation.current) setWalletIssue(walletError(e));
    } finally {
      if (run === generation.current) setWalletBusy(false);
    }
  }
  async function switchNetwork() {
    if (!window.ethereum || !config.chainId) return;
    setWalletIssue("");
    try {
      await request(window.ethereum, "wallet_switchEthereumChain", [
        { chainId: `0x${Number(config.chainId).toString(16)}` },
      ]);
      setChain(Number(config.chainId));
      setBalances(null);
    } catch (e) {
      setWalletIssue(walletError(e));
    }
  }
  function openAgent(id: number) {
    setAgent(id);
    setAgentTab("attributes");
  }
  const walletPanel = () => setWalletOpen(true);
  return (
    <>
      <a
        className="skip-link"
        href="#conteudo"
        onClick={(e) => {
          e.preventDefault();
          main.current?.focus();
        }}
      >
        Pular para o conteúdo
      </a>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#inicio" aria-label="1MIND, início">
            <Mark />
            <span>
              1MIND<span className="brand-period">.</span>
            </span>
          </a>
          <nav className="desktop-nav" aria-label="Navegação principal">
            {routes.map((r) => (
              <a
                key={r.id}
                className={route === r.id ? "active" : ""}
                href={`#${r.id}`}
                aria-current={route === r.id ? "page" : undefined}
              >
                {r.label}
              </a>
            ))}
          </nav>
          <div className="header-actions">
            <button className="wallet-button" onClick={walletPanel}>
              <Wallet size={17} />
              <span>
                {address ? shortAddress(address) : "Conectar carteira"}
              </span>
            </button>
            <button
              className="icon-button menu-button"
              onClick={() => setMenu(!menu)}
              aria-label={menu ? "Fechar menu" : "Abrir menu"}
              aria-expanded={menu}
              aria-controls="mobile-navigation"
            >
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {menu && (
          <nav
            id="mobile-navigation"
            className="mobile-nav"
            aria-label="Navegação móvel"
          >
            {[...routes, { id: "lancamento", label: "Lançamento" }].map((r) => (
              <a
                key={r.id}
                className={route === r.id ? "active" : ""}
                href={`#${r.id}`}
                aria-current={route === r.id ? "page" : undefined}
              >
                {r.label}
                <ArrowUpRight size={16} />
              </a>
            ))}
          </nav>
        )}
      </header>
      <main id="conteudo" tabIndex={-1} ref={main}>
        {route === "inicio" && (
          <div className="home-page">
            <section className="home-intro">
              <div>
                <h1>
                  Uma mente.
                  <br />
                  <span>Infinitos mundos.</span>
                </h1>
                <p>
                  O token do ecossistema IMD para votar em projetos e colecionar
                  agentes.
                </p>
              </div>
              <div className="hero-action">
                <a className="button primary" href="#explorar">
                  Explorar o enxame
                  <ArrowUpRight size={18} />
                </a>
                <span className="small muted">
                  <i className="status-dot" />
                  Um universo para construir juntos
                </span>
              </div>
            </section>
            <div className="universe-layout">
              <World
                theme={theme}
                setTheme={setTheme}
                onAgent={openAgent}
                selectedAgent={agent}
              />
              <aside className="swarm-sidebar">
                <div className="sidebar-title">
                  <h2>O enxame</h2>
                  <span className="tag">Demonstração</span>
                </div>
                <div className="swarm-stat">
                  <strong>{AGENTS.length.toString().padStart(2, "0")}</strong>
                  <span>
                    agentes no
                    <br />
                    universo local
                  </span>
                  <span className="swarm-stat-icon">
                    <Users size={24} />
                  </span>
                </div>
                <div className="agent-avatars" aria-hidden="true">
                  {[0, 1, 2, 3, 4].map((n) => (
                    <div key={n}>
                      <AgentFace />
                    </div>
                  ))}
                  <span>+4</span>
                </div>
                <p className="small muted">
                  Um espaço para colaborar
                  <br />e aprender em comunidade.
                </p>
                <div className="sidebar-divider" />
                <h3>Acontecendo por aqui</h3>
                <div className="activity-list">
                  <div>
                    <span className="activity-icon green">
                      <Leaf size={17} />
                    </span>
                    <p>
                      <strong>Agente #47</strong>
                      <span>Cuidando de novas ideias</span>
                    </p>
                  </div>
                  <div>
                    <span className="activity-icon purple">
                      <Star size={17} />
                    </span>
                    <p>
                      <strong>Avaliação coletiva</strong>
                      <span>{projects.length} projetos para conhecer</span>
                    </p>
                  </div>
                  <div>
                    <span className="activity-icon orange">
                      <Sparkles size={17} />
                    </span>
                    <p>
                      <strong>Seu próximo encontro</strong>
                      <span>Selecione um agente no mapa</span>
                    </p>
                  </div>
                </div>
                <a className="sidebar-link" href="#votar">
                  Fazer parte das decisões
                  <ArrowUpRight size={17} />
                </a>
              </aside>
            </div>
            <section className="home-stats" aria-label="1MIND em números">
              <div>
                <span className="stat-symbol">
                  <Layers3 size={21} />
                </span>
                <div>
                  <span>Oferta total</span>
                  <strong>
                    1 bilhão <small>1MIND</small>
                  </strong>
                </div>
              </div>
              <div>
                <span className="stat-symbol">
                  <Globe2 size={21} />
                </span>
                <div>
                  <span>Capitalização inicial</span>
                  <strong>
                    2.500 <small>IMD</small>
                  </strong>
                  <span>
                    Liquidez inicial:{" "}
                    {config.initialLiquidity
                      ? `${Number(config.initialLiquidity).toLocaleString("pt-BR")} IMD`
                      : "a definir"}
                  </span>
                </div>
              </div>
              <div>
                <span className="stat-symbol">
                  <Flame size={21} />
                </span>
                <div>
                  <span>Taxa de compra</span>
                  <strong>
                    2% <small>com 1% de queima</small>
                  </strong>
                </div>
              </div>
              <a href="#tokenomics" className="stats-link">
                Conhecer a<br />
                tokenomics
                <ArrowUpRight size={23} />
              </a>
            </section>
            <section className="home-community">
              <div className="section-heading">
                <div>
                  <h2>O futuro tem muitas mentes.</h2>
                  <p>Explore, participe e encontre seu lugar no enxame.</p>
                </div>
                <span className="community-spark" aria-hidden="true">
                  <Sparkles size={28} />
                </span>
              </div>
              <div className="community-grid">
                <a href="#votar" className="community-item">
                  <span className="community-index">01 / Participe</span>
                  <div className="community-icon">
                    <Star size={27} />
                  </div>
                  <h3>Escolha ideias para o futuro.</h3>
                  <p>Avalie projetos e ajude a dar direção à comunidade.</p>
                  <span className="text-button">
                    Escolher projetos
                    <ArrowUpRight size={18} />
                  </span>
                </a>
                <a href="#nfts" className="community-item">
                  <span className="community-index">02 / Colecione</span>
                  <div className="community-icon">
                    <Users size={27} />
                  </div>
                  <h3>Encontre seu agente.</h3>
                  <p>
                    Conheça os rostos do enxame e a proposta de recompensas
                    semanais.
                  </p>
                  <span className="text-button">
                    Explorar NFTs
                    <ArrowUpRight size={18} />
                  </span>
                </a>
                <a href="#lancamento" className="community-item">
                  <span className="community-index">03 / Construa</span>
                  <div className="community-icon">
                    <Rocket size={27} />
                  </div>
                  <h3>O começo de uma nova órbita.</h3>
                  <p>Veja os parâmetros do 1MIND e prepare o próximo passo.</p>
                  <span className="text-button">
                    Ver lançamento
                    <ArrowUpRight size={18} />
                  </span>
                </a>
              </div>
            </section>
          </div>
        )}
        {route === "explorar" && (
          <div className="page-inner explore-page">
            <div className="page-heading">
              <div>
                <h1>Encontre sua próxima conexão.</h1>
                <p>Três mundos, nove agentes e espaço para novas ideias.</p>
              </div>
              <a className="text-button" href="#votar">
                Ver projetos da comunidade
                <ArrowUpRight size={18} />
              </a>
            </div>
            <World
              theme={theme}
              setTheme={setTheme}
              onAgent={openAgent}
              selectedAgent={agent}
              full
            />
            <div className="explore-bottom">
              <div>
                <h2>Pequenas ações. Mundos melhores.</h2>
                <p>
                  Os agentes se movem, cultivam, ensinam e também se divertem.
                  Selecione um para ver seus atributos e os dez projetos mais
                  bem avaliados.
                </p>
              </div>
              <div className="explore-legend">
                <span>
                  <Leaf size={18} />
                  Atividades da comunidade
                </span>
                <span>
                  <Sparkles size={18} />
                  Tempo para se divertir
                </span>
                <span>
                  <CircleHelp size={18} />
                  Simulação local, sem LLM conectado
                </span>
              </div>
            </div>
          </div>
        )}
        {route === "tokenomics" && <Tokenomics />}
        {route === "votar" && (
          <Projects
            projects={projects}
            setProjects={setProjects}
            walletAddress={address}
            eligible={balances?.eligible || false}
            onWallet={walletPanel}
            notify={notify}
          />
        )}
        {route === "nfts" && (
          <Nfts
            config={config}
            collection={collection}
            setCollection={setCollection}
            notify={notify}
          />
        )}
        {route === "lancamento" && (
          <Launch config={config} setConfig={setConfig} notify={notify} />
        )}
      </main>
      <footer className="site-footer">
        <div>
          <a className="brand" href="#inicio">
            <Mark />
            <span>1MIND.</span>
          </a>
          <span className="small muted">
            Inteligência coletiva. Possibilidades compartilhadas.
          </span>
        </div>
        <div className="footer-links">
          <a href="#lancamento">
            Lançamento
            <ArrowUpRight size={15} />
          </a>
          <a href="#tokenomics">
            Economia do token
            <ArrowUpRight size={15} />
          </a>
        </div>
        <p className="footer-note">
          Pré-lançamento · Projetos, votos e coleção demonstrativos, salvos
          neste navegador. Nenhuma transação é enviada.
        </p>
      </footer>
      <div
        className={`toast ${notification ? "visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        {notification && (
          <>
            <CheckCheck size={20} />
            <span>{notification}</span>
            <button
              className="icon-button"
              onClick={() => setNotification("")}
              aria-label="Dispensar mensagem"
            >
              <X size={18} />
            </button>
          </>
        )}
      </div>
      {agent !== null && (
        <Modal
          title={`Conheça o Agente #${agent}`}
          onClose={() => setAgent(null)}
          className="agent-modal"
        >
          <div className="agent-profile">
            <div className="profile-face">
              <AgentFace large active />
            </div>
            <div>
              <h3>Agente #{agent}</h3>
              <span className="status-label">
                <i className="status-dot" />
                Olhos em você
              </span>
              <p className="small muted">{themes[theme].name}</p>
            </div>
          </div>
          <div
            className="modal-tabs"
            role="tablist"
            aria-label="Informações do agente"
          >
            {[
              { id: "attributes", name: "Atributos" },
              { id: "projects", name: "Projetos" },
            ].map((tab, i) => (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                role="tab"
                aria-selected={agentTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                tabIndex={agentTab === tab.id ? 0 : -1}
                onClick={() => setAgentTab(tab.id)}
                onKeyDown={(e) => {
                  if (
                    ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)
                  ) {
                    e.preventDefault();
                    const next =
                      e.key === "Home"
                        ? "attributes"
                        : e.key === "End"
                          ? "projects"
                          : i === 0
                            ? "projects"
                            : "attributes";
                    setAgentTab(next);
                    document.getElementById(`tab-${next}`)?.focus();
                  }
                }}
              >
                {tab.name}
                {tab.id === "projects" && <span>10</span>}
              </button>
            ))}
          </div>
          {agentTab === "attributes" ? (
            <div
              id="panel-attributes"
              role="tabpanel"
              aria-labelledby="tab-attributes"
              tabIndex={0}
            >
              <dl className="agent-attributes">
                <div>
                  <dt>Identificação</dt>
                  <dd>Agente #{agent}</dd>
                </div>
                <div>
                  <dt>Modelo LLM</dt>
                  <dd>Não conectado</dd>
                </div>
                <div>
                  <dt>Estado na simulação</dt>
                  <dd>
                    <span className={`tag ${agent % 2 ? "available" : "busy"}`}>
                      {agent % 2 ? "Disponível" : "Ocupado"}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>Atividade agora</dt>
                  <dd>Pausada para conversar</dd>
                </div>
                <div>
                  <dt>Mundo</dt>
                  <dd>{themes[theme].name}</dd>
                </div>
              </dl>
              <p className="note-block small">
                Este agente é uma simulação visual. As avaliações usam critérios
                locais de clareza e impacto, sem chamadas a um modelo de IA.
              </p>
              <button
                className="button primary full-width"
                onClick={() => setAgentTab("projects")}
              >
                Descobrir projetos
                <ArrowRight size={17} />
              </button>
            </div>
          ) : (
            <div
              id="panel-projects"
              role="tabpanel"
              aria-labelledby="tab-projects"
              tabIndex={0}
            >
              <p className="small muted">
                Os 10 projetos com melhor média na votação local.
              </p>
              <ProjectRanking projects={projects} />
              <a
                href="#votar"
                className="button primary full-width"
                onClick={() => setAgent(null)}
              >
                Participar da votação
                <ArrowUpRight size={17} />
              </a>
            </div>
          )}
        </Modal>
      )}
      {walletOpen && (
        <Modal
          title={address ? "Sua carteira" : "Conecte sua carteira"}
          onClose={() => setWalletOpen(false)}
        >
          <div className="wallet-intro-icon">
            <Wallet size={30} />
          </div>
          {!address ? (
            <>
              <p className="muted">
                Use uma carteira compatível com Ethereum para consultar sua
                conta e verificar a elegibilidade de voto.
              </p>
              <div className="note-block">
                <ShieldCheck size={20} />
                <p>
                  A conexão solicita apenas acesso ao endereço e à rede. Nenhuma
                  assinatura ou transferência será solicitada.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="connected-address">
                <span className="small muted">Endereço conectado</span>
                <code>{address}</code>
                <button
                  className="text-button"
                  onClick={() => {
                    void navigator.clipboard.writeText(address).then(
                      () => notify("Endereço copiado."),
                      () => notify("Selecione o endereço para copiá-lo."),
                    );
                  }}
                >
                  <Copy size={15} />
                  Copiar endereço
                </button>
              </div>
              <div className="wallet-network">
                <span>Rede da carteira</span>
                <strong>ID {chain}</strong>
              </div>
              {config.chainId && chain !== Number(config.chainId) && (
                <div className="note-block">
                  <p>
                    Troque para a rede ID {config.chainId} para consultar os
                    tokens configurados.
                  </p>
                  <button
                    className="button secondary"
                    onClick={() => void switchNetwork()}
                  >
                    Trocar rede
                    <ExternalLink size={16} />
                  </button>
                </div>
              )}
              {balances && (
                <div className="wallet-balances">
                  <div>
                    <span>Saldo IMD</span>
                    <strong>{balances.imd} IMD</strong>
                  </div>
                  <div>
                    <span>Saldo 1MIND</span>
                    <strong>{balances.mind} 1MIND</strong>
                  </div>
                  <p className={balances.eligible ? "success-inline" : "muted"}>
                    {balances.eligible ? (
                      <>
                        <Check size={17} />
                        Elegível para a demonstração de voto.
                      </>
                    ) : (
                      "Saldo insuficiente. É necessário ter 10 IMD ou 1 1MIND."
                    )}
                  </p>
                </div>
              )}
            </>
          )}
          {(!config.chainId || !config.imdAddress || !config.tokenAddress) && (
            <p className="small muted">
              Os contratos ainda não estão configurados. É possível conectar o
              endereço; a consulta de saldos depende dos{" "}
              <a href="#lancamento" onClick={() => setWalletOpen(false)}>
                parâmetros de lançamento
              </a>
              .
            </p>
          )}
          {walletIssue && (
            <p className="inline-error" role="alert">
              {walletIssue}
            </p>
          )}
          <button
            className="button primary full-width"
            onClick={() => void (address ? refreshWallet() : connectWallet())}
            disabled={walletBusy}
          >
            {walletBusy ? (
              <>
                <span className="spinner" />
                Consultando carteira…
              </>
            ) : address ? (
              "Atualizar saldos"
            ) : (
              <>
                <Wallet size={17} />
                Conectar carteira
              </>
            )}
          </button>
          {address && (
            <button
              className="text-button centered"
              onClick={() => {
                generation.current++;
                setWalletBusy(false);
                setAddress("");
                setBalances(null);
                setChain(0);
                setWalletIssue("");
              }}
            >
              Desconectar deste site
            </button>
          )}
          <p className="small muted wallet-footnote">
            1 voto por projeto e carteira com pelo menos 10 IMD ou 1 1MIND. A
            votação desta versão é local.
          </p>
        </Modal>
      )}
    </>
  );
}
