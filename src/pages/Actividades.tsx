import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const TIPOS = [
  { v: "culto", l: "Culto" }, { v: "estudo_biblico", l: "Estudo Bíblico" },
  { v: "evangelizacao", l: "Evangelização" }, { v: "seminario", l: "Seminário" },
  { v: "congresso", l: "Congresso" }, { v: "acampamento", l: "Acampamento" },
  { v: "retiro", l: "Retiro" }, { v: "conferencia", l: "Conferência" },
  { v: "accao_social", l: "Acção Social" }, { v: "visita_missionaria", l: "Visita Missionária" },
  { v: "outra", l: "Outra" },
];

const emptyForm = {
  igreja_id: "", tipo: "", data: new Date().toISOString().slice(0, 10),
  local: "", descricao: "", ano: new Date().getFullYear(), semestre: 1, mes: new Date().getMonth() + 1,
};

const Actividades = () => {
  const { toast } = useToast();
  const { user, userEstruturas, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [presencasOpen, setPresencasOpen] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: igrejas = [] } = useQuery({
    queryKey: ["igrejas-actividades"],
    queryFn: async () => (await supabase.from("igrejas").select("id,nome").order("nome")).data || [],
  });

  const { data: actividades = [] } = useQuery({
    queryKey: ["actividades"],
    queryFn: async () => {
      const { data, error } = await supabase.from("actividades").select("*, igrejas(nome)").order("data", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: jovensIgreja = [] } = useQuery({
    queryKey: ["jovens-para-presencas", presencasOpen],
    queryFn: async () => {
      if (!presencasOpen) return [];
      const act = actividades.find((a: any) => a.id === presencasOpen);
      if (!act) return [];
      const { data } = await supabase.from("jovens").select("id,nome").eq("igreja_id", act.igreja_id).eq("activo", true).order("nome");
      return data || [];
    },
    enabled: !!presencasOpen,
  });

  const { data: presencasExist = [] } = useQuery({
    queryKey: ["presencas", presencasOpen],
    queryFn: async () => {
      if (!presencasOpen) return [];
      const { data } = await supabase.from("presencas").select("*").eq("actividade_id", presencasOpen);
      return data || [];
    },
    enabled: !!presencasOpen,
  });

  const presencaMap = useMemo(() => {
    const m: Record<string, string> = {};
    (presencasExist as any[]).forEach((p: any) => { m[p.jovem_id] = p.estado; });
    return m;
  }, [presencasExist]);

  const defaultIgreja = !isAdmin && userEstruturas[0] ? userEstruturas[0] : "";

  const save = useMutation({
    mutationFn: async () => {
      const igreja_id = form.igreja_id || defaultIgreja;
      if (!igreja_id) throw new Error("Selecione uma igreja");
      const { error } = await supabase.from("actividades").insert({ ...form, igreja_id, criado_por: user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Actividade registada" });
      setOpen(false); setForm(emptyForm);
      qc.invalidateQueries({ queryKey: ["actividades"] });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const setPresenca = useMutation({
    mutationFn: async ({ jovem_id, estado }: { jovem_id: string; estado: string }) => {
      const { error } = await supabase.from("presencas").upsert(
        { actividade_id: presencasOpen, jovem_id, estado },
        { onConflict: "actividade_id,jovem_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["presencas", presencasOpen] }),
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Actividades</h1>
            <p className="text-sm text-muted-foreground">Cultos, estudos bíblicos, seminários, acampamentos, etc.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus size={16} className="mr-1" /> Nova Actividade</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Actividade</DialogTitle></DialogHeader>
              <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
                {isAdmin && (
                  <div className="space-y-1.5">
                    <Label>Igreja *</Label>
                    <Select value={form.igreja_id} onValueChange={(v) => setForm({ ...form, igreja_id: v })} required>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{(igrejas as any[]).map((i: any) => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Tipo *</Label>
                    <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })} required>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{TIPOS.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Data *</Label>
                    <Input type="date" value={form.data} onChange={(e) => {
                      const d = new Date(e.target.value);
                      setForm({ ...form, data: e.target.value, ano: d.getFullYear(), mes: d.getMonth() + 1, semestre: d.getMonth() < 6 ? 1 : 2 });
                    }} required />
                  </div>
                  <div className="space-y-1.5 col-span-2"><Label>Local</Label><Input value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })} /></div>
                  <div className="space-y-1.5 col-span-2"><Label>Descrição</Label><Textarea rows={2} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
                </div>
                <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={save.isPending}>Criar</Button></div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">{actividades.length} actividades</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Data</TableHead><TableHead>Tipo</TableHead><TableHead>Igreja</TableHead>
                <TableHead>Local</TableHead><TableHead>Período</TableHead><TableHead>Presenças</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {actividades.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma actividade</TableCell></TableRow>
                ) : actividades.map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell>{new Date(a.data).toLocaleDateString("pt-AO")}</TableCell>
                    <TableCell>{TIPOS.find((t) => t.v === a.tipo)?.l || a.tipo}</TableCell>
                    <TableCell>{a.igrejas?.nome}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{a.local || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{a.ano} · {a.semestre}º sem</TableCell>
                    <TableCell><Button size="sm" variant="outline" onClick={() => setPresencasOpen(a.id)}><Users size={13} className="mr-1" /> Registar</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={!!presencasOpen} onOpenChange={(v) => !v && setPresencasOpen(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Registar Presenças</DialogTitle></DialogHeader>
            <div className="space-y-2">
              {(jovensIgreja as any[]).length === 0 && <p className="text-sm text-muted-foreground">Nenhum jovem activo nesta igreja.</p>}
              {(jovensIgreja as any[]).map((j: any) => (
                <div key={j.id} className="flex items-center justify-between border rounded-lg p-3">
                  <span className="font-medium">{j.nome}</span>
                  <div className="flex gap-1">
                    {[
                      { v: "presente", l: "P", cls: "bg-success text-white" },
                      { v: "ausente", l: "A", cls: "bg-destructive text-white" },
                      { v: "justificado", l: "J", cls: "bg-warning text-white" },
                    ].map((e) => (
                      <Button key={e.v} size="sm" variant={presencaMap[j.id] === e.v ? "default" : "outline"}
                        onClick={() => setPresenca.mutate({ jovem_id: j.id, estado: e.v })}>{e.l}</Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Actividades;
