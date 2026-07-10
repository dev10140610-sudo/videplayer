import './styles.css';
import { isConfigured } from './firebase.config';
import { getUserId, listHistory } from './userData';

const formatTime = (totalSeconds, showHours, cutHours) => {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return '';
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const pad = (num) => {
    num = String(num);
    return num.length < 2 ? `0${num}` : num;
  };

  if (showHours || hours >= 1) {
    return `${cutHours ? hours : pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  return `${pad(minutes)}:${pad(seconds)}`;
};

const run = async () => {
  const userIdEl = document.getElementById('user-id');
  const listEl = document.getElementById('history-list');
  const emptyEl = document.getElementById('empty');
  const playerLink = document.getElementById('player-link');

  const uid = getUserId();
  userIdEl.textContent = uid;

  // Ссылка обратно на плеер с сохранением профиля.
  const userQuery = uid !== '0' ? `?user=${encodeURIComponent(uid)}` : '';
  playerLink.href = `index.html${userQuery}`;

  if (!isConfigured) {
    emptyEl.textContent = 'Firebase не настроен.';
    emptyEl.hidden = false;
    return;
  }

  let hist;
  try {
    hist = await listHistory(uid);
  } catch (e) {
    console.error('Не удалось загрузить историю:', e);
    emptyEl.textContent = 'Не удалось загрузить историю.';
    emptyEl.hidden = false;
    return;
  }

  if (!hist.length) {
    emptyEl.hidden = false;
    return;
  }

  hist.forEach((item) => {
    const card = document.createElement('a');
    card.className = 'card';

    const params = new URLSearchParams();
    if (uid !== '0') params.set('user', uid);
    params.set('id', String(item.id));
    card.href = `index.html?${params.toString()}`;

    const name = document.createElement('span');
    name.textContent = item.serialName || `id ${item.id}`;
    card.appendChild(name);

    if (item.season != null && item.episode != null) {
      const sub = document.createElement('span');
      sub.className = 'card-sub';
      sub.textContent = `Сезон ${item.season} · Серия ${item.episode}` + (item.playBack ? ` · Время ${formatTime(item.playBack)}` : '');
      card.appendChild(sub);
    }

    listEl.appendChild(card);
  });
};

window.addEventListener('load', () => {
  void run();
});
