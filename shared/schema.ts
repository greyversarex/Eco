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

// Departments table
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  block: text("block").notNull(), // 'upper', 'middle', 'lower', 'district'
  accessCode: text("access_code").notNull().unique(),
  canMonitor: boolean("can_monitor").default(false).notNull(), // Право на мониторинг (Назорат)
  canCreateAssignmentFromMessage: boolean("can_create_assignment_from_message").default(false).notNull(), // Право создавать вазифа из сообщений
  canCreateAssignment: boolean("can_create_assignment").default(false).notNull(), // Право создавать супориши
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
});
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Department = typeof departments.$inferSelect;

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
  senderId: integer("sender_id").notNull().references(() => departments.id),
  recipientId: integer("recipient_id").notNull().references(() => departments.id),
  executor: text("executor"),
  documentDate: timestamp("document_date").notNull(),
  replyToId: integer("reply_to_id").references((): any => messages.id),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  senderIdx: index("messages_sender_id_idx").on(table.senderId),
  recipientIdx: index("messages_recipient_id_idx").on(table.recipientId),
}));

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  isRead: true,
}).extend({
  documentDate: z.coerce.date(),
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
  topic: text("topic").notNull(), // Мавзӯъ: "Нақшаи корӣ", "Протоколи назоратӣ", etc.
  content: text("content"), // Мазмуни супоришҳои додашуда (комментарии)
  documentNumber: text("document_number"),
  executors: text("executors").array().notNull(), // Исполнители (массив имён)
  recipientIds: integer("recipient_ids").array().notNull().default(sql`ARRAY[]::integer[]`), // ID департаментов-получателей
  deadline: timestamp("deadline").notNull(), // Мӯҳлати иҷро
  isCompleted: boolean("is_completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAssignmentSchema = createInsertSchema(assignments).omit({
  id: true,
  createdAt: true,
  isCompleted: true,
  completedAt: true,
}).extend({
  deadline: z.coerce.date(),
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
  readBy: integer("read_by").array().notNull().default(sql`ARRAY[]::integer[]`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  readBy: true,
  createdAt: true,
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

// Note: Sessions table is managed by connect-pg-simple
// It will be created automatically with the correct schema
