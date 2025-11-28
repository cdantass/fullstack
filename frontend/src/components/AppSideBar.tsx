"use client";

import * as React from "react";
import { Car } from "lucide-react";

import { NavMain } from "@/components/NavMain";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { ModeToggle } from "./ModeToggle";
import LogoutButton from "./logout";
import { useAuth } from "../pages/context/AdminContext";

export function AppSidebar({}: React.ComponentProps<typeof Sidebar>) {
  const { user, loading } = useAuth();

  const isAdmin = user?.is_superuser || user?.is_gestor;

  const data = React.useMemo(() => {
    return {
      navMain: [
        {
          title: "Veículo",
          url: "#",
          icon: Car,
          isActive: true,
          items: [
            {
              title: "Reservar Veículo",
              url: "./reservar-veiculo",
            },

            ...(isAdmin
              ? [
                  {
                    title: "Autorizar Reserva",
                    url: "./autorizar-reserva",
                  },
                ]
              : []),

            {
              title: "Consultar Reserva",
              url: "./consultar-reserva",
            },
          ],
        },
      ],
    };
  }, [isAdmin]);

  return (
    <Sidebar collapsible="none">
      <SidebarHeader className="bg-topbar-background dark:bg-gray-900 h-[80px]">
        <img src="/images/logo_prevencao_corrupcao.png" alt="Logo da Sefaz" />
      </SidebarHeader>

      <SidebarContent>
        {!loading ? (
          <NavMain items={data.navMain} />
        ) : (
          <div className="p-4 text-sm text-gray-500">Carregando...</div>
        )}
      </SidebarContent>

      <SidebarFooter className="flex flex-row items-center justify-between w-full p-2">
        <ModeToggle />
        <LogoutButton />
      </SidebarFooter>
    </Sidebar>
  );
}
