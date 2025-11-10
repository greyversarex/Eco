import type { 
  Department, InsertDepartment, 
  Admin, InsertAdmin, 
  Message, InsertMessage, 
  Attachment, InsertAttachment,
  Assignment, InsertAssignment,
  AssignmentAttachment, InsertAssignmentAttachment,
  Announcement, InsertAnnouncement,
  AnnouncementAttachment, InsertAnnouncementAttachment,
  Person, InsertPerson
} from "@shared/schema";

export interface IStorage {
  // Departments
  getDepartments(): Promise<Department[]>;
  getDepartmentById(id: number): Promise<Department | undefined>;
  getDepartmentByAccessCode(accessCode: string): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, department: Partial<InsertDepartment>): Promise<Department | undefined>;
  deleteDepartment(id: number): Promise<boolean>;
  reorderDepartments(updates: Array<{ id: number; sortOrder: number }>): Promise<void>;
  
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
  listDeletedMessages(departmentId?: number): Promise<Message[]>;
  restoreMessage(id: number): Promise<boolean>;
  
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
  listDeletedAssignments(): Promise<Assignment[]>;
  restoreAssignment(id: number): Promise<boolean>;
  
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
  markAnnouncementAsRead(id: number, departmentId: number): Promise<Announcement | undefined>;
  getUnreadAnnouncementsCount(departmentId: number): Promise<number>;
  
  // Announcement Attachments
  createAnnouncementAttachment(attachment: InsertAnnouncementAttachment): Promise<AnnouncementAttachment>;
  getAnnouncementAttachments(announcementId: number): Promise<AnnouncementAttachment[]>;
  getAnnouncementAttachmentById(id: number): Promise<AnnouncementAttachment | undefined>;
  
  // Assignment counts
  getUncompletedAssignmentsCount(): Promise<number>;
  
  // People
  getPeople(): Promise<Person[]>;
  getPersonById(id: number): Promise<Person | undefined>;
  getPeopleByDepartmentId(departmentId: number): Promise<Person[]>;
  createPerson(person: InsertPerson): Promise<Person>;
  updatePerson(id: number, person: Partial<InsertPerson>): Promise<Person | undefined>;
  deletePerson(id: number): Promise<boolean>;
}

// Database storage implementation
import { db } from './db';
import { departments, admins, messages, attachments, assignments, assignmentAttachments, announcements, announcementAttachments, people } from '@shared/schema';
import { eq, or, and, desc, asc } from 'drizzle-orm';

export class DbStorage implements IStorage {
  // Departments
  async getDepartments(): Promise<Department[]> {
    return await db.select().from(departments).orderBy(asc(departments.sortOrder), asc(departments.id));
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

  async reorderDepartments(updates: Array<{ id: number; sortOrder: number }>): Promise<void> {
    // Batch update sortOrder for all departments
    for (const update of updates) {
      await db.update(departments)
        .set({ sortOrder: update.sortOrder })
        .where(eq(departments.id, update.id));
    }
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
    return await db.select().from(messages).where(eq(messages.isDeleted, false)).orderBy(desc(messages.createdAt));
  }

  async getMessageById(id: number): Promise<Message | undefined> {
    const result = await db.select().from(messages).where(and(eq(messages.id, id), eq(messages.isDeleted, false)));
    return result[0];
  }

  async getMessagesByDepartment(departmentId: number): Promise<{ inbox: Message[]; outbox: Message[] }> {
    const inbox = await db.select().from(messages).where(and(eq(messages.recipientId, departmentId), eq(messages.isDeleted, false))).orderBy(desc(messages.createdAt));
    const outbox = await db.select().from(messages).where(and(eq(messages.senderId, departmentId), eq(messages.isDeleted, false))).orderBy(desc(messages.createdAt));
    return { inbox, outbox };
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values(message).returning();
    return result[0] as Message;
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const result = await db.update(messages)
      .set({ isRead: true })
      .where(and(eq(messages.id, id), eq(messages.isDeleted, false)))
      .returning();
    return result[0];
  }

  async deleteMessage(id: number): Promise<boolean> {
    // Soft delete: mark as deleted
    const result = await db.update(messages)
      .set({ isDeleted: true, deletedAt: new Date() })
      .where(eq(messages.id, id))
      .returning();
    return result.length > 0;
  }

  async getUnreadCountByDepartment(departmentId: number): Promise<number> {
    const result = await db.select().from(messages)
      .where(and(
        eq(messages.recipientId, departmentId),
        eq(messages.isRead, false),
        eq(messages.isDeleted, false)
      ));
    return result.length;
  }

  async getMessagesByDepartmentPair(currentDeptId: number, otherDeptId: number): Promise<{ received: Message[]; sent: Message[] }> {
    const received = await db.select().from(messages)
      .where(and(
        eq(messages.recipientId, currentDeptId),
        eq(messages.senderId, otherDeptId),
        eq(messages.isDeleted, false)
      ))
      .orderBy(desc(messages.createdAt));
    const sent = await db.select().from(messages)
      .where(and(
        eq(messages.senderId, currentDeptId),
        eq(messages.recipientId, otherDeptId),
        eq(messages.isDeleted, false)
      ))
      .orderBy(desc(messages.createdAt));
    return { received, sent };
  }

  async getUnreadCountsForAllDepartments(currentDeptId: number): Promise<Record<number, number>> {
    const allMessages = await db.select().from(messages)
      .where(and(
        eq(messages.recipientId, currentDeptId),
        eq(messages.isRead, false),
        eq(messages.isDeleted, false)
      ));
    
    const counts: Record<number, number> = {};
    for (const msg of allMessages) {
      counts[msg.senderId] = (counts[msg.senderId] || 0) + 1;
    }
    return counts;
  }

  async getAllDepartmentsUnreadCounts(): Promise<Record<number, number>> {
    const allMessages = await db.select().from(messages)
      .where(and(eq(messages.isRead, false), eq(messages.isDeleted, false)));
    
    const counts: Record<number, number> = {};
    for (const msg of allMessages) {
      counts[msg.recipientId] = (counts[msg.recipientId] || 0) + 1;
    }
    return counts;
  }

  async listDeletedMessages(departmentId?: number): Promise<Message[]> {
    const where = departmentId
      ? and(
          eq(messages.isDeleted, true),
          or(eq(messages.senderId, departmentId), eq(messages.recipientId, departmentId))
        )
      : eq(messages.isDeleted, true);
    return await db.select().from(messages)
      .where(where)
      .orderBy(desc(messages.deletedAt));
  }

  async restoreMessage(id: number): Promise<boolean> {
    const result = await db.update(messages)
      .set({ isDeleted: false, deletedAt: null })
      .where(eq(messages.id, id))
      .returning();
    return result.length > 0;
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
    const allAssignments = await db.select().from(assignments)
      .where(eq(assignments.isDeleted, false))
      .orderBy(desc(assignments.createdAt));
    
    // Helper to decode filename
    const decodeFilename = (filename: string): string => {
      try {
        if (filename.includes('%')) {
          return decodeURIComponent(filename);
        }
        const hasMojibake = /[Ð-Ñ]/.test(filename);
        if (!hasMojibake) {
          return filename;
        }
        const buffer = Buffer.from(filename, 'latin1');
        const decoded = buffer.toString('utf8');
        const stillHasMojibake = /Ð|Ñ/.test(decoded);
        if (!stillHasMojibake || decoded.length < filename.length) {
          return decoded;
        }
        return filename;
      } catch (e) {
        return filename;
      }
    };
    
    // Fetch attachments metadata for each assignment
    const assignmentsWithAttachments = await Promise.all(
      allAssignments.map(async (assignment) => {
        const attachments = await db
          .select({
            id: assignmentAttachments.id,
            file_name: assignmentAttachments.file_name,
            fileSize: assignmentAttachments.fileSize,
            mimeType: assignmentAttachments.mimeType,
            createdAt: assignmentAttachments.createdAt,
          })
          .from(assignmentAttachments)
          .where(eq(assignmentAttachments.assignmentId, assignment.id));
        
        // Decode filenames before returning
        const decodedAttachments = attachments.map(att => ({
          ...att,
          file_name: decodeFilename(att.file_name),
        }));
        
        return {
          ...assignment,
          attachments: decodedAttachments,
        };
      })
    );
    
    return assignmentsWithAttachments;
  }

  async getAssignmentById(id: number): Promise<Assignment | undefined> {
    const result = await db.select().from(assignments)
      .where(and(eq(assignments.id, id), eq(assignments.isDeleted, false)));
    return result[0];
  }

  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const result = await db.insert(assignments).values(assignment).returning();
    return result[0];
  }

  async updateAssignment(id: number, assignment: Partial<InsertAssignment>): Promise<Assignment | undefined> {
    const result = await db.update(assignments)
      .set(assignment)
      .where(and(eq(assignments.id, id), eq(assignments.isDeleted, false)))
      .returning();
    return result[0];
  }

  async deleteAssignment(id: number): Promise<boolean> {
    // Soft delete: mark as deleted
    const result = await db.update(assignments)
      .set({ isDeleted: true, deletedAt: new Date() })
      .where(eq(assignments.id, id))
      .returning();
    return result.length > 0;
  }

  async markAssignmentAsCompleted(id: number): Promise<Assignment | undefined> {
    const result = await db.update(assignments)
      .set({ isCompleted: true, completedAt: new Date() })
      .where(and(eq(assignments.id, id), eq(assignments.isDeleted, false)))
      .returning();
    return result[0];
  }

  async getUncompletedAssignmentsCount(): Promise<number> {
    const allAssignments = await db.select().from(assignments)
      .where(eq(assignments.isDeleted, false));
    return allAssignments.filter(a => !a.isCompleted).length;
  }

  async listDeletedAssignments(): Promise<Assignment[]> {
    const deletedAssignments = await db.select().from(assignments)
      .where(eq(assignments.isDeleted, true))
      .orderBy(desc(assignments.deletedAt));
    
    // Fetch attachments for each deleted assignment
    const assignmentsWithAttachments = await Promise.all(
      deletedAssignments.map(async (assignment) => {
        const attachments = await db
          .select({
            id: assignmentAttachments.id,
            file_name: assignmentAttachments.file_name,
            fileSize: assignmentAttachments.fileSize,
            mimeType: assignmentAttachments.mimeType,
            createdAt: assignmentAttachments.createdAt,
          })
          .from(assignmentAttachments)
          .where(eq(assignmentAttachments.assignmentId, assignment.id));
        
        return {
          ...assignment,
          attachments,
        };
      })
    );
    
    return assignmentsWithAttachments;
  }

  async restoreAssignment(id: number): Promise<boolean> {
    const result = await db.update(assignments)
      .set({ isDeleted: false, deletedAt: null })
      .where(eq(assignments.id, id))
      .returning();
    return result.length > 0;
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
    const allAnnouncements = await db.select().from(announcements).orderBy(desc(announcements.createdAt));
    
    // Helper to decode filename
    const decodeFilename = (filename: string): string => {
      try {
        if (filename.includes('%')) {
          return decodeURIComponent(filename);
        }
        const hasMojibake = /[Ð-Ñ]/.test(filename);
        if (!hasMojibake) {
          return filename;
        }
        const buffer = Buffer.from(filename, 'latin1');
        const decoded = buffer.toString('utf8');
        const stillHasMojibake = /Ð|Ñ/.test(decoded);
        if (!stillHasMojibake || decoded.length < filename.length) {
          return decoded;
        }
        return filename;
      } catch (e) {
        return filename;
      }
    };
    
    // Fetch attachments metadata for each announcement
    const announcementsWithAttachments = await Promise.all(
      allAnnouncements.map(async (announcement) => {
        const attachments = await db
          .select({
            id: announcementAttachments.id,
            file_name: announcementAttachments.file_name,
            fileSize: announcementAttachments.fileSize,
            mimeType: announcementAttachments.mimeType,
            createdAt: announcementAttachments.createdAt,
          })
          .from(announcementAttachments)
          .where(eq(announcementAttachments.announcementId, announcement.id));
        
        // Decode filenames before returning
        const decodedAttachments = attachments.map(att => ({
          ...att,
          file_name: decodeFilename(att.file_name),
        }));
        
        return {
          ...announcement,
          attachments: decodedAttachments,
        };
      })
    );
    
    return announcementsWithAttachments;
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

  async markAnnouncementAsRead(id: number, departmentId: number): Promise<Announcement | undefined> {
    const announcement = await this.getAnnouncementById(id);
    if (!announcement) return undefined;
    
    // Add departmentId to readBy array if not already present
    if (!announcement.readBy.includes(departmentId)) {
      const updatedReadBy = [...announcement.readBy, departmentId];
      const result = await db.update(announcements)
        .set({ readBy: updatedReadBy })
        .where(eq(announcements.id, id))
        .returning();
      return result[0];
    }
    return announcement;
  }

  async getUnreadAnnouncementsCount(departmentId: number): Promise<number> {
    const allAnnouncements = await db.select().from(announcements);
    return allAnnouncements.filter(a => !a.readBy.includes(departmentId)).length;
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

  // People
  async getPeople(): Promise<Person[]> {
    return await db.select().from(people).orderBy(asc(people.name));
  }

  async getPersonById(id: number): Promise<Person | undefined> {
    const result = await db.select().from(people).where(eq(people.id, id));
    return result[0];
  }

  async getPeopleByDepartmentId(departmentId: number): Promise<Person[]> {
    return await db.select().from(people).where(eq(people.departmentId, departmentId)).orderBy(asc(people.name));
  }

  async createPerson(person: InsertPerson): Promise<Person> {
    const result = await db.insert(people).values(person).returning();
    return result[0];
  }

  async updatePerson(id: number, person: Partial<InsertPerson>): Promise<Person | undefined> {
    const result = await db.update(people).set(person).where(eq(people.id, id)).returning();
    return result[0];
  }

  async deletePerson(id: number): Promise<boolean> {
    const result = await db.delete(people).where(eq(people.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DbStorage();
