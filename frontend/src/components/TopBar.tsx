import React from "react";
import { useLocation } from "react-router-dom";
import { BreadcrumbTopBar } from "./breadcrumb";

export const TopBar = React.memo(function TopBar() {
  const location = useLocation();
  const pathname = location.pathname;

  const token = localStorage.getItem("access_token");

  const payload = token
    ? JSON.parse(atob(token.split(".")[1]))
    : null;

  const username = payload?.username || null;
  const email = payload?.email || null;

  const segments = pathname.split("/").filter(Boolean);
  const pageTitle = segments.length
    ? segments[segments.length - 1]
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "Home";

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    window.location.href = "/login";
  };

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
          {!token ? (
            <p className="text-m font-medium text-white dark:text-gray-100">
              Não autenticado
            </p>
          ) : (
            <>
              <p className="text-m font-medium text-white dark:text-gray-100">
                {username || "Usuário"}
              </p>
              <p className="text-xs text-gray-300 dark:text-gray-400">
                {email || ""}
              </p>
            </>
          )}
        </div>

        {token && (
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded-md text-sm"
          >
            Sair
          </button>
        )}
      </div>
    </header>
  );
});
