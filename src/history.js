import './styles.css';
import { isConfigured } from './firebase.config';
import { getUserId, listHistory, removeHistory } from './userData';

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
    const card = document.createElement('div');
    card.className = 'card';

    const link = document.createElement('a');
    link.className = 'card-main';

    const params = new URLSearchParams();
    if (uid !== '0') params.set('user', uid);
    params.set('id', String(item.id));
    link.href = `index.html?${params.toString()}`;

    const name = document.createElement('span');
    name.textContent = item.serialName || `id ${item.id}`;
    link.appendChild(name);

    if (item.season != null && item.episode != null) {
      const sub = document.createElement('span');
      sub.className = 'card-sub';

      const episodeText = item.isFeature ? '' : `Сезон ${item.season} · Серия ${item.episode} · `;
      sub.textContent = episodeText + (item.playBack ? `Время ${formatTime(item.playBack)}` : '');
      link.appendChild(sub);
    }

    card.appendChild(link);

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'card-del';
    del.setAttribute('aria-label', 'Удалить');
    del.textContent = '×';
    del.addEventListener('click', async () => {
      if (!window.confirm('Удалить из истории?')) return;
      del.disabled = true;
      try {
        await removeHistory(uid, item.id);
        card.remove();
        if (!listEl.children.length) emptyEl.hidden = false;
      } catch (e) {
        console.error('Не удалось удалить:', e);
        del.disabled = false;
      }
    });
    card.appendChild(del);

    listEl.appendChild(card);
  });
};

window.addEventListener('load', () => {
  void run();
});
