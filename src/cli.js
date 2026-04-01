#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('node:fs');
const path = require('node:path');

const { crawlFundraisingsNow, toMarkdown, toCsv } = require('./kakaoTogether');

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) {
      args._.push(a);
      continue;
    }
    const [k, v] = a.split('=', 2);
    const key = k.slice(2);
    if (v !== undefined) args[key] = v;
    else {
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) args[key] = true;
      else {
        args[key] = next;
        i++;
      }
    }
  }
  return args;
}

function usage() {
  return [
    'Usage:',
    '  node src/cli.js now --out out.md --format md',
    '',
    'Options:',
    '  --format md|json|csv    Output format (default: md)',
    '  --out <file>            Output file path (default: stdout)',
    '  --seed <n>              Seed used by backend random ordering (default: random)',
    '  --size <n>              Page size (default: 50)',
    '  --delayMs <n>           Delay between page fetches (default: 150)',
    '  --maxPages <n>          Safety cap (default: 500)',
    '  --verbose               Print progress to stderr',
  ].join('\n');
}

async function main() {
  const args = parseArgs(process.argv);
  const cmd = args._[0];
  if (!cmd || cmd === 'help' || cmd === '--help' || args.help) {
    console.log(usage());
    process.exit(0);
  }
  if (cmd !== 'now') {
    console.error(`Unknown command: ${cmd}`);
    console.error(usage());
    process.exit(2);
  }

  const format = (args.format || 'md').toLowerCase();
  const seed = args.seed !== undefined ? Number(args.seed) : undefined;
  const size = args.size !== undefined ? Number(args.size) : undefined;
  const delayMs = args.delayMs !== undefined ? Number(args.delayMs) : undefined;
  const maxPages = args.maxPages !== undefined ? Number(args.maxPages) : undefined;
  const verbose = Boolean(args.verbose);

  const result = await crawlFundraisingsNow({ seed, size, delayMs, maxPages, verbose });

  let output;
  if (format === 'json') output = JSON.stringify(result, null, 2) + '\n';
  else if (format === 'csv') output = toCsv(result.items);
  else if (format === 'md' || format === 'markdown') output = toMarkdown(result.items);
  else {
    console.error(`Unsupported format: ${format}`);
    process.exit(2);
  }

  if (result.truncated) {
    console.error(`WARNING: output is truncated (reached --maxPages=${maxPages ?? 500}). Increase --maxPages to fetch more.`);
  }

  if (args.out) {
    const outPath = path.resolve(process.cwd(), String(args.out));
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, output);
    console.error(`Wrote ${result.count} items to ${outPath}`);
  } else {
    process.stdout.write(output);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
