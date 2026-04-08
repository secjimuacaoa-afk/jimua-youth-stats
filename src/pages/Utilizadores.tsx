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
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const Utilizadores = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [tipo, setTipo] = useState("local");
  const [estruturaId, setEstruturaId] = useState("");
  const { toast } = useToast();
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: estruturas = [] } = useQuery({
    queryKey: ["estruturas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("estruturas").select("*").order("intendencia");
      if (error) throw error;
      return data;
    },
  });

  const { data: userEstruturas = [] } = useQuery({
    queryKey: ["all-user-estruturas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_estruturas").select("user_id, estrutura_id, estruturas(intendencia, circuito, cargo_pastoral)");
      if (error) throw error;
      return data;
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: { email, password: senha, nome_completo: nome, tipo, estrutura_id: tipo === "local" ? estruturaId : null },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast({ title: "Utilizador criado", description: "As credenciais foram geradas com sucesso." });
      setDialogOpen(false);
      setNome(""); setEmail(""); setSenha(""); setTipo("local"); setEstruturaId("");
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const getEstrutura = (userId: string) => {
    const ue = userEstruturas.find((u: any) => u.user_id === userId);
    if (!ue || !ue.estruturas) return "—";
    const e = ue.estruturas as any;
    return e.cargo_pastoral;
  };

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
              <form className="space-y-4 mt-2" onSubmit={(e) => { e.preventDefault(); createUserMutation.mutate(); }}>
                <div className="space-y-2">
                  <Label>Nome Completo *</Label>
                  <Input placeholder="Nome do utilizador" value={nome} onChange={(e) => setNome(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" placeholder="email@jimua.org" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Senha *</Label>
                  <Input type="password" placeholder="Mínimo 6 caracteres" value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={6} />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Utilizador *</Label>
                  <Select value={tipo} onValueChange={setTipo}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Secretário Local</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {tipo === "local" && (
                  <div className="space-y-2">
                    <Label>Estrutura (Cargo Pastoral) *</Label>
                    <Select value={estruturaId} onValueChange={setEstruturaId} required>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {estruturas.map((e: any) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.intendencia} → {e.circuito} → {e.cargo_pastoral}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" className="bg-primary text-primary-foreground" disabled={createUserMutation.isPending}>
                    {createUserMutation.isPending ? "Criando..." : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{profiles.length} utilizadores</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estrutura</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8">Carregando...</TableCell></TableRow>
                  ) : profiles.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum utilizador</TableCell></TableRow>
                  ) : (
                    profiles.map((u: any) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.nome_completo}</TableCell>
                        <TableCell>
                          <Badge variant={u.tipo === "admin" ? "default" : "secondary"}>
                            {u.tipo === "admin" ? <Shield size={12} className="mr-1" /> : <User size={12} className="mr-1" />}
                            {u.tipo === "admin" ? "Distrital" : "Local"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{getEstrutura(u.id)}</TableCell>
                        <TableCell>
                          <Badge variant={u.activo ? "default" : "destructive"}>
                            {u.activo ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
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
