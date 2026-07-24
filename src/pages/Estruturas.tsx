import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Church, MapPin, Building, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type Kind = "dist" | "int" | "circ" | "igr";

const Estruturas = () => {
  const { toast } = useToast();
  const { isAdmin, isSuperAdmin } = useAuth();
  const qc = useQueryClient();
  const [dialog, setDialog] = useState<{ open: boolean; kind: Kind | null; editId: string | null; parentId?: string }>({ open: false, kind: null, editId: null });
  const [nome, setNome] = useState("");
  const [parentId, setParentId] = useState("");

  const { data: distritos = [] } = useQuery({ queryKey: ["distritos"], queryFn: async () => (await supabase.from("distritos").select("*").order("nome")).data || [] });
  const { data: intendencias = [] } = useQuery({ queryKey: ["intendencias"], queryFn: async () => (await supabase.from("intendencias").select("*").order("nome")).data || [] });
  const { data: circuitos = [] } = useQuery({ queryKey: ["circuitos"], queryFn: async () => (await supabase.from("circuitos").select("*").order("nome")).data || [] });
  const { data: igrejas = [] } = useQuery({ queryKey: ["igrejas"], queryFn: async () => (await supabase.from("igrejas").select("*").order("nome")).data || [] });

  const open = (kind: Kind, editId: string | null = null, parent?: string, currentNome = "") => {
    setDialog({ open: true, kind, editId, parentId: parent });
    setNome(currentNome);
    setParentId(parent || "");
  };
  const close = () => { setDialog({ open: false, kind: null, editId: null }); setNome(""); setParentId(""); };

  const save = useMutation({
    mutationFn: async () => {
      const { kind, editId } = dialog;
      const tables: Record<Kind, string> = { dist: "distritos", int: "intendencias", circ: "circuitos", igr: "igrejas" };
      const parentField: Record<Kind, string | null> = { dist: null, int: "distrito_id", circ: "intendencia_id", igr: "circuito_id" };
      const table = tables[kind!] as "distritos" | "intendencias" | "circuitos" | "igrejas";
      const payload: any = { nome };
      if (parentField[kind!]) payload[parentField[kind!]!] = parentId || null;
      if (editId) {
        const { error } = await supabase.from(table).update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(table).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Guardado" });
      close();
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const intByDistrito = useMemo(() => {
    const m: Record<string, any[]> = {};
    (intendencias as any[]).forEach((i: any) => { const k = i.distrito_id || "_none"; (m[k] = m[k] || []).push(i); });
    return m;
  }, [intendencias]);
  const circByIntendencia = useMemo(() => {
    const m: Record<string, any[]> = {};
    (circuitos as any[]).forEach((c: any) => { (m[c.intendencia_id] = m[c.intendencia_id] || []).push(c); });
    return m;
  }, [circuitos]);
  const igrByCircuito = useMemo(() => {
    const m: Record<string, any[]> = {};
    (igrejas as any[]).forEach((i: any) => { (m[i.circuito_id] = m[i.circuito_id] || []).push(i); });
    return m;
  }, [igrejas]);

  const kindLabel: Record<string, string> = { dist: "Distrito", int: "Intendência", circ: "Circuito", igr: "Igreja" };
  const parentOptions = dialog.kind === "int" ? distritos : dialog.kind === "circ" ? intendencias : dialog.kind === "igr" ? circuitos : [];

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Estruturas Eclesiásticas</h1>
            <p className="text-sm text-muted-foreground">Hierarquia: {isSuperAdmin ? "Distrito → " : ""}Intendência → Circuito → Igreja</p>
          </div>
          {isSuperAdmin && <Button onClick={() => open("dist")}><Plus size={16} className="mr-1" /> Novo Distrito</Button>}
          {!isSuperAdmin && isAdmin && <Button onClick={() => open("int")}><Plus size={16} className="mr-1" /> Nova Intendência</Button>}
        </div>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Árvore de estruturas</CardTitle></CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {(isSuperAdmin ? (distritos as any[]) : [{ id: "_all", nome: "Todas Intendências" }]).map((d: any) => {
                const ints = isSuperAdmin ? (intByDistrito[d.id] || []) : (intendencias as any[]);
                return (
                  <AccordionItem key={d.id} value={d.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 w-full">
                        <Globe size={16} className="text-primary" />
                        <span className="font-semibold">{d.nome}</span>
                        <Badge variant="outline">{ints.length} intendência(s)</Badge>
                        {isSuperAdmin && d.id !== "_all" && (
                          <Button size="icon" variant="ghost" className="h-6 w-6 ml-auto mr-2" onClick={(e) => { e.stopPropagation(); open("dist", d.id, undefined, d.nome); }}><Pencil size={12} /></Button>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="ml-6 space-y-2">
                        {isAdmin && isSuperAdmin && (
                          <Button size="sm" variant="ghost" onClick={() => open("int", null, d.id)}><Plus size={13} className="mr-1" /> Nova Intendência</Button>
                        )}
                        <Accordion type="multiple">
                          {ints.map((int: any) => {
                            const circs = circByIntendencia[int.id] || [];
                            return (
                              <AccordionItem key={int.id} value={int.id}>
                                <AccordionTrigger className="hover:no-underline text-sm">
                                  <div className="flex items-center gap-3 w-full">
                                    <MapPin size={14} className="text-secondary" />
                                    <span>{int.nome}</span>
                                    <Badge variant="outline">{circs.length} circuito(s)</Badge>
                                    {isAdmin && <Button size="icon" variant="ghost" className="h-6 w-6 ml-auto mr-2" onClick={(e) => { e.stopPropagation(); open("int", int.id, int.distrito_id, int.nome); }}><Pencil size={12} /></Button>}
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="ml-6 space-y-2">
                                    {isAdmin && <Button size="sm" variant="ghost" onClick={() => open("circ", null, int.id)}><Plus size={13} className="mr-1" /> Novo Circuito</Button>}
                                    <Accordion type="multiple">
                                      {circs.map((c: any) => {
                                        const igs = igrByCircuito[c.id] || [];
                                        return (
                                          <AccordionItem key={c.id} value={c.id}>
                                            <AccordionTrigger className="hover:no-underline text-sm">
                                              <div className="flex items-center gap-3 w-full">
                                                <Building size={14} className="text-accent-foreground" />
                                                <span>{c.nome}</span>
                                                <Badge variant="outline">{igs.length} igreja(s)</Badge>
                                                {isAdmin && <Button size="icon" variant="ghost" className="h-6 w-6 ml-auto mr-2" onClick={(e) => { e.stopPropagation(); open("circ", c.id, c.intendencia_id, c.nome); }}><Pencil size={12} /></Button>}
                                              </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                              <div className="ml-6 space-y-1">
                                                {isAdmin && <Button size="sm" variant="ghost" onClick={() => open("igr", null, c.id)}><Plus size={13} className="mr-1" /> Nova Igreja</Button>}
                                                {igs.length === 0 && <p className="text-xs text-muted-foreground py-2">Nenhuma igreja registada</p>}
                                                {igs.map((ig: any) => (
                                                  <div key={ig.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50">
                                                    <Church size={14} className="text-primary" />
                                                    <span className="text-sm">{ig.nome}</span>
                                                    {isAdmin && <Button size="icon" variant="ghost" className="h-6 w-6 ml-auto" onClick={() => open("igr", ig.id, ig.circuito_id, ig.nome)}><Pencil size={12} /></Button>}
                                                  </div>
                                                ))}
                                              </div>
                                            </AccordionContent>
                                          </AccordionItem>
                                        );
                                      })}
                                    </Accordion>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            );
                          })}
                        </Accordion>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>

        <Dialog open={dialog.open} onOpenChange={(v) => !v && close()}>
          <DialogContent>
            <DialogHeader><DialogTitle>{dialog.editId ? "Editar" : "Nova"} {dialog.kind ? kindLabel[dialog.kind] : ""}</DialogTitle></DialogHeader>
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
              {dialog.kind && dialog.kind !== "dist" && (
                <div className="space-y-1.5">
                  <Label>{dialog.kind === "int" ? "Distrito" : dialog.kind === "circ" ? "Intendência" : "Circuito"}</Label>
                  <Select value={parentId} onValueChange={setParentId} required={dialog.kind !== "int"}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{(parentOptions as any[]).map((p: any) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Nome *</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={close}>Cancelar</Button>
                <Button type="submit" disabled={save.isPending}>{dialog.editId ? "Actualizar" : "Criar"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Estruturas;
