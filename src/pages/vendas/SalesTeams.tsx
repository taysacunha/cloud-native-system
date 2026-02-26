import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Users, Loader2 } from "lucide-react";
import { useSystemAccess } from "@/hooks/useSystemAccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";

const teamSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  is_active: z.boolean(),
});

type TeamFormData = z.infer<typeof teamSchema>;

interface SalesTeam {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  broker_count?: number;
}

const SalesTeams = () => {
  const queryClient = useQueryClient();
  // ✅ USAR PERMISSÃO DE SISTEMA para controlar botões de edição
  const { canEdit } = useSystemAccess();
  const canEditVendas = canEdit("vendas");
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTeam, setDeleteTeam] = useState<SalesTeam | null>(null);
  const [editingTeam, setEditingTeam] = useState<SalesTeam | null>(null);
  const [formData, setFormData] = useState<TeamFormData>({ name: "", is_active: true });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: teams, isLoading } = useQuery({
    queryKey: ["sales-teams"],
    queryFn: async () => {
      const { data: teamsData, error: teamsError } = await supabase
        .from("sales_teams")
        .select("*")
        .order("name");

      if (teamsError) throw teamsError;

      // Count brokers per team
      const { data: brokersData } = await supabase
        .from("sales_brokers")
        .select("team_id")
        .eq("is_active", true);

      const brokerCounts: Record<string, number> = {};
      (brokersData || []).forEach((b) => {
        if (b.team_id) {
          brokerCounts[b.team_id] = (brokerCounts[b.team_id] || 0) + 1;
        }
      });

      return (teamsData || []).map((team) => ({
        ...team,
        broker_count: brokerCounts[team.id] || 0,
      })) as SalesTeam[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: TeamFormData) => {
      const { error } = await supabase.from("sales_teams").insert([{
        name: data.name,
        is_active: data.is_active,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-teams"] });
      toast.success("Equipe criada com sucesso!");
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar equipe");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TeamFormData }) => {
      const { error } = await supabase.from("sales_teams").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-teams"] });
      toast.success("Equipe atualizada com sucesso!");
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar equipe");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Check if team has any brokers or sales associated
      const [brokersCheck, salesCheck] = await Promise.all([
        supabase.from("sales_brokers").select("id").eq("team_id", id).limit(1),
        supabase.from("sales").select("id").eq("team_id", id).limit(1),
      ]);
      
      const hasBrokers = (brokersCheck.data?.length || 0) > 0;
      const hasSales = (salesCheck.data?.length || 0) > 0;
      
      if (hasBrokers || hasSales) {
        throw new Error("DEACTIVATE_INSTEAD");
      }
      
      const { error } = await supabase.from("sales_teams").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-teams"] });
      toast.success("Equipe removida com sucesso!");
      setDeleteTeam(null);
    },
    onError: (error: any) => {
      if (error.message === "DEACTIVATE_INSTEAD") {
        toast.error("Esta equipe possui corretores ou vendas vinculadas. Use a opção de desativar em vez de remover.");
      } else {
        toast.error(error.message || "Erro ao remover equipe");
      }
      setDeleteTeam(null);
    },
  });

  const handleOpenCreate = () => {
    setEditingTeam(null);
    setFormData({ name: "", is_active: true });
    setErrors({});
    setDialogOpen(true);
  };

  const handleOpenEdit = (team: SalesTeam) => {
    setEditingTeam(team);
    setFormData({ name: team.name, is_active: team.is_active });
    setErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTeam(null);
    setFormData({ name: "", is_active: true });
    setErrors({});
  };

  const handleSubmit = () => {
    const result = teamSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    if (editingTeam) {
      updateMutation.mutate({ id: editingTeam.id, data: result.data });
    } else {
      createMutation.mutate(result.data);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Equipes de Vendas</h1>
          <p className="text-muted-foreground">Gerencie as equipes de corretores</p>
        </div>
        {canEditVendas && (
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Equipe
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Equipes Cadastradas
          </CardTitle>
          <CardDescription>
            {teams?.length || 0} equipes no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Corretores</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {teams?.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell className="font-medium">{team.name}</TableCell>
                      <TableCell>{team.broker_count} corretor(es)</TableCell>
                      <TableCell>
                        <Badge variant={team.is_active ? "default" : "secondary"}>
                          {team.is_active ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                      {canEditVendas && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(team)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteTeam(team)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {teams?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Nenhuma equipe cadastrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTeam ? "Editar Equipe" : "Nova Equipe"}</DialogTitle>
            <DialogDescription>
              {editingTeam
                ? "Altere os dados da equipe"
                : "Preencha os dados para criar uma nova equipe"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Equipe</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Equipe Serra"
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Equipe Ativa</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : editingTeam ? (
                "Salvar Alterações"
              ) : (
                "Criar Equipe"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTeam} onOpenChange={() => setDeleteTeam(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Equipe</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a equipe <strong>{deleteTeam?.name}</strong>?
              <br /><br />
              <span className="text-muted-foreground">
                Nota: Se esta equipe possuir corretores ou vendas vinculadas, 
                a remoção será impedida. Neste caso, use a opção de desativar a equipe.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTeam && deleteMutation.mutate(deleteTeam.id)}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Remover"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SalesTeams;
