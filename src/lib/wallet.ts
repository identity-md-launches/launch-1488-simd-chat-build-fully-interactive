import { validAddress, type LaunchConfig } from "./domain.ts";
export type Provider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(event: string, listener: (...args: unknown[]) => void): void;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
};
declare global {
  interface Window {
    ethereum?: Provider;
  }
}
export type Balances = { imd: string; mind: string; eligible: boolean };
const uint = (result: unknown): bigint => {
  if (typeof result !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(result))
    throw new Error(
      "O contrato não respondeu como um token ERC-20. Confira a configuração.",
    );
  return BigInt(result);
};
export async function request(
  provider: Provider,
  method: string,
  params?: unknown[],
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      provider.request({ method, params }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error(
                "A carteira demorou a responder. Verifique a conexão e tente novamente.",
              ),
            ),
          20000,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
export async function connect(
  provider: Provider,
): Promise<{ address: string; chain: number }> {
  const accounts = await request(provider, "eth_requestAccounts");
  if (
    !Array.isArray(accounts) ||
    typeof accounts[0] !== "string" ||
    !validAddress(accounts[0])
  )
    throw new Error(
      "Nenhuma conta foi autorizada. Abra a carteira e tente novamente.",
    );
  const chain = await request(provider, "eth_chainId");
  if (typeof chain !== "string" || !/^0x[0-9a-f]+$/i.test(chain))
    throw new Error("Não foi possível identificar a rede da carteira.");
  return { address: accounts[0], chain: Number(BigInt(chain)) };
}
function amount(value: bigint, decimals: number) {
  const scale = 10n ** BigInt(decimals);
  const fraction = (value % scale)
    .toString()
    .padStart(decimals, "0")
    .slice(0, 4)
    .replace(/0+$/, "");
  return `${(value / scale).toLocaleString("pt-BR")}${fraction ? `,${fraction}` : ""}`;
}
async function tokenBalance(
  provider: Provider,
  token: string,
  address: string,
) {
  const call = (data: string) =>
    request(provider, "eth_call", [{ to: token, data }, "latest"]);
  const [raw, rawDecimals] = await Promise.all([
    call(`0x70a08231${address.slice(2).toLowerCase().padStart(64, "0")}`),
    call("0x313ce567"),
  ]);
  const balance = uint(raw),
    decimals = Number(uint(rawDecimals));
  if (decimals < 0 || decimals > 36)
    throw new Error("As casas decimais deste token não são suportadas.");
  return { balance, decimals, formatted: amount(balance, decimals) };
}
export async function readBalances(
  provider: Provider,
  address: string,
  config: LaunchConfig,
): Promise<Balances> {
  if (
    !validAddress(address) ||
    !validAddress(config.imdAddress) ||
    !validAddress(config.tokenAddress) ||
    !config.chainId
  )
    throw new Error(
      "Configure a rede e os dois contratos na página de lançamento.",
    );
  const chain = await request(provider, "eth_chainId");
  if (typeof chain !== "string" || BigInt(chain) !== BigInt(config.chainId))
    throw new Error(
      "A carteira está em outra rede. Troque para a rede configurada e atualize os saldos.",
    );
  const [imd, mind] = await Promise.all([
    tokenBalance(provider, config.imdAddress, address),
    tokenBalance(provider, config.tokenAddress, address),
  ]);
  return {
    imd: imd.formatted,
    mind: mind.formatted,
    eligible:
      imd.balance >= 10n * 10n ** BigInt(imd.decimals) ||
      mind.balance >= 10n ** BigInt(mind.decimals),
  };
}
export function walletError(error: unknown) {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? error.code
      : null;
  if (code === 4001)
    return "Conexão cancelada na carteira. Você pode tentar novamente.";
  if (code === -32002)
    return "Há uma solicitação pendente. Abra a carteira para responder.";
  if (code === 4900 || code === 4901)
    return "Carteira desconectada da rede. Verifique sua conexão e tente novamente.";
  return error instanceof Error
    ? error.message
    : "Não foi possível consultar a carteira. Tente novamente.";
}
