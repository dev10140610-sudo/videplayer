'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './page.module.css';
import Topbar from '@/components/Topbar';
import { isConfigured } from '@/lib/firebaseConfig';
import {
  getUserId,
  recordHistory,
  saveProgress,
  loadProgress,
  getLastWatchedId,
  loadNote,
  saveNote,
} from '@/lib/userData';

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
// На сколько секунд отматываем назад время при сохранении заметки.
const NOTE_REWIND = 5;

export default function PlayerPage() {
  const iframeRef = useRef(null);
  const [inputValue, setInputValue] = useState('');
  const [title, setTitle] = useState('');
  const [uid, setUid] = useState('0');

  // Модалка заметки.
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);

  // Мутабельные значения, которые читает единственный message-listener.
  const uidRef = useRef('0');
  const currentSerialName = useRef('');
  const lastSaved = useRef(-SAVE_INTERVAL);
  // Последний прогресс от плеера (полный объект message) — для сохранения заметки.
  const lastProgress = useRef(null);
  // Resume: прогресс из Firebase + флаг готовности плеера. Плеер может прислать
  // «готов» и раньше, и позже загрузки прогресса — поэтому шлём, когда готовы оба.
  const pendingResume = useRef(null);
  const playerReady = useRef(false);
  const resumeSent = useRef(false);

  const sendResumeIfReady = () => {
    if (resumeSent.current || !playerReady.current) return;
    const p = pendingResume.current;
    if (p && typeof p.playBack === 'number') {
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'vp:resume', payload: p },
        PLAYER_ORIGIN,
      );
      resumeSent.current = true;
    }
  };

  // resumeOverride — если задан (запуск из заметки), используем его вместо loadProgress.
  const load = async (rawId, resumeOverride = null) => {
    const id = String(rawId ?? '').trim();
    if (!id) return;

    iframeRef.current.src = buildIframeUrl(id); // плеер polivai (шлёт прогресс наружу)
    setTitle('');
    currentSerialName.current = '';
    lastSaved.current = -SAVE_INTERVAL;
    lastProgress.current = null;
    pendingResume.current = null;
    playerReady.current = false;
    resumeSent.current = false;

    // Прогресс для resume: из заметки (override) либо сохранённый по id.
    if (resumeOverride) {
      pendingResume.current = resumeOverride;
      sendResumeIfReady();
    } else if (isConfigured) {
      try {
        pendingResume.current = await loadProgress(uidRef.current, id);
        sendResumeIfReady();
      } catch (e) {
        console.error('Не удалось прочитать прогресс:', e);
      }
    }

    // Название сериала — отдельно, не блокирует resume если baura недоступна.
    try {
      const playerData = await fetchPlayerData(id);
      const cur = playerData.playlist?.current;
      currentSerialName.current = cur?.serialName ?? '';
      setTitle(currentSerialName.current);

      if (isConfigured && cur?.id != null) {
        await recordHistory(uidRef.current, { id: cur.id, serialName: currentSerialName.current });
      }
    } catch (e) {
      console.error('Не удалось получить playerData:', e);
    }
  };

  useEffect(() => {
    const u = getUserId();
    uidRef.current = u;
    setUid(u);

    // Приём прогресса от плеера (postMessage) → запись минуты в Firebase.
    const onMessage = (event) => {
      if (event.origin !== PLAYER_ORIGIN) return;

      const d = event.data;
      if (!d) return;

      // Плеер сообщил, что готов → отдаём ему сохранённый прогресс (когда он загружен).
      if (d.type === 'vp:ready') {
        playerReady.current = true;
        sendResumeIfReady();
        return;
      }

      // Прогресс от плеера.
      if (d.id == null || typeof d.playBack !== 'number') return;

      // Всегда запоминаем последний прогресс (для заметок) — до троттлинга записи.
      lastProgress.current = d;

      if (!isConfigured) return;

      if (d.playBack - lastSaved.current < SAVE_INTERVAL && d.playBack >= lastSaved.current) return;
      lastSaved.current = d.playBack;

      // Лёгкая запись без trim — trim уже сделан в load() при открытии сериала.
      saveProgress(uidRef.current, {
        id: d.id,
        serialName: currentSerialName.current,
        season: d.season,
        episode: d.episode,
        voiceId: d.voiceId,
        voiceName: d.voiceName,
        spec_ep: d.spec_ep,
        playBack: d.playBack,
        savedAt: Date.now(),
      }).catch((e) => console.error('Не удалось записать прогресс:', e));
    };
    window.addEventListener('message', onMessage);

    // Стартовый id: ?id= из URL → последний просмотренный → пусто.
    // ?note= — запуск из заметки: её данные становятся payload для resume.
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const urlId = params.get('id');
      const noteId = params.get('note');

      let startId = '';
      if (urlId) {
        startId = urlId;
      } else if (isConfigured) {
        try {
          const last = await getLastWatchedId(u);
          if (last) startId = String(last);
        } catch (e) {
          console.error('Не удалось получить последний просмотр:', e);
        }
      }

      let initialResume = null;
      if (noteId && isConfigured) {
        try {
          initialResume = await loadNote(u, noteId);
          if (initialResume?.id != null) startId = String(initialResume.id);
        } catch (e) {
          console.error('Не удалось прочитать заметку:', e);
        }
      }

      setInputValue(startId);
      await load(startId, initialResume);
    })();

    return () => window.removeEventListener('message', onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openNote = () => {
    setNoteTitle('');
    setNoteOpen(true);
  };

  const submitNote = async () => {
    const p = lastProgress.current;
    if (!p) {
      window.alert('Сначала запустите просмотр — нужно время из плеера.');
      return;
    }
    if (!isConfigured) return;

    setNoteSaving(true);
    try {
      await saveNote(uidRef.current, {
        id: p.id,
        serialName: currentSerialName.current,
        season: p.season,
        episode: p.episode,
        voiceId: p.voiceId,
        voiceName: p.voiceName,
        spec_ep: p.spec_ep,
        // Время = последнее из плеера минус NOTE_REWIND секунд.
        playBack: Math.max(0, p.playBack - NOTE_REWIND),
        title: noteTitle.trim(),
        savedAt: Date.now(),
      });
      setNoteOpen(false);
    } catch (e) {
      console.error('Не удалось сохранить заметку:', e);
      window.alert('Не удалось сохранить заметку.');
    } finally {
      setNoteSaving(false);
    }
  };

  const userQuery = uid !== '0' ? `?user=${encodeURIComponent(uid)}` : '';

  return (
    <>
      <Topbar
        links={[
          { href: `/history${userQuery}`, label: 'Продолжить смотреть' },
          { href: `/notes${userQuery}`, label: 'Заметки' },
        ]}
        uid={uid}
      />
      <div className={styles.container}>
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.playerWrap}>
          <iframe
            ref={iframeRef}
            className={styles.player}
            src="about:blank"
            allowFullScreen
            allow="autoplay; fullscreen"
          />
        </div>
        <div className={styles.controls}>
          <input
            className={styles.input}
            type="text"
            inputMode="numeric"
            placeholder="Введите id"
            aria-label="id серии"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') load(inputValue); }}
          />
          <button
            className={styles.button}
            type="button"
            onClick={() => load(inputValue)}
          />
        </div>
        <button className={styles.noteBtn} type="button" onClick={openNote}>
          Заметка
        </button>
      </div>

      {noteOpen ? (
        <div className={styles.overlay} onClick={() => setNoteOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Новая заметка</h2>
            <input
              className={styles.input}
              type="text"
              placeholder="Название заметки"
              aria-label="Название заметки"
              value={noteTitle}
              autoFocus
              onChange={(e) => setNoteTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitNote(); }}
            />
            <div className={styles.modalActions}>
              <button
                className={styles.modalCancel}
                type="button"
                onClick={() => setNoteOpen(false)}
              >
                Отмена
              </button>
              <button
                className={styles.modalSave}
                type="button"
                onClick={submitNote}
                disabled={noteSaving}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
