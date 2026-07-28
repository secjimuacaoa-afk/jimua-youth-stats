import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Church, UserCog, BarChart3, Settings, LogOut, ChevronLeft, ChevronRight,
  Contact2, ArrowLeftRight, CalendarCheck, Activity, ClipboardList, FileSpreadsheet, BookOpen,
} from "lucide-react";
import { useState } from "react";
import logoJimua from "@/assets/logo-jimua.png";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const AppSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, isAdmin, isSuperAdmin, profile } = useAuth();
  const isLocal = !isAdmin && !isSuperAdmin && profile?.tipo === "local";
  const isDistrital = profile?.tipo === "admin" || isSuperAdmin;

  const links = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/jovens", icon: Users, label: "Jovens" },
    ...(isLocal ? [{ to: "/classes", icon: BookOpen, label: "Classes" }] : []),
    ...(isLocal ? [{ to: "/ocorrencias", icon: ArrowLeftRight, label: "Ocorrências" }] : []),
    ...(isLocal ? [{ to: "/frequencia", icon: Activity, label: "Frequência" }] : []),
    ...(isLocal ? [{ to: "/actividades", icon: ClipboardList, label: "Actividades" }] : []),
    ...(isDistrital ? [{ to: "/assembleias", icon: CalendarCheck, label: "Assembleias" }] : []),
    { to: "/mapa-estatistico", icon: FileSpreadsheet, label: "Mapa Estatístico" },
    ...(isAdmin ? [{ to: "/estruturas", icon: Church, label: "Estruturas" }] : []),
    { to: "/contactos", icon: Contact2, label: "Contactos" },
    ...(isAdmin ? [{ to: "/utilizadores", icon: UserCog, label: "Utilizadores" }] : []),
    { to: "/estatisticas", icon: BarChart3, label: "Estatísticas" },
    { to: "/configuracoes", icon: Settings, label: "Configurações" },
  ];

  const handleLogout = async () => { await signOut(); navigate("/"); };

  return (
    <aside className={cn(
      "h-screen bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 border-r border-sidebar-border",
      collapsed ? "w-[70px]" : "w-[250px]"
    )}>
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <img src={logoJimua} alt="JIMUA" className="h-10 w-10 flex-shrink-0" />
        {!collapsed && (
          <div className="overflow-hidden">
            <h2 className="text-sm font-bold text-sidebar-primary truncate">JIMUA ANALYTICS</h2>
            <p className="text-xs text-sidebar-foreground/60 truncate">
              {profile?.nome_completo || "Sistema Estatístico"}
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto">
        {links.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <NavLink key={link.to} to={link.to} className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}>
              <link.icon size={18} className="flex-shrink-0" />
              {!collapsed && <span className="truncate">{link.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-2 space-y-1">
        <button onClick={() => setCollapsed(!collapsed)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground w-full transition-colors">
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          {!collapsed && <span>Recolher</span>}
        </button>
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-destructive hover:text-destructive-foreground w-full transition-colors">
          <LogOut size={20} className="flex-shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
