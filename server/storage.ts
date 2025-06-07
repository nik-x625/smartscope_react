import { 
  users, documents, templates, effortEstimations, chatSessions,
  type User, type InsertUser, type Document, type InsertDocument,
  type Template, type InsertTemplate, type EffortEstimation, type InsertEffortEstimation,
  type ChatSession, type InsertChatSession
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: number): Promise<boolean>;

  // Document methods
  getDocument(id: number): Promise<Document | undefined>;
  getDocumentsByAuthor(authorId: number): Promise<Document[]>;
  getAllDocuments(): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, updates: Partial<Document>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;

  // Template methods
  getTemplate(id: number): Promise<Template | undefined>;
  getAllTemplates(): Promise<Template[]>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  updateTemplate(id: number, updates: Partial<Template>): Promise<Template | undefined>;
  deleteTemplate(id: number): Promise<boolean>;
  incrementTemplateUsage(id: number): Promise<void>;

  // Effort Estimation methods
  getEffortEstimation(id: number): Promise<EffortEstimation | undefined>;
  getEffortEstimationByDocument(documentId: number): Promise<EffortEstimation | undefined>;
  createEffortEstimation(estimation: InsertEffortEstimation): Promise<EffortEstimation>;
  updateEffortEstimation(id: number, updates: Partial<EffortEstimation>): Promise<EffortEstimation | undefined>;
  deleteEffortEstimation(id: number): Promise<boolean>;

  // Chat Session methods
  getChatSession(id: number): Promise<ChatSession | undefined>;
  getChatSessionsByUser(userId: number): Promise<ChatSession[]>;
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  updateChatSession(id: number, updates: Partial<ChatSession>): Promise<ChatSession | undefined>;
  deleteChatSession(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private documents: Map<number, Document>;
  private templates: Map<number, Template>;
  private effortEstimations: Map<number, EffortEstimation>;
  private chatSessions: Map<number, ChatSession>;
  
  private currentUserId: number;
  private currentDocumentId: number;
  private currentTemplateId: number;
  private currentEffortEstimationId: number;
  private currentChatSessionId: number;

  constructor() {
    this.users = new Map();
    this.documents = new Map();
    this.templates = new Map();
    this.effortEstimations = new Map();
    this.chatSessions = new Map();
    
    this.currentUserId = 1;
    this.currentDocumentId = 1;
    this.currentTemplateId = 1;
    this.currentEffortEstimationId = 1;
    this.currentChatSessionId = 1;

    // Initialize with default admin user
    this.createUser({
      username: "admin",
      email: "admin@example.com",
      password: "admin123",
      role: "admin"
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      lastActive: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  // Document methods
  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getDocumentsByAuthor(authorId: number): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(doc => doc.authorId === authorId);
  }

  async getAllDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.currentDocumentId++;
    const now = new Date();
    const document: Document = { 
      ...insertDocument, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.documents.set(id, document);
    return document;
  }

  async updateDocument(id: number, updates: Partial<Document>): Promise<Document | undefined> {
    const document = this.documents.get(id);
    if (!document) return undefined;
    
    const updatedDocument = { ...document, ...updates, updatedAt: new Date() };
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<boolean> {
    return this.documents.delete(id);
  }

  // Template methods
  async getTemplate(id: number): Promise<Template | undefined> {
    return this.templates.get(id);
  }

  async getAllTemplates(): Promise<Template[]> {
    return Array.from(this.templates.values());
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const id = this.currentTemplateId++;
    const template: Template = { 
      ...insertTemplate, 
      id, 
      usageCount: 0,
      createdAt: new Date()
    };
    this.templates.set(id, template);
    return template;
  }

  async updateTemplate(id: number, updates: Partial<Template>): Promise<Template | undefined> {
    const template = this.templates.get(id);
    if (!template) return undefined;
    
    const updatedTemplate = { ...template, ...updates };
    this.templates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  async deleteTemplate(id: number): Promise<boolean> {
    return this.templates.delete(id);
  }

  async incrementTemplateUsage(id: number): Promise<void> {
    const template = this.templates.get(id);
    if (template) {
      template.usageCount = (template.usageCount || 0) + 1;
      this.templates.set(id, template);
    }
  }

  // Effort Estimation methods
  async getEffortEstimation(id: number): Promise<EffortEstimation | undefined> {
    return this.effortEstimations.get(id);
  }

  async getEffortEstimationByDocument(documentId: number): Promise<EffortEstimation | undefined> {
    return Array.from(this.effortEstimations.values()).find(ee => ee.documentId === documentId);
  }

  async createEffortEstimation(insertEffortEstimation: InsertEffortEstimation): Promise<EffortEstimation> {
    const id = this.currentEffortEstimationId++;
    const now = new Date();
    const estimation: EffortEstimation = { 
      ...insertEffortEstimation, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.effortEstimations.set(id, estimation);
    return estimation;
  }

  async updateEffortEstimation(id: number, updates: Partial<EffortEstimation>): Promise<EffortEstimation | undefined> {
    const estimation = this.effortEstimations.get(id);
    if (!estimation) return undefined;
    
    const updatedEstimation = { ...estimation, ...updates, updatedAt: new Date() };
    this.effortEstimations.set(id, updatedEstimation);
    return updatedEstimation;
  }

  async deleteEffortEstimation(id: number): Promise<boolean> {
    return this.effortEstimations.delete(id);
  }

  // Chat Session methods
  async getChatSession(id: number): Promise<ChatSession | undefined> {
    return this.chatSessions.get(id);
  }

  async getChatSessionsByUser(userId: number): Promise<ChatSession[]> {
    return Array.from(this.chatSessions.values()).filter(session => session.userId === userId);
  }

  async createChatSession(insertChatSession: InsertChatSession): Promise<ChatSession> {
    const id = this.currentChatSessionId++;
    const now = new Date();
    const session: ChatSession = { 
      ...insertChatSession, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.chatSessions.set(id, session);
    return session;
  }

  async updateChatSession(id: number, updates: Partial<ChatSession>): Promise<ChatSession | undefined> {
    const session = this.chatSessions.get(id);
    if (!session) return undefined;
    
    const updatedSession = { ...session, ...updates, updatedAt: new Date() };
    this.chatSessions.set(id, updatedSession);
    return updatedSession;
  }

  async deleteChatSession(id: number): Promise<boolean> {
    return this.chatSessions.delete(id);
  }
}

export const storage = new MemStorage();
