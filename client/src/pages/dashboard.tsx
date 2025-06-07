import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Moon, Sun, Search, ChevronDown } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { User, Document, Template } from "@shared/schema";
import Sidebar from "@/components/sidebar";
import DocumentGrid from "@/components/document-grid";
import CreateWizard from "@/components/create-wizard";
import DocumentEditor from "@/components/document-editor";
import ExcelImport from "@/components/excel-import";
import Templates from "@/components/templates";
import EffortEstimation from "@/components/effort-estimation";
import AiChat from "@/components/ai-chat";
import UserManagement from "@/components/user-management";

interface DashboardProps {
  user: User;
  onLogout: () => void;
  initialSection?: string;
}

export default function Dashboard({ user, onLogout, initialSection = "documents" }: DashboardProps) {
  const [activeSection, setActiveSection] = useState(initialSection);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case "documents":
        return "Documents";
      case "templates":
        return "Templates";
      case "effort-estimation":
        return "Effort Estimation";
      case "chat":
        return "AI Assistant";
      case "users":
        return "User Management";
      default:
        return "Dashboard";
    }
  };

  const handleCreateDocument = () => {
    setShowCreateWizard(true);
  };

  const handleImportExcel = () => {
    setShowExcelImport(true);
  };

  const handleEditDocument = (document: Document) => {
    setEditingDocument(document);
  };

  const handleDocumentCreated = (document: Document) => {
    setEditingDocument(document);
  };

  const handleUseTemplate = (template: Template) => {
    // Create a new document from template
    const templateDocument: Document = {
      id: 0, // Will be set by backend
      title: `${template.name} - Copy`,
      description: template.description || "",
      content: template.content,
      type: template.type,
      status: "draft",
      authorId: user.id,
      templateId: template.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setEditingDocument(templateDocument);
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-foreground">
                {getSectionTitle()}
              </h1>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="hover:bg-accent"
              >
                {theme === "light" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 hover:bg-accent">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {getUserInitials(user.username)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{user.username}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onLogout}>
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          {activeSection === "documents" && (
            <DocumentGrid
              onCreateDocument={handleCreateDocument}
              onEditDocument={handleEditDocument}
              onImportExcel={handleImportExcel}
            />
          )}
          
          {activeSection === "templates" && (
            <Templates
              currentUserId={user.id}
              onUseTemplate={handleUseTemplate}
            />
          )}
          
          {activeSection === "effort-estimation" && (
            <EffortEstimation currentUserId={user.id} />
          )}
          
          {activeSection === "chat" && (
            <AiChat currentUserId={user.id} />
          )}
          
          {activeSection === "users" && (
            <UserManagement currentUserId={user.id} />
          )}
        </main>
      </div>

      {/* Modals */}
      <CreateWizard
        open={showCreateWizard}
        onClose={() => setShowCreateWizard(false)}
        onDocumentCreated={handleDocumentCreated}
        currentUserId={user.id}
      />

      <ExcelImport
        open={showExcelImport}
        onClose={() => setShowExcelImport(false)}
        onDocumentCreated={handleDocumentCreated}
        currentUserId={user.id}
      />

      <DocumentEditor
        open={!!editingDocument}
        onClose={() => setEditingDocument(null)}
        document={editingDocument}
      />
    </div>
  );
}
