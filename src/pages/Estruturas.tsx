import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Church } from "lucide-react";

const mockEstruturas = [
  { id: "1", intendencia: "Intendência Norte", circuito: "Circuito Luanda", cargoPastoral: "Igreja Bom Pastor" },
  { id: "2", intendencia: "Intendência Norte", circuito: "Circuito Luanda", cargoPastoral: "Igreja Esperança" },
  { id: "3", intendencia: "Intendência Sul", circuito: "Circuito Lubango", cargoPastoral: "Igreja Nova Aliança" },
  { id: "4", intendencia: "Intendência Sul", circuito: "Circuito Huambo", cargoPastoral: "Igreja Monte Sinai" },
  { id: "5", intendencia: "Intendência Centro", circuito: "Circuito Benguela", cargoPastoral: "Igreja Maranata" },
];

const Estruturas = () => {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Estruturas Eclesiásticas</h1>
            <p className="text-sm text-muted-foreground mt-1">Gerencie intendências, circuitos e cargos pastorais</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-navy-dark">
            <Plus size={18} className="mr-2" />
            Nova Estrutura
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Church size={18} />
              {mockEstruturas.length} estruturas registadas
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
                    <TableHead>Acções</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockEstruturas.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.intendencia}</TableCell>
                      <TableCell>{e.circuito}</TableCell>
                      <TableCell>{e.cargoPastoral}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">Editar</Button>
                      </TableCell>
                    </TableRow>
                  ))}
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
