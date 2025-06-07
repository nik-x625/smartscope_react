import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertDocumentSchema, insertTemplateSchema, insertEffortEstimationSchema, insertChatSessionSchema } from "@shared/schema";
import PDFDocument from "pdfkit";
import multer from "multer";
import * as XLSX from "xlsx";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'
      ];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only Excel and CSV files are allowed'));
      }
    }
  });
  
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      await storage.updateUser(user.id, { lastActive: new Date() });
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const user = await storage.createUser(userData);
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  // Excel import endpoint
  app.post("/api/documents/import-excel", upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const authorId = parseInt(req.body.authorId);
      if (!authorId) {
        return res.status(400).json({ message: "Author ID is required" });
      }

      // Read the Excel file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Parse the Excel data into SoW structure
      const parsedData = parseExcelToSoW(data as any[][]);

      // Create the document
      const document = await storage.createDocument({
        title: parsedData.title,
        description: parsedData.description,
        content: parsedData.content,
        type: "sow",
        status: "draft",
        authorId: authorId,
        templateId: null
      });

      res.json(document);
    } catch (error: any) {
      console.error("Excel import error:", error);
      res.status(500).json({ 
        message: error.message || "Failed to import Excel file" 
      });
    }
  });

  // Document routes
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getAllDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.get("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getDocument(id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch document" });
    }
  });

  app.post("/api/documents", async (req, res) => {
    try {
      const documentData = insertDocumentSchema.parse(req.body);
      const document = await storage.createDocument(documentData);
      res.json(document);
    } catch (error) {
      res.status(400).json({ message: "Invalid document data" });
    }
  });

  app.put("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const document = await storage.updateDocument(id, updates);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to update document" });
    }
  });

  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteDocument(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Document not found" });
      }

      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Template routes
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getAllTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.post("/api/templates", async (req, res) => {
    try {
      const templateData = insertTemplateSchema.parse(req.body);
      const template = await storage.createTemplate(templateData);
      res.json(template);
    } catch (error) {
      res.status(400).json({ message: "Invalid template data" });
    }
  });

  app.post("/api/templates/:id/use", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.incrementTemplateUsage(id);
      res.json({ message: "Template usage incremented" });
    } catch (error) {
      res.status(500).json({ message: "Failed to increment template usage" });
    }
  });

  // Effort estimation routes
  app.get("/api/effort-estimations/document/:documentId", async (req, res) => {
    try {
      const documentId = parseInt(req.params.documentId);
      const estimation = await storage.getEffortEstimationByDocument(documentId);
      res.json(estimation);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch effort estimation" });
    }
  });

  app.post("/api/effort-estimations", async (req, res) => {
    try {
      const estimationData = insertEffortEstimationSchema.parse(req.body);
      const estimation = await storage.createEffortEstimation(estimationData);
      res.json(estimation);
    } catch (error) {
      res.status(400).json({ message: "Invalid effort estimation data" });
    }
  });

  app.put("/api/effort-estimations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const estimation = await storage.updateEffortEstimation(id, updates);
      
      if (!estimation) {
        return res.status(404).json({ message: "Effort estimation not found" });
      }

      res.json(estimation);
    } catch (error) {
      res.status(500).json({ message: "Failed to update effort estimation" });
    }
  });

  // Chat routes
  app.get("/api/chat/sessions", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      const sessions = await storage.getChatSessionsByUser(userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chat sessions" });
    }
  });

  app.post("/api/chat/sessions", async (req, res) => {
    try {
      const sessionData = insertChatSessionSchema.parse(req.body);
      const session = await storage.createChatSession(sessionData);
      res.json(session);
    } catch (error) {
      res.status(400).json({ message: "Invalid chat session data" });
    }
  });

  app.post("/api/chat/message", async (req, res) => {
    try {
      const { sessionId, message } = req.body;
      const session = await storage.getChatSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Chat session not found" });
      }

      const messages = session.messages as any[] || [];
      messages.push({
        role: "user",
        content: message,
        timestamp: new Date()
      });

      // Mock AI response
      const aiResponse = generateMockAIResponse(message);
      messages.push({
        role: "assistant",
        content: aiResponse,
        timestamp: new Date()
      });

      await storage.updateChatSession(sessionId, { messages });
      res.json({ response: aiResponse });
    } catch (error) {
      res.status(500).json({ message: "Failed to process message" });
    }
  });

  // User management routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const sanitizedUsers = users.map(user => ({ ...user, password: undefined }));
      res.json(sanitizedUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const user = await storage.updateUser(id, updates);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteUser(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Excel Import route
  app.post("/api/documents/import-excel", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { authorId } = req.body;
      if (!authorId) {
        return res.status(400).json({ message: "Author ID is required" });
      }

      // Parse the Excel file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Parse the data and create SoW structure
      const documentStructure = parseExcelToSoW(data as any[][]);
      
      const document = await storage.createDocument({
        title: documentStructure.title,
        description: documentStructure.description,
        content: documentStructure.content,
        type: "sow",
        status: "draft",
        authorId: parseInt(authorId),
      });

      res.json(document);
    } catch (error) {
      console.error("Excel import error:", error);
      res.status(500).json({ message: "Failed to import Excel file" });
    }
  });

  // PDF Export route
  app.post("/api/documents/:id/export-pdf", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getDocument(id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${document.title}.pdf"`);
      
      doc.pipe(res);
      
      // Add document content to PDF
      doc.fontSize(20).text(document.title, 100, 100);
      doc.fontSize(12).text(document.description || '', 100, 130);
      
      // Add content from document structure
      const content = document.content as any;
      if (content && content.chapters) {
        let yPosition = 170;
        
        content.chapters.forEach((chapter: any, index: number) => {
          doc.fontSize(16).text(`${index + 1}. ${chapter.title}`, 100, yPosition);
          yPosition += 30;
          
          if (chapter.content) {
            doc.fontSize(12).text(chapter.content, 100, yPosition, { width: 400 });
            yPosition += 50;
          }
          
          if (chapter.subchapters) {
            chapter.subchapters.forEach((subchapter: any, subIndex: number) => {
              doc.fontSize(14).text(`${index + 1}.${subIndex + 1} ${subchapter.title}`, 120, yPosition);
              yPosition += 25;
              
              if (subchapter.content) {
                doc.fontSize(12).text(subchapter.content, 120, yPosition, { width: 380 });
                yPosition += 40;
              }
            });
          }
          
          yPosition += 20;
        });
      }
      
      doc.end();
    } catch (error) {
      res.status(500).json({ message: "Failed to export PDF" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function generateMockAIResponse(message: string): string {
  const responses = [
    "I can help you create a comprehensive SoW document. Let's start by defining the project scope and objectives.",
    "For a web development project, I recommend including these sections: Project Overview, Technical Requirements, Deliverables, Timeline, and Budget. Would you like me to create a template?",
    "Based on your requirements, I suggest breaking down the effort estimation into development phases: Planning (10-15%), Design (20-25%), Development (50-60%), Testing (10-15%), and Deployment (5-10%).",
    "I can help you structure your document with proper chapters and subsections. What type of project are you working on?",
    "Let me suggest some best practices for SoW documents: Be specific about deliverables, include clear acceptance criteria, define project scope boundaries, and establish communication protocols."
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

function parseExcelToSoW(data: any[][]): { title: string; description: string; content: any } {
  if (!data || data.length === 0) {
    throw new Error("Empty Excel file");
  }

  // Find the title (usually in the first few rows)
  let title = "Imported SoW Document";
  let description = "Imported from Excel file";
  
  // Look for title in first few rows
  for (let i = 0; i < Math.min(5, data.length); i++) {
    const row = data[i];
    if (row && row[0] && typeof row[0] === 'string' && row[0].trim()) {
      if (row[0].toLowerCase().includes('title') || row[0].toLowerCase().includes('project')) {
        title = row[1] ? String(row[1]).trim() : title;
      } else if (row[0].toLowerCase().includes('description')) {
        description = row[1] ? String(row[1]).trim() : description;
      }
    }
  }

  const chapters: any[] = [];
  let currentChapter: any = null;
  let chapterCounter = 1;
  let subChapterCounter = 1;

  // Parse the data starting from row 1 (skip headers)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0]) continue;

    const cellValue = String(row[0]).trim();
    const contentValue = row[1] ? String(row[1]).trim() : "";

    // Check if this is a new chapter (detect patterns like "1.", "Chapter 1", etc.)
    if (cellValue.match(/^(chapter\s*)?(\d+\.?\s*|[a-z]\.?\s*)/i) || 
        cellValue.toLowerCase().includes('overview') ||
        cellValue.toLowerCase().includes('requirement') ||
        cellValue.toLowerCase().includes('deliverable') ||
        cellValue.toLowerCase().includes('timeline') ||
        cellValue.toLowerCase().includes('budget')) {
      
      // Save previous chapter
      if (currentChapter) {
        chapters.push(currentChapter);
      }

      // Create new chapter
      currentChapter = {
        id: String(chapterCounter++),
        title: cellValue,
        content: contentValue,
        subchapters: []
      };
      subChapterCounter = 1;
    } else if (currentChapter && cellValue) {
      // Check if this is a subchapter (indented or numbered like 1.1, 1.2)
      if (cellValue.match(/^\s*(\d+\.\d+|[a-z]\)|•|-)/i) || cellValue.startsWith('  ')) {
        currentChapter.subchapters.push({
          id: `${currentChapter.id}.${subChapterCounter++}`,
          title: cellValue.replace(/^\s*(\d+\.\d+|[a-z]\)|•|-)\s*/i, ''),
          content: contentValue
        });
      } else {
        // Add to chapter content
        if (currentChapter.content) {
          currentChapter.content += '\n' + cellValue + (contentValue ? ': ' + contentValue : '');
        } else {
          currentChapter.content = cellValue + (contentValue ? ': ' + contentValue : '');
        }
      }
    }
  }

  // Add the last chapter
  if (currentChapter) {
    chapters.push(currentChapter);
  }

  // If no chapters were found, create a default structure
  if (chapters.length === 0) {
    chapters.push({
      id: "1",
      title: "Project Overview",
      content: data.slice(1).map(row => row.join(' ')).join('\n'),
      subchapters: []
    });
  }

  return {
    title,
    description,
    content: { chapters }
  };
}
