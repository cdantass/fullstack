import React from "react";
import { useLocation } from "react-router-dom";
import { BreadcrumbTopBar } from "./breadcrumb";
import { useKeycloak } from "@react-keycloak/web";

export const TopBar = React.memo(function TopBar() {
  const location = useLocation();
  const pathname = location.pathname;
  const { keycloak, initialized } = useKeycloak();

  const segments = pathname.split("/").filter(Boolean);
  const pageTitle = segments.length
    ? segments[segments.length - 1]
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "Home";

  return (
    <header className="w-full bg-topbar-background dark:bg-gray-900 shadow flex items-center justify-between px-6 py-3 h-[80px]">
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold text-white dark:text-white">
            {pageTitle}
          </h1>
          <BreadcrumbTopBar />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          {!initialized ? (
            <>
              <p className="text-m font-medium text-white dark:text-gray-100 animate-pulse">
                Carregando...
              </p>
              <p className="text-xs text-gray-300 dark:text-gray-400 animate-pulse">
                ...
              </p>
            </>
          ) : keycloak.authenticated ? (
            <>
              <p className="text-m font-medium text-white dark:text-gray-100">
                {keycloak.tokenParsed?.preferred_username}
              </p>
              <p className="text-xs text-gray-300 dark:text-gray-400">
                {keycloak.tokenParsed?.email}
              </p>
            </>
          ) : (
            <p className="text-m font-medium text-white dark:text-gray-100">
              Não autenticado
            </p>
          )}
        </div>
        {keycloak.authenticated && (
          <button
            onClick={() => keycloak.logout()}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded-md text-sm"
          >
            Sair
          </button>
        )}
      </div>
    </header>
  );
});