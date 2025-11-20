# EcoDoc Platform

### Overview
EcoDoc is a secure, bilingual (Tajik and Russian) internal messaging and document management platform for governmental and organizational departments in Tajikistan. Its core purpose is to centralize official communication, ensuring security, data persistence, and mobile compatibility through an API-first approach. The platform provides department-level access, an administrative panel for management, and aims to enhance communication efficiency and transparency. Key features include an assignment and announcement system with file attachments, read tracking, and badge counters. It supports three deployment modes: PWA, Native Mobile Apps (iOS/Android via Capacitor), and a standard Web Application, and is optimized for performance on slow internet connections.

### User Preferences
Preferred communication style: Simple, everyday language.

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
*   **Web Push Notifications:** Real-time browser notifications for new messages, assignments, and announcements using W3C Push API and VAPID authentication. Backend automatically refetches authoritative records post-creation to ensure normalized recipients, implements resilient delivery with Promise.allSettled, auto-cleans stale subscriptions, and provides ownership verification. Frontend uses authenticated subscription lifecycle integrated with QueryClientProvider.
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
*   **2025-11-20:** Web Push Notifications fully implemented with VAPID authentication, authoritative recipient refetch pattern, resilient delivery, auto-cleanup of stale subscriptions, and comprehensive documentation (PUSH_NOTIFICATIONS_SETUP.md). Production-ready pending VAPID environment variable configuration.