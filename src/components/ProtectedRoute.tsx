import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  children: React.ReactNode;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
  localOnly?: boolean;
  distritalOnly?: boolean;
}

const ProtectedRoute = ({ children, adminOnly, superAdminOnly, localOnly, distritalOnly }: Props) => {
  const { user, loading, isAdmin, isSuperAdmin, profile } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  if (superAdminOnly && !isSuperAdmin) return <Navigate to="/dashboard" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;
  if (localOnly && (isAdmin || isSuperAdmin || profile?.tipo !== "local")) return <Navigate to="/dashboard" replace />;
  if (distritalOnly && !(profile?.tipo === "admin" || isSuperAdmin)) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
