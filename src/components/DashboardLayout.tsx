import { ReactNode } from "react";
import AppSidebar from "./AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { diasParaFimSemestre, getSemestreCorrente } from "@/lib/semestre";
import { AlertCircle } from "lucide-react";
import NotificacoesOja from "./NotificacoesOja";

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { profile, isAdmin, isSuperAdmin } = useAuth();
  const isLocal = !isAdmin && !isSuperAdmin && profile?.tipo === "local";
  const dias = diasParaFimSemestre();
  const { semestre, ano } = getSemestreCorrente();

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        {isLocal && dias <= 30 && dias > 0 && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-6 py-2 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            <span>
              O {semestre}º Semestre/{ano} termina em <strong>{dias} dias</strong>. Submeta o Mapa Estatístico antes do encerramento.
            </span>
          </div>
        )}
        {isLocal && (
          <div className="flex justify-end px-6 pt-3">
            <NotificacoesOja />
          </div>
        )}
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
