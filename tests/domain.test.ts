import test from "node:test";
import assert from "node:assert/strict";
import {
  addVote,
  activity,
  themes,
  AGENTS,
  analyze,
  average,
  EMPTY_CONFIG,
  initialProjects,
  launchTemplate,
  nextFriday,
  nftPrice,
  sortedProjects,
  TREASURY,
  validateConfig,
  WEEK_MS,
  type Project,
} from "../src/lib/domain.ts";
import {
  connect,
  readBalances,
  walletError,
  type Provider,
} from "../src/lib/wallet.ts";
import { parseHistory } from "../src/lib/rewards.ts";
const project: Project = {
  id: "teste-local",
  name: "Horta comunitária",
  description:
    "Um projeto de horta comunitária com oficinas abertas para educar, cultivar alimentos e compartilhar conhecimentos.",
  category: "Comunidade",
  createdAt: 0,
  votes: {},
  example: false,
};
// Synthetic addresses exist only in test fixtures. They are never defaults or recipients.
const address = (n: number) => `0x${n.toString(16).padStart(40, "1")}`;
const word = (n: bigint) => `0x${n.toString(16).padStart(64, "0")}`;
const config = {
  ...EMPTY_CONFIG,
  chainId: "8453",
  imdAddress: address(1),
  tokenAddress: address(2),
};
function provider(
  imd: bigint,
  mind: bigint,
  decimals = 18,
  chain = "0x2105",
): Provider {
  return {
    async request({ method, params }) {
      if (method === "eth_chainId") return chain;
      if (method === "eth_requestAccounts") return [address(3)];
      assert.equal(method, "eth_call", "Only read-only methods are permitted");
      const p = params![0] as { to: string; data: string };
      if (p.data === "0x313ce567") return word(BigInt(decimals));
      assert.match(p.data, /^0x70a08231[\da-f]{64}$/);
      return word(p.to === config.imdAddress ? imd : mind);
    },
  };
}
test("Initial dataset has 10 clearly marked examples and one rating per agent", () => {
  const p = initialProjects();
  assert.equal(p.length, 10);
  p.forEach((p) => {
    assert.equal(p.example, true);
    assert.equal(Object.keys(p.votes).length, AGENTS.length);
    assert.ok(average(p) >= 1 && average(p) <= 5);
  });
});
test("Local heuristic is deterministic, bounded and idempotent", () => {
  const rated = analyze(project);
  assert.deepEqual(analyze(rated), rated);
  assert.deepEqual(analyze(project), rated);
  assert.ok(
    Object.values(rated.votes).every(
      (n) => Number.isInteger(n) && n >= 1 && n <= 5,
    ),
  );
});
test("Each participant has one vote per project, and votes must be 1–5", () => {
  const p = addVote(project, "local", 4);
  assert.equal(average(p), 4);
  assert.throws(() => addVote(p, "local", 5));
  [0, 6, 1.5, NaN].forEach((n) =>
    assert.throws(() => addVote(project, "new", n)),
  );
  assert.equal(Object.keys(project.votes).length, 0);
});
test("Sort and search use actual current ratings, without mutating source", () => {
  const a = { ...project, id: "a", createdAt: 1, votes: { a: 5 } },
    b = { ...project, id: "b", name: "Energia", createdAt: 2, votes: { a: 2 } };
  const list = [a, b];
  assert.equal(sortedProjects(list, "rating")[0].id, "a");
  assert.equal(sortedProjects(list, "recent")[0].id, "b");
  assert.equal(sortedProjects(list, "rating", "ENERGIA")[0].id, "b");
  assert.equal(sortedProjects(list, "recent", "inexistente").length, 0);
  assert.equal(list[0].id, "a");
});
test("NFT weekly increase uses completed weeks and compounds", () => {
  const date = "2026-10-01T00:00:00Z",
    start = Date.parse(date);
  assert.equal(nftPrice("", start), 5);
  assert.equal(nftPrice(date, start - 1), 5);
  assert.equal(nftPrice(date, start + WEEK_MS - 1), 5);
  assert.equal(nftPrice(date, start + WEEK_MS), 5.05);
  assert.equal(nftPrice(date, start + WEEK_MS * 2), 5 * 1.01 ** 2);
});
test("Weekly schedule is Friday 23:59 UTC including exact boundary", () => {
  assert.equal(
    nextFriday(new Date("2026-10-12T12:00:00Z")).toISOString(),
    "2026-10-16T23:59:00.000Z",
  );
  assert.equal(
    nextFriday(new Date("2026-10-16T23:58:59Z")).toISOString(),
    "2026-10-16T23:59:00.000Z",
  );
  assert.equal(
    nextFriday(new Date("2026-10-16T23:59:00Z")).toISOString(),
    "2026-10-23T23:59:00.000Z",
  );
  assert.equal(
    nextFriday(new Date("2026-10-17T00:00:00Z")).toISOString(),
    "2026-10-23T23:59:00.000Z",
  );
});
test("Launch template retains supply, tax split, market cap and exact NFT recipient", () => {
  const t = launchTemplate(EMPTY_CONFIG);
  assert.equal(t.totalSupply, "1000000000");
  assert.equal(t.initialMarketCap.amount, "2500");
  assert.equal(t.buyTaxBps.total, 200);
  assert.equal(
    t.buyTaxBps.burn + t.buyTaxBps.wallet + t.buyTaxBps.staking,
    200,
  );
  assert.equal(t.nft.distribution.treasury, TREASURY);
  assert.equal(
    t.nft.distribution.eachWinnerBps * 3 + t.nft.distribution.treasuryBps,
    10000,
  );
  assert.equal(t.deployment.tokenAddress, null);
  assert.equal(t.initialLiquidityIMD, null);
  assert.equal(t.nft.launchDateUTC, null);
});
test("Config rejects invalid, zero, burn, duplicate addresses and negative values", () => {
  assert.equal(validateConfig(EMPTY_CONFIG), null);
  assert.equal(validateConfig(config), null);
  for (const c of [
    { ...config, chainId: "-1" },
    { ...config, chainId: "1.5" },
    { ...config, tokenAddress: "0x" + "0".repeat(40) },
    { ...config, tokenAddress: "0x" + "0".repeat(36) + "dEaD" },
    { ...config, tokenAddress: config.imdAddress },
    { ...config, launchDate: "bad date" },
    { ...config, initialLiquidity: "-10" },
  ])
    assert.ok(validateConfig(c));
});
test("Wallet connects using EIP-1193 and returns account and chain", async () => {
  assert.deepEqual(await connect(provider(0n, 0n)), {
    address: address(3),
    chain: 8453,
  });
});
test("10 IMD alone confers eligibility at the exact boundary", async () => {
  assert.equal(
    (await readBalances(provider(10n * 10n ** 18n, 0n), address(3), config))
      .eligible,
    true,
  );
  assert.equal(
    (
      await readBalances(
        provider(10n * 10n ** 18n - 1n, 0n),
        address(3),
        config,
      )
    ).eligible,
    false,
  );
});
test("1 1MIND alone confers eligibility, without rounding up", async () => {
  assert.equal(
    (await readBalances(provider(0n, 10n ** 18n), address(3), config)).eligible,
    true,
  );
  assert.equal(
    (await readBalances(provider(0n, 10n ** 18n - 1n), address(3), config))
      .eligible,
    false,
  );
});
test("Balance checks respect ERC-20 decimals rather than assuming 18", async () => {
  const b = await readBalances(
    provider(10_000_000n, 0n, 6),
    address(3),
    config,
  );
  assert.equal(b.eligible, true);
  assert.equal(b.imd, "10");
  assert.equal(
    (await readBalances(provider(0n, 1n, 0), address(3), config)).eligible,
    true,
  );
});
test("Missing configuration and wrong networks fail before token calls", async () => {
  await assert.rejects(
    readBalances(provider(0n, 0n), address(3), EMPTY_CONFIG),
    /Configure/,
  );
  await assert.rejects(
    readBalances(provider(0n, 0n, 18, "0x1"), address(3), config),
    /outra rede/,
  );
});
test("Malformed ERC-20 replies and excessive decimals fail closed", async () => {
  await assert.rejects(
    readBalances(
      {
        async request({ method }) {
          return method === "eth_chainId" ? "0x2105" : "0x";
        },
      },
      address(3),
      config,
    ),
    /ERC-20/,
  );
  await assert.rejects(
    readBalances(provider(0n, 0n, 99), address(3), config),
    /decimais/,
  );
});
test("Rejected wallet requests have actionable Portuguese messages", () => {
  assert.match(walletError({ code: 4001 }), /cancelada/);
  assert.match(walletError({ code: -32002 }), /pendente/);
  assert.match(walletError({ code: 4900 }), /desconectada/);
});
test("Empty published rewards are honest and valid", () => {
  assert.deepEqual(parseHistory({ version: 1, rounds: [] }), []);
});
const round = {
  date: "2026-10-09T23:59:00Z",
  weeklySales: "100",
  transactionHash: "0x" + "1".repeat(64),
  winners: [1, 2, 3].map((n) => ({ address: address(n), amount: "10" })),
};
test("Rewards validate 3 unique wallets, exact 10% each and descending dates", () => {
  const later = { ...round, date: "2026-10-16T23:59:00Z" };
  assert.equal(
    parseHistory({ version: 1, rounds: [round, later] })[0].date,
    later.date,
  );
  assert.throws(() =>
    parseHistory({
      version: 1,
      rounds: [{ ...round, winners: [round.winners[0]] }],
    }),
  );
  assert.throws(() =>
    parseHistory({
      version: 1,
      rounds: [
        {
          ...round,
          winners: [round.winners[0], round.winners[0], round.winners[2]],
        },
      ],
    }),
  );
  assert.throws(() =>
    parseHistory({
      version: 1,
      rounds: [
        {
          ...round,
          winners: round.winners.map((w) => ({ ...w, amount: "20" })),
        },
      ],
    }),
  );
});
test("Rewards reject duplicate dates, invalid hashes and precision errors", () => {
  assert.throws(() => parseHistory({ version: 1, rounds: [round, round] }));
  assert.throws(() =>
    parseHistory({ version: 1, rounds: [{ ...round, transactionHash: "0x" }] }),
  );
  assert.throws(() =>
    parseHistory({ version: 1, rounds: [{ ...round, weeklySales: "NaN" }] }),
  );
});

test("Todas as atividades de cada mundo são alcançáveis", () => {
  for (const theme of ["nature", "planet", "neuron"] as const) {
    const seen = new Set(
      Array.from({ length: 12 }, (_, tick) =>
        AGENTS.map((id) => activity(id, theme, tick).text),
      ).flat(),
    );
    for (const task of [...themes[theme].tasks, ...themes[theme].leisure])
      assert.ok(seen.has(task), `Atividade nunca selecionada: ${task}`);
  }
});
