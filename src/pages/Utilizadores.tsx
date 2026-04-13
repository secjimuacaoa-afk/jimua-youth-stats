import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Shield, User, Crown } from "lucide-react";
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
  const [igrejaId, setIgrejaId] = useState("");
  const [distritoId, setDistritoId] = useState("");
  const { toast } = useToast();
  const { session, isSuperAdmin, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: igrejas = [] } = useQuery({
    queryKey: ["igrejas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("igrejas").select("*, circuitos(nome, intendencias(nome))").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: distritos = [] } = useQuery({
    queryKey: ["distritos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("distritos").select("*").order("nome");
      if (error) throw error;
      return data;
    },
    enabled: isSuperAdmin,
  });

  const { data: userEstruturas = [] } = useQuery({
    queryKey: ["all-user-estruturas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_estruturas").select("user_id, igreja_id, distrito_id, igrejas(nome)");
      if (error) throw error;
      return data;
    },
  });

  const occupiedChurchIds = useMemo(() => {
    const localProfileIds = profiles.filter((p: any) => p.tipo === "local").map((p: any) => p.id);
    return userEstruturas
      .filter((ue: any) => localProfileIds.includes(ue.user_id) && ue.igreja_id)
      .map((ue: any) => ue.igreja_id);
  }, [profiles, userEstruturas]);

  const availableIgrejas = useMemo(() => {
    return igrejas.filter((i: any) => !occupiedChurchIds.includes(i.id));
  }, [igrejas, occupiedChurchIds]);

  // Determine which user types the current user can create
  const allowedTypes = useMemo(() => {
    if (isSuperAdmin) return [
      { value: "admin", label: "Secretário Distrital" },
      { value: "local", label: "Secretário Local" },
    ];
    if (isAdmin) return [
      { value: "local", label: "Secretário Local" },
    ];
    return [];
  }, [isSuperAdmin, isAdmin]);

  const createUserMutation = useMutation({
    mutationFn: async () => {
      const body: any = { email, password: senha, nome_completo: nome, tipo };
      if (tipo === "local") body.estrutura_id = igrejaId;
      if (tipo === "admin" && distritoId) body.distrito_id = distritoId;
      const { data, error } = await supabase.functions.invoke("create-user", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast({ title: "Utilizador criado", description: "As credenciais foram geradas com sucesso." });
      setDialogOpen(false);
      setNome(""); setEmail(""); setSenha(""); setTipo("local"); setIgrejaId(""); setDistritoId("");
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["all-user-estruturas"] });
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const getIgreja = (userId: string) => {
    const ue = userEstruturas.find((u: any) => u.user_id === userId);
    if (!ue || !ue.igrejas) return "—";
    return (ue.igrejas as any).nome;
  };

  const getTypeIcon = (tipo: string) => {
    if (tipo === "super_admin") return <Crown size={12} className="mr-1" />;
    if (tipo === "admin") return <Shield size={12} className="mr-1" />;
    return <User size={12} className="mr-1" />;
  };

  const getTypeLabel = (tipo: string) => {
    if (tipo === "super_admin") return "Geral";
    if (tipo === "admin") return "Distrital";
    return "Local";
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestão de Utilizadores</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isSuperAdmin ? "Crie Secretários Distritais e Locais" : "Crie Secretários Locais para a sua região"}
            </p>
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
                  <Select value={tipo} onValueChange={(v) => { setTipo(v); setIgrejaId(""); setDistritoId(""); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {allowedTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {tipo === "admin" && isSuperAdmin && (
                  <div className="space-y-2">
                    <Label>Distrito *</Label>
                    <Select value={distritoId} onValueChange={setDistritoId} required>
                      <SelectTrigger><SelectValue placeholder="Selecione o distrito" /></SelectTrigger>
                      <SelectContent>
                        {distritos.map((d: any) => (
                          <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {tipo === "local" && (
                  <div className="space-y-2">
                    <Label>Igreja (Cargo Pastoral) *</Label>
                    <Select value={igrejaId} onValueChange={setIgrejaId} required>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {availableIgrejas.length === 0 ? (
                          <SelectItem value="none" disabled>Todas as igrejas já têm secretário</SelectItem>
                        ) : (
                          availableIgrejas.map((i: any) => (
                            <SelectItem key={i.id} value={i.id}>
                              {(i.circuitos as any)?.intendencias?.nome} → {(i.circuitos as any)?.nome} → {i.nome}
                            </SelectItem>
                          ))
                        )}
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
                    <TableHead>Igreja</TableHead>
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
                          <Badge variant={u.tipo === "super_admin" ? "default" : u.tipo === "admin" ? "default" : "secondary"}>
                            {getTypeIcon(u.tipo)}
                            {getTypeLabel(u.tipo)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{getIgreja(u.id)}</TableCell>
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
