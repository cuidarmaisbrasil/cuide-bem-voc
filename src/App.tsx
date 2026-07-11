import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import Admin from "./pages/Admin.tsx";
import CityHelp from "./pages/CityHelp.tsx";
import Privacidade from "./pages/Privacidade.tsx";
import Termos from "./pages/Termos.tsx";
import NotFound from "./pages/NotFound.tsx";
import Unsubscribe from "./pages/Unsubscribe.tsx";
import Trabalho from "./pages/Trabalho.tsx";
import CopsoqResponder from "./pages/CopsoqResponder.tsx";
import WellnessResponder from "./pages/WellnessResponder.tsx";
import Imprensa from "./pages/Imprensa.tsx";
import BlogRH from "./pages/BlogRH.tsx";
import AepReport from "./pages/AepReport.tsx";
import MeuResultado from "./pages/MeuResultado.tsx";
import TrabalhoTermos from "./pages/TrabalhoTermos.tsx";
import TrabalhoFAQ from "./pages/TrabalhoFAQ.tsx";
import TrabalhoContato from "./pages/TrabalhoContato.tsx";
import TrabalhoAmostraRelatorio from "./pages/TrabalhoAmostraRelatorio.tsx";
import TrabalhoOndas from "./pages/TrabalhoOndas.tsx";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/ajuda/:slug" element={<CityHelp />} />
            <Route path="/privacidade" element={<Privacidade />} />
            <Route path="/termos" element={<Termos />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/trabalho" element={<Trabalho />} />
            <Route path="/trabalho/r/:slug" element={<CopsoqResponder />} />
            <Route path="/w/:token/:wave" element={<WellnessResponder />} />
            <Route path="/imprensa" element={<Imprensa />} />
            <Route path="/blog/rh-saude-mental-trabalho" element={<BlogRH />} />
            <Route path="/admin/aep/:companyId/:roundNo" element={<AepReport />} />
            <Route path="/meu-resultado" element={<MeuResultado />} />
            <Route path="/trabalho/termos" element={<TrabalhoTermos />} />
            <Route path="/trabalho/faq" element={<TrabalhoFAQ />} />
            <Route path="/trabalho/contato" element={<TrabalhoContato />} />
            <Route path="/trabalho/amostra-relatorio" element={<TrabalhoAmostraRelatorio />} />
            <Route path="/trabalho/ondas" element={<TrabalhoOndas />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
