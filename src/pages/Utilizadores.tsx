import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Shield, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const mockUsers = [
  { id: "1", nome: "Admin Distrital", email: "admin@jimua.org", tipo: "admin", estrutura: "—", activo: true },
  { id: "2", nome: "João Secretário", email: "joao@jimua.org", tipo: "local", estrutura: "Igreja Bom Pastor", activo: true },
  { id: "3", nome: "Maria Secretária", email: "maria@jimua.org", tipo: "local", estrutura: "Igreja Esperança", activo: true },
  { id: "4", nome: "Pedro Local", email: "pedro@jimua.org", tipo: "local", estrutura: "Igreja Nova Aliança", activo: false },
];

const Utilizadores = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestão de Utilizadores</h1>
            <p className="text-sm text-muted-foreground mt-1">Apenas o Secretário Distrital pode criar utilizadores</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-navy-dark">
                <UserPlus size={18} className="mr-2" />
                Criar Utilizador
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Criar Novo Utilizador</DialogTitle>
              </DialogHeader>
              <form
                className="space-y-4 mt-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  setDialogOpen(false);
                  toast({ title: "Utilizador criado", description: "As credenciais foram geradas." });
                }}
              >
                <div className="space-y-2">
                  <Label>Nome Completo *</Label>
                  <Input placeholder="Nome do utilizador" required />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" placeholder="email@jimua.org" required />
                </div>
                <div className="space-y-2">
                  <Label>Senha *</Label>
                  <Input type="password" placeholder="Mínimo 8 caracteres" required />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Utilizador *</Label>
                  <Select required>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Secretário Local</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Intendência *</Label>
                  <Select required>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="norte">Intendência Norte</SelectItem>
                      <SelectItem value="sul">Intendência Sul</SelectItem>
                      <SelectItem value="centro">Intendência Centro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Circuito *</Label>
                  <Select required>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="luanda">Circuito Luanda</SelectItem>
                      <SelectItem value="lubango">Circuito Lubango</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cargo Pastoral *</Label>
                  <Select required>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bompastor">Igreja Bom Pastor</SelectItem>
                      <SelectItem value="esperanca">Igreja Esperança</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" className="bg-primary text-primary-foreground">Criar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{mockUsers.length} utilizadores</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estrutura</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.nome}</TableCell>
                      <TableCell className="text-sm">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={u.tipo === "admin" ? "default" : "secondary"}>
                          {u.tipo === "admin" ? <Shield size={12} className="mr-1" /> : <User size={12} className="mr-1" />}
                          {u.tipo === "admin" ? "Distrital" : "Local"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{u.estrutura}</TableCell>
                      <TableCell>
                        <Badge variant={u.activo ? "default" : "destructive"}>
                          {u.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Utilizadores;
