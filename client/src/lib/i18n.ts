export type Language = 'tg' | 'ru';

export const translations = {
  tg: {
    // Login Pages
    login: 'Воридшавӣ',
    loginTitle: 'Воридшавӣ',
    departmentCode: 'Рамзро ворид кунед',
    enterCode: '',
    adminLogin: 'Воридшавии маъмур',
    departmentLogin: 'Воридшавии шуъба',
    username: 'Логин',
    password: 'Парол',
    enterUsername: 'Логинро ворид кунед',
    enterPassword: 'Паролро ворид кунед',
    submit: 'Ворид шудан',
    
    // Navigation
    mainScreen: 'Экрани асосӣ',
    inbox: 'Ҳуҷҷатҳои воридшуда',
    outbox: 'Ҳуҷҷатҳои ирсолшуда',
    newMessage: 'Ҳуҷҷати нав',
    logout: 'Баромад',
    menu: 'Меню',
    
    // Department Blocks
    upperBlock: 'Кумитаи ҳифзи муҳити зист',
    middleBlock: 'Раёсатҳо',
    lowerBlock: 'Муссисаҳои тиҷоратӣ, ғайритиҷоратӣ ва Марказҳо',
    districtBlock: 'Ноҳияҳои тобеи марказ',
    
    // Messages
    unreadMessages: 'ҳуҷҷатҳои хонданашуда',
    subject: 'Мавзӯъ',
    documentType: 'Навъи ҳуҷҷат',
    date: 'Сана',
    recipient: 'Ирсол намудан ба',
    sender: 'Фиристанда',
    content: 'Мундариҷа',
    executor: 'Аз номи',
    executorOptional: 'Аз номи',
    attachFile: 'Замима кардани файл',
    download: 'Боргирӣ кардан',
    reply: 'Ҷавоб додан',
    send: 'Фиристодан',
    cancel: 'Бекор кардан',
    selectRecipient: 'Интихоб кунед',
    enterSubject: 'Мавзӯъро ворид кунед',
    enterContent: 'Мундариҷаро ворид кунед',
    read: 'Хондашуда',
    delivered: 'Расонидашуда',
    deleteMessage: 'Бекор кардан',
    deleteConfirm: 'Шумо мутмаин ҳастед, ки мехоҳед ин ҳуҷҷатро бекор кунед?',
    
    // Admin Panel
    adminPanel: 'Панели маъмурӣ',
    departments: 'Шуъбаҳо',
    allMessages: 'Ҳамаи ҳуҷҷатҳо',
    statistics: 'Оморҳо',
    departmentName: 'Номи шуъба',
    block: 'Блок',
    accessCode: 'Рамзи дастрасӣ',
    actions: 'Амалҳо',
    addDepartment: 'Илова кардани шуъба',
    edit: 'Таҳрир',
    delete: 'Бекор кардан',
    generate: 'Эҷод кардан',
    totalMessages: 'Ҳамагӣ ҳуҷҷатҳо',
    
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
    departmentCode: 'Введите код',
    enterCode: '',
    adminLogin: 'Вход администратора',
    departmentLogin: 'Вход для отделов',
    username: 'Логин',
    password: 'Пароль',
    enterUsername: 'Введите логин',
    enterPassword: 'Введите пароль',
    submit: 'Войти',
    
    // Navigation
    mainScreen: 'Главный экран',
    inbox: 'Входящие документы',
    outbox: 'Исходящие документы',
    newMessage: 'Новый документ',
    logout: 'Выход',
    menu: 'Меню',
    
    // Department Blocks
    upperBlock: 'Комитет по охране окружающей среды',
    middleBlock: 'Управления',
    lowerBlock: 'Коммерческие, некоммерческие учреждения и Центры',
    districtBlock: 'Районы центрального подчинения',
    
    // Messages
    unreadMessages: 'непрочитанных документов',
    subject: 'Тема',
    documentType: 'Тип документа',
    date: 'Дата',
    recipient: 'Отправить в',
    sender: 'Отправитель',
    content: 'Содержание',
    executor: 'От имени',
    executorOptional: 'От имени',
    attachFile: 'Прикрепить файл',
    download: 'Скачать',
    reply: 'Ответить',
    send: 'Отправить',
    cancel: 'Удалить',
    selectRecipient: 'Выберите',
    enterSubject: 'Введите тему',
    enterContent: 'Введите содержание',
    read: 'Прочитано',
    delivered: 'Доставлено',
    deleteMessage: 'Удалить',
    deleteConfirm: 'Вы уверены, что хотите удалить этот документ?',
    
    // Admin Panel
    adminPanel: 'Панель администратора',
    departments: 'Отделы',
    allMessages: 'Все документы',
    statistics: 'Статистика',
    departmentName: 'Название отдела',
    block: 'Блок',
    accessCode: 'Код доступа',
    actions: 'Действия',
    addDepartment: 'Добавить отдел',
    edit: 'Редактировать',
    delete: 'Удалить',
    generate: 'Сгенерировать',
    totalMessages: 'Всего документов',
    
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
