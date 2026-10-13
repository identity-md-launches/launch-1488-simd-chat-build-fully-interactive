import { useState } from "react";
import { ArrowDown, ArrowUpRight, Flame, Layers3, Wallet } from "lucide-react";
import { formatAmount } from "../lib/domain";
export default function Tokenomics() {
  const [amount, setAmount] = useState("1000");
  const value = Number(amount),
    valid =
      amount !== "" && Number.isFinite(value) && value >= 0 && value <= 1e12;
  return (
    <div className="page-inner">
      <div className="page-heading">
        <div>
          <h1>Um token. Valor compartilhado.</h1>
          <p>
            Uma economia que conecta participação, utilidade e o ecossistema
            IMD.
          </p>
        </div>
        <a className="button primary" href="#lancamento">
          Ver lançamento
          <ArrowUpRight size={18} />
        </a>
      </div>
      <div className="token-overview">
        <div>
          <span className="muted">Oferta total inicial</span>
          <strong>
            1 bilhão <small>1MIND</small>
          </strong>
        </div>
        <div>
          <span className="muted">Capitalização no lançamento</span>
          <strong>
            2.500 <small>IMD</small>
          </strong>
        </div>
        <div>
          <span className="muted">Taxa de compra</span>
          <strong>
            2% <small>distribuídos</small>
          </strong>
        </div>
      </div>
      <section className="token-grid">
        <div className="token-visual">
          <div
            className="tax-donut"
            role="img"
            aria-label="Distribuição da taxa de 2%: 1% queima, 0,5% carteira, 0,5% staking"
          >
            <div>
              <span>Taxa de compra</span>
              <strong>2%</strong>
              <small>100% distribuídos</small>
            </div>
          </div>
          <p className="small muted">
            As fatias representam a divisão da taxa,
            <br />
            não a distribuição da oferta total.
          </p>
        </div>
        <div className="token-explanation">
          <h2>Cada compra alimenta o ecossistema.</h2>
          <p className="muted">
            A taxa de 2% é dividida em três destinos. A queima reduz a oferta
            disponível ao longo do tempo.
          </p>
          <div className="tax-row">
            <span className="tax-icon burn">
              <Flame size={22} />
            </span>
            <div>
              <h3>Queima</h3>
              <p>Tokens retirados da circulação de forma permanente.</p>
            </div>
            <strong>1%</strong>
          </div>
          <div className="tax-row">
            <span className="tax-icon wallet">
              <Wallet size={22} />
            </span>
            <div>
              <h3>Carteira do projeto</h3>
              <p>Recursos para apoiar a continuidade da iniciativa.</p>
            </div>
            <strong>0,5%</strong>
          </div>
          <div className="tax-row">
            <span className="tax-icon stake">
              <Layers3 size={22} />
            </span>
            <div>
              <h3>Staking</h3>
              <p>Parcela destinada à estrutura de participação do token.</p>
            </div>
            <strong>0,5%</strong>
          </div>
        </div>
      </section>
      <section className="tax-calculator">
        <div>
          <h2>Veja a taxa em ação.</h2>
          <p className="muted">Simule a divisão de uma compra em 1MIND.</p>
          <label>
            Quantidade antes da taxa
            <input
              type="number"
              min="0"
              max="1000000000000"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-invalid={!valid}
              aria-describedby={!valid ? "amount-error" : undefined}
            />
          </label>
          {!valid && (
            <p className="inline-error" id="amount-error">
              Informe um valor entre 0 e 1 trilhão.
            </p>
          )}
        </div>
        <div className="calculator-result">
          <div>
            <span>Você recebe</span>
            <strong>
              {valid ? formatAmount(value * 0.98) : "—"} <small>1MIND</small>
            </strong>
          </div>
          <dl>
            <div>
              <dt>
                <i className="legend-dot burn" />
                Queima
              </dt>
              <dd>{valid ? formatAmount(value * 0.01) : "—"}</dd>
            </div>
            <div>
              <dt>
                <i className="legend-dot wallet" />
                Carteira
              </dt>
              <dd>{valid ? formatAmount(value * 0.005) : "—"}</dd>
            </div>
            <div>
              <dt>
                <i className="legend-dot stake" />
                Staking
              </dt>
              <dd>{valid ? formatAmount(value * 0.005) : "—"}</dd>
            </div>
          </dl>
        </div>
      </section>
      <div className="token-bottom">
        <div>
          <h2>1MIND encontra IMD.</h2>
          <p>
            IMD é a referência de valor do lançamento. Com 10 IMD ou 1 1MIND,
            uma carteira pode participar das votações. O 1MIND também será usado
            para adquirir os NFTs do enxame.
          </p>
          <a className="text-button" href="#votar">
            Conhecer os projetos
            <ArrowUpRight size={17} />
          </a>
        </div>
        <div>
          <h2>O incentivo da queima.</h2>
          <p>
            1% de cada compra é removido da oferta. Menos tokens em circulação
            não garantem valorização. Os mecanismos de taxa e staking dependem
            dos contratos do lançamento.
          </p>
          <a className="text-button" href="#lancamento">
            Consultar parâmetros
            <ArrowDown size={17} />
          </a>
        </div>
      </div>
    </div>
  );
}
