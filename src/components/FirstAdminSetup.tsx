import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Crown, Shield } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FirstAdminSetupProps {
  userId: string;
  onComplete: () => void;
}

export function FirstAdminSetup({ userId, onComplete }: FirstAdminSetupProps) {
  const [loading, setLoading] = useState(false);

  const handleSetupAdmin = async () => {
    setLoading(true);

    try {
      const { error } = await supabase.rpc("make_first_admin", {
        _user_id: userId,
      });

      if (error) {
        if (error.message.includes("Já existe um admin")) {
          toast.error("Já existe um administrador no sistema.");
        } else {
          throw error;
        }
      } else {
        toast.success("Você agora é o administrador do sistema!");
      }

      onComplete();
    } catch (error: any) {
      console.error("Error setting up admin:", error);
      toast.error(error.message || "Erro ao configurar administrador");
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Crown className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Configuração Inicial</CardTitle>
          <CardDescription>
            Bem-vindo ao sistema! Você é o primeiro usuário e precisa se tornar
            administrador para gerenciar o sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
            <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Como Administrador você poderá:</p>
              <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-1">
                <li>Gerenciar todos os usuários</li>
                <li>Atribuir permissões</li>
                <li>Acessar todas as funcionalidades</li>
                <li>Visualizar dados sensíveis</li>
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSetupAdmin}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Configurando...
              </>
            ) : (
              <>
                <Crown className="mr-2 h-4 w-4" />
                Tornar-me Administrador
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
