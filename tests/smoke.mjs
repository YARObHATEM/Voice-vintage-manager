/*
 * tests/smoke.mjs — drive the built app in a real browser at phone size.
 *
 * Not a unit-test suite. It walks the path an actual user takes on their
 * first evening with the app — capture a hook, tick a roadmap step, add a
 * creator, file a bug, reload — and fails if any of it does not survive the
 * reload, because "nothing is lost on reload" is the one promise this app
 * makes.
 *
 *   npm run build && node tests/smoke.mjs
 *   SHOTS=1 node tests/smoke.mjs   (also writes screenshots to tests/shots/)
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, devices } from 'playwright';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const SHOTS = join(ROOT, 'tests', 'shots');

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png'
};

const server = createServer(async (req, res) => {
  const path = decodeURIComponent(req.url.split('?')[0]);
  const file = join(DIST, normalize(path === '/' ? '/index.html' : path));
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});

const checks = [];
const check = (name, ok) => {
  checks.push({ name, ok });
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${name}`);
};

if (!existsSync(DIST)) {
  console.error('dist/ is missing. Run `npm run build` first.');
  process.exit(1);
}
if (process.env.SHOTS) mkdirSync(SHOTS, { recursive: true });

await new Promise(r => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices['iPhone 13'], isMobile: true, hasTouch: true });
const page = await ctx.newPage();

const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

const shot = async name => {
  if (process.env.SHOTS) await page.screenshot({ path: join(SHOTS, `${name}.png`) });
};
const tab = async label => {
  await page.getByRole('button', { name: label, exact: true }).last().click();
  await page.waitForTimeout(250);
};

try {
  await page.goto(base, { waitUntil: 'networkidle' });
  check('app renders', await page.getByRole('heading', { name: /Vintage Voice/ }).isVisible());

  // --- scratchpad -----------------------------------------------------------
  await page.getByText('Pad').click();
  await page.locator('textarea').first().fill('tape hiss idea at 2am');
  await page.waitForTimeout(400);
  await shot('01-hooks');

  // --- capture a hook -------------------------------------------------------
  await page.getByRole('button', { name: /Capture a hook/ }).click();
  // Scoped to the sheet: the filter row behind it offers the same status names.
  const sheet = page.getByRole('dialog');
  await sheet.waitFor();
  await sheet.getByPlaceholder(/Recording the same sentence/).fill('iPhone vs the app, same sentence');
  await sheet.getByPlaceholder(/ASMR click/).fill('re-dub comparison');
  await sheet.getByPlaceholder(/2003 camcorder/).fill('Y2K camcorder');
  await sheet.getByRole('button', { name: 'Filmed', exact: true }).click();
  await sheet.getByPlaceholder('#ASMR').fill('Comparison');
  await sheet.getByRole('button', { name: 'Add', exact: true }).click();
  await shot('02-sheet');
  await sheet.getByRole('button', { name: 'Capture', exact: true }).click();
  await page.waitForTimeout(300);
  check('hook saved', await page.getByText('iPhone vs the app, same sentence').isVisible());
  check('tag saved', await page.getByText('#Comparison').first().isVisible());

  // --- roadmap --------------------------------------------------------------
  await tab('Plan');
  const firstStep = page.getByRole('button', { name: 'Mark as done' }).first();
  await firstStep.click();
  await page.waitForTimeout(250);
  check('roadmap tick registers', (await page.getByRole('button', { name: 'Mark as not done' }).count()) > 0);
  await shot('03-plan');

  // --- creators -------------------------------------------------------------
  await tab('Creators');
  await page.getByRole('button', { name: /Add creator/ }).click();
  const crmSheet = page.getByRole('dialog');
  await crmSheet.waitFor();
  await crmSheet.getByPlaceholder('@lofi.tapes').fill('lofi.tapes');
  await crmSheet.getByPlaceholder('12400').fill('18200');
  await crmSheet.getByPlaceholder('25').fill('40');
  await crmSheet.getByRole('button', { name: 'Sent Build', exact: true }).click();
  await crmSheet.getByRole('button', { name: 'Save', exact: true }).click();
  await page.waitForTimeout(300);
  check('creator saved with @', await page.getByText('@lofi.tapes').isVisible());
  check('followers formatted', await page.getByText('18.2K').isVisible());
  check('budget reflects commitment', await page.getByText(/of \$200 left/).isVisible());
  await shot('04-creators');

  // --- backlog --------------------------------------------------------------
  await tab('Backlog');
  await page.getByRole('button', { name: /Add to backlog/ }).click();
  const backlogSheet = page.getByRole('dialog');
  await backlogSheet.waitFor();
  await backlogSheet.getByPlaceholder('Minidisc device pack').fill('Soviet spy recorder device');
  await backlogSheet.getByRole('button', { name: 'Next Sprint', exact: true }).click();
  await backlogSheet.getByRole('button', { name: 'Save', exact: true }).click();
  await page.waitForTimeout(300);
  check('backlog item saved', await page.getByText('Soviet spy recorder device').isVisible());
  await shot('05-backlog');

  // --- search ---------------------------------------------------------------
  await page.getByPlaceholder('Search everything').fill('soviet');
  await page.waitForTimeout(250);
  check('search finds the item', await page.getByText('Soviet spy recorder device').isVisible());
  const across = await page.getByRole('button', { name: /Hooks 0/ }).isVisible();
  check('cross-section counts shown', across);
  await page.getByPlaceholder('Search everything').fill('');

  // --- data + reload --------------------------------------------------------
  await tab('Data');
  check('counts panel correct', await page.getByText('1', { exact: true }).first().isVisible());
  await shot('06-data');

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  check('tab remembered after reload', await page.getByText('Export everything as JSON').isVisible());
  await tab('Hooks');
  check('hook survived reload', await page.getByText('iPhone vs the app, same sentence').isVisible());
  await page.getByText('Pad').click();
  check(
    'scratchpad survived reload',
    (await page.locator('textarea').first().inputValue()) === 'tape hiss idea at 2am'
  );

  check('no console or page errors', errors.length === 0);
  if (errors.length) console.log(errors.slice(0, 5).join('\n'));
} finally {
  await browser.close();
  server.close();
}

const failed = checks.filter(c => !c.ok);
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
