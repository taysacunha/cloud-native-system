import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrokerPerformanceTab } from "@/components/reports/BrokerPerformanceTab";
import { LocationAnalysisTab } from "@/components/reports/LocationAnalysisTab";
import { TemporalAnalysisTab } from "@/components/reports/TemporalAnalysisTab";
import { DistributionCheckTab } from "@/components/reports/DistributionCheckTab";

const EscalasReports = () => {
  const [activeTab, setActiveTab] = useState("distribution");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Relatórios Gerenciais</h1>
        <p className="text-muted-foreground">Análise completa de performance e estatísticas</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="distribution">Conferência</TabsTrigger>
          <TabsTrigger value="brokers">Corretores</TabsTrigger>
          <TabsTrigger value="locations">Locais</TabsTrigger>
          <TabsTrigger value="temporal">Temporal</TabsTrigger>
        </TabsList>

        <TabsContent value="distribution" className="space-y-4">
          <DistributionCheckTab enabled={activeTab === "distribution"} />
        </TabsContent>

        <TabsContent value="brokers" className="space-y-4">
          <BrokerPerformanceTab enabled={activeTab === "brokers"} />
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <LocationAnalysisTab enabled={activeTab === "locations"} />
        </TabsContent>

        <TabsContent value="temporal" className="space-y-4">
          <TemporalAnalysisTab enabled={activeTab === "temporal"} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EscalasReports;
