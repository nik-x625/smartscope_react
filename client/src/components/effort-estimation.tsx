import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Calculator, Save } from "lucide-react";
import { Document, EffortEstimation } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Chapter {
  id: string;
  title: string;
  hours: number;
  included: boolean;
}

interface EffortEstimationProps {
  currentUserId: number;
}

export default function EffortEstimationComponent({ currentUserId }: EffortEstimationProps) {
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const { data: effortEstimation } = useQuery<EffortEstimation | null>({
    queryKey: ["/api/effort-estimations/document", selectedDocumentId],
    enabled: !!selectedDocumentId,
  });

  const saveEstimationMutation = useMutation({
    mutationFn: async (data: any) => {
      if (effortEstimation) {
        const response = await apiRequest("PUT", `/api/effort-estimations/${effortEstimation.id}`, data);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/effort-estimations", data);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/effort-estimations/document", selectedDocumentId] });
      toast({
        title: "Estimation saved",
        description: "Your effort estimation has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save effort estimation. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Load chapters from selected document
  useEffect(() => {
    if (selectedDocumentId) {
      const document = documents.find(doc => doc.id === selectedDocumentId);
      if (document && document.content) {
        const content = document.content as any;
        if (content.chapters) {
          const documentChapters = content.chapters.map((chapter: any) => ({
            id: chapter.id,
            title: chapter.title,
            hours: 0,
            included: false,
          }));
          setChapters(documentChapters);
        }
      }
    } else {
      setChapters([]);
    }
  }, [selectedDocumentId, documents]);

  // Load existing effort estimation
  useEffect(() => {
    if (effortEstimation) {
      const estimationChapters = effortEstimation.chapters as any[];
      if (estimationChapters) {
        setChapters(estimationChapters);
        setTotalHours(effortEstimation.totalHours);
      }
    }
  }, [effortEstimation?.id]);

  // Calculate total hours when chapters change
  useEffect(() => {
    const total = chapters
      .filter(chapter => chapter.included)
      .reduce((sum, chapter) => sum + chapter.hours, 0);
    setTotalHours(total);
  }, [chapters]);

  const updateChapter = (chapterId: string, updates: Partial<Chapter>) => {
    setChapters(prev => prev.map(chapter =>
      chapter.id === chapterId ? { ...chapter, ...updates } : chapter
    ));
  };

  const addCustomChapter = () => {
    const newChapter: Chapter = {
      id: `custom-${Date.now()}`,
      title: "Custom Chapter",
      hours: 0,
      included: false,
    };
    setChapters(prev => [...prev, newChapter]);
  };

  const handleSave = () => {
    if (!selectedDocumentId) {
      toast({
        title: "No document selected",
        description: "Please select a document first.",
        variant: "destructive",
      });
      return;
    }

    const estimationData = {
      documentId: selectedDocumentId,
      chapters,
      totalHours,
    };

    saveEstimationMutation.mutate(estimationData);
  };

  const sowDocuments = documents.filter(doc => doc.type === "sow");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Effort Estimation</h2>
        <Button onClick={handleSave} disabled={saveEstimationMutation.isPending || !selectedDocumentId}>
          <Save className="h-4 w-4 mr-2" />
          {saveEstimationMutation.isPending ? "Saving..." : "Save Estimation"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="h-5 w-5 mr-2" />
            Document Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select SoW Document</label>
              <select
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                value={selectedDocumentId || ""}
                onChange={(e) => setSelectedDocumentId(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">Choose a document...</option>
                {sowDocuments.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title}
                  </option>
                ))}
              </select>
            </div>
            
            {selectedDocumentId && (
              <div className="text-sm text-muted-foreground">
                {documents.find(doc => doc.id === selectedDocumentId)?.description}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedDocumentId && (
        <Card>
          <CardHeader>
            <CardTitle>Chapter-based Effort Estimation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {chapters.map((chapter, index) => (
                <div
                  key={chapter.id}
                  className="flex items-center justify-between p-4 bg-muted rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={chapter.included}
                      onCheckedChange={(checked) =>
                        updateChapter(chapter.id, { included: !!checked })
                      }
                    />
                    <div className="flex-1">
                      {chapter.id.startsWith("custom-") ? (
                        <Input
                          value={chapter.title}
                          onChange={(e) =>
                            updateChapter(chapter.id, { title: e.target.value })
                          }
                          className="font-medium bg-background"
                        />
                      ) : (
                        <span className="font-medium">{chapter.title}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        min="0"
                        value={chapter.hours}
                        onChange={(e) =>
                          updateChapter(chapter.id, { hours: parseInt(e.target.value) || 0 })
                        }
                        className="w-20"
                        placeholder="Hours"
                      />
                      <span className="text-sm text-muted-foreground">hours</span>
                    </div>
                    
                    {chapter.included && (
                      <Badge variant="secondary" className="bg-green-100 text-green-600">
                        Included
                      </Badge>
                    )}
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={addCustomChapter}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Chapter
              </Button>

              <Separator />

              <div className="flex justify-between items-center pt-4">
                <span className="font-semibold text-foreground">Total Estimated Hours:</span>
                <div className="text-right">
                  <span className="text-2xl font-bold text-primary">{totalHours} hours</span>
                  {totalHours > 0 && (
                    <div className="text-sm text-muted-foreground">
                      ≈ {Math.ceil(totalHours / 8)} working days
                    </div>
                  )}
                </div>
              </div>

              {totalHours > 0 && (
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Effort Distribution
                  </h4>
                  <div className="space-y-2 text-sm">
                    {chapters
                      .filter(ch => ch.included && ch.hours > 0)
                      .map(chapter => (
                        <div key={chapter.id} className="flex justify-between">
                          <span className="text-blue-800 dark:text-blue-200">{chapter.title}:</span>
                          <span className="font-medium text-blue-900 dark:text-blue-100">
                            {chapter.hours}h ({Math.round((chapter.hours / totalHours) * 100)}%)
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
