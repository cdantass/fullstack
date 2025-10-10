import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSideBar";
import { TopBar } from "./TopBar";
import { Toaster } from "@/components/ui/sonner";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col w-full">
          <TopBar />
          <main className="flex-1">
            <Toaster richColors position="top-right" />
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
export default MainLayout;