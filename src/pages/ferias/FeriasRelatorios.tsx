import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, AlertTriangle, FileCheck, Search } from "lucide-react";
import { ContadorPDFGenerator } from "@/components/ferias/relatorios/ContadorPDFGenerator";
import { ExcecoesPDFGenerator } from "@/components/ferias/relatorios/ExcecoesPDFGenerator";
import { ConsultaGeralTab } from "@/components/ferias/relatorios/ConsultaGeralTab";

export default function FeriasRelatorios() {
  const [activeTab, setActiveTab] = useState("consulta");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          Relatórios
        </h1>
        <p className="text-muted-foreground">
          Consulte férias detalhadas e gere relatórios em PDF
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="consulta" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Consulta Geral</span>
          </TabsTrigger>
          <TabsTrigger value="contador" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Contador</span>
          </TabsTrigger>
          <TabsTrigger value="excecoes" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Exceções</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="consulta" className="mt-6">
          <ConsultaGeralTab />
        </TabsContent>

        <TabsContent value="contador" className="mt-6">
          <ContadorPDFGenerator />
        </TabsContent>

        <TabsContent value="excecoes" className="mt-6">
          <ExcecoesPDFGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
}
