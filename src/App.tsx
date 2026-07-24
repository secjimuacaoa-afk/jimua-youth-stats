import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Jovens from "./pages/Jovens";
import Estruturas from "./pages/Estruturas";
import Utilizadores from "./pages/Utilizadores";
import Estatisticas from "./pages/Estatisticas";
import Configuracoes from "./pages/Configuracoes";
import PublicDashboard from "./pages/PublicDashboard";
import PublicEstatisticas from "./pages/PublicEstatisticas";
import Contactos from "./pages/Contactos";
import Ocorrencias from "./pages/Ocorrencias";
import Actividades from "./pages/Actividades";
import Assembleias from "./pages/Assembleias";
import Frequencia from "./pages/Frequencia";
import MapaEstatistico from "./pages/MapaEstatistico";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/jovens" element={<ProtectedRoute><Jovens /></ProtectedRoute>} />
            <Route path="/ocorrencias" element={<ProtectedRoute><Ocorrencias /></ProtectedRoute>} />
            <Route path="/frequencia" element={<ProtectedRoute><Frequencia /></ProtectedRoute>} />
            <Route path="/actividades" element={<ProtectedRoute><Actividades /></ProtectedRoute>} />
            <Route path="/assembleias" element={<ProtectedRoute><Assembleias /></ProtectedRoute>} />
            <Route path="/mapa-estatistico" element={<ProtectedRoute><MapaEstatistico /></ProtectedRoute>} />
            <Route path="/contactos" element={<ProtectedRoute><Contactos /></ProtectedRoute>} />
            <Route path="/estruturas" element={<ProtectedRoute adminOnly><Estruturas /></ProtectedRoute>} />
            <Route path="/utilizadores" element={<ProtectedRoute adminOnly><Utilizadores /></ProtectedRoute>} />
            <Route path="/estatisticas" element={<ProtectedRoute><Estatisticas /></ProtectedRoute>} />
            <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
            <Route path="/publico/dashboard" element={<PublicDashboard />} />
            <Route path="/publico/estatisticas" element={<PublicEstatisticas />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
