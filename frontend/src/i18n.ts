const messages = {
  en: {
    "sidebar.library": "Library",
    "sidebar.allDrawings": "All Drawings",
    "sidebar.sharedWithMe": "Shared with me",
    "sidebar.unorganized": "Unorganized",
    "sidebar.collections": "Collections",
    "sidebar.newCollection": "New Collection",
    "sidebar.newCollectionPlaceholder": "New Collection...",
    "sidebar.shared": "Shared",
    "sidebar.editor": "Editor",
    "sidebar.viewer": "Viewer",
    "sidebar.owner": "Owner",
    "sidebar.deleteCollection": "Delete Collection",
    "sidebar.deleteCollectionMessage":
      "Are you sure you want to delete this collection? All drawings inside will be moved to Unorganized.",
    "sidebar.trash": "Trash",
    "sidebar.profile": "Profile",
    "sidebar.admin": "Admin",
    "sidebar.settings": "Settings",
    "sidebar.logout": "Logout",
    "settings.language": "Language",
  },
  ru: {
    "sidebar.library": "Библиотека",
    "sidebar.allDrawings": "Все доски",
    "sidebar.sharedWithMe": "Доступные мне",
    "sidebar.unorganized": "Без коллекции",
    "sidebar.collections": "Коллекции",
    "sidebar.newCollection": "Новая коллекция",
    "sidebar.newCollectionPlaceholder": "Новая коллекция…",
    "sidebar.shared": "Общий доступ",
    "sidebar.editor": "Редактор",
    "sidebar.viewer": "Читатель",
    "sidebar.owner": "Владелец",
    "sidebar.deleteCollection": "Удалить коллекцию",
    "sidebar.deleteCollectionMessage":
      "Удалить эту коллекцию? Все доски из неё будут перемещены в раздел «Без коллекции».",
    "sidebar.trash": "Корзина",
    "sidebar.profile": "Профиль",
    "sidebar.admin": "Администрирование",
    "sidebar.settings": "Настройки",
    "sidebar.logout": "Выйти",
    "settings.language": "Язык",
  },
  "zh-CN": {
    "sidebar.library": "资料库",
    "sidebar.allDrawings": "全部绘图",
    "sidebar.sharedWithMe": "与我共享",
    "sidebar.unorganized": "未整理",
    "sidebar.collections": "集合",
    "sidebar.newCollection": "新建集合",
    "sidebar.newCollectionPlaceholder": "新建集合…",
    "sidebar.shared": "已共享",
    "sidebar.editor": "可编辑",
    "sidebar.viewer": "仅查看",
    "sidebar.owner": "所有者",
    "sidebar.deleteCollection": "删除集合",
    "sidebar.deleteCollectionMessage":
      "确定要删除此集合吗？其中的所有绘图都将移至未整理。",
    "sidebar.trash": "回收站",
    "sidebar.profile": "个人资料",
    "sidebar.admin": "管理",
    "sidebar.settings": "设置",
    "sidebar.logout": "退出登录",
    "settings.language": "语言",
  },
} as const;

export type Locale = keyof typeof messages;
export type TranslationKey = keyof (typeof messages)["en"];

export const resolveLocale = (value: string | null | undefined): Locale => {
  const language = value?.trim().toLowerCase().split(/[-_]/)[0];
  if (language === "ru") return "ru";
  if (language === "zh") return "zh-CN";
  return "en";
};

export const translate = (locale: Locale, key: TranslationKey): string =>
  messages[locale][key] ?? messages.en[key];
