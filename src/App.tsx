import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index.tsx";

const Auth = lazy(() => import("./pages/Auth.tsx"));
const Admin = lazy(() => import("./pages/Admin.tsx"));
const CityHelp = lazy(() => import("./pages/CityHelp.tsx"));
const Privacidade = lazy(() => import("./pages/Privacidade.tsx"));
const Termos = lazy(() => import("./pages/Termos.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe.tsx"));
const Trabalho = lazy(() => import("./pages/Trabalho.tsx"));
const CopsoqResponder = lazy(() => import("./pages/CopsoqResponder.tsx"));
const WellnessResponder = lazy(() => import("./pages/WellnessResponder.tsx"));
const Imprensa = lazy(() => import("./pages/Imprensa.tsx"));
const BlogRH = lazy(() => import("./pages/BlogRH.tsx"));
const AepReport = lazy(() => import("./pages/AepReport.tsx"));
const Nr1Report = lazy(() => import("./pages/Nr1Report.tsx"));
const MeuResultado = lazy(() => import("./pages/MeuResultado.tsx"));
const TrabalhoTermos = lazy(() => import("./pages/TrabalhoTermos.tsx"));
const TrabalhoFAQ = lazy(() => import("./pages/TrabalhoFAQ.tsx"));
const TrabalhoContato = lazy(() => import("./pages/TrabalhoContato.tsx"));
const TrabalhoAmostraRelatorio = lazy(() => import("./pages/TrabalhoAmostraRelatorio.tsx"));
const TrabalhoOndas = lazy(() => import("./pages/TrabalhoOndas.tsx"));
const TrabalhoPainel = lazy(() => import("./pages/TrabalhoPainel.tsx"));
const TrabalhoComparativo = lazy(() => import("./pages/TrabalhoComparativo.tsx"));
const TrabalhoParceiros = lazy(() => import("./pages/TrabalhoParceiros.tsx"));
const BlogIndex = lazy(() => import("./pages/BlogIndex.tsx"));
const NR1Passos = lazy(() => import("./pages/blog/NR1Passos.tsx"));
const Copsoq = lazy(() => import("./pages/blog/Copsoq.tsx"));
const PlanoAcao = lazy(() => import("./pages/blog/PlanoAcao.tsx"));
const PgrNr1 = lazy(() => import("./pages/blog/PgrNr1.tsx"));
const SaudeMentalTrabalho = lazy(() => import("./pages/blog/SaudeMentalTrabalho.tsx"));
const Nr1Fiscalizacao = lazy(() => import("./pages/blog/Nr1Fiscalizacao.tsx"));
const AepNr17 = lazy(() => import("./pages/blog/AepNr17.tsx"));

const queryClient = new QueryClient();

const PageFallback = () => (
  <div className="container py-24 text-center text-muted-foreground text-sm" role="status" aria-live="polite">
    Carregando…
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageFallback />}>
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
              <Route path="/admin/nr1/:companyId/:roundNo" element={<Nr1Report />} />
              <Route path="/meu-resultado" element={<MeuResultado />} />
              <Route path="/trabalho/termos" element={<TrabalhoTermos />} />
              <Route path="/trabalho/faq" element={<TrabalhoFAQ />} />
              <Route path="/trabalho/contato" element={<TrabalhoContato />} />
              <Route path="/trabalho/amostra-relatorio" element={<TrabalhoAmostraRelatorio />} />
              <Route path="/trabalho/ondas" element={<TrabalhoOndas />} />
              <Route path="/trabalho/painel" element={<TrabalhoPainel />} />
              <Route path="/trabalho/comparativo" element={<TrabalhoComparativo />} />
              <Route path="/trabalho/parceiros" element={<TrabalhoParceiros />} />
              <Route path="/blog" element={<BlogIndex />} />
              <Route path="/blog/nr-1-riscos-psicossociais-passo-a-passo" element={<NR1Passos />} />
              <Route path="/blog/copsoq-ii-o-que-e-como-aplicar" element={<Copsoq />} />
              <Route path="/blog/plano-de-acao-riscos-psicossociais" element={<PlanoAcao />} />
              <Route path="/blog/pgr-nr-1-o-que-mudou" element={<PgrNr1 />} />
              <Route path="/blog/saude-mental-no-trabalho-guia-empresas" element={<SaudeMentalTrabalho />} />
              <Route path="/blog/nr-1-saude-mental-fiscalizacao" element={<Nr1Fiscalizacao />} />
              <Route path="/blog/aep-nr-17-fatores-psicossociais" element={<AepNr17 />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
