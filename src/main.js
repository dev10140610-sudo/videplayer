import './styles.css';
import { isConfigured } from './firebase.config';
import {
  getUserId,
  recordHistory,
  saveProgress,
  loadProgress,
  getLastWatchedId,
} from './userData';

const BAURA_ORIGIN = 'https://baura.org';
// Плеер, который шлёт прогресс наружу через postMessage (?dev=2 включает отправку).
const PLAYER_ORIGIN = 'https://polivai.xyz';

// URL плеера для iframe.
const buildIframeUrl = (id) =>
  `${PLAYER_ORIGIN}/?dev=2&id=${encodeURIComponent(id)}`;

// URL страницы baura — только чтобы вытащить название сериала (playerData).
const buildPageUrl = (id, season = 1, episode = 1) =>
  `${BAURA_ORIGIN}/?season=${season}&episode=${episode}&id=${encodeURIComponent(id)}`;

const fetchPlayerData = async (id, season = 1, episode = 1) => {
  const res = await fetch(buildPageUrl(id, season, episode));
  if (!res.ok) {
    throw new Error(`baura.org ответил ${res.status}`);
  }

  const html = await res.text();
  const match = html.match(/window\.playerData\s*=\s*(\{[\s\S]*?});<\/script>/);
  if (!match) {
    throw new Error('window.playerData не найден на странице');
  }

  return JSON.parse(match[1]);
};

const SAVE_INTERVAL = 5;

const run = async () => {
  const iframe = document.getElementById('player');
  const input = document.getElementById('id-input');
  const button = document.getElementById('load-btn');
  const title = document.getElementById('title');
  const userIdEl = document.getElementById('user-id');
  const historyLink = document.getElementById('history-link');

  const uid = getUserId();
  userIdEl.textContent = uid;

  const userQuery = uid !== '0' ? `?user=${encodeURIComponent(uid)}` : '';
  historyLink.href = `history.html${userQuery}`;

  let currentSerialName = '';
  let lastSaved = -SAVE_INTERVAL;
  // Resume: прогресс из Firebase + флаг готовности плеера. Плеер может прислать
  // «готов» и раньше, и позже загрузки прогресса — поэтому шлём, когда готовы оба.
  let pendingResume = null;
  let playerReady = false;
  let resumeSent = false;

  const sendResumeIfReady = () => {
    if (resumeSent || !playerReady) return;
    if (pendingResume && typeof pendingResume.playBack === 'number') {
      iframe.contentWindow?.postMessage(
        { type: 'vp:resume', payload: pendingResume },
        PLAYER_ORIGIN,
      );
      resumeSent = true;
    }
  };

  const load = async () => {
    const id = input.value.trim();
    if (!id) return;

    iframe.src = buildIframeUrl(id); // плеер polivai (шлёт прогресс наружу)
    title.textContent = '';
    currentSerialName = '';
    lastSaved = -SAVE_INTERVAL;
    pendingResume = null;
    playerReady = false;
    resumeSent = false;

    // Прогресс для resume читаем сразу по id — не завися от baura-fetch (он может упасть).
    if (isConfigured) {
      try {
        pendingResume = await loadProgress(uid, id);
        sendResumeIfReady();
      } catch (e) {
        console.error('Не удалось прочитать прогресс:', e);
      }
    }

    // Название сериала — отдельно, не блокирует resume если baura недоступна.
    try {
      const playerData = await fetchPlayerData(id);
      window.playerData = playerData;
      const cur = playerData.playlist?.current;
      currentSerialName = cur?.serialName ?? '';
      title.textContent = currentSerialName;

      if (isConfigured && cur?.id != null) {
        await recordHistory(uid, { id: cur.id, serialName: currentSerialName });
      }
    } catch (e) {
      console.error('Не удалось получить playerData:', e);
    }
  };

  // Приём прогресса от плеера (postMessage) → запись минуты в Firebase.
  window.addEventListener('message', (event) => {
    if (event.origin !== PLAYER_ORIGIN) return;

    const d = event.data;
    if (!d) return;
    console.log('data', d)

    // Плеер сообщил, что готов → отдаём ему сохранённый прогресс (когда он загружен).
    if (d.type === 'vp:ready') {
      playerReady = true;
      sendResumeIfReady();
      return;
    }

    // Прогресс от плеера → запись минуты.
    if (d.id == null || typeof d.playBack !== 'number') return;
    if (!isConfigured) return;

    if (d.playBack - lastSaved < SAVE_INTERVAL && d.playBack >= lastSaved) return;
    lastSaved = d.playBack;

    // Лёгкая запись без trim — trim уже сделан в load() при открытии сериала.
    saveProgress(uid, {
      id: d.id,
      serialName: currentSerialName,
      season: d.season,
      episode: d.episode,
      voiceId: d.voiceId,
      voiceName: d.voiceName,
      spec_ep: d.spec_ep,
      playBack: d.playBack,
      savedAt: Date.now(),
    }).catch((e) => console.error('Не удалось записать прогресс:', e));
  });

  button.addEventListener('click', () => { void load(); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      void load();
    }
  });

  // Стартовый id: ?id= из URL → последний просмотренный → дефолт из инпута.
  const urlId = new URLSearchParams(window.location.search).get('id');
  if (urlId) {
    input.value = urlId;
  } else if (isConfigured) {
    try {
      const last = await getLastWatchedId(uid);
      if (last) {
        input.value = String(last);
      }
    } catch (e) {
      console.error('Не удалось получить последний просмотр:', e);
    }
  }

  void load();
};

window.addEventListener('load', () => {
  void run();
});
