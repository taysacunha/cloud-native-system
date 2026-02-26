import { useUserRole, AppRole } from "@/hooks/useUserRole";
import { Loader2, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface RoleGuardProps {
  allowedRoles: AppRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Acesso Negado</CardTitle>
          <CardDescription>
            Você não tem permissão para acessar esta página.
            Entre em contato com um administrador se precisar de acesso.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={() => navigate("/")}>
            Voltar ao Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function RoleGuard({ allowedRoles, children, fallback }: RoleGuardProps) {
  const { role, loading, hasAccess } = useUserRole();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!role || !hasAccess(allowedRoles)) {
    return fallback ?? <AccessDenied />;
  }

  return <>{children}</>;
}

// Component to conditionally render based on role without blocking
interface RoleVisibleProps {
  allowedRoles: AppRole[];
  children: React.ReactNode;
}

export function RoleVisible({ allowedRoles, children }: RoleVisibleProps) {
  const { role, loading, hasAccess } = useUserRole();

  if (loading || !role || !hasAccess(allowedRoles)) {
    return null;
  }

  return <>{children}</>;
}
