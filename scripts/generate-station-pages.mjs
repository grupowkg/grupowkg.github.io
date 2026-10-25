#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = resolve(projectRoot, 'stations.json');
const stations = JSON.parse(await readFile(manifestPath, 'utf8'));

const escapeHtml = value => String(value)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

const page = ({ name, route, stationSlug }) => `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Rádio ${escapeHtml(name)} | WKG Play</title>
  </head>
  <body>
    <script>
      window.__WKG_PLAYER_CONFIG = {
        clientKey: ${JSON.stringify(route)},
        stationSlug: ${JSON.stringify(stationSlug)},
        origin: 'https://radios.wkgplay.com.br'
      };
      fetch('../', { cache: 'no-store' }).then(response => {
        if (!response.ok) throw new Error('player-base');
        return response.text();
      }).then(page => {
        document.open();
        document.write(page.replace('<head>', '<head><base href="/">'));
        document.close();
      }).catch(() => {
        document.body.textContent = 'Player indisponível. Tente novamente mais tarde.';
      });
    </script>
  </body>
</html>
`;

for (const station of stations) {
  const { route, stationSlug, name } = station;
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(route) || !stationSlug || !name) {
    throw new Error(`Invalid station mapping: ${JSON.stringify(station)}`);
  }
  const output = resolve(projectRoot, route, 'index.html');
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, page(station));
}

console.log(`Generated ${stations.length} mapped Verone player pages.`);
