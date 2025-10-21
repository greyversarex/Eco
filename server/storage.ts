import type { Department, InsertDepartment, Admin, InsertAdmin, Message, InsertMessage } from "@shared/schema";

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
  updateMessageAttachment(id: number, attachmentUrl: string, attachmentName: string): Promise<Message | undefined>;
  getUnreadCountByDepartment(departmentId: number): Promise<number>;
  getUnreadCountsForAllDepartments(currentDeptId: number): Promise<Record<number, number>>;
}

// Database storage implementation
import { db } from './db';
import { departments, admins, messages } from '@shared/schema';
import { eq, or, and } from 'drizzle-orm';

export class DbStorage implements IStorage {
  // Departments
  async getDepartments(): Promise<Department[]> {
    return await db.select().from(departments);
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
    return await db.select().from(messages);
  }

  async getMessageById(id: number): Promise<Message | undefined> {
    const result = await db.select().from(messages).where(eq(messages.id, id));
    return result[0];
  }

  async getMessagesByDepartment(departmentId: number): Promise<{ inbox: Message[]; outbox: Message[] }> {
    const inbox = await db.select().from(messages).where(eq(messages.recipientId, departmentId));
    const outbox = await db.select().from(messages).where(eq(messages.senderId, departmentId));
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

  async updateMessageAttachment(id: number, attachmentUrl: string, attachmentName: string): Promise<Message | undefined> {
    const result = await db.update(messages)
      .set({ attachmentUrl, attachmentName })
      .where(eq(messages.id, id))
      .returning();
    return result[0];
  }

  async getUnreadCountByDepartment(departmentId: number): Promise<number> {
    const result = await db.select().from(messages)
      .where(and(eq(messages.recipientId, departmentId), eq(messages.isRead, false)));
    return result.length;
  }

  async getMessagesByDepartmentPair(currentDeptId: number, otherDeptId: number): Promise<{ received: Message[]; sent: Message[] }> {
    const received = await db.select().from(messages)
      .where(and(eq(messages.recipientId, currentDeptId), eq(messages.senderId, otherDeptId)));
    const sent = await db.select().from(messages)
      .where(and(eq(messages.senderId, currentDeptId), eq(messages.recipientId, otherDeptId)));
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
}

export const storage = new DbStorage();
