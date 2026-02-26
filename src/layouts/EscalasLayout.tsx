import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { EscalasSidebar } from "@/components/EscalasSidebar";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { SystemGuard } from "@/components/SystemGuard";
import { Menu } from "lucide-react";

export function EscalasLayout() {
  return (
    <SystemGuard system="escalas">
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <EscalasSidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Mobile Header */}
            <header className="md:hidden flex items-center h-14 border-b bg-background px-4">
              <SidebarTrigger className="p-2 -ml-2">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
              <span className="ml-2 font-semibold">Escalas</span>
            </header>
            <main className="flex-1 p-4 sm:p-6 overflow-y-auto overflow-x-hidden">
              <Suspense fallback={<DashboardSkeleton />}>
                <Outlet />
              </Suspense>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </SystemGuard>
  );
}
