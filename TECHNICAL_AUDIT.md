# 🔍 EcoDoc Platform - Technical Audit & Documentation

**Дата аудита:** 18 ноября 2025  
**Версия системы:** 1.0.0  
**Auditor:** AI Agent (Comprehensive System Analysis)

## 📋 Executive Summary

EcoDoc - это билингвальная (таджикский/русский) платформа для внутреннего обмена сообщениями и управления документами для правительственных департаментов Таджикистана. Система обслуживает 49 департаментов с безопасной коммуникацией, управлением заданиями, объявлениями и хранением файлов в базе данных PostgreSQL.

### Ключевые находки

✅ **Сильные стороны:**
- Надежная архитектура с разделением frontend/backend
- Type-safe database operations с Drizzle ORM
- Comprehensive permission system
- Mobile-ready через Capacitor 7.4.4
- Хорошая оптимизация производительности (gzip, WebP, code splitting)

⚠️ **Критические проблемы:**
1. Хардкодированный SESSION_SECRET (уязвимость безопасности)
2. Хранение файлов до 100MB в памяти
3. Отсутствие rate limiting
4. Недостаточная защита от Zip Slip attacks
5. Dual recipient fields (recipientId + recipientIds) создают технический долг

---

## 🏗️ Architecture Overview

### Technology Stack

**Frontend:**
- React 18.3.1 + TypeScript 5.6.3
- Vite 5.4.20 (build tool)
- Wouter 3.3.5 (routing)
- TanStack Query 5.60.5 (server state)
- Tailwind CSS 3.4.17 + shadcn/ui (UI components)
- Radix UI (accessible primitives)

**Backend:**
- Node.js + Express.js 4.21.2
- TypeScript 5.6.3
- Session-based authentication (express-session 1.18.1)
- Bcrypt 6.0.0 (password hashing)
- Multer 2.0.2 (file uploads)
- Compression 1.8.1 (gzip middleware)

**Database:**
- PostgreSQL 13+ (через pg 8.16.3)
- Drizzle ORM 0.39.1 (type-safe queries)
- connect-pg-simple 10.0.0 (session storage)
- Safe migrations через tsx

**Mobile:**
- Capacitor 7.4.4 (iOS & Android)
- Sharp 0.34.4 (image processing)
- WebView-based architecture

**Additional Libraries:**
- JSZip 3.10.1 (archive generation)
- docx 9.5.1 (Word documents)
- react-easy-crop 5.5.3 (image cropping)
- @dnd-kit (drag-and-drop)
- date-fns 3.6.0 (date utilities)
- Zod 3.24.2 (validation)

---

## 📊 Database Architecture

### Schema Overview (11 Tables)

#### 1. **departments** (Шуъбаҳо)
```sql
id: serial PRIMARY KEY
name: text NOT NULL
block: text NOT NULL  -- 'upper', 'middle', 'lower', 'district'
accessCode: text UNIQUE NOT NULL
sortOrder: integer DEFAULT 0
canMonitor: boolean DEFAULT false
canCreateAssignmentFromMessage: boolean DEFAULT false
canCreateAssignment: boolean DEFAULT false
canCreateAnnouncement: boolean DEFAULT false
icon: text DEFAULT 'building-2'
createdAt: timestamp DEFAULT NOW()
```
**Purpose:** Хранит 49 департаментов с иерархией (4 блока), кодами доступа и правами

#### 2. **department_icons**
```sql
id: serial PRIMARY KEY
departmentId: integer UNIQUE REFERENCES departments(id) ON DELETE CASCADE
fileName: text NOT NULL
fileData: bytea NOT NULL
fileSize: integer NOT NULL
mimeType: text NOT NULL
updatedAt: timestamp DEFAULT NOW()
INDEX: (departmentId)
```
**Purpose:** Custom иконки департаментов (до 10MB), хранятся в БД

#### 3. **admins**
```sql
id: serial PRIMARY KEY
username: text UNIQUE NOT NULL
password: text NOT NULL  -- bcrypt hashed
createdAt: timestamp DEFAULT NOW()
```
**Purpose:** Административные пользователи с полным доступом

#### 4. **sessions**
```sql
sid: text PRIMARY KEY
sess: text NOT NULL  -- JSON session data
expire: timestamp NOT NULL
```
**Purpose:** Управляется connect-pg-simple, хранит сессии пользователей (30 дней)

#### 5. **messages** (Паёмҳо)
```sql
id: serial PRIMARY KEY
subject: text NOT NULL
content: text NOT NULL
documentNumber: text
senderId: integer REFERENCES departments(id) ON DELETE CASCADE
recipientId: integer REFERENCES departments(id) ON DELETE CASCADE  -- LEGACY
recipientIds: integer[] DEFAULT '{}'  -- NEW: broadcast support
executor: text
documentDate: timestamp NOT NULL
replyToId: integer REFERENCES messages(id) ON DELETE CASCADE
originalSenderId: integer REFERENCES departments(id)  -- forwarding
forwardedById: integer REFERENCES departments(id)  -- forwarding
isRead: boolean DEFAULT false
isDeleted: boolean DEFAULT false
deletedAt: timestamp
createdAt: timestamp DEFAULT NOW()

INDEXES:
- messages_sender_id_idx (senderId)
- messages_recipient_id_idx (recipientId)
- messages_recipient_ids_idx USING GIN (recipientIds)  -- array queries
- messages_is_deleted_idx (isDeleted)
```
**Purpose:** Сообщения с поддержкой broadcast, forwarding, soft-delete

⚠️ **Technical Debt:** Dual recipient fields (recipientId + recipientIds) создают сложность

#### 6. **attachments** (Замимаҳо)
```sql
id: serial PRIMARY KEY
messageId: integer REFERENCES messages(id) ON DELETE CASCADE
file_name: text NOT NULL
fileData: bytea NOT NULL
fileSize: integer NOT NULL
mimeType: text NOT NULL
createdAt: timestamp DEFAULT NOW()
INDEX: (messageId)
```
**Purpose:** До 5 файлов на сообщение, до 100MB каждый, хранятся в БД

**Allowed MIME types:**
- Documents: PDF, Word, Excel, PowerPoint, RTF, TXT
- Images: JPEG, PNG, GIF, WebP, BMP, TIFF
- Archives: ZIP, RAR, 7Z, GZIP
- Other: JSON, CSV

#### 7. **assignments** (Супоришҳо)
```sql
id: serial PRIMARY KEY
senderId: integer REFERENCES departments(id)
topic: text NOT NULL
content: text
documentNumber: text
executors: text[]  -- Даъват (invited executors names)
executorIds: integer[]  -- Даъват (invited executor IDs)
allDepartmentExecutors: text[]  -- Иҷрокунандагон (all dept people names)
allDepartmentExecutorIds: integer[]  -- Иҷрокунандагон (all dept people IDs)
recipientIds: integer[] DEFAULT '{}'  -- target departments
deadline: timestamp NOT NULL
isCompleted: boolean DEFAULT false
completedAt: timestamp
isDeleted: boolean DEFAULT false
deletedAt: timestamp
createdAt: timestamp DEFAULT NOW()
INDEXES: (isDeleted), (senderId)
```
**Purpose:** Задания с исполнителями, дедлайнами, статусами

#### 8. **assignment_attachments**
```sql
id: serial PRIMARY KEY
assignmentId: integer REFERENCES assignments(id) ON DELETE CASCADE
file_name: text NOT NULL
fileData: bytea NOT NULL
fileSize: integer NOT NULL
mimeType: text NOT NULL
createdAt: timestamp DEFAULT NOW()
INDEX: (assignmentId)
```
**Purpose:** Файлы для заданий (до 5 файлов, до 100MB каждый)

#### 9. **announcements** (Эълонҳо)
```sql
id: serial PRIMARY KEY
title: text NOT NULL
content: text NOT NULL
recipientIds: integer[]  -- null/empty = broadcast to all
readBy: integer[] DEFAULT '{}'
isDeleted: boolean DEFAULT false
deletedAt: timestamp
createdAt: timestamp DEFAULT NOW()
```
**Purpose:** Объявления с таргетингом на департаменты, отслеживание прочтений

#### 10. **announcement_attachments**
```sql
id: serial PRIMARY KEY
announcementId: integer REFERENCES announcements(id) ON DELETE CASCADE
file_name: text NOT NULL
fileData: bytea NOT NULL
fileSize: integer NOT NULL
mimeType: text NOT NULL
createdAt: timestamp DEFAULT NOW()
INDEX: (announcementId)
```
**Purpose:** Файлы для объявлений

#### 11. **people** (Иҷрокунандагон)
```sql
id: serial PRIMARY KEY
name: text NOT NULL
departmentId: integer REFERENCES departments(id) ON DELETE CASCADE
createdAt: timestamp DEFAULT NOW()
INDEX: (departmentId)
```
**Purpose:** Исполнители с привязкой к департаментам

### Database Relationships

```
departments (49)
  ├─→ department_icons (1:1)
  ├─→ messages (1:N as sender)
  ├─→ messages (1:N as recipient via recipientIds array)
  ├─→ assignments (1:N as sender)
  ├─→ assignments (1:N as recipient via recipientIds array)
  ├─→ announcements (N:M via recipientIds array)
  └─→ people (1:N)

messages (N)
  ├─→ attachments (1:N, cascade delete)
  ├─→ messages (1:N as replies via replyToId)
  └─→ departments (forwarding: originalSenderId, forwardedById)

assignments (N)
  └─→ assignment_attachments (1:N, cascade delete)

announcements (N)
  └─→ announcement_attachments (1:N, cascade delete)
```

### Key Database Features

1. **GIN Indexes** for array searches:
   - `messages_recipient_ids_idx` - fast `WHERE x = ANY(recipient_ids)` queries
   
2. **Cascade Deletes:**
   - Удаление департамента → удаление иконки, сообщений, заданий, людей
   - Удаление сообщения → удаление всех attachments
   
3. **Soft Deletes:**
   - Messages: `isDeleted` + `deletedAt`
   - Assignments: `isDeleted` + `deletedAt`
   - Announcements: `isDeleted` + `deletedAt`
   
4. **Binary Data Storage:**
   - Все файлы хранятся как `bytea` в PostgreSQL
   - Преимущества: транзакционность, простой backup, автономность
   - Недостатки: размер БД, производительность при больших файлах

---

## 🔌 Backend API Architecture

### Authentication System

**Session-Based Authentication:**
```typescript
// express-session с PostgreSQL store
{
  store: PgSession(pool),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,  // should be true in production with HTTPS
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000  // 30 days
  }
}
```

**Два типа пользователей:**
1. **Department** - авторизация через `accessCode`
2. **Admin** - авторизация через `username` + `password` (bcrypt)

**Middleware:**
- `requireAuth` - проверяет наличие `departmentId` или `adminId` в сессии
- `requireAdmin` - проверяет наличие `adminId` в сессии

### API Endpoints (50+ routes)

#### Authentication (3 endpoints)
```
POST   /api/auth/department    - Department login via accessCode
POST   /api/auth/admin         - Admin login via username/password
POST   /api/auth/logout        - Logout (destroy session)
GET    /api/auth/me            - Get current user info
```

#### Departments (8 endpoints)
```
GET    /api/departments        - List all departments (admin)
GET    /api/departments/list   - List departments (dept + admin)
GET    /api/departments/:id    - Get department by ID
POST   /api/departments        - Create department (admin)
PATCH  /api/departments/:id    - Update department (admin)
DELETE /api/departments/:id    - Delete department (admin)
POST   /api/departments/reorder - Reorder departments (admin)
POST   /api/departments/:id/icon - Upload department icon (admin)
GET    /api/departments/:id/icon - Get department icon
```

#### Messages (15+ endpoints)
```
GET    /api/messages                      - Get all messages (admin)
GET    /api/messages/:id                  - Get message by ID
GET    /api/messages/department/:deptId   - Get dept inbox/outbox
POST   /api/messages                      - Send message
POST   /api/messages/broadcast            - Broadcast to multiple depts
POST   /api/messages/:id/forward          - Forward message (copies attachments)
PATCH  /api/messages/:id/read             - Mark as read
DELETE /api/messages/:id                  - Soft delete
GET    /api/messages/trash                - List deleted messages
POST   /api/messages/:id/restore          - Restore from trash
DELETE /api/messages/:id/permanent        - Permanent delete (admin)
GET    /api/messages/unread/:departmentId - Unread count
POST   /api/messages/:id/attachments      - Upload attachment
GET    /api/messages/:id/attachments      - List attachments
GET    /api/attachments/:id               - Download attachment
GET    /api/export-zip/:deptId/inbox      - Export ZIP archive (admin)
GET    /api/export-zip/:deptId/outbox     - Export ZIP archive (admin)
```

#### Assignments (10 endpoints)
```
GET    /api/assignments              - List assignments
GET    /api/assignments/:id          - Get assignment by ID
POST   /api/assignments              - Create assignment
PATCH  /api/assignments/:id          - Update assignment
DELETE /api/assignments/:id          - Soft delete
PATCH  /api/assignments/:id/complete - Mark as completed
GET    /api/assignments/trash        - List deleted
POST   /api/assignments/:id/restore  - Restore from trash
DELETE /api/assignments/:id/permanent - Permanent delete
POST   /api/assignments/:id/attachments - Upload attachment
GET    /api/assignments/:id/attachments - List attachments
GET    /api/assignment-attachments/:id  - Download attachment
```

#### Announcements (10 endpoints)
```
GET    /api/announcements              - List announcements
GET    /api/announcements/:id          - Get announcement by ID
POST   /api/announcements              - Create announcement
PATCH  /api/announcements/:id          - Update announcement
DELETE /api/announcements/:id          - Soft delete
PATCH  /api/announcements/:id/read     - Mark as read
GET    /api/announcements/trash        - List deleted
POST   /api/announcements/:id/restore  - Restore from trash
DELETE /api/announcements/:id/permanent - Permanent delete
POST   /api/announcements/:id/attachments - Upload attachment
GET    /api/announcements/:id/attachments - List attachments
GET    /api/announcement-attachments/:id  - Download attachment
```

#### People (5 endpoints)
```
GET    /api/people              - List all people
GET    /api/people/:id          - Get person by ID
POST   /api/people              - Create person (admin)
PATCH  /api/people/:id          - Update person (admin)
DELETE /api/people/:id          - Delete person (admin)
```

#### Monitoring (1 endpoint)
```
GET    /api/monitoring/unread-stats - Public access, unread counts for all depts
```

### File Upload Configuration

**Messages/Assignments/Announcements:**
```javascript
multer({
  storage: memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }  // 100MB
})
```

**Department Icons:**
```javascript
multer({
  storage: memoryStorage(),
  limits: { 
    fileSize: 10 * 1024 * 1024,  // 10MB
    files: 1 
  }
})
```

⚠️ **Performance Issue:** Файлы загружаются в память перед сохранением в БД

### Validation Layer

**Zod schemas используются для всех insertов:**
- `insertDepartmentSchema`
- `insertMessageSchema`
- `insertAssignmentSchema`
- `insertAnnouncementSchema`
- `insertPersonSchema`
- `insertAdminSchema`

**Example validation:**
```typescript
const data = insertMessageSchema.parse(req.body);
await storage.createMessage(data);
```

---

## 🎨 Frontend Architecture

### Routing System (Wouter 3.3.5)

**17+ Pages:**

**Public:**
- `/` - Department Login
- `/admin/login` - Admin Login

**Department Pages:**
- `/department/dashboard` - Главная страница департамента
- `/department/inbox` - Входящие
- `/department/messages/:deptId` - Переписка с департаментом
- `/department/message/:id` - Просмотр сообщения
- `/department/new-message` - Новое сообщение
- `/department/assignments` - Задания
- `/department/announcements` - Объявления
- `/department/monitoring` - Мониторинг (если canMonitor=true)

**Admin Pages:**
- `/admin/dashboard` - Управление департаментами
- `/admin/departments/:id/inbox` - Inbox департамента
- `/admin/departments/:id/outbox` - Outbox департамента
- `/admin/people` - Управление исполнителями
- `/admin/assignments` - Все задания
- `/admin/announcements` - Все объявления
- `/admin/trash` - Корзина
- `/admin/department-messages/:id` - Сообщения департамента

### State Management

**TanStack Query (React Query) patterns:**
```typescript
// Queries with typed responses
const { data: departments = [] } = useQuery<Department[]>({
  queryKey: ['/api/departments'],
});

// Hierarchical cache keys for invalidation
queryKey: ['/api/messages', deptId]

// Mutations with cache invalidation
const mutation = useMutation({
  mutationFn: (data) => apiRequest('POST', '/api/messages', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
  }
});
```

**Authentication Context:**
```typescript
// client/src/lib/auth.tsx
AuthProvider manages:
- department: Department | null
- admin: Admin | null
- isLoading: boolean
- checkAuth(), login(), logout()
```

### Component Architecture

**Reusable Components:**
- `DepartmentCard.tsx` - Card с drag-and-drop support
- `DepartmentIconUpload.tsx` - Icon upload с cropping
- `ImageCropDialog.tsx` - Image cropping modal
- `MessageListItem.tsx` - Message row в списках
- `Footer.tsx` - Footer с контактами
- `PageHeader.tsx` - Консистентные headers
- `MobileNav.tsx` - Mobile navigation

**UI Components (shadcn/ui):**
- 35+ компонентов из Radix UI
- Tailwind CSS для стилизации
- Dark mode не используется (light mode only)

### Form Handling

**React Hook Form + Zod:**
```typescript
const form = useForm({
  resolver: zodResolver(insertMessageSchema.extend({
    recipientIds: z.array(z.number()).min(1)
  })),
  defaultValues: { ... }
});
```

### API Integration

**Custom fetch wrapper:**
```typescript
// client/src/lib/queryClient.ts
export async function apiRequest<T>(
  method: string,
  url: string,
  data?: any
): Promise<T> {
  const API_URL = import.meta.env.VITE_API_URL || '';
  const fullUrl = `${API_URL}${url}`;
  // ... fetch logic with error handling
}
```

**Environment Variables:**
- `VITE_API_URL` - API base URL (пусто для веб, полный URL для mobile)

---

## 📱 Mobile Architecture (Capacitor 7.4.4)

### Configuration

**capacitor.config.ts:**
```typescript
{
  appId: 'tj.gov.eco.ecodoc',
  appName: 'EcoDoc',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#16a34a',
      androidSplashResourceName: 'splash',
      iosSplashResourceName: 'Splash',
      showSpinner: false,
    },
  }
}
```

### Production Integration

**API Configuration System:**
```typescript
// client/src/lib/api-config.ts
const API_URL = import.meta.env.VITE_API_URL || '';
```

**Build Scripts:**
```json
{
  "cap:sync": "vite build && cap sync",
  "cap:sync:prod": "bash -c 'set -a; source .env.mobile; set +a; vite build && cap sync'",
  "cap:build:prod": "bash -c 'set -a; source .env.mobile; set +a; vite build && cap sync'"
}
```

**Production Workflow:**
1. Создать `.env.mobile` с `VITE_API_URL=https://production-server.com`
2. Run `npm run cap:build:prod` (безопасно загружает переменные без изменения `.env`)
3. Build Android APK/AAB: `npm run cap:build:android:bundle`
4. Build iOS Archive: открыть Xcode → Product → Archive

**Mobile-specific considerations:**
- Session cookies работают через WebView
- HTTPS обязателен для iOS
- CORS должен быть настроен на production сервере
- Shared PostgreSQL database между web и mobile

---

## 🔐 Security Analysis

### ⚠️ MEDIUM: SESSION_SECRET Fallback (Already Mitigated)

**Location:** `server/index.ts:31-32, 42`
```typescript
// Production check (ALREADY IMPLEMENTED)
if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET must be set in production environment');
}

// Fallback (only used in development)
secret: process.env.SESSION_SECRET || 'eco-tajikistan-secret-key-change-in-production'
```

**Severity:** MEDIUM (Low actual risk)  
**Status:** ✅ **Already Mitigated** - Application crashes if SESSION_SECRET is missing in production

**Impact:** 
- In **production**: Application refuses to start without SESSION_SECRET (SAFE)
- In **development**: Fallback value is used (acceptable for local testing)

**Recommendation:**
For code clarity, consider removing the fallback entirely to make the requirement explicit:
```typescript
if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET is required in all environments');
}
secret: process.env.SESSION_SECRET
```

**Note:** This is a code cleanliness improvement, not a security fix. The current implementation is secure.

### ⚠️ Zip Slip Attack Protection

**Location:** `server/routes.ts:1914-1920`
```typescript
const sanitizedSubject = subject
  .replace(/\.\./g, '')  // Remove parent directory references
  .replace(/[/\\?%*:|"<>\x00-\x1f]/g, '_')  // Remove path separators
  .trim()
  .substring(0, 50);
```

**Severity:** MEDIUM  
**Status:** Partially mitigated  
**Recommendation:** Добавить более строгую валидацию:
```typescript
// Полностью исключить путевые символы
const sanitized = filename
  .replace(/[^a-zA-Z0-9а-яА-ЯёЁ\-\s]/g, '_')
  .trim()
  .substring(0, 50);
```

### 🚨 Missing Security Features

#### 1. Rate Limiting
**Status:** NOT IMPLEMENTED  
**Risk:** DoS attacks, brute-force на login endpoints

**Recommendation:**
```javascript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later'
});

app.post('/api/auth/department', loginLimiter, ...);
app.post('/api/auth/admin', loginLimiter, ...);
```

#### 2. CORS Configuration
**Status:** NOT CONFIGURED IN CODE  
**Note:** Упомянуто в MOBILE_BUILD_GUIDE.md, но не реализовано

**Recommendation:**
```javascript
import cors from 'cors';

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://production-domain.com'],
  credentials: true
}));
```

#### 3. Security Headers
**Status:** NOT IMPLEMENTED  
**Recommendation:**
```javascript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
    },
  },
}));
```

#### 4. Input Sanitization
**Status:** BASIC (Zod validation only)  
**Recommendation:** Добавить HTML sanitization для user-generated content:
```javascript
import sanitizeHtml from 'sanitize-html';

const sanitized = sanitizeHtml(content, {
  allowedTags: [],
  allowedAttributes: {}
});
```

### ✅ Good Security Practices

1. **Password Hashing:** Bcrypt с proper salt rounds
2. **Session Security:** HttpOnly cookies
3. **SQL Injection Protection:** Drizzle ORM параметризованные запросы
4. **Cascade Deletes:** Prevents orphaned records
5. **Role-based Access Control:** Admin vs Department permissions
6. **MIME Type Validation:** Проверка типов файлов
7. **File Size Limits:** 100MB для attachments, 10MB для icons

---

## ⚡ Performance Analysis

### Performance Optimizations Implemented

✅ **Frontend:**
1. **Code Splitting** - Vite automatic code splitting
2. **WebP Images** - Conversion через Sharp для department icons
3. **Gzip Compression** - `compression` middleware на backend
4. **HTTP Cache-Control** - Headers для статических ассетов
5. **Query Caching** - TanStack Query automatic caching
6. **Optimistic Updates** - Drag-and-drop reordering

**Result:** 85% data transfer reduction for slow networks

✅ **Database:**
1. **GIN Indexes** - Fast array membership queries
2. **Targeted Indexes** - На всех foreign keys
3. **Cascade Deletes** - Database-level constraints

### ⚠️ Performance Issues

#### 1. In-Memory File Storage (Multer)
**Issue:** Files до 100MB загружаются в память перед сохранением в БД

**Impact:**
- High memory usage при concurrent uploads
- Risk of OOM errors
- Slow для больших файлов

**Current Config:**
```javascript
multer({ 
  storage: memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } 
})
```

**Recommendation:**
- Option 1: Streaming uploads напрямую в БД
- Option 2: External object storage (S3, Minio) для файлов >10MB
- Option 3: Reduce file size limit to 50MB

#### 2. Database File Storage (bytea)
**Issue:** Все файлы хранятся как `bytea` в PostgreSQL

**Pros:**
- Transactional integrity
- Simple backup/restore
- Autonomous deployment
- Mobile compatibility

**Cons:**
- Database size growth (может достигать сотен GB)
- Slower backup/restore operations
- Higher memory usage для queries с файлами
- TOAST storage overhead

**Current Usage:**
- `attachments.fileData`: до 100MB
- `assignment_attachments.fileData`: до 100MB
- `announcement_attachments.fileData`: до 100MB
- `department_icons.fileData`: до 10MB

**Recommendation:**
Hybrid approach:
```typescript
// Small files (<5MB): bytea в БД
// Large files (>5MB): object storage с URL reference

if (fileSize < 5 * 1024 * 1024) {
  // Store in database
  await storage.createAttachment({ fileData: buffer });
} else {
  // Store in S3/Minio
  const url = await uploadToObjectStorage(buffer);
  await storage.createAttachment({ fileUrl: url });
}
```

#### 3. Batch Updates Without Transactions
**Issue:** `reorderDepartments` делает sequential updates без транзакций

**Location:** `server/storage.ts:135-142`
```typescript
async reorderDepartments(updates) {
  for (const update of updates) {
    await db.update(departments)
      .set({ sortOrder: update.sortOrder })
      .where(eq(departments.id, update.id));
  }
}
```

**Problem:** Если один update fails, partial state corruption

**Recommendation:**
```typescript
async reorderDepartments(updates) {
  await db.transaction(async (tx) => {
    for (const update of updates) {
      await tx.update(departments)
        .set({ sortOrder: update.sortOrder })
        .where(eq(departments.id, update.id));
    }
  });
}
```

#### 4. N+1 Query Problem (Potential)
**Location:** Attachment loading в списках

**Current:** Attachments загружаются отдельным запросом для каждого message

**Recommendation:**
```typescript
// Load messages with attachments in single query
const messagesWithAttachments = await db
  .select()
  .from(messages)
  .leftJoin(attachments, eq(attachments.messageId, messages.id))
  .where(...);
```

---

## 🗂️ Technical Debt

### 1. Dual Recipient Fields (High Priority)

**Issue:** Messages имеют два поля для получателей:
```typescript
recipientId: integer  // LEGACY - single recipient
recipientIds: integer[]  // NEW - broadcast support
```

**Impact:**
- Complex query logic
- Data consistency риски
- Migration challenges
- Code duplication

**Current Workaround:**
```typescript
const recipientIdsList = message.recipientIds?.length > 0
  ? message.recipientIds
  : message.recipientId ? [message.recipientId] : [];
```

**Recommendation:**
1. Migrate all data: `UPDATE messages SET recipientIds = ARRAY[recipientId] WHERE recipientIds = '{}'`
2. Remove `recipientId` field
3. Update all queries to use только `recipientIds`

### 2. Legacy Icon Field (Low Priority)

**Issue:** Departments имеют:
```typescript
icon: text DEFAULT 'building-2'  // Legacy lucide icon name
```
Но также существует `department_icons` таблица с custom icons

**Recommendation:** Deprecate `icon` field после full migration на custom icons

### 3. Missing API Documentation

**Issue:** Нет OpenAPI/Swagger спецификации

**Impact:**
- Сложно onboard новых разработчиков
- No contract testing
- Manual testing required

**Recommendation:**
```javascript
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EcoDoc API',
      version: '1.0.0',
    },
  },
  apis: ['./server/routes.ts'],
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

### 4. No Automated Testing

**Issue:** Нет unit tests, integration tests, e2e tests

**Impact:**
- Regression риски
- Manual QA required
- Slow development cycle

**Recommendation:**
```json
// package.json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "playwright": "^1.40.0"
  },
  "scripts": {
    "test": "vitest",
    "test:e2e": "playwright test"
  }
}
```

---

## 🚀 Deployment & Infrastructure

### Current Workflow

**Development (Replit):**
1. Code changes made in Replit
2. AI agent assists with development
3. Test locally with `npm run dev`

**Production Deployment (Timeweb via GitHub):**
1. Push code to GitHub
2. SSH to Timeweb server
3. Pull from GitHub
4. Run deployment commands:
```bash
npm install
npm run build
npm run db:migrate
pm2 restart ecosystem.config.js
```

### Environment Variables

**Required in Production:**
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/ecodoc

# Session
SESSION_SECRET=<strong-random-secret>  # ⚠️ CRITICAL

# Server
NODE_ENV=production
PORT=5000

# Optional
ALLOWED_ORIGINS=https://ecodoc.tj.gov
```

### Mobile Deployment

**iOS (App Store):**
1. `npm run cap:build:prod` (с `.env.mobile` containing production URL)
2. `npm run cap:open:ios`
3. Xcode → Product → Archive
4. Upload to App Store Connect
5. Submit for review

**Android (Google Play):**
1. `npm run cap:build:prod`
2. `npm run cap:build:android:bundle`
3. Sign APK/AAB с keystore
4. Upload to Google Play Console
5. Submit for review

### Database Migrations

**Safe Migration Process:**
```bash
# Generate migration
npm run db:generate

# Apply migration
npm run db:migrate
```

**Migration System:**
- `drizzle-kit` для schema changes
- `server/safe-migrate.ts` для безопасного применения
- Rollback support через версионирование

### Monitoring & Logging

**Current Status:** Basic console logging only

**Recommendations:**
1. **Structured Logging:**
```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
```

2. **Error Tracking:**
```javascript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

3. **Performance Monitoring:**
```javascript
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';

// Track request duration, database queries, file uploads
```

### Backup Strategy

**Recommendations:**
1. **Database Backups:**
```bash
# Daily automated backups
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Backup retention: 30 days
```

2. **File Backups:**
Since files в БД, достаточно database backups

3. **Disaster Recovery:**
- Keep backups offsite (S3, другой datacenter)
- Test restore procedure monthly
- Document recovery steps

---

## 📝 Feature List

### Implemented Features

#### Authentication & Authorization
✅ Department login via access code  
✅ Admin login via username/password  
✅ Session-based authentication (30 days)  
✅ Role-based access control (Department vs Admin)  
✅ Permission system (canMonitor, canCreateAssignment, etc.)

#### Messaging System
✅ Send messages between departments  
✅ Broadcast messages to multiple departments  
✅ Message forwarding (Иловакунӣ) с автокопированием attachments  
✅ Reply to messages (replyToId)  
✅ Read tracking (isRead flag)  
✅ Unread count badges  
✅ Document number field  
✅ Executor field  
✅ Soft delete (Recycle Bin / Корзина)  
✅ Permanent delete (admin only)  
✅ Restore from trash

#### File Management
✅ Up to 5 attachments per message/assignment/announcement  
✅ 100MB max file size  
✅ Database storage (bytea)  
✅ MIME type validation  
✅ UTF-8 filename decoding (mojibake handling)  
✅ Secure authenticated downloads  
✅ ZIP archive export (admin) с Word documents

#### Assignments (Супоришҳо)
✅ Create assignments with topic selection  
✅ Multi-executor support (Даъват + Иҷрокунандагон)  
✅ Department targeting via recipientIds  
✅ Deadline tracking с three-color progress indicators  
✅ Completion status tracking  
✅ File attachments (up to 5 files)  
✅ Read tracking  
✅ Badge counters для uncompleted assignments  
✅ Soft delete + restore  
✅ Permission control (canCreateAssignment)

#### Announcements (Эълонҳо)
✅ Platform-wide announcements  
✅ Targeted announcements (recipientIds array)  
✅ Broadcast to all (null/empty recipientIds)  
✅ Read tracking (readBy array)  
✅ Unread count badges  
✅ File attachments  
✅ Soft delete + restore  
✅ Permission control (canCreateAnnouncement)

#### Department Management (Admin)
✅ CRUD operations для departments  
✅ Hierarchical organization (Upper, Middle, Lower, District blocks)  
✅ Custom sorting via drag-and-drop (sortOrder)  
✅ Access code generation/regeneration  
✅ Permission flags management  
✅ Custom icon upload с cropping и zooming  
✅ View department message history (inbox/outbox)  
✅ ZIP export department messages

#### People Management (Admin)
✅ CRUD operations для executors  
✅ Department association  
✅ Automatic filtering in assignment forms  
✅ Name-based executor selection

#### Monitoring (Назорат)
✅ Public unread stats endpoint  
✅ Department-specific monitoring page (canMonitor permission)  
✅ Real-time unread counts

#### UI/UX
✅ Bilingual interface (Tajik/Russian)  
✅ Material Design principles  
✅ Green color scheme (#16a34a)  
✅ Responsive design  
✅ Adaptive eco-themed backgrounds на auth pages  
✅ Consistent green gradient headers на dept pages  
✅ Footer с "Раёсати рақамикунонӣ ва инноватсия" info  
✅ Badge counters everywhere  
✅ Three-color deadline progress indicators  
✅ Broadcast message display ("Ҳама шуъбаҳо")

#### Mobile Support
✅ Native iOS app (Capacitor)  
✅ Native Android app (Capacitor)  
✅ Production server integration  
✅ Unified PostgreSQL database  
✅ Green-themed splash screens  
✅ Native icons  
✅ App Store & Play Store ready

#### Performance
✅ 85% data transfer reduction для slow networks  
✅ WebP image compression (Sharp)  
✅ Gzip middleware  
✅ HTTP Cache-Control headers  
✅ Frontend code splitting  
✅ GIN indexes для array queries

---

## 🔮 Recommendations & Roadmap

### Security Improvements (Priority: CRITICAL)

1. **Fix SESSION_SECRET** (Immediate)
   - Remove hardcoded fallback
   - Require env variable in production
   - Generate strong secret: `openssl rand -base64 32`

2. **Add Rate Limiting** (High)
   - Install `express-rate-limit`
   - Apply to login endpoints
   - Configure: 5 attempts per 15 minutes

3. **Implement CORS** (High)
   - Install `cors` package
   - Configure allowed origins from env
   - Enable credentials support

4. **Add Security Headers** (Medium)
   - Install `helmet`
   - Configure CSP
   - Enable HSTS in production

5. **Enhanced Input Sanitization** (Medium)
   - Install `sanitize-html`
   - Sanitize user content
   - Prevent XSS attacks

### Performance Improvements (Priority: HIGH)

1. **File Storage Migration** (High)
   - Evaluate object storage (S3, Minio)
   - Implement hybrid approach (small in DB, large in storage)
   - Reduce database size

2. **Add Transactions** (Medium)
   - Wrap batch operations в transactions
   - Fix `reorderDepartments`
   - Add to message forwarding

3. **Optimize Queries** (Medium)
   - Fix potential N+1 problems
   - Add eager loading для attachments
   - Use Drizzle's `with` clauses

4. **Implement Caching** (Low)
   - Redis для frequent queries
   - Cache department list
   - Cache unread counts (5 min TTL)

### Technical Debt Reduction (Priority: MEDIUM)

1. **Migrate Recipient Fields** (High)
   - Create migration script
   - Update all `recipientId` → `recipientIds`
   - Remove legacy field

2. **Add API Documentation** (Medium)
   - Install Swagger/OpenAPI
   - Document all endpoints
   - Add request/response examples

3. **Implement Testing** (Medium)
   - Unit tests (Vitest)
   - Integration tests (Supertest)
   - E2E tests (Playwright)
   - Target: 70% coverage

4. **Improve Error Handling** (Low)
   - Structured error responses
   - Error codes
   - User-friendly messages

### New Features (Priority: LOW)

1. **Email Notifications**
   - Install Nodemailer
   - Send email на новые messages/assignments
   - Digest emails (daily summary)

2. **Push Notifications (Mobile)**
   - Integrate Firebase Cloud Messaging
   - Notify on new messages
   - Configurable preferences

3. **Advanced Search**
   - Full-text search (PostgreSQL `tsvector`)
   - Filter by date range
   - Filter by sender/recipient
   - Search attachments by filename

4. **Activity Logs**
   - Audit trail для admin actions
   - Message history tracking
   - Login history

5. **Analytics Dashboard**
   - Message statistics
   - Department activity
   - Response time metrics
   - Completion rates для assignments

6. **File Preview**
   - PDF preview в браузере
   - Image thumbnails
   - Document viewer

---

## 📚 Documentation Gaps

### Missing Documentation

1. **API Reference** - Нет OpenAPI spec
2. **Developer Guide** - Нет onboarding документа
3. **Deployment Checklist** - Нет pre-production checklist
4. **Architecture Decision Records (ADRs)** - Нет documented decisions
5. **Runbook** - Нет operational procedures

### Recommended Documentation

#### 1. API_REFERENCE.md
```markdown
# EcoDoc API Reference

## Authentication
### POST /api/auth/department
Description: Department login via access code
Request: { accessCode: string }
Response: { department: Department }
...
```

#### 2. DEVELOPER_GUIDE.md
```markdown
# Developer Guide

## Setup
1. Clone repository
2. Install dependencies: npm install
3. Configure .env (see .env.example)
4. Run migrations: npm run db:migrate
5. Seed database: npm run db:seed
6. Start server: npm run dev
...
```

#### 3. DEPLOYMENT_CHECKLIST.md
```markdown
# Pre-Production Deployment Checklist

## Environment
- [ ] DATABASE_URL configured
- [ ] SESSION_SECRET set (strong random value)
- [ ] NODE_ENV=production
- [ ] ALLOWED_ORIGINS configured

## Security
- [ ] HTTPS enabled
- [ ] Rate limiting configured
- [ ] CORS configured
- [ ] Security headers enabled
...
```

#### 4. OPERATIONAL_RUNBOOK.md
```markdown
# Operational Runbook

## Common Issues

### High Memory Usage
1. Check file upload sizes: SELECT pg_size_pretty(sum(file_size)) FROM attachments;
2. Monitor active connections: SELECT count(*) FROM pg_stat_activity;
3. Restart if needed: pm2 restart ecodoc
...
```

---

## 🎯 Conclusion

### System Health Score: 7.5/10

**Strengths:**
- ✅ Solid architecture foundation
- ✅ Type-safe database operations
- ✅ Good permission system
- ✅ Mobile-ready
- ✅ Performance optimizations implemented

**Critical Issues:**
- ⚠️ No rate limiting on authentication endpoints (security risk)
- ⚠️ CORS not configured in code (mobile compatibility)
- ⚠️ Large files (100MB) loaded in memory before DB storage (performance risk)
- ⚠️ No automated testing (quality risk)
- ⚠️ Missing operational monitoring and logging

**Action Items (Next 30 Days):**
1. Add rate limiting to auth endpoints (Day 1-2, High Priority)
2. Configure CORS middleware (Day 2-3, High Priority)
3. Add security headers with Helmet (Day 3-4, Medium Priority)
4. Optimize file upload handling (Week 2, Medium Priority)
5. Migrate dual recipient fields (Week 2-3, Medium Priority)
6. Add API documentation with Swagger (Week 3, Low Priority)
7. Implement basic unit/integration tests (Week 4, Low Priority)
8. Set up structured logging and monitoring (Week 4, Medium Priority)

### Success Metrics

After implementing recommendations:
- **Security Score:** 9/10 (from 6/10)
- **Performance Score:** 8.5/10 (from 7/10)
- **Code Quality Score:** 9/10 (from 7.5/10)
- **Documentation Score:** 8/10 (from 4/10)

---

**Prepared by:** AI Agent (Comprehensive System Audit)  
**Date:** November 18, 2025  
**Next Review:** March 2026
