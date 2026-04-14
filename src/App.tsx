import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

import Index from "./pages/Index";
import HomePage from "./pages/Home";
import AgentPage from "./pages/Agent";
import OutilsPage from "./pages/Outils";
import ProfilPage from "./pages/Profil";
import CoffreFortPage from "./pages/CoffreFort";
import CalendarPage from "./pages/Calendar";
import Scanner from "./pages/Scanner";
import RealEstateSimulator from "./pages/RealEstateSimulator";
import NewSimulation from "./pages/simulator/NewSimulation";
import SimulationDetails from "./pages/simulator/SimulationDetails";
import CompareSimulations from "./pages/simulator/CompareSimulations";
import SavingsSimulator from "./pages/SavingsSimulator";
import AidesDetector from "./pages/AidesDetector";
import FiscalProfile from "./pages/FiscalProfile";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/agent" element={<ProtectedRoute><AgentPage /></ProtectedRoute>} />
            <Route path="/outils" element={<ProtectedRoute><OutilsPage /></ProtectedRoute>} />
            <Route path="/outils/calendrier" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
            <Route path="/outils/scanner" element={<ProtectedRoute><Scanner /></ProtectedRoute>} />
            <Route path="/outils/simulateur" element={<ProtectedRoute><RealEstateSimulator /></ProtectedRoute>} />
            <Route path="/outils/simulateur/new" element={<ProtectedRoute><NewSimulation /></ProtectedRoute>} />
            <Route path="/outils/simulateur/edit/:id" element={<ProtectedRoute><NewSimulation /></ProtectedRoute>} />
            <Route path="/outils/simulateur/compare" element={<ProtectedRoute><CompareSimulations /></ProtectedRoute>} />
            <Route path="/outils/simulateur/:id" element={<ProtectedRoute><SimulationDetails /></ProtectedRoute>} />
            <Route path="/outils/epargne" element={<ProtectedRoute><SavingsSimulator /></ProtectedRoute>} />
            <Route path="/outils/aides" element={<ProtectedRoute><AidesDetector /></ProtectedRoute>} />
            <Route path="/outils/coffre" element={<ProtectedRoute><CoffreFortPage /></ProtectedRoute>} />
            <Route path="/profil" element={<ProtectedRoute><ProfilPage /></ProtectedRoute>} />
            <Route path="/profil/fiscal" element={<ProtectedRoute><FiscalProfile /></ProtectedRoute>} />
            <Route path="/profil/parametres" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
