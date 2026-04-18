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
import { AlertTriangle, LogOut, Plus, Trash2 } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { toast } from "sonner";
import { format, subDays } from "date-fns";

const COLORS = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))", "hsl(var(--muted-foreground))"];

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading, signOut } = useAuth();

  const [stats, setStats] = useState<any>({ totalTests: 0, totalClicks: 0, uniqueIps: 0 });
  const [byDay, setByDay] = useState<any[]>([]);
  const [bySeverity, setBySeverity] = useState<any[]>([]);
  const [byCountry, setByCountry] = useState<any[]>([]);
  const [byCity, setByCity] = useState<any[]>([]);
  const [topLinks, setTopLinks] = useState<any[]>([]);
  const [linksByType, setLinksByType] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  const [professionals, setProfessionals] = useState<any[]>([]);
  const [platforms, setPlatforms] = useState<any[]>([]);

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
    if (isAdmin) loadAll();
  }, [isAdmin]);

  async function loadAll() {
    await Promise.all([loadAnalytics(), loadProfessionals(), loadPlatforms(), loadAlerts()]);
  }

  async function loadAnalytics() {
    const since = subDays(new Date(), 30).toISOString();

    const [testsRes, clicksRes] = await Promise.all([
      supabase.from("test_events").select("*").gte("created_at", since).order("created_at", { ascending: false }),
      supabase.from("link_clicks").select("*").gte("created_at", since).order("created_at", { ascending: false }),
    ]);

    const tests = testsRes.data ?? [];
    const clicks = clicksRes.data ?? [];

    const uniqueIps = new Set(tests.map((t: any) => t.ip_hash).filter(Boolean)).size;
    setStats({ totalTests: tests.length, totalClicks: clicks.length, uniqueIps });

    // by day
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
    setByCity(Array.from(cityMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10));

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

  if (!isAdmin) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 max-w-md text-center space-y-3">
          <h1 className="font-display text-xl font-semibold">Acesso restrito</h1>
          <p className="text-sm text-muted-foreground">
            Sua conta ({user?.email}) ainda não tem o papel <code>admin</code>.
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
        <div className="container flex items-center justify-between h-14">
          <h1 className="font-display font-semibold">Cuidar+ — Painel Admin</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:block">{user?.email}</span>
            <Button size="sm" variant="outline" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      {alerts.length > 0 && (
        <div className="container mt-4 space-y-2">
          {alerts.map((a) => (
            <Card key={a.id} className={`p-3 flex items-start gap-3 border-l-4 ${a.severity === "critical" ? "border-l-destructive bg-destructive/5" : "border-l-warning bg-warning/5"}`}>
              <AlertTriangle className={`h-5 w-5 ${a.severity === "critical" ? "text-destructive" : "text-warning-foreground"}`} />
              <div className="flex-1">
                <p className="text-sm font-medium">{a.alert_type === "quota" ? "⚠️ Saldo/Quota do Lovable Cloud" : a.alert_type === "volume" ? "📊 Volume alto de uso" : "Alerta"}</p>
                <p className="text-sm text-muted-foreground">{a.message}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => resolveAlert(a.id)}>OK</Button>
            </Card>
          ))}
        </div>
      )}

      <div className="container py-6">
        <Tabs defaultValue="analytics">
          <TabsList>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="links">Links de atendimento</TabsTrigger>
            <TabsTrigger value="professionals">Profissionais</TabsTrigger>
            <TabsTrigger value="platforms">Plataformas</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <StatCard label="Testes (30d)" value={stats.totalTests} />
              <StatCard label="IPs únicos (30d)" value={stats.uniqueIps} />
              <StatCard label="Cliques em links (30d)" value={stats.totalClicks} />
            </div>

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
              </Card>
            </div>
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
            </Card>
          </TabsContent>
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
