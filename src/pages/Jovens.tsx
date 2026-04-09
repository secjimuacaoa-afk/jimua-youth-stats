import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";

const calcAge = (dob: string) => Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
const calcParteEtaria = (dob: string) => { const age = calcAge(dob); return age >= 12 && age <= 17 ? "H" : "I"; };

const DOC_TYPES = [
  { value: "cedula", label: "Registo de Nascimento (Cédula)" },
  { value: "bi", label: "Bilhete de Identidade (BI)" },
  { value: "passaporte", label: "Passaporte" },
  { value: "carta_conducao", label: "Carta de Condução" },
  { value: "sem_documentacao", label: "Sem documentação" },
];

const MOTIVOS_INACTIVIDADE = [
  { value: "C", label: "Afastado (C)" },
  { value: "D", label: "Falecido (D)" },
  { value: "E", label: "Estudo/Trabalho (E)" },
  { value: "F", label: "Saúde (F)" },
  { value: "G", label: "Disciplinares (G)" },
  { value: "G1", label: "Desconhecidas (G1)" },
];

interface JovemFormData {
  nome: string;
  sexo: string;
  dataNascimento: string;
  categoria: string;
  escolaridade: string;
  ocupacao: string;
  estadoCivil: string;
  origem: string;
  activo: boolean;
  motivoInactividade: string;
  documentacao: string[];
}

const emptyForm: JovemFormData = {
  nome: "", sexo: "", dataNascimento: "", categoria: "",
  escolaridade: "", ocupacao: "", estadoCivil: "", origem: "",
  activo: true, motivoInactividade: "", documentacao: [],
};

const JovemForm = ({
  form, setForm, onSubmit, isPending, submitLabel, onCancel
}: {
  form: JovemFormData;
  setForm: (f: JovemFormData) => void;
  onSubmit: () => void;
  isPending: boolean;
  submitLabel: string;
  onCancel: () => void;
}) => {
  const age = form.dataNascimento ? calcAge(form.dataNascimento) : null;
  const isOja = age !== null && age > 25;

  const handleDocChange = (value: string, checked: boolean) => {
    if (value === "sem_documentacao") {
      setForm({ ...form, documentacao: checked ? ["sem_documentacao"] : [] });
    } else {
      const filtered = form.documentacao.filter(d => d !== "sem_documentacao");
      setForm({
        ...form,
        documentacao: checked ? [...filtered, value] : filtered.filter(d => d !== value),
      });
    }
  };

  return (
    <form className="space-y-4 mt-2" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      {isOja && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Este jovem tem {age} anos e será classificado como <strong>Jovem Adulto (OJA)</strong>. NÃO será contabilizado nas estatísticas da juventude.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label>Nome Completo *</Label>
        <Input placeholder="Nome do jovem" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Sexo *</Label>
          <Select value={form.sexo} onValueChange={(v) => setForm({ ...form, sexo: v })} required>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="masculino">Masculino</SelectItem>
              <SelectItem value="feminino">Feminino</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Data de Nascimento *</Label>
          <Input type="date" value={form.dataNascimento} onChange={(e) => setForm({ ...form, dataNascimento: e.target.value })} required />
          {age !== null && (
            <p className={`text-xs ${isOja ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
              Idade: {age} anos {isOja ? "(OJA)" : ""}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Categoria *</Label>
          <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })} required>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="J">J</SelectItem>
              <SelectItem value="K">K</SelectItem>
              <SelectItem value="L">L</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Escolaridade</Label>
          <Select value={form.escolaridade} onValueChange={(v) => setForm({ ...form, escolaridade: v })}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {["M", "N", "O", "P", "P1", "P2", "Q"].map((v) => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Ocupação</Label>
          <Select value={form.ocupacao} onValueChange={(v) => setForm({ ...form, ocupacao: v })}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {["R", "S", "T", "U", "V", "W", "X", "X1"].map((v) => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Estado Civil</Label>
          <Select value={form.estadoCivil} onValueChange={(v) => setForm({ ...form, estadoCivil: v })}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Y">Y (Solteiro)</SelectItem>
              <SelectItem value="Z">Z (Casado)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Origem</Label>
        <Select value={form.origem} onValueChange={(v) => setForm({ ...form, origem: v })}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            {["A", "A1", "A2", "B", "B1"].map((v) => (
              <SelectItem key={v} value={v}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Documentação */}
      <div className="space-y-2">
        <Label>Documentação *</Label>
        <div className="grid grid-cols-1 gap-2 p-3 border rounded-md bg-muted/30">
          {DOC_TYPES.map((doc) => (
            <div key={doc.value} className="flex items-center space-x-2">
              <Checkbox
                id={`doc-${doc.value}`}
                checked={form.documentacao.includes(doc.value)}
                onCheckedChange={(checked) => handleDocChange(doc.value, !!checked)}
                disabled={doc.value !== "sem_documentacao" && form.documentacao.includes("sem_documentacao")}
              />
              <label htmlFor={`doc-${doc.value}`} className="text-sm cursor-pointer">{doc.label}</label>
            </div>
          ))}
        </div>
      </div>

      {/* Estado */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Estado *</Label>
          <Select value={form.activo ? "activo" : "inactivo"} onValueChange={(v) => setForm({ ...form, activo: v === "activo", motivoInactividade: v === "activo" ? "" : form.motivoInactividade })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="activo">Activo</SelectItem>
              <SelectItem value="inactivo">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {!form.activo && (
          <div className="space-y-2">
            <Label>Motivo de Inactividade *</Label>
            <Select value={form.motivoInactividade} onValueChange={(v) => setForm({ ...form, motivoInactividade: v })} required>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {MOTIVOS_INACTIVIDADE.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="bg-primary text-primary-foreground" disabled={isPending}>
          {isPending ? "Processando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
};

const Jovens = () => {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedJovem, setSelectedJovem] = useState<any>(null);
  const [form, setForm] = useState<JovemFormData>({ ...emptyForm });
  const { toast } = useToast();
  const { user, isAdmin, userEstruturas } = useAuth();
  const queryClient = useQueryClient();

  const [filterIntendencia, setFilterIntendencia] = useState("");
  const [filterCircuito, setFilterCircuito] = useState("");
  const [filterIgreja, setFilterIgreja] = useState("");

  const { data: intendencias = [] } = useQuery({
    queryKey: ["intendencias"],
    queryFn: async () => {
      const { data, error } = await supabase.from("intendencias").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: circuitos = [] } = useQuery({
    queryKey: ["circuitos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("circuitos").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: igrejas = [] } = useQuery({
    queryKey: ["igrejas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("igrejas").select("*, circuitos(nome, intendencia_id, intendencias(nome))").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const filteredCircuitos = filterIntendencia ? circuitos.filter((c: any) => c.intendencia_id === filterIntendencia) : [];
  const filteredIgrejas = filterCircuito ? igrejas.filter((i: any) => i.circuito_id === filterCircuito) : [];

  const { data: jovens = [], isLoading } = useQuery({
    queryKey: ["jovens", filterIgreja, isAdmin],
    queryFn: async () => {
      let query = supabase.from("jovens").select("*, igrejas(nome, circuitos(nome, intendencias(nome)))").order("nome");
      if (isAdmin && filterIgreja) {
        query = query.eq("igreja_id", filterIgreja);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: isAdmin ? !!filterIgreja : true,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const igrejaId = userEstruturas[0];
      if (!igrejaId) throw new Error("Sem igreja associada");
      const age = form.dataNascimento ? calcAge(form.dataNascimento) : 0;
      const { error } = await supabase.from("jovens").insert({
        nome: form.nome, sexo: form.sexo as any, data_nascimento: form.dataNascimento,
        categoria: form.categoria, escolaridade: form.escolaridade || null,
        ocupacao: form.ocupacao || null, estado_civil: form.estadoCivil || null,
        origem: form.origem || null, igreja_id: igrejaId, created_by: user?.id,
        activo: form.activo, motivo_inactividade: !form.activo ? form.motivoInactividade : null,
        documentacao: form.documentacao, is_oja: age > 25,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Jovem registado com sucesso" });
      setDialogOpen(false);
      setForm({ ...emptyForm });
      queryClient.invalidateQueries({ queryKey: ["jovens"] });
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedJovem) return;
      const age = form.dataNascimento ? calcAge(form.dataNascimento) : 0;
      const { error } = await supabase.from("jovens").update({
        nome: form.nome, sexo: form.sexo as any, data_nascimento: form.dataNascimento,
        categoria: form.categoria, escolaridade: form.escolaridade || null,
        ocupacao: form.ocupacao || null, estado_civil: form.estadoCivil || null,
        origem: form.origem || null, activo: form.activo,
        motivo_inactividade: !form.activo ? form.motivoInactividade : null,
        documentacao: form.documentacao, is_oja: age > 25,
      }).eq("id", selectedJovem.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Jovem actualizado com sucesso" });
      setEditDialogOpen(false);
      setSelectedJovem(null);
      queryClient.invalidateQueries({ queryKey: ["jovens"] });
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedJovem) return;
      const { error } = await supabase.from("jovens").delete().eq("id", selectedJovem.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Jovem eliminado" });
      setDeleteDialogOpen(false);
      setSelectedJovem(null);
      queryClient.invalidateQueries({ queryKey: ["jovens"] });
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const openEdit = (jovem: any) => {
    setSelectedJovem(jovem);
    setForm({
      nome: jovem.nome, sexo: jovem.sexo, dataNascimento: jovem.data_nascimento,
      categoria: jovem.categoria, escolaridade: jovem.escolaridade || "",
      ocupacao: jovem.ocupacao || "", estadoCivil: jovem.estado_civil || "",
      origem: jovem.origem || "", activo: jovem.activo,
      motivoInactividade: jovem.motivo_inactividade || "",
      documentacao: jovem.documentacao || [],
    });
    setEditDialogOpen(true);
  };

  const filteredJovens = jovens.filter((j: any) =>
    j.nome.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestão de Jovens</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isAdmin ? "Visualize os jovens por igreja" : "Registe e gerencie os jovens da sua unidade"}
            </p>
          </div>
          {!isAdmin && (
            <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setForm({ ...emptyForm }); }}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-navy-dark">
                  <Plus size={18} className="mr-2" />
                  Novo Jovem
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Registar Novo Jovem</DialogTitle>
                </DialogHeader>
                <JovemForm
                  form={form} setForm={setForm}
                  onSubmit={() => createMutation.mutate()}
                  isPending={createMutation.isPending}
                  submitLabel="Registar"
                  onCancel={() => setDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col gap-3">
              {isAdmin && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Select value={filterIntendencia} onValueChange={(v) => { setFilterIntendencia(v); setFilterCircuito(""); setFilterIgreja(""); }}>
                    <SelectTrigger><SelectValue placeholder="Intendência" /></SelectTrigger>
                    <SelectContent>
                      {intendencias.map((i: any) => (<SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <Select value={filterCircuito} onValueChange={(v) => { setFilterCircuito(v); setFilterIgreja(""); }} disabled={!filterIntendencia}>
                    <SelectTrigger><SelectValue placeholder={filterIntendencia ? "Circuito" : "Selecione intendência"} /></SelectTrigger>
                    <SelectContent>
                      {filteredCircuitos.map((c: any) => (<SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <Select value={filterIgreja} onValueChange={setFilterIgreja} disabled={!filterCircuito}>
                    <SelectTrigger><SelectValue placeholder={filterCircuito ? "Igreja" : "Selecione circuito"} /></SelectTrigger>
                    <SelectContent>
                      {filteredIgrejas.map((i: any) => (<SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Pesquisar por nome..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {isAdmin && !filterIgreja ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Selecione uma Intendência, Circuito e Igreja para visualizar os jovens.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{filteredJovens.length} jovens encontrados</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Sexo</TableHead>
                      <TableHead>Idade</TableHead>
                      <TableHead>Parte Etária</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Igreja</TableHead>
                      <TableHead>Estado</TableHead>
                      {!isAdmin && <TableHead>Acções</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-8">Carregando...</TableCell></TableRow>
                    ) : filteredJovens.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum jovem registado</TableCell></TableRow>
                    ) : (
                      filteredJovens.map((jovem: any) => {
                        const age = calcAge(jovem.data_nascimento);
                        const isOja = age > 25;
                        return (
                          <TableRow key={jovem.id} className={isOja ? "opacity-60 bg-destructive/5" : ""}>
                            <TableCell className="font-medium">
                              {jovem.nome}
                              {isOja && <Badge variant="destructive" className="ml-2 text-xs">OJA</Badge>}
                            </TableCell>
                            <TableCell>{jovem.sexo === "masculino" ? "M" : "F"}</TableCell>
                            <TableCell>{age}</TableCell>
                            <TableCell>
                              <Badge variant={isOja ? "destructive" : calcParteEtaria(jovem.data_nascimento) === "H" ? "secondary" : "default"}>
                                {isOja ? "OJA" : calcParteEtaria(jovem.data_nascimento) === "H" ? "12–17" : "18–25"}
                              </Badge>
                            </TableCell>
                            <TableCell>{jovem.categoria}</TableCell>
                            <TableCell className="text-sm">{(jovem.igrejas as any)?.nome || "—"}</TableCell>
                            <TableCell>
                              <Badge variant={jovem.activo ? "default" : "destructive"}>
                                {jovem.activo ? "Activo" : "Inactivo"}
                              </Badge>
                            </TableCell>
                            {!isAdmin && (
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="icon" onClick={() => openEdit(jovem)}>
                                    <Pencil size={16} />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { setSelectedJovem(jovem); setDeleteDialogOpen(true); }}>
                                    <Trash2 size={16} />
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(o) => { setEditDialogOpen(o); if (!o) { setSelectedJovem(null); setForm({ ...emptyForm }); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Jovem</DialogTitle>
          </DialogHeader>
          <JovemForm
            form={form} setForm={setForm}
            onSubmit={() => updateMutation.mutate()}
            isPending={updateMutation.isPending}
            submitLabel="Guardar"
            onCancel={() => setEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Jovem</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja eliminar <strong>{selectedJovem?.nome}</strong>? Esta acção é irreversível.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Jovens;
