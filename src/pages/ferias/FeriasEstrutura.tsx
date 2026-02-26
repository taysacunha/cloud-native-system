import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, Briefcase, UsersRound } from "lucide-react";
import UnidadesTab from "@/components/ferias/estrutura/UnidadesTab";
import SetoresTab from "@/components/ferias/estrutura/SetoresTab";
import CargosTab from "@/components/ferias/estrutura/CargosTab";
import EquipesTab from "@/components/ferias/estrutura/EquipesTab";

const STORAGE_KEY = "ferias:estrutura:tab";
const VALID_TABS = ["unidades", "setores", "cargos", "equipes"];

const FeriasEstrutura = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize tab from: 1) query param, 2) sessionStorage, 3) default
  const getInitialTab = () => {
    const paramTab = searchParams.get("tab");
    if (paramTab && VALID_TABS.includes(paramTab)) {
      return paramTab;
    }
    const storedTab = sessionStorage.getItem(STORAGE_KEY);
    if (storedTab && VALID_TABS.includes(storedTab)) {
      return storedTab;
    }
    return "unidades";
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  // Persist tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    sessionStorage.setItem(STORAGE_KEY, value);
    setSearchParams({ tab: value }, { replace: true });
  };

  // Sync URL on mount if needed (run only once)
  useEffect(() => {
    const paramTab = searchParams.get("tab");
    if (paramTab !== activeTab) {
      setSearchParams({ tab: activeTab }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Estrutura Organizacional</h1>
        <p className="text-muted-foreground">
          Gerencie unidades, setores, cargos e equipes da organização
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="unidades" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Unidades</span>
          </TabsTrigger>
          <TabsTrigger value="setores" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Setores</span>
          </TabsTrigger>
          <TabsTrigger value="cargos" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Cargos</span>
          </TabsTrigger>
          <TabsTrigger value="equipes" className="flex items-center gap-2">
            <UsersRound className="h-4 w-4" />
            <span className="hidden sm:inline">Equipes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unidades">
          <UnidadesTab />
        </TabsContent>

        <TabsContent value="setores">
          <SetoresTab />
        </TabsContent>

        <TabsContent value="cargos">
          <CargosTab />
        </TabsContent>

        <TabsContent value="equipes">
          <EquipesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FeriasEstrutura;
