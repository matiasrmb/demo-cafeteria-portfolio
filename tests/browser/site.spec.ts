import { test, expect } from "@playwright/test";
import { demoContent } from "../../src/data/demo";

test("all four public routes have navigation, fictional disclosures and noindex metadata", async ({
  page,
}) => {
  for (const route of ["/", "/menu/", "/grupos-y-eventos/", "/reservas/"]) {
    await page.goto(route);
    await expect(page.locator("main h1")).toHaveCount(1);
    await expect(page.locator('nav[aria-label="Principal"] a')).toHaveCount(4);
    await expect(page.locator('nav [aria-current="page"]')).toHaveCount(1);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
    await expect(page.locator("footer")).toContainText(
      "Todo es de demostración",
    );
    await expect(
      page.locator('script[type="application/ld+json"]'),
    ).toHaveCount(0);
  }
});

test("mobile and desktop fit without overflow and expose a keyboard skip link", async ({
  page,
}, testInfo) => {
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("link", { name: "Saltar al contenido" }),
    ).toBeFocused();
    await page.screenshot({
      path: testInfo.outputPath(`home-${width}.png`),
      fullPage: true,
    });
  }
});

test("menu categories and products work as keyboard-accessible in-page links", async ({
  page,
}) => {
  await page.goto("/menu/");
  await page.getByRole("link", { name: "Del horno", exact: true }).click();
  await expect(page).toHaveURL(/#bakery$/);
  await expect(
    page.getByRole("heading", { name: "Espresso de la casa" }),
  ).toBeVisible();
  await expect(
    page.getByText("Precios ilustrativos en pesos chilenos"),
  ).toBeVisible();
});

test("calendar validates fields, separates request types and never generates an unconfigured recipient link", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-26T11:00:00Z") });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/reservas/");
  const submit = page.getByRole("button", { name: "Revisar solicitud" });
  await expect(submit).toBeDisabled();
  await page.getByLabel("Nombre", { exact: true }).fill("Persona de prueba");
  await page.locator('button[data-date="2026-10-27"]').click();
  await page.getByLabel("Hora", { exact: true }).selectOption("10:00");
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(page.locator("#request-summary")).toContainText(
    "Persona de prueba",
  );
  await expect(page.locator("#request-summary")).toContainText("10:00");
  await expect(page.locator("#destination-status")).toContainText(
    "WhatsApp no configurado",
  );
  await expect(page.locator('a[href^="https://wa.me/"]')).toHaveCount(0);
  await page.getByLabel("Cantidad de personas").fill("7");
  await expect(submit).toBeDisabled();
  await page.getByLabel("Tipo de solicitud").selectOption("event");
  await page.getByLabel("Hora", { exact: true }).selectOption("10:00");
  await expect(submit).toBeEnabled();
  await page.getByLabel("Nombre", { exact: true }).fill("");
  await expect(submit).toBeDisabled();
  expect(
    await page.evaluate(() => ({
      local: localStorage.length,
      session: sessionStorage.length,
      cookies: document.cookie,
    })),
  ).toEqual({ local: 0, session: 0, cookies: "" });
  expect(errors).toEqual([]);
});

test("calendar exposes closed dates and an explicitly selected date", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-26T11:00:00Z") });
  await page.goto("/reservas/");
  const date = page.locator('button[data-date="2026-10-27"]');
  await date.click();
  await expect(date).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Mes siguiente" }).click();
  await expect(page.locator('button[data-date="2026-11-01"]')).toBeDisabled();
});

test("published calendar settings and configured WhatsApp target work without any external request", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-26T11:00:00Z") });
  const availability = structuredClone(demoContent.availability);
  availability.closedDates = ["2026-10-28"];
  availability.exceptions = [
    {
      date: "2026-10-27",
      closed: false,
      opens: "14:00",
      closes: "16:00",
      interval: 60,
      tableCapacity: 2,
      eventCapacity: 12,
    },
  ];
  const reservedTestNumber = "12025550123";
  await page.route("**/reservas/", async (route) => {
    const response = await route.fetch();
    const config = JSON.stringify({
      availability,
      whatsapp: reservedTestNumber,
    })
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;");
    const body = (await response.text()).replace(
      /data-config="[^"]*"/,
      `data-config="${config}"`,
    );
    await route.fulfill({ response, body });
  });
  await page
    .context()
    .route("https://wa.me/**", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: "<p>Offline navigation probe. No message sent.</p>",
      }),
    );
  await page.goto("/reservas/");
  await expect(page.locator('button[data-date="2026-10-28"]')).toBeDisabled();
  await page.locator('button[data-date="2026-10-27"]').click();
  await expect(
    page.getByLabel("Hora", { exact: true }).locator("option"),
  ).toHaveText(["Selecciona un horario", "14:00", "15:00"]);
  await page.getByLabel("Nombre", { exact: true }).fill("Persona & prueba");
  await page.getByLabel("Hora", { exact: true }).selectOption("14:00");
  await page.getByRole("button", { name: "Revisar solicitud" }).click();
  const link = page.getByRole("link", { name: "Abrir WhatsApp para revisar" });
  const url = new URL((await link.getAttribute("href"))!);
  expect(url.hostname).toBe("wa.me");
  expect(url.pathname).toBe(`/${reservedTestNumber}`);
  expect(url.searchParams.get("text")).toContain("Persona & prueba");
  expect(url.searchParams.get("text")).toContain("2026-10-27");
  expect(url.searchParams.get("text")).toContain("14:00");
  const popupPromise = page.waitForEvent("popup");
  await link.click();
  const popup = await popupPromise;
  await expect(
    popup.getByText("Offline navigation probe. No message sent."),
  ).toBeVisible();
  await popup.close();
});
