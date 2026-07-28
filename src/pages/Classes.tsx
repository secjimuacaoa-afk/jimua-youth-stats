import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface ClasseForm { nome: string; guia: string; localizacao: string; coordenador: string }
const empty: ClasseForm = { nome: "", guia: "", localizacao: "", coordenador: "" };

const Classes = () => {
  const { toast } = useToast();
  const { user, userEstruturas } = useAuth();
  const igrejaId = userEstruturas[0];
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const [form, setForm] = useState<ClasseForm>(empty);

  const { data: classes = [] } = useQuery({
    queryKey: ["classes", igrejaId],
    queryFn: async () => {
      if (!igrejaId) return [];
      const { data } = await supabase.from("classes" as any).select("*").eq("igreja_id", igrejaId).order("nome");
      return data || [];
    },
    enabled: !!igrejaId,
  });

  const { data: counts = {} } = useQuery({
    queryKey: ["classes-counts", igrejaId],
    queryFn: async () => {
      if (!igrejaId) return {};
      const { data } = await supabase.from("jovens").select("classe_id").eq("igreja_id", igrejaId).eq("is_oja", false);
      const map: Record<string, number> = {};
      (data || []).forEach((j: any) => { if (j.classe_id) map[j.classe_id] = (map[j.classe_id] || 0) + 1; });
      return map;
    },
    enabled: !!igrejaId,
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!igrejaId) throw new Error("Sem igreja associada.");
      if (editing) {
        const { error } = await supabase.from("classes" as any).update(form).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("classes" as any).insert({ ...form, igreja_id: igrejaId, created_by: user?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: editing ? "Classe actualizada" : "Classe criada" });
      setOpen(false); setEditing(null); setForm(empty);
      qc.invalidateQueries({ queryKey: ["classes"] });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("classes" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: "Classe eliminada" }); setDelId(null); qc.invalidateQueries({ queryKey: ["classes"] }); },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const openEdit = (c: any) => { setEditing(c); setForm({ nome: c.nome, guia: c.guia || "", localizacao: c.localizacao || "", coordenador: c.coordenador || "" }); setOpen(true); };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Classes</h1>
            <p className="text-sm text-muted-foreground">Unidade básica de acompanhamento pastoral e discipulado</p>
          </div>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); setForm(empty); } }}>
            <DialogTrigger asChild>
              <Button><Plus size={16} className="mr-1" /> Nova Classe</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Editar" : "Nova"} Classe</DialogTitle></DialogHeader>
              <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
                <div className="space-y-1.5"><Label>Nome da Classe *</Label><Input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Guia de Classe *</Label><Input required value={form.guia} onChange={(e) => setForm({ ...form, guia: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Localização *</Label><Input required value={form.localizacao} onChange={(e) => setForm({ ...form, localizacao: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Coordenador *</Label><Input required value={form.coordenador} onChange={(e) => setForm({ ...form, coordenador: e.target.value })} /></div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={save.isPending}>{editing ? "Guardar" : "Criar"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">{classes.length} classes</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Nome</TableHead><TableHead>Guia</TableHead><TableHead>Localização</TableHead>
                <TableHead>Coordenador</TableHead><TableHead>Membros</TableHead><TableHead>Acções</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {(classes as any[]).length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma classe criada</TableCell></TableRow>
                ) : (classes as any[]).map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell>{c.guia || "—"}</TableCell>
                    <TableCell>{c.localizacao || "—"}</TableCell>
                    <TableCell>{c.coordenador || "—"}</TableCell>
                    <TableCell><span className="inline-flex items-center gap-1 text-sm"><Users size={13} />{(counts as any)[c.id] || 0}</span></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil size={16} /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDelId(c.id)}><Trash2 size={16} /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!delId} onOpenChange={(o) => !o && setDelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Classe</AlertDialogTitle>
            <AlertDialogDescription>Os jovens ligados a esta classe ficarão sem classe atribuída. Continuar?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => delId && remove.mutate(delId)} className="bg-destructive text-destructive-foreground">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Classes;
