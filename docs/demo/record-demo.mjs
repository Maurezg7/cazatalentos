/**
 * Graba un recorrido silencioso de Cazatalentos (producción).
 * Uso: PLAYWRIGHT_BROWSERS_PATH=./.browsers node record-demo.mjs
 */
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = __dirname;
const VIDEO_DIR = path.join(OUT_DIR, 'video-raw');
const BASE = process.env.DEMO_URL || 'https://cazatalentos.vercel.app';

fs.rmSync(VIDEO_DIR, { recursive: true, force: true });
fs.mkdirSync(VIDEO_DIR, { recursive: true });

async function wait(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function smoothScroll(page, totalY, steps = 12, stepMs = 180) {
  const delta = totalY / steps;
  for (let i = 0; i < steps; i++) {
    await page.evaluate((d) => window.scrollBy(0, d), delta);
    await wait(stepMs);
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: VIDEO_DIR,
      size: { width: 1280, height: 720 },
    },
    locale: 'es-AR',
  });
  const page = await context.newPage();

  // --- Escena 1: Home hero (~16s) ---
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 60_000 });
  await page.waitForSelector('text=CREÍSTE PRIMERO', { timeout: 30_000 }).catch(() => {});
  await wait(5500);
  await smoothScroll(page, 80, 3, 220);
  await wait(3000);

  // --- Escena 1b: Pozos abiertos (~32s) ---
  const verPozos = page.getByRole('link', { name: /Ver pozos abiertos/i });
  if (await verPozos.isVisible().catch(() => false)) {
    await verPozos.click();
  } else {
    await page.locator('#pozos').scrollIntoViewIfNeeded().catch(() => {});
  }
  await page.waitForSelector('#pozos', { timeout: 20_000 }).catch(() => {});
  await page.locator('#pozos').scrollIntoViewIfNeeded().catch(() => {});
  await wait(5000);
  // Recorrer grilla de pozos (montos, avance, CTA Estuve antes)
  await page.locator('#pozos').evaluate((el) => {
    el.scrollIntoView({ block: 'start' });
  }).catch(() => {});
  await wait(2500);
  await smoothScroll(page, 280, 8, 220);
  await wait(3500);
  await smoothScroll(page, 360, 10, 200);
  await wait(3500);
  await smoothScroll(page, 320, 8, 200);
  await wait(3000);
  // “Cómo funciona el pozo” (depósito, custodia, meta)
  const comoPozo = page.getByRole('heading', { name: /Cómo funciona el pozo/i });
  if (await comoPozo.isVisible().catch(() => false)) {
    await comoPozo.scrollIntoViewIfNeeded();
    await wait(4500);
    await smoothScroll(page, 280, 8, 220);
    await wait(3500);
  }

  // --- Escena 2: Patrocinados + cartelera (~18s) ---
  await page.locator('text=/Patrocinados/i').first().scrollIntoViewIfNeeded().catch(() => {});
  await wait(2500);
  const nextBtn = page.getByRole('button', { name: 'Siguiente' });
  if (await nextBtn.isVisible().catch(() => false)) {
    await nextBtn.click();
    await wait(1500);
    await nextBtn.click();
    await wait(1500);
  }
  await smoothScroll(page, 700, 12, 200);
  await wait(3000);

  // Mostrar Mauro en cartelera y luego abrir su perfil (foto/portada propias)
  const mauroCard = page.getByRole('link', { name: /Mauro/i }).first();
  if (await mauroCard.isVisible().catch(() => false)) {
    await mauroCard.scrollIntoViewIfNeeded();
    await wait(2500);
  }
  await page.goto(BASE + '/artist/2', { waitUntil: 'domcontentloaded' });

  // --- Escena 3: Perfil artista (~30s) ---
  await page.waitForSelector('text=MAURO', { timeout: 45_000 }).catch(() => {});
  await page
    .waitForFunction(() => {
      const img = [...document.images].find((i) => /\/photo|\/cover/.test(i.src));
      return img && img.naturalWidth > 40;
    }, { timeout: 45_000 })
    .catch(() => {});
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(8000);
  await smoothScroll(page, 220, 6, 250);
  await wait(3500);
  await smoothScroll(page, 380, 10, 220);
  await wait(3500);
  await smoothScroll(page, 380, 10, 220);
  await wait(3000);

  const mediaThumb = page.locator('video, [class*="reel"] button, button:has(img)').first();
  if (await mediaThumb.isVisible().catch(() => false)) {
    await mediaThumb.click({ timeout: 3000 }).catch(() => {});
    await wait(4000);
    await page.keyboard.press('Escape').catch(() => {});
    await wait(800);
  }

  // --- Escena 4: Explorar (~20s) ---
  await page.goto(BASE + '/explorar', { waitUntil: 'networkidle' });
  await page.waitForSelector('text=/Mauro|Zamba|pionero/i', { timeout: 45_000 }).catch(() => {});
  await wait(4500);
  await smoothScroll(page, 280, 8, 220);
  await wait(2500);

  const orden = page.getByRole('button', { name: /orden|pioneros|recientes/i }).first();
  if (await orden.isVisible().catch(() => false)) {
    await orden.click();
    await wait(1800);
  }
  const filtro = page.locator('select, input[type="search"], input[placeholder]').first();
  if (await filtro.isVisible().catch(() => false)) {
    await filtro.click();
    await wait(1200);
  }
  await smoothScroll(page, 420, 10, 200);
  await wait(3500);

  // --- Escena 5: Cómo funciona (~25s) ---
  await page.goto(BASE + '/como-funciona', { waitUntil: 'networkidle' });
  await wait(4500);
  await smoothScroll(page, 520, 12, 220);
  await wait(3500);
  await smoothScroll(page, 620, 12, 220);
  await wait(3500);
  await smoothScroll(page, 520, 10, 220);
  await wait(3000);

  // --- Escena 6: Cierre en home (~15s) ---
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await wait(8000);

  await context.close();
  await browser.close();

  // Playwright escribe webm en VIDEO_DIR
  const raw = fs.readdirSync(VIDEO_DIR).find((f) => f.endsWith('.webm'));
  if (!raw) throw new Error('No se generó video raw');
  const rawPath = path.join(VIDEO_DIR, raw);
  const webmOut = path.join(OUT_DIR, 'cazatalentos-demo.webm');
  const mp4Out = path.join(OUT_DIR, 'cazatalentos-demo.mp4');
  fs.copyFileSync(rawPath, webmOut);

  // Transcode a H.264 silencioso con ffmpeg del sistema
  const { spawnSync } = await import('node:child_process');
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
    throw new Error('ffmpeg falló');
  }

  console.log(JSON.stringify({ webm: webmOut, mp4: mp4Out, bytes: fs.statSync(mp4Out).size }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
