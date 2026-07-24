import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const ESTADOS = [
  { v: "preparacao", l: "Em preparação", color: "outline" as const },
  { v: "revisao", l: "Em revisão", color: "secondary" as const },
  { v: "aprovada", l: "Aprovada", color: "default" as const },
  { v: "encerrada", l: "Encerrada", color: "destructive" as const },
];

const empty = { ano: new Date().getFullYear(), semestre: 1, data: new Date().toISOString().slice(0, 10), estrutura_tipo: "nacional", observacoes: "" };

const Assembleias = () => {
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  const { data: assembleias = [] } = useQuery({
    queryKey: ["assembleias"],
    queryFn: async () => (await supabase.from("assembleias").select("*").order("data", { ascending: false })).data || [],
  });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("assembleias").insert({ ...form, responsavel_id: user?.id });
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: "Assembleia criada" }); setOpen(false); setForm(empty); qc.invalidateQueries({ queryKey: ["assembleias"] }); },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const changeEstado = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: string }) => {
      const { error } = await supabase.from("assembleias").update({ estado }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: "Estado actualizado" }); qc.invalidateQueries({ queryKey: ["assembleias"] }); },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Assembleias</h1>
            <p className="text-sm text-muted-foreground">Assembleias do 1.º e 2.º semestre — quando encerradas bloqueiam alterações estatísticas do período</p>
          </div>
          {isAdmin && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus size={16} className="mr-1" /> Nova Assembleia</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nova Assembleia</DialogTitle></DialogHeader>
                <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label>Ano</Label><Input type="number" value={form.ano} onChange={(e) => setForm({ ...form, ano: Number(e.target.value) })} /></div>
                    <div className="space-y-1.5"><Label>Semestre</Label>
                      <Select value={String(form.semestre)} onValueChange={(v) => setForm({ ...form, semestre: Number(v) })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="1">1º Semestre</SelectItem><SelectItem value="2">2º Semestre</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5"><Label>Data</Label><Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></div>
                    <div className="space-y-1.5"><Label>Nível</Label>
                      <Select value={form.estrutura_tipo} onValueChange={(v) => setForm({ ...form, estrutura_tipo: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="nacional">Nacional</SelectItem><SelectItem value="distrito">Distrital</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5 col-span-2"><Label>Observações</Label><Textarea rows={2} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></div>
                  </div>
                  <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit">Criar</Button></div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">{assembleias.length} assembleias</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Ano/Sem</TableHead><TableHead>Data</TableHead><TableHead>Nível</TableHead>
                <TableHead>Estado</TableHead><TableHead>Acções</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {(assembleias as any[]).length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma assembleia</TableCell></TableRow>
                ) : (assembleias as any[]).map((a: any) => {
                  const est = ESTADOS.find((e) => e.v === a.estado);
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.ano} · {a.semestre}º Sem</TableCell>
                      <TableCell>{new Date(a.data).toLocaleDateString("pt-AO")}</TableCell>
                      <TableCell className="capitalize">{a.estrutura_tipo}</TableCell>
                      <TableCell><Badge variant={est?.color}>{a.estado === "encerrada" && <Lock size={11} className="mr-1" />}{est?.l}</Badge></TableCell>
                      <TableCell>
                        {isAdmin && a.estado !== "encerrada" && (
                          <Select value={a.estado} onValueChange={(v) => changeEstado.mutate({ id: a.id, estado: v })}>
                            <SelectTrigger className="w-40 h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>{ESTADOS.map((e) => <SelectItem key={e.v} value={e.v}>{e.l}</SelectItem>)}</SelectContent>
                          </Select>
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
    </DashboardLayout>
  );
};

export default Assembleias;
