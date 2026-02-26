import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export type AppRole = "super_admin" | "admin" | "manager" | "supervisor" | "collaborator" | "broker";

// Hierarquia de roles (menor número = maior privilégio)
const roleHierarchy: Record<AppRole, number> = {
  super_admin: 1,
  admin: 2,
  manager: 3,
  supervisor: 4,
  collaborator: 5,
  broker: 5,
};

interface UseUserRoleReturn {
  role: AppRole | null;
  loading: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isSupervisor: boolean;
  isCollaborator: boolean;
  isBroker: boolean;
  hasAccess: (allowedRoles: AppRole[]) => boolean;
  canManageRole: (targetRole: AppRole) => boolean;
  getRoleLevel: (role: AppRole) => number;
  user: User | null;
  refetch: () => Promise<void>;
}

export function useUserRole(): UseUserRoleReturn {
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const fetchRole = async (userId: string) => {
    try {
      console.log("Fetching role for user:", userId);
      const { data, error } = await supabase.rpc("get_user_role", {
        _user_id: userId,
      });

      if (error) {
        console.error("Error fetching user role:", error);
        setRole(null);
      } else {
        console.log("Role fetched successfully:", data);
        setRole(data as AppRole | null);
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    if (user?.id) {
      setLoading(true);
      await fetchRole(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchRole(session.user.id);
        } else {
          setLoading(false);
        }
      }
    });

    // Listen for auth changes - only process events that actually change login state
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        // Ignore TOKEN_REFRESHED and other events that don't change the logged-in user
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setRole(null);
          setLoading(false);
        } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          setUser(session?.user ?? null);
          if (session?.user) {
            setTimeout(() => {
              fetchRole(session.user.id);
            }, 0);
          }
        }
        // Ignore: TOKEN_REFRESHED, INITIAL_SESSION, PASSWORD_RECOVERY, MFA_CHALLENGE_VERIFIED
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const isSuperAdmin = role === "super_admin";
  const isAdmin = role === "admin" || role === "super_admin";
  const isManager = role === "manager";
  const isSupervisor = role === "supervisor";
  const isCollaborator = role === "collaborator";
  const isBroker = role === "broker";

  const hasAccess = (allowedRoles: AppRole[]) => {
    if (!role) return false;
    // Super admin tem acesso total
    if (role === "super_admin") return true;
    return allowedRoles.includes(role);
  };

  const getRoleLevel = (r: AppRole): number => {
    return roleHierarchy[r] ?? 99;
  };

  const canManageRole = (targetRole: AppRole): boolean => {
    if (!role) return false;
    
    // Super admin pode tudo
    if (role === "super_admin") return true;
    
    // Admin pode gerenciar roles de nível igual ou inferior (exceto super_admin)
    if (role === "admin" && targetRole !== "super_admin") {
      return getRoleLevel(role) <= getRoleLevel(targetRole);
    }
    
    return false;
  };

  return {
    role,
    loading,
    isSuperAdmin,
    isAdmin,
    isManager,
    isSupervisor,
    isCollaborator,
    isBroker,
    hasAccess,
    canManageRole,
    getRoleLevel,
    user,
    refetch,
  };
}
