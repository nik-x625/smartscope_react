import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Search, Grid, List, Upload } from "lucide-react";
import { Document } from "@shared/schema";
import { format } from "date-fns";

interface DocumentGridProps {
  onCreateDocument: () => void;
  onEditDocument: (document: Document) => void;
  onImportExcel: () => void;
}

export default function DocumentGrid({ onCreateDocument, onEditDocument, onImportExcel }: DocumentGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400";
      case "draft":
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400";
      case "review":
        return "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400";
      default:
        return "bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400";
    }
  };

  const getDocumentIcon = (type: string) => {
    const colorClass = type === "sow" ? "text-blue-500" : "text-purple-500";
    return <FileText className={`text-2xl ${colorClass}`} />;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-32 bg-muted" />
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-3 bg-muted rounded mb-2" />
                <div className="flex justify-between">
                  <div className="h-3 bg-muted rounded w-20" />
                  <div className="h-5 bg-muted rounded w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-foreground">All Documents</h2>
          <div className="flex items-center space-x-2">
            <Button
              variant={statusFilter === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter("all")}
            >
              All
            </Button>
            <Button
              variant={statusFilter === "draft" ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter("draft")}
            >
              Drafts
            </Button>
            <Button
              variant={statusFilter === "published" ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter("published")}
            >
              Published
            </Button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80"
            />
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode("grid")}
            className={viewMode === "grid" ? "bg-muted" : ""}
          >
            <Grid className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode("list")}
            className={viewMode === "list" ? "bg-muted" : ""}
          >
            <List className="h-4 w-4" />
          </Button>
          
          <Button onClick={onImportExcel} variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import Excel
          </Button>
          <Button onClick={onCreateDocument}>
            <Plus className="h-4 w-4 mr-2" />
            New Document
          </Button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDocuments.map((document) => (
            <Card
              key={document.id}
              className="document-card cursor-pointer overflow-hidden hover:shadow-lg transition-shadow duration-200"
              onClick={() => onEditDocument(document)}
            >
              <div className="h-32 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                {getDocumentIcon(document.type)}
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium text-foreground mb-1 truncate">
                  {document.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {document.description || "No description"}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {document.updatedAt ? format(new Date(document.updatedAt), "MMM d, yyyy") : ""}
                  </span>
                  <Badge className={getStatusColor(document.status)}>
                    {document.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Add Document Card */}
          <Card
            className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors duration-200 cursor-pointer flex items-center justify-center h-48"
            onClick={onCreateDocument}
          >
            <div className="text-center">
              <Plus className="h-8 w-8 text-muted-foreground mb-2 mx-auto" />
              <p className="text-sm text-muted-foreground">Create new document</p>
            </div>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDocuments.map((document) => (
            <Card
              key={document.id}
              className="cursor-pointer hover:shadow-md transition-shadow duration-200"
              onClick={() => onEditDocument(document)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-700 dark:to-slate-600 rounded-lg flex items-center justify-center">
                      {getDocumentIcon(document.type)}
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{document.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {document.description || "No description"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-muted-foreground">
                      {document.updatedAt ? format(new Date(document.updatedAt), "MMM d, yyyy") : ""}
                    </span>
                    <Badge className={getStatusColor(document.status)}>
                      {document.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
