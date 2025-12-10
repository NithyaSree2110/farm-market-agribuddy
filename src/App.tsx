import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import PhoneAuth from "./pages/PhoneAuth";
import Marketplace from "./pages/Marketplace";
import MyCrops from "./pages/MyCrops";
import CropDetail from "./pages/CropDetail";
import Chat from "./pages/Chat";
import Orders from "./pages/Orders";
import FarmerDashboard from "./pages/FarmerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/phone-auth" element={<PhoneAuth />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/my-crops" element={<MyCrops />} />
              <Route path="/add-crop" element={<MyCrops />} />
              <Route path="/crop/:id" element={<CropDetail />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/farmer-dashboard" element={<FarmerDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
