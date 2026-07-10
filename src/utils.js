const subtitleLabels = {
  dis: 'Отключены',
  ru: 'Русский',
  eng: 'Английский',
  ua: 'Украинский',
  kor: 'Корейский',
};

export const getSubtitlesArray = (subsObject) =>
  Object.entries(subsObject)
    .filter(([, value]) => !!value)
    .map(([key, value]) => ({
      kind: 'captions',
      src: value,
      srclang: key,
      label: subtitleLabels[key],
    }));

export const makeFlatObject = (obj, prefix = '') =>
  Object.entries(obj).reduce((memo, [key, value]) => {
    if (typeof value !== 'string') {
      return { ...memo, ...makeFlatObject(value, `${prefix}${key}.`) };
    }
    return { ...memo, [`${prefix}${key}`]: value };
  }, {});

export const localizationData = {
  "skip": {
    "seconds_short": "сек",
    "pass": "Пропустить",
    "intro": "Пропустить заставку",
    "replay": "Пропустить повтор",
    "end": "Пропустить концовку",
    "watch_intro": "Смотреть заставку",
    "watch_replay": "Смотреть повтор",
    "watch_end": "Смотреть концовку",
    "finish": {
      "switch_to": "Переход на",
      "episode": "серию",
      "after: time={1}": "через {1} сек",
      "after: time.seconds={1}": "через {1} секунд"
    },
  },
  "nav": {
    "season": "cезон",
    "episode": "cерия",
    "excerpt": "отрывок",
    "quantity": "эп",
    "spec1": "Спецэпизод",
    "spec2": "Трейлер",
    "spec3": "Тизер",
    "search": {
      "placeholder": "Поиск",
      "not_found": "Не найдено"
    },
  },
  "continue": "Продолжить просмотр",
  "voiceAmount={1} ep": "(1-{1} сер.)",
  "trailers": {
    "button": {
      "trailer": "Трейлер",
      "serial": "Сериал",
      "serialLight": "К сериалу"
    }
  },
  "pip": {
    "text": 'Видео проигрывается в отдельном окне'
  },
  "config": {
    "subtitles": {
      "label": "Субтитры",
      "settings": {
        "title": "Настройки субтитров",
        "label": "Настройки",
        "text": {
          "size": "Размер текста",
          "color": "Цвет текста",
        },
        "background": {
          "color": "Цвет фона",
          "opacity": "Прозрачность фона"
        },
        "colors": {
          "black": "Чёрный",
          "white": "Белый",
          "red": "Красный",
          "yellow": "Жёлтый",
          "green": "Зелёный",
          "blue": "Синий"
        },
        "reset": "Сбросить",
        "resetLight": "Сбросить настройки",
      },
      "disable": "Отключены",
      "lang": {
        "ru": "Русский",
        "en": "Английский",
        "ko": "Корейский"
      },
    },
    "quality": {
      "label":  "Качество",
      "default": "Авто",
    },
    "speed": {
      "label": "Скорость",
      "default": "Обычная",
      "lightDefault": "Обычная (1x)",
    },
    "scale": {
      "label": "Масштаб",
      "reset_to": "Сбросить до",
    },
    "skip": {
      "label": "Пропуск фрагментов",
      "intro": "Заставка",
      "end": "Концовка",
      "replay": "Повтор",
      "lightReplay": "Повторы",
      "flash_mode": {
        "label": "Режим марафона",
        "enabled": "Включено",
        "disabled": "Выключено",
      }
    },
    "backward": 'Назад',
    "title": 'Настройки',
  },
  "adult": {
    "title": "Вам уже есть  18 лет?",
    "text": "Доступ к этому видео разрешен только совершеннолетним пользователям",
    "agree": "Да",
    "cancel": "Нет",
    "title_abandoned": "Доступ запрещен"
  },
  "screen_lock": {
    "lock": {
      "button": "Заблокировать экран",
      "notification": "Экран заблокирован",
    },
    "unlock": {
      "button": "Разблокировать",
      "notification": "Разблокировано"
    }
  },
  "help": {
    "label": {
      "description": "Опишите вашу проблему",
      "contact": "Оставьте ваши контакты (e-mail)",
      "lightContact": "Контакт (email, telegram, телефон)",
      "lightMobileContact": "Ваш email",
    },
    "button": "Сообщить о проблеме",
    "send": "Отправить",
    "light": {
      "mobile_contact": "Ваш email",
      "contact": "Контакт (email, telegram, телефон)",
      "description": "Описание проблемы",
      "options": {
        "video": {
          "label": "Видео",
          "quality": "Качество видео не соответсвует настройкам",
          "long_response": "Долгая загрузка видео",
          "freeze": "Видео застывает",
        },
        "sound": {
          "label": "Звук",
          "quality": "Плохое качество звука",
          "wrong_sound": "Звук не соответствует видео",
          "wrong_volume": "Уровень звука не соответствует настройкам",
        },
        "subtitle": {
          "label": "Субтитры",
          "wrong_subs": "Субтитры не подходят под видео",
          "subs_position": "Субтитры отстают или опережают"
        },
        "frameRecognition": {
          "label": "Распознавание в кадре",
          "wrong_recognition": "Неверное распознавание"
        },
        "advertising": {
          "label": "Реклама",
          "count": "Слишком много рекламы",
          "adult": "Контент для взрослых в рекламе"
        },
        "other": {
          "label": "Другое",
          "ui": "Элементы плеера мешают просмотру",
        },
      },
      "title": "С какой проблемой вы столкнулись",
      "mobile_title": "Возникли проблемы с воспроизведением? Опишите проблему, мы постараемся её исправить",
      "notification": {
        "text1": "Спасибо за обращение!",
        "text2": "Мы постараемся всё исправить"
      },
      "send": "Отправить жалобу",
      "button": "Опишите свою проблему"
    },
  },
  "descriptions": {
    "touchhold": "Чтобы перемотать видео вперед, проведите по экрану вправо, а чтобы перемотать назад — влево",
    "lightTouchhold": `Для промотки видео вперед или назад
                     проведите по экрану вправо или влево`,
    "zoom": "Для изменения масштаба картинки, сделайте щипок двумя пальцами",
    "zoomBlue": "Для изменения масштаба сделайте щипок 2 пальцами"
  },
  "tooltips": {
    "player_title": "Основной плеер",
    "arrow to episode={1}": "Перейти к {1} серии",
    "season_select": "Выбрать сезон",
    "episode_select": "Выбрать серию",
    "voice_select": "Выбрать озвучку",
    "skip_close": "Выключить автопропуск",
    "control_bar": {
      "fullscreen": "Полноэкранный режим",
      "exit_fullscreen": "Выйти из полноэкранного режима",
      "picture_in_picture": "Окно в окне",
      "exit_picture_in_picture": "Выйти из окно в окне",
      "config": "Настройки",
      "mute": "Выключить звук",
      "unmute": "Включить звук",
      "play": "Воспроизвести",
      "pause": "Пауза",
    },
    "config": {
      "subtitle_select": "Выбор субтитров",
      "quality_select": "Выбор качества",
      "video_speed": "Скорость воспроизведения",
      "scale_adjust": "Регулировка масштаба",
      "textSize_select": "Выбрать размер текста",
      "textColor_select": "Выбрать цвет текста",
      "bgColor_select": "Выбрать цвет фона",
      "bgOpacity_select": "Выбрать прозрачность фона",
    }
  },
};