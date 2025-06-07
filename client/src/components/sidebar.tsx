import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  File, 
  Menu, 
  FileText, 
  Layers, 
  Calculator, 
  MessageSquare, 
  Users 
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

const navigation = [
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Templates", href: "/templates", icon: Layers },
  { name: "Effort Estimation", href: "/effort-estimation", icon: Calculator },
  { name: "AI Assistant", href: "/chat", icon: MessageSquare },
  { name: "User Management", href: "/users", icon: Users },
];

export default function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [location] = useLocation();

  return (
    <div className={cn(
      "flex-shrink-0 bg-sidebar border-r border-sidebar-border transition-all duration-300",
      collapsed ? "w-16" : "w-64",
      className
    )}>
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <div className={cn(
          "flex items-center space-x-3",
          collapsed && "justify-center"
        )}>
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
            <File className="text-primary-foreground text-sm" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-sidebar-foreground">
              SoW Platform
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="hover:bg-sidebar-accent"
        >
          <Menu className="h-4 w-4 text-sidebar-foreground" />
        </Button>
      </div>

      <nav className="mt-6 px-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href || location.startsWith(item.href + "/");
          return (
            <Link key={item.name} href={item.href}>
              <a
                className={cn(
                  "nav-item flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200",
                  isActive
                    ? "active bg-primary/10 text-primary border-r-2 border-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  collapsed && "justify-center"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5",
                  isActive ? "text-primary" : "text-sidebar-foreground",
                  !collapsed && "mr-3"
                )} />
                {!collapsed && item.name}
              </a>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
