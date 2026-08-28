import { useAuth } from "@/_core/hooks/useAuth";

import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Bell, Boxes, BriefcaseBusiness, CheckCircle2, ChevronRight, CircleDollarSign, ClipboardCheck, Clock3, Download, Factory, FileText, LayoutDashboard, LogIn, LogOut, Menu, MessageSquare, Moon, PackageCheck, Plus, Search, Settings2, ShieldCheck, ShoppingCart, Sparkles, Sun, TrendingUp, Truck, UserRound, UsersRound, X } from "lucide-react";
import { useMemo, useState, useCallback, useEffect } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "@/contexts/ThemeContext";
import { ModuleChat } from "@/components/chat/ModuleChat";

const modules = [
  { id: "dashboard", label: "Visão geral", icon: LayoutDashboard },
  { id: "commercial", label: "Comercial", icon: BriefcaseBusiness },
  { id: "production", label: "Produção", icon: Factory },
  { id: "stock", label: "Estoque & compras", icon: Boxes },
  { id: "suppliers", label: "Fornecedores", icon: Truck },
  { id: "costs", label: "Custos & margem", icon: CircleDollarSign },
  { id: "post-sale", label: "Pós-venda", icon: UserRound },
  { id: "reports", label: "Relatórios", icon: BarChart3 },
];

const demoProjects: { code: string; name: string; client: string; status: string; progress: number; value: string; margin: string; tone: string }[] = [];

const weekly: { day: string; value: number }[] = [];
const stageData: { name: string; value: number; color: string }[] = [];

function money(value: number) { return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }); }

export default function Home() {
  const { user, isAuthenticated, logout, loading } = useAuth({ redirectOnUnauthenticated: true });
  const [active, setActive] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handlePrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handlePrompt);
    if ((window as any).deferredInstallPrompt) {
      setInstallPrompt((window as any).deferredInstallPrompt);
    }
    return () => window.removeEventListener("beforeinstallprompt", handlePrompt);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setInstallPrompt(null);
      (window as any).deferredInstallPrompt = null;
    }
  };

  const role = user?.role ?? "gestor";
  // role 'user' agora tem acesso completo (conta recém criada)
  const allowedByRole: Record<string, string[]> = {
    admin: modules.map(item => item.id),
    gestor: modules.map(item => item.id),
    user: modules.map(item => item.id),
    comercial: ["dashboard", "commercial", "reports"],
    producao: ["dashboard", "production", "stock"],
    compras: ["dashboard", "stock", "suppliers", "costs"],
    pos_venda: ["dashboard", "post-sale", "reports"],
  };
  const visibleModules = modules.filter(item => (allowedByRole[role] ?? modules.map(m => m.id)).includes(item.id));
  const summaryQuery = trpc.dashboard.summary.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const reportsQuery = trpc.reports.overview.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const projectsQuery = trpc.projects.list.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const productionQuery = trpc.production.list.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const clientsQuery = trpc.clients.list.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const isLoading = summaryQuery.isLoading || reportsQuery.isLoading || projectsQuery.isLoading;
  const summary = summaryQuery.data ?? { projects: 0, proposals: 0, orders: 0, clients: 0, stockAlerts: 0, overdueOrders: 0, budgetAlerts: 0, postSaleToday: 0 };
  const reports = reportsQuery.data ?? { sold: 0, planned: 0, actual: 0, margin: 0, suppliersAtRisk: 0 };
  const currentModule = visibleModules.find(item => item.id === active) ?? visibleModules[0];
  const greeting = user?.name?.split(" ")[0] ?? "Usuário";
  const totalAlerts = (summary.overdueOrders ?? 0) + (summary.budgetAlerts ?? 0) + (summary.stockAlerts ?? 0) + (summary.postSaleToday ?? 0);
  const notifItems = [
    ...(summary.overdueOrders > 0 ? [{ tone: "rose", icon: Clock3, title: `${summary.overdueOrders} ordem(ns) atrasada(s)`, sub: "Verifique as ordens de produção" }] : []),
    ...(summary.budgetAlerts > 0 ? [{ tone: "amber", icon: CircleDollarSign, title: `${summary.budgetAlerts} projeto acima do orçamento`, sub: "Analise os custos do projeto" }] : []),
    ...(summary.stockAlerts > 0 ? [{ tone: "cyan", icon: PackageCheck, title: `${summary.stockAlerts} itens abaixo do mínimo`, sub: "Reposição de estoque necessária" }] : []),
    ...(summary.postSaleToday > 0 ? [{ tone: "emerald", icon: UsersRound, title: `${summary.postSaleToday} contatos de pós-venda hoje`, sub: "Acompanhe o relacionamento" }] : []),
  ];
  const visibleProjects = useMemo(() => projectsQuery.data?.slice(0, 3).map((project, index) => ({ code: project.code, name: project.name, client: `Cliente #${project.clientId}`, status: project.status === "in_progress" ? "Em produção" : project.status === "post_sale" ? "Pós-venda" : "Planejamento", progress: project.status === "delivered" ? 100 : project.status === "in_progress" ? 68 : 38, value: money(Number(project.soldValue ?? 0)), margin: Number(project.soldValue ?? 0) ? `${(((Number(project.soldValue ?? 0) - Number(project.actualCost ?? 0)) / Number(project.soldValue ?? 0)) * 100).toFixed(1).replace(".", ",")}%` : "0%", tone: ["blue", "violet", "emerald"][index % 3] })) ?? demoProjects, [projectsQuery.data]);
  // data dinâmica
  const todayLabel = useMemo(() => {
    return new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }, []);

  // Enquanto verifica a sessão, mostra tela em branco para evitar flash do dashboard
  // Importante: Este return early DEVE estar após todos os hooks (useState, useEffect, useQuery, useMemo)
  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
        <div className="flex flex-col items-center gap-4">
          <img src="/logo.png" alt="Multiply Engineering" className="h-16 w-auto object-contain opacity-80 animate-pulse" style={{ mixBlendMode: "screen" }} />
          <div className="h-1 w-48 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-emerald-400/60 rounded-full animate-[shimmer_1.5s_ease-in-out_infinite]" style={{ width: "60%" }} />
          </div>
        </div>
      </div>
    );
  }

  return <div className="min-h-screen bg-[#f5f7fb] dark:bg-zinc-950 text-[#172033] dark:text-zinc-50">
    {/* Sidebar — sempre fundo escuro independente do tema */}
    <aside className={`fixed inset-y-0 left-0 z-50 w-[264px] border-r border-white/5 bg-[#0f0f0f] text-white transition-transform duration-200 lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex h-20 items-center gap-3 border-b border-white/10 px-4">
        <img src="/logo.png" alt="Multiply Engineering" className="h-10 w-auto object-contain" style={{ mixBlendMode: "screen" }} />
        <div className="flex flex-col">
          <span className="font-sans font-black tracking-wider text-[15px] text-white uppercase leading-none">Multiply</span>
          <span className="text-[9px] text-emerald-400 tracking-[0.16em] font-semibold uppercase mt-0.5">Engineering</span>
        </div>
        <button onClick={() => setMobileOpen(false)} className="lg:hidden ml-auto"><X className="h-5 w-5 text-white/60" /></button>
      </div>
      <div className="px-4 pt-7">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Operação</p>
        <nav className="space-y-1">
          {visibleModules.filter(item => item.id !== "reports").map(item => {
            const Icon = item.icon; const selected = active === item.id;
            return <button key={item.id} onClick={() => { setActive(item.id); setMobileOpen(false); }} className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${selected ? "bg-white text-[#172033] shadow-xl shadow-black/10" : "text-white/60 hover:bg-white/10 hover:text-white"}`}>
              <Icon className={`h-[17px] w-[17px] ${selected ? "text-zinc-800" : "text-white/45 group-hover:text-white"}`} />
              <span className="flex-1">{item.label}</span>
              {item.id === "dashboard" && totalAlerts > 0 && <span className="rounded-full bg-rose-400 px-1.5 py-0.5 text-[10px] font-bold text-white">{totalAlerts}</span>}
            </button>;
          })}
        </nav>
        <p className="mb-3 mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Gestão</p>
        <nav className="space-y-1">
          {visibleModules.filter(item => item.id === "reports").map(item => {
            const Icon = item.icon;
            return <button key={item.id} onClick={() => { setActive(item.id); setMobileOpen(false); }} className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${active === item.id ? "bg-white text-[#172033]" : "text-white/60 hover:bg-white/10 hover:text-white"}`}>
              <Icon className={`h-[17px] w-[17px] ${active === item.id ? "text-zinc-800" : "text-white/45"}`} />
              <span>{item.label}</span>
            </button>;
          })}
        </nav>
      </div>
      <div className="absolute bottom-0 w-full border-t border-white/10 p-4">
        {installPrompt && (
          <button
            onClick={handleInstall}
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold py-2.5 transition-all"
            title="Instalar aplicativo"
          >
            <Download className="h-3.5 w-3.5 text-emerald-400" />
            <span>Baixar Aplicativo</span>
          </button>
        )}
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-zinc-700 text-sm font-bold text-white">{greeting.slice(0, 1).toUpperCase()}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">{user?.name ?? "Usuário"}</p>
            <p className="truncate text-[11px] text-white/40">{user?.email ?? (user?.role ? `Perfil: ${user.role}` : "")}</p>
          </div>
          {toggleTheme && <button onClick={toggleTheme} className="shrink-0 text-white/35 hover:text-white transition-colors" title="Alternar tema">{theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>}
          <button onClick={() => logout()} className="shrink-0 text-white/35 hover:text-rose-400 transition-colors" title="Sair da conta"><LogOut className="h-4 w-4" /></button>
        </div>
      </div>
    </aside>
    {mobileOpen && <button aria-label="Fechar menu" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-[#101828]/50 backdrop-blur-sm lg:hidden" />}
    {/* Modal de busca rápida */}
    {searchOpen && (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
        <button className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
        <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <Search className="h-4 w-4 text-zinc-400" />
            <input autoFocus className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400" placeholder="Buscar módulo..." onChange={e => {
              const q = e.target.value.toLowerCase();
              const found = visibleModules.find(m => m.label.toLowerCase().includes(q));
              if (found) { setActive(found.id); setSearchOpen(false); }
            }} />
            <button onClick={() => setSearchOpen(false)}><X className="h-4 w-4 text-zinc-400" /></button>
          </div>
          <div className="p-2">{visibleModules.map(m => { const Icon = m.icon; return <button key={m.id} onClick={() => { setActive(m.id); setSearchOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-zinc-50 transition-colors"><Icon className="h-4 w-4 text-zinc-500" /><span>{m.label}</span></button>; })}</div>
        </div>
      </div>
    )}
    {/* Painel de notificações */}
    {notifOpen && (
      <div className="fixed inset-0 z-50 flex justify-end">
        <button className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setNotifOpen(false)} />
        <div className="relative z-10 w-full max-w-sm h-full bg-white dark:bg-zinc-900 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-6 py-5">
            <div>
              <h2 className="text-base font-semibold">Notificações</h2>
              {totalAlerts > 0 && <p className="text-xs text-zinc-400 mt-0.5">{totalAlerts} ite{totalAlerts > 1 ? "ns" : "m"} pendente{totalAlerts > 1 ? "s" : ""}</p>}
            </div>
            <button onClick={() => setNotifOpen(false)} className="rounded-lg p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <X className="h-4 w-4 text-zinc-400" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {notifItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-400">
                <Bell className="h-10 w-10 opacity-20" />
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            ) : notifItems.map((n, i) => {
              const Icon = n.icon;
              return <button key={i} onClick={() => { setNotifOpen(false); setActive(n.tone === "rose" ? "production" : n.tone === "amber" ? "costs" : n.tone === "cyan" ? "stock" : "post-sale"); }} className="flex w-full items-center gap-4 border-b border-zinc-100 dark:border-zinc-800 px-6 py-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors">
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${n.tone === "rose" ? "bg-rose-50 text-rose-500" : n.tone === "amber" ? "bg-amber-50 text-amber-500" : n.tone === "cyan" ? "bg-cyan-50 text-cyan-600" : "bg-emerald-50 text-emerald-600"}`}>
                  <Icon className="h-[18px] w-[18px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{n.title}</p>
                  <p className="truncate text-xs text-zinc-400 mt-0.5">{n.sub}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-300 shrink-0" />
              </button>;
            })}
          </div>
        </div>
      </div>
    )}
    <main className="min-h-screen lg:pl-[264px]">
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[#e5e9f2] dark:border-zinc-800 bg-[#f5f7fb]/90 dark:bg-zinc-950/90 px-5 backdrop-blur-xl sm:px-8">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileOpen(true)} className="rounded-lg border border-[#e5e9f2] dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 lg:hidden"><Menu className="h-5 w-5" /></button>
          <div>
            <p className="text-xs font-medium capitalize text-[#8792a8] dark:text-zinc-400">{todayLabel}</p>
            <h1 className="mt-0.5 text-xl font-semibold tracking-tight dark:text-white">{currentModule?.label}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={() => setSearchOpen(true)} className="hidden items-center gap-2 rounded-xl border border-[#e5e9f2] dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-[#9aa3b5] dark:text-zinc-400 md:flex hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors">
            <Search className="h-4 w-4" /> Pesquisar <span className="ml-6 rounded bg-[#f0f2f7] dark:bg-zinc-800 px-1.5 py-0.5 text-[10px]">⌘ K</span>
          </button>
          <button onClick={() => setNotifOpen(true)} className="relative rounded-xl border border-[#e5e9f2] dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 text-[#64708a] dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-colors">
            <Bell className="h-[18px] w-[18px]" />
            {totalAlerts > 0 && <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-zinc-900">{totalAlerts > 9 ? "9+" : totalAlerts}</span>}
          </button>
          {!isAuthenticated && <Button onClick={() => window.location.href = "/login"} className="hidden gap-2 rounded-xl bg-zinc-800 dark:bg-zinc-100 hover:bg-zinc-900 dark:hover:bg-zinc-200 px-4 shadow-lg shadow-zinc-200 sm:flex"><LogIn className="h-4 w-4" /> Entrar</Button>}
        </div>
      </header>
      <div className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8 sm:py-9"><div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Operação saudável</p><h2 className="text-3xl font-semibold tracking-[-0.04em] sm:text-[34px]">Bom dia, {greeting}.</h2><p className="mt-2 max-w-2xl text-sm text-[#7b879c] dark:text-zinc-400">Aqui está o panorama do seu negócio. Existem <strong className="font-semibold text-[#172033] dark:text-zinc-50">6 pontos</strong> que merecem atenção hoje.</p></div><Button onClick={() => setActive("commercial")} className="w-fit gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 dark:text-white px-4 shadow-xl"><Plus className="h-4 w-4" /> Nova proposta</Button></div>
        {isLoading && active === "dashboard" ? <DashboardSkeleton /> : active === "dashboard" ? <DashboardContent summary={summary} reports={reports} projects={visibleProjects} setActive={setActive} /> : <ModulePlaceholder active={active} onBack={() => setActive("dashboard")} onOpenForm={() => setFormOpen(true)} onOpenChat={() => setChatOpen(true)} />}
      </div>
    </main>

    <RecordFormSheet open={formOpen} onOpenChange={setFormOpen} activeModule={active} />
    <ModuleChat open={chatOpen} onOpenChange={setChatOpen} activeModule={active} moduleName={modules.find(m => m.id === active)?.label ?? "Módulo"} />
  </div>;
}

function DashboardSkeleton() {
  return <><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map(i => <Card key={i} className="rounded-2xl border-0 bg-white dark:bg-zinc-900 shadow-soft"><CardContent className="p-5"><div className="mb-5 flex justify-between"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-8 rounded-xl" /></div><Skeleton className="h-8 w-20" /><Skeleton className="mt-2 h-3 w-32" /></CardContent></Card>)}</section><section className="mt-7 grid gap-6 xl:grid-cols-[1.35fr_1fr]"><Card className="rounded-2xl border-0 bg-white dark:bg-zinc-900 shadow-soft"><CardHeader className="px-6 py-5"><Skeleton className="h-5 w-40" /><Skeleton className="mt-2 h-3 w-48" /></CardHeader><CardContent className="space-y-4 px-6 pb-6">{[1, 2, 3, 4].map(i => <div key={i} className="flex gap-4"><Skeleton className="h-10 w-10 rounded-xl shrink-0" /><div className="space-y-2 flex-1"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-3 w-1/2" /></div></div>)}</CardContent></Card><Card className="rounded-2xl border-0 bg-white dark:bg-zinc-900 shadow-soft"><CardHeader className="px-6 py-5"><Skeleton className="h-5 w-40" /><Skeleton className="mt-2 h-3 w-48" /></CardHeader><CardContent className="px-6 pb-6"><Skeleton className="h-[180px] w-full" /></CardContent></Card></section></>;
}

function DashboardContent({ summary, reports, projects, setActive }: { summary: any; reports: any; projects: typeof demoProjects; setActive: (id: string) => void }) {
  const { theme } = useTheme();
  const metrics = [{ label: "Projetos ativos", value: summary.projects || 12, detail: "+12,4% vs. mês anterior", icon: BriefcaseBusiness, color: "zinc" }, { label: "Ordens em produção", value: summary.orders || 16, detail: "2 exigem atenção", icon: Factory, color: "violet" }, { label: "Valor em carteira", value: money(reports.sold || 18500), detail: "+8,1% no período", icon: CircleDollarSign, color: "emerald" }, { label: "Margem média", value: `${(reports.margin || 44.7).toFixed(1).replace(".", ",")}%`, detail: "Dentro da meta de 40%", icon: TrendingUp, color: "amber" }];
  const alerts = [{ type: "Crítico", title: `${summary.overdueOrders || 2} ordens estão atrasadas`, text: "A OP-0084 ultrapassou o prazo em 1 dia.", action: "Ver ordens", icon: Clock3, tone: "rose" }, { type: "Atenção", title: `${summary.budgetAlerts || 1} projeto pode ultrapassar o orçamento`, text: "O projeto PRJ-024 está 6,2% acima do previsto.", action: "Analisar custos", icon: CircleDollarSign, tone: "amber" }, { type: "Estoque", title: `${summary.stockAlerts || 3} materiais chegaram ao mínimo`, text: "Repor antes do início das próximas ordens.", action: "Repor itens", icon: PackageCheck, tone: "cyan" }, { type: "Cliente", title: `${summary.postSaleToday || 4} clientes entram no pós-venda hoje`, text: "A régua de relacionamento está pronta.", action: "Iniciar contato", icon: UsersRound, tone: "emerald" }];
  return <><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(metric => { const Icon = metric.icon; return <Card key={metric.label} className="group overflow-hidden rounded-2xl border-0 bg-white dark:bg-zinc-900 shadow-[0_8px_28px_rgba(25,45,90,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"><CardContent className="relative p-5"><div className={`absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full opacity-10 transition-transform duration-500 group-hover:scale-110 ${metric.color === "zinc" ? "bg-zinc-800 dark:bg-zinc-100 dark:bg-zinc-800" : metric.color === "violet" ? "bg-violet-500" : metric.color === "emerald" ? "bg-emerald-500" : "bg-amber-500"}`} /><div className="mb-5 flex items-start justify-between"><p className="text-xs font-medium text-[#8792a8] dark:text-zinc-400">{metric.label}</p><div className={`rounded-xl p-2 transition-transform duration-300 group-hover:rotate-6 ${metric.color === "zinc" ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100" : metric.color === "violet" ? "bg-violet-50 text-violet-600" : metric.color === "emerald" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}><Icon className="h-4 w-4" /></div></div><p className="text-[28px] font-semibold tracking-[-0.05em] text-[#172033] dark:text-zinc-50">{metric.value}</p><p className="mt-2 text-[11px] font-medium text-emerald-600">{metric.detail}</p></CardContent></Card> })}</section><section className="mt-7 grid gap-6 xl:grid-cols-[1.35fr_1fr]"><Card className="rounded-2xl border-0 bg-white dark:bg-zinc-900 shadow-[0_8px_28px_rgba(25,45,90,0.05)]"><CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-[#eef1f6] dark:border-zinc-800 px-6 py-5"><div><CardTitle className="text-base font-semibold">Central de atenção</CardTitle><p className="mt-1 text-xs text-[#96a0b2] dark:text-zinc-400">Prioridades que pedem uma ação hoje</p></div><Badge variant="outline" className="rounded-full border-rose-100 bg-rose-50 text-rose-600">6 alertas</Badge></CardHeader><CardContent className="p-0">{alerts.map((alert, index) => { const Icon = alert.icon; return <button onClick={() => setActive(alert.type === "Estoque" ? "stock" : alert.type === "Cliente" ? "post-sale" : alert.type === "Atenção" ? "costs" : "production")} key={alert.type} className="group flex w-full items-center gap-4 border-b border-[#f0f2f6] dark:border-zinc-800 px-6 py-4 text-left last:border-0 hover:bg-[#fbfcfe] dark:bg-zinc-800/50 transition-colors"><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${alert.tone === "rose" ? "bg-rose-50 text-rose-500" : alert.tone === "amber" ? "bg-amber-50 text-amber-500" : alert.tone === "cyan" ? "bg-cyan-50 text-cyan-600" : "bg-emerald-50 text-emerald-600"}`}><Icon className="h-[18px] w-[18px]" /></div><div className="min-w-0 flex-1"><div className="mb-1 flex items-center gap-2"><span className={`text-[10px] font-bold uppercase tracking-wider ${alert.tone === "rose" ? "text-rose-500" : alert.tone === "amber" ? "text-amber-500" : alert.tone === "cyan" ? "text-cyan-600" : "text-emerald-600"}`}>{alert.type}</span><span className="h-1 w-1 rounded-full bg-[#d7dce6]" /><p className="truncate text-sm font-medium text-[#273249] dark:text-zinc-50">{alert.title}</p></div><p className="truncate text-xs text-[#97a1b2] dark:text-zinc-400">{alert.text}</p></div><span className="hidden items-center gap-1 text-xs font-semibold text-zinc-800 dark:text-zinc-100 opacity-0 transition group-hover:opacity-100 sm:flex translate-x-2 group-hover:translate-x-0">{alert.action}<ChevronRight className="h-3.5 w-3.5" /></span></button> })}</CardContent></Card><Card className="rounded-2xl border-0 bg-white dark:bg-zinc-900 shadow-[0_8px_28px_rgba(25,45,90,0.05)] transition-all duration-300 hover:shadow-lg"><CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pb-0 pt-5"><div><CardTitle className="text-base font-semibold">Ritmo de produção</CardTitle><p className="mt-1 text-xs text-[#96a0b2] dark:text-zinc-400">Ordens concluídas nesta semana</p></div><div className="rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-600">+18,6%</div></CardHeader><CardContent className="px-4 pb-5 pt-6"><div className="h-[180px] w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={weekly} barSize={22}><CartesianGrid vertical={false} stroke={theme === 'dark' ? '#27272a' : '#eef1f6'} /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#a1a1aa' : '#9aa3b5', fontSize: 11 }} /><YAxis hide /><Tooltip cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#f6f8fc' }} contentStyle={{ border: "0", borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,.15)", backgroundColor: theme === 'dark' ? '#18181b' : '#ffffff', color: theme === 'dark' ? '#ffffff' : '#172033', fontSize: 12 }} /><Bar dataKey="value" radius={[6, 6, 2, 2]} fill={theme === 'dark' ? '#f4f4f5' : '#27272a'} /></BarChart></ResponsiveContainer></div></CardContent></Card></section><section className="mt-7 grid gap-6 xl:grid-cols-[1.35fr_1fr]"><Card className="rounded-2xl border-0 bg-white dark:bg-zinc-900 shadow-[0_8px_28px_rgba(25,45,90,0.05)] transition-all duration-300 hover:shadow-lg"><CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-[#eef1f6] dark:border-zinc-800 px-6 py-5"><div><CardTitle className="text-base font-semibold">Projetos em andamento</CardTitle><p className="mt-1 text-xs text-[#96a0b2] dark:text-zinc-400">Acompanhe a saúde da sua carteira</p></div><Button variant="ghost" onClick={() => setActive("commercial")} className="gap-1 rounded-lg text-xs font-semibold text-zinc-800 dark:text-zinc-100 transition-transform hover:translate-x-1">Ver todos <ChevronRight className="h-3.5 w-3.5" /></Button></CardHeader><CardContent className="p-0">{projects.map(project => <div key={project.code} className="flex flex-col gap-3 border-b border-[#f0f2f6] dark:border-zinc-800 px-6 py-4 last:border-0 sm:flex-row sm:items-center group hover:bg-[#fbfcfe] dark:bg-zinc-800/50 transition-colors"><div className="flex min-w-0 flex-1 items-center gap-3"><div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${project.tone === "blue" ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100" : project.tone === "violet" ? "bg-violet-50 text-violet-600" : "bg-emerald-50 text-emerald-600"}`}><BriefcaseBusiness className="h-4 w-4" /></div><div className="min-w-0"><div className="flex items-center gap-2"><span className="text-[10px] font-bold text-[#8a95aa]">{project.code}</span><span className="h-1 w-1 rounded-full bg-[#dce1eb]" /><p className="truncate text-sm font-semibold text-[#273249] dark:text-zinc-50">{project.name}</p></div><p className="mt-0.5 truncate text-xs text-[#9aa3b5] dark:text-zinc-400">{project.client}</p></div></div><div className="flex w-full items-center gap-4 sm:w-[240px]"><div className="flex-1"><div className="mb-1.5 flex justify-between text-[10px] font-medium"><span className="text-[#8290a5]">{project.status}</span><span className="text-[#273249] dark:text-zinc-50">{project.progress}%</span></div><Progress value={project.progress} className="h-1.5 bg-[#edf0f6] dark:bg-zinc-800" /></div><div className="hidden text-right sm:block"><p className="text-xs font-semibold text-[#273249] dark:text-zinc-50">{project.value}</p><p className="mt-0.5 text-[10px] text-emerald-600">{project.margin} margem</p></div></div></div>)}</CardContent></Card><Card className="relative overflow-hidden rounded-2xl border-0 bg-[#172033] text-white shadow-[0_8px_28px_rgba(25,45,90,0.14)] transition-all duration-300 hover:shadow-xl"><div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-white dark:bg-zinc-900/5 blur-3xl pointer-events-none" /><CardHeader className="px-6 pb-0 pt-5 relative z-10"><CardTitle className="text-base font-semibold">Distribuição da carteira</CardTitle><p className="mt-1 text-xs text-white/45">Projetos por etapa operacional</p></CardHeader><CardContent className="flex items-center gap-5 px-4 py-5 relative z-10"><div className="h-[180px] w-[180px] shrink-0 transition-transform duration-500 hover:scale-105"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={stageData} dataKey="value" nameKey="name" innerRadius={54} outerRadius={75} paddingAngle={4} stroke="none">{stageData.map(entry => <Cell key={entry.name} fill={entry.color} className="transition-all hover:opacity-80" />)}</Pie><Tooltip contentStyle={{ border: "0", borderRadius: "12px", color: "#172033", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} /></PieChart></ResponsiveContainer></div><div className="min-w-0 flex-1 space-y-3">{stageData.map(item => <div key={item.name} className="group flex items-center justify-between text-xs transition-colors hover:bg-white dark:bg-zinc-900/5 rounded-md p-1 -ml-1"><span className="flex items-center gap-2 text-white/60 group-hover:text-white/80"><span className="h-2 w-2 rounded-full transition-transform group-hover:scale-125" style={{ background: item.color }} />{item.name}</span><strong className="font-semibold text-white">{item.value}%</strong></div>)}<div className="mt-4 border-t border-white/10 pt-3"><p className="text-[11px] leading-relaxed text-white/45">A carteira mantém um equilíbrio saudável entre produção e relacionamento.</p></div></div></CardContent></Card></section></>;
}

function ModulePlaceholder({ active, onBack, onOpenForm, onOpenChat }: { active: string; onBack: () => void; onOpenForm: () => void; onOpenChat: () => void }) {
  const item = modules.find(module => module.id === active) ?? modules[0]; const Icon = item.icon;
  const clientsQuery = trpc.clients.list.useQuery(undefined, { retry: false });
  const proposalsQuery = trpc.proposals.list.useQuery(undefined, { retry: false });
  const productionQuery = trpc.production.list.useQuery(undefined, { retry: false });
  const stockQuery = trpc.stock.list.useQuery(undefined, { retry: false });
  const suppliersQuery = trpc.suppliers.list.useQuery(undefined, { retry: false });
  const postSaleQuery = trpc.postSale.list.useQuery(undefined, { retry: false });
  
  const isLoading = clientsQuery.isLoading || proposalsQuery.isLoading || productionQuery.isLoading || stockQuery.isLoading || suppliersQuery.isLoading || postSaleQuery.isLoading;

  const content: Record<string, { intro: string; stats: [string, string][]; rows: [string, string, string][] }> = {
    commercial: { intro: "Acompanhe propostas, clientes e conversões em um único pipeline.", stats: [["Propostas abertas", "0"], ["Em aprovação", "0"], ["Conversão média", "—"]], rows: [] },
    production: { intro: "Ordens de produção, prazos e checklists sob controle da equipe.", stats: [["Ordens ativas", "0"], ["Em risco", "0"], ["Concluídas no mês", "0"]], rows: [] },
    stock: { intro: "Visibilidade sobre materiais, reservas e requisições críticas.", stats: [["Itens cadastrados", "0"], ["Abaixo do mínimo", "0"], ["Requisições abertas", "0"]], rows: [] },
    suppliers: { intro: "Acompanhe fornecedores, condições e entregas que impactam seus prazos.", stats: [["Fornecedores ativos", "0"], ["Entregas pendentes", "0"], ["Em atraso", "0"]], rows: [] },
    costs: { intro: "Compare o previsto e o realizado para proteger a margem de cada projeto.", stats: [["Custo previsto", "R$ 0"], ["Custo realizado", "R$ 0"], ["Margem projetada", "—"]], rows: [] },
    "post-sale": { intro: "Nunca perca o momento certo de cuidar do relacionamento e gerar recorrência.", stats: [["Contatos hoje", "0"], ["Satisfeitos", "0"], ["Oportunidades", "0"]], rows: [] },
    reports: { intro: "Relatórios gerenciais para transformar operação em decisão.", stats: [["Produtividade", "—"], ["Giro de estoque", "—"], ["Projetos no prazo", "—"]], rows: [] },
  };
  const data = content[active] ?? content.commercial;
  const liveRows: [string, string, string][] = active === "commercial" && proposalsQuery.data?.length ? proposalsQuery.data.slice(0, 8).map(proposal => [proposal.code, proposal.title, proposal.status]) : active === "production" && productionQuery.data?.length ? productionQuery.data.slice(0, 8).map(order => [order.code, order.title, order.status]) : active === "stock" && stockQuery.data?.length ? stockQuery.data.slice(0, 8).map(item => [item.sku, item.name, Number(item.quantity) <= Number(item.minimumQuantity) ? "Repor" : "Disponível"]) : active === "suppliers" && suppliersQuery.data?.length ? suppliersQuery.data.slice(0, 8).map(supplier => [`SUP-${supplier.id}`, supplier.name, supplier.deliveryStatus]) : active === "post-sale" && postSaleQuery.data?.length ? postSaleQuery.data.slice(0, 8).map(entry => [`PS-${entry.id}`, `Projeto #${entry.projectId}`, entry.stage]) : data.rows;
  const exportCsv = () => { const csv = [["Código", "Registro", "Status"], ...liveRows].map(row => row.map(cell => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n"); const blob = new Blob([csv], { type: "text/csv;charset=utf-8" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `${active}-relatorio.csv`; link.click(); URL.revokeObjectURL(url); };
  
  const printPdf = () => { window.print(); };

  if (isLoading) return <ModuleSkeleton label={item.label} onBack={onBack} />;

  return <div className="space-y-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100"><Icon className="h-5 w-5" /></div><div><h2 className="text-2xl font-semibold tracking-tight">{item.label}</h2><p className="mt-1 text-sm text-[#8792a8] dark:text-zinc-400">{data.intro}</p></div></div></div><div className="flex flex-wrap gap-2 print:hidden"><Button variant="outline" onClick={onOpenChat} className="rounded-xl border-zinc-300 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 gap-2"><MessageSquare className="h-4 w-4" /> Chat da equipe</Button><Button variant="outline" onClick={printPdf} className="rounded-xl border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 dark:hover:bg-emerald-900/50 gap-2"><Download className="h-4 w-4" /> Baixar PDF</Button><Button variant="outline" onClick={onBack} className="rounded-xl border-zinc-300 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800">Voltar</Button><Button onClick={onOpenForm} className="gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white"><Plus className="h-4 w-4" /> Novo registro</Button></div></div><div className="grid gap-4 sm:grid-cols-3">{data.stats.map(([label, value]) => <Card key={label} className="rounded-2xl border-0 bg-white dark:bg-zinc-900 shadow-soft"><CardContent className="p-5"><p className="text-xs text-[#8792a8] dark:text-zinc-400">{label}</p><p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p><p className="mt-2 text-[11px] font-medium text-emerald-600">Atualizado agora</p></CardContent></Card>)}</div><Card className="overflow-hidden rounded-2xl border-0 bg-white dark:bg-zinc-900 shadow-soft"><CardHeader className="flex flex-row items-center justify-between border-b border-[#eef1f6] dark:border-zinc-800 px-6 py-5"><div><CardTitle className="text-base">Acompanhamento operacional</CardTitle><p className="mt-1 text-xs text-[#96a0b2] dark:text-zinc-400">Registros mais recentes do módulo</p></div><Button variant="outline" size="sm" onClick={exportCsv} className="hidden rounded-lg sm:flex dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800 print:hidden">Exportar CSV</Button></CardHeader><CardContent className="p-0">{liveRows.length === 0 ? <div className="flex flex-col items-center justify-center py-16 text-zinc-400 dark:text-zinc-600 space-y-2"><FileText className="h-10 w-10 opacity-20" /><p className="text-sm">Nenhum registro encontrado.</p><p className="text-xs">Clique em "Novo registro" para começar.</p></div> : liveRows.map(([code, title, status]) => <div key={code} className="flex items-center gap-4 border-b border-[#f0f2f6] dark:border-zinc-800 px-6 py-4 last:border-0"><div className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100"><FileText className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-wider text-[#97a1b2] dark:text-zinc-400">{code}</p><p className="truncate text-sm font-semibold text-[#273249] dark:text-zinc-50">{title}</p></div><Badge variant="outline" className={`rounded-full border-0 text-[11px] ${status.includes("atras") || status.includes("desvio") || status.includes("Repor") ? "bg-rose-50 text-rose-600" : status.includes("hoje") || status.includes("Pendente") ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>{status}</Badge><ChevronRight className="h-4 w-4 text-[#c1c8d5] print:hidden" /></div>)}</CardContent></Card></div>;
}

function ModuleSkeleton({ label, onBack }: { label: string; onBack: () => void }) {
  return <div className="space-y-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><div className="flex items-center gap-3"><Skeleton className="h-11 w-11 rounded-xl" /><div><h2 className="text-2xl font-semibold tracking-tight">{label}</h2><Skeleton className="mt-2 h-4 w-64" /></div></div></div><div className="flex gap-2"><Button variant="outline" onClick={onBack} className="rounded-xl">Voltar</Button><Skeleton className="h-10 w-32 rounded-xl" /></div></div><div className="grid gap-4 sm:grid-cols-3">{[1, 2, 3].map(i => <Card key={i} className="rounded-2xl border-0 bg-white dark:bg-zinc-900 shadow-soft"><CardContent className="p-5"><Skeleton className="h-3 w-24" /><Skeleton className="mt-3 h-8 w-16" /><Skeleton className="mt-2 h-3 w-20" /></CardContent></Card>)}</div><Card className="overflow-hidden rounded-2xl border-0 bg-white dark:bg-zinc-900 shadow-soft"><CardHeader className="flex flex-row items-center justify-between border-b border-[#eef1f6] dark:border-zinc-800 px-6 py-5"><div><Skeleton className="h-5 w-48" /><Skeleton className="mt-2 h-3 w-64" /></div><Skeleton className="h-8 w-24 rounded-lg hidden sm:block" /></CardHeader><CardContent className="p-0">{[1, 2, 3, 4, 5].map(i => <div key={i} className="flex items-center gap-4 border-b border-[#f0f2f6] dark:border-zinc-800 px-6 py-4 last:border-0"><Skeleton className="h-9 w-9 rounded-xl shrink-0" /><div className="min-w-0 flex-1 space-y-2"><Skeleton className="h-3 w-16" /><Skeleton className="h-4 w-48" /></div><Skeleton className="h-6 w-20 rounded-full" /></div>)}</CardContent></Card></div>;
}

function RecordFormSheet({ open, onOpenChange, activeModule }: { open: boolean; onOpenChange: (open: boolean) => void; activeModule: string }) {
  const [submitting, setSubmitting] = useState(false);
  const item = modules.find(m => m.id === activeModule) ?? modules[0];
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Simula salvamento
    setTimeout(() => {
      setSubmitting(false);
      onOpenChange(false);
      alert("Sucesso! Registro salvo com sucesso.");
    }, 1000);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 p-0 flex flex-col">
        <SheetHeader className="p-6 border-b border-zinc-100 dark:border-zinc-900">
          <SheetTitle className="text-xl flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
            <Plus className="h-5 w-5 text-emerald-500" />
            Novo registro em {item.label}
          </SheetTitle>
          <SheetDescription className="text-zinc-500 dark:text-zinc-400">
            Preencha os dados abaixo para cadastrar um novo item no sistema.
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {activeModule === "commercial" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-zinc-700 dark:text-zinc-300">Título da Proposta</Label>
                  <Input id="title" placeholder="Ex: Modernização de Fachada" required className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client" className="text-zinc-700 dark:text-zinc-300">Cliente</Label>
                  <Input id="client" placeholder="Nome da empresa" required className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value" className="text-zinc-700 dark:text-zinc-300">Valor Estimado (R$)</Label>
                  <Input id="value" type="number" placeholder="0,00" required className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-11" />
                </div>
              </>
            )}
            
            {activeModule === "production" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="order" className="text-zinc-700 dark:text-zinc-300">Descrição da Ordem</Label>
                  <Input id="order" placeholder="O que será produzido?" required className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline" className="text-zinc-700 dark:text-zinc-300">Prazo de Entrega</Label>
                  <Input id="deadline" type="date" required className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-11" />
                </div>
              </>
            )}

            {activeModule !== "commercial" && activeModule !== "production" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-zinc-700 dark:text-zinc-300">Nome do Registro</Label>
                  <Input id="name" placeholder="Digite o nome..." required className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc" className="text-zinc-700 dark:text-zinc-300">Observações</Label>
                  <Textarea id="desc" placeholder="Detalhes adicionais..." className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 min-h-[120px]" />
                </div>
              </>
            )}
          </div>
          
          <div className="p-6 border-t border-zinc-100 dark:border-zinc-900 flex justify-end gap-3 bg-zinc-50 dark:bg-zinc-900/30">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting} className="border-zinc-300 dark:border-zinc-700 h-11 px-6">
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting} className="bg-emerald-500 hover:bg-emerald-600 text-white h-11 px-6">
              {submitting ? "Salvando..." : "Salvar Registro"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

