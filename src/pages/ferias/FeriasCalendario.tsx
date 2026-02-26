import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, CalendarDays, Cake } from "lucide-react";
import { CalendarioFeriasTab } from "@/components/ferias/calendario/CalendarioFeriasTab";
import { CalendarioFolgasTab } from "@/components/ferias/calendario/CalendarioFolgasTab";
import { CalendarioAniversariantesTab } from "@/components/ferias/calendario/CalendarioAniversariantesTab";

export default function FeriasCalendario() {
  const [activeTab, setActiveTab] = useState("ferias");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <CalendarIcon className="h-8 w-8 text-primary" />
          Calendário
        </h1>
        <p className="text-muted-foreground">
          Visualização unificada de férias, folgas e aniversariantes
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
          <TabsTrigger value="ferias" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Férias</span>
          </TabsTrigger>
          <TabsTrigger value="folgas" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">Folgas de Sábado</span>
          </TabsTrigger>
          <TabsTrigger value="aniversariantes" className="flex items-center gap-2">
            <Cake className="h-4 w-4" />
            <span className="hidden sm:inline">Aniversariantes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ferias" className="mt-6">
          <CalendarioFeriasTab />
        </TabsContent>

        <TabsContent value="folgas" className="mt-6">
          <CalendarioFolgasTab />
        </TabsContent>

        <TabsContent value="aniversariantes" className="mt-6">
          <CalendarioAniversariantesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
