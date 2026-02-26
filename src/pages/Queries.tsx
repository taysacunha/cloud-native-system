import { BasicQueriesTab } from "@/components/reports/BasicQueriesTab";

const Queries = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Consultas</h1>
        <p className="text-muted-foreground">Busque plantões por corretor ou por local</p>
      </div>

      <BasicQueriesTab enabled={true} />
    </div>
  );
};

export default Queries;
