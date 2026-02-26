import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Hook para logout automático após período de inatividade real.
 * Monitora atividade do usuário (mouse, teclado, scroll, cliques, touch)
 * e faz logout apenas após o período especificado sem NENHUMA interação.
 * 
 * @param timeoutMinutes - Minutos de inatividade antes do logout (padrão: 30)
 * @param warningMinutes - Minutos antes do logout para mostrar aviso (padrão: 5)
 */
export function useInactivityLogout(
  timeoutMinutes: number = 30,
  warningMinutes: number = 5
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isActiveRef = useRef(true);

  const handleLogout = useCallback(async () => {
    if (!isActiveRef.current) return;
    
    console.log("[InactivityLogout] Logging out due to inactivity");
    toast.info("Sessão encerrada por inatividade", {
      description: "Por favor, faça login novamente para continuar."
    });
    
    await supabase.auth.signOut();
  }, []);

  const resetTimer = useCallback(() => {
    // Limpar timers anteriores
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }

    // Calcular tempos em milissegundos
    const timeoutMs = timeoutMinutes * 60 * 1000;
    const warningMs = (timeoutMinutes - warningMinutes) * 60 * 1000;

    // Aviso antes do logout (se houver tempo suficiente)
    if (warningMs > 0 && warningMinutes > 0) {
      warningTimerRef.current = setTimeout(() => {
        toast.warning(`Sua sessão expirará em ${warningMinutes} minutos por inatividade`, {
          description: "Mova o mouse ou pressione uma tecla para continuar."
        });
      }, warningMs);
    }

    // Timer principal de logout
    timerRef.current = setTimeout(handleLogout, timeoutMs);
  }, [timeoutMinutes, warningMinutes, handleLogout]);

  useEffect(() => {
    // Eventos que indicam atividade do usuário
    const activityEvents = [
      'mousemove',
      'mousedown',
      'keypress',
      'keydown',
      'scroll',
      'click',
      'touchstart',
      'touchmove',
      'wheel'
    ];

    // Handler com throttle para performance
    let lastActivity = Date.now();
    const throttleMs = 1000; // Throttle de 1 segundo

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivity >= throttleMs) {
        lastActivity = now;
        resetTimer();
      }
    };

    // Adicionar listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Também resetar quando a aba fica visível novamente
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        resetTimer();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Iniciar timer
    isActiveRef.current = true;
    resetTimer();

    // Cleanup
    return () => {
      isActiveRef.current = false;
      
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
      
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [resetTimer]);
}
