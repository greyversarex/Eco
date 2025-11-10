# ЭкоТоҷикистон Platform

## Overview
ЭкоТоҷикистон is a secure, bilingual (Tajik and Russian) internal messaging and document management platform for governmental and organizational departments in Tajikistan. Its core purpose is to centralize official communication, prioritizing security, data persistence, and future mobile compatibility via an API-first architecture. The system offers department-level access with unique codes and an administrative panel for platform management, aiming to enhance communication efficiency and transparency within Tajikistan's environmental protection sector. It features a comprehensive assignment and announcement system with file attachment support, read tracking, and badge counters to improve inter-departmental coordination and oversight. The platform is optimized for performance on slow internet connections.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend uses React with TypeScript, Vite, Wouter for routing, TanStack Query for server state, and Tailwind CSS with shadcn/ui and Radix UI for components. It adheres to Material Design principles with a minimalistic aesthetic, green accents, and supports light mode. Inter and Roboto fonts provide Cyrillic support. The interface is bilingual (Tajik default). Authentication pages feature adaptive eco-themed backgrounds, while department pages maintain consistent green gradient headers. An API-first approach means the frontend renders data from backend responses. Session-based authentication protects routes, and an admin panel allows comprehensive department management.

### Backend Architecture
The backend is built with Node.js, Express.js, and TypeScript, following a RESTful API design. It uses session-based authentication with express-session and a PostgreSQL store, and Bcrypt for password hashing. The API provides endpoints for authentication, department management, CRUD operations for messages (including inbox/outbox filtering, and broadcast messaging), announcements, assignments, and file attachments. It supports two user types: Department (via access code) and Admin (via username/password), implementing role-based access control with a 30-day session expiration. A storage abstraction interface with a Drizzle ORM implementation ensures type-safe PostgreSQL operations. Zod is used for schema validation.

### Data Storage
PostgreSQL with connection pooling is the chosen database. Key tables include `Departments`, `Admins`, `Messages`, `Attachments`, `Sessions`, `Assignments`, and `Announcements`. Departments are organized into four hierarchical blocks: Upper, Middle, Lower, and District, totaling 49 departments. A safe migration system manages schema updates without data loss.

### File Storage
Files are stored directly within the PostgreSQL database using a `bytea` column, supporting up to 5 attachments per message/assignment/announcement, with a maximum of 100 MB per file. Client-side uploads use multipart/form-data, and secure downloads require backend authentication. This method ensures autonomous deployment, transaction integrity, simplified backup/restore, and mobile application compatibility.

### Feature Specifications
- **Assignments and Announcements:** Comprehensive system for managing tasks and platform-wide notifications with deadline tracking (three-color progress indicators), multi-executor assignment, topic selection, content/comments field, and completion status. Features file attachments, read tracking for announcements, and badge counters for uncompleted assignments and unread announcements. Permissions are controlled through an admin panel via database flags (`canCreateAssignment`, `canCreateAssignmentFromMessage`, `canMonitor`).
- **Broadcast Messaging:** Optimized endpoint for sending messages to multiple departments.
- **Department Icon Upload:** Interactive icon upload system with image cropping and zooming.
- **Recycle Bin (Корзина) System:** Soft-delete functionality for messages and assignments, with dedicated trash API endpoints, a TrashPage, and restore functionality.
- **Unified Department Ordering System:** Centralized `sortOrder`-based department ordering across the application, managed via an admin panel with drag-and-drop functionality.
- **People/Executors Management System:** System for managing people (executors/иҷрокунандагон) with department associations, including CRUD API endpoints and automatic filtering in message and assignment forms.
- **Flexible Permission System:** Database-driven permission system allowing dynamic control over `canCreateAssignment`, `canCreateAssignmentFromMessage`, and `canMonitor` capabilities for any department.
- **Department-Specific Assignments:** Assignments are department-targeted via a `recipientIds` field, ensuring departments only see relevant assignments while admins see all.
- **Document Number Field:** Optional `documentNumber` (Рақами ҳуҷҷат) field for Messages and Assignments.
- **Performance Optimization:** Achieved 85% data transfer reduction for slow networks through WebP image compression, gzip middleware, HTTP Cache-Control headers, and frontend code splitting.
- **Footer Information:** Footer displays "Раёсати рақамикунонӣ ва инноватсия" contact information with two phone numbers.

## External Dependencies

### Core Dependencies
- **Database:** `pg`, `drizzle-orm`, `drizzle-kit`, `connect-pg-simple`.
- **Authentication & Security:** `bcrypt`, `express-session`.
- **Backend Framework:** `express`, `tsx`.
- **Frontend Framework:** `react`, `@tanstack/react-query`, `wouter`.
- **UI Components:** `@radix-ui/*`, `tailwindcss`, `class-variance-authority`, `lucide-react`.
- **Form Handling:** `react-hook-form`, `@hookform/resolvers`, `zod`.
- **Drag and Drop:** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.
- **Image Processing:** `react-easy-crop`, `sharp`.
- **Utilities:** `date-fns`, `clsx`, `tailwind-merge`.

### Third-Party Services
- Any standard PostgreSQL server (version 13+).
- Google Fonts (Inter and Roboto).