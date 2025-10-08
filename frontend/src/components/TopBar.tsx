import React from "react";
import { useLocation } from "react-router-dom";
import { BreadcrumbTopBar } from "./breadcrumb";
import { useAuth } from "../pages/context/AdminContext";

export const TopBar = React.memo(function TopBar() {
  const location = useLocation();
  const pathname = location.pathname;
  const { user, loading } = useAuth();

  const segments = pathname.split("/").filter(Boolean);
  const pageTitle = segments.length
    ? segments[segments.length - 1]
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "Home";

  return (
    <header className="w-full bg-topbar-background dark:bg-gray-900 shadow flex items-center justify-between px-6 py-3 h-[80px]">
      {/* Left side - Page title + breadcrumbs */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold text-white dark:text-white">
            {pageTitle}
          </h1>
          <BreadcrumbTopBar />
        </div>
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
