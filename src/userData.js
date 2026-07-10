import {
  collection, doc, setDoc, deleteDoc, getDoc, getDocs,
  query, orderBy, limit, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// Личность = значение ?user= из URL страницы. Нет параметра → профиль '0'.
export const getUserId = () => {
  const u = new URLSearchParams(window.location.search).get('user');
  return (u && u.trim()) || '0';
};

const histCol = (uid) => collection(db, 'users', uid, 'history');

const HISTORY_LIMIT = 10;

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
