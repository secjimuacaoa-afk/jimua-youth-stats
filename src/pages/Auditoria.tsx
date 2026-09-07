import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { History, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const CAMPO_LABELS: Record<string, string> = {
  nome: "Nome",
  sexo: "Sexo",
  data_nascimento: "Data de nascimento",
  categoria: "Categoria",
  escolaridade: "Escolaridade",
  ocupacao: "Situação ocupacional",
  estado_civil: "Estado civil",
  activo: "Situação (activo/inactivo)",
  motivo_inactividade: "Motivo de inactividade",
  origem: "Origem",
  igreja_id: "Igreja local",
  documentacao: "Documentação",
  is_oja: "Encaminhado à OJA",
  semestre: "Semestre",
  ano_semestre: "Ano do semestre",
  documento_url: "Documento anexado",
};

const fmtData = (d: string) =>
  new Date(d).toLocaleString("pt-AO", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

const Auditoria = () => {
  const [pesquisa, setPesquisa] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");

  const { data: registos = [], isLoading } = useQuery({
    queryKey: ["auditoria"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jovens_audit")
        .select("*, jovens(nome, igrejas(nome))")
        .order("alterado_em", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
  });

  const filtrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();
    return (registos as any[]).filter((r) => {
      const nome = r.jovens?.nome?.toLowerCase() || "";
      const campo = (CAMPO_LABELS[r.campo] || r.campo).toLowerCase();
      if (termo && !nome.includes(termo) && !campo.includes(termo)) return false;
      const quando = new Date(r.alterado_em);
      if (de && quando < new Date(`${de}T00:00:00`)) return false;
      if (ate && quando > new Date(`${ate}T23:59:59`)) return false;
      return true;
    });
  }, [registos, pesquisa, de, ate]);

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-start gap-3">
          <History className="mt-1 text-primary" size={22} />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Auditoria</h1>
            <p className="text-sm text-muted-foreground">
              Histórico das alterações feitas às fichas dos jovens dentro da sua jurisdição.
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5 sm:col-span-1">
              <Label htmlFor="a-pesquisa">Pesquisar</Label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input id="a-pesquisa" className="pl-9 min-h-11" placeholder="Nome do jovem ou campo" value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="a-de">De</Label>
              <Input id="a-de" type="date" className="min-h-11" value={de} onChange={(e) => setDe(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="a-ate">Até</Label>
              <Input id="a-ate" type="date" className="min-h-11" value={ate} onChange={(e) => setAte(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Alterações registadas ({filtrados.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && <p className="text-sm text-muted-foreground py-4">A carregar…</p>}
            {!isLoading && filtrados.length === 0 && (
              <p className="text-sm text-muted-foreground py-4">Nenhuma alteração encontrada para os critérios indicados.</p>
            )}

            {/* Lista em telemóvel */}
            <div className="space-y-3 md:hidden">
              {filtrados.map((r: any) => (
                <div key={r.id} className="rounded-lg border p-3 space-y-1">
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold text-sm">{r.jovens?.nome || "—"}</span>
                    <span className="text-xs text-muted-foreground">{fmtData(r.alterado_em)}</span>
                  </div>
                  <Badge variant="outline">{CAMPO_LABELS[r.campo] || r.campo}</Badge>
                  <p className="text-sm break-words">
                    <span className="text-muted-foreground line-through">{r.valor_anterior || "—"}</span>
                    {" → "}
                    <strong>{r.valor_novo || "—"}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground">{r.jovens?.igrejas?.nome || ""}</p>
                </div>
              ))}
            </div>

            {/* Tabela em ecrã grande */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Data</th>
                    <th className="py-2 pr-3 font-medium">Jovem</th>
                    <th className="py-2 pr-3 font-medium">Igreja Local</th>
                    <th className="py-2 pr-3 font-medium">Campo alterado</th>
                    <th className="py-2 pr-3 font-medium">Valor anterior</th>
                    <th className="py-2 font-medium">Valor novo</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((r: any) => (
                    <tr key={r.id} className="border-b last:border-0 align-top">
                      <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">{fmtData(r.alterado_em)}</td>
                      <td className="py-2 pr-3">{r.jovens?.nome || "—"}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{r.jovens?.igrejas?.nome || "—"}</td>
                      <td className="py-2 pr-3">{CAMPO_LABELS[r.campo] || r.campo}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{r.valor_anterior || "—"}</td>
                      <td className="py-2 font-medium">{r.valor_novo || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Auditoria;
