import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Church } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const Estruturas = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [intendencia, setIntendencia] = useState("");
  const [circuito, setCircuito] = useState("");
  const [cargoPastoral, setCargoPastoral] = useState("");
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: estruturas = [], isLoading } = useQuery({
    queryKey: ["estruturas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("estruturas").select("*").order("intendencia");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("estruturas").insert({ intendencia, circuito, cargo_pastoral: cargoPastoral });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Estrutura criada" });
      setDialogOpen(false);
      setIntendencia(""); setCircuito(""); setCargoPastoral("");
      queryClient.invalidateQueries({ queryKey: ["estruturas"] });
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
            <h1 className="text-2xl font-bold text-foreground">Estruturas Eclesiásticas</h1>
            <p className="text-sm text-muted-foreground mt-1">Gerencie intendências, circuitos e cargos pastorais</p>
          </div>
          {isAdmin && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-navy-dark">
                  <Plus size={18} className="mr-2" />
                  Nova Estrutura
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Criar Nova Estrutura</DialogTitle>
                </DialogHeader>
                <form className="space-y-4 mt-2" onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}>
                  <div className="space-y-2">
                    <Label>Intendência *</Label>
                    <Input placeholder="Ex: Intendência Norte" value={intendencia} onChange={(e) => setIntendencia(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Circuito *</Label>
                    <Input placeholder="Ex: Circuito Luanda" value={circuito} onChange={(e) => setCircuito(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Cargo Pastoral *</Label>
                    <Input placeholder="Ex: Igreja Bom Pastor" value={cargoPastoral} onChange={(e) => setCargoPastoral(e.target.value)} required />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                    <Button type="submit" className="bg-primary text-primary-foreground" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Criando..." : "Criar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Church size={18} />
              {estruturas.length} estruturas registadas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Intendência</TableHead>
                    <TableHead>Circuito</TableHead>
                    <TableHead>Cargo Pastoral</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-8">Carregando...</TableCell></TableRow>
                  ) : estruturas.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Nenhuma estrutura registada</TableCell></TableRow>
                  ) : (
                    estruturas.map((e: any) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{e.intendencia}</TableCell>
                        <TableCell>{e.circuito}</TableCell>
                        <TableCell>{e.cargo_pastoral}</TableCell>
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

export default Estruturas;
