export type Language = 'tg' | 'ru';

export const translations = {
  tg: {
    // Login Pages
    login: 'Воридшавӣ',
    loginTitle: 'Воридшавӣ',
    departmentCode: 'Рамзи шуъба',
    enterCode: 'Рамзи дастрасиро ворид кунед',
    adminLogin: 'Воридшавии маъмур',
    username: 'Логин',
    password: 'Парол',
    enterUsername: 'Логинро ворид кунед',
    enterPassword: 'Паролро ворид кунед',
    submit: 'Ворид шудан',
    
    // Navigation
    mainScreen: 'Экрани асосӣ',
    inbox: 'Хатҳои воридшуда',
    outbox: 'Хатҳои равоншуда',
    newMessage: 'Навиштани хат',
    logout: 'Баромад',
    
    // Department Blocks
    upperBlock: 'Блоки боло',
    middleBlock: 'Блоки миёна',
    lowerBlock: 'Блоки поён',
    
    // Messages
    unreadMessages: 'хатҳои хонданашуда',
    subject: 'Мавзӯъ',
    documentType: 'Навъи ҳуҷҷат',
    date: 'Сана',
    recipient: 'Гиранда',
    sender: 'Фиристанда',
    content: 'Мундариҷа',
    executor: 'Иҷрокунанда (НИШ)',
    executorOptional: 'Иҷрокунанда (ихтиёрӣ)',
    attachFile: 'Замима кардани файл',
    download: 'Боргирӣ кардан',
    reply: 'Ҷавоб додан',
    send: 'Фиристодан',
    cancel: 'Бекор кардан',
    selectRecipient: 'Гирандаро интихоб кунед',
    enterSubject: 'Мавзӯъро ворид кунед',
    enterContent: 'Мундариҷаро ворид кунед',
    read: 'Хондашуда',
    delivered: 'Расонидашуда',
    
    // Admin Panel
    adminPanel: 'Панели маъмурӣ',
    departments: 'Шуъбаҳо',
    allMessages: 'Ҳамаи хатҳо',
    statistics: 'Оморҳо',
    departmentName: 'Номи шуъба',
    block: 'Блок',
    accessCode: 'Рамзи дастрасӣ',
    actions: 'Амалҳо',
    addDepartment: 'Илова кардани шуъба',
    edit: 'Таҳрир',
    delete: 'Нест кардан',
    generate: 'Эҷод кардан',
    totalMessages: 'Ҳамагӣ хатҳо',
    
    // Status
    status: 'Вазъият',
    active: 'Фаъол',
    
    // Validation
    required: 'Ҳатмӣ',
    
    // File Upload
    dragDropFile: 'Файлро кашед ва партоед, ё клик кунед',
    fileAttached: 'Файл замима карда шуд',
  },
  ru: {
    // Login Pages
    login: 'Вход',
    loginTitle: 'Авторизация',
    departmentCode: 'Код отдела',
    enterCode: 'Введите код доступа',
    adminLogin: 'Вход администратора',
    username: 'Логин',
    password: 'Пароль',
    enterUsername: 'Введите логин',
    enterPassword: 'Введите пароль',
    submit: 'Войти',
    
    // Navigation
    mainScreen: 'Главный экран',
    inbox: 'Входящие',
    outbox: 'Исходящие',
    newMessage: 'Новое сообщение',
    logout: 'Выход',
    
    // Department Blocks
    upperBlock: 'Верхний блок',
    middleBlock: 'Средний блок',
    lowerBlock: 'Нижний блок',
    
    // Messages
    unreadMessages: 'непрочитанных',
    subject: 'Тема',
    documentType: 'Тип документа',
    date: 'Дата',
    recipient: 'Получатель',
    sender: 'Отправитель',
    content: 'Содержание',
    executor: 'Исполнитель (ФИО)',
    executorOptional: 'Исполнитель (необязательно)',
    attachFile: 'Прикрепить файл',
    download: 'Скачать',
    reply: 'Ответить',
    send: 'Отправить',
    cancel: 'Отмена',
    selectRecipient: 'Выберите получателя',
    enterSubject: 'Введите тему',
    enterContent: 'Введите содержание',
    read: 'Прочитано',
    delivered: 'Доставлено',
    
    // Admin Panel
    adminPanel: 'Панель администратора',
    departments: 'Отделы',
    allMessages: 'Все сообщения',
    statistics: 'Статистика',
    departmentName: 'Название отдела',
    block: 'Блок',
    accessCode: 'Код доступа',
    actions: 'Действия',
    addDepartment: 'Добавить отдел',
    edit: 'Редактировать',
    delete: 'Удалить',
    generate: 'Сгенерировать',
    totalMessages: 'Всего сообщений',
    
    // Status
    status: 'Статус',
    active: 'Активен',
    
    // Validation
    required: 'Обязательно',
    
    // File Upload
    dragDropFile: 'Перетащите файл сюда или нажмите',
    fileAttached: 'Файл прикреплен',
  },
};

export function useTranslation(lang: Language) {
  return translations[lang];
}
