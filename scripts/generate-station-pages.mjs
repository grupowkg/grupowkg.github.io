#!/usr/bin/env node

import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const stationsUrl = 'https://radio.wkgplay.com.br/api/stations';

const slugifyRoute = value => value
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const stationSlugFromListenUrl = value => {
  const match = String(value || '').match(/\/listen\/([^/]+)\/radio\.mp3/);
  return match?.[1] || '';
};

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
      fetch('../').then(response => response.text()).then(page => {
        const stationSlug = ${JSON.stringify(stationSlug)};
        const enhancements = \
          '<style>' +
            '.brand{width:168px;height:48px}.brand img{width:185px;left:-15px;top:-72px}.art{background-size:cover;background-position:center;position:relative}.art::after{content:"";position:absolute;inset:0;background:linear-gradient(135deg,rgba(8,8,11,.08),rgba(8,8,11,.42))}.art .cover-fallback{position:relative;z-index:1;font:800 2rem Syne;color:#fff;text-shadow:0 2px 14px #000}' +
          '</style><script>' +
            'const stationArt=document.querySelector(".art");stationArt.innerHTML="<span class=\\"cover-fallback\\">♫</span>";const stationStatus=document.querySelector("#status");const copyright="© "+new Date().getFullYear()+" Grupo WKG. Todos os direitos reservados.";const keepCopyright=()=>{if(stationStatus.textContent!==copyright)stationStatus.textContent=copyright};new MutationObserver(keepCopyright).observe(stationStatus,{childList:true,subtree:true,characterData:true});keepCopyright();fetch("https://radio.wkgplay.com.br/api/nowplaying/"+encodeURIComponent(stationSlug)).then(response=>response.json()).then(data=>{if(data.now_playing?.song?.art)stationArt.style.backgroundImage="url(\\""+data.now_playing.song.art+"\\")"}).catch(()=>{});' +
          '<\\/script>';
        document.open();
        document.write(page.replace('<head>', '<head><base href="/">').replace('</body>', enhancements + '</body>'));
        document.close();
      });
    </script>
  </body>
</html>
`;

const response = await fetch(stationsUrl);
if (!response.ok) throw new Error(`AzuraCast returned ${response.status}`);
const stations = await response.json();
const generated = [];

for (const station of stations) {
  const route = slugifyRoute(station.name);
  const stationSlug = stationSlugFromListenUrl(station.listen_url);
  if (!route || !stationSlug) throw new Error(`Invalid station data for ${station.name || 'unknown station'}`);
  const output = resolve(projectRoot, route, 'index.html');
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, page({ name: station.name, route, stationSlug }));
  generated.push({ route, stationSlug, name: station.name });
}

const manifestPath = resolve(projectRoot, 'stations.json');
const oldManifest = JSON.parse(await readFile(manifestPath, 'utf8').catch(() => '[]'));
for (const oldStation of oldManifest) {
  if (!generated.some(station => station.route === oldStation.route)) {
    await rm(resolve(projectRoot, oldStation.route), { recursive: true, force: true });
  }
}
await writeFile(manifestPath, `${JSON.stringify(generated, null, 2)}\n`);
console.log(`Generated ${generated.length} station pages.`);
