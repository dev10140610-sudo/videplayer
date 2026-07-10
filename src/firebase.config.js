// Значения из консоли Firebase → Project settings → General → Your apps → SDK setup and configuration.
// Эти ключи НЕ секретны — они и так уходят в браузер. Доступ ограничивается правилами Firestore.
export const firebaseConfig = {
  apiKey: "AIzaSyAruTDKLtyJ8-Fnp7gfhVvXiddI2GaUxbg",
  authDomain: "videoplayer-be189.firebaseapp.com",
  projectId: "videoplayer-be189",
  storageBucket: "videoplayer-be189.firebasestorage.app",
  messagingSenderId: "420727971714",
  appId: "1:420727971714:web:361e516ff45ab3a7e0399b",
  measurementId: "G-56FGNHZXHT"
};

export const isConfigured = !Object.values(firebaseConfig).some((v) => v === 'ВСТАВЬ_СЮДА');
