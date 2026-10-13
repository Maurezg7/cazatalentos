/**
 * Silent full-app demo in English + dark mode.
 * Shows live on-chain pools (Approved / Rejected / Open) from real accounts.
 * Requires local web + API: http://127.0.0.1:5173
 */
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const OUT_DIR = '/home/deiko/Documentos/cazatalentos/docs/demo';
const VIDEO_DIR = path.join(OUT_DIR, 'video-raw');
// Use localhost (not 127.0.0.1) so Privy CSP frame-ancestors allow the iframe.
const BASE = process.env.DEMO_URL || 'http://localhost:5173';
const OPEN_POOL_ID = process.env.DEMO_POOL_ID || '3';
const APPROVED_POOL_ID = process.env.DEMO_APPROVED_POOL_ID || '1';
const CLOSED_POOL_ID = process.env.DEMO_CLOSED_POOL_ID || '2';

fs.rmSync(VIDEO_DIR, { recursive: true, force: true });
fs.mkdirSync(VIDEO_DIR, { recursive: true });

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function smoothScroll(page, totalY, steps = 10, stepMs = 200) {
  const delta = totalY / steps;
  for (let i = 0; i < steps; i++) {
    await page.evaluate((d) => window.scrollBy(0, d), delta);
    await wait(stepMs);
  }
}

async function hold(_page, ms) {
  await wait(ms);
}

// Headless Chromium on this host has broken web fonts; force system faces for the capture.
const FONT_FIX = `
  :root, .dark {
    --font-display: "DejaVu Sans", "Liberation Sans", "Noto Sans", sans-serif !important;
    --font-body: "DejaVu Sans", "Liberation Sans", "Noto Sans", sans-serif !important;
  }
  * {
    font-family: "DejaVu Sans", "Liberation Sans", "Noto Sans", sans-serif !important;
  }
  .hero-title, .font-display, .display-num, h1, h2, h3 {
    font-weight: 800 !important;
    line-height: 1.15 !important;
  }
  .hero-title {
    font-size: 3.25rem !important;
    min-height: 6.5rem !important;
  }
`;

async function forcePrefs(page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('ct-theme', 'dark');
      localStorage.setItem('ct-locale', 'en');
      document.documentElement?.classList?.add('dark');
      document.documentElement.lang = 'en';
    } catch {
      /* ignore */
    }
  });
}

async function ensurePrefs(page) {
  await page.evaluate(() => {
    try {
      localStorage.setItem('ct-theme', 'dark');
      localStorage.setItem('ct-locale', 'en');
      document.documentElement?.classList?.add('dark');
      document.documentElement.lang = 'en';
    } catch {
      /* ignore */
    }
    const enBtn = [...document.querySelectorAll('button')].find(
      (b) => b.getAttribute('aria-pressed') !== null && b.textContent?.trim() === 'EN',
    );
    if (enBtn && enBtn.getAttribute('aria-pressed') !== 'true') enBtn.click();
  });
  await page.addStyleTag({ content: FONT_FIX }).catch(() => {});
}

async function waitForPoolUi(page) {
  await page
    .waitForSelector('text=/Pool detail|Detalle|Open|Abierto|Approved|Aprobado|Rejected|Rechazado|Reclaimed|RECLAMADO/i', {
      timeout: 60_000,
    })
    .catch(() => {});
}

async function main() {
  const chromeBin = process.env.PLAYWRIGHT_CHROME
    || '/tmp/pw-browsers/chromium-1187/chrome-linux/chrome';
  const browser = await chromium.launch({
    executablePath: chromeBin,
    headless: true,
    args: ['--enable-unsafe-swiftshader', '--font-render-hinting=none', '--disable-font-subpixel-positioning'],
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    recordVideo: { dir: VIDEO_DIR, size: { width: 1280, height: 720 } },
    locale: 'en-US',
    colorScheme: 'dark',
  });
  const page = await context.newPage();
  await forcePrefs(page);

  // ── Home + open pools (seeded board + live Copleros pool #3) ──
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await ensurePrefs(page);
  await page.waitForSelector('#hero-title', { state: 'attached', timeout: 45_000 });
  await page.waitForSelector('#pozos', { state: 'attached', timeout: 45_000 }).catch(() => {});
  await page.waitForFunction(
    () => (document.querySelector('#hero-title')?.getBoundingClientRect().height || 0) > 40,
    { timeout: 30_000 },
  ).catch(() => {});
  await page.evaluate(() => window.scrollTo(0, 0));
  await hold(page, 4500);

  const openPoolsCta = page.getByRole('link', { name: /View open pools|Ver pozos abiertos/i });
  if (await openPoolsCta.isVisible().catch(() => false)) await openPoolsCta.click();
  else await page.locator('#pozos').scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForSelector('#pozos', { timeout: 20_000 }).catch(() => {});
  await hold(page, 3500);
  // Prefer the live Copleros / Valley Copleros card if present
  const copleros = page.getByRole('heading', { name: /Copleros|Valley Copleros/i }).first();
  if (await copleros.isVisible().catch(() => false)) {
    await copleros.scrollIntoViewIfNeeded();
    await hold(page, 2000);
  }
  await smoothScroll(page, 420, 10, 180);
  await hold(page, 3500);

  // ── Fan: artist 1 (Los Copleros) — on-chain profile + leave mark CTA ──
  await page.goto(BASE + '/artist/1', { waitUntil: 'domcontentloaded' });
  await ensurePrefs(page);
  await hold(page, 4000); // wallet / profile boot
  await page
    .waitForFunction(
      () =>
        /Copleros|Leave my mark|Entrar para dejar|Dejar mi marca|Open a pool|Abrir|Pioneer|Pionero|I was there/i.test(
          document.body?.innerText || '',
        ),
      { timeout: 60_000 },
    )
    .catch(() => {});
  await page.evaluate(() => window.scrollTo(0, 0));
  await hold(page, 4500);
  await smoothScroll(page, 480, 12, 180);
  await hold(page, 3500);

  const leaveMark = page
    .getByRole('button', { name: /Enter to leave my mark|Leave my mark|Entrar para dejar|Dejar mi marca/i })
    .first();
  if (await leaveMark.isVisible().catch(() => false)) {
    await leaveMark.scrollIntoViewIfNeeded();
    await hold(page, 1200);
    await leaveMark.click();
    await hold(page, 4500);
    await page.keyboard.press('Escape').catch(() => {});
    await page.locator('body').click({ position: { x: 20, y: 20 } }).catch(() => {});
    await hold(page, 1000);
  }

  // Show artist pools list with live open pool
  const myPools = page.getByText(/My pools|Mis pozos|Pools|Pozos/i).first();
  if (await myPools.isVisible().catch(() => false)) {
    await myPools.scrollIntoViewIfNeeded();
    await hold(page, 2500);
  }

  // ── Approved pool (Mauro #1 — real vote + claim path) ──
  await page.goto(BASE + `/pool/${APPROVED_POOL_ID}`, { waitUntil: 'domcontentloaded' });
  await ensurePrefs(page);
  await hold(page, 3500); // wallet stack boot
  await waitForPoolUi(page);
  await page.waitForSelector('text=/Approved|Aprobado|Claim|Reclamar|Consensus|Consenso|REGISTRY|REGISTRO/i', { timeout: 60_000 }).catch(() => {});
  await hold(page, 5500);
  await smoothScroll(page, 420, 10, 180);
  await hold(page, 3500);

  // ── Closed / rejected pool (Mauro #2) ──
  await page.goto(BASE + `/pool/${CLOSED_POOL_ID}`, { waitUntil: 'domcontentloaded' });
  await ensurePrefs(page);
  await waitForPoolUi(page);
  await page
    .waitForSelector('text=/Rejected|Rechazado|Reclaimed|RECLAMADO|recovered|recuperado|Closed|Cerrad/i', {
      timeout: 45_000,
    })
    .catch(() => {});
  await hold(page, 5500);
  await smoothScroll(page, 400, 10, 180);
  await hold(page, 3500);

  // ── Live open pool #3 (fan + artist DemoFanArtist txs) ──
  await page.goto(BASE + `/pool/${OPEN_POOL_ID}`, { waitUntil: 'domcontentloaded' });
  await ensurePrefs(page);
  await hold(page, 4000); // wallet stack boot
  await waitForPoolUi(page);
  await page.waitForSelector('text=/Open|Abierto|0\\.01|0,01|Copleros|REGISTRY|REGISTRO|Pool detail|Detalle/i', {
    timeout: 60_000,
  }).catch(() => {});
  await hold(page, 6500);
  await smoothScroll(page, 460, 12, 180);
  await hold(page, 4500);

  // ── Explore (EN names) ──
  await page.goto(BASE + '/explorar', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await ensurePrefs(page);
  await hold(page, 2500);
  await page
    .waitForFunction(
      () => /Explore|Explorar|Lunar Zamba|Zamba|Copleros|artists|artistas/i.test(document.body?.innerText || ''),
      { timeout: 45_000 },
    )
    .catch(() => {});
  await hold(page, 4000);
  await smoothScroll(page, 400, 10, 180);
  await hold(page, 3000);

  // ── How it works ──
  await page.goto(BASE + '/como-funciona', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await ensurePrefs(page);
  await hold(page, 2500);
  await page
    .waitForFunction(
      () => /How it works|Cómo funciona|four steps|cuatro pasos/i.test(document.body?.innerText || ''),
      { timeout: 45_000 },
    )
    .catch(() => {});
  await hold(page, 4000);
  await smoothScroll(page, 520, 12, 160);
  await hold(page, 3000);

  // ── Mauro profile ──
  await page.goto(BASE + '/artist/2', { waitUntil: 'domcontentloaded' });
  await ensurePrefs(page);
  await page.waitForSelector('text=MAURO', { timeout: 45_000 });
  await page
    .waitForFunction(() => {
      const img = [...document.images].find((i) => /\/photo|\/cover|media/.test(i.src));
      return img && img.naturalWidth > 40;
    }, { timeout: 45_000 })
    .catch(() => {});
  await page.evaluate(() => window.scrollTo(0, 0));
  await hold(page, 5000);
  await smoothScroll(page, 360, 10, 180);
  await hold(page, 3000);

  // ── EN/ES toggle on home, end on EN ──
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await ensurePrefs(page);
  await hold(page, 2000);
  const esBtn = page.getByRole('button', { name: 'ES', exact: true });
  if (await esBtn.isVisible().catch(() => false)) {
    await esBtn.click();
    await hold(page, 2800);
    await page.getByRole('button', { name: 'EN', exact: true }).click();
    await hold(page, 2800);
  }
  await page.locator('#pozos').scrollIntoViewIfNeeded().catch(() => {});
  await hold(page, 4000);

  await context.close();
  await browser.close();

  const raw = fs.readdirSync(VIDEO_DIR).find((f) => f.endsWith('.webm'));
  if (!raw) throw new Error('No raw video generated');
  const webmOut = path.join(OUT_DIR, 'cazatalentos-demo.webm');
  const mp4Out = path.join(OUT_DIR, 'cazatalentos-demo.mp4');
  fs.copyFileSync(path.join(VIDEO_DIR, raw), webmOut);

  const ff = spawnSync(
    'ffmpeg',
    [
      '-y',
      '-i',
      webmOut,
      '-an',
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      '-crf',
      '20',
      '-preset',
      'medium',
      mp4Out,
    ],
    { encoding: 'utf8' },
  );
  if (ff.status !== 0) {
    console.error(ff.stderr);
    throw new Error('ffmpeg failed');
  }
  console.log(
    JSON.stringify(
      {
        mp4: mp4Out,
        bytes: fs.statSync(mp4Out).size,
        openPoolId: OPEN_POOL_ID,
        approvedPoolId: APPROVED_POOL_ID,
        closedPoolId: CLOSED_POOL_ID,
        theme: 'dark',
        locale: 'en',
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
