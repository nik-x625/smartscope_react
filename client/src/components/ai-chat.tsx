import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Bot, User, Send, RefreshCw } from "lucide-react";
import { ChatSession } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AiChatProps {
  currentUserId: number;
}

export default function AiChat({ currentUserId }: AiChatProps) {
  const [currentMessage, setCurrentMessage] = useState("");
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: chatSessions = [] } = useQuery<ChatSession[]>({
    queryKey: ["/api/chat/sessions", { userId: currentUserId }],
  });

  const createChatMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/chat/sessions", {
        userId: currentUserId,
        title: "New Chat Session",
        messages: [],
      });
      return response.json();
    },
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions"] });
      setActiveChatId(newSession.id);
      setMessages([]);
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!activeChatId) {
        throw new Error("No active chat session");
      }
      
      const response = await apiRequest("POST", "/api/chat/message", {
        sessionId: activeChatId,
        message,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions"] });
      // Messages are updated in the mutation function below
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !activeChatId) return;

    const userMessage: Message = {
      role: "user",
      content: currentMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage("");

    try {
      const response = await sendMessageMutation.mutateAsync(currentMessage);
      
      const assistantMessage: Message = {
        role: "assistant",
        content: response.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      // Error is handled in the mutation
    }
  };

  const handleNewChat = () => {
    createChatMutation.mutate();
  };

  const loadChatSession = (session: ChatSession) => {
    setActiveChatId(session.id);
    const sessionMessages = (session.messages as any[]) || [];
    setMessages(sessionMessages);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-create first chat session if none exists
  useEffect(() => {
    if (chatSessions.length === 0 && !createChatMutation.isPending) {
      handleNewChat();
    } else if (chatSessions.length > 0 && !activeChatId) {
      loadChatSession(chatSessions[0]);
    }
  }, [chatSessions]);

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">AI Assistant</h2>
        <Button onClick={handleNewChat} disabled={createChatMutation.isPending}>
          <RefreshCw className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      <div className="flex-1 flex gap-4">
        {/* Chat Sessions Sidebar */}
        <div className="w-64 space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Recent Chats</h3>
          {chatSessions.map((session) => (
            <Card
              key={session.id}
              className={`cursor-pointer transition-colors duration-200 ${
                activeChatId === session.id ? "border-primary bg-primary/5" : "hover:bg-muted"
              }`}
              onClick={() => loadChatSession(session)}
            >
              <CardContent className="p-3">
                <p className="text-sm font-medium truncate">{session.title}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(session.updatedAt), "MMM d, HH:mm")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chat Interface */}
        <Card className="flex-1 flex flex-col">
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <Bot className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <h3 className="text-lg font-medium mb-2">AI Assistant</h3>
                    <p className="text-sm">
                      Hello! I'm here to help you create SoW documents and effort estimations.
                      What would you like to work on today?
                    </p>
                  </div>
                )}

                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex items-start space-x-3 ${
                      message.role === "user" ? "flex-row-reverse space-x-reverse" : ""
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === "assistant" 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {message.role === "assistant" ? (
                        <Bot className="h-4 w-4" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                    
                    <div className={`rounded-lg p-3 max-w-[70%] ${
                      message.role === "assistant"
                        ? "bg-muted"
                        : "bg-primary text-primary-foreground"
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-1 opacity-70 ${
                        message.role === "assistant" ? "text-muted-foreground" : "text-primary-foreground/70"
                      }`}>
                        {format(new Date(message.timestamp), "HH:mm")}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Type your message..."
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={sendMessageMutation.isPending || !activeChatId}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim() || sendMessageMutation.isPending || !activeChatId}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              {sendMessageMutation.isPending && (
                <div className="flex items-center space-x-2 mt-2">
                  <div className="h-2 w-2 bg-primary rounded-full animate-bounce" />
                  <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                  <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  <span className="text-xs text-muted-foreground ml-2">AI is typing...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
