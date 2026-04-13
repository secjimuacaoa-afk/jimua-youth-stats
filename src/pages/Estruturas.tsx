import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Church, MapPin, Building, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const Estruturas = () => {
  const { toast } = useToast();
  const { isAdmin, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [intDialogOpen, setIntDialogOpen] = useState(false);
  const [circDialogOpen, setCircDialogOpen] = useState(false);
  const [igrDialogOpen, setIgrDialogOpen] = useState(false);
  const [distDialogOpen, setDistDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState("");

  const [nome, setNome] = useState("");
  const [selectedDistrito, setSelectedDistrito] = useState("");
  const [selectedIntendencia, setSelectedIntendencia] = useState("");
  const [selectedCircuito, setSelectedCircuito] = useState("");

  const { data: distritos = [], isLoading: loadingDist } = useQuery({
    queryKey: ["distritos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("distritos").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: intendencias = [], isLoading: loadingInt } = useQuery({
    queryKey: ["intendencias"],
    queryFn: async () => {
      const { data, error } = await supabase.from("intendencias").select("*, distritos(nome)").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: circuitos = [], isLoading: loadingCirc } = useQuery({
    queryKey: ["circuitos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("circuitos").select("*, intendencias(nome)").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: igrejas = [], isLoading: loadingIgr } = useQuery({
    queryKey: ["igrejas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("igrejas").select("*, circuitos(nome, intendencias(nome))").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => {
    setNome(""); setSelectedDistrito(""); setSelectedIntendencia(""); setSelectedCircuito("");
    setEditMode(false); setEditId("");
  };

  // Mutations
  const distMutation = useMutation({
    mutationFn: async () => {
      if (editMode) {
        const { error } = await supabase.from("distritos").update({ nome }).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("distritos").insert({ nome });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: editMode ? "Distrito actualizado" : "Distrito criado" });
      setDistDialogOpen(false); resetForm();
      queryClient.invalidateQueries({ queryKey: ["distritos"] });
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const intMutation = useMutation({
    mutationFn: async () => {
      if (editMode) {
        const { error } = await supabase.from("intendencias").update({ nome, distrito_id: selectedDistrito || null }).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("intendencias").insert({ nome, distrito_id: selectedDistrito || null });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: editMode ? "Intendência actualizada" : "Intendência criada" });
      setIntDialogOpen(false); resetForm();
      queryClient.invalidateQueries({ queryKey: ["intendencias"] });
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const circMutation = useMutation({
    mutationFn: async () => {
      if (editMode) {
        const { error } = await supabase.from("circuitos").update({ nome, intendencia_id: selectedIntendencia }).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("circuitos").insert({ nome, intendencia_id: selectedIntendencia });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: editMode ? "Circuito actualizado" : "Circuito criado" });
      setCircDialogOpen(false); resetForm();
      queryClient.invalidateQueries({ queryKey: ["circuitos"] });
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const igrMutation = useMutation({
    mutationFn: async () => {
      if (editMode) {
        const { error } = await supabase.from("igrejas").update({ nome, circuito_id: selectedCircuito }).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("igrejas").insert({ nome, circuito_id: selectedCircuito });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: editMode ? "Igreja actualizada" : "Igreja criada" });
      setIgrDialogOpen(false); resetForm();
      queryClient.invalidateQueries({ queryKey: ["igrejas"] });
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const openEdit = (type: "dist" | "int" | "circ" | "igr", item: any) => {
    setEditMode(true); setEditId(item.id); setNome(item.nome);
    if (type === "int") { setSelectedDistrito(item.distrito_id || ""); setIntDialogOpen(true); }
    else if (type === "circ") { setSelectedIntendencia(item.intendencia_id); setCircDialogOpen(true); }
    else if (type === "igr") { setSelectedCircuito(item.circuito_id); setIgrDialogOpen(true); }
    else { setDistDialogOpen(true); }
  };

  const filteredCircuitos = selectedIntendencia
    ? circuitos.filter((c: any) => c.intendencia_id === selectedIntendencia)
    : circuitos;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Estruturas Eclesiásticas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hierarquia: {isSuperAdmin ? "Distrito → " : ""}Intendência → Circuito → Igreja (Cargo Pastoral)
          </p>
        </div>

        <Tabs defaultValue={isSuperAdmin ? "distritos" : "intendencias"}>
          <TabsList className={`grid w-full ${isSuperAdmin ? "grid-cols-4" : "grid-cols-3"}`}>
            {isSuperAdmin && (
              <TabsTrigger value="distritos" className="flex items-center gap-1">
                <Globe size={14} /> Distritos
              </TabsTrigger>
            )}
            <TabsTrigger value="intendencias" className="flex items-center gap-1">
              <MapPin size={14} /> Intendências
            </TabsTrigger>
            <TabsTrigger value="circuitos" className="flex items-center gap-1">
              <Building size={14} /> Circuitos
            </TabsTrigger>
            <TabsTrigger value="igrejas" className="flex items-center gap-1">
              <Church size={14} /> Igrejas
            </TabsTrigger>
          </TabsList>

          {/* DISTRITOS - Super Admin Only */}
          {isSuperAdmin && (
            <TabsContent value="distritos">
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-base">{distritos.length} distritos</CardTitle>
                  <Dialog open={distDialogOpen} onOpenChange={(v) => { setDistDialogOpen(v); if (!v) resetForm(); }}>
                    <DialogTrigger asChild>
                      <Button size="sm"><Plus size={16} className="mr-1" /> Novo Distrito</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>{editMode ? "Editar" : "Criar"} Distrito</DialogTitle></DialogHeader>
                      <form className="space-y-4 mt-2" onSubmit={(e) => { e.preventDefault(); distMutation.mutate(); }}>
                        <div className="space-y-2">
                          <Label>Nome *</Label>
                          <Input placeholder="Ex: Luanda" value={nome} onChange={(e) => setNome(e.target.value)} required />
                        </div>
                        <div className="flex justify-end gap-3">
                          <Button type="button" variant="outline" onClick={() => { setDistDialogOpen(false); resetForm(); }}>Cancelar</Button>
                          <Button type="submit" disabled={distMutation.isPending}>
                            {distMutation.isPending ? "Salvando..." : editMode ? "Actualizar" : "Criar"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead className="w-20">Acções</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingDist ? (
                        <TableRow><TableCell colSpan={2} className="text-center py-8">Carregando...</TableCell></TableRow>
                      ) : distritos.length === 0 ? (
                        <TableRow><TableCell colSpan={2} className="text-center py-8 text-muted-foreground">Nenhum distrito</TableCell></TableRow>
                      ) : distritos.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.nome}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost" onClick={() => openEdit("dist", item)}>
                              <Pencil size={14} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* INTENDÊNCIAS */}
          <TabsContent value="intendencias">
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base">{intendencias.length} intendências</CardTitle>
                {isAdmin && (
                  <Dialog open={intDialogOpen} onOpenChange={(v) => { setIntDialogOpen(v); if (!v) resetForm(); }}>
                    <DialogTrigger asChild>
                      <Button size="sm"><Plus size={16} className="mr-1" /> Nova Intendência</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>{editMode ? "Editar" : "Criar"} Intendência</DialogTitle></DialogHeader>
                      <form className="space-y-4 mt-2" onSubmit={(e) => { e.preventDefault(); intMutation.mutate(); }}>
                        {isSuperAdmin && (
                          <div className="space-y-2">
                            <Label>Distrito</Label>
                            <Select value={selectedDistrito} onValueChange={setSelectedDistrito}>
                              <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                              <SelectContent>
                                {distritos.map((d: any) => (
                                  <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label>Nome *</Label>
                          <Input placeholder="Ex: Intendência Norte" value={nome} onChange={(e) => setNome(e.target.value)} required />
                        </div>
                        <div className="flex justify-end gap-3">
                          <Button type="button" variant="outline" onClick={() => { setIntDialogOpen(false); resetForm(); }}>Cancelar</Button>
                          <Button type="submit" disabled={intMutation.isPending}>
                            {intMutation.isPending ? "Salvando..." : editMode ? "Actualizar" : "Criar"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      {isSuperAdmin && <TableHead>Distrito</TableHead>}
                      {isAdmin && <TableHead className="w-20">Acções</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingInt ? (
                      <TableRow><TableCell colSpan={3} className="text-center py-8">Carregando...</TableCell></TableRow>
                    ) : intendencias.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Nenhuma intendência</TableCell></TableRow>
                    ) : intendencias.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.nome}</TableCell>
                        {isSuperAdmin && <TableCell>{(item as any).distritos?.nome || "—"}</TableCell>}
                        {isAdmin && (
                          <TableCell>
                            <Button size="sm" variant="ghost" onClick={() => openEdit("int", item)}>
                              <Pencil size={14} />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CIRCUITOS */}
          <TabsContent value="circuitos">
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base">{circuitos.length} circuitos</CardTitle>
                {isAdmin && (
                  <Dialog open={circDialogOpen} onOpenChange={(v) => { setCircDialogOpen(v); if (!v) resetForm(); }}>
                    <DialogTrigger asChild>
                      <Button size="sm" disabled={intendencias.length === 0}>
                        <Plus size={16} className="mr-1" /> Novo Circuito
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>{editMode ? "Editar" : "Criar"} Circuito</DialogTitle></DialogHeader>
                      <form className="space-y-4 mt-2" onSubmit={(e) => { e.preventDefault(); circMutation.mutate(); }}>
                        <div className="space-y-2">
                          <Label>Intendência *</Label>
                          <Select value={selectedIntendencia} onValueChange={setSelectedIntendencia} required>
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              {intendencias.map((i: any) => (
                                <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Nome do Circuito *</Label>
                          <Input placeholder="Ex: Circuito Luanda" value={nome} onChange={(e) => setNome(e.target.value)} required />
                        </div>
                        <div className="flex justify-end gap-3">
                          <Button type="button" variant="outline" onClick={() => { setCircDialogOpen(false); resetForm(); }}>Cancelar</Button>
                          <Button type="submit" disabled={circMutation.isPending}>
                            {circMutation.isPending ? "Salvando..." : editMode ? "Actualizar" : "Criar"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Intendência</TableHead>
                      {isAdmin && <TableHead className="w-20">Acções</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingCirc ? (
                      <TableRow><TableCell colSpan={3} className="text-center py-8">Carregando...</TableCell></TableRow>
                    ) : circuitos.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Nenhum circuito</TableCell></TableRow>
                    ) : circuitos.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.nome}</TableCell>
                        <TableCell>{(item.intendencias as any)?.nome || "—"}</TableCell>
                        {isAdmin && (
                          <TableCell>
                            <Button size="sm" variant="ghost" onClick={() => openEdit("circ", item)}>
                              <Pencil size={14} />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* IGREJAS */}
          <TabsContent value="igrejas">
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base">{igrejas.length} igrejas (cargos pastorais)</CardTitle>
                {isAdmin && (
                  <Dialog open={igrDialogOpen} onOpenChange={(v) => { setIgrDialogOpen(v); if (!v) resetForm(); }}>
                    <DialogTrigger asChild>
                      <Button size="sm" disabled={circuitos.length === 0}>
                        <Plus size={16} className="mr-1" /> Nova Igreja
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>{editMode ? "Editar" : "Criar"} Igreja</DialogTitle></DialogHeader>
                      <form className="space-y-4 mt-2" onSubmit={(e) => { e.preventDefault(); igrMutation.mutate(); }}>
                        <div className="space-y-2">
                          <Label>Intendência *</Label>
                          <Select value={selectedIntendencia} onValueChange={(v) => { setSelectedIntendencia(v); setSelectedCircuito(""); }}>
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              {intendencias.map((i: any) => (
                                <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Circuito *</Label>
                          <Select value={selectedCircuito} onValueChange={setSelectedCircuito} required disabled={!selectedIntendencia}>
                            <SelectTrigger><SelectValue placeholder={selectedIntendencia ? "Selecione" : "Selecione intendência primeiro"} /></SelectTrigger>
                            <SelectContent>
                              {filteredCircuitos.map((c: any) => (
                                <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Nome da Igreja *</Label>
                          <Input placeholder="Ex: Igreja Bom Pastor" value={nome} onChange={(e) => setNome(e.target.value)} required />
                        </div>
                        <div className="flex justify-end gap-3">
                          <Button type="button" variant="outline" onClick={() => { setIgrDialogOpen(false); resetForm(); }}>Cancelar</Button>
                          <Button type="submit" disabled={igrMutation.isPending}>
                            {igrMutation.isPending ? "Salvando..." : editMode ? "Actualizar" : "Criar"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Circuito</TableHead>
                      <TableHead>Intendência</TableHead>
                      {isAdmin && <TableHead className="w-20">Acções</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingIgr ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8">Carregando...</TableCell></TableRow>
                    ) : igrejas.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhuma igreja</TableCell></TableRow>
                    ) : igrejas.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.nome}</TableCell>
                        <TableCell>{(item.circuitos as any)?.nome || "—"}</TableCell>
                        <TableCell>{(item.circuitos as any)?.intendencias?.nome || "—"}</TableCell>
                        {isAdmin && (
                          <TableCell>
                            <Button size="sm" variant="ghost" onClick={() => openEdit("igr", item)}>
                              <Pencil size={14} />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Estruturas;
