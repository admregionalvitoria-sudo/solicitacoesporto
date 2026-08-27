// --- Internal Views (requires login) ---

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertCircle,
  Timer,
  Clock,
  MapPin,
  User,
  Monitor,
  Phone,
  Mail,
  MessageSquare,
  ChevronRight,
  PlusCircle,
  FileText,
  Hash,
  Cpu,
  Wrench,
  Brush,
  Briefcase,
  Calendar,
  Link2,
  LogIn,
  Lock,
  Edit,
  ShoppingCart,
  ShieldAlert,
  Info
} from 'lucide-react';
import { Button, Card, Badge, Input, Sidebar } from './ui';
import { cn, STATUS_COLORS, STATUS_LABELS, PRIORITY_COLORS, PRIORITY_LABELS, formatDuration, SLA_MS, formatSLA } from '../lib/utils';
import { Ticket, Priority, Status, Category, Department, Role, UserProfile, Loan, AppModule, AVAILABLE_MODULES, hasModuleAccess } from '../types';
import { AGENDAMENTO_AMBIENTES_URL, PAINEL_AULAS_URL } from '../constants';

// =====================================================================
// HomeView
// =====================================================================
interface HomeViewProps {
  onNavigate: (path: string) => void;
  user?: UserProfile | null;
  onLogout?: () => void;
}

export const HomeView = ({ onNavigate, user, onLogout }: HomeViewProps) => {
  const buttons: Array<{
    id: string;
    route?: string;
    href?: string;
    target?: string;
    label: string;
    icon: any;
    color: string;
  }> = [
    { id: 'ti', route: '/ti', label: 'TI', icon: Cpu, color: 'bg-blue-600' },
    { id: 'limpeza', route: '/limpeza', label: 'Limpeza', icon: Brush, color: 'bg-emerald-600' },
    { id: 'manutencao', route: '/manutencao', label: 'Manutenção', icon: Wrench, color: 'bg-amber-600' },
    { id: 'supervisao', route: '/supervisao', label: 'Supervisão', icon: Briefcase, color: 'bg-violet-600' },
    { id: 'emprestimos', route: '/emprestimos', label: 'Empréstimos', icon: Monitor, color: 'bg-orange-600' },
    { id: 'agendamento', href: AGENDAMENTO_AMBIENTES_URL, target: '_blank', label: 'Agendamento Ambientes', icon: Calendar, color: 'bg-slate-700' },
    { id: 'painel', href: PAINEL_AULAS_URL, target: '_blank', label: 'Painel de Aulas', icon: Briefcase, color: 'bg-indigo-600' },
    { id: 'acompanhamento', route: '/acompanhamento', label: 'Acompanhamento de Chamados', icon: Search, color: 'bg-teal-600' },
    { id: 'links-uteis', route: '/links-uteis', label: 'Links Úteis', icon: Link2, color: 'bg-rose-600' },
  ];

  const cardClass = "group relative bg-white p-4 sm:p-5 lg:p-4 lg:px-1 xl:px-4 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-500 hover:-translate-y-1 transition-all flex flex-col items-center justify-center gap-4 text-center overflow-hidden h-full w-full cursor-pointer";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl" />
      </div>

      {/* Se o usuário estiver conectado, exibir banner de acesso rápido no topo */}
      {user && (
        <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 flex items-center gap-2 bg-white/90 backdrop-blur-md border border-slate-200/80 px-4 py-2 rounded-2xl shadow-lg">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div className="text-left hidden sm:block">
            <p className="text-xs font-bold text-slate-800 leading-tight">{user.name}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{user.role}</p>
          </div>
          <Button
            onClick={() => onNavigate('/dashboard')}
            className="text-xs py-1.5 px-3 bg-blue-600 hover:bg-blue-700 font-bold ml-1 rounded-xl"
          >
            Meu Painel
          </Button>
          {onLogout && (
            <Button
              onClick={onLogout}
              variant="ghost"
              className="text-xs py-1.5 px-2.5 text-slate-500 hover:text-red-600 rounded-xl"
            >
              Sair
            </Button>
          )}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl w-full text-center space-y-12 relative z-10"
      >
        <div className="space-y-8">
          <div className="flex items-center justify-center">
            <img
              src="https://lh3.googleusercontent.com/d/1x_2FRXCBA5T2PDG7JjDx6me8RboCVaj0"
              alt="Logo 2"
              className="h-16 md:h-24 object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Solicitações Porto</h1>
            <p className="text-slate-500 text-lg font-medium">Selecione o serviço desejado para iniciar sua solicitação</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 xl:gap-6 max-w-4xl mx-auto">
          {buttons.map((btn) => {
            const content = (
              <>
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110", btn.color)}>
                  <btn.icon className="w-7 h-7" />
                </div>
                <span className={cn(
                  "font-bold text-slate-700 uppercase text-center w-full block break-normal leading-tight whitespace-normal",
                  btn.label.length > 12
                    ? "text-[9px] sm:text-[10px] md:text-[9px] xl:text-[10px] tracking-tighter"
                    : btn.label.length > 8
                      ? "text-[10px] sm:text-[11px] md:text-[10px] xl:text-xs tracking-tight"
                      : "text-xs tracking-wider"
                )}>
                  {btn.label}
                </span>
              </>
            );

            if (btn.href) {
              return (
                <a
                  key={btn.id}
                  href={btn.href}
                  target={btn.target || "_blank"}
                  rel="noopener noreferrer"
                  className={cardClass}
                >
                  {content}
                </a>
              );
            }

            return (
              <button key={btn.id} onClick={() => onNavigate(btn.route!)} className={cardClass}>
                {content}
              </button>
            );
          })}
        </div>

        {/* Botão de Acesso ao Sistema Interno */}
        <div className="pt-8 border-t border-slate-200 flex justify-center">
          {user ? (
            <Button
              onClick={() => onNavigate('/dashboard')}
              variant="secondary"
              className="h-12 border-blue-200 text-blue-700 bg-blue-50/80 hover:bg-blue-100 rounded-xl px-6 font-bold shadow-sm"
            >
              <Briefcase className="w-5 h-5" />
              Acessar Painel Interno ({user.name})
            </Button>
          ) : (
            <Button
              onClick={() => onNavigate('/login')}
              variant="ghost"
              className="h-12 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl px-6"
            >
              <LogIn className="w-5 h-5" />
              Entrar no Sistema Interno
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// =====================================================================
// LoginView
// =====================================================================
interface LoginViewProps {
  setView: (view: any) => void;
  handleLogin: (e: React.FormEvent<HTMLFormElement>) => void;
}

export const LoginView = ({ setView, handleLogin }: LoginViewProps) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
    <Card className="max-w-md w-full p-8 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900">Acesso Restrito</h2>
        <p className="text-slate-500">Entre com suas credenciais de técnico ou admin.</p>
      </div>
      <form onSubmit={handleLogin} className="space-y-6">
        <Input label="Usuário / Email" name="email" required />
        <Input label="Senha" name="password" type="password" required />
        <Button type="submit" className="w-full h-12">Entrar</Button>
        <Button type="button" variant="ghost" onClick={() => setView('home')} className="w-full">Voltar</Button>
      </form>
    </Card>
  </div>
);

// =====================================================================
// TicketSuccessView
// =====================================================================
interface TicketSuccessViewProps {
  createdTicketId: string | null;
  selectedUnit: string;
  selectedCategory: Category | null;
  setView: (view: any) => void;
  setSelectedCategory: (cat: Category | null) => void;
  setCreatedTicketId: (id: string | null) => void;
}

export const TicketSuccessView = ({
  createdTicketId,
  selectedUnit,
  selectedCategory,
  setView,
  setSelectedCategory,
  setCreatedTicketId,
}: TicketSuccessViewProps) => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md w-full bg-white p-10 rounded-3xl shadow-xl border border-slate-100 space-y-8"
    >
      <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div className="space-y-4">
        <h2 className="text-3xl font-bold text-slate-900">Solicitação Enviada!</h2>
        {createdTicketId && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
            <p className="text-sm text-blue-600 font-medium mb-1">Número do seu chamado</p>
            <p className="text-3xl font-black text-blue-700">#{createdTicketId}</p>
            <p className="text-xs text-blue-500 mt-2">Guarde este número para acompanhar sua solicitação</p>
          </div>
        )}
        <div className="flex justify-center gap-2">
          <Badge className="bg-blue-50 text-blue-600 border-blue-100">{selectedUnit}</Badge>
          <Badge className="bg-slate-50 text-slate-600 border-slate-100">{selectedCategory}</Badge>
        </div>
        <div className="space-y-2 text-slate-600">
          <p className="font-medium">Tempo de reposta para a solicitação é de 2h.</p>
          <p className="text-sm">Para resolução do Problema o tempo é de 24 a 48 hrs a depender da complexidade.</p>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          onClick={() => setView('ticket-tracking')}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all"
        >
          Acompanhar Chamado
        </Button>
        <Button
          onClick={() => {
            setSelectedCategory(null);
            setCreatedTicketId(null);
            setView('home');
          }}
          variant="outline"
          className="w-full h-12 rounded-xl font-bold transition-all"
        >
          Sair
        </Button>
      </div>
    </motion.div>
  </div>
);

// =====================================================================
// DashboardView
// =====================================================================
interface DashboardViewProps {
  view: string;
  setView: (view: any) => void;
  user: UserProfile | null;
  token: string | null;
  tickets: Ticket[];
  selectedUnit: string;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterPriority: Priority | 'all';
  setFilterPriority: (p: Priority | 'all') => void;
  filterStatus: Status | 'all';
  setFilterStatus: (s: Status | 'all') => void;
  filterCategory: Category | 'all';
  setFilterCategory: (c: Category | 'all') => void;
  calculateActiveTime: (ticket: Ticket) => number;
  handleTicketClick: (ticket: Ticket) => void;
  setShowPasswordModal: (show: boolean) => void;
  handleLogout: () => void;
}

export const DashboardView = ({
  view,
  setView,
  user,
  tickets,
  selectedUnit,
  searchTerm,
  setSearchTerm,
  filterPriority,
  setFilterPriority,
  filterStatus,
  setFilterStatus,
  filterCategory,
  setFilterCategory,
  calculateActiveTime,
  handleTicketClick,
  setShowPasswordModal,
  handleLogout,
}: DashboardViewProps) => {
  const filteredTickets = tickets.filter(t => {
    const matchesSearch =
      (t.equipment?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (t.reason?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (t.requester_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (t.numeric_id?.toString() || t.id?.toString() || '').includes(searchTerm);

    const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;
    const matchesStatus = filterStatus === 'all' ? t.status !== 'concluido' : t.status === filterStatus;
    const matchesUnit = t.unit === selectedUnit;

    const matchesCategory =
      filterCategory === 'all'
        ? (user?.role === 'admin' || user?.role === 'gestor'
            ? true
            : user?.departments?.includes(t.category as any))
        : t.category === filterCategory;

    return matchesSearch && matchesPriority && matchesStatus && matchesUnit && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar
        view={view}
        setView={setView}
        user={user}
        setShowPasswordModal={setShowPasswordModal}
        handleLogout={handleLogout}
      />

      <main className="flex-1 p-6 md:p-10 overflow-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Fila de Chamados - {selectedUnit}</h1>
            <p className="text-slate-500">Gerencie as solicitações em aberto e pendentes.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-2 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                placeholder="Buscar chamado..."
                className="outline-none text-sm bg-transparent w-full md:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex bg-white p-1 rounded-2xl border border-slate-200 overflow-x-auto">
            {user?.role === 'admin' || user?.role === 'gestor' ? (
              (['all', 'TI', 'Manutenção', 'Limpeza', 'Supervisão'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat as any)}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                    filterCategory === cat
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  {cat === 'all' ? 'Todos' : cat}
                </button>
              ))
            ) : (
              <div className="flex gap-1">
                {user?.departments?.map(dept => (
                  <button
                    key={dept}
                    onClick={() => setFilterCategory(dept as any)}
                    className={cn(
                      "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                      filterCategory === dept
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    )}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as any)}
            >
              <option value="all">Todas Prioridades</option>
              <option value="baixo">Baixo</option>
              <option value="medio">Médio</option>
              <option value="urgente">Urgente</option>
            </select>
            <select
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
            >
              <option value="all">Ativos (Não Concluídos)</option>
              <option value="aberto">Abertos</option>
              <option value="pendente">Pendentes</option>
              <option value="em_atendimento">Em Atendimento</option>
              <option value="concluido">Concluídos</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {filteredTickets.map((ticket) => {
              const activeTime = calculateActiveTime(ticket);
              const isOverdue = activeTime > SLA_MS && ticket.status !== 'concluido';

              return (
                <motion.div
                  key={ticket.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card
                    className={cn(
                      "hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group border-slate-200",
                      isOverdue && "bg-red-50 border-red-300 ring-1 ring-red-200"
                    )}
                    onClick={() => handleTicketClick(ticket)}
                  >
                    <div className="p-5 flex flex-col md:flex-row md:items-center gap-6">
                      <div className="flex items-center gap-4 min-w-[120px]">
                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center font-bold text-slate-600 border border-slate-100">
                          #{ticket.numeric_id || String(ticket.id).substring(0, 4)}
                        </div>
                        <div className={cn("w-3 h-3 rounded-full", STATUS_COLORS[ticket.status])} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-bold text-slate-900 truncate text-lg">{ticket.equipment || ticket.reason?.substring(0, 30)}</h3>
                          <Badge className={cn("border", PRIORITY_COLORS[ticket.priority])}>
                            {PRIORITY_LABELS[ticket.priority]}
                          </Badge>
                          <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-[10px] h-5">
                            {ticket.category || 'TI'}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-y-2 gap-x-4">
                          <span className="flex items-center gap-1.5 text-sm text-slate-500">
                            <User className="w-3.5 h-3.5" /> {ticket.requester_name}
                          </span>
                          <span className="flex items-center gap-1.5 text-sm text-slate-500">
                            <MapPin className="w-3.5 h-3.5" /> {ticket.location}
                          </span>
                          <span className="flex items-center gap-1.5 text-sm text-slate-500">
                            <Clock className="w-3.5 h-3.5" /> {new Date(ticket.created_at).toLocaleDateString()}
                          </span>
                          <span className={cn("flex items-center gap-1.5 text-sm font-bold", isOverdue ? "text-red-600" : "text-blue-600")}>
                            <Timer className="w-3.5 h-3.5" /> {formatSLA(activeTime)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</p>
                          <p className={cn("font-bold",
                            ticket.status === 'aberto' ? 'text-emerald-600' :
                            ticket.status === 'pendente' ? 'text-amber-600' :
                            'text-blue-600'
                          )}>
                            {STATUS_LABELS[ticket.status]}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredTickets.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <CheckCircle2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-400">Tudo limpo por aqui!</h3>
              <p className="text-slate-400">Não há chamados pendentes no momento.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

// =====================================================================
// TicketDetailView
// =====================================================================
interface TicketDetailViewProps {
  selectedTicket: Ticket | null;
  token: string | null;
  setView: (view: any) => void;
  calculateActiveTime: (ticket: Ticket) => number;
  updateStatus: (id: string, status: Status) => void;
  updatePriority: (id: string, priority: Priority) => void;
  assignToMe: (id: string) => void;
  addComment: (e: React.FormEvent<HTMLFormElement>) => void;
}

export const TicketDetailView = ({
  selectedTicket,
  token,
  setView,
  calculateActiveTime,
  updateStatus,
  updatePriority,
  assignToMe,
  addComment,
}: TicketDetailViewProps) => {
  if (!selectedTicket) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <main className="flex-1 p-6 md:p-10 max-w-5xl mx-auto">
        <Button variant="ghost" onClick={() => setView('dashboard')} className="mb-6">
          <ArrowLeft className="w-4 h-4" /> Voltar para Fila
        </Button>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Card className="p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold text-xl">
                    #{selectedTicket.numeric_id || String(selectedTicket.id).substring(0, 4)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{selectedTicket.equipment}</h2>
                    <div className="flex items-center gap-2">
                      <p className="text-slate-500">{selectedTicket.unit} - {selectedTicket.location}</p>
                      <span className="text-slate-300">•</span>
                      <Badge className={cn("border", PRIORITY_COLORS[selectedTicket.priority])}>
                        {PRIORITY_LABELS[selectedTicket.priority]}
                      </Badge>
                      <Badge className="bg-slate-100 text-slate-600 border-slate-200">
                        {selectedTicket.category || 'TI'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Badge className={cn("text-white px-4 py-1.5 text-xs", STATUS_COLORS[selectedTicket.status])}>
                  {STATUS_LABELS[selectedTicket.status]}
                </Badge>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {['Limpeza', 'Supervisão'].includes(selectedTicket.category!) ? 'Motivo da Solicitação' : 'Descrição do Problema'}
                  </h4>
                  <p className="text-slate-700 leading-relaxed">
                    {['Limpeza', 'Supervisão'].includes(selectedTicket.category!) ? selectedTicket.reason : selectedTicket.description}
                  </p>
                </div>

                {selectedTicket.urgent_explanation && (
                  <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                    <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> Explicação da Urgência
                    </h4>
                    <p className="text-red-700 leading-relaxed italic">{selectedTicket.urgent_explanation}</p>
                  </div>
                )}

                {selectedTicket.evidenceUrls && selectedTicket.evidenceUrls.length > 0 && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Evidências Anexadas</h4>
                    <div className="flex flex-wrap gap-4">
                      {selectedTicket.evidenceUrls.map((url, index) => {
                        const proxyUrl = `/api/files?url=${encodeURIComponent(url)}&token=${token}`;
                        return (
                          <a
                            key={index}
                            href={proxyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium text-blue-600"
                          >
                            <FileText className="w-4 h-4" />
                            Anexo {index + 1}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border border-slate-100 rounded-2xl">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Solicitante</h4>
                    <div className="space-y-1">
                      <p className="font-bold text-slate-900 flex items-center gap-2"><User className="w-4 h-4 text-slate-400" /> {selectedTicket.requester_name}</p>
                      {selectedTicket.registration && (
                        <p className="text-sm text-slate-500 flex items-center gap-2"><Hash className="w-4 h-4 text-slate-400" /> Matrícula: {selectedTicket.registration}</p>
                      )}
                      {selectedTicket.email && (
                        <p className="text-sm text-slate-500 flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" /> {selectedTicket.email}</p>
                      )}
                      <p className="text-sm text-slate-500 flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /> {selectedTicket.phone}</p>
                    </div>
                  </div>
                  <div className="p-4 border border-slate-100 rounded-2xl">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Atendimento</h4>
                    <div className="space-y-1">
                      <p className="font-bold text-slate-900 flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-slate-400" />
                        {selectedTicket.technician_name || 'Não atribuído'}
                      </p>
                      <p className="text-sm text-slate-500 flex items-center gap-2">
                        <Timer className="w-4 h-4 text-slate-400" />
                        Tempo: {formatDuration(selectedTicket.total_time_ms)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Comments Section */}
            <Card className="p-8 space-y-6">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-500" /> Histórico e Comentários
              </h3>
              <div className="space-y-4 max-h-[400px] overflow-auto pr-2">
                {selectedTicket.comments?.map((comment) => (
                  <div key={comment.id} className={cn(
                    "p-4 rounded-2xl",
                    comment.author_role === 'admin' ? "bg-blue-50 border border-blue-100 ml-8" : "bg-slate-50 border border-slate-100 mr-8"
                  )}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-slate-900">{comment.author_name}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(comment.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-slate-700">{comment.message}</p>
                  </div>
                ))}
                {(!selectedTicket.comments || selectedTicket.comments.length === 0) && (
                  <p className="text-center py-10 text-slate-400 italic">Nenhum comentário ainda.</p>
                )}
              </div>
              <form onSubmit={addComment} className="flex gap-2 pt-4 border-t border-slate-100">
                <input
                  name="message"
                  required
                  placeholder="Escreva um comentário ou atualização..."
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none transition-all"
                />
                <Button type="submit">Enviar</Button>
              </form>
            </Card>
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-6">
            <Card className="p-6 space-y-6">
              <h3 className="font-bold text-slate-900 uppercase text-xs tracking-widest">Ações Rápidas</h3>
              <div className="space-y-3">
                {!selectedTicket.assigned_technician_id ? (
                  <Button onClick={() => assignToMe(selectedTicket.id)} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100">
                    <CheckCircle2 className="w-5 h-5" /> Assumir este Chamado
                  </Button>
                ) : (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
                    <User className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-xs font-bold text-blue-400 uppercase">Atribuído a</p>
                      <p className="font-bold text-blue-900">{selectedTicket.technician_name}</p>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prioridade</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['baixo', 'medio', 'urgente'] as Priority[]).map(p => (
                      <button
                        key={p}
                        onClick={() => updatePriority(selectedTicket.id, p)}
                        className={cn(
                          "px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-all",
                          selectedTicket.priority === p ? PRIORITY_COLORS[p] : "bg-white text-slate-400 border-slate-100"
                        )}
                      >
                        {PRIORITY_LABELS[p]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alterar Status</p>
                  <div className="grid gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => updateStatus(selectedTicket.id, 'em_atendimento')}
                      className={cn("justify-start", selectedTicket.status === 'em_atendimento' && "bg-blue-50 border-blue-200 text-blue-600")}
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-500" /> Em Atendimento
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => updateStatus(selectedTicket.id, 'pendente')}
                      className={cn("justify-start", selectedTicket.status === 'pendente' && "bg-amber-50 border-amber-200 text-amber-600")}
                    >
                      <div className="w-2 h-2 rounded-full bg-amber-500" /> Pendente
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => updateStatus(selectedTicket.id, 'concluido')}
                      className="justify-start hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"
                    >
                      <div className="w-2 h-2 rounded-full bg-emerald-500" /> Concluir Chamado
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            <Card className={cn(
              "p-6 text-white transition-colors duration-500",
              calculateActiveTime(selectedTicket) > SLA_MS ? "bg-red-600" : "bg-blue-600"
            )}>
              <div className="flex items-center gap-3 mb-4">
                <Timer className="w-6 h-6" />
                <h3 className="font-bold text-lg">Tempo de SLA</h3>
              </div>
              <p className="text-3xl font-black tracking-tighter mb-1">
                {formatSLA(calculateActiveTime(selectedTicket))}
              </p>
              <p className={cn(
                "text-xs font-medium",
                calculateActiveTime(selectedTicket) > SLA_MS ? "text-red-100" : "text-blue-200"
              )}>
                {calculateActiveTime(selectedTicket) > SLA_MS ? "SLA Excedido" : "Tempo restante para atendimento"}
              </p>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

// =====================================================================
// UsersView
// =====================================================================
interface UsersViewProps {
  view: string;
  setView: (view: any) => void;
  user: UserProfile | null;
  token: string | null;
  usersList: UserProfile[];
  showAddUsersForm: boolean;
  setShowAddUsersForm: (show: boolean) => void;
  handleAddUser: (e: React.FormEvent<HTMLFormElement>) => void;
  deleteUser: (id: string) => void;
  showMessage: (type: 'success' | 'error', text: string) => void;
  setShowPasswordModal: (show: boolean) => void;
  handleLogout: () => void;
}

function getDefaultModulesForRole(role: Role): AppModule[] {
  switch (role) {
    case 'supervisor':
      return ['compras_solicitar', 'supervisao', 'chamados'];
    case 'comprador':
      return ['compras_atender'];
    case 'admin':
      return ['chamados', 'compras_solicitar', 'compras_atender', 'emprestimos', 'supervisao', 'agendamento', 'painel_aulas', 'users'];
    case 'gestor':
      return ['chamados', 'compras_solicitar', 'compras_atender', 'emprestimos', 'supervisao', 'agendamento', 'painel_aulas'];
    case 'tecnico':
    case 'assistente':
    case 'estagiario':
    case 'analista':
    default:
      return ['chamados', 'emprestimos', 'agendamento'];
  }
}

export const UsersView = ({
  view,
  setView,
  user,
  token,
  usersList,
  showAddUsersForm,
  setShowAddUsersForm,
  handleAddUser,
  deleteUser,
  showMessage,
  setShowPasswordModal,
  handleLogout,
}: UsersViewProps) => {
  const [resetUser, setResetUser] = React.useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [resetLoading, setResetLoading] = React.useState(false);

  // Edit user state
  const [editUser, setEditUser] = React.useState<UserProfile | null>(null);
  const [editForm, setEditForm] = React.useState({
    name: '',
    email: '',
    role: 'tecnico' as Role,
    unit: 'PORTO',
    departments: [] as Department[],
    allowed_modules: [] as AppModule[],
    password: ''
  });
  const [editLoading, setEditLoading] = React.useState(false);

  // Create user state
  const [createRole, setCreateRole] = React.useState<Role>('tecnico');
  const [createDepartments, setCreateDepartments] = React.useState<Department[]>([]);
  const [createAllowedModules, setCreateAllowedModules] = React.useState<AppModule[]>(['chamados', 'emprestimos', 'agendamento']);

  const handleCreateRoleChange = (newRole: Role) => {
    setCreateRole(newRole);
    if (newRole === 'supervisor' || newRole === 'comprador') {
      if (!createDepartments.includes('Compras')) {
        setCreateDepartments([...createDepartments, 'Compras']);
      }
    }
    setCreateAllowedModules(getDefaultModulesForRole(newRole));
  };

  const toggleCreateDepartment = (dept: Department) => {
    if (createDepartments.includes(dept)) {
      setCreateDepartments(createDepartments.filter(d => d !== dept));
    } else {
      setCreateDepartments([...createDepartments, dept]);
    }
  };

  const toggleCreateModule = (modId: AppModule) => {
    if (createAllowedModules.includes(modId)) {
      setCreateAllowedModules(createAllowedModules.filter(m => m !== modId));
    } else {
      setCreateAllowedModules([...createAllowedModules, modId]);
    }
  };

  const openEditModal = (u: UserProfile) => {
    setEditUser(u);
    const userModules = (u.allowed_modules && u.allowed_modules.length > 0)
      ? u.allowed_modules
      : getDefaultModulesForRole(u.role);

    setEditForm({
      name: u.name,
      email: u.email,
      role: u.role,
      unit: u.unit || 'PORTO',
      departments: u.departments || [],
      allowed_modules: userModules,
      password: ''
    });
  };

  const handleEditRoleChange = (newRole: Role) => {
    setEditForm(prev => {
      let updatedDepts = [...prev.departments];
      if (newRole === 'supervisor' || newRole === 'comprador') {
        if (!updatedDepts.includes('Compras')) {
          updatedDepts.push('Compras');
        }
      }
      return { 
        ...prev, 
        role: newRole, 
        departments: updatedDepts,
        allowed_modules: getDefaultModulesForRole(newRole)
      };
    });
  };

  const toggleEditDepartment = (dept: Department) => {
    setEditForm(prev => {
      const exists = prev.departments.includes(dept);
      return {
        ...prev,
        departments: exists ? prev.departments.filter(d => d !== dept) : [...prev.departments, dept]
      };
    });
  };

  const toggleEditModule = (modId: AppModule) => {
    setEditForm(prev => {
      const exists = prev.allowed_modules.includes(modId);
      return {
        ...prev,
        allowed_modules: exists 
          ? prev.allowed_modules.filter(m => m !== modId) 
          : [...prev.allowed_modules, modId]
      };
    });
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setEditLoading(true);
    try {
      const payload: any = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        unit: editForm.unit,
        departments: editForm.departments,
        allowed_modules: editForm.allowed_modules
      };
      if (editForm.password && editForm.password.length >= 4) {
        payload.password = editForm.password;
      }

      const res = await fetch(`/api/users/${editUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        showMessage('success', 'Usuário e permissões de abas atualizados com sucesso!');
        setEditUser(null);
        window.location.reload();
      } else {
        showMessage('error', data.error || 'Erro ao atualizar usuário');
      }
    } catch {
      showMessage('error', 'Erro ao conectar ao servidor');
    } finally {
      setEditLoading(false);
    }
  };

  const handleAdminResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser) return;
    if (newPassword.length < 4) {
      showMessage('error', 'A senha deve ter pelo menos 4 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      showMessage('error', 'As senhas não coincidem');
      return;
    }

    setResetLoading(true);
    try {
      const res = await fetch(`/api/users/${resetUser.id}/reset-password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword })
      });

      const data = await res.json();
      if (res.ok) {
        showMessage('success', data.message || `Senha de ${resetUser.name} redefinida com sucesso!`);
        setResetUser(null);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showMessage('error', data.error || 'Erro ao redefinir senha');
      }
    } catch {
      showMessage('error', 'Erro ao conectar ao servidor');
    } finally {
      setResetLoading(false);
    }
  };

  const allDepartments: Department[] = ['TI', 'Manutenção', 'Limpeza', 'Supervisão', 'Compras'];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar
        view={view}
        setView={setView}
        user={user}
        setShowPasswordModal={setShowPasswordModal}
        handleLogout={handleLogout}
      />

      <main className="flex-1 p-6 md:p-10 overflow-auto">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gestão de Usuários & Perfis</h1>
            <p className="text-slate-500">Cadastre usuários, defina perfis (Supervisor, Comprador, Técnico) e configure o acesso a cada aba do sistema.</p>
          </div>
          <Button onClick={() => {
            setCreateRole('tecnico');
            setCreateDepartments([]);
            setCreateAllowedModules(['chamados', 'emprestimos', 'agendamento']);
            setShowAddUsersForm(true);
          }} className="bg-blue-600 hover:bg-blue-700 text-white font-bold"><PlusCircle className="w-4 h-4" /> Novo Usuário</Button>
        </header>

        <div className="grid gap-4">
          {Array.isArray(usersList) && usersList.map(u => {
            const userEffectiveModules = (u.allowed_modules && u.allowed_modules.length > 0)
              ? u.allowed_modules
              : getDefaultModulesForRole(u.role);

            return (
              <Card key={u.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center font-black text-lg shrink-0">
                    {u.name ? u.name[0].toUpperCase() : '?'}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-slate-900 text-base">{u.name}</p>
                      <Badge className={
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700 font-bold' : 
                        u.role === 'comprador' ? 'bg-green-100 text-green-700 font-bold' : 
                        u.role === 'supervisor' ? 'bg-indigo-100 text-indigo-700 font-bold' : 
                        'bg-blue-100 text-blue-700 font-bold'
                      }>
                        {u.role}
                      </Badge>
                      {u.unit && <Badge className="bg-slate-100 text-slate-700">{u.unit}</Badge>}
                    </div>
                    <p className="text-sm text-slate-500 font-medium">{u.email}</p>

                    {/* Setores */}
                    {u.departments && u.departments.length > 0 && (
                      <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                        <span className="text-xs font-semibold text-slate-400">Setores:</span>
                        {u.departments.map(d => (
                          <span key={d} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold uppercase border border-slate-200">
                            {d}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Abas e Módulos com Acesso */}
                    <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-slate-400">Abas Liberadas:</span>
                      {AVAILABLE_MODULES.map(m => {
                        const hasAccess = userEffectiveModules.includes(m.id);
                        if (!hasAccess && u.role !== 'admin') return null;
                        return (
                          <span 
                            key={m.id} 
                            className={cn(
                              "text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-1 border",
                              m.id === 'compras_solicitar' ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                              m.id === 'compras_atender' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              m.id === 'compras' ? "bg-green-50 text-green-700 border-green-200" :
                              m.id === 'supervisao' ? "bg-purple-50 text-purple-700 border-purple-200" :
                              m.id === 'emprestimos' ? "bg-orange-50 text-orange-700 border-orange-200" :
                              m.id === 'users' ? "bg-red-50 text-red-700 border-red-200" :
                              "bg-blue-50 text-blue-700 border-blue-200"
                            )}
                          >
                            {m.id === 'compras_solicitar' ? 'Compras (Solicitante)' :
                             m.id === 'compras_atender' ? 'Compras (Comprador/Aprovação)' :
                             m.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 flex-wrap self-end lg:self-center">
                  {user?.role === 'admin' && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => openEditModal(u)}
                        className="text-blue-700 border-blue-200 hover:bg-blue-50 text-xs px-3.5 py-2 h-auto font-bold flex items-center gap-1.5 rounded-xl shadow-none"
                      >
                        <Edit className="w-3.5 h-3.5" /> Editar Abas & Perfil
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setResetUser(u);
                          setNewPassword('');
                          setConfirmPassword('');
                        }}
                        className="text-amber-700 border-amber-200 hover:bg-amber-50 hover:text-amber-800 text-xs px-3.5 py-2 h-auto font-bold flex items-center gap-1.5 rounded-xl shadow-none"
                      >
                        <Lock className="w-3.5 h-3.5" /> Redefinir Senha
                      </Button>
                    </>
                  )}

                  {u.email !== 'admin' && (
                    <Button variant="ghost" onClick={() => deleteUser(u.id)} className="text-red-500 hover:bg-red-50 text-xs px-3 py-2 h-auto rounded-xl">
                      Excluir
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Modal Editar Usuário e Permissões de Abas */}
        <AnimatePresence>
          {editUser && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-xl w-full my-8"
              >
                <Card className="p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl">
                  <div className="flex items-center gap-3 text-slate-900 border-b border-slate-100 pb-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                      <Edit className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">Editar Usuário & Permissões</h3>
                      <p className="text-sm text-slate-500 font-medium">{editUser.name} ({editUser.email})</p>
                    </div>
                  </div>

                  <form onSubmit={handleSaveEditUser} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700 ml-1">Nome Completo</label>
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700 ml-1">Email / Usuário</label>
                        <Input
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700 ml-1">Nova Senha (opcional)</label>
                      <Input
                        type="password"
                        placeholder="Deixe em branco para manter a senha atual"
                        value={editForm.password}
                        onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700 ml-1">Perfil de Acesso</label>
                        <select
                          value={editForm.role}
                          onChange={(e) => handleEditRoleChange(e.target.value as Role)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none font-semibold text-slate-800 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                        >
                          <option value="supervisor">Supervisor (Solicita Compras)</option>
                          <option value="comprador">Comprador (Atende Pedidos de Compra)</option>
                          <option value="tecnico">Técnico (Atendimento de Chamados)</option>
                          <option value="gestor">Gestor / Coordenador</option>
                          <option value="admin">Administrador Geral</option>
                          <option value="assistente">Assistente</option>
                          <option value="estagiario">Estagiário</option>
                          <option value="analista">Analista</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700 ml-1">Unidade</label>
                        <select
                          value={editForm.unit}
                          onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none font-semibold text-slate-800 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                        >
                          <option value="PORTO">Porto</option>
                        </select>
                      </div>
                    </div>

                    {/* Setores */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Setores Vinculados</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {allDepartments.map(dept => (
                          <label key={dept} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                            <input
                              type="checkbox"
                              checked={editForm.departments.includes(dept)}
                              onChange={() => toggleEditDepartment(dept)}
                              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-xs font-bold text-slate-800">{dept}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Abas e Módulos de Visualização e Acesso */}
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-slate-800 ml-1">
                          Abas e Módulos Liberados no Painel
                        </label>
                        <span className="text-xs text-blue-600 font-semibold">Controle detalhado de acessos</span>
                      </div>

                      {/* Banner de Segregação de Funções */}
                      <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
                        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-bold text-amber-950">
                            Regra de Segregação de Funções (Compliance)
                          </p>
                          <p className="text-amber-800 text-[11px] leading-relaxed">
                            A pessoa que <strong>solicita a compra</strong> (Supervisor / Solicitante) <strong>não pode ser a mesma</strong> que atende o pedido, cota Fluig e aprova (Comprador). O solicitante apenas cria e acompanha o histórico.
                          </p>
                        </div>
                      </div>

                      {/* Alerta de Conflito caso ambos sejam marcados */}
                      {editForm.allowed_modules.includes('compras_solicitar') && editForm.allowed_modules.includes('compras_atender') && editForm.role !== 'admin' && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs text-rose-800 font-semibold">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>Atenção: Este usuário está com permissão tanto para <strong>Solicitar</strong> quanto para <strong>Atender/Aprovar Compras</strong>. Recomendamos separar essas funções.</span>
                        </div>
                      )}

                      <div className="grid gap-2.5">
                        {AVAILABLE_MODULES.map(m => {
                          const checked = editForm.allowed_modules.includes(m.id);
                          return (
                            <label 
                              key={m.id} 
                              className={cn(
                                "flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer",
                                checked ? "bg-blue-50/80 border-blue-300 shadow-sm" : "bg-white border-slate-200 hover:bg-slate-50",
                                m.id === 'compras_solicitar' && checked && "bg-indigo-50/80 border-indigo-300",
                                m.id === 'compras_atender' && checked && "bg-emerald-50/80 border-emerald-300"
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleEditModule(m.id)}
                                className="w-4 h-4 mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className={cn("text-xs font-bold", checked ? "text-slate-900" : "text-slate-700")}>
                                    {m.label}
                                  </p>
                                  {m.badge && (
                                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md border", m.badgeColor || "bg-slate-100 text-slate-700")}>
                                      {m.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 leading-snug">
                                  {m.description}
                                </p>
                                {m.warning && checked && (
                                  <p className="text-[10px] font-bold text-amber-700 bg-amber-100/60 px-2 py-1 rounded-lg mt-1 inline-block">
                                    ⚠️ {m.warning}
                                  </p>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                      <Button
                        type="button"
                        variant="secondary"
                        className="flex-1 rounded-xl"
                        onClick={() => setEditUser(null)}
                        disabled={editLoading}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md"
                        disabled={editLoading}
                      >
                        {editLoading ? 'Salvando...' : 'Salvar Alterações'}
                      </Button>
                    </div>
                  </form>
                </Card>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal Redefinir Senha do Usuário pelo Admin */}
        <AnimatePresence>
          {resetUser && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="max-w-md w-full"
              >
                <Card className="p-8 space-y-6 rounded-3xl shadow-2xl">
                  <div className="flex items-center gap-3 text-slate-900">
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">Redefinir Senha</h3>
                      <p className="text-sm text-slate-500">Usuário: <span className="font-semibold text-slate-700">{resetUser.name}</span> ({resetUser.email})</p>
                    </div>
                  </div>

                  <form onSubmit={handleAdminResetPassword} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 ml-1">Nova Senha para o Usuário</label>
                      <Input
                        type="password"
                        placeholder="Digite a nova senha"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 ml-1">Confirmar Nova Senha</label>
                      <Input
                        type="password"
                        placeholder="Confirme a nova senha"
                        value={confirmPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="secondary"
                        className="flex-1 rounded-xl"
                        onClick={() => {
                          setResetUser(null);
                          setNewPassword('');
                          setConfirmPassword('');
                        }}
                        disabled={resetLoading}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl"
                        disabled={resetLoading}
                      >
                        {resetLoading ? 'Salvando...' : 'Redefinir'}
                      </Button>
                    </div>
                  </form>
                </Card>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal Novo Usuário */}
        <AnimatePresence>
          {showAddUsersForm && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-xl w-full my-8"
              >
                <Card className="p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl">
                  <div className="flex items-center gap-3 text-slate-900 border-b border-slate-100 pb-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                      <PlusCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">Novo Usuário</h3>
                      <p className="text-sm text-slate-500">Cadastre um novo usuário e personalize suas abas liberadas.</p>
                    </div>
                  </div>

                  <form onSubmit={handleAddUser} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Input label="Nome Completo" name="name" required />
                      <Input label="Email / Usuário" name="email" required />
                    </div>
                    <Input label="Senha" name="password" type="password" required />

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700 ml-1">Perfil</label>
                        <select
                          name="role"
                          value={createRole}
                          onChange={(e) => handleCreateRoleChange(e.target.value as Role)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none font-semibold text-slate-800 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                        >
                          <option value="supervisor">Supervisor (Solicita Compras)</option>
                          <option value="comprador">Comprador (Atende Pedidos de Compra)</option>
                          <option value="tecnico">Técnico (Atendimento de Chamados)</option>
                          <option value="gestor">Gestor / Coordenador</option>
                          <option value="admin">Administrador Geral</option>
                          <option value="assistente">Assistente</option>
                          <option value="estagiario">Estagiário</option>
                          <option value="analista">Analista</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700 ml-1">Unidade</label>
                        <select name="unit" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none font-semibold text-slate-800 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all">
                          <option value="PORTO">Porto</option>
                        </select>
                      </div>
                    </div>

                    {/* Setores */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Setores Vinculados</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {allDepartments.map(dept => (
                          <label key={dept} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                            <input
                              type="checkbox"
                              name="departments"
                              value={dept}
                              checked={createDepartments.includes(dept)}
                              onChange={() => toggleCreateDepartment(dept)}
                              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-xs font-bold text-slate-800">{dept}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Abas e Módulos Permitidos */}
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-slate-800 ml-1">
                          Abas e Módulos Liberados no Painel
                        </label>
                        <span className="text-xs text-blue-600 font-semibold">Controle detalhado de acessos</span>
                      </div>

                      {/* Banner de Segregação de Funções */}
                      <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
                        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-bold text-amber-950">
                            Regra de Segregação de Funções (Compliance)
                          </p>
                          <p className="text-amber-800 text-[11px] leading-relaxed">
                            A pessoa que <strong>solicita a compra</strong> (Supervisor / Solicitante) <strong>não pode ser a mesma</strong> que atende o pedido, cota Fluig e aprova (Comprador). O solicitante apenas cria e acompanha o histórico.
                          </p>
                        </div>
                      </div>

                      {/* Alerta de Conflito caso ambos sejam marcados */}
                      {createAllowedModules.includes('compras_solicitar') && createAllowedModules.includes('compras_atender') && createRole !== 'admin' && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs text-rose-800 font-semibold">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>Atenção: Você selecionou tanto 'Solicitar Compras' quanto 'Atender/Aprovar Compras'. Em conformidade, esses papéis devem ser atribuídos a pessoas distintas.</span>
                        </div>
                      )}

                      <div className="grid gap-2.5">
                        {AVAILABLE_MODULES.map(m => {
                          const checked = createAllowedModules.includes(m.id);
                          return (
                            <label 
                              key={m.id} 
                              className={cn(
                                "flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer",
                                checked ? "bg-blue-50/80 border-blue-300 shadow-sm" : "bg-white border-slate-200 hover:bg-slate-50",
                                m.id === 'compras_solicitar' && checked && "bg-indigo-50/80 border-indigo-300",
                                m.id === 'compras_atender' && checked && "bg-emerald-50/80 border-emerald-300"
                              )}
                            >
                              <input
                                type="checkbox"
                                name="allowed_modules"
                                value={m.id}
                                checked={checked}
                                onChange={() => toggleCreateModule(m.id)}
                                className="w-4 h-4 mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className={cn("text-xs font-bold", checked ? "text-slate-900" : "text-slate-700")}>
                                    {m.label}
                                  </p>
                                  {m.badge && (
                                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md border", m.badgeColor || "bg-slate-100 text-slate-700")}>
                                      {m.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 leading-snug">
                                  {m.description}
                                </p>
                                {m.warning && checked && (
                                  <p className="text-[10px] font-bold text-amber-700 bg-amber-100/60 px-2 py-1 rounded-lg mt-1 inline-block">
                                    ⚠️ {m.warning}
                                  </p>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                      <Button type="button" variant="secondary" className="flex-1 rounded-xl" onClick={() => setShowAddUsersForm(false)}>Cancelar</Button>
                      <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md">Criar Usuário</Button>
                    </div>
                  </form>
                </Card>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
