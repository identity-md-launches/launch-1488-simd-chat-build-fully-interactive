import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  Download,
  Gift,
  Layers3,
  Sparkles,
  Ticket,
  Wallet,
} from "lucide-react";
import {
  AGENTS,
  download,
  formatAmount,
  nextFriday,
  nftPrice,
  TREASURY,
  shortAddress,
  type LaunchConfig,
} from "../lib/domain";
import { AgentFace } from "./Art";
import Modal from "./Modal";
import { parseHistory, type RewardRound } from "../lib/rewards";
export default function Nfts({
  config,
  collection,
  setCollection,
  notify,
}: {
  config: LaunchConfig;
  collection: number[];
  setCollection: (v: number[]) => void;
  notify: (s: string) => void;
}) {
  const [showAll, setShowAll] = useState(false),
    [filter, setFilter] = useState("all"),
    [selected, setSelected] = useState<number | null>(null),
    [success, setSuccess] = useState(false),
    [now, setNow] = useState(Date.now()),
    [agree, setAgree] = useState(false),
    [error, setError] = useState("");
  const art = useRef<HTMLDivElement>(null);
  const [rounds, setRounds] = useState<RewardRound[]>([]),
    [roundDate, setRoundDate] = useState(""),
    [historyState, setHistoryState] = useState<"loading" | "ready" | "error">(
      "loading",
    ),
    [retry, setRetry] = useState(0);
  const currentRound = rounds.find((r) => r.date === roundDate) || rounds[0];
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setHistoryState("loading");
    const timer = setTimeout(() => controller.abort(), 10000);
    fetch(new URL("data/distributions.json", document.baseURI), {
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error("Histórico indisponível");
        return r.json();
      })
      .then((data) => {
        const result = parseHistory(data);
        setRounds(result);
        setRoundDate(result[0]?.date || "");
        setHistoryState("ready");
      })
      .catch(() => {
        if (active) setHistoryState("error");
      })
      .finally(() => clearTimeout(timer));
    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [retry]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  const price = nftPrice(config.launchDate, now),
    deadline = nextFriday(new Date(now));
  const ids = filter === "mine" ? collection : showAll ? AGENTS : [47, 12, 82];
  function reserve() {
    if (!agree) {
      setError("Confirme que esta é uma coleção demonstrativa.");
      return;
    }
    if (selected === null) return;
    setCollection([...new Set([...collection, selected])]);
    setSuccess(true);
    notify("Agente adicionado à coleção demonstrativa deste navegador.");
  }
  function saveImage() {
    const inner = art.current?.querySelector("svg")?.outerHTML || "";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect width="600" height="600" rx="32" fill="#b9cee0"/><circle cx="300" cy="265" r="188" fill="#d4e2e6"/><svg x="145" y="100" width="310" height="365" viewBox="0 0 100 116">${inner}</svg><text x="32" y="50" font-family="sans-serif" font-size="25" fill="#233732">1MIND · Coleção demonstrativa</text><text x="568" y="552" text-anchor="end" font-family="sans-serif" font-size="32" font-weight="bold" fill="#233732">Agente #${selected}</text></svg>`;
    download(`1mind-agente-${selected}.svg`, svg, "image/svg+xml");
  }
  return (
    <div className="page-inner">
      <div className="page-heading">
        <div>
          <h1>Um agente. Parte de você.</h1>
          <p>
            Os rostos do enxame, em uma coleção que conecta toda a comunidade.
          </p>
        </div>
        <div className="nft-price">
          <span className="muted">
            {config.launchDate ? "Preço calculado" : "Preço inicial previsto"}
          </span>
          <strong>
            {formatAmount(price)} <small>1MIND / NFT</small>
          </strong>
        </div>
      </div>
      <div className="collection-controls">
        <div className="segmented">
          <button
            aria-pressed={filter === "all"}
            onClick={() => setFilter("all")}
          >
            O enxame
          </button>
          <button
            aria-pressed={filter === "mine"}
            onClick={() => setFilter("mine")}
          >
            Minha coleção ({collection.length})
          </button>
        </div>
        <span className="small muted">+1% por semana após o lançamento</span>
      </div>
      <div className="nft-grid">
        {ids.map((id, i) => (
          <article key={id} className="nft-card">
            <button
              className={`nft-art nft-color-${i % 3}`}
              onClick={() => {
                setSelected(id);
                setSuccess(collection.includes(id));
                setAgree(false);
                setError("");
              }}
              aria-label={`Conhecer NFT Agente #${id}`}
            >
              <span className="nft-brand">1MIND</span>
              <span className="nft-orbit" />
              <AgentFace large active />
              <span className="nft-number">#{String(id).padStart(3, "0")}</span>
            </button>
            <div className="nft-card-info">
              <div>
                <h2>Agente #{id}</h2>
                <span className="small muted">Coleção de origem</span>
              </div>
              <div className="nft-card-price">
                <strong>{formatAmount(price)} 1MIND</strong>
                <span className="small muted">
                  {collection.includes(id)
                    ? "Na coleção local"
                    : "Pré-lançamento"}
                </span>
              </div>
            </div>
            <button
              className="button secondary full-width"
              onClick={() => {
                setSelected(id);
                setSuccess(collection.includes(id));
                setAgree(false);
                setError("");
              }}
            >
              {collection.includes(id) ? "Ver meu agente" : "Conhecer agente"}
              <ArrowUpRight size={17} />
            </button>
          </article>
        ))}
      </div>
      {ids.length === 0 && (
        <div className="empty-state">
          <Layers3 size={32} />
          <h2>Seu enxame começa aqui.</h2>
          <p>Explore os agentes e experimente uma reserva demonstrativa.</p>
          <button className="button secondary" onClick={() => setFilter("all")}>
            Explorar coleção
          </button>
        </div>
      )}
      {filter === "all" && (
        <div className="center">
          <button className="text-button" onClick={() => setShowAll(!showAll)}>
            {showAll ? "Mostrar seleção" : "Ver todos os 9 agentes"}
            <ChevronDown size={17} />
          </button>
        </div>
      )}
      <p className="collection-note">
        <Ticket size={17} />
        Coleção de demonstração. As compras com tokens serão abertas após a
        implantação dos contratos.
      </p>
      <section className="nft-utility">
        <div className="utility-art" aria-hidden="true">
          <div className="utility-coin">
            <Sparkles size={38} />
          </div>
          <span className="utility-ring" />
        </div>
        <div>
          <h2>Mais que um rosto.</h2>
          <p>
            Os NFTs darão acesso à participação na distribuição semanal de
            1MIND: 30% das vendas da semana serão divididos entre 3 usuários
            sorteados, com 10% para cada um.
          </p>
          <span className="tag">
            <Sparkles size={14} />
            Novas utilidades estão no horizonte
          </span>
        </div>
        <div className="utility-stat">
          <strong>30%</strong>
          <span>
            das vendas semanais
            <br />
            para a comunidade
          </span>
        </div>
      </section>
      <section className="rewards-section">
        <div className="section-heading">
          <div>
            <h2>Uma sexta-feira para compartilhar.</h2>
            <p>
              Toda sexta-feira, às 23:59 UTC, três participantes recebem uma
              parte.
            </p>
          </div>
          <div className="next-draw">
            <CalendarDays size={20} />
            <div>
              <span className="small muted">Próxima janela prevista</span>
              <strong>
                {deadline.toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  timeZone: "UTC",
                })}{" "}
                · 23:59 UTC
              </strong>
            </div>
          </div>
        </div>
        <div className="distribution-bar">
          <span>30% · comunidade</span>
          <span>70% · carteira do projeto</span>
        </div>
        <div className="reward-details">
          <div>
            <Gift size={20} />
            <p>
              <strong>3 usuários. 10% para cada.</strong>
              <span>
                A seleção aleatória e os pagamentos dependem de contratos, fonte
                de aleatoriedade verificável e execução agendada.
              </span>
            </p>
          </div>
          <div>
            <Wallet size={20} />
            <p>
              <strong>Destino fixo dos 70%</strong>
              <code>{TREASURY}</code>
              <button
                className="text-button"
                onClick={() => {
                  void navigator.clipboard.writeText(TREASURY).then(
                    () => notify("Endereço copiado."),
                    () =>
                      notify(
                        "Não foi possível copiar. Selecione o endereço para copiá-lo.",
                      ),
                  );
                }}
              >
                Copiar endereço
                <ArrowUpRight size={14} />
              </button>
            </p>
          </div>
        </div>
        <div className="history-heading">
          <h3>Últimos contemplados</h3>
          <label>
            <span className="sr-only">Data da distribuição</span>
            <select
              aria-label="Data da distribuição"
              value={roundDate}
              onChange={(e) => setRoundDate(e.target.value)}
            >
              {rounds.length ? (
                rounds.map((r) => (
                  <option key={r.date} value={r.date}>
                    {new Date(r.date).toLocaleString("pt-BR", {
                      timeZone: "UTC",
                    })}{" "}
                    UTC
                  </option>
                ))
              ) : (
                <option value="">Nenhuma distribuição registrada</option>
              )}
            </select>
          </label>
        </div>
        {historyState === "loading" ? (
          <p role="status" className="small muted">
            Carregando histórico publicado…
          </p>
        ) : historyState === "error" ? (
          <div className="note-block">
            <p role="alert">
              Não foi possível carregar o histórico. Verifique a conexão e tente
              novamente.
            </p>
            <button
              className="button secondary"
              onClick={() => setRetry((n) => n + 1)}
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <>
            <div className="winners-grid">
              {[1, 2, 3].map((n) => {
                const winner = currentRound?.winners[n - 1];
                return (
                  <div className="winner-empty" key={n}>
                    <span className="winner-place">0{n}</span>
                    <div>
                      <strong>
                        {winner ? (
                          <abbr title={winner.address}>
                            {shortAddress(winner.address)}
                          </abbr>
                        ) : (
                          "Aguardando primeiro sorteio"
                        )}
                      </strong>
                      <span className="small muted">
                        {winner
                          ? `${winner.amount} 1MIND`
                          : "Carteira e recompensa aparecerão aqui."}
                      </span>
                      {winner && (
                        <button
                          className="text-button"
                          onClick={() =>
                            void navigator.clipboard
                              .writeText(winner.address)
                              .then(
                                () => notify("Carteira copiada."),
                                () =>
                                  notify("Não foi possível copiar a carteira."),
                              )
                          }
                        >
                          Copiar carteira
                        </button>
                      )}
                    </div>
                    <Gift size={20} />
                  </div>
                );
              })}
            </div>
            {currentRound ? (
              <details className="history-source">
                <summary>Ver referência da distribuição</summary>
                <p className="small muted">
                  Histórico publicado pelo responsável. A transação não foi
                  verificada automaticamente por este site.
                </p>
                <code>{currentRound.transactionHash}</code>
              </details>
            ) : (
              <p className="small muted">
                Ainda não há vencedores ou histórico on-chain conectado. Nenhum
                sorteio nem pagamento é executado por esta versão estática.
              </p>
            )}
          </>
        )}
      </section>
      {selected !== null && (
        <Modal
          title={
            success
              ? "Seu agente está por aqui."
              : `Conheça o Agente #${selected}`
          }
          onClose={() => setSelected(null)}
        >
          <div ref={art} className="purchase-avatar">
            <AgentFace large active />
            <span>Agente #{selected}</span>
          </div>
          {success ? (
            <>
              <div className="success-inline">
                <Check size={19} />
                Adicionado à sua coleção local.
              </div>
              <p className="muted">
                Esta imagem é uma lembrança da demonstração. Ela não é um NFT
                emitido e não participa de recompensas reais.
              </p>
              <button className="button primary full-width" onClick={saveImage}>
                <Download size={18} />
                Baixar imagem do agente
              </button>
              <button
                className="text-button centered"
                onClick={() => {
                  setSelected(null);
                  setFilter("mine");
                }}
              >
                Ver minha coleção
                <ArrowRight size={17} />
              </button>
            </>
          ) : (
            <>
              <div className="purchase-price">
                <span>Valor previsto</span>
                <strong>{formatAmount(price)} 1MIND</strong>
              </div>
              <p className="small muted">
                {config.launchDate
                  ? "Preço calculado a partir da data configurada."
                  : "Data de lançamento ainda não definida. Preço inicial de 5 1MIND."}{" "}
                O preço aumenta 1% a cada 7 dias completos, de forma composta.
              </p>
              <div className="note-block">
                <strong>Reserve uma demonstração</strong>
                <p>
                  Nenhum token será debitado. A emissão real de NFTs e os
                  sorteios ainda não estão disponíveis.
                </p>
              </div>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => {
                    setAgree(e.target.checked);
                    setError("");
                  }}
                />
                Entendo que esta reserva é apenas demonstrativa.
              </label>
              {error && (
                <p role="alert" className="inline-error">
                  {error}
                </p>
              )}
              <button className="button primary full-width" onClick={reserve}>
                Adicionar à coleção demonstrativa
                <ArrowDown size={17} />
              </button>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
