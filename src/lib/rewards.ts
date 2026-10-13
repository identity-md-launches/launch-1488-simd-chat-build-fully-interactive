import { validAddress } from "./domain.ts";
export type RewardRound = {
  date: string;
  weeklySales: string;
  transactionHash: string;
  winners: { address: string; amount: string }[];
};
function units(value: unknown): bigint {
  if (typeof value !== "string" || !/^\d{1,30}(\.\d{1,18})?$/.test(value))
    throw new Error("Valor de recompensa inválido.");
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * 10n ** 18n + BigInt(fraction.padEnd(18, "0"));
}
export function parseHistory(value: unknown): RewardRound[] {
  if (
    !value ||
    typeof value !== "object" ||
    !("version" in value) ||
    value.version !== 1 ||
    !("rounds" in value) ||
    !Array.isArray(value.rounds)
  )
    throw new Error("O histórico publicado tem um formato inválido.");
  const rounds = value.rounds as RewardRound[];
  if (rounds.length > 1000)
    throw new Error("O histórico ultrapassa o limite de distribuições.");
  const dates = new Set<string>();
  for (const round of rounds) {
    if (
      !round ||
      typeof round.date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(round.date) ||
      !Number.isFinite(Date.parse(round.date)) ||
      new Date(round.date).toISOString().replace(".000Z", "Z") !== round.date
    )
      throw new Error("Data de distribuição inválida.");
    if (dates.has(round.date))
      throw new Error("Datas duplicadas no histórico.");
    dates.add(round.date);
    if (
      typeof round.transactionHash !== "string" ||
      !/^0x[0-9a-fA-F]{64}$/.test(round.transactionHash) ||
      /^0x0+$/.test(round.transactionHash)
    )
      throw new Error("Hash de distribuição inválido.");
    if (!Array.isArray(round.winners) || round.winners.length !== 3)
      throw new Error("Cada distribuição precisa de três contemplados.");
    const wallets = new Set<string>(),
      sales = units(round.weeklySales);
    if (sales <= 0n)
      throw new Error("As vendas da semana precisam ser positivas.");
    for (const winner of round.winners) {
      if (
        !validAddress(winner.address) ||
        wallets.has(winner.address.toLowerCase())
      )
        throw new Error(
          "O histórico precisa de três carteiras válidas e distintas.",
        );
      wallets.add(winner.address.toLowerCase());
      if (units(winner.amount) !== sales / 10n)
        throw new Error(
          "Cada recompensa precisa corresponder a 10% das vendas.",
        );
    }
  }
  return [...rounds].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}
