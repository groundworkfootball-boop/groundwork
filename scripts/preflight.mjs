/**
 * Pre-deploy preflight. Verifies the things that silently break a deploy:
 * region alignment, function exports, rules syntax, and required config.
 * Run with: npm run preflight
 */
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const results = [];

function check(name, fn) {
  try {
    const detail = fn();
    results.push({ name, ok: true, detail });
  } catch (err) {
    results.push({ name, ok: false, detail: err.message });
  }
}

function readJson(rel) {
  return JSON.parse(readFileSync(resolve(root, rel), 'utf8'));
}

// 1. Client and server must agree on the region, or every callable 404s and the
//    browser reports it as a CORS failure.
check('Functions region matches client', () => {
  const indexSrc = readFileSync(resolve(root, 'functions/src/index.ts'), 'utf8');
  const serverRegion = indexSrc.match(/region:\s*'([^']+)'/)?.[1];
  if (!serverRegion) throw new Error('setGlobalOptions region not found in functions/src/index.ts');

  const envPath = resolve(root, '.env');
  const envRegion = existsSync(envPath)
    ? readFileSync(envPath, 'utf8').match(/VITE_FUNCTIONS_REGION=(.+)/)?.[1]?.trim()
    : undefined;
  const clientRegion = envRegion || 'europe-west2';

  if (serverRegion !== clientRegion) {
    throw new Error(`server=${serverRegion} client=${clientRegion} — these must match`);
  }
  return serverRegion;
});

// 2. Cost guardrails must be present before deploying to a paid plan.
check('Cost guardrails present', () => {
  const src = readFileSync(resolve(root, 'functions/src/index.ts'), 'utf8');
  const missing = ['maxInstances', 'concurrency', 'memory', 'timeoutSeconds'].filter(
    (k) => !src.includes(k),
  );
  if (missing.length) throw new Error(`missing: ${missing.join(', ')}`);
  return 'maxInstances, concurrency, memory, timeoutSeconds';
});

// 3. Every function must actually compile and export.
check('Functions build and export', () => {
  execSync('npm --prefix functions run build', { cwd: root, stdio: 'pipe' });
  const out = execSync(
    `node -e "const m=require('./functions/lib/index.js');console.log(Object.keys(m).length)"`,
    {
      cwd: root,
      stdio: 'pipe',
      env: {
        ...process.env,
        FIREBASE_CONFIG: JSON.stringify({
          projectId: 'groundwork-8ac4f',
          storageBucket: 'groundwork-8ac4f.firebasestorage.app',
        }),
        GCLOUD_PROJECT: 'groundwork-8ac4f',
      },
    },
  )
    .toString()
    .trim();
  const count = Number(out);
  if (!count || count < 1) throw new Error('no functions exported');
  return `${count} functions`;
});

// 4. Rules must not carry a BOM — the emulator and deploy both reject it.
check('Rules files have no BOM', () => {
  for (const rel of ['firestore.rules', 'storage.rules']) {
    const buf = readFileSync(resolve(root, rel));
    if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
      throw new Error(`${rel} starts with a UTF-8 BOM`);
    }
  }
  return 'clean';
});

// 5. firebase.json must be valid and point at the right runtime.
check('firebase.json valid', () => {
  const cfg = readJson('firebase.json');
  const fn = Array.isArray(cfg.functions) ? cfg.functions[0] : cfg.functions;
  if (!fn?.source) throw new Error('functions.source missing');
  return `runtime=${fn.runtime ?? 'default'}`;
});

// 6. The web build must succeed.
check('Web app builds', () => {
  execSync('npm run build', { cwd: root, stdio: 'pipe' });
  return 'ok';
});

// 7. Report which optional secrets are configured.
check('Optional secrets', () => {
  const envPath = resolve(root, 'functions/.env');
  if (!existsSync(envPath)) return 'none set (features degrade gracefully)';
  const env = readFileSync(envPath, 'utf8');
  const keys = ['ANTHROPIC_API_KEY', 'OPENROUTER_API_KEY', 'STRIPE_SECRET_KEY', 'RESEND_API_KEY'];
  const set = keys.filter((k) => new RegExp(`^${k}=.+`, 'm').test(env));
  return set.length ? set.join(', ') : 'none set (features degrade gracefully)';
});

const pad = Math.max(...results.map((r) => r.name.length));
console.log('\nGROUNDWORK preflight\n');
for (const r of results) {
  console.log(`  ${r.ok ? 'PASS' : 'FAIL'}  ${r.name.padEnd(pad)}  ${r.detail}`);
}
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed\n`);
process.exit(failed.length ? 1 : 0);
