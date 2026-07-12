'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';
import Topbar from '@/components/Topbar';
import { isConfigured } from '@/lib/firebaseConfig';
import { getUserId, listNotes, removeNote } from '@/lib/userData';

const formatTime = (totalSeconds) => {
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

  if (hours >= 1) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }

  return `${pad(minutes)}:${pad(seconds)}`;
};

export default function NotesPage() {
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
        const notes = await listNotes(u);
        setItems(notes);
        setStatus('ready');
      } catch (e) {
        console.error('Не удалось загрузить заметки:', e);
        setStatus('error');
      }
    })();
  }, []);

  const userQuery = uid !== '0' ? `?user=${encodeURIComponent(uid)}` : '';

  // Клик по заметке → плеер с её данными (resume уходит postMessage'ом в iframe).
  const noteHref = (item) => {
    const params = new URLSearchParams();
    if (uid !== '0') params.set('user', uid);
    params.set('id', String(item.id));
    params.set('note', String(item.noteId));
    return `/?${params.toString()}`;
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm('Удалить заметку?')) return;
    try {
      await removeNote(uid, noteId);
      setItems((prev) => prev.filter((it) => it.noteId !== noteId));
    } catch (e) {
      console.error('Не удалось удалить заметку:', e);
    }
  };

  return (
    <>
      <Topbar
        brand="Заметки"
        links={[
          { href: `/${userQuery}`, label: '← Плеер' },
          { href: `/history${userQuery}`, label: 'Продолжить смотреть' },
        ]}
        uid={uid}
      />
      <div className={styles.container}>
        <div className={styles.cards}>
          {items.map((item) => (
            <div className={styles.card} key={item.noteId}>
              <a className={styles.cardMain} href={noteHref(item)}>
                <span className={styles.noteName}>{item.title || 'Без названия'}</span>
                <span className={styles.cardSub}>
                  {item.serialName || `id ${item.id}`}
                </span>
                {item.season != null && item.episode != null ? (
                  <span className={styles.cardSub}>
                    {(item.isFeature ? '' : `Сезон ${item.season} · Серия ${item.episode} · `) +
                      (item.voiceName ? `${item.voiceName} · ` : '') +
                      (item.playBack ? `Время ${formatTime(item.playBack)}` : '')}
                  </span>
                ) : null}
              </a>
              <button
                type="button"
                className={styles.cardDel}
                aria-label="Удалить"
                onClick={() => handleDelete(item.noteId)}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {status === 'ready' && items.length === 0 ? (
          <p className={styles.empty}>Пока нет заметок.</p>
        ) : null}
        {status === 'error' ? (
          <p className={styles.empty}>Не удалось загрузить заметки.</p>
        ) : null}
        {status === 'unconfigured' ? (
          <p className={styles.empty}>Firebase не настроен.</p>
        ) : null}
      </div>
    </>
  );
}
