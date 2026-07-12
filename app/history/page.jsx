'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';
import Topbar from '@/components/Topbar';
import { isConfigured } from '@/lib/firebaseConfig';
import { getUserId, listHistory, removeHistory } from '@/lib/userData';

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

export default function HistoryPage() {
  const [uid, setUid] = useState('0');
  const [items, setItems] = useState([]);
  // loading | ready | error | unconfigured
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const u = getUserId();
    setUid(u);

    if (!isConfigured) {
      setStatus('unconfigured');
      return;
    }

    (async () => {
      try {
        const hist = await listHistory(u);
        setItems(hist);
        setStatus('ready');
      } catch (e) {
        console.error('Не удалось загрузить историю:', e);
        setStatus('error');
      }
    })();
  }, []);

  const userQuery = uid !== '0' ? `?user=${encodeURIComponent(uid)}` : '';

  const cardHref = (id) => {
    const params = new URLSearchParams();
    if (uid !== '0') params.set('user', uid);
    params.set('id', String(id));
    return `/?${params.toString()}`;
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить из истории?')) return;
    try {
      await removeHistory(uid, id);
      setItems((prev) => prev.filter((it) => String(it.id) !== String(id)));
    } catch (e) {
      console.error('Не удалось удалить:', e);
    }
  };

  return (
    <>
      <Topbar
        brand="Продолжить смотреть"
        link={{ href: `/${userQuery}`, label: '← Плеер' }}
        uid={uid}
      />
      <div className={styles.container}>
        <div className={styles.cards}>
          {items.map((item) => (
            <div className={styles.card} key={String(item.id)}>
              <a className={styles.cardMain} href={cardHref(item.id)}>
                <span>{item.serialName || `id ${item.id}`}</span>
                {item.season != null && item.episode != null ? (
                  <span className={styles.cardSub}>
                    {(item.isFeature ? '' : `Сезон ${item.season} · Серия ${item.episode} · `) +
                      (item.playBack ? `Время ${formatTime(item.playBack)}` : '')}
                  </span>
                ) : null}
              </a>
              <button
                type="button"
                className={styles.cardDel}
                aria-label="Удалить"
                onClick={() => handleDelete(item.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {status === 'ready' && items.length === 0 ? (
          <p className={styles.empty}>Пока ничего не смотрели.</p>
        ) : null}
        {status === 'error' ? (
          <p className={styles.empty}>Не удалось загрузить историю.</p>
        ) : null}
        {status === 'unconfigured' ? (
          <p className={styles.empty}>Firebase не настроен.</p>
        ) : null}
      </div>
    </>
  );
}
