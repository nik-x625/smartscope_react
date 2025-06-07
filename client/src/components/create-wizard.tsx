import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { File, Calculator, ChevronRight } from "lucide-react";
import { insertDocumentSchema } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const createDocumentSchema = insertDocumentSchema.extend({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

type CreateDocumentForm = z.infer<typeof createDocumentSchema>;

interface CreateWizardProps {
  open: boolean;
  onClose: () => void;
  onDocumentCreated: (document: any) => void;
  currentUserId: number;
}

export default function CreateWizard({ open, onClose, onDocumentCreated, currentUserId }: CreateWizardProps) {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<"sow" | "effort-estimation" | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateDocumentForm>({
    resolver: zodResolver(createDocumentSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "sow",
      status: "draft",
      authorId: currentUserId,
      content: {},
    },
  });

  const createDocumentMutation = useMutation({
    mutationFn: async (data: CreateDocumentForm) => {
      const response = await apiRequest("POST", "/api/documents", data);
      return response.json();
    },
    onSuccess: (document) => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      onDocumentCreated(document);
      onClose();
      resetWizard();
      toast({
        title: "Document created",
        description: "Your document has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create document. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetWizard = () => {
    setStep(1);
    setSelectedType(null);
    form.reset();
  };

  const handleTypeSelection = (type: "sow" | "effort-estimation") => {
    setSelectedType(type);
    form.setValue("type", type);
    setStep(2);
  };

  const onSubmit = async (data: CreateDocumentForm) => {
    const documentData = {
      ...data,
      content: getDefaultContent(data.type),
    };
    createDocumentMutation.mutate(documentData);
  };

  const getDefaultContent = (type: string) => {
    if (type === "sow") {
      return {
        chapters: [
          {
            id: "1",
            title: "Project Overview",
            content: "",
            subchapters: [
              { id: "1.1", title: "Introduction", content: "" },
              { id: "1.2", title: "Objectives", content: "" },
            ],
          },
          {
            id: "2",
            title: "Technical Requirements",
            content: "",
            subchapters: [],
          },
          {
            id: "3",
            title: "Deliverables",
            content: "",
            subchapters: [],
          },
        ],
      };
    }
    return {
      chapters: [
        {
          id: "1",
          title: "Effort Breakdown",
          content: "",
          subchapters: [],
        },
      ],
    };
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Document</DialogTitle>
          <div className="flex items-center mt-4">
            <div className="flex items-center">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                1
              </div>
              <span className={`ml-2 text-sm font-medium ${
                step >= 1 ? "text-primary" : "text-muted-foreground"
              }`}>
                Document Type
              </span>
            </div>
            <ChevronRight className="h-4 w-4 mx-4 text-muted-foreground" />
            <div className="flex items-center">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                2
              </div>
              <span className={`ml-2 text-sm ${
                step >= 2 ? "text-primary font-medium" : "text-muted-foreground"
              }`}>
                Details
              </span>
            </div>
          </div>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Choose Document Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card
                className={`cursor-pointer transition-colors duration-200 hover:border-primary ${
                  selectedType === "sow" ? "border-primary bg-primary/5" : ""
                }`}
                onClick={() => handleTypeSelection("sow")}
              >
                <CardContent className="p-4">
                  <div className="flex items-center mb-2">
                    <File className="h-5 w-5 text-blue-500 mr-3" />
                    <span className="font-medium">Statement of Work</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Create a comprehensive SoW document with effort estimation
                  </p>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-colors duration-200 hover:border-primary ${
                  selectedType === "effort-estimation" ? "border-primary bg-primary/5" : ""
                }`}
                onClick={() => handleTypeSelection("effort-estimation")}
              >
                <CardContent className="p-4">
                  <div className="flex items-center mb-2">
                    <Calculator className="h-5 w-5 text-green-500 mr-3" />
                    <span className="font-medium">Effort Estimation</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Create standalone effort estimation document
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <h3 className="text-lg font-medium">Document Details</h3>
            
            <div className="space-y-2">
              <Label htmlFor="title">Document Title</Label>
              <Input
                id="title"
                placeholder="Enter document title"
                {...form.register("title")}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Enter document description"
                {...form.register("description")}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createDocumentMutation.isPending}
              >
                {createDocumentMutation.isPending ? "Creating..." : "Create Document"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
