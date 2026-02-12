# EcoDoc Platform

## Overview
EcoDoc is a secure, bilingual (Tajik and Russian) internal messaging and document management platform designed for governmental and organizational departments in Tajikistan. Its primary goal is to centralize official communication, ensuring security, data persistence, and mobile compatibility through an API-first approach. The platform facilitates department-level access, features an administrative panel, and aims to enhance communication efficiency and transparency. Key capabilities include an assignment and announcement system with file attachments, read tracking, and badge counters. It supports PWA, Native Mobile Apps (iOS/Android via Capacitor), and standard Web Application deployments, optimized for performance on slow internet connections.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
The frontend is built with React, TypeScript, Vite, Wouter for routing, TanStack Query for server state management, and Tailwind CSS with shadcn/ui and Radix UI components. It adheres to Material Design principles with a minimalistic aesthetic, green accents, and light mode, utilizing Inter and Roboto fonts for Cyrillic support. The interface is bilingual (Tajik default). Authentication pages feature adaptive eco-themed backgrounds, while department pages maintain consistent green gradient headers. It employs an API-first approach with session-based authentication and includes an admin panel for department management.

### Mobile & PWA
**PWA (Progressive Web App):** Implemented using `vite-plugin-pwa` and Workbox, it includes a Service Worker for offline functionality, caching strategies (CacheFirst for static assets, NetworkFirst for API calls), and an auto-update mechanism, allowing installation directly from browsers.
**Native Mobile Apps:** Developed via Capacitor 7.x for iOS and Android, leveraging a Native WebView wrapper for extensive code reuse. It supports native icons, splash screens, and app store distribution, connecting to the production server via a unified PostgreSQL database with an API configuration system for environment-based routing.

### Backend
The backend is developed with Node.js, Express.js, and TypeScript, implementing a RESTful API. It uses session-based authentication with `express-session` and a PostgreSQL store, Bcrypt for password hashing, and Drizzle ORM with Zod for schema validation. The API provides endpoints for authentication, department management, CRUD operations for messages (including broadcast and forwarding), announcements, assignments, and file attachments. It supports two user types: Department (via access code) and Admin (via username/password), with role-based access control and 30-day session expiration.

### Data Storage
PostgreSQL with connection pooling is used for data storage. Key tables include `Departments`, `Admins`, `Messages`, `Attachments`, `Sessions`, `Assignments`, and `Announcements`. Departments are organized hierarchically, totaling 49 departments. A safe migration system handles schema updates.

### File Storage
Files are stored directly within the PostgreSQL database using a `bytea` column, supporting up to 5 attachments per item (message/assignment/announcement) with a maximum of 100 MB per file. Client-side uploads use `multipart/form-data`, and secure downloads require backend authentication. This method ensures autonomous deployment, transaction integrity, simplified backup/restore, and mobile application compatibility.

### Key Features
*   **Assignments and Announcements:** Comprehensive task management and platform-wide notifications with deadline tracking, multi-executor assignment, topic selection, content/comments, and completion status. Includes file attachments, read tracking, badge counters with admin panel-controlled permissions, and assignment reply system allowing recipient departments to respond.
*   **Assignment Replies:** Recipient departments can submit replies to assignments with document editor integration, file attachments (up to 5 files per reply), and visual indicators (checkmarks/tooltips) showing which executors' departments have responded. Replies are displayed in a collapsible "Ҷавобҳо" section under each assignment, with "даъват" (invited executor) replies appearing first. Content is sanitized both server-side and client-side using DOMPurify to prevent XSS attacks.
*   **Broadcast Messaging:** Optimized for sending messages to multiple departments.
*   **Message Forwarding (Иловакунӣ):** Allows department users to forward messages with automatic attachment copying and tracking of original sender/forwarder.
*   **Department Icon Upload:** Interactive icon upload with image cropping and zooming.
*   **ZIP Archive Export System:** Admin-only feature to export department message history as structured ZIP archives, including formatted Word documents and attachments.
*   **Recycle Bin (Корзина) System:** Soft-delete functionality for messages, assignments, and announcements with department-scoped visibility and admin permanent deletion capabilities.
*   **Independent Message Deletion:** Senders and recipients can delete messages independently - when a sender deletes a message, recipients can still see it, and vice versa. Uses `isDeletedBySender` and `deletedByRecipientIds` fields for per-user deletion tracking. Admins can perform global deletions that affect all users.
*   **Unified Department Ordering System:** Centralized `sortOrder`-based department ordering managed via an admin panel with drag-and-drop.
*   **People/Executors Management System:** Manages people (executors) with department associations, including CRUD API and automatic filtering in forms.
*   **Flexible Permission System:** Database-driven permissions for `canCreateAssignment`, `canCreateAssignmentFromMessage`, and `canMonitor`.
*   **Assignment Monitoring (Назорати Супоришҳо):** Admin-configurable feature allowing departments with `canMonitor` permission to monitor specific departments' assignments. Configured via `monitoredAssignmentDeptIds` array in department settings. Single department opens directly; multiple departments show a selector page.
*   **Targeted Assignments & Announcements:** Assignments and announcements can be targeted to specific departments via `recipientIds`.
*   **Document Number Field:** Optional `documentNumber` field for Messages and Assignments.
*   **Embedded Document Editor:** Full-featured TipTap-based rich text editor embedded directly in the platform. Both senders and recipients can edit documents attached to messages. Features include fonts (with Tajik-optimized fonts like Noto Sans, Noto Serif, Open Sans with Cyrillic support), formatting (bold, italic, underline), alignment, lists, tables, images, department stamps, and search/replace. Word paste formatting preservation cleans MSO markup while keeping font family, size, styles, colors, and text alignment. No external authentication required. Documents are tracked with `lastEditedBy` field.
*   **Web Push Notifications:** Real-time browser notifications for new messages, assignments, and announcements using W3C Push API and VAPID authentication.
*   **App Icon Badging:** Displays unread count (messages, announcements, assignments) on app icon using Badging API. Works on PWA and native mobile apps.
*   **Unread Messages Block (Mobile):** Special first block on mobile view showing departments with unread messages, displayed with red header "Паёмҳои нохондашуда" (Unread Messages).
*   **Performance Optimization:** Achieves 85% data transfer reduction for slow networks through WebP image compression, gzip middleware, HTTP Cache-Control headers, and frontend code splitting.

## External Dependencies

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
*   **Security:** `isomorphic-dompurify`
*   **Third-Party Services:** PostgreSQL server (version 13+), Google Fonts (Inter and Roboto)