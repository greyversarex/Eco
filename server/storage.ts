import type { 
  Department, InsertDepartment, 
  Admin, InsertAdmin, 
  Message, InsertMessage, 
  Attachment, InsertAttachment,
  Assignment, InsertAssignment,
  AssignmentAttachment, InsertAssignmentAttachment,
  AssignmentReply, InsertAssignmentReply,
  Announcement, InsertAnnouncement,
  AnnouncementAttachment, InsertAnnouncementAttachment,
  Person, InsertPerson,
  DepartmentIcon, InsertDepartmentIcon,
  PushSubscription, InsertPushSubscription,
  DocumentType, InsertDocumentType,
  DocumentTemplate, InsertDocumentTemplate,
  MessageDocument, InsertMessageDocument,
  VisualTemplate, InsertVisualTemplate
} from "@shared/schema";

export interface IStorage {
  // Departments
  getDepartments(): Promise<Department[]>;
  getParentDepartments(): Promise<Department[]>; // Only top-level departments (no parent)
  getDepartmentById(id: number): Promise<Department | undefined>;
  getDepartmentByAccessCode(accessCode: string): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, department: Partial<InsertDepartment>): Promise<Department | undefined>;
  deleteDepartment(id: number): Promise<boolean>;
  reorderDepartments(updates: Array<{ id: number; sortOrder: number }>): Promise<void>;
  
  // Subdepartments
  getSubdepartments(parentId: number): Promise<Department[]>; // Get subdepartments of a parent
  getSiblingSubdepartments(departmentId: number): Promise<Department[]>; // Get siblings (same parent)
  getAccessibleDepartments(departmentId: number): Promise<Department[]>; // For messaging: parent + siblings for subdepts, all for depts
  
  // Department Icons
  getDepartmentIcon(departmentId: number): Promise<DepartmentIcon | undefined>;
  upsertDepartmentIcon(icon: InsertDepartmentIcon): Promise<DepartmentIcon>;
  deleteDepartmentIcon(departmentId: number): Promise<boolean>;
  
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
  permanentDeleteMessage(id: number): Promise<boolean>;
  
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
  permanentDeleteAssignment(id: number): Promise<boolean>;
  
  // Assignment Attachments
  createAssignmentAttachment(attachment: InsertAssignmentAttachment): Promise<AssignmentAttachment>;
  getAssignmentAttachments(assignmentId: number): Promise<AssignmentAttachment[]>;
  getAssignmentAttachmentById(id: number): Promise<AssignmentAttachment | undefined>;
  
  // Assignment Replies
  createAssignmentReply(reply: InsertAssignmentReply): Promise<AssignmentReply>;
  getAssignmentReplies(assignmentId: number): Promise<AssignmentReply[]>;
  
  // Announcements
  getAnnouncements(departmentId?: number): Promise<Announcement[]>;
  getAnnouncementById(id: number): Promise<Announcement | undefined>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: number, announcement: Partial<InsertAnnouncement>): Promise<Announcement | undefined>;
  deleteAnnouncement(id: number): Promise<boolean>;
  markAnnouncementAsRead(id: number, departmentId: number): Promise<Announcement | undefined>;
  getUnreadAnnouncementsCount(departmentId: number): Promise<number>;
  listDeletedAnnouncements(): Promise<Announcement[]>;
  restoreAnnouncement(id: number): Promise<boolean>;
  permanentDeleteAnnouncement(id: number): Promise<boolean>;
  
  // Announcement Attachments
  createAnnouncementAttachment(attachment: InsertAnnouncementAttachment): Promise<AnnouncementAttachment>;
  getAnnouncementAttachments(announcementId: number): Promise<AnnouncementAttachment[]>;
  getAnnouncementAttachmentById(id: number): Promise<AnnouncementAttachment | undefined>;
  
  // Assignment counts
  getUncompletedAssignmentsCount(departmentId: number): Promise<number>;
  
  // People
  getPeople(): Promise<Person[]>;
  getPersonById(id: number): Promise<Person | undefined>;
  getPeopleByDepartmentId(departmentId: number): Promise<Person[]>;
  createPerson(person: InsertPerson): Promise<Person>;
  updatePerson(id: number, person: Partial<InsertPerson>): Promise<Person | undefined>;
  deletePerson(id: number): Promise<boolean>;
  
  // Push Subscriptions
  getPushSubscriptionsByUser(userId: number, userType: string): Promise<PushSubscription[]>;
  getPushSubscriptionByEndpoint(endpoint: string): Promise<PushSubscription | undefined>;
  createPushSubscription(subscription: InsertPushSubscription): Promise<PushSubscription>;
  updatePushSubscription(id: number, subscription: Partial<InsertPushSubscription>): Promise<PushSubscription | undefined>;
  deletePushSubscriptionByEndpoint(endpoint: string): Promise<boolean>;
  
  // Document Types (Намуди ҳуҷҷат)
  getDocumentTypes(): Promise<DocumentType[]>;
  getActiveDocumentTypes(): Promise<DocumentType[]>;
  getDocumentTypeById(id: number): Promise<DocumentType | undefined>;
  createDocumentType(documentType: InsertDocumentType): Promise<DocumentType>;
  updateDocumentType(id: number, documentType: Partial<InsertDocumentType>): Promise<DocumentType | undefined>;
  deleteDocumentType(id: number): Promise<boolean>;
  
  // Message Approval (Иҷозат)
  updateMessageApproval(id: number, status: 'approved' | 'rejected', approvedById: number): Promise<Message | undefined>;
  
  // Document Templates (Намунаҳои ҳуҷҷатҳо)
  getDocumentTemplates(): Promise<DocumentTemplate[]>;
  getActiveDocumentTemplates(): Promise<DocumentTemplate[]>;
  getDocumentTemplateById(id: number): Promise<DocumentTemplate | undefined>;
  createDocumentTemplate(template: InsertDocumentTemplate): Promise<DocumentTemplate>;
  updateDocumentTemplate(id: number, template: Partial<InsertDocumentTemplate>): Promise<DocumentTemplate | undefined>;
  deleteDocumentTemplate(id: number): Promise<boolean>;
  
  // Message Documents (Ҳуҷҷатҳои паём)
  getMessageDocuments(messageId: number): Promise<MessageDocument[]>;
  getMessageDocumentById(id: number): Promise<MessageDocument | undefined>;
  createMessageDocument(doc: InsertMessageDocument): Promise<MessageDocument>;
  updateMessageDocument(id: number, doc: Partial<InsertMessageDocument>): Promise<MessageDocument | undefined>;
  deleteMessageDocument(id: number): Promise<boolean>;
  
  // Visual Templates (Намунаҳои визуалӣ)
  getActiveVisualTemplates(): Promise<VisualTemplate[]>;
  getAllVisualTemplates(): Promise<VisualTemplate[]>;
  getVisualTemplateById(id: number): Promise<VisualTemplate | undefined>;
  createVisualTemplate(template: InsertVisualTemplate): Promise<VisualTemplate>;
  updateVisualTemplate(id: number, template: Partial<InsertVisualTemplate>): Promise<VisualTemplate | undefined>;
  deleteVisualTemplate(id: number): Promise<boolean>;
}

// Database storage implementation
import { db } from './db';
import { departments, admins, messages, attachments, assignments, assignmentAttachments, assignmentReplies, announcements, announcementAttachments, people, departmentIcons, pushSubscriptions, documentTypes, documentTemplates, messageDocuments, visualTemplates } from '@shared/schema';
import { eq, or, and, desc, asc, sql } from 'drizzle-orm';

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

  // Get only top-level departments (no parent)
  async getParentDepartments(): Promise<Department[]> {
    return await db.select().from(departments)
      .where(sql`${departments.parentDepartmentId} IS NULL`)
      .orderBy(asc(departments.sortOrder), asc(departments.id));
  }

  // Get subdepartments of a parent department
  async getSubdepartments(parentId: number): Promise<Department[]> {
    return await db.select().from(departments)
      .where(eq(departments.parentDepartmentId, parentId))
      .orderBy(asc(departments.sortOrder), asc(departments.id));
  }

  // Get sibling subdepartments (same parent) excluding self
  async getSiblingSubdepartments(departmentId: number): Promise<Department[]> {
    // First get the department to find its parent
    const dept = await this.getDepartmentById(departmentId);
    if (!dept || !dept.parentDepartmentId) {
      return []; // Not a subdepartment or not found
    }
    
    // Get all subdepartments of the same parent, excluding self
    return await db.select().from(departments)
      .where(and(
        eq(departments.parentDepartmentId, dept.parentDepartmentId),
        sql`${departments.id} != ${departmentId}`
      ))
      .orderBy(asc(departments.sortOrder), asc(departments.id));
  }

  // Get departments accessible for messaging
  // For subdepartments: only parent + sibling subdepartments
  // For departments: all departments (existing behavior)
  async getAccessibleDepartments(departmentId: number): Promise<Department[]> {
    const dept = await this.getDepartmentById(departmentId);
    if (!dept) return [];
    
    // If it's a subdepartment (has parent)
    if (dept.parentDepartmentId) {
      // Get parent department
      const parent = await this.getDepartmentById(dept.parentDepartmentId);
      // Get sibling subdepartments
      const siblings = await db.select().from(departments)
        .where(and(
          eq(departments.parentDepartmentId, dept.parentDepartmentId),
          sql`${departments.id} != ${departmentId}` // exclude self
        ))
        .orderBy(asc(departments.sortOrder), asc(departments.id));
      
      // Return parent + siblings
      return parent ? [parent, ...siblings] : siblings;
    }
    
    // If it's a top-level department, return all departments (excluding subdepartments of other departments)
    // For now, return all departments - this maintains existing behavior
    return await this.getDepartments();
  }

  // Department Icons
  async getDepartmentIcon(departmentId: number): Promise<DepartmentIcon | undefined> {
    const result = await db.select().from(departmentIcons).where(eq(departmentIcons.departmentId, departmentId));
    return result[0];
  }

  async upsertDepartmentIcon(icon: InsertDepartmentIcon): Promise<DepartmentIcon> {
    // Try to insert, if conflict on departmentId then update
    const result = await db.insert(departmentIcons)
      .values({ ...icon, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: departmentIcons.departmentId,
        set: {
          fileName: icon.fileName,
          fileData: icon.fileData,
          fileSize: icon.fileSize,
          mimeType: icon.mimeType,
          updatedAt: new Date()
        }
      })
      .returning();
    return result[0];
  }

  async deleteDepartmentIcon(departmentId: number): Promise<boolean> {
    const result = await db.delete(departmentIcons).where(eq(departmentIcons.departmentId, departmentId)).returning();
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
    return await db.select().from(messages).where(eq(messages.isDeleted, false)).orderBy(desc(messages.createdAt));
  }

  async getMessageById(id: number): Promise<Message | undefined> {
    const result = await db.select().from(messages).where(and(eq(messages.id, id), eq(messages.isDeleted, false)));
    return result[0];
  }

  async getMessagesByDepartment(departmentId: number): Promise<{ inbox: Message[]; outbox: Message[] }> {
    // Inbox: messages where departmentId is in recipientIds array, or legacy recipientId matches
    const inbox = await db.select().from(messages).where(
      and(
        or(
          sql`${messages.recipientIds} @> ARRAY[${departmentId}]::integer[]`,
          eq(messages.recipientId, departmentId)
        ),
        eq(messages.isDeleted, false)
      )
    ).orderBy(desc(messages.createdAt));
    
    const outbox = await db.select().from(messages).where(and(eq(messages.senderId, departmentId), eq(messages.isDeleted, false))).orderBy(desc(messages.createdAt));
    return { inbox, outbox };
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    // Ensure backward compatibility: sync recipientId and recipientIds
    const messageData: any = { ...message };
    
    // If recipientIds provided but not recipientId
    if (messageData.recipientIds && messageData.recipientIds.length > 0 && !messageData.recipientId) {
      // For single recipient, also set legacy recipientId field
      if (messageData.recipientIds.length === 1) {
        messageData.recipientId = messageData.recipientIds[0];
      }
    }
    // If recipientId provided but not recipientIds, populate recipientIds array
    else if (messageData.recipientId && (!messageData.recipientIds || messageData.recipientIds.length === 0)) {
      messageData.recipientIds = [messageData.recipientId];
    }
    
    const result = await db.insert(messages).values(messageData).returning() as Message[];
    if (!result[0]) {
      throw new Error('Failed to create message');
    }
    return result[0];
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
        or(
          sql`${messages.recipientIds} @> ARRAY[${departmentId}]::integer[]`,
          eq(messages.recipientId, departmentId)
        ),
        eq(messages.isRead, false),
        eq(messages.isDeleted, false)
      ));
    return result.length;
  }

  async getMessagesByDepartmentPair(currentDeptId: number, otherDeptId: number): Promise<{ received: Message[]; sent: Message[] }> {
    const received = await db.select().from(messages)
      .where(and(
        or(
          sql`${messages.recipientIds} @> ARRAY[${currentDeptId}]::integer[]`,
          eq(messages.recipientId, currentDeptId)
        ),
        eq(messages.senderId, otherDeptId),
        eq(messages.isDeleted, false)
      ))
      .orderBy(desc(messages.createdAt));
    const sent = await db.select().from(messages)
      .where(and(
        eq(messages.senderId, currentDeptId),
        or(
          sql`${messages.recipientIds} @> ARRAY[${otherDeptId}]::integer[]`,
          eq(messages.recipientId, otherDeptId)
        ),
        eq(messages.isDeleted, false)
      ))
      .orderBy(desc(messages.createdAt));
    return { received, sent };
  }

  async getUnreadCountsForAllDepartments(currentDeptId: number): Promise<Record<number, number>> {
    const allMessages = await db.select().from(messages)
      .where(and(
        or(
          sql`${messages.recipientIds} @> ARRAY[${currentDeptId}]::integer[]`,
          eq(messages.recipientId, currentDeptId)
        ),
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
      // For broadcast messages (recipientIds array), count for each recipient
      if (msg.recipientIds && msg.recipientIds.length > 0) {
        for (const recipientId of msg.recipientIds) {
          counts[recipientId] = (counts[recipientId] || 0) + 1;
        }
      } else if (msg.recipientId) {
        // Legacy single recipient
        counts[msg.recipientId] = (counts[msg.recipientId] || 0) + 1;
      }
    }
    return counts;
  }

  async listDeletedMessages(departmentId?: number): Promise<Message[]> {
    const where = departmentId
      ? and(
          eq(messages.isDeleted, true),
          or(
            eq(messages.senderId, departmentId),
            sql`${messages.recipientIds} @> ARRAY[${departmentId}]::integer[]`,
            eq(messages.recipientId, departmentId)
          )
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

  async permanentDeleteMessage(id: number): Promise<boolean> {
    // First delete all attachments
    await db.delete(attachments).where(eq(attachments.messageId, id));
    // Then permanently delete the message
    const result = await db.delete(messages).where(eq(messages.id, id)).returning() as Message[];
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
    
    // Fetch attachments metadata and replies for each assignment
    const assignmentsWithAttachmentsAndReplies = await Promise.all(
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
        
        // Fetch replies for this assignment
        const replies = await db
          .select()
          .from(assignmentReplies)
          .where(eq(assignmentReplies.assignmentId, assignment.id));
        
        // Decode filenames before returning
        const decodedAttachments = attachments.map(att => ({
          ...att,
          file_name: decodeFilename(att.file_name),
        }));
        
        return {
          ...assignment,
          attachments: decodedAttachments,
          replies: replies,
        };
      })
    );
    
    return assignmentsWithAttachmentsAndReplies;
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

  async getUncompletedAssignmentsCount(departmentId: number): Promise<number> {
    const allAssignments = await db.select().from(assignments)
      .where(eq(assignments.isDeleted, false));
    
    // Apply same filter as GET /api/assignments
    const filteredAssignments = allAssignments.filter(assignment => 
      // Show if department is the creator (sender)
      assignment.senderId === departmentId ||
      // OR if department is in recipients list
      (assignment.recipientIds && assignment.recipientIds.includes(departmentId)) ||
      // OR if no recipients specified (legacy backward compatibility - show to all)
      (!assignment.recipientIds || assignment.recipientIds.length === 0) ||
      // OR if senderId is NULL (legacy assignments before migration - show to departments)
      (assignment.senderId === null)
    );
    
    return filteredAssignments.filter(a => !a.isCompleted).length;
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

  async permanentDeleteAssignment(id: number): Promise<boolean> {
    // First delete all attachments
    await db.delete(assignmentAttachments).where(eq(assignmentAttachments.assignmentId, id));
    // Then permanently delete the assignment
    const result = await db.delete(assignments).where(eq(assignments.id, id)).returning();
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

  // Assignment Replies
  async createAssignmentReply(reply: InsertAssignmentReply): Promise<AssignmentReply> {
    const result = await db.insert(assignmentReplies).values(reply).returning();
    return result[0];
  }

  async getAssignmentReplies(assignmentId: number): Promise<AssignmentReply[]> {
    return await db.select().from(assignmentReplies).where(eq(assignmentReplies.assignmentId, assignmentId));
  }

  // Announcements
  async getAnnouncements(departmentId?: number): Promise<Announcement[]> {
    // If departmentId is provided, filter announcements
    // Show announcements where:
    // - recipientIds is NULL (announcement for everyone)
    // - OR recipientIds contains this departmentId (targeted announcement)
    const where = departmentId !== undefined
      ? or(
          sql`${announcements.recipientIds} IS NULL`,
          sql`${announcements.recipientIds} @> ARRAY[${departmentId}]::integer[]`
        )
      : undefined;
    
    const query = where 
      ? db.select().from(announcements).where(where)
      : db.select().from(announcements);
    
    const allAnnouncements = await query.orderBy(desc(announcements.createdAt));
    
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
    // IMPORTANT: Must use same filtering logic as getAnnouncements()
    // Only count announcements that are:
    // 1. Not deleted
    // 2. Either targeted to this department OR for everyone (recipientIds is NULL)
    // 3. Not yet read by this department
    const visibleAnnouncements = await db.select().from(announcements)
      .where(
        and(
          eq(announcements.isDeleted, false),
          or(
            sql`${announcements.recipientIds} IS NULL`,
            sql`${announcements.recipientIds} @> ARRAY[${departmentId}]::integer[]`
          )
        )
      );
    
    return visibleAnnouncements.filter(a => !a.readBy.includes(departmentId)).length;
  }

  async listDeletedAnnouncements(): Promise<Announcement[]> {
    const deletedAnnouncements = await db.select().from(announcements)
      .where(eq(announcements.isDeleted, true))
      .orderBy(desc(announcements.deletedAt));
    
    // Fetch attachments for each deleted announcement
    const announcementsWithAttachments = await Promise.all(
      deletedAnnouncements.map(async (announcement) => {
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
        
        return {
          ...announcement,
          attachments,
        };
      })
    );
    
    return announcementsWithAttachments;
  }

  async restoreAnnouncement(id: number): Promise<boolean> {
    const result = await db.update(announcements)
      .set({ isDeleted: false, deletedAt: null })
      .where(eq(announcements.id, id))
      .returning();
    return result.length > 0;
  }

  async permanentDeleteAnnouncement(id: number): Promise<boolean> {
    // First delete all attachments
    await db.delete(announcementAttachments).where(eq(announcementAttachments.announcementId, id));
    // Then permanently delete the announcement
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

  // Push Subscriptions
  async getPushSubscriptionsByUser(userId: number, userType: string): Promise<PushSubscription[]> {
    return await db.select()
      .from(pushSubscriptions)
      .where(and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.userType, userType)
      ));
  }

  async getPushSubscriptionByEndpoint(endpoint: string): Promise<PushSubscription | undefined> {
    const result = await db.select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint));
    return result[0];
  }

  async createPushSubscription(subscription: InsertPushSubscription): Promise<PushSubscription> {
    const result = await db.insert(pushSubscriptions).values(subscription).returning();
    return result[0];
  }

  async updatePushSubscription(id: number, subscription: Partial<InsertPushSubscription>): Promise<PushSubscription | undefined> {
    const result = await db.update(pushSubscriptions)
      .set(subscription)
      .where(eq(pushSubscriptions.id, id))
      .returning();
    return result[0];
  }

  async deletePushSubscriptionByEndpoint(endpoint: string): Promise<boolean> {
    const result = await db.delete(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint))
      .returning();
    return result.length > 0;
  }

  // Document Types (Намуди ҳуҷҷат)
  async getDocumentTypes(): Promise<DocumentType[]> {
    return await db.select().from(documentTypes).orderBy(asc(documentTypes.sortOrder), asc(documentTypes.id));
  }

  async getActiveDocumentTypes(): Promise<DocumentType[]> {
    return await db.select().from(documentTypes)
      .where(eq(documentTypes.isActive, true))
      .orderBy(asc(documentTypes.sortOrder), asc(documentTypes.id));
  }

  async getDocumentTypeById(id: number): Promise<DocumentType | undefined> {
    const result = await db.select().from(documentTypes).where(eq(documentTypes.id, id));
    return result[0];
  }

  async createDocumentType(documentType: InsertDocumentType): Promise<DocumentType> {
    const result = await db.insert(documentTypes).values(documentType).returning();
    return result[0];
  }

  async updateDocumentType(id: number, documentType: Partial<InsertDocumentType>): Promise<DocumentType | undefined> {
    const result = await db.update(documentTypes).set(documentType).where(eq(documentTypes.id, id)).returning();
    return result[0];
  }

  async deleteDocumentType(id: number): Promise<boolean> {
    const result = await db.delete(documentTypes).where(eq(documentTypes.id, id)).returning();
    return result.length > 0;
  }

  // Message Approval (Иҷозат)
  async updateMessageApproval(id: number, status: 'approved' | 'rejected', approvedById: number): Promise<Message | undefined> {
    const result = await db.update(messages)
      .set({
        approvalStatus: status,
        approvedById: approvedById,
        approvedAt: new Date(),
      })
      .where(eq(messages.id, id))
      .returning();
    return result[0];
  }

  // Document Templates (Намунаҳои ҳуҷҷатҳо)
  async getDocumentTemplates(): Promise<DocumentTemplate[]> {
    return await db.select().from(documentTemplates).orderBy(asc(documentTemplates.sortOrder), asc(documentTemplates.id));
  }

  async getActiveDocumentTemplates(): Promise<DocumentTemplate[]> {
    return await db.select().from(documentTemplates)
      .where(eq(documentTemplates.isActive, true))
      .orderBy(asc(documentTemplates.sortOrder), asc(documentTemplates.id));
  }

  async getDocumentTemplateById(id: number): Promise<DocumentTemplate | undefined> {
    const result = await db.select().from(documentTemplates).where(eq(documentTemplates.id, id));
    return result[0];
  }

  async createDocumentTemplate(template: InsertDocumentTemplate): Promise<DocumentTemplate> {
    const result = await db.insert(documentTemplates).values(template).returning();
    return result[0];
  }

  async updateDocumentTemplate(id: number, template: Partial<InsertDocumentTemplate>): Promise<DocumentTemplate | undefined> {
    const result = await db.update(documentTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(documentTemplates.id, id))
      .returning();
    return result[0];
  }

  async deleteDocumentTemplate(id: number): Promise<boolean> {
    const result = await db.delete(documentTemplates).where(eq(documentTemplates.id, id)).returning();
    return result.length > 0;
  }

  // Message Documents (Ҳуҷҷатҳои паём)
  async getMessageDocuments(messageId: number): Promise<MessageDocument[]> {
    return await db.select().from(messageDocuments)
      .where(eq(messageDocuments.messageId, messageId))
      .orderBy(asc(messageDocuments.id));
  }

  async getMessageDocumentById(id: number): Promise<MessageDocument | undefined> {
    const result = await db.select().from(messageDocuments).where(eq(messageDocuments.id, id));
    return result[0];
  }

  async createMessageDocument(doc: InsertMessageDocument): Promise<MessageDocument> {
    const result = await db.insert(messageDocuments).values(doc).returning();
    return result[0];
  }

  async updateMessageDocument(id: number, doc: Partial<InsertMessageDocument>): Promise<MessageDocument | undefined> {
    const result = await db.update(messageDocuments)
      .set({ ...doc, lastEditedAt: new Date() })
      .where(eq(messageDocuments.id, id))
      .returning();
    return result[0];
  }

  async deleteMessageDocument(id: number): Promise<boolean> {
    const result = await db.delete(messageDocuments).where(eq(messageDocuments.id, id)).returning();
    return result.length > 0;
  }

  // Visual Templates (Намунаҳои визуалӣ)
  async getActiveVisualTemplates(): Promise<VisualTemplate[]> {
    return await db.select().from(visualTemplates)
      .where(eq(visualTemplates.isActive, true))
      .orderBy(asc(visualTemplates.sortOrder), asc(visualTemplates.id));
  }

  async getAllVisualTemplates(): Promise<VisualTemplate[]> {
    return await db.select().from(visualTemplates)
      .orderBy(asc(visualTemplates.sortOrder), asc(visualTemplates.id));
  }

  async getVisualTemplateById(id: number): Promise<VisualTemplate | undefined> {
    const result = await db.select().from(visualTemplates).where(eq(visualTemplates.id, id));
    return result[0];
  }

  async createVisualTemplate(template: InsertVisualTemplate): Promise<VisualTemplate> {
    const result = await db.insert(visualTemplates).values(template).returning();
    return result[0];
  }

  async updateVisualTemplate(id: number, template: Partial<InsertVisualTemplate>): Promise<VisualTemplate | undefined> {
    const result = await db.update(visualTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(visualTemplates.id, id))
      .returning();
    return result[0];
  }

  async deleteVisualTemplate(id: number): Promise<boolean> {
    const result = await db.delete(visualTemplates).where(eq(visualTemplates.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DbStorage();
