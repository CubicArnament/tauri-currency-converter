// src/types/global.d.ts
declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Window {
    // Добавляем сюда любые свойства window, которые используем
  }

  // Объявляем namespace NodeJS для таймеров
  namespace NodeJS {
    type Timeout = ReturnType<typeof setTimeout>;
    type Interval = ReturnType<typeof setInterval>;
  }

  var setInterval: typeof globalThis.setInterval;
}

// Обязательно нужно добавить пустой export, чтобы файл считался модулем
export {};
