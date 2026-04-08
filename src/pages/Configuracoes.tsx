import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";

const Configuracoes = () => {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-sm text-muted-foreground mt-1">Configurações gerais do sistema</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings size={18} />
              Perfil do Utilizador
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input defaultValue="Admin Distrital" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input defaultValue="admin@jimua.org" readOnly className="opacity-60" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Alterar Senha</Label>
              <Input type="password" placeholder="Nova senha" />
            </div>
            <Button className="bg-primary text-primary-foreground">Guardar Alterações</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Configuracoes;
