import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CycleReportPreview } from "@/components/admin/CycleReportPreview";
import { PsychometricsReport } from "@/components/admin/PsychometricsReport";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";

const TrabalhoAmostraRelatorio = () => {
  const navigate = useNavigate();
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    const unlock = sessionStorage.getItem("sample_report_unlock");
    if (unlock !== "1") {
      navigate("/trabalho", { replace: true });
      return;
    }
    setOk(true);
    document.title = "Amostra do relatório — Cuidar+ Trabalho";
  }, [navigate]);

  if (!ok) return null;

  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-5xl py-6 print:py-0">
        <div className="flex items-center justify-between mb-4 print:hidden">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/trabalho">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Link>
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Salvar / imprimir PDF
          </Button>
        </div>
        <div className="mb-4 print:hidden">
          <h1 className="font-display text-2xl font-semibold">
            Amostra — Relatório consolidado de ciclo
          </h1>
          <p className="text-sm text-muted-foreground">
            Visualização demonstrativa com dados fictícios. Use "Salvar / imprimir PDF" para
            exportar.
          </p>
        </div>
        <CycleReportPreview />
      </div>
    </main>
  );
};

export default TrabalhoAmostraRelatorio;
