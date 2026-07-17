// Инлайн-SVG иконки (stroke = currentColor, наследуют цвет текста/кнопки).
// Размер по умолчанию 16; переопределяется через props (width/height).

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

// Блокнот — для «Заметок».
export function NoteIcon(props) {
  return (
    <svg width="28" height="28" {...base} {...props}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  );
}

// Часы со стрелкой назад — стандартная «История».
export function HistoryIcon(props) {
  return (
    <svg width="28" height="28" {...base} {...props}>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}

// Круговая стрелка — для кнопки загрузки сериала по id.
export function ReloadIcon(props) {
  return (
    <svg width="16" height="16" {...base} {...props}>
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}

// Домик — для кнопки возврата на плеер (главная).
export function HomeIcon(props) {
  return (
    <svg width="28" height="28" {...base} {...props}>
      <path d="M3 10.75 12 3l9 7.75" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  );
}
