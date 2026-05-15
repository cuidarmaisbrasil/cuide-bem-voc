import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Download, LogOut, Plus, Trash2 } from "lucide-react";
import { tenSymptoms } from "@/data/symptoms";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { Shield, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { format, subDays } from "date-fns";
import { CampaignComposer } from "@/components/admin/CampaignComposer";
import { CompaniesAdmin } from "@/components/admin/CompaniesAdmin";

const COLORS = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))", "hsl(var(--muted-foreground))"];
const SEVERITIES = ["Mínima", "Leve", "Moderada", "Moderadamente grave", "Grave"] as const;
const AGE_BUCKETS: { label: string; min: number; max: number }[] = [
  { label: "18-24", min: 18, max: 24 },
  { label: "25-34", min: 25, max: 34 },
  { label: "35-44", min: 35, max: 44 },
  { label: "45-59", min: 45, max: 59 },
  { label: "60+", min: 60, max: 200 },
];
function bucketFor(age: number | null | undefined) {
  if (age == null) return null;
  return AGE_BUCKETS.find((b) => age >= b.min && age <= b.max)?.label ?? null;
}


function toCSV(rows: Record<string, any>[]): string {
  if (rows.length === 0) return "";
  const headerSet = new Set<string>();
  rows.forEach((r) => Object.keys(r).forEach((k) => headerSet.add(k)));
  const headers = Array.from(headerSet);
  const escape = (v: any) => {
    if (v == null) return "";
    let s: string;
    if (Array.isArray(v)) s = v.join("|");
    else if (typeof v === "object") s = JSON.stringify(v);
    else s = String(v);
    if (/[",\n;]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.join(",")];
  for (const row of rows) lines.push(headers.map((h) => escape(row[h])).join(","));
  return lines.join("\n");
}

function downloadCSV(filename: string, rows: Record<string, any>[]) {
  if (rows.length === 0) {
    toast.error("Sem dados para exportar");
    return;
  }
  // BOM for Excel UTF-8 compatibility; R reads UTF-8 CSV natively
  const blob = new Blob(["\ufeff" + toCSV(rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isViewer, canView, loading, signOut } = useAuth();
  const readOnly = !isAdmin;

  const [stats, setStats] = useState<any>({ totalTests: 0, totalClicks: 0, uniqueIps: 0, excludedAdmin: 0 });
  const [byDay, setByDay] = useState<any[]>([]);
  const [bySeverity, setBySeverity] = useState<any[]>([]);
  const [byCountry, setByCountry] = useState<any[]>([]);
  const [byCity, setByCity] = useState<any[]>([]);
  const [byAge, setByAge] = useState<any[]>([]);
  const [severityByAge, setSeverityByAge] = useState<any[]>([]);
  const [severityByCity, setSeverityByCity] = useState<any[]>([]);
  const [topLinks, setTopLinks] = useState<any[]>([]);
  const [linksByType, setLinksByType] = useState<any[]>([]);
  const [bySymptom, setBySymptom] = useState<any[]>([]);
  const [phq9ByQuestion, setPhq9ByQuestion] = useState<any[]>([]);
  const [functionalImpactDist, setFunctionalImpactDist] = useState<any[]>([]);
  const [phq9Stats, setPhq9Stats] = useState<{ avg: number; count: number }>({ avg: 0, count: 0 });
  const [bySource, setBySource] = useState<any[]>([]);
  const [byMedium, setByMedium] = useState<any[]>([]);
  const [byCampaign, setByCampaign] = useState<any[]>([]);
  const [byReferrer, setByReferrer] = useState<any[]>([]);
  const [sourceConv, setSourceConv] = useState<any[]>([]);
  const [rawTests, setRawTests] = useState<any[]>([]);
  const [rawClicks, setRawClicks] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [adminIps, setAdminIps] = useState<any[]>([]);
  const [registeringIp, setRegisteringIp] = useState(false);

  const [professionals, setProfessionals] = useState<any[]>([]);
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);

  // Acessos (admin only)
  const [accessRoles, setAccessRoles] = useState<any[]>([]);
  const [grantEmail, setGrantEmail] = useState("");
  const [grantBusy, setGrantBusy] = useState(false);

  const [newProf, setNewProf] = useState<any>({
    name: "", title: "", specialty: "", modality: "", city: "", country: "BR",
    price_from: "", contact: "", whatsapp: "", bio: "",
  });
  const [newPlat, setNewPlat] = useState<any>({
    name: "", description: "", country: "BR", url: "", phone: "", type: "public",
  });

  useEffect(() => {
    document.title = "Painel Admin — Cuidar+";
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (canView) loadAll();
  }, [canView, isAdmin]);

  async function loadAll() {
    await Promise.all([loadAnalytics(), loadProfessionals(), loadPlatforms(), loadAlerts(), loadFeedback(), loadAdminIps(), loadArticles()]);
    if (isAdmin) loadAccess();
  }

  async function loadAccess() {
    try {
      const { data, error } = await supabase.functions.invoke("manage-viewer", { body: { action: "list" } });
      if (error) throw error;
      setAccessRoles((data as any)?.roles ?? []);
    } catch (e: any) {
      console.error(e);
    }
  }

  async function grantViewer() {
    if (!grantEmail.trim()) return;
    setGrantBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-viewer", {
        body: { action: "grant", email: grantEmail.trim() },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("Acesso de leitura concedido");
      setGrantEmail("");
      await loadAccess();
    } catch (e: any) {
      toast.error("Falha: " + (e?.message ?? String(e)));
    } finally {
      setGrantBusy(false);
    }
  }

  async function revokeViewer(email: string) {
    if (!confirm(`Remover acesso de leitura de ${email}?`)) return;
    try {
      const { data, error } = await supabase.functions.invoke("manage-viewer", {
        body: { action: "revoke", email },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("Acesso removido");
      await loadAccess();
    } catch (e: any) {
      toast.error("Falha: " + (e?.message ?? String(e)));
    }
  }

  async function loadArticles() {
    const { data } = await supabase
      .from("severity_articles")
      .select("*")
      .order("severity");
    setArticles(data ?? []);
  }

  async function updateArticle(id: string, patch: { label?: string; url?: string; active?: boolean; summary?: string | null }) {
    const { error } = await supabase.from("severity_articles").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Artigo atualizado");
    await loadArticles();
  }

  async function loadAdminIps() {
    const { data } = await supabase
      .from("admin_ip_hashes")
      .select("*")
      .order("created_at", { ascending: false });
    setAdminIps(data ?? []);
    return data ?? [];
  }

  async function registerCurrentIp() {
    setRegisteringIp(true);
    try {
      const { error } = await supabase.functions.invoke("register-admin-ip", {
        body: { label: "via painel" },
      });
      if (error) throw error;
      toast.success("IP atual marcado como admin. Recarregando métricas…");
      await loadAdminIps();
      await loadAnalytics();
    } catch (e: any) {
      toast.error("Falha ao registrar IP: " + (e?.message ?? String(e)));
    } finally {
      setRegisteringIp(false);
    }
  }

  async function removeAdminIp(id: string) {
    const { error } = await supabase.from("admin_ip_hashes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("IP removido");
    await loadAdminIps();
    await loadAnalytics();
  }

  async function loadFeedback() {
    const { data } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setFeedback(data ?? []);
  }

  async function exportFullBackup(table: "test_events" | "link_clicks" | "feedback", filename: string) {
    const PAGE = 1000;
    let from = 0;
    const all: any[] = [];
    toast.info("Exportando backup completo… isso pode demorar.");
    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { data, error } = await supabase
          .from(table)
          .select("*")
          .order("created_at", { ascending: true })
          .range(from, from + PAGE - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        all.push(...data);
        if (data.length < PAGE) break;
        from += PAGE;
      }
      downloadCSV(filename, all);
      toast.success(`Backup gerado: ${all.length} registros`);
    } catch (e: any) {
      toast.error("Falha no backup: " + (e?.message ?? String(e)));
    }
  }

  async function loadAnalytics() {
    const since = subDays(new Date(), 30).toISOString();

    const [testsRes, clicksRes, ipRes] = await Promise.all([
      supabase.from("test_events").select("*").gte("created_at", since).order("created_at", { ascending: false }),
      supabase.from("link_clicks").select("*").gte("created_at", since).order("created_at", { ascending: false }),
      supabase.from("admin_ip_hashes").select("ip_hash"),
    ]);

    const adminHashes = new Set<string>((ipRes.data ?? []).map((r: any) => r.ip_hash));
    const allTests = testsRes.data ?? [];
    const allClicks = clicksRes.data ?? [];
    const tests = allTests.filter((t: any) => !t.ip_hash || !adminHashes.has(t.ip_hash));
    const clicks = allClicks.filter((c: any) => !c.ip_hash || !adminHashes.has(c.ip_hash));
    const excludedAdmin = (allTests.length - tests.length) + (allClicks.length - clicks.length);

    const uniqueIps = new Set(tests.map((t: any) => t.ip_hash).filter(Boolean)).size;
    setStats({ totalTests: tests.length, totalClicks: clicks.length, uniqueIps, excludedAdmin });
    setRawTests(tests);
    setRawClicks(clicks);

    // symptom frequency
    const symMap = new Map<string, number>();
    tenSymptoms.forEach((s) => symMap.set(s.id, 0));
    tests.forEach((t: any) => {
      if (!Array.isArray(t.symptoms)) return;
      t.symptoms.forEach((id: string) => {
        if (symMap.has(id)) symMap.set(id, (symMap.get(id) || 0) + 1);
      });
    });
    const totalSymTests = tests.filter((t: any) => Array.isArray(t.symptoms) && t.symptoms.length > 0).length;
    const symRows = tenSymptoms
      .map((s) => {
        const count = symMap.get(s.id) || 0;
        return {
          id: s.id,
          name: s.title,
          count,
          pct: totalSymTests > 0 ? Math.round((count / totalSymTests) * 100) : 0,
        };
      })
      .sort((a, b) => b.count - a.count);
    setBySymptom(symRows);

    // PHQ-9 por questão (média 0-3)
    const phq9Labels = [
      "Q1 · Pouco interesse/prazer",
      "Q2 · Para baixo/sem perspectiva",
      "Q3 · Sono",
      "Q4 · Cansaço/pouca energia",
      "Q5 · Apetite",
      "Q6 · Sentir-se mal consigo",
      "Q7 · Concentração",
      "Q8 · Lentidão/agitação",
      "Q9 · Pensamentos de auto-dano",
    ];
    const phq9Sums = Array(9).fill(0);
    const phq9Counts = Array(9).fill(0);
    let totalScoreSum = 0;
    let totalScoreCount = 0;
    tests.forEach((t: any) => {
      if (!Array.isArray(t.phq9_answers) || t.phq9_answers.length !== 9) return;
      let rowSum = 0;
      let valid = true;
      t.phq9_answers.forEach((v: any, i: number) => {
        if (typeof v !== "number") { valid = false; return; }
        phq9Sums[i] += v;
        phq9Counts[i] += 1;
        rowSum += v;
      });
      if (valid) { totalScoreSum += rowSum; totalScoreCount += 1; }
    });
    setPhq9ByQuestion(
      phq9Labels.map((name, i) => ({
        name,
        avg: phq9Counts[i] > 0 ? +(phq9Sums[i] / phq9Counts[i]).toFixed(2) : 0,
        responses: phq9Counts[i],
      }))
    );
    setPhq9Stats({
      avg: totalScoreCount > 0 ? +(totalScoreSum / totalScoreCount).toFixed(1) : 0,
      count: totalScoreCount,
    });

    // Distribuição do impacto funcional (0-3)
    const fiLabels = ["Nada difícil", "Um pouco difícil", "Muito difícil", "Extremamente difícil"];
    const fiCounts = [0, 0, 0, 0];
    tests.forEach((t: any) => {
      const v = t.functional_impact;
      if (typeof v === "number" && v >= 0 && v <= 3) fiCounts[v] += 1;
    });
    setFunctionalImpactDist(fiLabels.map((name, i) => ({ name, value: fiCounts[i] })));

    // attribution aggregations
    const aggBy = (field: string, items: any[]) => {
      const m = new Map<string, number>();
      items.forEach((x: any) => {
        const v = (x[field] && String(x[field]).trim()) || "(direto/desconhecido)";
        m.set(v, (m.get(v) || 0) + 1);
      });
      return Array.from(m.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
    };
    setBySource(aggBy("utm_source", tests));
    setByMedium(aggBy("utm_medium", tests));
    setByCampaign(aggBy("utm_campaign", tests));

    // referrer host (only when no utm_source)
    const refMap = new Map<string, number>();
    tests.forEach((t: any) => {
      if (t.utm_source) return;
      let host = "(direto)";
      if (t.referrer) {
        try { host = new URL(t.referrer).hostname.replace(/^www\./, ""); } catch { host = t.referrer.slice(0, 60); }
      }
      refMap.set(host, (refMap.get(host) || 0) + 1);
    });
    setByReferrer(
      Array.from(refMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)
    );

    // source × clicks (conversion proxy: tests vs clicks per source)
    const srcTests = new Map<string, number>();
    const srcClicks = new Map<string, number>();
    tests.forEach((t: any) => {
      const s = (t.utm_source && String(t.utm_source).trim()) || "(direto)";
      srcTests.set(s, (srcTests.get(s) || 0) + 1);
    });
    clicks.forEach((c: any) => {
      const s = (c.utm_source && String(c.utm_source).trim()) || "(direto)";
      srcClicks.set(s, (srcClicks.get(s) || 0) + 1);
    });
    const srcKeys = Array.from(new Set([...srcTests.keys(), ...srcClicks.keys()]));
    setSourceConv(
      srcKeys
        .map((name) => ({ name, tests: srcTests.get(name) || 0, clicks: srcClicks.get(name) || 0 }))
        .sort((a, b) => (b.tests + b.clicks) - (a.tests + a.clicks))
        .slice(0, 10)
    );
    const dayMap = new Map<string, { date: string; tests: number; clicks: number }>();
    for (let i = 29; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "dd/MM");
      dayMap.set(d, { date: d, tests: 0, clicks: 0 });
    }
    tests.forEach((t: any) => {
      const d = format(new Date(t.created_at), "dd/MM");
      const e = dayMap.get(d); if (e) e.tests++;
    });
    clicks.forEach((c: any) => {
      const d = format(new Date(c.created_at), "dd/MM");
      const e = dayMap.get(d); if (e) e.clicks++;
    });
    setByDay(Array.from(dayMap.values()));

    // severity
    const sevMap = new Map<string, number>();
    tests.forEach((t: any) => {
      const k = t.severity || "Sem dado";
      sevMap.set(k, (sevMap.get(k) || 0) + 1);
    });
    setBySeverity(Array.from(sevMap.entries()).map(([name, value]) => ({ name, value })));

    // country
    const cMap = new Map<string, number>();
    tests.forEach((t: any) => {
      const k = t.country || "Desconhecido";
      cMap.set(k, (cMap.get(k) || 0) + 1);
    });
    setByCountry(Array.from(cMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10));

    // city
    const cityMap = new Map<string, number>();
    tests.forEach((t: any) => {
      if (!t.city) return;
      cityMap.set(t.city, (cityMap.get(t.city) || 0) + 1);
    });
    const topCities = Array.from(cityMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
    setByCity(topCities);

    // age distribution
    const ageMap = new Map<string, number>();
    AGE_BUCKETS.forEach((b) => ageMap.set(b.label, 0));
    ageMap.set("Sem idade", 0);
    tests.forEach((t: any) => {
      const b = bucketFor(t.age) ?? "Sem idade";
      ageMap.set(b, (ageMap.get(b) || 0) + 1);
    });
    setByAge(Array.from(ageMap.entries()).map(([name, value]) => ({ name, value })));

    // severity x age (stacked)
    const sevByAge = AGE_BUCKETS.map((b) => {
      const row: any = { age: b.label };
      SEVERITIES.forEach((s) => (row[s] = 0));
      return row;
    });
    tests.forEach((t: any) => {
      const b = bucketFor(t.age);
      if (!b) return;
      const sev = t.severity;
      if (!sev || !(SEVERITIES as readonly string[]).includes(sev)) return;
      const row = sevByAge.find((r: any) => r.age === b);
      if (row) row[sev]++;
    });
    setSeverityByAge(sevByAge);

    // severity x city (stacked, top 8 cities)
    const topCityNames = topCities.slice(0, 8).map((c) => c.name);
    const sevByCity = topCityNames.map((name) => {
      const row: any = { city: name };
      SEVERITIES.forEach((s) => (row[s] = 0));
      return row;
    });
    tests.forEach((t: any) => {
      if (!t.city || !topCityNames.includes(t.city)) return;
      const sev = t.severity;
      if (!sev || !(SEVERITIES as readonly string[]).includes(sev)) return;
      const row = sevByCity.find((r: any) => r.city === t.city);
      if (row) row[sev]++;
    });
    setSeverityByCity(sevByCity);

    // top links
    const linkMap = new Map<string, { label: string; type: string; count: number }>();
    clicks.forEach((c: any) => {
      const key = `${c.link_type}:${c.target_label || c.target_id || c.link_type}`;
      const e = linkMap.get(key) || { label: c.target_label || c.target_id || c.link_type, type: c.link_type, count: 0 };
      e.count++;
      linkMap.set(key, e);
    });
    setTopLinks(Array.from(linkMap.values()).sort((a, b) => b.count - a.count).slice(0, 15));

    // by type
    const typeMap = new Map<string, number>();
    clicks.forEach((c: any) => typeMap.set(c.link_type, (typeMap.get(c.link_type) || 0) + 1));
    setLinksByType(Array.from(typeMap.entries()).map(([name, value]) => ({ name, value })));
  }

  async function loadProfessionals() {
    const { data } = await supabase.from("professionals").select("*").order("created_at", { ascending: false });
    setProfessionals(data ?? []);
  }
  async function loadPlatforms() {
    const { data } = await supabase.from("care_platforms").select("*").order("created_at", { ascending: false });
    setPlatforms(data ?? []);
  }
  async function loadAlerts() {
    const { data } = await supabase.from("system_alerts").select("*").eq("resolved", false).order("created_at", { ascending: false }).limit(20);
    setAlerts(data ?? []);
  }

  async function addProfessional() {
    if (!newProf.name || !newProf.city) return toast.error("Nome e cidade são obrigatórios");
    const { error } = await supabase.from("professionals").insert(newProf);
    if (error) return toast.error(error.message);
    toast.success("Profissional adicionado");
    setNewProf({ name: "", title: "", specialty: "", modality: "", city: "", country: "BR", price_from: "", contact: "", whatsapp: "", bio: "" });
    loadProfessionals();
  }
  async function deleteProfessional(id: string) {
    const { error } = await supabase.from("professionals").delete().eq("id", id);
    if (error) return toast.error(error.message);
    loadProfessionals();
  }
  async function addPlatform() {
    if (!newPlat.name || !newPlat.country) return toast.error("Nome e país são obrigatórios");
    const { error } = await supabase.from("care_platforms").insert(newPlat);
    if (error) return toast.error(error.message);
    toast.success("Plataforma adicionada");
    setNewPlat({ name: "", description: "", country: "BR", url: "", phone: "", type: "public" });
    loadPlatforms();
  }
  async function deletePlatform(id: string) {
    const { error } = await supabase.from("care_platforms").delete().eq("id", id);
    if (error) return toast.error(error.message);
    loadPlatforms();
  }
  async function resolveAlert(id: string) {
    await supabase.from("system_alerts").update({ resolved: true }).eq("id", id);
    loadAlerts();
  }

  if (loading) return <main className="min-h-screen flex items-center justify-center">Carregando...</main>;

  if (!canView) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 max-w-md text-center space-y-3">
          <h1 className="font-display text-xl font-semibold">Acesso restrito</h1>
          <p className="text-sm text-muted-foreground">
            Sua conta ({user?.email}) ainda não tem permissão de acesso ao painel.
            Peça ao administrador para conceder o acesso.
          </p>
          <Button onClick={signOut} variant="outline"><LogOut className="h-4 w-4 mr-2" /> Sair</Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-background sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14 gap-2 px-3 sm:px-4">
          <h1 className="font-display font-semibold text-sm sm:text-base truncate flex items-center gap-2">
            <span className="hidden sm:inline">Cuidar+ — Painel Admin</span>
            <span className="sm:hidden">Cuidar+ Admin</span>
            {readOnly && (
              <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">somente leitura</Badge>
            )}
          </h1>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground hidden md:block truncate max-w-[180px]">{user?.email}</span>
            <Button size="sm" variant="outline" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      {alerts.length > 0 && (
        <div className="container mt-4 space-y-2 px-3 sm:px-4">
          {alerts.map((a) => (
            <Card key={a.id} className={`p-3 flex items-start gap-3 border-l-4 ${a.severity === "critical" ? "border-l-destructive bg-destructive/5" : "border-l-warning bg-warning/5"}`}>
              <AlertTriangle className={`h-5 w-5 shrink-0 ${a.severity === "critical" ? "text-destructive" : "text-warning-foreground"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{a.alert_type === "quota" ? "⚠️ Saldo/Quota do Lovable Cloud" : a.alert_type === "volume" ? "📊 Volume alto de uso" : "Alerta"}</p>
                <p className="text-sm text-muted-foreground break-words">{a.message}</p>
              </div>
              {!readOnly && (
                <Button size="sm" variant="ghost" onClick={() => resolveAlert(a.id)}>OK</Button>
              )}
            </Card>
          ))}
        </div>
      )}

      <div className="container py-6 px-3 sm:px-4">
        <Tabs defaultValue="analytics">
          <div className="-mx-3 sm:mx-0 overflow-x-auto pb-1">
            <TabsList className="inline-flex w-max min-w-full justify-start px-3 sm:px-0">
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="links">Links</TabsTrigger>
              <TabsTrigger value="feedback">Feedback ({feedback.length})</TabsTrigger>
              {!readOnly && <TabsTrigger value="professionals">Profissionais</TabsTrigger>}
              {!readOnly && <TabsTrigger value="platforms">Plataformas</TabsTrigger>}
              {!readOnly && <TabsTrigger value="admin-ips">IPs admin ({adminIps.length})</TabsTrigger>}
              {!readOnly && <TabsTrigger value="articles">Artigos</TabsTrigger>}
              {!readOnly && <TabsTrigger value="campaign">Campanha</TabsTrigger>}
              {!readOnly && <TabsTrigger value="access">Acessos</TabsTrigger>}
            </TabsList>
          </div>

          <TabsContent value="analytics" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Testes (30d)" value={stats.totalTests} />
              <StatCard label="IPs únicos (30d)" value={stats.uniqueIps} />
              <StatCard label="Cliques (30d)" value={stats.totalClicks} />
              <StatCard label="Excluídos (admin)" value={stats.excludedAdmin ?? 0} />
            </div>
            {stats.excludedAdmin > 0 && (
              <p className="text-xs text-muted-foreground -mt-2">
                {stats.excludedAdmin} eventos de IPs marcados como admin foram excluídos das métricas.
              </p>
            )}

            <Card className="p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="font-semibold">Exportar dados (CSV)</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-prose">
                    Arquivos UTF-8 prontos para análise em R, Python, SPSS ou Excel. Janela: últimos 30 dias.
                    Em R use <code className="text-[11px] bg-muted px-1 rounded">readr::read_csv("arquivo.csv")</code>.
                    Sintomas vêm separados por <code className="text-[11px] bg-muted px-1 rounded">|</code> (ex.: <code className="text-[11px] bg-muted px-1 rounded">humor|sono|fadiga</code>).
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    downloadCSV(
                      `cuidar-tests-${format(new Date(), "yyyyMMdd")}.csv`,
                      rawTests.map((t) => ({
                        id: t.id,
                        created_at: t.created_at,
                        score: t.score,
                        severity: t.severity,
                        age: t.age,
                        age_bucket: bucketFor(t.age),
                        country: t.country,
                        region: t.region,
                        city: t.city,
                        symptoms: Array.isArray(t.symptoms) ? t.symptoms : [],
                        symptom_count: Array.isArray(t.symptoms) ? t.symptoms.length : 0,
                      }))
                    )
                  }
                >
                  <Download className="h-4 w-4" /> Testes ({rawTests.length})
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    downloadCSV(
                      `cuidar-clicks-${format(new Date(), "yyyyMMdd")}.csv`,
                      rawClicks.map((c) => ({
                        id: c.id,
                        created_at: c.created_at,
                        link_type: c.link_type,
                        target_id: c.target_id,
                        target_label: c.target_label,
                        country: c.country,
                        region: c.region,
                        city: c.city,
                      }))
                    )
                  }
                >
                  <Download className="h-4 w-4" /> Cliques ({rawClicks.length})
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    downloadCSV(
                      `cuidar-feedback-${format(new Date(), "yyyyMMdd")}.csv`,
                      feedback.map((f) => ({
                        id: f.id,
                        created_at: f.created_at,
                        message: f.message,
                        severity: f.severity,
                        score: f.score,
                        country: f.country,
                        region: f.region,
                        city: f.city,
                      }))
                    )
                  }
                >
                  <Download className="h-4 w-4" /> Feedback ({feedback.length})
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    downloadCSV(
                      `cuidar-sintomas-${format(new Date(), "yyyyMMdd")}.csv`,
                      bySymptom.map((s) => ({ symptom_id: s.id, symptom: s.name, count: s.count, pct: s.pct }))
                    )
                  }
                >
                  <Download className="h-4 w-4" /> Sintomas (agregado)
                </Button>
              </div>

              <div className="mt-4 pt-4 border-t border-border/60">
                <h4 className="font-semibold text-sm">Backup completo (todo o histórico, todos os campos)</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-prose">
                  Exporta <strong>todas</strong> as linhas brutas de testes e cliques desde o início, sem agregação e sem o filtro de 30 dias. Use para arquivar uma cópia local periodicamente.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={() => exportFullBackup("test_events", `cuidar-backup-tests-${format(new Date(), "yyyyMMdd")}.csv`)}
                  >
                    <Download className="h-4 w-4" /> Backup completo · Testes
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => exportFullBackup("link_clicks", `cuidar-backup-clicks-${format(new Date(), "yyyyMMdd")}.csv`)}
                  >
                    <Download className="h-4 w-4" /> Backup completo · Cliques
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => exportFullBackup("feedback", `cuidar-backup-feedback-${format(new Date(), "yyyyMMdd")}.csv`)}
                  >
                    <Download className="h-4 w-4" /> Backup completo · Feedback
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-3">Atividade diária (30 dias)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={byDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                  <Legend />
                  <Line type="monotone" dataKey="tests" name="Testes" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Line type="monotone" dataKey="clicks" name="Cliques" stroke="hsl(var(--success))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Severidade dos resultados</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={bySeverity} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {bySeverity.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-3">Top países</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={byCountry}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            <Card className="p-4">
              <h3 className="font-semibold mb-3">Top cidades</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byCity} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={140} />
                  <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="value" fill="hsl(var(--success))" />
                </BarChart>
              </ResponsiveContainer>
              {byCity.length === 0 && <p className="text-sm text-muted-foreground">Sem dados de cidade ainda.</p>}
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Distribuição por faixa etária</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={byAge}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
                {byAge.every((b) => b.value === 0) && (
                  <p className="text-sm text-muted-foreground">Sem dados de idade ainda. A coleta começa após este deploy.</p>
                )}
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-3">Severidade × faixa etária</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={severityByAge}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="age" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {SEVERITIES.map((s, i) => (
                      <Bar key={s} dataKey={s} stackId="sev" fill={COLORS[i % COLORS.length]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            <Card className="p-4">
              <h3 className="font-semibold mb-3">Severidade × cidade (top 8)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={severityByCity} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis dataKey="city" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={140} />
                  <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {SEVERITIES.map((s, i) => (
                    <Bar key={s} dataKey={s} stackId="sev" fill={COLORS[i % COLORS.length]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
              {severityByCity.length === 0 && <p className="text-sm text-muted-foreground">Sem dados de cidade ainda.</p>}
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-1">Sintomas mais frequentes (checklist DSM-5)</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Frequência com que cada sintoma foi marcado entre os {rawTests.filter((t) => Array.isArray(t.symptoms) && t.symptoms.length > 0).length} testes com checklist preenchido nos últimos 30 dias.
              </p>
              <ResponsiveContainer width="100%" height={Math.max(280, bySymptom.length * 32)}>
                <BarChart data={bySymptom} layout="vertical" margin={{ left: 8, right: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={180} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                    formatter={(v: any, _n: any, p: any) => [`${v} (${p?.payload?.pct ?? 0}%)`, "Marcações"]}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
              {bySymptom.every((s) => s.count === 0) && (
                <p className="text-sm text-muted-foreground">
                  Nenhum sintoma registrado ainda. A coleta começa após este deploy — testes anteriores não enviavam o checklist.
                </p>
              )}
            </Card>

            <Card className="p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                <div>
                  <h3 className="font-semibold">PHQ-9 — média por questão</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Média da resposta (0 = nenhuma vez · 3 = quase todos os dias) entre {phq9Stats.count} testes com PHQ-9 nos últimos 30 dias.
                    Score médio total: <strong className="text-foreground">{phq9Stats.avg}</strong>/27.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    downloadCSV(
                      `cuidar-phq9-respostas-${format(new Date(), "yyyyMMdd")}.csv`,
                      rawTests
                        .filter((t) => Array.isArray(t.phq9_answers) && t.phq9_answers.length === 9)
                        .map((t) => ({
                          id: t.id,
                          created_at: t.created_at,
                          age: t.age,
                          severity: t.severity,
                          score: t.score,
                          functional_impact: t.functional_impact,
                          q1: t.phq9_answers[0],
                          q2: t.phq9_answers[1],
                          q3: t.phq9_answers[2],
                          q4: t.phq9_answers[3],
                          q5: t.phq9_answers[4],
                          q6: t.phq9_answers[5],
                          q7: t.phq9_answers[6],
                          q8: t.phq9_answers[7],
                          q9: t.phq9_answers[8],
                          country: t.country,
                          city: t.city,
                        }))
                    )
                  }
                >
                  <Download className="h-4 w-4" /> PHQ-9 detalhado
                </Button>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={phq9ByQuestion} layout="vertical" margin={{ left: 8, right: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 3]} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={200} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                    formatter={(v: any, _n: any, p: any) => [`${v} (n=${p?.payload?.responses ?? 0})`, "Média"]}
                  />
                  <Bar dataKey="avg" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
              {phq9Stats.count === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhuma resposta detalhada de PHQ-9 ainda. A coleta começa após este deploy — testes anteriores guardavam apenas o score total.
                </p>
              )}
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-1">Impacto funcional (critério B do DSM-5)</h3>
              <p className="text-xs text-muted-foreground mb-3">
                O quanto os sintomas dificultam o trabalho, tarefas em casa ou relacionamentos.
              </p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={functionalImpactDist} margin={{ left: 8, right: 16, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="value" fill="hsl(var(--warning))" />
                </BarChart>
              </ResponsiveContainer>
              {functionalImpactDist.every((d) => d.value === 0) && (
                <p className="text-sm text-muted-foreground">Sem dados de impacto funcional ainda.</p>
              )}
            </Card>

            <Card className="p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                <div>
                  <h3 className="font-semibold">Origem dos testes (atribuição)</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-prose">
                    De onde vêm os usuários que completam o teste. Use links com <code className="text-[11px] bg-muted px-1 rounded">?utm_source=instagram&utm_medium=bio&utm_campaign=lancamento</code> para rastrear cada canal.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    downloadCSV(
                      `cuidar-atribuicao-${format(new Date(), "yyyyMMdd")}.csv`,
                      rawTests.map((t) => ({
                        id: t.id,
                        created_at: t.created_at,
                        severity: t.severity,
                        utm_source: t.utm_source,
                        utm_medium: t.utm_medium,
                        utm_campaign: t.utm_campaign,
                        utm_content: t.utm_content,
                        utm_term: t.utm_term,
                        referrer: t.referrer,
                        landing_path: t.landing_path,
                        country: t.country,
                        city: t.city,
                      }))
                    )
                  }
                >
                  <Download className="h-4 w-4" /> Exportar atribuição
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Top fontes (utm_source)</h4>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={bySource} layout="vertical" margin={{ left: 8, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                      <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={120} />
                      <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                      <Bar dataKey="value" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Top meios (utm_medium)</h4>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={byMedium} layout="vertical" margin={{ left: 8, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                      <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={120} />
                      <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                      <Bar dataKey="value" fill="hsl(var(--success))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Top campanhas (utm_campaign)</h4>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={byCampaign} layout="vertical" margin={{ left: 8, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                      <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={120} />
                      <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                      <Bar dataKey="value" fill="hsl(var(--warning))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Referrers (sem UTM)</h4>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={byReferrer} layout="vertical" margin={{ left: 8, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                      <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={120} />
                      <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                      <Bar dataKey="value" fill="hsl(var(--muted-foreground))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-medium mb-2">Testes vs cliques por fonte</h4>
                <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fonte</TableHead>
                        <TableHead className="text-right">Testes</TableHead>
                        <TableHead className="text-right">Cliques (saída)</TableHead>
                        <TableHead className="text-right">Cliques/teste</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sourceConv.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{r.name}</TableCell>
                          <TableCell className="text-right">{r.tests}</TableCell>
                          <TableCell className="text-right">{r.clicks}</TableCell>
                          <TableCell className="text-right">{r.tests > 0 ? (r.clicks / r.tests).toFixed(2) : "—"}</TableCell>
                        </TableRow>
                      ))}
                      {sourceConv.length === 0 && (
                        <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Sem dados de atribuição ainda.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {bySource.every((s) => s.name === "(direto/desconhecido)") && (
                <p className="text-xs text-muted-foreground mt-3">
                  Nenhum UTM detectado ainda. Compartilhe links com parâmetros <code className="text-[11px] bg-muted px-1 rounded">utm_source</code>, <code className="text-[11px] bg-muted px-1 rounded">utm_medium</code> e <code className="text-[11px] bg-muted px-1 rounded">utm_campaign</code> para ver a divisão por canal.
                </p>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="links" className="space-y-4 pt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Cliques por tipo</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={linksByType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {linksByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-3">Top links acessados</h3>
                <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Link</TableHead><TableHead>Tipo</TableHead><TableHead className="text-right">Cliques</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {topLinks.map((l, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{l.label}</TableCell>
                        <TableCell><Badge variant="outline">{l.type}</Badge></TableCell>
                        <TableCell className="text-right">{l.count}</TableCell>
                      </TableRow>
                    ))}
                    {topLinks.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Sem cliques ainda</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4 pt-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Feedbacks dos usuários ({feedback.length})</h3>
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Mensagem</TableHead>
                    <TableHead>Severidade</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedback.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(f.created_at), "dd/MM/yy HH:mm")}
                      </TableCell>
                      <TableCell className="max-w-md">{f.message}</TableCell>
                      <TableCell>
                        {f.severity ? <Badge variant="outline">{f.severity}</Badge> : "—"}
                      </TableCell>
                      <TableCell className="text-right">{f.score ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                  {feedback.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Nenhum feedback recebido ainda.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="professionals" className="space-y-4 pt-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Plus className="h-4 w-4" /> Adicionar profissional</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <Field label="Nome" value={newProf.name} onChange={(v) => setNewProf({ ...newProf, name: v })} />
                <Field label="Título" value={newProf.title} onChange={(v) => setNewProf({ ...newProf, title: v })} />
                <Field label="Especialidade" value={newProf.specialty} onChange={(v) => setNewProf({ ...newProf, specialty: v })} />
                <Field label="Modalidade" value={newProf.modality} onChange={(v) => setNewProf({ ...newProf, modality: v })} />
                <Field label="Cidade" value={newProf.city} onChange={(v) => setNewProf({ ...newProf, city: v })} />
                <Field label="País" value={newProf.country} onChange={(v) => setNewProf({ ...newProf, country: v })} />
                <Field label="A partir de (R$)" value={newProf.price_from} onChange={(v) => setNewProf({ ...newProf, price_from: v })} />
                <Field label="Contato" value={newProf.contact} onChange={(v) => setNewProf({ ...newProf, contact: v })} />
                <Field label="WhatsApp (5511...)" value={newProf.whatsapp} onChange={(v) => setNewProf({ ...newProf, whatsapp: v })} />
              </div>
              <div className="mt-3">
                <Label>Bio</Label>
                <Textarea value={newProf.bio} onChange={(e) => setNewProf({ ...newProf, bio: e.target.value })} rows={2} />
              </div>
              <Button onClick={addProfessional} className="mt-3">Adicionar</Button>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-3">Profissionais cadastrados ({professionals.length})</h3>
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <Table>
                <TableHeader>
                  <TableRow><TableHead>Nome</TableHead><TableHead>Cidade</TableHead><TableHead>Modalidade</TableHead><TableHead></TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {professionals.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell><div className="font-medium">{p.name}</div><div className="text-xs text-muted-foreground">{p.specialty}</div></TableCell>
                      <TableCell>{p.city} · {p.country}</TableCell>
                      <TableCell className="text-sm">{p.modality}</TableCell>
                      <TableCell><Button size="sm" variant="ghost" onClick={() => deleteProfessional(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="platforms" className="space-y-4 pt-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Plus className="h-4 w-4" /> Adicionar plataforma de atendimento</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <Field label="Nome" value={newPlat.name} onChange={(v) => setNewPlat({ ...newPlat, name: v })} />
                <Field label="País (BR, PT, US...)" value={newPlat.country} onChange={(v) => setNewPlat({ ...newPlat, country: v })} />
                <Field label="URL" value={newPlat.url} onChange={(v) => setNewPlat({ ...newPlat, url: v })} />
                <Field label="Telefone" value={newPlat.phone} onChange={(v) => setNewPlat({ ...newPlat, phone: v })} />
                <div>
                  <Label>Tipo</Label>
                  <select value={newPlat.type} onChange={(e) => setNewPlat({ ...newPlat, type: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="public">Público</option>
                    <option value="ngo">ONG</option>
                    <option value="hotline">Linha de apoio</option>
                    <option value="low-cost">Baixo custo</option>
                  </select>
                </div>
              </div>
              <div className="mt-3">
                <Label>Descrição</Label>
                <Textarea value={newPlat.description} onChange={(e) => setNewPlat({ ...newPlat, description: e.target.value })} rows={2} />
              </div>
              <Button onClick={addPlatform} className="mt-3">Adicionar</Button>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-3">Plataformas cadastradas ({platforms.length})</h3>
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <Table>
                <TableHeader>
                  <TableRow><TableHead>Nome</TableHead><TableHead>País</TableHead><TableHead>Tipo</TableHead><TableHead>Telefone</TableHead><TableHead></TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {platforms.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.country}</TableCell>
                      <TableCell><Badge variant="outline">{p.type}</Badge></TableCell>
                      <TableCell>{p.phone}</TableCell>
                      <TableCell><Button size="sm" variant="ghost" onClick={() => deletePlatform(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="admin-ips" className="space-y-4 pt-4">
            <Card className="p-4 space-y-4">
              <div>
                <h3 className="font-semibold flex items-center gap-2"><Shield className="h-4 w-4" /> IPs do administrador</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Testes e cliques originados destes IPs (hash) são excluídos
                  das métricas. Use o botão abaixo a partir de cada rede
                  (casa, celular, escritório) que você queira ignorar.
                </p>
              </div>
              <Button onClick={registerCurrentIp} disabled={registeringIp}>
                <Plus className="h-4 w-4 mr-2" />
                {registeringIp ? "Registrando…" : "Marcar meu IP atual como admin"}
              </Button>
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hash do IP</TableHead>
                    <TableHead>Rótulo</TableHead>
                    <TableHead>Adicionado em</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminIps.map((ip) => (
                    <TableRow key={ip.id}>
                      <TableCell className="font-mono text-xs">{ip.ip_hash.slice(0, 12)}…</TableCell>
                      <TableCell className="text-sm">{ip.label ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(ip.created_at), "dd/MM/yy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => removeAdminIp(ip.id)}>
                          <ShieldOff className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {adminIps.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Nenhum IP marcado ainda.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="articles" className="space-y-4 pt-4">
            <Card className="p-4 space-y-4">
              <div>
                <h3 className="font-semibold">Artigos científicos por severidade</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Estes links aparecem na página de resultados, abaixo do nível de
                  severidade. Use apenas fontes em português de instituições idôneas
                  (OPAS/OMS, ABP, AMB, SciELO, Ministério da Saúde).
                </p>
              </div>
              <div className="space-y-4">
                {SEVERITIES.map((sev) => {
                  const a = articles.find((x) => x.severity === sev);
                  if (!a) return (
                    <div key={sev} className="text-sm text-muted-foreground border border-dashed rounded-md p-3">
                      Nenhum artigo cadastrado para <strong>{sev}</strong>.
                    </div>
                  );
                  return (
                    <div key={sev} className="border rounded-md p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline">{sev}</Badge>
                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={a.active}
                            onChange={(e) => updateArticle(a.id, { active: e.target.checked })}
                          />
                          Ativo
                        </label>
                      </div>
                      <div>
                        <Label className="text-xs">Título exibido</Label>
                        <Input
                          defaultValue={a.label}
                          onBlur={(e) => {
                            if (e.target.value !== a.label) updateArticle(a.id, { label: e.target.value });
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">URL do artigo</Label>
                        <Input
                          defaultValue={a.url}
                          onBlur={(e) => {
                            if (e.target.value !== a.url) updateArticle(a.id, { url: e.target.value });
                          }}
                        />
                        {a.url && (
                          <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-1 inline-block">
                            Abrir link atual ↗
                          </a>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs">
                          Resumo exibido (“O que é depressão {sev.toLowerCase()}?”)
                        </Label>
                        <Textarea
                          rows={4}
                          placeholder="Se vazio, será gerado automaticamente por IA na página de resultados."
                          defaultValue={a.summary ?? ""}
                          onBlur={(e) => {
                            const v = e.target.value.trim();
                            const current = a.summary ?? "";
                            if (v !== current) updateArticle(a.id, { summary: v || null });
                          }}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Deixe em branco para usar o resumo gerado por IA.
                        </p>
                      </div>
                      {a.source && (
                        <p className="text-xs text-muted-foreground">Fonte: {a.source}</p>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                As alterações são salvas automaticamente ao sair do campo (blur).
              </p>
            </Card>
          </TabsContent>

          {!readOnly && (
            <TabsContent value="access" className="space-y-4 pt-4">
              <Card className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold">Conceder acesso somente leitura</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    A pessoa deve primeiro criar uma conta em <code>/auth</code>. Em seguida, informe o email dela aqui para liberar o painel em modo somente leitura (sem alterar dados, profissionais, plataformas, IPs ou artigos).
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={grantEmail}
                    onChange={(e) => setGrantEmail(e.target.value)}
                    className="max-w-sm"
                  />
                  <Button onClick={grantViewer} disabled={grantBusy || !grantEmail.trim()}>
                    <Plus className="h-4 w-4" /> {grantBusy ? "Concedendo..." : "Conceder acesso"}
                  </Button>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-3">Pessoas com acesso</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Papel</TableHead>
                      <TableHead>Concedido em</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accessRoles.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground text-sm">Nenhum acesso registrado.</TableCell></TableRow>
                    )}
                    {accessRoles.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-sm">{r.email ?? <span className="text-muted-foreground">(sem email)</span>}</TableCell>
                        <TableCell>
                          <Badge variant={r.role === "admin" ? "default" : "secondary"}>{r.role}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.created_at ? format(new Date(r.created_at), "dd/MM/yyyy") : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {r.role === "viewer" && r.email && (
                            <Button size="sm" variant="ghost" onClick={() => revokeViewer(r.email)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          )}

          {!readOnly && (
            <TabsContent value="campaign" className="space-y-4 pt-4">
              <CampaignComposer baseUrl={typeof window !== "undefined" ? window.location.origin : "https://cuidarmaisbrasil.life"} />
            </TabsContent>
          )}

        </Tabs>
      </div>
    </main>
  );
};

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <Card className="p-4">
    <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
    <p className="font-display text-3xl font-semibold mt-1">{value.toLocaleString("pt-BR")}</p>
  </Card>
);

const Field = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div>
    <Label>{label}</Label>
    <Input value={value} onChange={(e) => onChange(e.target.value)} />
  </div>
);

export default Admin;
