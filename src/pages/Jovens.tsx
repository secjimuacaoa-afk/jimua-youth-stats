import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Filter, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Jovem {
  id: string;
  nome: string;
  sexo: "M" | "F";
  dataNascimento: string;
  parteEtaria: "H" | "I";
  categoria: string;
  cargoPastoral: string;
  activo: boolean;
}

const mockJovens: Jovem[] = [
  { id: "1", nome: "João Manuel Silva", sexo: "M", dataNascimento: "2004-03-15", parteEtaria: "I", categoria: "J", cargoPastoral: "Igreja Bom Pastor", activo: true },
  { id: "2", nome: "Maria Fernanda Costa", sexo: "F", dataNascimento: "2008-07-22", parteEtaria: "H", categoria: "K", cargoPastoral: "Igreja Esperança", activo: true },
  { id: "3", nome: "Pedro António Neto", sexo: "M", dataNascimento: "2001-11-03", parteEtaria: "I", categoria: "L", cargoPastoral: "Igreja Bom Pastor", activo: false },
  { id: "4", nome: "Ana Beatriz Santos", sexo: "F", dataNascimento: "2006-01-19", parteEtaria: "H", categoria: "J", cargoPastoral: "Igreja Nova Aliança", activo: true },
  { id: "5", nome: "Carlos Eduardo Mendes", sexo: "M", dataNascimento: "2003-09-30", parteEtaria: "I", categoria: "K", cargoPastoral: "Igreja Esperança", activo: true },
];

const Jovens = () => {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const filteredJovens = mockJovens.filter((j) =>
    j.nome.toLowerCase().includes(search.toLowerCase())
  );

  const calcAge = (dob: string) => {
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestão de Jovens</h1>
            <p className="text-sm text-muted-foreground mt-1">Registe e gerencie os jovens da sua unidade</p>
          </div>
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
              <form
                className="space-y-4 mt-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  setDialogOpen(false);
                  toast({ title: "Jovem registado", description: "O jovem foi adicionado com sucesso." });
                }}
              >
                <div className="space-y-2">
                  <Label>Nome Completo *</Label>
                  <Input placeholder="Nome do jovem" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Sexo *</Label>
                    <Select required>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Masculino</SelectItem>
                        <SelectItem value="F">Feminino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Data de Nascimento *</Label>
                    <Input type="date" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Categoria *</Label>
                    <Select required>
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
                    <Select>
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
                    <Select>
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
                    <Select>
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
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {["A", "A1", "A2", "B", "B1"].map((v) => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-primary text-primary-foreground">
                    Registar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por nome..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button variant="outline" size="default">
                <Filter size={16} className="mr-2" />
                Filtros
              </Button>
              <Button variant="outline" size="default">
                <Download size={16} className="mr-2" />
                Exportar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {filteredJovens.length} jovens encontrados
            </CardTitle>
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
                    <TableHead>Cargo Pastoral</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJovens.map((jovem) => (
                    <TableRow key={jovem.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">{jovem.nome}</TableCell>
                      <TableCell>{jovem.sexo === "M" ? "Masculino" : "Feminino"}</TableCell>
                      <TableCell>{calcAge(jovem.dataNascimento)}</TableCell>
                      <TableCell>
                        <Badge variant={jovem.parteEtaria === "H" ? "secondary" : "default"}>
                          {jovem.parteEtaria === "H" ? "12–17" : "18–25"}
                        </Badge>
                      </TableCell>
                      <TableCell>{jovem.categoria}</TableCell>
                      <TableCell className="text-sm">{jovem.cargoPastoral}</TableCell>
                      <TableCell>
                        <Badge variant={jovem.activo ? "default" : "destructive"}>
                          {jovem.activo ? "Activo" : "Inactivo"}
                        </Badge>
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

export default Jovens;
