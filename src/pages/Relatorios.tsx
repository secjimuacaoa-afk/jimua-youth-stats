import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Send, CheckCircle, XCircle, Clock } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const statusConfig: Record<string, { label: string; variant: "outline" | "default" | "destructive"; icon: any }> = {
  rascunho: { label: "Rascunho", variant: "outline", icon: Clock },
  submetido: { label: "Submetido", variant: "default", icon: Send },
  aprovado: { label: "Aprovado", variant: "default", icon: CheckCircle },
  rejeitado: { label: "Rejeitado", variant: "destructive", icon: XCircle },
};

const currentYear = new Date().getFullYear();
const currentSemestre = new Date().getMonth() < 6 ? 1 : 2;

const Relatorios = () => {
  const [createOpen, setCreateOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedRelatorio, setSelectedRelatorio] = useState<any>(null);
  const [comentario, setComentario] = useState("");
  const [ano, setAno] = useState(String(currentYear));
  const [semestre, setSemestre] = useState(String(currentSemestre));
  const [igrejaId, setIgrejaId] = useState("");
  const { toast } = useToast();
  const { user, isAdmin, userEstruturas } = useAuth();
  const queryClient = useQueryClient();

  const { data: relatorios = [], isLoading } = useQuery({
    queryKey: ["relatorios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("relatorios")
        .select("*, igrejas(nome, circuitos(nome, intendencias(nome)))")
        .order("created_at", { ascending: false });
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

  const createMutation = useMutation({
    mutationFn: async () => {
      const eid = isAdmin ? igrejaId : userEstruturas[0];
      if (!eid) throw new Error("Sem igreja associada");
      const { error } = await supabase.from("relatorios").insert({
        igreja_id: eid, ano: parseInt(ano), semestre: parseInt(semestre),
        status: "rascunho" as any, created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Relatório criado como rascunho" });
      setCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["relatorios"] });
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, comentario_admin }: { id: string; status: string; comentario_admin?: string }) => {
      const updateData: any = { status: status as any };
      if (status === "submetido") updateData.data_submissao = new Date().toISOString();
      if (comentario_admin) updateData.comentario_admin = comentario_admin;
      const { error } = await supabase.from("relatorios").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Estado atualizado" });
      setReviewOpen(false);
      setSelectedRelatorio(null);
      setComentario("");
      queryClient.invalidateQueries({ queryKey: ["relatorios"] });
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Relatórios Semestrais</h1>
            <p className="text-sm text-muted-foreground mt-1">Submissão e validação de mapas estatísticos</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-navy-dark">
                <FileText size={18} className="mr-2" />
                Novo Relatório
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Criar Relatório Semestral</DialogTitle></DialogHeader>
              <form className="space-y-4 mt-2" onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}>
                {isAdmin && (
                  <div className="space-y-2">
                    <Label>Igreja *</Label>
                    <Select value={igrejaId} onValueChange={setIgrejaId} required>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {igrejas.map((i: any) => (
                          <SelectItem key={i.id} value={i.id}>
                            {(i.circuitos as any)?.intendencias?.nome} → {(i.circuitos as any)?.nome} → {i.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ano</Label>
                    <Select value={ano} onValueChange={setAno}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                          <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Semestre</Label>
                    <Select value={semestre} onValueChange={setSemestre}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1º Semestre</SelectItem>
                        <SelectItem value="2">2º Semestre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                  <Button type="submit" className="bg-primary text-primary-foreground" disabled={createMutation.isPending}>Criar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{relatorios.length} relatórios</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Igreja</TableHead>
                    <TableHead>Ano</TableHead>
                    <TableHead>Semestre</TableHead>
                    <TableHead>Data Submissão</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acções</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8">Carregando...</TableCell></TableRow>
                  ) : relatorios.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum relatório</TableCell></TableRow>
                  ) : (
                    relatorios.map((r: any) => {
                      const cfg = statusConfig[r.status] || statusConfig.rascunho;
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{(r.igrejas as any)?.nome || "—"}</TableCell>
                          <TableCell>{r.ano}</TableCell>
                          <TableCell>{r.semestre}º</TableCell>
                          <TableCell>{r.data_submissao ? new Date(r.data_submissao).toLocaleDateString("pt-AO") : "—"}</TableCell>
                          <TableCell>
                            <Badge variant={cfg.variant}>
                              <cfg.icon size={14} className="mr-1" />
                              {cfg.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="space-x-2">
                            {r.status === "rascunho" && !isAdmin && (
                              <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ id: r.id, status: "submetido" })}>
                                <Send size={14} className="mr-1" />Submeter
                              </Button>
                            )}
                            {r.status === "submetido" && isAdmin && (
                              <Button size="sm" variant="outline" onClick={() => { setSelectedRelatorio(r); setReviewOpen(true); }}>
                                Analisar
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Analisar Relatório</DialogTitle></DialogHeader>
            {selectedRelatorio && (
              <div className="space-y-4">
                <p className="text-sm"><strong>Igreja:</strong> {(selectedRelatorio.igrejas as any)?.nome}</p>
                <p className="text-sm"><strong>Período:</strong> {selectedRelatorio.semestre}º Semestre {selectedRelatorio.ano}</p>
                <div className="space-y-2">
                  <Label>Comentário</Label>
                  <Textarea value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Comentário opcional..." />
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="destructive" onClick={() => updateStatusMutation.mutate({ id: selectedRelatorio.id, status: "rejeitado", comentario_admin: comentario })}>
                    <XCircle size={14} className="mr-1" />Rejeitar
                  </Button>
                  <Button className="bg-primary text-primary-foreground" onClick={() => updateStatusMutation.mutate({ id: selectedRelatorio.id, status: "aprovado", comentario_admin: comentario })}>
                    <CheckCircle size={14} className="mr-1" />Aprovar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Relatorios;
