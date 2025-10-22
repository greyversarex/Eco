import { pgTable, text, serial, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Departments table
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  block: text("block").notNull(), // 'upper', 'middle', 'lower'
  accessCode: text("access_code").notNull().unique(),
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
  senderId: integer("sender_id").notNull().references(() => departments.id),
  recipientId: integer("recipient_id").notNull().references(() => departments.id),
  executor: text("executor"),
  documentDate: timestamp("document_date").notNull(),
  attachmentUrl: text("attachment_url"),
  attachmentName: text("attachment_name"),
  replyToId: integer("reply_to_id").references((): any => messages.id),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  isRead: true,
}).extend({
  documentDate: z.coerce.date(),
});
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Note: Sessions table is managed by connect-pg-simple
// It will be created automatically with the correct schema
