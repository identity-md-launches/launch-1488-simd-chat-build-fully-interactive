import { useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleHelp,
  Lightbulb,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import {
  addVote,
  AGENTS,
  analyze,
  average,
  sortedProjects,
  type Project,
} from "../lib/domain";
import Modal from "./Modal";
export function Rating({ value, count }: { value: number; count?: number }) {
  return (
    <span className="rating">
      <Star size={15} fill="currentColor" />
      <strong>{value.toFixed(1).replace(".", ",")}</strong>
      {count !== undefined && <small>({count})</small>}
    </span>
  );
}
export function ProjectRanking({
  projects,
  limit = 10,
}: {
  projects: Project[];
  limit?: number;
}) {
  return (
    <ol className="project-ranking">
      {sortedProjects(projects, "rating")
        .slice(0, limit)
        .map((p, i) => (
          <li key={p.id}>
            <span className="rank-number">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span>{p.name}</span>
            <Rating value={average(p)} />
          </li>
        ))}
    </ol>
  );
}
export default function Projects({
  projects,
  setProjects,
  walletAddress,
  eligible,
  onWallet,
  notify,
}: {
  projects: Project[];
  setProjects: (
    value: Project[] | ((previous: Project[]) => Project[]),
  ) => void;
  walletAddress: string;
  eligible: boolean;
  onWallet: () => void;
  notify: (s: string) => void;
}) {
  const [search, setSearch] = useState(""),
    [sort, setSort] = useState("rating"),
    [showCreate, setShowCreate] = useState(false),
    [selected, setSelected] = useState<string | null>(null),
    [rating, setRating] = useState(0),
    [error, setError] = useState(""),
    [created, setCreated] = useState(false),
    [how, setHow] = useState(false);
  const [mode, setMode] = useState<"demo" | "wallet">("demo");
  const visible = sortedProjects(projects, sort, search);
  const project = projects.find((p) => p.id === selected);
  const voter =
    mode === "wallet"
      ? `wallet:${walletAddress.toLowerCase()}`
      : "demo:visitante";
  function openVote(p: Project) {
    setSelected(p.id);
    setRating(0);
    setError("");
  }
  function vote() {
    if (!project) return;
    if (mode === "wallet" && (!walletAddress || !eligible)) {
      setSelected(null);
      onWallet();
      return;
    }
    try {
      const updated = addVote(project, voter, rating);
      setProjects((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p)),
      );
      setSelected(null);
      notify("Avaliação salva neste navegador. Obrigado por participar.");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") || "").trim(),
      description = String(data.get("description") || "").trim();
    if (name.length < 4 || description.length < 30) {
      setError("Use pelo menos 4 caracteres no nome e 30 na descrição.");
      return;
    }
    const p = analyze({
      id: crypto.randomUUID(),
      name,
      description,
      category: String(data.get("category")),
      createdAt: Date.now(),
      votes: {},
      example: false,
    });
    setProjects((previous) => [p, ...previous]);
    setShowCreate(false);
    setCreated(true);
    setSort("recent");
    setSearch("");
    notify("Projeto criado e avaliado pelos 9 agentes da simulação.");
  }
  return (
    <div className="page-inner">
      <div className="page-heading">
        <div>
          <h1>Boas ideias merecem voz.</h1>
          <p>Escolha os projetos que ajudam nossa comunidade a crescer.</p>
        </div>
        <button
          className="button primary"
          onClick={() => {
            setShowCreate(true);
            setError("");
          }}
        >
          <Plus size={18} />
          Criar projeto
        </button>
      </div>
      <div className="eligibility-banner">
        <ShieldCheck size={27} />
        <div>
          <strong>Seu voto faz parte do futuro.</strong>
          <p>
            1 voto por projeto e carteira com pelo menos{" "}
            <b>10 IMD ou 1 1MIND</b>, ou 1 voto por agente de IA.
          </p>
        </div>
        <button className="button secondary" onClick={onWallet}>
          {walletAddress ? "Ver elegibilidade" : "Conectar carteira"}
          <ArrowUpRight size={17} />
        </button>
      </div>
      <div className="projects-layout">
        <section className="projects-main" aria-label="Projetos da comunidade">
          <div className="project-controls">
            <label className="search-field">
              <Search size={18} />
              <input
                type="search"
                placeholder="Buscar um projeto"
                aria-label="Buscar projetos"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  className="icon-button"
                  aria-label="Limpar busca"
                  onClick={() => setSearch("")}
                >
                  <X size={16} />
                </button>
              )}
            </label>
            <label className="sort-field">
              <span className="sr-only">Ordenar projetos</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Ordenar projetos"
              >
                <option value="rating">Mais bem avaliados</option>
                <option value="recent">Criados recentemente</option>
                <option disabled>Mais populares · em breve</option>
                <option disabled>Em alta · em breve</option>
              </select>
            </label>
          </div>
          <div className="local-note">
            <span>
              <i className="status-dot" />
              Votação demonstrativa
            </span>
            <button
              className="text-button"
              onClick={() => setHow(!how)}
              aria-expanded={how}
            >
              <CircleHelp size={15} />
              Como funciona
            </button>
          </div>
          {how && (
            <div className="note-block">
              <p>
                Os projetos de exemplo e todos os novos votos ficam apenas neste
                navegador. Cada participante pode avaliar cada projeto uma vez.
                A identidade e a unicidade globais precisam de um contrato ou
                serviço compartilhado.
              </p>
              <p>
                Os {AGENTS.length} agentes usam critérios locais de clareza e
                impacto comunitário, sem consultar um LLM. O selo de agente não
                representa uma IA autenticada.
              </p>
            </div>
          )}
          {created && (
            <p className="success-inline" role="status">
              <Check size={17} />
              Seu projeto está na lista. Os agentes já concluíram a avaliação
              local.
            </p>
          )}
          <table className="projects-table">
            <thead>
              <tr>
                <th scope="col">Projeto / descrição</th>
                <th scope="col">Avaliação</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p, i) => (
                <tr key={p.id}>
                  <td>
                    <button
                      className="project-open"
                      onClick={() => openVote(p)}
                    >
                      <span className={`project-icon color-${i % 4}`}>
                        <Lightbulb size={21} />
                      </span>
                      <span>
                        <strong>{p.name}</strong>
                        <span className="project-description">
                          {p.description}
                        </span>
                        <span className="project-meta">
                          {p.category} ·{" "}
                          {p.example ? "Exemplo" : "Criado neste navegador"}
                        </span>
                      </span>
                    </button>
                  </td>
                  <td>
                    <button
                      className="rate-open"
                      onClick={() => openVote(p)}
                      aria-label={`Avaliar ${p.name}`}
                    >
                      <Rating
                        value={average(p)}
                        count={Object.keys(p.votes).length}
                      />
                      <span>
                        {p.votes["demo:visitante"] ? "Avaliado" : "Avaliar"}
                        <ChevronRight size={14} />
                      </span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 && (
            <div className="empty-state">
              <Search size={30} />
              <h3>Nenhum projeto encontrado</h3>
              <p>Tente outra palavra ou veja todas as ideias.</p>
              <button
                className="button secondary"
                onClick={() => setSearch("")}
              >
                Limpar busca
              </button>
            </div>
          )}
          <p className="small muted table-foot">
            {visible.length} {visible.length === 1 ? "projeto" : "projetos"} ·
            As médias incluem as avaliações dos agentes locais.
          </p>
        </section>
        <aside className="voting-aside">
          <div className="aside-icon">
            <Sparkles size={28} />
          </div>
          <h2>A inteligência é coletiva.</h2>
          <p>Gente e agentes de IA, participando da mesma conversa.</p>
          <div className="voting-steps">
            <div>
              <span>01</span>
              <p>Conheça a proposta e seu impacto.</p>
            </div>
            <div>
              <span>02</span>
              <p>Avalie de 1 a 5 estrelas.</p>
            </div>
            <div>
              <span>03</span>
              <p>Acompanhe as ideias que ganham força.</p>
            </div>
          </div>
          <a className="text-button" href="#explorar">
            Conhecer os agentes
            <ArrowUpRight size={16} />
          </a>
        </aside>
      </div>
      {showCreate && (
        <Modal
          title="Compartilhe sua ideia"
          onClose={() => setShowCreate(false)}
        >
          <p className="muted">
            Crie um projeto demonstrativo. Ele será salvo neste navegador e
            avaliado pelos agentes locais.
          </p>
          <form className="form-stack" onSubmit={create}>
            <label>
              Nome do projeto
              <input
                name="name"
                required
                minLength={4}
                maxLength={80}
                placeholder="Como sua ideia se chama?"
                autoFocus
              />
            </label>
            <label>
              Categoria
              <select name="category" aria-label="Categoria">
                <option>Comunidade</option>
                <option>Educação</option>
                <option>Sustentabilidade</option>
                <option>Tecnologia</option>
              </select>
            </label>
            <label>
              Descrição
              <textarea
                name="description"
                required
                minLength={30}
                maxLength={600}
                rows={4}
                placeholder="Conte o objetivo, quem será beneficiado e como a ideia funciona."
              />
            </label>
            {error && (
              <p className="inline-error" role="alert">
                {error}
              </p>
            )}
            <button className="button primary" type="submit">
              <Plus size={18} />
              Criar e avaliar projeto
            </button>
          </form>
        </Modal>
      )}
      {project && (
        <Modal title={project.name} onClose={() => setSelected(null)}>
          <span className="tag">{project.category}</span>
          <p className="project-detail">{project.description}</p>
          <div className="vote-summary">
            <Rating
              value={average(project)}
              count={Object.keys(project.votes).length}
            />
            <span className="small muted">Média das avaliações locais</span>
          </div>
          <div className="segmented">
            <button
              aria-pressed={mode === "demo"}
              onClick={() => {
                setMode("demo");
                setError("");
              }}
            >
              Experimentar voto
            </button>
            <button
              aria-pressed={mode === "wallet"}
              onClick={() => {
                setMode("wallet");
                setError("");
              }}
            >
              Usar carteira
            </button>
          </div>
          <p className="small muted">
            {mode === "demo"
              ? "Um voto de demonstração por projeto neste navegador."
              : walletAddress
                ? eligible
                  ? "Saldo elegível consultado. O voto ainda será apenas local."
                  : "Consulte seus saldos para verificar a elegibilidade."
                : "Conecte uma carteira e verifique se você tem 10 IMD ou 1 1MIND."}
          </p>
          {project.votes[voter] ? (
            <div className="success-inline">
              <Check size={18} />
              Você já avaliou este projeto com {project.votes[voter]} estrelas.
            </div>
          ) : (
            <>
              <fieldset className="star-field">
                <legend>Qual é a sua avaliação?</legend>
                <div>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <label key={n} className={n <= rating ? "filled" : ""}>
                      <input
                        type="radio"
                        name="stars"
                        value={n}
                        checked={rating === n}
                        onChange={() => {
                          setRating(n);
                          setError("");
                        }}
                        aria-label={`${n} ${n === 1 ? "estrela" : "estrelas"}`}
                      />
                      <Star
                        size={32}
                        fill={n <= rating ? "currentColor" : "none"}
                      />
                    </label>
                  ))}
                </div>
                <span className="small muted">
                  {rating
                    ? [
                        "",
                        "Precisa amadurecer",
                        "Pode melhorar",
                        "Boa ideia",
                        "Muito promissor",
                        "Excelente iniciativa",
                      ][rating]
                    : "Selecione de 1 a 5 estrelas"}
                </span>
              </fieldset>
              {error && (
                <p className="inline-error" role="alert">
                  {error}
                </p>
              )}
              <button className="button primary full-width" onClick={vote}>
                {mode === "wallet" && (!walletAddress || !eligible) ? (
                  <>
                    {walletAddress ? "Ver elegibilidade" : "Conectar carteira"}
                    <ArrowUpRight size={17} />
                  </>
                ) : (
                  <>
                    Confirmar avaliação
                    <Check size={17} />
                  </>
                )}
              </button>
            </>
          )}
          <details className="agent-votes">
            <summary>Ver avaliações dos agentes ({AGENTS.length})</summary>
            {AGENTS.map((id) => (
              <div key={id}>
                <span>Agente #{id}</span>
                <Rating value={project.votes[`agent:${id}`] || 0} />
              </div>
            ))}
          </details>
        </Modal>
      )}
    </div>
  );
}
