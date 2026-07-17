'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';
import Topbar from '@/components/Topbar';
import { isConfigured } from '@/lib/firebaseConfig';
import { getUserId, listNotes, removeNote } from '@/lib/userData';
import { HistoryIcon, HomeIcon } from '@/components/icons';
import { readCacheRaw, writeCache } from '@/lib/cache';

const cacheKey = (uid, serialId) => `vp:notes:${uid}:${serialId}`;

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
  const [serialId, setSerialId] = useState('');
  const [items, setItems] = useState([]);
  // loading | ready | error | unconfigured | noserial
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const u = getUserId();
    setUid(u);

    if (!isConfigured) {
      setStatus('unconfigured');
      return;
    }

    // id сериала: из URL (?id=) либо последний, что стоял в iframe (localStorage).
    const params = new URLSearchParams(window.location.search);
    let sid = params.get('id');
    if (!sid) {
      try { sid = window.localStorage.getItem('vp:lastId') || ''; } catch { sid = ''; }
    }
    sid = (sid || '').trim();
    setSerialId(sid);

    if (!sid) {
      setStatus('noserial');
      return;
    }

    // Мгновенно из кэша, затем сверка с бэком.
    const key = cacheKey(u, sid);
    const cachedRaw = readCacheRaw(key);
    if (cachedRaw) {
      try {
        setItems(JSON.parse(cachedRaw));
        setStatus('ready');
      } catch { /* битый кэш — игнорируем */ }
    }

    (async () => {
      try {
        const notes = await listNotes(u, sid);
        if (JSON.stringify(notes) !== cachedRaw) {
          setItems(notes);
          writeCache(key, notes);
        }
        setStatus('ready');
      } catch (e) {
        console.error('Не удалось загрузить заметки:', e);
        if (!cachedRaw) setStatus('error');
      }
    })();
  }, []);

  const userQuery = uid !== '0' ? `?user=${encodeURIComponent(uid)}` : '';

  // Клик по заметке → плеер с её данными (resume уходит postMessage'ом в iframe).
  const noteHref = (item) => {
    const params = new URLSearchParams();
    if (uid !== '0') params.set('user', uid);
    params.set('id', String(serialId));
    params.set('note', String(item.noteId));
    return `/?${params.toString()}`;
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm('Удалить заметку?')) return;
    try {
      await removeNote(uid, serialId, noteId);
      setItems((prev) => {
        const next = prev.filter((it) => it.noteId !== noteId);
        writeCache(cacheKey(uid, serialId), next);
        return next;
      });
    } catch (e) {
      console.error('Не удалось удалить заметку:', e);
    }
  };

  const serialLabel = items[0]?.serialName || (serialId ? `id ${serialId}` : '');

  return (
    <>
      <Topbar
        brand="Заметки"
        links={[
          { href: `/${userQuery}`, label: 'Плеер', icon: <HomeIcon /> },
          { href: `/history${userQuery}`, label: 'История', icon: <HistoryIcon /> },
        ]}
        uid={uid}
      />
      <div className={styles.container}>
        {serialLabel ? <div className={styles.serial}>{serialLabel}</div> : null}

        <div className={styles.cards}>
          {items.map((item) => (
            <div className={styles.card} key={item.noteId}>
              <a className={styles.cardMain} href={noteHref(item)}>
                <span className={styles.noteName}>{item.title || 'Без названия'}</span>
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
          <p className={styles.empty}>У этого сериала пока нет заметок.</p>
        ) : null}
        {status === 'noserial' ? (
          <p className={styles.empty}>Сначала откройте сериал в плеере.</p>
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
