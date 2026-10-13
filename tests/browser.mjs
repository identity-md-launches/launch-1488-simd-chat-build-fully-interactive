import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile, stat } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
const playwright = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
    : "playwright"
);
const { default: AxeBuilder } = await import(
  process.env.AXE_MODULE
    ? pathToFileURL(process.env.AXE_MODULE).href
    : "@axe-core/playwright"
);
const engine = process.env.BROWSER || "chromium";
const out = resolve("test/scratch/browser-check");
await mkdir(out, { recursive: true });
const root = resolve("dist");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json",
};
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://local");
    const part = decodeURIComponent(url.pathname).replace(/^\/preview\//, "");
    if (!url.pathname.startsWith("/preview/")) {
      res.writeHead(404).end();
      return;
    }
    const file = resolve(root, part || "index.html");
    if (!file.startsWith(root + "/")) {
      res.writeHead(403).end();
      return;
    }
    const data = await readFile(file);
    res
      .writeHead(200, {
        "Content-Type": mime[extname(file)] || "application/octet-stream",
      })
      .end(data);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const url = `http://127.0.0.1:${server.address().port}/preview/`;
const results = [],
  errors = [],
  requests = [];
let browser;
try {
  browser = await playwright[engine].launch({
    headless: true,
    ...(process.env.BROWSER_EXECUTABLE
      ? { executablePath: process.env.BROWSER_EXECUTABLE }
      : {}),
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
    locale: "pt-BR",
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) requests.push({ url: r.url(), status: r.status() });
  });
  async function check(name, fn) {
    try {
      const detail = await fn();
      results.push({ name, passed: true, ...(detail ? { detail } : {}) });
      console.log(`PASS ${name}`);
    } catch (e) {
      results.push({ name, passed: false, error: e.message });
      console.error(`FAIL ${name}: ${e.message}`);
      await page
        .screenshot({
          path: `${out}/failure-${results.length}-${engine}.png`,
          fullPage: true,
        })
        .catch(() => {});
    }
  }
  async function route(hash) {
    await page.goto(url + "#" + hash);
    const titles = {
      inicio: "Uma mente.",
      explorar: "Encontre sua próxima conexão.",
      tokenomics: "Um token. Valor compartilhado.",
      votar: "Boas ideias merecem voz.",
      nfts: "Um agente. Parte de você.",
      lancamento: "O próximo capítulo é coletivo.",
    };
    await page
      .getByRole("heading", { level: 1, name: new RegExp(titles[hash]) })
      .waitFor();
  }
  await check(
    "Export funciona em subdiretório e carrega fonte local",
    async () => {
      await page.goto(url);
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.title(), "Uma mente. Infinitos mundos. | 1MIND");
      assert.equal(
        await page.evaluate(() => document.fonts.check("400 16px Manrope")),
        true,
      );
      assert.equal(await page.locator(".map-agent").count(), 9);
    },
  );
  await check("Cartão de compartilhamento possui imagem real", async () => {
    const image = await page
      .locator('meta[property="og:image"]')
      .getAttribute("content");
    assert.ok(image);
    const path = resolve("dist", image.replace(/^\.\//, ""));
    assert.ok((await stat(path)).size > 1000);
  });
  await check("Produto e ação principal visíveis a 390 px", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    const a = await page
      .getByRole("link", { name: "Explorar o enxame", exact: true })
      .boundingBox();
    assert.ok(a && a.y + a.height < 844);
    const m = await page.locator(".world-scene").boundingBox();
    assert.ok(m && m.y < 500 && m.y + m.height <= 844);
    assert.equal(
      await page.locator(".home-intro p").innerText(),
      "O token do ecossistema IMD para votar em projetos e colecionar agentes.",
    );
    assert.match(
      await page.locator(".home-stats").innerText(),
      /Liquidez inicial: a definir/,
    );
    await page.screenshot({
      path: `${out}/inicio-390-${engine}.png`,
      fullPage: true,
    });
  });
  await check("Menu móvel navega e volta pelo logotipo", async () => {
    await page.getByRole("button", { name: "Abrir menu" }).click();
    await page
      .getByRole("navigation", { name: "Navegação móvel" })
      .getByRole("link", { name: "Tokenomics" })
      .click();
    await page
      .getByRole("heading", { level: 1, name: /Valor compartilhado/ })
      .waitFor();
    assert.match(await page.locator("h1").innerText(), /Valor compartilhado/);
    await page.getByRole("link", { name: "1MIND, início" }).click();
    await page
      .getByRole("heading", { level: 1, name: /Infinitos mundos/ })
      .waitFor();
    assert.match(await page.locator("h1").innerText(), /Infinitos mundos/);
  });
  await check("Os três mundos mudam a arte e o título", async () => {
    for (const [name, title] of [
      ["Planeta", "Órbita Aurora"],
      ["Sinapses", "Sinapse coletiva"],
      ["Natureza", "Jardim de Gaia"],
    ]) {
      await page.getByRole("button", { name, exact: true }).click();
      assert.equal(await page.locator(".scene-heading h2").innerText(), title);
      assert.equal(
        await page
          .getByRole("button", { name, exact: true })
          .getAttribute("aria-pressed"),
        "true",
      );
    }
  });
  await check(
    "Agente abre atributos, muda abas por teclado e devolve foco",
    async () => {
      const trigger = page.getByRole("button", {
        name: /Conhecer Agente #47:/,
      });
      await trigger.focus();
      await page.keyboard.press("Enter");
      const dialog = page.getByRole("dialog");
      assert.match(await dialog.innerText(), /Não conectado/);
      assert.equal(await page.locator(".agent-selected").count(), 1);
      await page.getByRole("tab", { name: "Atributos" }).focus();
      await page.keyboard.press("ArrowRight");
      assert.equal(
        await page
          .getByRole("tab", { name: /Projetos/ })
          .getAttribute("aria-selected"),
        "true",
      );
      assert.equal(await dialog.locator(".project-ranking li").count(), 10);
      for (let n = 0; n < 12; n++) {
        await page.keyboard.press(n % 2 ? "Shift+Tab" : "Tab");
        assert.equal(
          await page.evaluate(() =>
            document.querySelector("dialog").contains(document.activeElement),
          ),
          true,
        );
      }
      const audit = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      assert.deepEqual(
        audit.violations.map((v) => v.id),
        [],
      );
      await page.keyboard.press("Escape");
      assert.equal(await page.locator("dialog").count(), 0);
      assert.match(
        await page.evaluate(() =>
          document.activeElement.getAttribute("aria-label"),
        ),
        /Conhecer Agente #47:/,
      );
    },
  );
  await check("Movimento inicia e pausa sem depender do áudio", async () => {
    await page
      .getByRole("button", { name: "Retomar movimento dos agentes" })
      .click();
    assert.equal(
      await page
        .getByRole("button", { name: "Pausar movimento dos agentes" })
        .getAttribute("aria-pressed"),
      "false",
    );
    await page
      .getByRole("button", { name: "Pausar movimento dos agentes" })
      .click();
    assert.equal(await page.locator(".world-scene.paused").count(), 1);
  });
  await check(
    "Áudio inicia, muda faixa e volume ou informa indisponibilidade",
    async () => {
      await page
        .getByRole("button", { name: "Ativar música instrumental" })
        .click();
      await page.waitForFunction(
        () =>
          document.querySelector('[aria-label="Pausar música"]') ||
          document.querySelector(".world-shell .inline-error"),
      );
      if (await page.locator(".world-shell .inline-error").count()) {
        assert.match(
          await page.locator(".world-shell .inline-error").innerText(),
          /Não foi possível iniciar o áudio/,
        );
        assert.equal(
          await page
            .getByRole("button", { name: "Ativar música instrumental" })
            .isEnabled(),
          true,
        );
        return "O ambiente não iniciou o áudio; mensagem e nova tentativa verificadas. Reprodução não verificada neste motor.";
      }
      await page.getByRole("button", { name: "Ajustar música" }).click();
      await page.getByRole("button", { name: "Próxima música" }).click();
      assert.match(
        await page.locator(".audio-panel").innerText(),
        /Além da órbita/,
      );
      await page.getByRole("slider", { name: "Volume da música" }).fill("0.2");
      await page.getByRole("button", { name: "Ajustar música" }).click();
      await page.getByRole("button", { name: "Ajustar música" }).click();
      assert.equal(
        await page
          .getByRole("slider", { name: "Volume da música" })
          .inputValue(),
        "0.2",
      );
      await page.getByRole("button", { name: "Música anterior" }).click();
      assert.match(
        await page.locator(".audio-panel").innerText(),
        /Raízes sonoras/,
      );
      await page.getByRole("button", { name: "Pausar música" }).click();
      await page
        .getByRole("button", { name: "Ativar música instrumental" })
        .waitFor();
      return "Contexto de áudio iniciado; faixas, volume persistente no painel e pausa verificados. Sem audição física.";
    },
  );
  await check("Ajuda do mapa abre e fecha", async () => {
    await page.getByRole("button", { name: "Como explorar o mapa" }).click();
    assert.equal(await page.locator(".world-help").count(), 1);
    await page.getByRole("button", { name: "Entendi" }).click();
    assert.equal(await page.locator(".world-help").count(), 0);
  });
  await check("Mapa pode ser ampliado no desktop", async () => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByRole("button", { name: "Ampliar mapa" }).click();
    assert.equal(await page.locator(".world-shell.expanded").count(), 1);
    await page.getByRole("button", { name: "Reduzir mapa" }).click();
  });
  await check(
    "Busca, ausência de resultados e ordenação de projetos",
    async () => {
      await route("votar");
      await page
        .getByRole("searchbox", { name: "Buscar projetos" })
        .fill("horta");
      assert.equal(await page.locator(".projects-table tbody tr").count(), 1);
      await page
        .getByRole("searchbox", { name: "Buscar projetos" })
        .fill("zzzinexistente");
      assert.equal(await page.locator(".empty-state").count(), 1);
      await page
        .getByRole("button", { name: "Limpar busca", exact: true })
        .last()
        .click();
      assert.equal(await page.locator(".projects-table tbody tr").count(), 10);
      await page.getByLabel("Ordenar projetos").selectOption("recent");
      assert.match(
        await page.locator(".project-open").first().innerText(),
        /Atlas dos cogumelos/,
      );
      await page.getByLabel("Ordenar projetos").selectOption("rating");
    },
  );
  await check(
    "Voto exige estrela, persiste e impede repetição local",
    async () => {
      await page
        .getByRole("button", { name: "Avaliar Horta do amanhã" })
        .click();
      await page.getByRole("button", { name: "Confirmar avaliação" }).click();
      assert.match(
        await page.getByRole("alert").innerText(),
        /Escolha de 1 a 5/,
      );
      await page
        .getByRole("radio", { name: "4 estrelas", exact: true })
        .check();
      await page.getByRole("button", { name: "Confirmar avaliação" }).click();
      await page
        .getByRole("button", { name: "Avaliar Horta do amanhã" })
        .click();
      assert.match(
        await page.getByRole("dialog").innerText(),
        /já avaliou este projeto com 4/,
      );
      await page.keyboard.press("Escape");
      await page.reload();
      await page
        .getByRole("button", { name: "Avaliar Horta do amanhã" })
        .click();
      assert.match(await page.getByRole("dialog").innerText(), /já avaliou/);
      await page.keyboard.press("Escape");
    },
  );
  await check(
    "Criação valida, salva e recebe nove avaliações automáticas",
    async () => {
      await page
        .getByRole("button", { name: "Criar projeto", exact: true })
        .click();
      await page.getByLabel("Nome do projeto").fill("Teste da comunidade");
      await page
        .getByLabel("Descrição")
        .fill(
          "Programa educativo e aberto para a comunidade aprender a cultivar alimentos e compartilhar conhecimentos de forma acessível.",
        );
      await page
        .getByLabel("Categoria", { exact: true })
        .selectOption("Educação");
      await page
        .getByRole("button", { name: "Criar e avaliar projeto" })
        .click();
      const row = page.locator(".projects-table tbody tr").first();
      assert.match(await row.innerText(), /Teste da comunidade/);
      assert.match(await row.innerText(), /\(9\)/);
      await page.reload();
      assert.equal(
        await page
          .getByRole("button", { name: "Avaliar Teste da comunidade" })
          .count(),
        1,
      );
    },
  );
  await check(
    "Simulador de taxa calcula distribuição e trata valores inválidos",
    async () => {
      await route("tokenomics");
      await page.getByLabel("Quantidade antes da taxa").fill("2000");
      assert.match(
        await page.locator(".calculator-result").innerText(),
        /1.960/,
      );
      assert.match(
        await page.locator(".calculator-result").innerText(),
        /Queima\n20/,
      );
      await page.getByLabel("Quantidade antes da taxa").fill("-1");
      assert.equal(
        await page
          .getByLabel("Quantidade antes da taxa")
          .getAttribute("aria-invalid"),
        "true",
      );
      assert.match(await page.locator("#amount-error").innerText(), /entre 0/);
    },
  );
  await check(
    "NFT reserva apenas com ciência, salva coleção e baixa imagem",
    async () => {
      await route("nfts");
      await page
        .getByRole("button", { name: "Conhecer NFT Agente #47" })
        .click();
      await page
        .getByRole("button", { name: "Adicionar à coleção demonstrativa" })
        .click();
      assert.match(await page.getByRole("alert").innerText(), /Confirme/);
      await page.getByRole("checkbox").check();
      await page
        .getByRole("button", { name: "Adicionar à coleção demonstrativa" })
        .click();
      assert.match(
        await page.getByRole("dialog").innerText(),
        /Adicionado à sua coleção local/,
      );
      const waiting = page.waitForEvent("download");
      await page
        .getByRole("button", { name: "Baixar imagem do agente" })
        .click();
      const dl = await waiting;
      assert.equal(dl.suggestedFilename(), "1mind-agente-47.svg");
      const path = `${out}/agente-${engine}.svg`;
      await dl.saveAs(path);
      assert.match(await readFile(path, "utf8"), /Agente #47/);
      await page.getByRole("button", { name: "Ver minha coleção" }).click();
      assert.equal(await page.locator(".nft-card").count(), 1);
      await page.reload();
      await page.getByRole("button", { name: "Minha coleção (1)" }).click();
      assert.equal(await page.locator(".nft-card").count(), 1);
    },
  );
  await check(
    "Coleção completa e histórico vazio não inventam vencedores",
    async () => {
      await page.getByRole("button", { name: "O enxame", exact: true }).click();
      await page
        .getByRole("button", { name: "Ver todos os 9 agentes" })
        .click();
      assert.equal(await page.locator(".nft-card").count(), 9);
      await page
        .getByText("Aguardando primeiro sorteio", { exact: true })
        .first()
        .waitFor();
      assert.equal(
        await page
          .getByText("Aguardando primeiro sorteio", { exact: true })
          .count(),
        3,
      );
    },
  );
  await check(
    "Carteira ausente mostra orientação e nenhuma falsa conexão",
    async () => {
      await page
        .getByRole("button", { name: "Conectar carteira", exact: true })
        .first()
        .click();
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Conectar carteira", exact: true })
        .click();
      assert.match(
        await page.getByRole("alert").innerText(),
        /Nenhuma carteira detectada/,
      );
      await page.keyboard.press("Escape");
    },
  );
  await check("Parâmetros persistem e exportam o modelo exato", async () => {
    await route("lancamento");
    await page.getByLabel("Liquidez inicial (IMD)").fill("1250");
    await page
      .getByLabel("Data e hora do lançamento (UTC)")
      .fill("2026-10-01T00:00");
    await page.getByRole("button", { name: "Salvar parâmetros" }).click();
    assert.match(await page.locator(".launch-facts").innerText(), /1.250 IMD/);
    const waiting = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportar modelo" }).click();
    const dl = await waiting;
    const file = `${out}/lancamento-${engine}.json`;
    await dl.saveAs(file);
    const data = JSON.parse(await readFile(file, "utf8"));
    assert.equal(data.totalSupply, "1000000000");
    assert.equal(data.initialLiquidityIMD, "1250");
    assert.equal(data.nft.launchDateUTC, "2026-10-01T00:00:00.000Z");
    assert.equal(data.deployment.tokenAddress, null);
    await page.reload();
    assert.equal(
      await page.getByLabel("Liquidez inicial (IMD)").inputValue(),
      "1250",
    );
  });
  await check("Configuração inválida não é salva", async () => {
    await page.getByLabel("Contrato do token IMD").fill("inválido");
    await page.getByRole("button", { name: "Salvar parâmetros" }).click();
    assert.match(await page.getByRole("alert").innerText(), /endereço válido/);
    assert.equal(
      await page
        .getByLabel("Contrato do token IMD")
        .getAttribute("aria-invalid"),
      "true",
    );
    assert.equal(
      await page.evaluate(() => document.activeElement.id),
      "launch-imdAddress",
    );
    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("1mind-launch-v1")),
    );
    assert.equal(saved.imdAddress, "");
    await page.getByLabel("Contrato do token IMD").fill("");
  });
  await check(
    "Todas as rotas sem overflow em 320, 390, 768 e 1440 px",
    async () => {
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        for (const hash of [
          "inicio",
          "explorar",
          "tokenomics",
          "votar",
          "nfts",
          "lancamento",
        ]) {
          await route(hash);
          const dims = await page.evaluate(() => ({
            w: document.documentElement.clientWidth,
            scroll: document.documentElement.scrollWidth,
          }));
          assert.ok(
            dims.scroll <= dims.w + 1,
            `${hash} em ${width}: ${JSON.stringify(dims)}`,
          );
        }
      }
    },
  );
  await check("Varredura axe das seis rotas", async () => {
    const all = [];
    for (const hash of [
      "inicio",
      "explorar",
      "tokenomics",
      "votar",
      "nfts",
      "lancamento",
    ]) {
      await route(hash);
      const scan = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      all.push({ route: hash, violations: scan.violations });
    }
    await writeFile(`${out}/axe-${engine}.json`, JSON.stringify(all, null, 2));
    const issues = all.flatMap((x) =>
      x.violations.map(
        (v) =>
          `${x.route}: ${v.id} (${v.nodes.map((n) => n.target).join(",")})`,
      ),
    );
    assert.deepEqual(issues, []);
  });
  async function fits(locator, container) {
    const dimensions = await locator.evaluate((el) => ({
      width: el.clientWidth,
      scroll: el.scrollWidth,
    }));
    assert.ok(
      dimensions.scroll <= dimensions.width + 1,
      `Conteúdo excede o elemento: ${JSON.stringify(dimensions)}`,
    );
    const box = await locator.boundingBox(),
      parent = await container.boundingBox();
    assert.ok(box && parent);
    assert.ok(box.x >= parent.x - 1 && box.x + box.width <= parent.x + parent.width + 1);
  }
  await check("Nome e URL longos cabem na tabela e nos dois diálogos", async () => {
    const name = "PlataformaComunitariaDeEducacaoAmbiental";
    const description =
      "Acesse https://comunidade1mind.example/projetos/educacaoambiental/inscricoes para participar de oficinas abertas à comunidade.";
    await route("votar");
    await page.getByRole("button", { name: "Criar projeto", exact: true }).click();
    await page.getByLabel("Nome do projeto").fill(name);
    await page.getByLabel("Descrição").fill(description);
    await page.getByRole("button", { name: "Criar e avaliar projeto" }).click();
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 844 });
      await route("votar");
      const row = page.locator(".projects-table tbody tr").filter({ hasText: name });
      await fits(page.locator("html"), page.locator("html"));
      for (const selector of [".project-open strong", ".project-description"])
        await fits(row.locator(selector), row.locator("td").first());
      assert.equal(await row.locator(".project-open strong").innerText(), name);
      assert.equal(await row.locator(".project-description").innerText(), description);
      const nameBox = await row.locator(".project-open strong").boundingBox();
      const ratingBox = await row.locator(".rate-open").boundingBox();
      assert.ok(nameBox.x + nameBox.width <= ratingBox.x);
      await row.locator(".rate-open").click();
      const dialog = page.getByRole("dialog");
      await fits(dialog, page.locator("html"));
      await fits(dialog.locator("h2"), dialog);
      await fits(dialog.locator(".project-detail"), dialog);
      assert.equal(await dialog.locator("h2").innerText(), name);
      assert.equal(await dialog.locator(".project-detail").innerText(), description);
      const titleBox = await dialog.locator("h2").boundingBox();
      const closeBox = await dialog.getByRole("button", { name: "Fechar janela" }).boundingBox();
      assert.ok(titleBox.x + titleBox.width <= closeBox.x);
      await page.keyboard.press("Escape");
      await route("inicio");
      await page.getByRole("button", { name: /Conhecer Agente #47:/ }).click();
      await page.getByRole("tab", { name: /Projetos/ }).click();
      await fits(dialog, page.locator("html"));
      const ranking = dialog.locator(".project-ranking li").filter({ hasText: name });
      assert.equal(await ranking.count(), 1);
      await fits(ranking.locator("span").nth(1), ranking);
      await fits(ranking.locator(".rating"), ranking);
      const textBox = await ranking.locator("span").nth(1).boundingBox();
      const scoreBox = await ranking.locator(".rating").boundingBox();
      assert.ok(textBox.x + textBox.width <= scoreBox.x);
      await page.keyboard.press("Escape");
    }
  });
  await check("Início usa a liquidez salva, separada da capitalização", async () => {
    await route("inicio");
    assert.match(await page.locator(".home-stats").innerText(), /Liquidez inicial: 1\.250 IMD/);
    assert.match(await page.locator(".home-stats").innerText(), /Capitalização inicial\n2\.500/);
  });
  await check("Calculadora mantém valores grandes e fracionários completos a 320 px", async () => {
    await page.setViewportSize({ width: 320, height: 844 });
    await route("tokenomics");
    const input = page.getByLabel("Quantidade antes da taxa");
    const card = page.locator(".tax-calculator");
    for (const amount of ["999999999999.9999", "1000000000000", "999999999999.1234"]) {
      await input.fill(amount);
      assert.equal(await input.evaluate((el) => el.validity.valid), true);
      assert.equal(await input.getAttribute("aria-invalid"), "false");
      await fits(page.locator("html"), page.locator("html"));
      await fits(card, page.locator("html"));
      await fits(input, card);
      await fits(page.locator(".calculator-result > div > strong"), card);
      for (const value of await page.locator(".calculator-result dd").all())
        await fits(value, card);
      if (amount === "999999999999.9999")
        assert.match(await page.locator(".calculator-result").innerText(), /979\.999\.999\.999,9999 1MIND/);
    }
  });
  await check("Voto desconectado abre a carteira pelo próprio diálogo e pelo teclado", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await route("votar");
    await page.getByRole("button", { name: "Avaliar Horta do amanhã" }).click();
    await page.getByRole("button", { name: "Usar carteira" }).click();
    const dialog = page.getByRole("dialog");
    assert.equal(await dialog.getByRole("button", { name: "Confirmar avaliação" }).count(), 0);
    const connect = dialog.getByRole("button", { name: "Conectar carteira", exact: true });
    await connect.focus();
    await page.keyboard.press("Enter");
    await page.getByRole("dialog", { name: "Conecte sua carteira" }).waitFor();
    assert.equal(await page.locator("dialog[open]").count(), 1);
    assert.equal(await page.evaluate(() => document.querySelector("dialog").contains(document.activeElement)), true);
    await page.keyboard.press("Escape");
    await page.locator("dialog").waitFor({ state: "detached" });
    assert.equal(await page.locator("dialog").count(), 0);
    assert.equal(await page.evaluate(() => document.body.style.overflow), "");
  });
  await check("Nenhum erro JavaScript ou recurso local ausente", async () => {
    assert.deepEqual(errors, []);
    assert.deepEqual(requests, []);
  });
  await route("inicio");
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.screenshot({
    path: `${out}/inicio-1440-${engine}.png`,
    fullPage: true,
  });
  await context.close();
  // Wallet fixtures below exist only in isolated browser contexts; no network or money is involved.
  const walletContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  await walletContext.addInitScript(() => {
    const address = (n) => "0x" + n.toString(16).padStart(40, "1");
    const listeners = {};
    window.__wallet = {
      chain: "0x1",
      account: address(3),
      imd: 10n * 10n ** 18n,
      mind: 0n,
      reject: false,
      calls: [],
      emit: (name, value) => {
        for (const f of listeners[name] || []) f(value);
      },
    };
    window.ethereum = {
      on: (e, f) => {
        (listeners[e] ??= []).push(f);
      },
      removeListener: (e, f) => {
        listeners[e] = (listeners[e] || []).filter((x) => x !== f);
      },
      request: async ({ method, params }) => {
        const w = window.__wallet;
        w.calls.push(method);
        if (w.reject && method === "eth_requestAccounts") throw { code: 4001 };
        if (method === "eth_requestAccounts" || method === "eth_accounts")
          return [w.account];
        if (method === "eth_chainId") return w.chain;
        if (method === "wallet_switchEthereumChain") {
          w.chain = params[0].chainId;
          w.emit("chainChanged", w.chain);
          return null;
        }
        if (method === "eth_call") {
          const p = params[0];
          const value =
            p.data === "0x313ce567"
              ? 18n
              : p.to === address(1)
                ? w.imd
                : w.mind;
          return "0x" + value.toString(16).padStart(64, "0");
        }
        throw new Error("Método de escrita proibido no teste: " + method);
      },
    };
    localStorage.setItem(
      "1mind-launch-v1",
      JSON.stringify({
        chainId: "8453",
        imdAddress: address(1),
        tokenAddress: address(2),
        launchDate: "",
        initialLiquidity: "",
      }),
    );
  });
  const walletPage = await walletContext.newPage();
  await check(
    "Carteira injetada: rejeição, rede errada, troca e saldo elegível",
    async () => {
      await walletPage.goto(url);
      await walletPage
        .getByRole("button", { name: "Conectar carteira", exact: true })
        .click();
      await walletPage.evaluate(() => (window.__wallet.reject = true));
      await walletPage
        .getByRole("dialog")
        .getByRole("button", { name: "Conectar carteira", exact: true })
        .click();
      assert.match(
        await walletPage.getByRole("alert").innerText(),
        /cancelada/,
      );
      await walletPage.evaluate(() => (window.__wallet.reject = false));
      await walletPage
        .getByRole("dialog")
        .getByRole("button", { name: "Conectar carteira", exact: true })
        .click();
      await walletPage.getByRole("button", { name: "Trocar rede" }).waitFor();
      assert.match(
        await walletPage.getByRole("alert").innerText(),
        /outra rede/,
      );
      await walletPage.getByRole("button", { name: "Trocar rede" }).click();
      await walletPage
        .getByRole("button", { name: "Atualizar saldos" })
        .click();
      await walletPage
        .getByText("Elegível para a demonstração de voto.")
        .waitFor();
      assert.match(
        await walletPage.locator(".wallet-balances").innerText(),
        /10 IMD/,
      );
    },
  );
  await check(
    "Saldo insuficiente e mudança de conta invalidam elegibilidade",
    async () => {
      await walletPage.evaluate(() => {
        window.__wallet.imd = 0n;
      });
      await walletPage
        .getByRole("button", { name: "Atualizar saldos" })
        .click();
      await walletPage.getByText(/Saldo insuficiente/).waitFor();
      await walletPage.evaluate(() => {
        window.__wallet.account = "0x" + "4".repeat(40);
        window.__wallet.emit("accountsChanged", [window.__wallet.account]);
      });
      await walletPage.locator(".wallet-balances").waitFor({ state: "detached" });
      assert.equal(await walletPage.locator(".wallet-balances").count(), 0);
      assert.match(
        await walletPage.locator(".connected-address").innerText(),
        /444444/,
      );
      const calls = await walletPage.evaluate(() => window.__wallet.calls);
      assert.ok(!calls.some((c) => /sendTransaction|sign|approve/.test(c)));
    },
  );
  await check("Voto sem elegibilidade abre consulta; saldo elegível libera confirmação", async () => {
    await walletPage.keyboard.press("Escape");
    await walletPage.goto(url + "#votar");
    await walletPage.getByRole("button", { name: "Avaliar Horta do amanhã" }).click();
    await walletPage.getByRole("button", { name: "Usar carteira" }).click();
    let dialog = walletPage.getByRole("dialog");
    assert.equal(await dialog.getByRole("button", { name: "Confirmar avaliação" }).count(), 0);
    await dialog.getByRole("button", { name: "Ver elegibilidade" }).click();
    await walletPage.getByRole("dialog", { name: "Sua carteira" }).waitFor();
    assert.equal(await walletPage.locator("dialog[open]").count(), 1);
    await walletPage.getByRole("button", { name: "Atualizar saldos" }).click();
    await walletPage.getByText(/Saldo insuficiente/).waitFor();
    await walletPage.keyboard.press("Escape");
    await walletPage.getByRole("button", { name: "Avaliar Horta do amanhã" }).click();
    dialog = walletPage.getByRole("dialog");
    await dialog.getByRole("button", { name: "Ver elegibilidade" }).click();
    await walletPage.evaluate(() => { window.__wallet.mind = 10n ** 18n; });
    await walletPage.getByRole("button", { name: "Atualizar saldos" }).click();
    await walletPage.getByText("Elegível para a demonstração de voto.").waitFor();
    await walletPage.keyboard.press("Escape");
    await walletPage.getByRole("button", { name: "Avaliar Horta do amanhã" }).click();
    await walletPage.getByRole("radio", { name: "5 estrelas", exact: true }).check();
    await walletPage.getByRole("button", { name: "Confirmar avaliação" }).click();
    await walletPage.getByRole("button", { name: "Avaliar Horta do amanhã" }).click();
    assert.match(await walletPage.getByRole("dialog").innerText(), /já avaliou este projeto com 5/);
    assert.equal(await walletPage.getByRole("button", { name: "Confirmar avaliação" }).count(), 0);
    const calls = await walletPage.evaluate(() => window.__wallet.calls);
    assert.ok(!calls.some((c) => /sendTransaction|sign|approve/.test(c)));
    await walletPage.keyboard.press("Escape");
  });
  await walletContext.close();
  const corruptContext = await browser.newContext();
  await corruptContext.addInitScript(() => {
    localStorage.setItem("1mind-projects-v1", '{"bad":true}');
    localStorage.setItem("1mind-launch-v1", "not-json");
    localStorage.setItem("1mind-collection-v1", "[999]");
  });
  const corrupt = await corruptContext.newPage();
  await check(
    "Armazenamento corrompido recupera padrões utilizáveis",
    async () => {
      await corrupt.goto(url + "#votar");
      assert.equal(
        await corrupt.locator(".projects-table tbody tr").count(),
        10,
      );
    },
  );
  await corruptContext.close();
  const historyContext = await browser.newContext();
  const historyPage = await historyContext.newPage();
  await check(
    "Histórico publicado muda de data e mostra três carteiras parciais",
    async () => {
      const a = (n) => "0x" + String(n).repeat(40);
      const rounds = [
        {
          date: "2026-10-09T23:59:00Z",
          weeklySales: "100",
          transactionHash: "0x" + "a".repeat(64),
          winners: [1, 2, 3].map((n) => ({ address: a(n), amount: "10" })),
        },
        {
          date: "2026-10-16T23:59:00Z",
          weeklySales: "200",
          transactionHash: "0x" + "b".repeat(64),
          winners: [4, 5, 6].map((n) => ({ address: a(n), amount: "20" })),
        },
      ];
      await historyPage.route("**/data/distributions.json", (r) =>
        r.fulfill({ json: { version: 1, rounds } }),
      );
      await historyPage.goto(url + "#nfts");
      await historyPage.locator(".winner-empty abbr").first().waitFor();
      assert.equal(await historyPage.locator(".winner-empty abbr").count(), 3);
      assert.match(
        await historyPage.locator(".winners-grid").innerText(),
        /20 1MIND/,
      );
      await historyPage
        .getByLabel("Data da distribuição")
        .selectOption("2026-10-09T23:59:00Z");
      assert.match(
        await historyPage.locator(".winners-grid").innerText(),
        /10 1MIND/,
      );
    },
  );
  await check("Histórico com erro permite tentar novamente", async () => {
    await historyPage.unroute("**/data/distributions.json");
    let attempt = 0;
    await historyPage.route("**/data/distributions.json", (r) =>
      ++attempt === 1
        ? r.fulfill({ status: 503, body: "indisponível" })
        : r.fulfill({ json: { version: 1, rounds: [] } }),
    );
    await historyPage.reload();
    await historyPage
      .getByRole("button", { name: "Tentar novamente" })
      .waitFor();
    await historyPage.getByRole("button", { name: "Tentar novamente" }).click();
    await historyPage
      .getByText("Aguardando primeiro sorteio", { exact: true })
      .first()
      .waitFor();
    assert.equal(
      await historyPage
        .getByText("Aguardando primeiro sorteio", { exact: true })
        .count(),
      3,
    );
  });
  await historyContext.close();
} catch (error) {
  results.push({
    name: "Execução do navegador",
    passed: false,
    error: error.stack,
  });
  console.error(error);
} finally {
  await browser?.close();
  server.close();
  await writeFile(
    `${out}/results-${engine}.json`,
    JSON.stringify(
      {
        engine,
        results,
        passed: results.filter((r) => r.passed).length,
        total: results.length,
        errors,
        requests,
      },
      null,
      2,
    ),
  );
}
console.log(
  `${results.filter((r) => r.passed).length}/${results.length} verificações passaram em ${engine}.`,
);
if (results.some((r) => !r.passed)) process.exitCode = 1;
