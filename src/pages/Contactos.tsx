import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MessageCircle, Plus, Pencil, Trash2, Search, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const ESTRUTURA_LABELS: Record<string, string> = {
  nacional: "Nacional",
  distrito: "Distrito",
  intendencia: "Intendência",
  circuito: "Circuito",
  igreja: "Igreja",
};

const empty = { nome: "", cargo: "", estrutura_tipo: "", estrutura_id: "", telefone: "", whatsapp: "", email: "", notas: "" };

const Contactos = () => {
  const { toast } = useToast();
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("all");

  const { data: contactos = [] } = useQuery({
    queryKey: ["contactos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contactos").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: distritos = [] } = useQuery({
    queryKey: ["distritos"],
    queryFn: async () => (await supabase.from("distritos").select("id,nome").order("nome")).data || [],
  });
  const { data: intendencias = [] } = useQuery({
    queryKey: ["intendencias"],
    queryFn: async () => (await supabase.from("intendencias").select("id,nome").order("nome")).data || [],
  });
  const { data: circuitos = [] } = useQuery({
    queryKey: ["circuitos"],
    queryFn: async () => (await supabase.from("circuitos").select("id,nome").order("nome")).data || [],
  });
  const { data: igrejas = [] } = useQuery({
    queryKey: ["igrejas"],
    queryFn: async () => (await supabase.from("igrejas").select("id,nome").order("nome")).data || [],
  });

  const structureOptions = useMemo(() => {
    switch (form.estrutura_tipo) {
      case "distrito": return distritos;
      case "intendencia": return intendencias;
      case "circuito": return circuitos;
      case "igreja": return igrejas;
      default: return [];
    }
  }, [form.estrutura_tipo, distritos, intendencias, circuitos, igrejas]);

  const nomeEstrutura = (c: any) => {
    if (c.estrutura_tipo === "nacional") return "Nacional";
    const src = c.estrutura_tipo === "distrito" ? distritos : c.estrutura_tipo === "intendencia" ? intendencias : c.estrutura_tipo === "circuito" ? circuitos : igrejas;
    return (src as any[]).find((x: any) => x.id === c.estrutura_id)?.nome || "—";
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contactos.filter((c: any) => {
      if (filterTipo !== "all" && c.estrutura_tipo !== filterTipo) return false;
      if (!q) return true;
      return [c.nome, c.cargo, c.telefone, c.email].filter(Boolean).some((v: string) => v.toLowerCase().includes(q));
    });
  }, [contactos, search, filterTipo]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        nome: form.nome,
        cargo: form.cargo,
        estrutura_tipo: form.estrutura_tipo,
        estrutura_id: form.estrutura_tipo === "nacional" ? null : (form.estrutura_id || null),
        telefone: form.telefone || null,
        whatsapp: form.whatsapp || null,
        email: form.email || null,
        notas: form.notas || null,
      };
      if (editId) {
        const { error } = await supabase.from("contactos").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("contactos").insert({ ...payload, criado_por: user?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: editId ? "Contacto actualizado" : "Contacto criado" });
      setOpen(false); setForm(empty); setEditId(null);
      qc.invalidateQueries({ queryKey: ["contactos"] });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contactos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Contacto eliminado" });
      qc.invalidateQueries({ queryKey: ["contactos"] });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const openEdit = (c: any) => {
    setEditId(c.id);
    setForm({
      nome: c.nome, cargo: c.cargo, estrutura_tipo: c.estrutura_tipo,
      estrutura_id: c.estrutura_id || "", telefone: c.telefone || "",
      whatsapp: c.whatsapp || "", email: c.email || "", notas: c.notas || "",
    });
    setOpen(true);
  };

  const canModify = (c: any) => c.criado_por === user?.id || isAdmin || isSuperAdmin;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Contactos</h1>
            <p className="text-sm text-muted-foreground mt-1">Directório de líderes e responsáveis — visível a todos os utilizadores</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm(empty); setEditId(null); } }}>
            <DialogTrigger asChild>
              <Button><Plus size={16} className="mr-1" /> Novo Contacto</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editId ? "Editar" : "Novo"} Contacto</DialogTitle></DialogHeader>
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5 col-span-2">
                    <Label>Nome completo *</Label>
                    <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label>Cargo *</Label>
                    <Input value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} placeholder="Ex: Secretário Local, Director" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Nível *</Label>
                    <Select value={form.estrutura_tipo} onValueChange={(v) => setForm({ ...form, estrutura_tipo: v, estrutura_id: "" })} required>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(ESTRUTURA_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {form.estrutura_tipo && form.estrutura_tipo !== "nacional" && (
                    <div className="space-y-1.5">
                      <Label>Estrutura *</Label>
                      <Select value={form.estrutura_id} onValueChange={(v) => setForm({ ...form, estrutura_id: v })} required>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {(structureOptions as any[]).map((o: any) => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label>Telefone</Label>
                    <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>WhatsApp</Label>
                    <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label>Email</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label>Notas</Label>
                    <Textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} rows={2} />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={save.isPending}>{save.isPending ? "Salvando..." : editId ? "Actualizar" : "Criar"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="py-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input placeholder="Pesquisar por nome, cargo, telefone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="sm:w-52"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os níveis</SelectItem>
                {Object.entries(ESTRUTURA_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c: any) => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{c.nome}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.cargo}</p>
                  </div>
                  {canModify(c) && (
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(c)}><Pencil size={13} /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("Eliminar?")) del.mutate(c.id); }}><Trash2 size={13} /></Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Badge variant="outline" className="gap-1"><MapPin size={11} />{ESTRUTURA_LABELS[c.estrutura_tipo]} · {nomeEstrutura(c)}</Badge>
                {c.telefone && <div className="flex items-center gap-2 text-muted-foreground"><Phone size={14} /><a href={`tel:${c.telefone}`} className="hover:text-primary">{c.telefone}</a></div>}
                {c.whatsapp && <div className="flex items-center gap-2 text-muted-foreground"><MessageCircle size={14} /><a href={`https://wa.me/${c.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="hover:text-primary">{c.whatsapp}</a></div>}
                {c.email && <div className="flex items-center gap-2 text-muted-foreground"><Mail size={14} /><a href={`mailto:${c.email}`} className="hover:text-primary truncate">{c.email}</a></div>}
                {c.notas && <p className="text-xs text-muted-foreground pt-1 border-t">{c.notas}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-10">Nenhum contacto registado.</p>}
      </div>
    </DashboardLayout>
  );
};

export default Contactos;
