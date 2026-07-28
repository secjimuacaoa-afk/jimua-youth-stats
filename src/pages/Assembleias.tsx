import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Lock, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSemestreCorrente } from "@/lib/semestre";

interface Form {
  ano: number; semestre: number; data: string; igreja_id: string;
  jovens_base: number; corpo_directivo: number; representantes_distrito: number;
  representantes_gabinete: number; assistente: number; observacoes: string;
}

const Assembleias = () => {
  const { toast } = useToast();
  const { user, isSuperAdmin, userDistrito } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [approveId, setApproveId] = useState<string | null>(null);
  const cur = getSemestreCorrente();
  const [form, setForm] = useState<Form>({
    ano: cur.ano, semestre: cur.semestre, data: new Date().toISOString().slice(0, 10),
    igreja_id: "", jovens_base: 0, corpo_directivo: 0,
    representantes_distrito: 0, representantes_gabinete: 0, assistente: 0, observacoes: "",
  });

  const { data: igrejas = [] } = useQuery({
    queryKey: ["igrejas-assembleias"],
    queryFn: async () => {
      const { data } = await supabase.from("igrejas").select("id, nome, circuitos(intendencia_id, intendencias(distrito_id))").order("nome");
      return data || [];
    },
  });

  const igrejasScope = useMemo(() => {
    if (isSuperAdmin) return igrejas;
    if (userDistrito) {
      return (igrejas as any[]).filter((i: any) => i.circuitos?.intendencias?.distrito_id === userDistrito);
    }
    return [];
  }, [igrejas, isSuperAdmin, userDistrito]);

  const { data: assembleias = [] } = useQuery({
    queryKey: ["assembleias"],
    queryFn: async () => (await supabase.from("assembleias").select("*, igrejas(nome)").order("data", { ascending: false })).data || [],
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!form.igreja_id) throw new Error("Selecione a igreja.");
      const { error } = await supabase.from("assembleias").insert({
        ano: form.ano, semestre: form.semestre, data: form.data,
        estrutura_tipo: "distrito", estrutura_id: userDistrito,
        igreja_id: form.igreja_id,
        jovens_base: form.jovens_base, corpo_directivo: form.corpo_directivo,
        representantes_distrito: form.representantes_distrito,
        representantes_gabinete: form.representantes_gabinete,
        assistente: form.assistente, observacoes: form.observacoes,
        responsavel_id: user?.id, estado: "preparacao",
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: "Assembleia criada" }); setOpen(false); qc.invalidateQueries({ queryKey: ["assembleias"] }); },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const aprovar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("assembleias").update({ estado: "aprovado", aprovado_em: new Date().toISOString(), aprovado_por: user?.id } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: "Estatística aprovada", description: "Semestre bloqueado para o Secretário Local." }); setApproveId(null); qc.invalidateQueries({ queryKey: ["assembleias"] }); },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const total = form.jovens_base + form.corpo_directivo + form.representantes_distrito + form.representantes_gabinete + form.assistente;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Assembleias Distritais</h1>
            <p className="text-sm text-muted-foreground">Aprovar estatística por igreja e semestre. Após aprovação, os dados ficam bloqueados no Local.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus size={16} className="mr-1" /> Nova Assembleia</Button></DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Nova Assembleia</DialogTitle></DialogHeader>
              <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
                <div className="space-y-1.5">
                  <Label>Igreja *</Label>
                  <Select value={form.igreja_id} onValueChange={(v) => setForm({ ...form, igreja_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione a igreja" /></SelectTrigger>
                    <SelectContent>
                      {(igrejasScope as any[]).map((i: any) => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5"><Label>Ano</Label><Input type="number" value={form.ano} onChange={(e) => setForm({ ...form, ano: Number(e.target.value) })} /></div>
                  <div className="space-y-1.5"><Label>Semestre</Label>
                    <Select value={String(form.semestre)} onValueChange={(v) => setForm({ ...form, semestre: Number(v) })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="1">1º</SelectItem><SelectItem value="2">2º</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Data</Label><Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></div>
                </div>
                <div className="border-t pt-3 space-y-3">
                  <p className="text-sm font-semibold">Presenças</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label>Jovens de base</Label><Input type="number" min={0} value={form.jovens_base} onChange={(e) => setForm({ ...form, jovens_base: Number(e.target.value) })} /></div>
                    <div className="space-y-1.5"><Label>Corpo Directivo</Label><Input type="number" min={0} value={form.corpo_directivo} onChange={(e) => setForm({ ...form, corpo_directivo: Number(e.target.value) })} /></div>
                    <div className="space-y-1.5"><Label>Rep. Distrito</Label><Input type="number" min={0} value={form.representantes_distrito} onChange={(e) => setForm({ ...form, representantes_distrito: Number(e.target.value) })} /></div>
                    <div className="space-y-1.5"><Label>Rep. Gabinete Pastoral</Label><Input type="number" min={0} value={form.representantes_gabinete} onChange={(e) => setForm({ ...form, representantes_gabinete: Number(e.target.value) })} /></div>
                    <div className="space-y-1.5"><Label>Assistente</Label><Input type="number" min={0} value={form.assistente} onChange={(e) => setForm({ ...form, assistente: Number(e.target.value) })} /></div>
                    <div className="space-y-1.5"><Label>Total</Label><Input value={total} readOnly className="bg-muted" /></div>
                  </div>
                </div>
                <div className="space-y-1.5"><Label>Observações</Label><Textarea rows={2} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></div>
                <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={save.isPending}>Criar</Button></div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">{(assembleias as any[]).length} assembleias</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Igreja</TableHead><TableHead>Período</TableHead><TableHead>Data</TableHead>
                <TableHead>Presenças</TableHead><TableHead>Estado</TableHead><TableHead>Acções</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {(assembleias as any[]).length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma assembleia</TableCell></TableRow>
                ) : (assembleias as any[]).map((a: any) => {
                  const tot = (a.jovens_base || 0) + (a.corpo_directivo || 0) + (a.representantes_distrito || 0) + (a.representantes_gabinete || 0) + (a.assistente || 0);
                  const aprovado = a.estado === "aprovado";
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.igrejas?.nome || "—"}</TableCell>
                      <TableCell>{a.ano} · {a.semestre}º Sem</TableCell>
                      <TableCell>{new Date(a.data).toLocaleDateString("pt-AO")}</TableCell>
                      <TableCell>{tot}</TableCell>
                      <TableCell>
                        <Badge variant={aprovado ? "default" : "outline"}>
                          {aprovado && <Lock size={11} className="mr-1" />}
                          {aprovado ? "Aprovada" : "Em preparação"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {!aprovado && (
                          <Button size="sm" variant="secondary" onClick={() => setApproveId(a.id)}>
                            <ShieldCheck size={14} className="mr-1" /> Aprovar estatística
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!approveId} onOpenChange={(o) => !o && setApproveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprovar estatística</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acção é <strong>irreversível</strong>. Após aprovada, o Secretário Local não poderá alterar jovens, ocorrências, actividades nem frequência do semestre.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => approveId && aprovar.mutate(approveId)}>Aprovar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Assembleias;
