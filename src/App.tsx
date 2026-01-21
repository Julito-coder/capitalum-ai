import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SpaceProvider } from "@/contexts/SpaceContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Audit from "./pages/Audit";
import CalendarPage from "./pages/Calendar";
import Simulator from "./pages/Simulator";
import Assistant from "./pages/Assistant";
import Scanner from "./pages/Scanner";
import Onboarding from "./pages/Onboarding";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
// Pro pages
import URSSAFTracking from "./pages/pro/URSSAFTracking";
import InvoiceManager from "./pages/pro/InvoiceManager";
import RevenueTracker from "./pages/pro/RevenueTracker";
import HiringSimulator from "./pages/pro/HiringSimulator";
import StatusComparator from "./pages/pro/StatusComparator";
import CashFlowForecast from "./pages/pro/CashFlowForecast";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SpaceProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              <Route path="/audit" element={<ProtectedRoute><Audit /></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
              <Route path="/simulator" element={<ProtectedRoute><Simulator /></ProtectedRoute>} />
              <Route path="/assistant" element={<ProtectedRoute><Assistant /></ProtectedRoute>} />
              <Route path="/scanner" element={<ProtectedRoute><Scanner /></ProtectedRoute>} />
              {/* Pro routes */}
              <Route path="/pro/urssaf" element={<ProtectedRoute><URSSAFTracking /></ProtectedRoute>} />
              <Route path="/pro/invoices" element={<ProtectedRoute><InvoiceManager /></ProtectedRoute>} />
              <Route path="/pro/revenue" element={<ProtectedRoute><RevenueTracker /></ProtectedRoute>} />
              <Route path="/pro/hiring" element={<ProtectedRoute><HiringSimulator /></ProtectedRoute>} />
              <Route path="/pro/status" element={<ProtectedRoute><StatusComparator /></ProtectedRoute>} />
              <Route path="/pro/cashflow" element={<ProtectedRoute><CashFlowForecast /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SpaceProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
