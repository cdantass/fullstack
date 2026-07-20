"use client";

import * as React from "react";
import { Link } from "react-router-dom";
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
import { useAuth } from "@/context/auth-context";

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { user, loading } = useAuth();

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
            ...(user?.usertype === "gestor"
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
  }, [user]);

  return (
    <Sidebar collapsible="none" {...props}>
      <SidebarHeader className="bg-topbar-background dark:bg-gray-900 h-[80px]">
        <Link to="/" className="w-full flex justify-center h-full">
          <img
            src="..."
            alt="Logo da Sefaz"
            className="h-full object-contain cursor-pointer p-2"
          />
        </Link>
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
