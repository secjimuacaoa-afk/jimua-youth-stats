import { ReactNode, useState } from "react";
import AppSidebar from "./AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { diasParaFimSemestre, getSemestreCorrente } from "@/lib/semestre";
import { AlertCircle, Menu } from "lucide-react";
import NotificacoesOja from "./NotificacoesOja";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import logoJimua from "@/assets/logo-jimua.png";

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { profile, isAdmin, isSuperAdmin } = useAuth();
  const isLocal = !isAdmin && !isSuperAdmin && profile?.tipo === "local";
  const dias = diasParaFimSemestre();
  const { semestre, ano } = getSemestreCorrente();
  const [aberto, setAberto] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Painel fixo em ecrã grande */}
      <div className="hidden md:block h-screen">
        <AppSidebar />
      </div>

      <main className="flex-1 overflow-y-auto bg-background">
        {/* Barra superior em telemóvel */}
        <header className="app-topbar md:hidden sticky top-0 z-30 flex items-center gap-3 border-b bg-card px-3 py-2">
          <Sheet open={aberto} onOpenChange={setAberto}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir menu">
                <Menu size={22} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[260px] p-0 border-0">
              <AppSidebar mobile onNavigate={() => setAberto(false)} />
            </SheetContent>
          </Sheet>
          <img src={logoJimua} alt="JIMUA" className="h-7 w-7" />
          <span className="font-display text-sm font-bold truncate">JIMUA Analytics</span>
        </header>

        {isLocal && dias <= 30 && dias > 0 && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 sm:px-6 py-2 text-sm flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>
              O {semestre}º Semestre/{ano} termina em <strong>{dias} dias</strong>. Submeta o Mapa Estatístico antes do encerramento.
            </span>
          </div>
        )}
        {isLocal && (
          <div className="flex justify-end px-4 sm:px-6 pt-3">
            <NotificacoesOja />
          </div>
        )}
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
