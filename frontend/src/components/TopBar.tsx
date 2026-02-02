import React from "react";
import { BreadcrumbTopBar } from "./Breadcrumb";
import { useAuth } from "@/context/auth-context";

export const TopBar = React.memo(function TopBar() {
  const { user, loading } = useAuth();

  return (
    <header className="w-full bg-topbar-background dark:bg-gray-900 shadow flex items-center justify-between px-6 py-3 h-[80px]">
      {/* Left side - Page title + breadcrumbs MUDAR NO FUTURO ACHO QUE ESTÁ FEIO  */}
      <div className="flex items-center gap-4">
        <BreadcrumbTopBar />
      </div>

      {/* Right side - user info */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          {loading ? (
            <>
              <p className="text-m font-medium text-white dark:text-gray-100 animate-pulse">
                Carregando...
              </p>
              <p className="text-xs text-gray-300 dark:text-gray-400 animate-pulse">
                ...
              </p>
            </>
          ) : user ? (
            <>
              <p className="text-m font-medium text-white dark:text-gray-100">
                {user.name} {/* trocar no futuro nao sei */}
              </p>
              <p className="text-xs text-gray-300 dark:text-gray-400">
                {user.email} {/* trocar no futuro nao sei */}
              </p>
            </>
          ) : (
            <p className="text-m font-medium text-white dark:text-gray-100">
              Não autenticado
            </p>
          )}
        </div>
      </div>
    </header>
  );
});
