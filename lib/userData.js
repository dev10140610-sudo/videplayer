import {
  collection, doc, addDoc, setDoc, deleteDoc, getDoc, getDocs,
  query, orderBy, limit, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// Личность = значение ?user= из URL страницы. Нет параметра → профиль '0'.
export const getUserId = () => {
  const u = new URLSearchParams(window.location.search).get('user');
  return (u && u.trim()) || '0';
};

const histCol = (uid) => collection(db, 'users', uid, 'history');

const HISTORY_LIMIT = 20;

// Лёгкая запись прогресса — просто merge, без чтений. Вызывается часто (каждый тик).
export const saveProgress = async (uid, entry) => {
  await setDoc(
    doc(histCol(uid), String(entry.id)),
    { ...entry, updatedAt: serverTimestamp() },
    { merge: true },
  );
};

// Запись + подрезка истории до HISTORY_LIMIT (читает список). Вызывать редко —
// при открытии сериала, а не на каждый тик прогресса.
export const recordHistory = async (uid, entry) => {
  await saveProgress(uid, entry);

  const snap = await getDocs(query(histCol(uid), orderBy('updatedAt', 'desc')));
  const extra = snap.docs.slice(HISTORY_LIMIT).filter((d) => d.id !== String(entry.id));
  await Promise.all(extra.map((d) => deleteDoc(d.ref)));
};

// Удаление записи из истории по id.
export const removeHistory = async (uid, id) => {
  await deleteDoc(doc(histCol(uid), String(id)));
};

// Сохранённый прогресс по конкретному сериалу (или null) — для resume.
export const loadProgress = async (uid, id) => {
  const snap = await getDoc(doc(histCol(uid), String(id)));
  return snap.exists() ? snap.data() : null;
};

export const listHistory = async (uid, n = HISTORY_LIMIT) => {
  const snap = await getDocs(query(histCol(uid), orderBy('updatedAt', 'desc'), limit(n)));
  return snap.docs.map((d) => d.data());
};

// id последней просмотренной серии (или null, если истории нет).
export const getLastWatchedId = async (uid) => {
  const hist = await listHistory(uid, 1);
  return hist.length ? hist[0].id : null;
};

// --- Заметки (у каждого сериала свои) ---
// Путь: users/{uid}/notes/{serialId}/items/{noteId}. Каждая заметка = снимок как
// в истории (поле `id` = id сериала, чтобы payload resume совпадал с историей) +
// свой заголовок `title`. Несколько заметок на сериал.
const notesCol = (uid, serialId) =>
  collection(db, 'users', uid, 'notes', String(serialId), 'items');

const NOTES_LIMIT = 50;

// Создание заметки под конкретным сериалом (авто-id, историю не трогает).
export const saveNote = async (uid, serialId, note) => {
  await addDoc(notesCol(uid, serialId), { ...note, updatedAt: serverTimestamp() });
};

export const listNotes = async (uid, serialId, n = NOTES_LIMIT) => {
  const snap = await getDocs(
    query(notesCol(uid, serialId), orderBy('updatedAt', 'desc'), limit(n)),
  );
  return snap.docs.map((d) => ({ noteId: d.id, ...d.data() }));
};

// Данные заметки по serialId+noteId (или null) — используются как payload для resume.
export const loadNote = async (uid, serialId, noteId) => {
  const snap = await getDoc(doc(notesCol(uid, serialId), String(noteId)));
  return snap.exists() ? snap.data() : null;
};

export const removeNote = async (uid, serialId, noteId) => {
  await deleteDoc(doc(notesCol(uid, serialId), String(noteId)));
};
