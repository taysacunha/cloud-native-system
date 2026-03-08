import { AuditLogsPanel } from "@/components/AuditLogsPanel";

export default function EstoqueAuditLogs() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Auditoria - Estoques</h1>
        <p className="text-muted-foreground">Histórico de alterações no módulo de estoques</p>
      </div>
      <AuditLogsPanel defaultModule="estoque" defaultTab="modules" showAdminTab={false} />
    </div>
  );
}
