import type { 
  Department, InsertDepartment, 
  Admin, InsertAdmin, 
  Message, InsertMessage, 
  Attachment, InsertAttachment,
  Assignment, InsertAssignment,
  AssignmentAttachment, InsertAssignmentAttachment,
  Announcement, InsertAnnouncement,
  AnnouncementAttachment, InsertAnnouncementAttachment
} from "@shared/schema";

export interface IStorage {
  // Departments
  getDepartments(): Promise<Department[]>;
  getDepartmentById(id: number): Promise<Department | undefined>;
  getDepartmentByAccessCode(accessCode: string): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, department: Partial<InsertDepartment>): Promise<Department | undefined>;
  deleteDepartment(id: number): Promise<boolean>;
  
  // Admins
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  
  // Messages
  getMessages(): Promise<Message[]>;
  getMessageById(id: number): Promise<Message | undefined>;
  getMessagesByDepartment(departmentId: number): Promise<{ inbox: Message[]; outbox: Message[] }>;
  getMessagesByDepartmentPair(currentDeptId: number, otherDeptId: number): Promise<{ received: Message[]; sent: Message[] }>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message | undefined>;
  deleteMessage(id: number): Promise<boolean>;
  getUnreadCountByDepartment(departmentId: number): Promise<number>;
  getUnreadCountsForAllDepartments(currentDeptId: number): Promise<Record<number, number>>;
  getAllDepartmentsUnreadCounts(): Promise<Record<number, number>>;
  
  // Attachments
  createAttachment(attachment: InsertAttachment): Promise<Attachment>;
  getAttachmentsByMessageId(messageId: number): Promise<Attachment[]>;
  getAttachmentById(id: number): Promise<Attachment | undefined>;
  deleteAttachmentsByMessageId(messageId: number): Promise<boolean>;
  
  // Assignments
  getAssignments(): Promise<Assignment[]>;
  getAssignmentById(id: number): Promise<Assignment | undefined>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  updateAssignment(id: number, assignment: Partial<InsertAssignment>): Promise<Assignment | undefined>;
  deleteAssignment(id: number): Promise<boolean>;
  markAssignmentAsCompleted(id: number): Promise<Assignment | undefined>;
  
  // Assignment Attachments
  createAssignmentAttachment(attachment: InsertAssignmentAttachment): Promise<AssignmentAttachment>;
  getAssignmentAttachments(assignmentId: number): Promise<AssignmentAttachment[]>;
  getAssignmentAttachmentById(id: number): Promise<AssignmentAttachment | undefined>;
  
  // Announcements
  getAnnouncements(): Promise<Announcement[]>;
  getAnnouncementById(id: number): Promise<Announcement | undefined>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: number, announcement: Partial<InsertAnnouncement>): Promise<Announcement | undefined>;
  deleteAnnouncement(id: number): Promise<boolean>;
  
  // Announcement Attachments
  createAnnouncementAttachment(attachment: InsertAnnouncementAttachment): Promise<AnnouncementAttachment>;
  getAnnouncementAttachments(announcementId: number): Promise<AnnouncementAttachment[]>;
  getAnnouncementAttachmentById(id: number): Promise<AnnouncementAttachment | undefined>;
}

// Database storage implementation
import { db } from './db';
import { departments, admins, messages, attachments, assignments, assignmentAttachments, announcements, announcementAttachments } from '@shared/schema';
import { eq, or, and, desc, asc } from 'drizzle-orm';

export class DbStorage implements IStorage {
  // Departments
  async getDepartments(): Promise<Department[]> {
    return await db.select().from(departments).orderBy(asc(departments.id));
  }

  async getDepartmentById(id: number): Promise<Department | undefined> {
    const result = await db.select().from(departments).where(eq(departments.id, id));
    return result[0];
  }

  async getDepartmentByAccessCode(accessCode: string): Promise<Department | undefined> {
    const result = await db.select().from(departments).where(eq(departments.accessCode, accessCode));
    return result[0];
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const result = await db.insert(departments).values(department).returning();
    return result[0];
  }

  async updateDepartment(id: number, department: Partial<InsertDepartment>): Promise<Department | undefined> {
    const result = await db.update(departments).set(department).where(eq(departments.id, id)).returning();
    return result[0];
  }

  async deleteDepartment(id: number): Promise<boolean> {
    const result = await db.delete(departments).where(eq(departments.id, id)).returning();
    return result.length > 0;
  }

  // Admins
  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    const result = await db.select().from(admins).where(eq(admins.username, username));
    return result[0];
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const result = await db.insert(admins).values(admin).returning();
    return result[0];
  }

  // Messages
  async getMessages(): Promise<Message[]> {
    return await db.select().from(messages).orderBy(desc(messages.createdAt));
  }

  async getMessageById(id: number): Promise<Message | undefined> {
    const result = await db.select().from(messages).where(eq(messages.id, id));
    return result[0];
  }

  async getMessagesByDepartment(departmentId: number): Promise<{ inbox: Message[]; outbox: Message[] }> {
    const inbox = await db.select().from(messages).where(eq(messages.recipientId, departmentId)).orderBy(desc(messages.createdAt));
    const outbox = await db.select().from(messages).where(eq(messages.senderId, departmentId)).orderBy(desc(messages.createdAt));
    return { inbox, outbox };
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values(message).returning();
    return result[0] as Message;
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const result = await db.update(messages).set({ isRead: true }).where(eq(messages.id, id)).returning();
    return result[0];
  }

  async deleteMessage(id: number): Promise<boolean> {
    // First delete all attachments for this message
    await this.deleteAttachmentsByMessageId(id);
    // Then delete the message itself
    const result = await db.delete(messages).where(eq(messages.id, id)).returning();
    return result.length > 0;
  }

  async getUnreadCountByDepartment(departmentId: number): Promise<number> {
    const result = await db.select().from(messages)
      .where(and(eq(messages.recipientId, departmentId), eq(messages.isRead, false)));
    return result.length;
  }

  async getMessagesByDepartmentPair(currentDeptId: number, otherDeptId: number): Promise<{ received: Message[]; sent: Message[] }> {
    const received = await db.select().from(messages)
      .where(and(eq(messages.recipientId, currentDeptId), eq(messages.senderId, otherDeptId)))
      .orderBy(desc(messages.createdAt));
    const sent = await db.select().from(messages)
      .where(and(eq(messages.senderId, currentDeptId), eq(messages.recipientId, otherDeptId)))
      .orderBy(desc(messages.createdAt));
    return { received, sent };
  }

  async getUnreadCountsForAllDepartments(currentDeptId: number): Promise<Record<number, number>> {
    const allMessages = await db.select().from(messages)
      .where(and(eq(messages.recipientId, currentDeptId), eq(messages.isRead, false)));
    
    const counts: Record<number, number> = {};
    for (const msg of allMessages) {
      counts[msg.senderId] = (counts[msg.senderId] || 0) + 1;
    }
    return counts;
  }

  async getAllDepartmentsUnreadCounts(): Promise<Record<number, number>> {
    const allMessages = await db.select().from(messages)
      .where(eq(messages.isRead, false));
    
    const counts: Record<number, number> = {};
    for (const msg of allMessages) {
      counts[msg.recipientId] = (counts[msg.recipientId] || 0) + 1;
    }
    return counts;
  }

  // Attachments
  async createAttachment(attachment: InsertAttachment): Promise<Attachment> {
    const result = await db.insert(attachments).values(attachment).returning();
    return result[0];
  }

  async getAttachmentsByMessageId(messageId: number): Promise<Attachment[]> {
    return await db.select().from(attachments).where(eq(attachments.messageId, messageId));
  }

  async getAttachmentById(id: number): Promise<Attachment | undefined> {
    const result = await db.select().from(attachments).where(eq(attachments.id, id));
    return result[0];
  }

  async deleteAttachmentsByMessageId(messageId: number): Promise<boolean> {
    const result = await db.delete(attachments).where(eq(attachments.messageId, messageId)).returning();
    return result.length > 0;
  }

  // Assignments
  async getAssignments(): Promise<Assignment[]> {
    return await db.select().from(assignments).orderBy(desc(assignments.createdAt));
  }

  async getAssignmentById(id: number): Promise<Assignment | undefined> {
    const result = await db.select().from(assignments).where(eq(assignments.id, id));
    return result[0];
  }

  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const result = await db.insert(assignments).values(assignment).returning();
    return result[0];
  }

  async updateAssignment(id: number, assignment: Partial<InsertAssignment>): Promise<Assignment | undefined> {
    const result = await db.update(assignments).set(assignment).where(eq(assignments.id, id)).returning();
    return result[0];
  }

  async deleteAssignment(id: number): Promise<boolean> {
    const result = await db.delete(assignments).where(eq(assignments.id, id)).returning();
    return result.length > 0;
  }

  async markAssignmentAsCompleted(id: number): Promise<Assignment | undefined> {
    const result = await db.update(assignments)
      .set({ isCompleted: true, completedAt: new Date() })
      .where(eq(assignments.id, id))
      .returning();
    return result[0];
  }

  // Assignment Attachments
  async createAssignmentAttachment(attachment: InsertAssignmentAttachment): Promise<AssignmentAttachment> {
    const result = await db.insert(assignmentAttachments).values(attachment).returning();
    return result[0];
  }

  async getAssignmentAttachments(assignmentId: number): Promise<AssignmentAttachment[]> {
    return await db.select().from(assignmentAttachments).where(eq(assignmentAttachments.assignmentId, assignmentId));
  }

  async getAssignmentAttachmentById(id: number): Promise<AssignmentAttachment | undefined> {
    const result = await db.select().from(assignmentAttachments).where(eq(assignmentAttachments.id, id));
    return result[0];
  }

  // Announcements
  async getAnnouncements(): Promise<Announcement[]> {
    return await db.select().from(announcements).orderBy(desc(announcements.createdAt));
  }

  async getAnnouncementById(id: number): Promise<Announcement | undefined> {
    const result = await db.select().from(announcements).where(eq(announcements.id, id));
    return result[0];
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const result = await db.insert(announcements).values(announcement).returning();
    return result[0];
  }

  async updateAnnouncement(id: number, announcement: Partial<InsertAnnouncement>): Promise<Announcement | undefined> {
    const result = await db.update(announcements).set(announcement).where(eq(announcements.id, id)).returning();
    return result[0];
  }

  async deleteAnnouncement(id: number): Promise<boolean> {
    const result = await db.delete(announcements).where(eq(announcements.id, id)).returning();
    return result.length > 0;
  }

  // Announcement Attachments
  async createAnnouncementAttachment(attachment: InsertAnnouncementAttachment): Promise<AnnouncementAttachment> {
    const result = await db.insert(announcementAttachments).values(attachment).returning();
    return result[0];
  }

  async getAnnouncementAttachments(announcementId: number): Promise<AnnouncementAttachment[]> {
    return await db.select().from(announcementAttachments).where(eq(announcementAttachments.announcementId, announcementId));
  }

  async getAnnouncementAttachmentById(id: number): Promise<AnnouncementAttachment | undefined> {
    const result = await db.select().from(announcementAttachments).where(eq(announcementAttachments.id, id));
    return result[0];
  }
}

export const storage = new DbStorage();
