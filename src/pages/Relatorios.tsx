import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Send, CheckCircle, XCircle, Clock } from "lucide-react";

const mockRelatorios = [
  { id: "1", igreja: "Igreja Bom Pastor", ano: 2025, semestre: 1, status: "aprovado", dataSubmissao: "2025-07-15" },
  { id: "2", igreja: "Igreja Esperança", ano: 2025, semestre: 1, status: "submetido", dataSubmissao: "2025-07-18" },
  { id: "3", igreja: "Igreja Nova Aliança", ano: 2025, semestre: 1, status: "rejeitado", dataSubmissao: "2025-07-10" },
  { id: "4", igreja: "Igreja Monte Sinai", ano: 2025, semestre: 1, status: "rascunho", dataSubmissao: null },
];

const statusConfig = {
  rascunho: { label: "Rascunho", variant: "outline" as const, icon: Clock },
  submetido: { label: "Submetido", variant: "default" as const, icon: Send },
  aprovado: { label: "Aprovado", variant: "default" as const, icon: CheckCircle },
  rejeitado: { label: "Rejeitado", variant: "destructive" as const, icon: XCircle },
};

const Relatorios = () => {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Relatórios Semestrais</h1>
            <p className="text-sm text-muted-foreground mt-1">Submissão e validação de mapas estatísticos</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-navy-dark">
            <FileText size={18} className="mr-2" />
            Gerar Relatório
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Relatórios — 1º Semestre 2025</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cargo Pastoral</TableHead>
                    <TableHead>Ano</TableHead>
                    <TableHead>Semestre</TableHead>
                    <TableHead>Data Submissão</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acções</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRelatorios.map((r) => {
                    const cfg = statusConfig[r.status as keyof typeof statusConfig];
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.igreja}</TableCell>
                        <TableCell>{r.ano}</TableCell>
                        <TableCell>{r.semestre}º</TableCell>
                        <TableCell>{r.dataSubmissao || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={cfg.variant}>
                            <cfg.icon size={14} className="mr-1" />
                            {cfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">Ver</Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Relatorios;
