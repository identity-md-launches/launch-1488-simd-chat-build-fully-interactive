import { useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  Check,
  CircleHelp,
  Download,
  FileJson,
  Flame,
  Rocket,
  Save,
  Wallet,
} from "lucide-react";
import {
  download,
  launchTemplate,
  TREASURY,
  configIssue,
  type LaunchConfig,
} from "../lib/domain";
export default function Launch({
  config,
  setConfig,
  notify,
}: {
  config: LaunchConfig;
  setConfig: (c: LaunchConfig) => void;
  notify: (s: string) => void;
}) {
  const [draft, setDraft] = useState(config),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false);
  const [errorField, setErrorField] = useState<keyof LaunchConfig | null>(null);
  const inputState = (field: keyof LaunchConfig) => ({
    id: `launch-${field}`,
    "aria-invalid": errorField === field || undefined,
    "aria-describedby": errorField === field ? "launch-error" : undefined,
  });
  const update = (key: keyof LaunchConfig, value: string) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setSaved(false);
    setError("");
    setErrorField(null);
  };
  function save(e: FormEvent) {
    e.preventDefault();
    const issue = configIssue(draft);
    if (issue) {
      setError(issue.message);
      setErrorField(issue.field);
      document.getElementById(`launch-${issue.field}`)?.focus();
      return;
    }
    setConfig(draft);
    setSaved(true);
    notify(
      "Parâmetros salvos neste navegador. Nenhum contrato foi implantado.",
    );
  }
  function exportTemplate() {
    const issue = configIssue(draft);
    if (issue) {
      setError(issue.message);
      setErrorField(issue.field);
      document.getElementById(`launch-${issue.field}`)?.focus();
      return;
    }
    download(
      "1mind-lancamento.json",
      JSON.stringify(launchTemplate(draft), null, 2),
    );
    notify("Modelo de lançamento exportado.");
  }
  return (
    <div className="page-inner">
      <div className="page-heading">
        <div>
          <h1>O próximo capítulo é coletivo.</h1>
          <p>Conheça os parâmetros e prepare o lançamento do 1MIND.</p>
        </div>
        <span className="tag">
          <i className="status-dot" />
          Pré-lançamento
        </span>
      </div>
      <div className="launch-grid">
        <section className="launch-summary">
          <div className="launch-logo">
            1<span>MIND</span>
          </div>
          <h2>1MIND</h2>
          <p className="muted">
            O token de uma comunidade movida por inteligência coletiva.
          </p>
          <dl className="launch-facts">
            <div>
              <dt>Símbolo</dt>
              <dd>1MIND</dd>
            </div>
            <div>
              <dt>Oferta total</dt>
              <dd>1.000.000.000</dd>
            </div>
            <div>
              <dt>Casas decimais do modelo</dt>
              <dd>18</dd>
            </div>
            <div>
              <dt>Capitalização inicial</dt>
              <dd>2.500 IMD</dd>
            </div>
            <div>
              <dt>Liquidez inicial</dt>
              <dd>
                {config.initialLiquidity
                  ? `${Number(config.initialLiquidity).toLocaleString("pt-BR")} IMD`
                  : "A definir"}
              </dd>
            </div>
            <div>
              <dt>Taxa de compra</dt>
              <dd>2%</dd>
            </div>
          </dl>
          <div className="launch-tax">
            <Flame size={17} />
            <p>1% queima · 0,5% carteira · 0,5% staking</p>
          </div>
          <a className="text-button" href="#tokenomics">
            Entender a economia
            <ArrowUpRight size={16} />
          </a>
        </section>
        <section className="launch-form-section">
          <h2>Prepare os parâmetros.</h2>
          <p className="muted">
            Os campos opcionais abaixo são definidos pelo responsável pelo
            projeto. Salvar configura a consulta de saldos e o cálculo do preço
            dos NFTs apenas neste navegador.
          </p>
          <form className="form-stack" onSubmit={save}>
            <div className="form-columns">
              <label>
                ID da rede
                <input
                  {...inputState("chainId")}
                  value={draft.chainId}
                  onChange={(e) => update("chainId", e.target.value)}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="ID da rede de implantação"
                />
              </label>
              <label>
                Liquidez inicial (IMD)
                <input
                  type="number"
                  step="any"
                  min="0.00000001"
                  {...inputState("initialLiquidity")}
                  value={draft.initialLiquidity}
                  onChange={(e) => update("initialLiquidity", e.target.value)}
                  placeholder="Quantidade a depositar"
                />
              </label>
            </div>
            <label>
              Contrato do token IMD
              <input
                {...inputState("imdAddress")}
                value={draft.imdAddress}
                onChange={(e) => update("imdAddress", e.target.value.trim())}
                spellCheck={false}
                autoComplete="off"
                placeholder="Endereço do contrato implantado"
              />
            </label>
            <label>
              Contrato do token 1MIND
              <input
                {...inputState("tokenAddress")}
                value={draft.tokenAddress}
                onChange={(e) => update("tokenAddress", e.target.value.trim())}
                spellCheck={false}
                autoComplete="off"
                placeholder="Endereço do contrato implantado"
              />
            </label>
            <label>
              Data e hora do lançamento (UTC)
              <input
                type="datetime-local"
                {...inputState("launchDate")}
                value={
                  draft.launchDate
                    ? draft.launchDate.replace(/Z$/, "").slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  update(
                    "launchDate",
                    e.target.value ? `${e.target.value}:00Z` : "",
                  )
                }
                min="2020-01-01T00:00"
              />
              <span className="small muted">
                Interpretada em UTC, independentemente do fuso do navegador.
              </span>
            </label>
            {error && (
              <p className="inline-error" role="alert" id="launch-error">
                {error}
              </p>
            )}
            {saved && (
              <p className="success-inline" role="status">
                <Check size={17} />
                Configuração salva. Atualize os saldos na carteira.
              </p>
            )}
            <div className="form-actions">
              <button className="button primary" type="submit">
                <Save size={17} />
                Salvar parâmetros
              </button>
              <button
                className="button secondary"
                type="button"
                onClick={exportTemplate}
              >
                <Download size={17} />
                Exportar modelo
              </button>
            </div>
          </form>
        </section>
      </div>
      <section className="launch-process">
        <div className="section-heading">
          <div>
            <h2>Da ideia ao lançamento.</h2>
            <p>
              O modelo reúne as regras do token para a etapa de implantação.
            </p>
          </div>
          <Rocket size={30} />
        </div>
        <div className="process-grid">
          <div>
            <FileJson size={24} />
            <h3>1. Defina e exporte</h3>
            <p>
              Salve a rede, os contratos e a data. Exporte o modelo JSON com
              oferta, taxas e regras da coleção.
            </p>
          </div>
          <div>
            <Wallet size={24} />
            <h3>2. Implante e conecte</h3>
            <p>
              O responsável precisa configurar os destinatários de carteira e
              staking, implantar os contratos e criar a liquidez no Launchpad.
            </p>
          </div>
          <div>
            <Check size={24} />
            <h3>3. Ative o ecossistema</h3>
            <p>
              Conecte votação compartilhada, emissão de NFTs, aleatoriedade
              verificável e execução dos pagamentos semanais.
            </p>
          </div>
        </div>
      </section>
      <details className="launch-details">
        <summary>
          <CircleHelp size={19} />O que está disponível nesta versão?
        </summary>
        <div>
          <p>
            Este site é um export estático com exploração, projetos e coleção
            demonstrativos. Conectar uma carteira permite ler endereços, rede e
            saldos ERC-20 configurados. Não solicita assinaturas, aprovações ou
            transferências.
          </p>
          <p>
            O arquivo exportado é um modelo de parâmetros, não um contrato
            Solidity nem um formato oficial de importação do Identity.md
            Launchpad. A capitalização inicial de 2.500 IMD não determina a
            quantidade de liquidez; esse depósito é definido separadamente.
          </p>
          <p>
            O destino dos 70% das vendas de NFTs é fixo: <code>{TREASURY}</code>
            . Os destinatários da taxa de compra de 0,5% e do staking não foram
            informados e precisam ser definidos na implantação.
          </p>
        </div>
      </details>
    </div>
  );
}
