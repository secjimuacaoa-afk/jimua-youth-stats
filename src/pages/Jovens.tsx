import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const calcAge = (dob: string) => Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
const calcParteEtaria = (dob: string) => { const age = calcAge(dob); return age >= 12 && age <= 17 ? "H" : "I"; };

const Jovens = () => {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [sexo, setSexo] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [categoria, setCategoria] = useState("");
  const [escolaridade, setEscolaridade] = useState("");
  const [ocupacao, setOcupacao] = useState("");
  const [estadoCivil, setEstadoCivil] = useState("");
  const [origem, setOrigem] = useState("");
  const { toast } = useToast();
  const { user, isAdmin, userEstruturas } = useAuth();
  const queryClient = useQueryClient();

  // Admin filters
  const [filterIntendencia, setFilterIntendencia] = useState("");
  const [filterCircuito, setFilterCircuito] = useState("");
  const [filterIgreja, setFilterIgreja] = useState("");

  // Hierarchy data for filters
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

  const filteredCircuitos = filterIntendencia
    ? circuitos.filter((c: any) => c.intendencia_id === filterIntendencia)
    : [];

  const filteredIgrejas = filterCircuito
    ? igrejas.filter((i: any) => i.circuito_id === filterCircuito)
    : [];

  const { data: jovens = [], isLoading } = useQuery({
    queryKey: ["jovens", filterIgreja, isAdmin],
    queryFn: async () => {
      let query = supabase
        .from("jovens")
        .select("*, igrejas(nome, circuitos(nome, intendencias(nome)))")
        .order("nome");

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
      const { error } = await supabase.from("jovens").insert({
        nome, sexo: sexo as any, data_nascimento: dataNascimento, categoria,
        escolaridade: escolaridade || null, ocupacao: ocupacao || null,
        estado_civil: estadoCivil || null, origem: origem || null,
        igreja_id: igrejaId, created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Jovem registado com sucesso" });
      setDialogOpen(false);
      setNome(""); setSexo(""); setDataNascimento(""); setCategoria("");
      setEscolaridade(""); setOcupacao(""); setEstadoCivil(""); setOrigem("");
      queryClient.invalidateQueries({ queryKey: ["jovens"] });
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

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
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                <form className="space-y-4 mt-2" onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}>
                  <div className="space-y-2">
                    <Label>Nome Completo *</Label>
                    <Input placeholder="Nome do jovem" value={nome} onChange={(e) => setNome(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Sexo *</Label>
                      <Select value={sexo} onValueChange={setSexo} required>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="masculino">Masculino</SelectItem>
                          <SelectItem value="feminino">Feminino</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Data de Nascimento *</Label>
                      <Input type="date" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Categoria *</Label>
                      <Select value={categoria} onValueChange={setCategoria} required>
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
                      <Select value={escolaridade} onValueChange={setEscolaridade}>
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
                      <Select value={ocupacao} onValueChange={setOcupacao}>
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
                      <Select value={estadoCivil} onValueChange={setEstadoCivil}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Y">Y</SelectItem>
                          <SelectItem value="Z">Z</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Origem</Label>
                    <Select value={origem} onValueChange={setOrigem}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {["A", "A1", "A2", "B", "B1"].map((v) => (
                          <SelectItem key={v} value={v}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                    <Button type="submit" className="bg-primary text-primary-foreground" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Registando..." : "Registar"}
                    </Button>
                  </div>
                </form>
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
                      {intendencias.map((i: any) => (
                        <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterCircuito} onValueChange={(v) => { setFilterCircuito(v); setFilterIgreja(""); }} disabled={!filterIntendencia}>
                    <SelectTrigger><SelectValue placeholder={filterIntendencia ? "Circuito" : "Selecione intendência"} /></SelectTrigger>
                    <SelectContent>
                      {filteredCircuitos.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterIgreja} onValueChange={setFilterIgreja} disabled={!filterCircuito}>
                    <SelectTrigger><SelectValue placeholder={filterCircuito ? "Igreja" : "Selecione circuito"} /></SelectTrigger>
                    <SelectContent>
                      {filteredIgrejas.map((i: any) => (
                        <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>
                      ))}
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8">Carregando...</TableCell></TableRow>
                    ) : filteredJovens.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum jovem registado</TableCell></TableRow>
                    ) : (
                      filteredJovens.map((jovem: any) => (
                        <TableRow key={jovem.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell className="font-medium">{jovem.nome}</TableCell>
                          <TableCell>{jovem.sexo === "masculino" ? "M" : "F"}</TableCell>
                          <TableCell>{calcAge(jovem.data_nascimento)}</TableCell>
                          <TableCell>
                            <Badge variant={calcParteEtaria(jovem.data_nascimento) === "H" ? "secondary" : "default"}>
                              {calcParteEtaria(jovem.data_nascimento) === "H" ? "12–17" : "18–25"}
                            </Badge>
                          </TableCell>
                          <TableCell>{jovem.categoria}</TableCell>
                          <TableCell className="text-sm">{(jovem.igrejas as any)?.nome || "—"}</TableCell>
                          <TableCell>
                            <Badge variant={jovem.activo ? "default" : "destructive"}>
                              {jovem.activo ? "Activo" : "Inactivo"}
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
        )}
      </div>
    </DashboardLayout>
  );
};

export default Jovens;
