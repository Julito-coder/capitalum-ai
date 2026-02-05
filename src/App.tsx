import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SpaceProvider } from "@/contexts/SpaceContext";
import { ActionGuideProvider, ActionGuideModal } from "@/components/guides";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AIHelpWidget } from "@/components/ai/AIHelpWidget";
import Dashboard from "./pages/Dashboard";
import Audit from "./pages/Audit";
import CalendarPage from "./pages/Calendar";
import Glossary from "./pages/Glossary";
import Scanner from "./pages/Scanner";
import Onboarding from "./pages/Onboarding";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
// Real Estate Simulator pages
import RealEstateSimulator from "./pages/RealEstateSimulator";
import NewSimulation from "./pages/simulator/NewSimulation";
import SimulationDetails from "./pages/simulator/SimulationDetails";
import CompareSimulations from "./pages/simulator/CompareSimulations";
// Savings Simulator
import SavingsSimulator from "./pages/SavingsSimulator";
// Pro pages
import URSSAFTracking from "./pages/pro/URSSAFTracking";
import InvoiceManager from "./pages/pro/InvoiceManager";
import RevenueTracker from "./pages/pro/RevenueTracker";
import HiringSimulator from "./pages/pro/HiringSimulator";
import StatusComparator from "./pages/pro/StatusComparator";
import CashFlowForecast from "./pages/pro/CashFlowForecast";
import ProOnboarding from "./pages/pro/ProOnboarding";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SpaceProvider>
            <ActionGuideProvider>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                <Route path="/audit" element={<ProtectedRoute><Audit /></ProtectedRoute>} />
                <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
                <Route path="/glossary" element={<ProtectedRoute><Glossary /></ProtectedRoute>} />
                <Route path="/scanner" element={<ProtectedRoute><Scanner /></ProtectedRoute>} />
                {/* Real Estate Simulator routes */}
                <Route path="/simulator" element={<ProtectedRoute><RealEstateSimulator /></ProtectedRoute>} />
                <Route path="/simulator/new" element={<ProtectedRoute><NewSimulation /></ProtectedRoute>} />
                <Route path="/simulator/edit/:id" element={<ProtectedRoute><NewSimulation /></ProtectedRoute>} />
                <Route path="/simulator/compare" element={<ProtectedRoute><CompareSimulations /></ProtectedRoute>} />
                <Route path="/simulator/:id" element={<ProtectedRoute><SimulationDetails /></ProtectedRoute>} />
                {/* Savings Simulator */}
                <Route path="/savings" element={<ProtectedRoute><SavingsSimulator /></ProtectedRoute>} />
                {/* Pro routes */}
                <Route path="/pro/onboarding" element={<ProtectedRoute><ProOnboarding /></ProtectedRoute>} />
                <Route path="/pro/urssaf" element={<ProtectedRoute><URSSAFTracking /></ProtectedRoute>} />
                <Route path="/pro/invoices" element={<ProtectedRoute><InvoiceManager /></ProtectedRoute>} />
                <Route path="/pro/revenue" element={<ProtectedRoute><RevenueTracker /></ProtectedRoute>} />
                <Route path="/pro/hiring" element={<ProtectedRoute><HiringSimulator /></ProtectedRoute>} />
                <Route path="/pro/status" element={<ProtectedRoute><StatusComparator /></ProtectedRoute>} />
                <Route path="/pro/cashflow" element={<ProtectedRoute><CashFlowForecast /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <ActionGuideModal />
              <AIHelpWidget />
            </ActionGuideProvider>
          </SpaceProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
