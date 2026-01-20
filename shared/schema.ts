import { pgTable, text, serial, timestamp, boolean, integer, customType, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Custom bytea type for storing binary data (files) in PostgreSQL
const bytea = customType<{ data: Buffer; notNull: false; default: false }>({
  dataType() {
    return 'bytea';
  },
  toDriver(value: Buffer): Buffer {
    return value;
  },
  fromDriver(value: unknown): Buffer {
    return value as Buffer;
  },
});

// Document Types table (Намуди ҳуҷҷат) - types of documents managed by admin
export const documentTypes = pgTable("document_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDocumentTypeSchema = createInsertSchema(documentTypes).omit({
  id: true,
  createdAt: true,
});
export type InsertDocumentType = z.infer<typeof insertDocumentTypeSchema>;
export type DocumentType = typeof documentTypes.$inferSelect;

// Department icons table - stores department icon images
export const departmentIcons = pgTable("department_icons", {
  id: serial("id").primaryKey(),
  departmentId: integer("department_id").notNull().unique().references(() => departments.id, { onDelete: 'cascade' }),
  fileName: text("file_name").notNull(),
  fileData: bytea("file_data").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  deptIdx: index("department_icons_department_id_idx").on(table.departmentId),
}));

export const insertDepartmentIconSchema = z.object({
  departmentId: z.number(),
  fileName: z.string(),
  fileData: z.instanceof(Buffer),
  fileSize: z.number(),
  mimeType: z.string(),
});
export type InsertDepartmentIcon = z.infer<typeof insertDepartmentIconSchema>;
export type DepartmentIcon = typeof departmentIcons.$inferSelect;

// Departments table (supports both departments and subdepartments via parentDepartmentId)
export const departments: any = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  block: text("block").notNull(), // 'upper', 'middle', 'lower', 'district'
  accessCode: text("access_code").notNull().unique(),
  sortOrder: integer("sort_order").default(0).notNull(), // Custom sort order for drag-and-drop
  canMonitor: boolean("can_monitor").default(false).notNull(), // Право на мониторинг (Назорат)
  canCreateAssignmentFromMessage: boolean("can_create_assignment_from_message").default(false).notNull(), // Право создавать вазифа из сообщений
  canCreateAssignment: boolean("can_create_assignment").default(false).notNull(), // Право создавать супориши
  canCreateAnnouncement: boolean("can_create_announcement").default(false).notNull(), // Право создавать эълонҳо
  canApprove: boolean("can_approve").default(false).notNull(), // Право давать иҷозат/рад на сообщения
  icon: text("icon").default('building-2').notNull(), // Legacy field for backward compatibility, new icons use department_icons table
  parentDepartmentId: integer("parent_department_id").references((): any => departments.id, { onDelete: 'cascade' }), // Поддепартаменты - ссылка на родительский департамент
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  parentIdx: index("departments_parent_id_idx").on(table.parentDepartmentId),
}));

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
}).extend({
  icon: z.string().optional(), // Optional - database default handles it
  parentDepartmentId: z.number().int().positive().nullable().optional(), // Nullable - null for top-level departments
});
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Department = typeof departments.$inferSelect & {
  parentDepartmentId?: number | null;
};

// Admin users table
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(), // hashed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Sessions table (managed by express-session with connect-pg-simple)
export const sessions = pgTable("sessions", {
  sid: text("sid").primaryKey(),
  sess: text("sess").notNull(), // JSON session data
  expire: timestamp("expire").notNull(),
});

export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
  createdAt: true,
});
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type Admin = typeof admins.$inferSelect;

// Messages table
export const messages: any = pgTable("messages", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  documentNumber: text("document_number"),
  documentTypeId: integer("document_type_id").references(() => documentTypes.id, { onDelete: 'set null' }), // Намуди ҳуҷҷат - optional
  senderId: integer("sender_id").notNull().references(() => departments.id, { onDelete: 'cascade' }),
  recipientId: integer("recipient_id").references(() => departments.id, { onDelete: 'cascade' }), // Legacy field, kept for backward compatibility
  recipientIds: integer("recipient_ids").array().default(sql`ARRAY[]::integer[]`).notNull(), // New field for broadcast messages
  executor: text("executor"),
  documentDate: timestamp("document_date").notNull(),
  replyToId: integer("reply_to_id").references((): any => messages.id, { onDelete: 'cascade' }),
  originalSenderId: integer("original_sender_id").references(() => departments.id, { onDelete: 'cascade' }), // Original sender if forwarded
  forwardedById: integer("forwarded_by_id").references(() => departments.id, { onDelete: 'cascade' }), // Who forwarded the message
  approvalStatus: text("approval_status"), // 'approved' | 'rejected' | null (pending)
  approvedById: integer("approved_by_id").references(() => departments.id, { onDelete: 'set null' }), // Department that approved/rejected
  approvedAt: timestamp("approved_at"), // When approval decision was made
  isRead: boolean("is_read").default(false).notNull(),
  isDeleted: boolean("is_deleted").default(false).notNull(),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  senderIdx: index("messages_sender_id_idx").on(table.senderId),
  recipientIdx: index("messages_recipient_id_idx").on(table.recipientId),
  // GIN index for array membership queries (WHERE x = ANY(recipient_ids))
  recipientIdsIdx: index("messages_recipient_ids_idx").using("gin", table.recipientIds),
  deletedIdx: index("messages_is_deleted_idx").on(table.isDeleted),
  approvalIdx: index("messages_approval_status_idx").on(table.approvalStatus),
}));

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  isRead: true,
  isDeleted: true,
  deletedAt: true,
  originalSenderId: true, // Populated by forwarding logic
  forwardedById: true, // Populated by forwarding logic
  recipientIds: true, // Optional during migration, will be populated from recipientId or explicit array
  approvalStatus: true, // Populated by approval logic
  approvedById: true, // Populated by approval logic
  approvedAt: true, // Populated by approval logic
}).extend({
  documentDate: z.coerce.date(),
  recipientIds: z.array(z.number()).min(1).optional(), // Optional during migration
  documentTypeId: z.number().int().positive().nullable().optional(), // Optional type of document
});
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Attachments table - stores files in database
export const attachments = pgTable("attachments", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull().references(() => messages.id, { onDelete: 'cascade' }),
  file_name: text("file_name").notNull(),
  fileData: bytea("file_data").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  messageIdx: index("attachments_message_id_idx").on(table.messageId),
}));

export const insertAttachmentSchema = z.object({
  messageId: z.number(),
  file_name: z.string(),
  fileData: z.instanceof(Buffer),
  fileSize: z.number(),
  mimeType: z.string(),
});
export type InsertAttachment = z.infer<typeof insertAttachmentSchema>;
export type Attachment = typeof attachments.$inferSelect;

// Assignments table (Поручения / Супоришҳо)
export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => departments.id, { onDelete: 'cascade' }), // Создатель супориша (nullable для миграции)
  topic: text("topic"), // Мавзӯъ (deprecated, use documentTypeId)
  documentTypeId: integer("document_type_id").references(() => documentTypes.id, { onDelete: 'set null' }), // Намуди ҳуҷҷат
  content: text("content"), // Мазмуни супоришҳои додашуда (комментарии)
  documentNumber: text("document_number"),
  executors: text("executors").array().notNull(), // ПРИГЛАШЕННЫЕ исполнители (массив имён) - Даъват
  executorIds: integer("executor_ids").array().notNull().default(sql`ARRAY[]::integer[]`), // ID ПРИГЛАШЕННЫХ исполнителей - Даъват
  allDepartmentExecutors: text("all_department_executors").array().notNull().default(sql`ARRAY[]::text[]`), // ВСЕ люди из департаментов (массив имён) - Иҷрокунандагон
  allDepartmentExecutorIds: integer("all_department_executor_ids").array().notNull().default(sql`ARRAY[]::integer[]`), // ID ВСЕХ людей из департаментов - Иҷрокунандагон
  recipientIds: integer("recipient_ids").array().notNull().default(sql`ARRAY[]::integer[]`), // ID департаментов-получателей
  deadline: timestamp("deadline").notNull(), // Мӯҳлати иҷро
  isCompleted: boolean("is_completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
  isDeleted: boolean("is_deleted").default(false).notNull(),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  deletedIdx: index("assignments_is_deleted_idx").on(table.isDeleted),
  senderIdx: index("assignments_sender_id_idx").on(table.senderId),
}));

export const insertAssignmentSchema = createInsertSchema(assignments).omit({
  id: true,
  createdAt: true,
  isCompleted: true,
  completedAt: true,
  isDeleted: true,
  deletedAt: true,
}).extend({
  senderId: z.number().int().positive(), // Required для новых assignments
  deadline: z.coerce.date(),
  documentTypeId: z.number().int().positive().nullable().optional(), // Намуди ҳуҷҷат
});
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Assignment = typeof assignments.$inferSelect & {
  attachments?: Array<{
    id: number;
    file_name: string;
    fileSize: number;
    mimeType: string;
    createdAt: Date;
  }>;
};

// Assignment attachments
export const assignmentAttachments = pgTable("assignment_attachments", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull().references(() => assignments.id, { onDelete: 'cascade' }),
  file_name: text("file_name").notNull(),
  fileData: bytea("file_data").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  assignmentIdx: index("assignment_attachments_assignment_id_idx").on(table.assignmentId),
}));

export const insertAssignmentAttachmentSchema = z.object({
  assignmentId: z.number(),
  file_name: z.string(),
  fileData: z.instanceof(Buffer),
  fileSize: z.number(),
  mimeType: z.string(),
});
export type InsertAssignmentAttachment = z.infer<typeof insertAssignmentAttachmentSchema>;
export type AssignmentAttachment = typeof assignmentAttachments.$inferSelect;

// Announcements table (Объявления / Эълонҳо)
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  recipientIds: integer("recipient_ids").array(),
  readBy: integer("read_by").array().notNull().default(sql`ARRAY[]::integer[]`),
  isDeleted: boolean("is_deleted").notNull().default(false),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  readBy: true,
  isDeleted: true,
  deletedAt: true,
  createdAt: true,
}).extend({
  recipientIds: z.array(z.number()).optional(),
});
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type Announcement = typeof announcements.$inferSelect & {
  attachments?: Array<{
    id: number;
    file_name: string;
    fileSize: number;
    mimeType: string;
    createdAt: Date;
  }>;
};

// Announcement attachments
export const announcementAttachments = pgTable("announcement_attachments", {
  id: serial("id").primaryKey(),
  announcementId: integer("announcement_id").notNull().references(() => announcements.id, { onDelete: 'cascade' }),
  file_name: text("file_name").notNull(),
  fileData: bytea("file_data").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  announcementIdx: index("announcement_attachments_announcement_id_idx").on(table.announcementId),
}));

export const insertAnnouncementAttachmentSchema = z.object({
  announcementId: z.number(),
  file_name: z.string(),
  fileData: z.instanceof(Buffer),
  fileSize: z.number(),
  mimeType: z.string(),
});
export type InsertAnnouncementAttachment = z.infer<typeof insertAnnouncementAttachmentSchema>;
export type AnnouncementAttachment = typeof announcementAttachments.$inferSelect;

// People table (Иҷрокунандагон / Исполнители)
export const people = pgTable("people", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  departmentId: integer("department_id").references(() => departments.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  departmentIdx: index("people_department_id_idx").on(table.departmentId),
}));

export const insertPersonSchema = createInsertSchema(people).omit({
  id: true,
  createdAt: true,
});
export type InsertPerson = z.infer<typeof insertPersonSchema>;
export type Person = typeof people.$inferSelect;

// Push Subscriptions table - stores web push notification subscriptions
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // Department ID or Admin ID
  userType: text("user_type").notNull(), // 'department' or 'admin'
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("push_subscriptions_user_idx").on(table.userId, table.userType),
  endpointIdx: index("push_subscriptions_endpoint_idx").on(table.endpoint),
}));

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({
  id: true,
  createdAt: true,
});
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;

// Note: Sessions table is managed by connect-pg-simple
// It will be created automatically with the correct schema
