import { useAuth } from "@/context/auth-context";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { UserDashboard } from "@/components/dashboard/UserDashboard";

function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-muted-foreground text-sm">Carregando...</div>
      </div>
    );
  }

  // Check if user is admin/gestor
  const isGestor = user?.usertype === "gestor";

  return isGestor ? <AdminDashboard /> : <UserDashboard />;
}

export default Home;
