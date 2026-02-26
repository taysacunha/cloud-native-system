import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, CalendarDays, Cog, CalendarOff } from "lucide-react";
import { RegrasTab } from "@/components/ferias/configuracoes/RegrasTab";
import { FeriadosTab } from "@/components/ferias/configuracoes/FeriadosTab";
import { FolgasTab } from "@/components/ferias/configuracoes/FolgasTab";
import { AvancadoTab } from "@/components/ferias/configuracoes/AvancadoTab";

export default function FeriasConfiguracoes() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações do sistema de férias e folgas
        </p>
      </div>

      <Tabs defaultValue="regras" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="regras" className="gap-2">
            <Settings className="h-4 w-4 hidden sm:inline" />
            Regras
          </TabsTrigger>
          <TabsTrigger value="folgas" className="gap-2">
            <CalendarOff className="h-4 w-4 hidden sm:inline" />
            Folgas
          </TabsTrigger>
          <TabsTrigger value="feriados" className="gap-2">
            <CalendarDays className="h-4 w-4 hidden sm:inline" />
            Feriados
          </TabsTrigger>
          <TabsTrigger value="avancado" className="gap-2">
            <Cog className="h-4 w-4 hidden sm:inline" />
            Avançado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="regras" className="mt-6">
          <RegrasTab />
        </TabsContent>

        <TabsContent value="folgas" className="mt-6">
          <FolgasTab />
        </TabsContent>

        <TabsContent value="feriados" className="mt-6">
          <FeriadosTab />
        </TabsContent>

        <TabsContent value="avancado" className="mt-6">
          <AvancadoTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
