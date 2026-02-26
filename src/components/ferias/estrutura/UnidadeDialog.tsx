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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const schema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  endereco: z.string().optional(),
  observacoes: z.string().optional(),
  is_active: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface UnidadeDialogProps {
  open: boolean;
  onOpenChange: () => void;
  unidade?: {
    id: string;
    nome: string;
    endereco: string | null;
    observacoes: string | null;
    is_active: boolean;
  } | null;
}

const UnidadeDialog = ({ open, onOpenChange, unidade }: UnidadeDialogProps) => {
  const queryClient = useQueryClient();
  const isEditing = !!unidade;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: "",
      endereco: "",
      observacoes: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (unidade) {
      form.reset({
        nome: unidade.nome,
        endereco: unidade.endereco || "",
        observacoes: unidade.observacoes || "",
        is_active: unidade.is_active,
      });
    } else {
      form.reset({
        nome: "",
        endereco: "",
        observacoes: "",
        is_active: true,
      });
    }
  }, [unidade, form]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (isEditing) {
        const { error } = await supabase
          .from("ferias_unidades")
          .update({
            nome: data.nome,
            endereco: data.endereco || null,
            observacoes: data.observacoes || null,
            is_active: data.is_active,
          })
          .eq("id", unidade.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ferias_unidades").insert({
          nome: data.nome,
          endereco: data.endereco || null,
          observacoes: data.observacoes || null,
          is_active: data.is_active,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ferias-unidades"] });
      toast.success(isEditing ? "Unidade atualizada" : "Unidade criada");
      onOpenChange();
    },
    onError: (error: Error) => {
      toast.error("Erro: " + error.message);
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Unidade" : "Nova Unidade"}</DialogTitle>
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
                    <Input placeholder="Nome da unidade" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endereco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Endereço da unidade" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Observações adicionais" {...field} />
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
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
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

export default UnidadeDialog;
