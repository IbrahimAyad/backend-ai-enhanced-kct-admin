import { useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import { 
  BarChart3, 
  Package, 
  Users, 
  ShoppingCart, 
  Crown, 
  Star, 
  Search, 
  Settings,
  ChevronRight,
  TrendingUp,
  Database,
  UserCheck,
  Calendar,
  FileText,
  Zap,
  CreditCard,
  Layers,
  Brain,
  Target,
  DollarSign,
  TestTube,
  Package2
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const navigationItems = [
  {
    title: "Overview",
    items: [
      { title: "Dashboard", url: "/admin", icon: BarChart3, badge: null },
      { title: "Analytics", url: "/admin/analytics", icon: TrendingUp, badge: "New" },
    ]
  },
  {
    title: "Business Operations",
    items: [
      { title: "Products", url: "/admin/products", icon: Package, badge: null },
      { title: "Collections", url: "/admin/collections", icon: Layers, badge: "New" },
      { title: "Orders", url: "/admin/orders", icon: ShoppingCart, badge: "12" },
      { title: "Stripe Orders", url: "/admin/stripe-orders", icon: CreditCard, badge: "New" },
      { title: "Data Management", url: "/admin/data", icon: Database, badge: "Real Data" },
      { title: "Customers", url: "/admin/customers", icon: Users, badge: null },
      { title: "Inventory", url: "/admin/inventory", icon: Database, badge: null },
    ]
  },
  {
    title: "Specialized Services",
    items: [
      { title: "Weddings", url: "/admin/weddings", icon: Crown, badge: null },
      { title: "Events", url: "/admin/events", icon: Calendar, badge: "3" },
      { title: "Custom Orders", url: "/admin/custom-orders", icon: UserCheck, badge: null },
    ]
  },
  {
    title: "Business Intelligence",
    items: [
      { title: "Reviews", url: "/admin/reviews", icon: Star, badge: null },
      { title: "Search Analytics", url: "/admin/search", icon: Search, badge: null },
      { title: "Reports", url: "/admin/reports", icon: FileText, badge: null },
      { title: "Email Analytics", url: "/admin/email-analytics", icon: TrendingUp, badge: "New" },
      { title: "Revenue Forecast", url: "/admin/revenue-forecast", icon: DollarSign, badge: "New" },
    ]
  },
  {
    title: "Advanced Features",
    items: [
      { title: "AI Recommendations", url: "/admin/ai-recommendations", icon: Brain, badge: "AI" },
      { title: "Predictive Analytics", url: "/admin/predictive-analytics", icon: Target, badge: "AI" },
      { title: "Customer LTV", url: "/admin/customer-lifetime-value", icon: DollarSign, badge: "New" },
      { title: "A/B Testing", url: "/admin/ab-testing", icon: TestTube, badge: "New" },
      { title: "Inventory Forecast", url: "/admin/inventory-forecasting", icon: Package2, badge: "AI" },
      { title: "Automation", url: "/admin/automation", icon: Zap, badge: "New" },
    ]
  },
  {
    title: "System",
    items: [
      { title: "Integrations", url: "/admin/integrations", icon: Zap, badge: null },
      { title: "Settings", url: "/admin/settings", icon: Settings, badge: null },
    ]
  }
]

export function AdminSidebar() {
  const { state } = useSidebar()
  const collapsed = state === "collapsed"
  const location = useLocation()
  const currentPath = location.pathname

  const isActive = (path: string) => {
    if (path === '/admin') {
      return currentPath === '/admin'
    }
    return currentPath.startsWith(path)
  }

  const getNavCls = (path: string) => cn(
    "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
    "hover:bg-accent/50 hover:text-accent-foreground",
    isActive(path) 
      ? "bg-accent text-accent-foreground shadow-sm" 
      : "text-muted-foreground hover:text-foreground"
  )

  return (
    <Sidebar
      className={cn(
        "border-r border-border/40 bg-card/30 backdrop-blur-sm",
        collapsed ? "w-16" : "w-72"
      )}
    >
      {/* Header */}
      <div className={cn(
        "flex items-center gap-3 border-b border-border/40 px-4 py-4",
        collapsed && "justify-center px-2"
      )}>
        {!collapsed && (
          <>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Crown className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-sm font-semibold tracking-tight">KCT Admin</h2>
              <p className="text-xs text-muted-foreground">Business Center</p>
            </div>
          </>
        )}
        <SidebarTrigger className={cn(
          "ml-auto h-6 w-6 text-muted-foreground transition-colors hover:text-foreground",
          collapsed && "ml-0"
        )} />
      </div>

      <SidebarContent className="px-3 py-4">
        {navigationItems.map((section, index) => (
          <SidebarGroup key={index} className="mb-6">
            {!collapsed && (
              <SidebarGroupLabel className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                {section.title}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="p-0">
                      <NavLink to={item.url} className={getNavCls(item.url)}>
                        <item.icon className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          isActive(item.url) && "text-accent-foreground"
                        )} />
                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate">{item.title}</span>
                            {item.badge && (
                              <Badge 
                                variant={item.badge === "New" ? "default" : "secondary"} 
                                className="h-5 px-1.5 text-xs"
                              >
                                {item.badge}
                              </Badge>
                            )}
                            {isActive(item.url) && (
                              <ChevronRight className="h-3 w-3 opacity-60" />
                            )}
                          </>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-border/40 p-4">
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <UserCheck className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Administrator</p>
              <p className="text-xs text-muted-foreground">admin@kctmenswear.com</p>
            </div>
          </div>
        </div>
      )}
    </Sidebar>
  )
}