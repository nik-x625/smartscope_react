import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  X, 
  Save, 
  Eye, 
  Download, 
  Plus, 
  ChevronDown, 
  ChevronRight,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Image,
  Table,
  Link
} from "lucide-react";
import { Document } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DocumentEditorProps {
  open: boolean;
  onClose: () => void;
  document: Document | null;
}

interface Chapter {
  id: string;
  title: string;
  content: string;
  subchapters: SubChapter[];
  expanded?: boolean;
}

interface SubChapter {
  id: string;
  title: string;
  content: string;
}

export default function DocumentEditor({ open, onClose, document }: DocumentEditorProps) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapter, setActiveChapter] = useState<string | null>(null);
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentDescription, setDocumentDescription] = useState("");
  const [autoSaved, setAutoSaved] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (document) {
      setDocumentTitle(document.title);
      setDocumentDescription(document.description || "");
      
      const content = document.content as any;
      if (content && content.chapters) {
        setChapters(content.chapters.map((ch: any) => ({ ...ch, expanded: true })));
        if (content.chapters.length > 0) {
          setActiveChapter(content.chapters[0].id);
        }
      }
    }
  }, [document]);

  const updateDocumentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/documents/${document?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setAutoSaved(true);
      setTimeout(() => setAutoSaved(false), 2000);
    },
  });

  const exportPdfMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/documents/${document?.id}/export-pdf`, {
        method: "POST",
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to export PDF");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = `${documentTitle}.pdf`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        title: "PDF exported",
        description: "Your document has been exported successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Export failed",
        description: "Failed to export PDF. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!document) return;

    const updatedDocument = {
      title: documentTitle,
      description: documentDescription,
      content: { chapters },
    };

    updateDocumentMutation.mutate(updatedDocument);
  };

  const addChapter = () => {
    const newChapter: Chapter = {
      id: String(chapters.length + 1),
      title: `Chapter ${chapters.length + 1}`,
      content: "",
      subchapters: [],
      expanded: true,
    };
    setChapters([...chapters, newChapter]);
    setActiveChapter(newChapter.id);
  };

  const addSubChapter = (chapterId: string) => {
    const updatedChapters = chapters.map(chapter => {
      if (chapter.id === chapterId) {
        const newSubChapter: SubChapter = {
          id: `${chapterId}.${chapter.subchapters.length + 1}`,
          title: `Section ${chapterId}.${chapter.subchapters.length + 1}`,
          content: "",
        };
        return {
          ...chapter,
          subchapters: [...chapter.subchapters, newSubChapter],
        };
      }
      return chapter;
    });
    setChapters(updatedChapters);
  };

  const updateChapterTitle = (chapterId: string, title: string) => {
    const updatedChapters = chapters.map(chapter =>
      chapter.id === chapterId ? { ...chapter, title } : chapter
    );
    setChapters(updatedChapters);
  };

  const updateChapterContent = (chapterId: string, content: string) => {
    const updatedChapters = chapters.map(chapter =>
      chapter.id === chapterId ? { ...chapter, content } : chapter
    );
    setChapters(updatedChapters);
  };

  const toggleChapterExpansion = (chapterId: string) => {
    const updatedChapters = chapters.map(chapter =>
      chapter.id === chapterId ? { ...chapter, expanded: !chapter.expanded } : chapter
    );
    setChapters(updatedChapters);
  };

  const activeChapterData = chapters.find(ch => ch.id === activeChapter);

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0" aria-describedby="document-editor-description">
        <div className="flex h-[95vh]">
          {/* Sidebar */}
          <div className="w-64 bg-muted border-r flex flex-col">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Document Structure</h3>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-2">
                {chapters.map((chapter) => (
                  <div key={chapter.id}>
                    <div
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                        activeChapter === chapter.id ? "bg-primary/10 text-primary" : "hover:bg-muted-foreground/10"
                      }`}
                      onClick={() => setActiveChapter(chapter.id)}
                    >
                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleChapterExpansion(chapter.id);
                          }}
                        >
                          {chapter.expanded ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </Button>
                        <span className="text-sm truncate">{chapter.title}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          addSubChapter(chapter.id);
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {chapter.expanded && chapter.subchapters.map((subchapter) => (
                      <div
                        key={subchapter.id}
                        className="ml-6 p-2 text-sm text-muted-foreground hover:bg-muted-foreground/10 rounded cursor-pointer"
                        onClick={() => setActiveChapter(subchapter.id)}
                      >
                        {subchapter.title}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={addChapter}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Chapter
              </Button>
            </div>
          </div>

          {/* Editor Content */}
          <div className="flex-1 flex flex-col">
            {/* Toolbar */}
            <div className="bg-background border-b p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <Input
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                    className="text-xl font-semibold bg-transparent border-none focus:outline-none"
                  />
                  {autoSaved && (
                    <Badge variant="secondary" className="bg-green-100 text-green-600">
                      Auto-saved
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportPdfMutation.mutate()}
                    disabled={exportPdfMutation.isPending}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {exportPdfMutation.isPending ? "Exporting..." : "Export PDF"}
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={updateDocumentMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {updateDocumentMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>

              {/* WYSIWYG Toolbar */}
              <div className="editor-toolbar">
                <select className="px-2 py-1 border border-input rounded text-sm bg-background">
                  <option>Paragraph</option>
                  <option>Heading 1</option>
                  <option>Heading 2</option>
                </select>
                <Separator orientation="vertical" className="mx-2 h-6" />
                <Button variant="ghost" size="icon" className="toolbar-button">
                  <Bold className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="toolbar-button">
                  <Italic className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="toolbar-button">
                  <Underline className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="mx-2 h-6" />
                <Button variant="ghost" size="icon" className="toolbar-button">
                  <List className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="toolbar-button">
                  <ListOrdered className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="mx-2 h-6" />
                <Button variant="ghost" size="icon" className="toolbar-button">
                  <Image className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="toolbar-button">
                  <Table className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="toolbar-button">
                  <Link className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 bg-muted p-8 overflow-y-auto">
              <div className="max-w-4xl mx-auto bg-background shadow-lg rounded-lg min-h-[800px] p-8">
                {activeChapterData && (
                  <div className="space-y-6">
                    <Input
                      value={activeChapterData.title}
                      onChange={(e) => updateChapterTitle(activeChapterData.id, e.target.value)}
                      className="text-2xl font-bold border-none p-0 focus:ring-0"
                    />
                    
                    <Textarea
                      value={activeChapterData.content}
                      onChange={(e) => updateChapterContent(activeChapterData.id, e.target.value)}
                      placeholder="Start writing your content here..."
                      className="min-h-[400px] border-none p-0 resize-none focus:ring-0 text-base leading-relaxed"
                    />
                  </div>
                )}
                
                {!activeChapterData && (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <p className="text-lg mb-2">Select a chapter to start editing</p>
                      <p className="text-sm">Choose a chapter from the sidebar or create a new one</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
