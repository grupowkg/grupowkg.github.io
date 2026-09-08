/*
 * URL examples after publication:
 * https://radio.wkgplay.com.br/bia-fit
 * https://radio.wkgplay.com.br/bio-festas
 *
 * Query-string access remains available for technical support:
 * https://radio.wkgplay.com.br/?station=bia_fit
 */
// The player can run on the AzuraCast domain or on GitHub Pages. In both
// cases, station metadata and audio must come from the HTTPS AzuraCast origin.
const apiBase = "https://radio.wkgplay.com.br";
const requestedStation = new URLSearchParams(location.search).get("station") || location.pathname.split("/").filter(Boolean).pop() || "wkg_play";
const stationSlug = requestedStation.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "wkg_play";
const audio = document.querySelector("#audio");
const button = document.querySelector("#play-button");
const icon = document.querySelector("#play-icon");
const name = document.querySelector("#station-name");
const track = document.querySelector("#track");
const cover = document.querySelector("#cover");
const status = document.querySelector("#status");

let station;

async function fetchNowPlaying(base) {
  const response = await fetch(`${base}/api/nowplaying/${encodeURIComponent(stationSlug)}`);
  if (!response.ok) throw new Error(`API respondeu ${response.status}`);
  return response.json();
}

async function loadStation() {
  station = await fetchNowPlaying(apiBase);
  const details = station.station || {};
  name.textContent = details.name || "Rádio WKG Play";
  track.textContent = station.now_playing?.song?.text || "Programação exclusiva da sua marca";
  if (details.logo_url) cover.style.backgroundImage = `url("${details.logo_url}")`;
  cover.style.backgroundSize = "cover";
  cover.textContent = "";
  // Keep media on the same HTTPS origin. AzuraCast can otherwise return its
  // internal HTTP/IP URL, which browsers block when this player is HTTPS.
  audio.src = `${apiBase}/listen/${encodeURIComponent(stationSlug)}/radio.mp3`;
  button.disabled = false;
  status.textContent = station.live?.is_live ? "Ao vivo agora" : "Rádio pronta para tocar";
}

button.addEventListener("click", async () => {
  try {
    if (audio.paused) { await audio.play(); icon.textContent = "❚❚"; button.setAttribute("aria-label", "Pausar rádio"); status.textContent = "Tocando agora"; }
    else { audio.pause(); }
  } catch (error) { status.textContent = "Não foi possível iniciar o áudio. Tente novamente."; }
});
audio.addEventListener("pause", () => { icon.textContent = "▶"; button.setAttribute("aria-label", "Tocar rádio"); });
audio.addEventListener("playing", () => { icon.textContent = "❚❚"; });
loadStation().catch(() => { name.textContent = "Rádio indisponível"; track.textContent = "Confira a configuração da URL e tente novamente."; status.textContent = "Não foi possível obter os dados da rádio."; });
