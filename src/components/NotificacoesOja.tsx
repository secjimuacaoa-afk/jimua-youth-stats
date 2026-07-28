import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const NotificacoesOja = () => {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: pendentes = [] } = useQuery({
    queryKey: ["jovens-a-transferir"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("jovens_a_transferir");
      if (error) return [];
      return data || [];
    },
  });

  const transferir = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("jovens").update({ is_oja: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Transferido", description: "Jovem movido para a Organização de Jovens Adultos." });
      qc.invalidateQueries({ queryKey: ["jovens-a-transferir"] });
      qc.invalidateQueries({ queryKey: ["jovens"] });
      qc.invalidateQueries({ queryKey: ["dashboard-jovens"] });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const list = pendentes as any[];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Bell size={16} />
          {list.length > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 min-w-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px]">
              {list.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="p-3 border-b">
          <p className="text-sm font-semibold">Transferência para OJA</p>
          <p className="text-xs text-muted-foreground">Jovens que atingiram 26 anos</p>
        </div>
        <div className="max-h-72 overflow-y-auto divide-y">
          {list.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">Sem pendentes.</p>
          ) : (
            list.map((j) => (
              <div key={j.id} className="p-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{j.nome}</p>
                  <p className="text-xs text-muted-foreground">{j.idade} anos</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => transferir.mutate(j.id)} disabled={transferir.isPending}>
                  Transferir para OJA
                </Button>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificacoesOja;
