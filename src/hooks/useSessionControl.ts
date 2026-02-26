import { useEffect } from "react";

/**
 * Detecta se a URL atual é um link de autenticação (convite ou recuperação de senha).
 * Nesses casos, devemos proteger a sessão para não interferir no fluxo.
 */
function isAuthFlowUrl(): boolean {
  const { pathname, hash, search } = window.location;
  
  // Verificar se estamos na página de autenticação
  const isAuthPage = pathname === "/auth" || pathname === "/auth/" || pathname.startsWith("/auth?") || pathname.startsWith("/auth#");
  
  if (!isAuthPage) {
    return false;
  }
  
  // Se estamos em /auth e há hash ou query string, é provável que seja um fluxo de auth
  if (hash && hash !== "#") {
    return true;
  }
  
  if (search && search !== "?") {
    return true;
  }
  
  // Verificações específicas no hash
  if (hash.includes("access_token=") || hash.includes("refresh_token=")) {
    return true;
  }
  if (hash.includes("type=recovery") || hash.includes("type=invite") || hash.includes("type=signup")) {
    return true;
  }
  
  // Verificações específicas na query string
  if (search.includes("token_hash=") || search.includes("code=")) {
    return true;
  }
  if (search.includes("type=recovery") || search.includes("type=invite") || search.includes("type=signup")) {
    return true;
  }
  
  return false;
}

/**
 * Hook para controlar a sessão do usuário.
 * Versão simplificada que apenas marca a sessão como ativa e protege fluxos de autenticação.
 * 
 * O logout por inatividade é gerenciado pelo hook useInactivityLogout.
 * A gestão de tokens é feita automaticamente pelo Supabase.
 */
export function useSessionControl() {
  useEffect(() => {
    // Proteger fluxos de autenticação (convite/recovery)
    if (isAuthFlowUrl()) {
      console.log("[SessionControl] Auth flow URL detected - session protected");
    }
    // Sessão gerenciada automaticamente pelo Supabase com sessionStorage
  }, []);
}
