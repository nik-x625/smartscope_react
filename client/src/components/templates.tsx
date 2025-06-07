import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Code, FileText, Calculator } from "lucide-react";
import { Template } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TemplatesProps {
  currentUserId: number;
  onUseTemplate: (template: Template) => void;
}

export default function Templates({ currentUserId, onUseTemplate }: TemplatesProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    type: "sow",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery<Template[]>({
    queryKey: ["/api/templates"],
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: any) => {
      const response = await apiRequest("POST", "/api/templates", {
        ...templateData,
        authorId: currentUserId,
        content: getDefaultTemplateContent(templateData.type),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      setShowCreateDialog(false);
      setNewTemplate({ name: "", description: "", type: "sow" });
      toast({
        title: "Template created",
        description: "Your template has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create template. Please try again.",
        variant: "destructive",
      });
    },
  });

  const useTemplateMutation = useMutation({
    mutationFn: async (templateId: number) => {
      const response = await apiRequest("POST", `/api/templates/${templateId}/use`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
    },
  });

  const getDefaultTemplateContent = (type: string) => {
    if (type === "sow") {
      return {
        chapters: [
          {
            id: "1",
            title: "Project Overview",
            content: "This section provides an overview of the project including background, objectives, and scope.",
            subchapters: [
              { id: "1.1", title: "Introduction", content: "Project introduction and context." },
              { id: "1.2", title: "Objectives", content: "Clear project objectives and goals." },
              { id: "1.3", title: "Scope", content: "Project scope and boundaries." },
            ],
          },
          {
            id: "2",
            title: "Technical Requirements",
            content: "Detailed technical requirements and specifications.",
            subchapters: [
              { id: "2.1", title: "System Architecture", content: "High-level system architecture." },
              { id: "2.2", title: "Technology Stack", content: "Technologies to be used." },
              { id: "2.3", title: "Performance Requirements", content: "Performance criteria and benchmarks." },
            ],
          },
          {
            id: "3",
            title: "Deliverables",
            content: "Project deliverables and acceptance criteria.",
            subchapters: [
              { id: "3.1", title: "Primary Deliverables", content: "Main project outputs." },
              { id: "3.2", title: "Documentation", content: "Required documentation." },
              { id: "3.3", title: "Acceptance Criteria", content: "Criteria for deliverable acceptance." },
            ],
          },
          {
            id: "4",
            title: "Timeline and Milestones",
            content: "Project timeline with key milestones.",
            subchapters: [
              { id: "4.1", title: "Project Phases", content: "Major project phases." },
              { id: "4.2", title: "Key Milestones", content: "Important project milestones." },
              { id: "4.3", title: "Dependencies", content: "Project dependencies and risks." },
            ],
          },
          {
            id: "5",
            title: "Budget and Resources",
            content: "Project budget and resource requirements.",
            subchapters: [
              { id: "5.1", title: "Budget Breakdown", content: "Detailed budget breakdown." },
              { id: "5.2", title: "Resource Allocation", content: "Team and resource requirements." },
              { id: "5.3", title: "Payment Terms", content: "Payment schedule and terms." },
            ],
          },
        ],
      };
    }
    
    return {
      chapters: [
        {
          id: "1",
          title: "Effort Breakdown Structure",
          content: "Detailed breakdown of effort estimation by project phases.",
          subchapters: [
            { id: "1.1", title: "Planning Phase", content: "10-15% of total effort" },
            { id: "1.2", title: "Design Phase", content: "20-25% of total effort" },
            { id: "1.3", title: "Development Phase", content: "50-60% of total effort" },
            { id: "1.4", title: "Testing Phase", content: "10-15% of total effort" },
            { id: "1.5", title: "Deployment Phase", content: "5-10% of total effort" },
          ],
        },
      ],
    };
  };

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case "sow":
        return <Code className="h-6 w-6 text-blue-600" />;
      case "effort-estimation":
        return <Calculator className="h-6 w-6 text-green-600" />;
      default:
        return <FileText className="h-6 w-6 text-gray-600" />;
    }
  };

  const handleUseTemplate = (template: Template) => {
    useTemplateMutation.mutate(template.id);
    onUseTemplate(template);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-10 bg-muted rounded mb-4" />
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-3 bg-muted rounded mb-4" />
                <div className="flex justify-between">
                  <div className="h-3 bg-muted rounded w-20" />
                  <div className="h-8 bg-muted rounded w-24" />
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
        <h2 className="text-lg font-semibold text-foreground">Document Templates</h2>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center mr-3">
                  {getTemplateIcon(template.type)}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{template.name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {template.type === "sow" ? "SoW Template" : "Effort Estimation"}
                  </Badge>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {template.description}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Used {template.usageCount || 0} times
                </span>
                <Button
                  size="sm"
                  onClick={() => handleUseTemplate(template)}
                  disabled={useTemplateMutation.isPending}
                >
                  Use Template
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Template Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                placeholder="Enter template name"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-description">Description</Label>
              <Textarea
                id="template-description"
                placeholder="Enter template description"
                value={newTemplate.description}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-type">Template Type</Label>
              <select
                id="template-type"
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                value={newTemplate.type}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="sow">Statement of Work</option>
                <option value="effort-estimation">Effort Estimation</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => createTemplateMutation.mutate(newTemplate)}
                disabled={!newTemplate.name || createTemplateMutation.isPending}
              >
                {createTemplateMutation.isPending ? "Creating..." : "Create Template"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
