import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  Heart, 
  HandHeart, 
  DollarSign, 
  FolderOpen,
  BookOpen,
  TrendingUp,
  Receipt,
  CreditCard,
  Building2
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Projetos", href: "/projects", icon: FolderOpen },
  { name: "Pessoas Atendidas", href: "/beneficiaries", icon: Users },
  { name: "Voluntários", href: "/volunteers", icon: HandHeart },
  { name: "Doadores", href: "/donors", icon: Heart },
  { name: "Doações", href: "/donations", icon: DollarSign },
  { name: "Capacitação", href: "/courses", icon: BookOpen },
  { 
    name: "Financeiro", 
    href: "/financial", 
    icon: TrendingUp,
    children: [
      { name: "Contas a Receber", href: "/accounts-receivable", icon: Receipt },
      { name: "Contas a Pagar", href: "/accounts-payable", icon: CreditCard },
      { name: "Relatórios", href: "/reports", icon: TrendingUp },
      { name: "Financiadores", href: "/funders", icon: Building2 },
    ]
  },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
        <nav className="flex-1 space-y-1 px-2">
          {navigation.map((item) => {
            const isActive = location === item.href || 
                           (item.children && item.children.some(child => location === child.href));
            
            if (item.children) {
              return (
                <div key={item.name} className="space-y-1">
                  <div className={cn(
                    "flex items-center px-2 py-2 text-sm font-medium rounded-md",
                    isActive 
                      ? "bg-blue-50 text-blue-700" 
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}>
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </div>
                  <div className="ml-8 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.name}
                        href={child.href}
                        className={cn(
                          "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                          location === child.href
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        )}
                      >
                        <child.icon className="mr-3 h-4 w-4" />
                        {child.name}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                  location === item.href
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}