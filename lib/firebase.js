import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { firebaseConfig, isConfigured } from './firebaseConfig';

// Инициализируем только если конфиг заполнен — иначе плеер работает без бэка.
const app = isConfigured ? initializeApp(firebaseConfig) : null;

// ignoreUndefinedProperties — чтобы undefined-поля (напр. spec_ep у не-спецвыпусков)
// не роняли запись в Firestore.
export const db = app
  ? initializeFirestore(app, { ignoreUndefinedProperties: true })
  : null;
