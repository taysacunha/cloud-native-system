import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const configuracaoSchema = z.object({
  chave: z
    .string()
    .min(1, "A chave é obrigatória")
    .max(100, "Máximo de 100 caracteres")
    .regex(
      /^[A-Z0-9_]+$/,
      "Use apenas letras maiúsculas, números e underscores (ex: MAX_DIAS_FERIAS)"
    ),
  valor: z.string().min(1, "O valor é obrigatório").max(500, "Máximo de 500 caracteres"),
  descricao: z.string().max(500, "Máximo de 500 caracteres").optional(),
});

type ConfiguracaoFormData = z.infer<typeof configuracaoSchema>;

interface Configuracao {
  id: string;
  chave: string;
  valor: string;
  descricao: string | null;
  updated_at: string | null;
}

interface ConfiguracaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  configuracao: Configuracao | null;
}

export function ConfiguracaoDialog({
  open,
  onOpenChange,
  configuracao,
}: ConfiguracaoDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!configuracao;

  const form = useForm<ConfiguracaoFormData>({
    resolver: zodResolver(configuracaoSchema),
    defaultValues: {
      chave: "",
      valor: "",
      descricao: "",
    },
  });

  useEffect(() => {
    if (configuracao) {
      form.reset({
        chave: configuracao.chave,
        valor: configuracao.valor,
        descricao: configuracao.descricao || "",
      });
    } else {
      form.reset({
        chave: "",
        valor: "",
        descricao: "",
      });
    }
  }, [configuracao, form]);

  const mutation = useMutation({
    mutationFn: async (data: ConfiguracaoFormData) => {
      if (isEditing) {
        const { error } = await supabase
          .from("ferias_configuracoes")
          .update({
            chave: data.chave,
            valor: data.valor,
            descricao: data.descricao || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", configuracao.id);

        if (error) throw error;
      } else {
        // Verificar se a chave já existe
        const { data: existing } = await supabase
          .from("ferias_configuracoes")
          .select("id")
          .eq("chave", data.chave)
          .maybeSingle();

        if (existing) {
          throw new Error("Já existe uma configuração com esta chave");
        }

        const { error } = await supabase.from("ferias_configuracoes").insert({
          chave: data.chave,
          valor: data.valor,
          descricao: data.descricao || null,
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ferias-configuracoes"] });
      toast.success(
        isEditing
          ? "Configuração atualizada com sucesso!"
          : "Configuração criada com sucesso!"
      );
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      console.error("Erro ao salvar configuração:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar configuração"
      );
    },
  });

  const onSubmit = (data: ConfiguracaoFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Configuração" : "Nova Configuração"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Altere os valores da configuração do sistema"
              : "Adicione um novo parâmetro de configuração do sistema"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="chave"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chave</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="EX: MAX_DIAS_FERIAS"
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))
                      }
                      disabled={isEditing}
                    />
                  </FormControl>
                  <FormDescription>
                    Identificador único da configuração (não pode ser alterado após criação)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="valor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 30" {...field} />
                  </FormControl>
                  <FormDescription>
                    Valor da configuração (pode ser texto, número ou JSON)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o propósito desta configuração..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
