# ЭкоТоҷикистон Platform

## Overview
ЭкоТоҷикистон is a secure, bilingual (Tajik and Russian) internal messaging and document management platform for governmental and organizational departments in Tajikistan. Its core purpose is to centralize official communication, prioritizing security, data persistence, and future mobile compatibility via an API-first architecture. The system offers department-level access with unique codes and an administrative panel for platform management, aiming to enhance communication efficiency and transparency within Tajikistan's environmental protection sector. It features a comprehensive assignment and announcement system with file attachment support, read tracking, and badge counters to improve inter-departmental coordination and oversight. The platform is optimized for performance on slow internet connections.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Fixes
- **Message Read Status Bug (November 2025):** Fixed critical bug where messages were not being marked as read when recipient opened them. Root causes: (1) Backend API endpoint lacked recipient verification - any user could mark any message as read; (2) Frontend only checked `recipientId` field, ignoring `recipientIds` array for broadcast messages. Solution: Added backend permission checks ensuring only actual recipients can mark messages as read (checking both `recipientId` and `recipientIds`), and updated frontend to properly detect recipients in both single and broadcast scenarios. Badge counter now correctly decrements when messages are read.
- **Assignment Checkbox Bug (November 2025):** Fixed executor selection checkboxes in assignment creation dialogs (both AssignmentsPage and MessageView). Checkboxes were hardcoded to `checked={false}`, causing visual state mismatch and duplicate selection counts. Now properly use `checked={selectedExecutorIds.includes(person.id)}` with proper add/remove logic.
- **Production Database Schema Sync:** Production database missing `recipient_ids` column in `announcements` table resolved by running `npm run db:push` command to synchronize schema without data loss.
- **"Даъват" Section in Assignment Creation (November 2025):** Added "Даъват" (Invited) section in assignment creation dialogs (both AssignmentsPage and MessageView). When executors are selected, they appear in a separate "Даъват" section above "Иҷрокунандагон", showing invited people with department names and ability to remove them. Section supports collapsible view for >5 people. "Иҷрокунандагон" section now only shows non-invited people to avoid confusion.

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
- **Assignments and Announcements:** Comprehensive system for managing tasks and platform-wide notifications with deadline tracking (three-color progress indicators using a three-phase algorithm where green depletes first, then yellow, then red), multi-executor assignment, topic selection, content/comments field, and completion status. Assignment creation forms (both main page and message compose) display department lists without icons for consistency. Features file attachments, read tracking for announcements, and badge counters for uncompleted assignments and unread announcements. Permissions are controlled through an admin panel via database flags (`canCreateAssignment`, `canCreateAssignmentFromMessage`, `canMonitor`).
- **Broadcast Messaging:** Optimized endpoint for sending messages to multiple departments.
- **Department Icon Upload:** Interactive icon upload system with image cropping and zooming.
- **ZIP Archive Export System:** Admin-only feature to export department message history (inbox/outbox) as structured ZIP archives. Each message is stored in a separate folder containing a formatted Word document (`паём.docx`) with message metadata (sender, recipient, date, subject, document number, content) and all original file attachments. Folder names follow the pattern `{001}_{YYYY-MM-DD}_{sanitized_subject}` with robust filename sanitization to prevent Zip Slip attacks and ensure cross-platform compatibility. Utilizes `jszip` and `docx` libraries for archive generation.
- **Recycle Bin (Корзина) System:** Soft-delete functionality for messages and assignments with department-scoped visibility. Each department sees only their own deleted items in trash. Admin panel includes department-specific trash view with permanent delete capability (admin-only). Permanent deletion triggers immediate cache refresh for both trash and main message lists.
- **Unified Department Ordering System:** Centralized `sortOrder`-based department ordering across the application, managed via an admin panel with drag-and-drop functionality.
- **People/Executors Management System:** System for managing people (executors/иҷрокунандагон) with department associations, including CRUD API endpoints and automatic filtering in message and assignment forms.
- **Flexible Permission System:** Database-driven permission system allowing dynamic control over `canCreateAssignment`, `canCreateAssignmentFromMessage`, and `canMonitor` capabilities for any department.
- **Department-Specific Assignments:** Assignments are department-targeted via a `recipientIds` field, ensuring departments only see relevant assignments while admins see all.
- **Targeted Announcements:** Announcements support multi-department targeting via `recipientIds` array field. Announcements with null/empty recipientIds are broadcast to all departments. Announcements with specific recipientIds are only visible to targeted departments. Admin announcement creation form includes department multi-select with visual feedback.
- **Document Number Field:** Optional `documentNumber` (Рақами ҳуҷҷат) field for Messages and Assignments.
- **Message List Headers:** All message list views (Inbox, Department Messages, Admin Department Messages) include consistent column headers with context-aware labels. Sent messages use "Қабулкунанда" (Recipient) while received messages use "Фиристанда" (Sender). All views use identical grid alignment (120px 1fr 180px 130px 80px) for visual consistency.
- **Broadcast Message Display:** Comprehensive handling of broadcast messages across all views with proper Tajik labels. Messages with recipientId=null display as "Ҳама шуъбаҳо" (All departments). Messages with senderId=null display as "Системавӣ" (System). Multi-recipient broadcasts (recipientIds array) show department badges with overflow tooltips. Consistent logic applied in DepartmentMessages, AdminDepartmentMessages (including trash dialog), and Inbox pages. Unknown departments fall back to "Номаълум" (Unknown).
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
- **Archive Generation:** `jszip`, `docx`.
- **Utilities:** `date-fns`, `clsx`, `tailwind-merge`.

### Third-Party Services
- Any standard PostgreSQL server (version 13+).
- Google Fonts (Inter and Roboto).