# ЭкоТоҷикистон Platform

## Overview
ЭкоТоҷикистон is a secure, bilingual (Tajik and Russian) internal messaging and document management platform for governmental and organizational departments in Tajikistan. Its core purpose is to centralize official communication, prioritizing security, data persistence, and future mobile compatibility via an API-first architecture. The system offers department-level access with unique codes and an administrative panel for platform management. The platform aims to enhance communication efficiency and transparency within Tajikistan's environmental protection sector. It features a comprehensive assignment and announcement system with file attachment support, read tracking, and badge counters to improve inter-departmental coordination and oversight. The platform has been optimized for performance on slow internet connections, significantly reducing load times and data transfer.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes (November 2025)
- **Terminology Update:** Replaced all instances of "Нест кардан" (Delete) with "Бекор кардан" (Cancel) throughout the application for better linguistic accuracy and user experience.
- **Document Number Field:** Added optional `documentNumber` (Рақами ҳуҷҷат) field to both Messages and Assignments schemas. This field is displayed in message composition and assignment creation forms, allowing users to track official document numbers. Backend routes updated to persist this data.
- **Message Composition UI Improvements:** Reorganized form layout with full-width subject field, date and document number fields positioned below in a 2-column grid. Recipient selection now sorted by departmental hierarchy (Upper→Middle→Lower→District) and displayed in a responsive 2-row grid layout.
- **Content Field Validation:** Removed required validation from the content/message body field in ComposeMessage, allowing users to send messages with subject and attachments only.
- **Enhanced Visual Feedback:** Message list items now feature stronger hover effects (shadow-lg, border highlight, background opacity, subtle scale transform) matching the department card aesthetic for consistency. Added rounded corners and spacing between message items.
- **Simplified Message View:** Removed field labels (sender, date, executor) from received message display. Content now flows in order: Subject header → Message content → Date value → Executor value, creating a cleaner reading experience.
- **Monitoring Page Removed:** Removed the public monitoring dashboard page and all associated routing/navigation as it is no longer needed.
- **Database Migration System:** Implemented safe production migration system using safe-migrate.ts. The system uses `npm run db:migrate` to safely apply schema changes without data loss, checking for existing columns before adding new ones.
- **Department List Finalized:** seed.ts contains official 49 departments confirmed by user (8 upper, 12 middle, 16 lower, 13 district). All department codes match production requirements. Safe migration system ready for deployment.
- **Executor Field Label Simplified:** Changed "Иҷрокунанда (ихтиёрӣ)" to "Иҷрокунанда" for cleaner UI and consistency across Tajik and Russian interfaces.
- **Message List Layout Redesign:** Completely redesigned message list item layout with document number first, followed by vertical separator, then subject with content preview below. Added column headers ("Рақами ҳуҷҷат", "Мавзӯъ ва мундариҷа", "Фиристанда", "Сана") above the message list for improved data scanning and organization.
- **Message View Button Reorganization:** Moved "Ҷавоб додан" (Reply) button to the end of message content. "Бекор кардан" (Delete) button now only visible to admin users; regular department users see only the Reply button for cleaner interface and reduced accidental deletions.

## System Architecture

### Frontend Architecture
The frontend uses React with TypeScript, Vite, Wouter for routing, TanStack Query for server state, and Tailwind CSS with shadcn/ui and Radix UI for components. It adheres to Material Design principles with a minimalistic aesthetic, green accents (HSL: 142 76% 36%), and supports light mode. Inter and Roboto fonts provide Cyrillic support and high contrast. The interface is bilingual (Tajik default). Authentication pages feature adaptive eco-themed backgrounds, while department pages maintain consistent green gradient headers. An API-first approach means the frontend renders data from backend responses. The component-based architecture uses shadcn/ui and session-based authentication protects routes. An admin panel allows comprehensive department management.

### Backend Architecture
The backend is built with Node.js, Express.js, and TypeScript, following a RESTful API design. It uses session-based authentication with express-session and a PostgreSQL store, and Bcrypt for password hashing. The API provides endpoints for authentication, department management, CRUD operations for messages (including inbox/outbox filtering, and broadcast messaging), announcements, assignments, and file attachments. It supports two user types: Department (via access code) and Admin (via username/password), implementing role-based access control with a 30-day session expiration. A storage abstraction interface (IStorage) with a Drizzle ORM implementation (DbStorage) ensures type-safe PostgreSQL operations. Zod is used for schema validation.

### Data Storage
PostgreSQL with connection pooling is the chosen database. Key tables include `Departments`, `Admins`, `Messages`, `Attachments`, `Sessions`, `Assignments`, and `Announcements`. Departments are organized into four hierarchical blocks: Upper (8), Middle (12), Lower (16), and District (13), totaling 49 departments. Safe migration system (safe-migrate.ts) manages schema updates without data loss, with the schema defined in `/shared/schema.ts`.

### File Storage
Files are stored directly within the PostgreSQL database using a `bytea` column, supporting up to 5 attachments per message/assignment/announcement, with a maximum of 100 MB per file. Client-side uploads use multipart/form-data, and secure downloads require backend authentication. This method ensures autonomous deployment, transaction integrity, simplified backup/restore, and mobile application compatibility.

### Feature Specifications
- **Assignments and Announcements:** Comprehensive system for managing tasks and platform-wide notifications with deadline tracking, three-color progress indicators (green-yellow-red zones with animated arrow marker), multi-executor assignment, topic selection, content/comments field, and completion status. Progress indicators use a segmented bar with fixed color zones (33.33% each) and a moving arrow that tracks elapsed time. Assignments include optional content field ("Мазмуни супоришҳои додашуда") for additional comments displayed in a highlighted box on assignment cards. Features file attachments, read tracking for announcements, and badge counters for uncompleted assignments and unread announcements. Only "Раёсати кадрҳо, коргузорӣ ва назорат" can create assignments/announcements. Two departments can delete: "Раёсати назорати давлатии истифода ва ҳифзи ҳавои атмосфера" and "Раёсати кадрҳо, коргузорӣ ва назорат".
- **Broadcast Messaging:** Optimized endpoint for sending messages to multiple departments, reducing HTTP requests and improving performance significantly. Supports files attached during composition.
- **Performance Optimization:** Achieved 85% data transfer reduction for slow networks through WebP image compression, gzip middleware, HTTP Cache-Control headers, and frontend code splitting (React.lazy).
- **Footer Information:** Footer displays "Раёсати рақамикунонӣ ва инноватсия" contact information with two phone numbers: (+992) (37) 223 35 05 and (+992) (37) 223 35 10.

## External Dependencies

### Core Dependencies
- **Database:** `pg`, `drizzle-orm`, `drizzle-kit`, `connect-pg-simple`.
- **Authentication & Security:** `bcrypt`, `express-session`.
- **Backend Framework:** `express`, `tsx`.
- **Frontend Framework:** `react`, `@tanstack/react-query`, `wouter`.
- **UI Components:** `@radix-ui/*`, `tailwindcss`, `class-variance-authority`, `lucide-react`.
- **Form Handling:** `react-hook-form`, `@hookform/resolvers`, `zod`.
- **Utilities:** `date-fns`, `clsx`, `tailwind-merge`.

### Third-Party Services
- Any standard PostgreSQL server (version 13+).
- Google Fonts (Inter and Roboto).

### Environment Variables
- `DATABASE_URL`
- `SESSION_SECRET`
- `NODE_ENV`

The system is designed to be fully autonomous, requiring no external service credentials beyond the database connection.