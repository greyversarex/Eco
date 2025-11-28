# EcoDoc Platform

### Overview
EcoDoc is a secure, bilingual (Tajik and Russian) internal messaging and document management platform for governmental and organizational departments in Tajikistan. Its core purpose is to centralize official communication, ensuring security, data persistence, and mobile compatibility through an API-first approach. The platform provides department-level access, an administrative panel for management, and aims to enhance communication efficiency and transparency. Key features include an assignment and announcement system with file attachments, read tracking, and badge counters. It supports three deployment modes: PWA, Native Mobile Apps (iOS/Android via Capacitor), and a standard Web Application, and is optimized for performance on slow internet connections.

### User Preferences
Preferred communication style: Simple, everyday language.

### Development & Deployment Workflow
**Important:** The production site is already running on Timeweb hosting with its own PostgreSQL database. Development workflow:
1. **Development Environment (Replit):** Code improvements and new features are developed here with a local development database
2. **Version Control (GitHub):** Code changes are pushed to GitHub repository from Replit
3. **Production Deployment (Timeweb):** Production server pulls code updates from GitHub

**Key Constraints:**
- Only **code** can be transferred from Replit to production (via GitHub)
- **Environment variables** (`.env`) are managed separately on production server
- **Database** on production is completely separate - any database changes here are for development/testing only
- Database schema changes must be coordinated: develop migrations here, then apply them manually on production

### System Architecture

**Frontend:**
Built with React, TypeScript, Vite, Wouter for routing, TanStack Query for server state, and Tailwind CSS with shadcn/ui and Radix UI components. It adheres to Material Design principles with a minimalistic aesthetic, green accents, and light mode, using Inter and Roboto fonts for Cyrillic support. The interface is bilingual (Tajik default). Authentication pages feature adaptive eco-themed backgrounds, while department pages have consistent green gradient headers. It uses an API-first approach with session-based authentication and includes an admin panel for department management.

**Mobile & PWA:**
*   **PWA (Progressive Web App):** Implemented with `vite-plugin-pwa` and Workbox, featuring a Service Worker for offline functionality, caching strategies (CacheFirst for static assets, NetworkFirst for API calls), and an auto-update mechanism. Installable on all platforms directly from the browser.
*   **Native Mobile Apps:** Developed via Capacitor 7.x for iOS and Android, utilizing a Native WebView wrapper for extensive code reuse. Supports native icons, splash screens, and app store distribution. Connects to the production server using a unified PostgreSQL database with an API configuration system for environment-based routing.

**Backend:**
Developed with Node.js, Express.js, and TypeScript, implementing a RESTful API. It uses session-based authentication with `express-session` and a PostgreSQL store, Bcrypt for password hashing, and Drizzle ORM with Zod for schema validation. The API provides endpoints for authentication, department management, CRUD operations for messages (including broadcast), announcements, assignments, and file attachments. It supports two user types: Department (via access code) and Admin (via username/password), with role-based access control and 30-day session expiration.

**Data Storage:**
Utilizes PostgreSQL with connection pooling. Key tables include `Departments`, `Admins`, `Messages`, `Attachments`, `Sessions`, `Assignments`, and `Announcements`. Departments are organized into four hierarchical blocks, totaling 49 departments. A safe migration system handles schema updates.

**File Storage:**
Files are stored directly within the PostgreSQL database using a `bytea` column, supporting up to 5 attachments per item (message/assignment/announcement) with a maximum of 100 MB per file. Client-side uploads use `multipart/form-data`, and secure downloads require backend authentication. This method ensures autonomous deployment, transaction integrity, simplified backup/restore, and mobile application compatibility.

**Key Features:**
*   **Assignments and Announcements:** Comprehensive task management and platform-wide notifications with deadline tracking, multi-executor assignment, topic selection, content/comments, and completion status. Includes file attachments, read tracking, and badge counters with admin panel-controlled permissions.
*   **Broadcast Messaging:** Optimized for sending messages to multiple departments.
*   **Message Forwarding (Иловакунӣ):** Allows department users to forward messages with automatic attachment copying and tracking of original sender/forwarder.
*   **Department Icon Upload:** Interactive icon upload with image cropping and zooming.
*   **ZIP Archive Export System:** Admin-only feature to export department message history as structured ZIP archives, including formatted Word documents and attachments.
*   **Recycle Bin (Корзина) System:** Soft-delete functionality for messages, assignments, and announcements with department-scoped visibility and admin permanent deletion capabilities.
*   **Unified Department Ordering System:** Centralized `sortOrder`-based department ordering managed via an admin panel with drag-and-drop.
*   **People/Executors Management System:** Manages people (executors) with department associations, including CRUD API and automatic filtering in forms.
*   **Flexible Permission System:** Database-driven permissions for `canCreateAssignment`, `canCreateAssignmentFromMessage`, and `canMonitor`.
*   **Targeted Assignments & Announcements:** Assignments and announcements can be targeted to specific departments via `recipientIds`.
*   **Document Number Field:** Optional `documentNumber` field for Messages and Assignments.
*   **Web Push Notifications:** Real-time browser notifications for new messages, assignments, and announcements using W3C Push API and VAPID authentication. Backend automatically refetches authoritative records post-creation to ensure normalized recipients, implements resilient delivery with Promise.allSettled, auto-cleans stale subscriptions, and provides ownership verification. Frontend uses authenticated subscription lifecycle integrated with QueryClientProvider. Includes manual permission request via NotificationButton (User Gesture) to avoid browser blocking. Uses `credentials: 'include'` for authenticated API requests.
*   **App Icon Badging:** Displays unread count (messages, announcements, assignments) on app icon using Badging API. Works on PWA and native mobile apps. Auto-refreshes every 30 seconds for authenticated users and clears badge on logout.
*   **Unread Messages Block (Mobile):** Special first block on mobile view showing departments with unread messages, displayed with red header "Паёмҳои нохондашуда" (Unread Messages). Auto-sorted by unread count (highest first). Only visible when unread messages exist.
*   **Performance Optimization:** Achieves 85% data transfer reduction for slow networks through WebP image compression, gzip middleware, HTTP Cache-Control headers, and frontend code splitting.

### External Dependencies

*   **Database:** `pg`, `drizzle-orm`, `drizzle-kit`, `connect-pg-simple`
*   **Authentication & Security:** `bcrypt`, `express-session`, `cors`, `helmet`
*   **Backend Framework:** `express`, `tsx`
*   **Frontend Framework:** `react`, `@tanstack/react-query`, `wouter`
*   **PWA:** `vite-plugin-pwa`, `workbox-window`
*   **Mobile Framework:** `@capacitor/core`, `@capacitor/ios`, `@capacitor/android`, `@capacitor/cli`, `@capacitor/assets`
*   **UI Components:** `@radix-ui/*`, `tailwindcss`, `class-variance-authority`, `lucide-react`
*   **Form Handling:** `react-hook-form`, `@hookform/resolvers`, `zod`
*   **Drag and Drop:** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
*   **Image Processing:** `react-easy-crop`, `sharp`
*   **Archive Generation:** `jszip`, `docx`
*   **Push Notifications:** `web-push`
*   **Utilities:** `date-fns`, `clsx`, `tailwind-merge`
*   **Third-Party Services:** PostgreSQL server (version 13+), Google Fonts (Inter and Roboto)

### Recent Changes
*   **2025-11-28 (Authentication & Real-time Updates):** 
    - **Double Login Fix:** Replaced `invalidateQueries` with `fetchQuery` + exponential backoff retry (3 attempts) to ensure session is fully persisted before navigation
    - **Real-time Data Updates:** Push notifications now broadcast cache invalidation messages to all open tabs/windows via Service Worker
    - **Cache Invalidation Hook:** New `useCacheInvalidation` hook listens for SW messages and invalidates TanStack Query caches
    - **Mutation Improvements:** Send/delete operations now invalidate all related caches (messages, unread counts, counters)
    - **Fallback Polling:** Added 30-second auto-refresh interval for unread counts and counters on main page
*   **2025-11-27 (Session & Department Fixes):** Critical session persistence fix and improved department lookups:
    - Session Fix: Moved session middleware BEFORE body parsers (`express.json()`) in server/index.ts to prevent logout issues
    - New Endpoint: Added `/api/departments/all` to return ALL departments including subdepartments (for sender/recipient lookups)
    - Navigation Filtering: DepartmentMain and ComposeMessage now filter out subdepartments for regular department users
    - Unread Badge: Added unread message counter badge to inbox button ("Хуҷҷатҳои воридшуда") on both desktop and mobile
    - All pages using department lists now use `/api/departments/all` with appropriate filtering
*   **2025-11-26 (Subdepartments Feature):** Implemented hierarchical subdepartments system for EcoDoc. Parent departments can have subdepartments with restricted messaging access (parent + sibling subdepartments only). Key changes:
    - Database: Added `parentDepartmentId` column with self-referential FK and CASCADE delete
    - Storage: Added `getSubdepartments`, `getAccessibleDepartments`, `getSiblingSubdepartments` methods
    - Session: Added `isSubdepartment` and `parentDepartmentId` flags for subdepartment users
    - API Security: Message creation and reading endpoints validate recipient accessibility for subdepartments
    - Admin UI: Parent department selection in create/edit forms, subdepartment count badges on cards
    - Department UI: Subdepartments section on parent department pages, special main page view for subdepartment users showing only accessible departments (parent + siblings)
*   **2025-11-21 (Update 3):** Fixed Mobile PWA 401 Unauthorized issues through server configuration rewrite. CORS now uses `origin: true` (maximally permissive). Session cookies use environment-aware settings: HTTPS mode (`secure: true` + `sameSite: 'none'`) for production/staging PWA support, HTTP mode (`secure: false` + `sameSite: 'lax'`) for local development. Added `FORCE_HTTPS=true` env flag for staging testing. Push notifications now trigger on `/api/messages` endpoint with fallback support for both legacy `recipientId` and new `recipientIds` array formats.
*   **2025-11-21 (Update 2):** Successfully migrated from Replit Agent to standard Replit environment. Created PostgreSQL database with complete schema migration (9 tables: departments, admins, messages, attachments, assignments, announcements, people, push_subscriptions, sessions). Seeded database with 1 admin user (admin/admin123), 49 real governmental departments from Ministry of Environmental Protection, and 46 executors. Application running on port 5000 with full database connectivity.
*   **2025-11-21 (Update 1):** Complete Tajik-only interface (removed all Russian text from drafts, notifications, Service Worker). Save draft button redesigned as green icon-only button. Fixed offline mode - added NavigationRoute with NetworkFirst strategy in Service Worker to cache HTML pages, enabling offline login and navigation for PWA/native apps.
*   **2025-11-20 (Update 4):** Created `FIX_PUSH_401_PRODUCTION.md` troubleshooting guide for fixing 401 errors on production server caused by missing/incorrect `ALLOWED_ORIGINS` configuration.
*   **2025-11-20 (Update 3):** Added mobile-only "Unread Messages" block (Паёмҳои нохондашуда) displayed first when departments have unread messages. Confirmed push notification subscribe endpoints use `credentials: 'include'` for proper authentication.
*   **2025-11-20 (Update 2):** Added App Icon Badging (red circle with unread count) using Badging API for PWA/native apps. Implemented manual NotificationButton for permission requests (User Gesture) to avoid browser blocking. Auto-clears badge on logout.