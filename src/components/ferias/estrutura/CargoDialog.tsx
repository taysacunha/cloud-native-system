import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { normalizeText } from "@/lib/textUtils";
import { useFeriasCargos, FERIAS_CARGOS_QUERY_KEY } from "@/hooks/ferias/useFeriasCargos";

const schema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  is_active: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface CargoDialogProps {
  open: boolean;
  onOpenChange: () => void;
  cargo?: {
    id: string;
    nome: string;
    is_active: boolean | null;
  } | null;
}

const CargoDialog = ({ open, onOpenChange, cargo }: CargoDialogProps) => {
  const queryClient = useQueryClient();
  const isEditing = !!cargo;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: "",
      is_active: true,
    },
  });

  // Use shared hook - full data including is_active
  const { data: existingCargos = [] } = useFeriasCargos();

  useEffect(() => {
    if (open) {
      if (cargo) {
        form.reset({
          nome: cargo.nome,
          is_active: cargo.is_active ?? true, // Fallback to true if null/undefined
        });
      } else {
        form.reset({
          nome: "",
          is_active: true,
        });
      }
    }
  }, [cargo, open, form]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (isEditing) {
        const { error } = await supabase
          .from("ferias_cargos")
          .update({
            nome: data.nome,
            is_active: data.is_active,
          })
          .eq("id", cargo.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ferias_cargos").insert({
          nome: data.nome,
          is_active: data.is_active,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["ferias-cargos"] });
      queryClient.refetchQueries({ queryKey: ["ferias-colaboradores-por-cargo"] });
      toast.success(isEditing ? "Cargo atualizado" : "Cargo criado");
      onOpenChange();
    },
    onError: (error: Error) => {
      toast.error("Erro: " + error.message);
    },
  });

  const onSubmit = (data: FormData) => {
    const normalizedName = normalizeText(data.nome);

    const isDuplicate = existingCargos.some((c) => {
      // When editing, ignore the current cargo in the comparison
      if (isEditing && c.id === cargo.id) return false;
      return normalizeText(c.nome) === normalizedName;
    });

    if (isDuplicate) {
      toast.error("Já existe um cargo com este nome");
      return;
    }

    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Cargo" : "Novo Cargo"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do cargo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Ativo</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value ?? true} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onOpenChange}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CargoDialog;
