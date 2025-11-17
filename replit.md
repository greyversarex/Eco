# EcoDoc Platform

## Overview
EcoDoc is a secure, bilingual (Tajik and Russian) internal messaging and document management platform designed for governmental and organizational departments in Tajikistan. Its primary goal is to centralize official communication, ensuring security, data persistence, and mobile compatibility through an API-first approach. The platform provides department-level access with unique codes, an administrative panel for comprehensive management, and aims to boost communication efficiency and transparency within Tajikistan's environmental protection sector. Key features include an assignment and announcement system with file attachments, read tracking, and badge counters. It is optimized for performance on slow internet connections and is available as native iOS and Android mobile applications via Capacitor.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React, TypeScript, Vite, Wouter for routing, TanStack Query for server state, and Tailwind CSS with shadcn/ui and Radix UI components. It adheres to Material Design principles with a minimalistic aesthetic, green accents, and light mode. Inter and Roboto fonts provide Cyrillic support. The interface is bilingual (Tajik default). Authentication pages feature adaptive eco-themed backgrounds, while department pages have consistent green gradient headers. It follows an API-first approach, using session-based authentication for route protection, and includes an admin panel for department management.

### Mobile Architecture
The platform is available as native iOS and Android applications via Capacitor 7.x, wrapping the web application in a native WebView for extensive code reuse. It includes native icons and splash screens (green-themed), and supports app distribution to Apple App Store and Google Play Store. The architecture is extensible for native device features via Capacitor plugins. Mobile apps connect to the production server on Timeweb using a unified PostgreSQL database, with an API configuration system (`api-config.ts`) that automatically routes requests based on the environment.

### Backend Architecture
The backend is developed with Node.js, Express.js, and TypeScript, implementing a RESTful API design. It uses session-based authentication with express-session, a PostgreSQL store, and Bcrypt for password hashing. The API provides endpoints for authentication, department management, CRUD operations for messages (including broadcast), announcements, assignments, and file attachments. It supports two user types: Department (via access code) and Admin (via username/password), with role-based access control and a 30-day session expiration. A Drizzle ORM implementation ensures type-safe PostgreSQL operations, and Zod is used for schema validation.

### Data Storage
PostgreSQL with connection pooling is used for data storage. Key tables include `Departments`, `Admins`, `Messages`, `Attachments`, `Sessions`, `Assignments`, and `Announcements`. Departments are organized into four hierarchical blocks (Upper, Middle, Lower, District), totaling 49 departments. A safe migration system handles schema updates.

### File Storage
Files are stored directly within the PostgreSQL database using a `bytea` column, supporting up to 5 attachments per item (message/assignment/announcement) with a maximum of 100 MB per file. Client-side uploads use multipart/form-data, and secure downloads require backend authentication. This method ensures autonomous deployment, transaction integrity, simplified backup/restore, and mobile application compatibility.

### Feature Specifications
- **Assignments and Announcements:** A comprehensive system for task management and platform-wide notifications with deadline tracking (three-color progress indicators), multi-executor assignment, topic selection, content/comments fields, and completion status. Features file attachments, read tracking, and badge counters. Permissions are controlled via an admin panel through database flags.
- **Broadcast Messaging:** Optimized endpoint for sending messages to multiple departments.
- **Message Forwarding (Иловакунӣ):** Department users can forward messages with automatic attachment copying. The system tracks original sender and forwarder, displaying this information in the subject and an info block.
- **Department Icon Upload:** Interactive icon upload system with image cropping and zooming.
- **ZIP Archive Export System:** Admin-only feature to export department message history (inbox/outbox) as structured ZIP archives. Each message includes a formatted Word document with metadata and attachments. Folder names are sanitized for compatibility.
- **Recycle Bin (Корзина) System:** Soft-delete functionality for messages, assignments, and announcements with department-scoped visibility. Admins can view and permanently delete items from department-specific trash views.
- **Unified Department Ordering System:** Centralized `sortOrder`-based department ordering managed via an admin panel with drag-and-drop.
- **People/Executors Management System:** Manages people (executors) with department associations, including CRUD API and automatic filtering in forms.
- **Flexible Permission System:** Database-driven permissions for `canCreateAssignment`, `canCreateAssignmentFromMessage`, and `canMonitor`.
- **Department-Specific Assignments:** Assignments are targeted via `recipientIds`, ensuring departments see only relevant tasks.
- **Targeted Announcements:** Announcements support multi-department targeting via `recipientIds` array. Null/empty `recipientIds` broadcast to all departments.
- **Document Number Field:** Optional `documentNumber` field for Messages and Assignments.
- **Message List Headers:** Consistent column headers and grid alignment across all message list views (Inbox, Department Messages, Admin Department Messages).
- **Broadcast Message Display:** Comprehensive handling of broadcast messages across all views, displaying "Ҳама шуъбаҳо" (All departments) for system-wide messages and department badges for multi-recipient broadcasts.
- **Performance Optimization:** Achieved 85% data transfer reduction for slow networks through WebP image compression, gzip middleware, HTTP Cache-Control headers, and frontend code splitting.
- **Footer Information:** Displays "Раёсати рақамикунонӣ ва инноватсия" contact information with two phone numbers.

## External Dependencies

### Core Dependencies
- **Database:** `pg`, `drizzle-orm`, `drizzle-kit`, `connect-pg-simple`.
- **Authentication & Security:** `bcrypt`, `express-session`.
- **Backend Framework:** `express`, `tsx`.
- **Frontend Framework:** `react`, `@tanstack/react-query`, `wouter`.
- **Mobile Framework:** `@capacitor/core`, `@capacitor/ios`, `@capacitor/android`, `@capacitor/cli`, `@capacitor/assets`.
- **UI Components:** `@radix-ui/*`, `tailwindcss`, `class-variance-authority`, `lucide-react`.
- **Form Handling:** `react-hook-form`, `@hookform/resolvers`, `zod`.
- **Drag and Drop:** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.
- **Image Processing:** `react-easy-crop`, `sharp`.
- **Archive Generation:** `jszip`, `docx`.
- **Utilities:** `date-fns`, `clsx`, `tailwind-merge`.

### Third-Party Services
- PostgreSQL server (version 13+).
- Google Fonts (Inter and Roboto).