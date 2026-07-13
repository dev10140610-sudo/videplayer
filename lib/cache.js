// Простой localStorage-кэш для stale-while-revalidate: рендерим из кэша сразу,
// затем сверяем с бэком и обновляем кэш только если данные изменились.

export const readCacheRaw = (key) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null; // приватный режим / нет доступа
  }
};

export const readCache = (key) => {
  const raw = readCacheRaw(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const writeCache = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* приватный режим / переполнение — не критично */
  }
};
