// --- Public Views (no login required) ---

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  User,
  Monitor,
  Briefcase,
  ExternalLink,
  Package,
  KeyRound,
  AlertCircle,
  Undo2,
  XCircle,
  ChevronRight,
  ChevronLeft,
  Calendar
} from 'lucide-react';
import { Button, Card, Badge, Input } from './ui';
import { cn, STATUS_COLORS, STATUS_LABELS } from '../lib/utils';
import { uploadFile } from '../lib/storage';
import { UNIT_LOCATIONS, USEFUL_LINKS, AGENDAMENTO_AMBIENTES_URL, PAINEL_AULAS_URL } from '../constants';
import { Ticket, Priority, Status, Category, Loan } from '../types';

// =====================================================================
// OpenTicketView
// =====================================================================
interface OpenTicketViewProps {
  selectedUnit: string;
  setSelectedUnit: (unit: string) => void;
  selectedCategory: Category | null;
  setView: (view: any) => void;
  showMessage: (type: 'success' | 'error', text: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setCreatedTicketId: (id: string | null) => void;
}

export const OpenTicketView = ({
  selectedUnit,
  setSelectedUnit,
  selectedCategory,
  setView,
  showMessage,
  loading,
  setLoading,
  setCreatedTicketId
}: OpenTicketViewProps) => {
  const [ticketPriority, setTicketPriority] = useState<Priority>('baixo');
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);

  const handleOpenTicket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      let evidenceUrls: string[] = [];
      let evidencePaths: string[] = [];

      if (evidenceFiles.length > 0) {
        for (const file of evidenceFiles) {
          const { url, path } = await uploadFile(file);
          evidenceUrls.push(url);
          evidencePaths.push(path);
        }
      }

      const payload: any = {
        ...Object.fromEntries(formData.entries()),
        category: selectedCategory,
        evidenceUrls,
        evidencePaths
      };

      if (payload.unit) {
        setSelectedUnit(payload.unit as string);
      }

      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON response:", text);
        throw new Error(`Erro do servidor: ${text.substring(0, 50)}...`);
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro desconhecido no servidor');
      }

      showMessage('success', `Chamado #${data.numeric_id || data.id} aberto com sucesso!`);
      setCreatedTicketId(data.numeric_id || data.id);
      setEvidenceFiles([]);
      setView('ticket-success');
    } catch (e: any) {
      showMessage('error', e.message || 'Erro ao abrir chamado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => setView('home')} className="mb-4">
          <ArrowLeft className="w-4 h-4" /> Voltar para Início
        </Button>

        <Card className="p-8 space-y-8">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-slate-900">Nova Solicitação</h2>
              <div className="flex gap-2 animate-fade-in">
                <Badge className="bg-blue-600 text-white px-4 py-1.5">{selectedUnit || 'PORTO'}</Badge>
                <Badge className="bg-slate-600 text-white px-4 py-1.5">{selectedCategory}</Badge>
              </div>
            </div>
            <p className="text-slate-500">Preencha os detalhes abaixo para que possamos ajudar.</p>
          </div>

          <form onSubmit={handleOpenTicket} className="space-y-6">
            <input type="hidden" name="unit" value={selectedUnit || 'PORTO'} />

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Ambiente</label>
              <select
                name="location"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
              >
                <option value="">Selecione o Ambiente...</option>
                {(UNIT_LOCATIONS[selectedUnit || 'PORTO'] || []).map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Input label="Nome Completo" name="requester_name" required />
              <Input label="Matrícula" name="registration" required />
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <Input label="Telefone" name="phone" required />
              <Input label="Email Corporativo" name="email" type="email" required />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Prioridade</label>
              <select
                name="priority"
                required
                value={ticketPriority}
                onChange={(e: any) => setTicketPriority(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
              >
                <option value="baixo">Baixo</option>
                <option value="medio">Médio</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>

            {ticketPriority === 'urgente' && (
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 ml-1">Explicação da Urgência</label>
                <textarea
                  name="urgent_explanation"
                  required
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                  placeholder="Por que esta solicitação é urgente?"
                />
              </div>
            )}

            {(selectedCategory === 'TI' || selectedCategory === 'Manutenção') && (
              <>
                <Input label="Equipamento/Item" name="equipment" required />
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Descrição do Problema</label>
                  <textarea name="description" required rows={4} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all" />
                </div>
              </>
            )}

            {['Limpeza', 'Supervisão'].includes(selectedCategory!) && (
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 ml-1">Motivo da Solicitação</label>
                <textarea name="reason" required rows={4} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all" />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Evidências (Opcional)</label>
              <input
                type="file"
                multiple
                onChange={(e) => {
                  if (e.target.files) setEvidenceFiles(Array.from(e.target.files));
                }}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              />
              <p className="text-xs text-slate-500 ml-1">Você pode selecionar múltiplos arquivos (imagens, PDFs, documentos).</p>
              {evidenceFiles.length > 0 && (
                <div className="mt-2 text-sm text-slate-700">
                  {evidenceFiles.length} arquivo(s) selecionado(s).
                </div>
              )}
            </div>

            <Button type="submit" disabled={loading} className="w-full h-14 text-lg">
              {loading ? 'Enviando...' : 'Enviar Solicitação'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

// =====================================================================
// TicketTrackingView
// =====================================================================
interface TicketTrackingViewProps {
  createdTicketId: string | null;
  setCreatedTicketId: (id: string | null) => void;
  setView: (view: string) => void;
  showMessage: (type: 'success' | 'error', text: string) => void;
}

export const TicketTrackingView = ({ createdTicketId, setCreatedTicketId, setView, showMessage }: TicketTrackingViewProps) => {
  const [searchTerm, setSearchTerm] = useState(createdTicketId ? String(createdTicketId) : '');
  const [trackedTicket, setTrackedTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTrackedTicket = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tickets/track/${encodeURIComponent(id)}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('Chamado não encontrado. Verifique o número digitado.');
        throw new Error('Erro ao buscar o chamado');
      }
      const data = await res.json();
      setTrackedTicket(data);
    } catch (e: any) {
      showMessage('error', e.message || 'Erro ao carregar chamado');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (createdTicketId) fetchTrackedTicket(createdTicketId);
  }, [createdTicketId]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-5xl space-y-6">
        <Button variant="ghost" onClick={() => {
          if (trackedTicket) {
            setTrackedTicket(null);
            setCreatedTicketId(null);
            setSearchTerm('');
          } else {
            setView('home');
          }
        }} className="mb-4">
          <ArrowLeft className="w-4 h-4" /> {trackedTicket ? 'Voltar para Consulta' : 'Voltar para Início'}
        </Button>

        {!trackedTicket ? (
          <Card className="p-8 max-w-md mx-auto space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 animate-fade-in">Acompanhar Chamado</h2>
              <p className="text-slate-500">Digite o número do seu chamado para acompanhar seu status em tempo real.</p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (searchTerm.trim()) fetchTrackedTicket(searchTerm.trim());
            }} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 ml-1">Número do Chamado</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Ex: 123"
                  required
                  className="w-full px-4 py-3 h-12 rounded-xl border border-slate-200 bg-white focus:ring-4 focus:ring-teal-100 focus:border-teal-500 outline-none transition-all text-center font-bold text-lg"
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition-all"
              >
                {isLoading ? 'Buscando...' : 'Buscar Chamado'}
              </Button>
            </form>
          </Card>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-8 space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold text-slate-900">
                      Chamado #{trackedTicket.numeric_id || trackedTicket.id}
                    </h3>
                    <Badge className={STATUS_COLORS[trackedTicket.status]}>
                      {STATUS_LABELS[trackedTicket.status]}
                    </Badge>
                  </div>
                  <p className="text-slate-500 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Aberto em {new Date(trackedTicket.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Detalhes</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-slate-700">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="font-medium">Solicitante: {trackedTicket.requester_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="font-medium">{trackedTicket.unit}</span>
                        {trackedTicket.location && <span className="text-slate-500">- {trackedTicket.location}</span>}
                      </div>
                      <div className="flex items-center gap-2 text-slate-700">
                        <Briefcase className="w-4 h-4 text-slate-400" />
                        <span className="font-medium">{trackedTicket.category}</span>
                      </div>
                      {trackedTicket.equipment && (
                        <div className="flex items-center gap-2 text-slate-700">
                          <Monitor className="w-4 h-4 text-slate-400" />
                          <span className="font-medium">{trackedTicket.equipment}</span>
                        </div>
                      )}
                      {trackedTicket.technician_name && (
                        <div className="flex items-center gap-2 text-slate-700">
                          <User className="w-4 h-4 text-slate-400" />
                          <span className="font-medium">Técnico: {trackedTicket.technician_name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
                      {['Limpeza', 'Supervisão'].includes(trackedTicket.category!) ? 'Motivo da Solicitação' : 'Descrição'}
                    </h4>
                    <p className="text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100 whitespace-pre-wrap">
                      {['Limpeza', 'Supervisão'].includes(trackedTicket.category!) ? trackedTicket.reason : trackedTicket.description}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Histórico</h4>
                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                    {(trackedTicket as any).history?.map((log: any, index: number) => (
                      <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-blue-100 text-blue-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-900">{STATUS_LABELS[log.status as Status] || log.status}</span>
                            <span className="text-xs font-medium text-slate-400">
                              {new Date(log.changed_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600">{log.changed_by_name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// =====================================================================
// UsefulLinksView
// =====================================================================
const LINK_CATEGORIES = ['Todos', 'Acadêmico', 'Corporativo', 'Capacitação', 'Materiais', 'Avaliação', 'Comunicação'];

export const UsefulLinksView = ({ setView }: { setView: (v: any) => void }) => {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('Todos');

  const filtered = USEFUL_LINKS.filter(link => {
    const matchesSearch =
      link.title.toLowerCase().includes(search.toLowerCase()) ||
      (link.desc || '').toLowerCase().includes(search.toLowerCase()) ||
      link.user.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCat === 'Todos' || link.category === selectedCat;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-rose-100/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        <Button variant="ghost" onClick={() => setView('home')} className="h-10 hover:bg-slate-200 rounded-xl px-4 text-slate-600">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Início
        </Button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Links Úteis</h2>
            <p className="text-slate-500 text-lg font-medium">Sistemas institucionais, ferramentas operacionais e materiais de apoio.</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-2 focus-within:ring-2 focus-within:ring-rose-100 transition-all shadow-sm">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              placeholder="Buscar portal ou função..."
              className="outline-none text-sm bg-transparent w-full sm:w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {LINK_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={cn(
                "px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap border",
                selectedCat === cat
                  ? "bg-rose-600 text-white shadow-lg shadow-rose-200 border-rose-600"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((link, idx) => (
            <Card key={idx} className="p-6 flex flex-col justify-between hover:shadow-2xl hover:border-rose-400 hover:-translate-y-1 transition-all border border-slate-200 bg-white group rounded-3xl h-full">
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <span className={cn(
                    "text-[9px] uppercase font-black tracking-wider px-3 py-1 rounded-full border border-solid",
                    link.category === 'Acadêmico' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                    link.category === 'Corporativo' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                    link.category === 'Capacitação' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                    link.category === 'Materiais' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    link.category === 'Avaliação' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                    'bg-slate-100 text-slate-700 border-slate-200'
                  )}>
                    {link.category}
                  </span>
                  <span className="text-[9px] text-slate-500 font-bold bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-100 shrink-0">
                    Login: {link.user}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-rose-600 transition-colors leading-snug">{link.title}</h3>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed font-medium">{link.desc}</p>
                </div>
              </div>

              <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                <span className="text-xs text-slate-400 font-semibold">Credencial: <strong className="text-slate-600">{link.user.split(',')[0]}</strong></span>
                {link.url ? (
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-rose-600 text-white rounded-2xl text-xs font-bold transition-all shadow-md group-hover:shadow-rose-100"
                  >
                    Acessar <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
                    Rede Interna
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 bg-white border border-dashed border-slate-300 rounded-3xl">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700">Nenhum link encontrado</h3>
            <p className="text-slate-400 text-sm mt-1 font-medium">Tente buscar por termos diferentes ou selecione outra categoria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// =====================================================================
// LoanRequestView (Unified Loans Public Hub)
// =====================================================================

interface LoanRequestViewProps {
  setView: (view: any) => void;
  showMessage: (type: 'success' | 'error', text: string) => void;
  setCreatedLoanId: (id: string | null) => void; // kept for compatibility, though we query by registration now
}

type ReleaseStep = 'pin' | 'sign' | 'checklist';
type HubMode = 'hub' | 'request' | 'tracking';

export const LoanRequestView = ({ setView, showMessage, setCreatedLoanId }: LoanRequestViewProps) => {
  const [mode, setMode] = useState<HubMode>('hub');
  const [loading, setLoading] = useState(false);

  // Tracking states
  const [registrationSearch, setRegistrationSearch] = useState('');
  const [searchedRegistration, setSearchedRegistration] = useState('');
  const [userLoans, setUserLoans] = useState<Loan[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Release modal state
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [releaseStep, setReleaseStep] = useState<ReleaseStep>('pin');
  const [releasePin, setReleasePin] = useState('');
  const [releaseName, setReleaseName] = useState('');
  const [releaseReg, setReleaseReg] = useState('');
  const [releaseEmail, setReleaseEmail] = useState('');
  const [releaseChecklist, setReleaseChecklist] = useState('');
  const [releaseLoading, setReleaseLoading] = useState(false);

  // Return modal state
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnPin, setReturnPin] = useState('');
  const [returnChecklist, setReturnChecklist] = useState('');
  const [returnCondition, setReturnCondition] = useState<'sim' | 'nao'>('sim');
  const [returnProblem, setReturnProblem] = useState('');
  const [returnLoading, setReturnLoading] = useState(false);

  const handleRequestSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    const registrationUsed = payload.registration as string;

    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao solicitar empréstimo');
      
      showMessage('success', 'Solicitação de empréstimo enviada com sucesso!');
      setCreatedLoanId(data.id);
      
      // Auto transition to tracking mode with the used registration
      setRegistrationSearch(registrationUsed);
      setSearchedRegistration(registrationUsed);
      await fetchLoansByRegistration(registrationUsed);
      setMode('tracking');
    } catch (e: any) {
      showMessage('error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLoansByRegistration = async (reg: string) => {
    setIsSearching(true);
    try {
      const res = await fetch(`/api/loans/registration/${encodeURIComponent(reg)}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao buscar empréstimos');
      }
      const data = await res.json();
      setUserLoans(data);
      setSelectedLoan(null); // Reset detail view
    } catch (e: any) {
      showMessage('error', e.message);
    } finally {
      setIsSearching(false);
    }
  };

  const refreshSelectedLoanDetail = async (loanId: string) => {
    try {
      const res = await fetch(`/api/loans/track/${encodeURIComponent(loanId)}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedLoan(data);
        // Also update it in the list
        setUserLoans(prev => prev.map(l => l.id === loanId ? data : l));
      }
    } catch (e) {
      console.error("Error refreshing loan detail:", e);
    }
  };

  // Auto-poll when detail is open and status is pendente or autorizado
  useEffect(() => {
    if (!selectedLoan || (selectedLoan.status !== 'pendente' && selectedLoan.status !== 'autorizado')) return;
    const interval = setInterval(() => refreshSelectedLoanDetail(selectedLoan.id), 15000);
    return () => clearInterval(interval);
  }, [selectedLoan?.status, selectedLoan?.id]);

  const handleRelease = async () => {
    if (!selectedLoan) return;
    setReleaseLoading(true);
    try {
      const res = await fetch(`/api/loans/${selectedLoan.id}/release`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: releasePin,
          signature_name: releaseName,
          signature_registration: releaseReg,
          signature_email: releaseEmail,
          checklist_initial: releaseChecklist
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showMessage('success', 'Equipamento retirado com sucesso!');
      setShowReleaseModal(false);
      setReleaseStep('pin');
      setReleasePin(''); setReleaseName(''); setReleaseReg(''); setReleaseEmail(''); setReleaseChecklist('');
      refreshSelectedLoanDetail(selectedLoan.id);
    } catch (e: any) {
      showMessage('error', e.message);
    } finally {
      setReleaseLoading(false);
    }
  };

  const handleReturn = async () => {
    if (!selectedLoan) return;
    setReturnLoading(true);
    try {
      const res = await fetch(`/api/loans/${selectedLoan.id}/return`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: returnPin,
          checklist_return: returnChecklist,
          return_condition: returnCondition,
          return_problem: returnProblem
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showMessage('success', 'Devolução registrada com sucesso!');
      setShowReturnModal(false);
      setReturnPin(''); setReturnChecklist(''); setReturnCondition('sim'); setReturnProblem('');
      refreshSelectedLoanDetail(selectedLoan.id);
    } catch (e: any) {
      showMessage('error', e.message);
    } finally {
      setReturnLoading(false);
    }
  };

  const statusLabel: Record<string, string> = {
    pendente: 'Aguardando Aprovação',
    autorizado: 'Aprovado — Pronto para Retirada',
    em_uso: 'Em Uso',
    concluido: 'Concluído',
    recusado: 'Recusado',
    liberado: 'Liberado'
  };

  const statusColor: Record<string, string> = {
    pendente: 'bg-amber-100 text-amber-700',
    autorizado: 'bg-blue-100 text-blue-700',
    em_uso: 'bg-purple-100 text-purple-700',
    concluido: 'bg-emerald-100 text-emerald-700',
    recusado: 'bg-red-100 text-red-700',
    liberado: 'bg-teal-100 text-teal-700'
  };

  const stepKeys: ReleaseStep[] = ['pin', 'sign', 'checklist'];

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl space-y-6">
        <Button
          variant="ghost"
          onClick={() => {
            if (selectedLoan) {
              setSelectedLoan(null);
            } else if (mode !== 'hub') {
              setMode('hub');
              setUserLoans([]);
              setRegistrationSearch('');
            } else {
              setView('home');
            }
          }}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> {selectedLoan ? 'Voltar para Lista' : (mode !== 'hub' ? 'Voltar para Menu' : 'Voltar para Início')}
        </Button>

        {/* HUB MODE */}
        {mode === 'hub' && (
          <div className="space-y-8 max-w-xl mx-auto text-center">
            <div className="space-y-3">
              <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-2">
                <Package className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Empréstimos de Equipamentos</h2>
              <p className="text-slate-500 font-medium">Selecione o que deseja fazer abaixo para prosseguir.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 pt-4">
              <button
                onClick={() => setMode('request')}
                className="p-6 bg-white border border-slate-100 hover:border-orange-500 hover:shadow-xl hover:-translate-y-1 rounded-3xl shadow-sm text-center flex flex-col items-center justify-center gap-4 transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Solicitar Empréstimo</h3>
                  <p className="text-xs text-slate-400 mt-1">Peça um notebook, projetor ou outro dispositivo.</p>
                </div>
              </button>

              <button
                onClick={() => setMode('tracking')}
                className="p-6 bg-white border border-slate-100 hover:border-blue-500 hover:shadow-xl hover:-translate-y-1 rounded-3xl shadow-sm text-center flex flex-col items-center justify-center gap-4 transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Acompanhar Empréstimo</h3>
                  <p className="text-xs text-slate-400 mt-1">Consulte status, retire ou devolva com sua matrícula.</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* REQUEST MODE */}
        {mode === 'request' && (
          <Card className="p-8 space-y-8">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Solicitar Equipamento</h2>
                  <p className="text-sm text-slate-500">Envie o formulário para aprovação da gestão.</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Input label="Nome Completo" name="requester_name" required />
                <Input label="Matrícula" name="registration" required />
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <Input label="E-mail" name="email" type="email" required />
                <Input label="Telefone" name="phone" required />
              </div>
              <Input label="Equipamento Desejado" name="equipment" required placeholder="Ex: Notebook Dell, Projetor..." />
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 ml-1">Local de Uso</label>
                <select name="location" required className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all">
                  <option value="">Selecione o local...</option>
                  {(UNIT_LOCATIONS['PORTO'] || []).map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 ml-1">Motivo do Empréstimo</label>
                <textarea name="reason" required rows={4} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all" placeholder="Descreva o motivo..." />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-14 text-lg bg-orange-600 hover:bg-orange-700">
                {loading ? 'Enviando...' : 'Enviar Solicitação'}
              </Button>
            </form>
          </Card>
        )}

        {/* TRACKING MODE (Matrícula lookup) */}
        {mode === 'tracking' && !selectedLoan && (
          <div className="space-y-6">
            <Card className="p-8 max-w-md mx-auto space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <Search className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Acompanhar Empréstimos</h2>
                <p className="text-slate-500 text-sm">Digite sua matrícula para listar seus empréstimos ativos e históricos.</p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (registrationSearch.trim()) {
                    setSearchedRegistration(registrationSearch.trim());
                    fetchLoansByRegistration(registrationSearch.trim());
                  }
                }}
                className="space-y-4"
              >
                <input
                  type="text" value={registrationSearch} onChange={(e) => setRegistrationSearch(e.target.value)}
                  placeholder="Digite sua matrícula" required
                  className="w-full px-4 py-3 h-12 rounded-xl border border-slate-200 bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-center font-bold text-slate-800"
                />
                <Button type="submit" disabled={isSearching} className="w-full h-12 bg-blue-600 hover:bg-blue-700">
                  {isSearching ? 'Buscando...' : 'Consultar'}
                </Button>
              </form>
            </Card>

            {/* Loans list result */}
            {searchedRegistration && !isSearching && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <h3 className="text-lg font-bold text-slate-700">Empréstimos vinculados à matrícula: <span className="text-blue-600">{searchedRegistration}</span></h3>
                {userLoans.length === 0 ? (
                  <Card className="p-8 text-center text-slate-400 font-medium">
                    Nenhum empréstimo encontrado para esta matrícula.
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {userLoans.map(loan => (
                      <button
                        key={loan.id}
                        onClick={() => setSelectedLoan(loan)}
                        className="w-full text-left p-5 bg-white border border-slate-100 hover:border-blue-500 rounded-2xl shadow-sm hover:shadow-md transition-all flex justify-between items-center group"
                      >
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{loan.equipment}</h4>
                          <p className="text-xs text-slate-500">Solicitado em: {new Date(loan.created_at).toLocaleDateString('pt-BR')} às {new Date(loan.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                          <p className="text-xs text-slate-400">Local: {loan.location}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={cn('text-xs px-3 py-1', statusColor[loan.status] || 'bg-slate-100 text-slate-700')}>
                            {statusLabel[loan.status] || loan.status}
                          </Badge>
                          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}

        {/* LOAN DETAIL VIEW */}
        {mode === 'tracking' && selectedLoan && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-8 space-y-6">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">{selectedLoan.equipment}</h3>
                  <p className="text-slate-500 text-sm mt-1">ID do Empréstimo: <span className="font-mono font-bold text-slate-700 select-all">{selectedLoan.id}</span></p>
                </div>
                <Badge className={cn('text-sm px-4 py-2', statusColor[selectedLoan.status] || 'bg-slate-100 text-slate-700')}>
                  {statusLabel[selectedLoan.status] || selectedLoan.status}
                </Badge>
              </div>

              {/* Status Banner: Pendente */}
              {selectedLoan.status === 'pendente' && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-800">
                  <Clock className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Aguardando aprovação do gestor</p>
                    <p className="text-xs mt-1">Essa tela atualiza automaticamente a cada 15 segundos assim que houver alteração.</p>
                  </div>
                </div>
              )}

              {/* Status Banner: Recusado */}
              {selectedLoan.status === 'recusado' && (
                <div className="p-5 bg-red-50 border border-red-200 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-red-700">
                    <XCircle className="w-6 h-6" />
                    <h4 className="font-bold text-lg">Solicitação Recusada</h4>
                  </div>
                  <div className="bg-white border border-red-100 rounded-xl p-4">
                    <p className="text-sm font-bold text-red-400 uppercase tracking-wider mb-1">Motivo informado pelo gestor</p>
                    <p className="text-red-800 font-medium">"{selectedLoan.rejection_reason}"</p>
                  </div>
                  {selectedLoan.rejected_by && (
                    <p className="text-xs text-red-500">Recusado por <strong>{selectedLoan.rejected_by}</strong> em {selectedLoan.rejected_at ? new Date(selectedLoan.rejected_at).toLocaleString('pt-BR') : '—'}</p>
                  )}
                </div>
              )}

              {/* Status Banner: Autorizado */}
              {selectedLoan.status === 'autorizado' && (
                <div className="space-y-4">
                  <div className="p-5 bg-blue-50 border border-blue-200 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2 text-blue-700">
                      <CheckCircle2 className="w-6 h-6" />
                      <h4 className="font-bold text-lg">Aprovado — Pronto para Retirada</h4>
                    </div>
                    <div className="p-4 bg-white border border-blue-100 rounded-xl text-sm text-blue-800">
                      <p>Sua solicitação foi aprovada. Por razões de segurança, utilize o **PIN de 4 dígitos** enviado ao seu e-mail (ou informado pelo gestor) para liberar o equipamento no botão abaixo.</p>
                    </div>
                    {selectedLoan.terms && (
                      <div className="bg-white border border-blue-100 rounded-xl p-4">
                        <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Termos e Acordo</p>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedLoan.terms}</p>
                      </div>
                    )}
                  </div>

                  <Button onClick={() => { setShowReleaseModal(true); setReleaseStep('pin'); }} className="w-full h-12 bg-blue-600 hover:bg-blue-700">
                    <KeyRound className="w-5 h-5" /> Retirar Equipamento (Liberar)
                  </Button>
                </div>
              )}

              {/* Status Banner: Em Uso */}
              {selectedLoan.status === 'em_uso' && (
                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl space-y-2">
                    <p className="text-sm font-bold text-purple-400 uppercase tracking-wider">Equipamento em Seu Uso</p>
                    {selectedLoan.signature_name && <p className="text-slate-700 text-sm">Retirado por: <strong>{selectedLoan.signature_name}</strong></p>}
                    {selectedLoan.released_at && <p className="text-slate-500 text-xs">Retirado em: {new Date(selectedLoan.released_at).toLocaleString('pt-BR')}</p>}
                    {selectedLoan.checklist_initial && (
                      <div className="mt-3 bg-white border border-purple-100 rounded-xl p-3">
                        <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">Checklist de Retirada</p>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedLoan.checklist_initial}</p>
                      </div>
                    )}
                  </div>
                  <Button onClick={() => setShowReturnModal(true)} variant="secondary" className="w-full h-12 border-purple-200 text-purple-700 hover:bg-purple-50">
                    <Undo2 className="w-5 h-5" /> Devolver Equipamento
                  </Button>
                </div>
              )}

              {/* Status Banner: Concluído */}
              {selectedLoan.status === 'concluido' && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 className="w-5 h-5" />
                    <h4 className="font-bold">Devolução Concluída com Sucesso</h4>
                  </div>
                  {selectedLoan.return_condition && (
                    <p className="text-sm text-slate-700">Estado de devolução: <strong>{selectedLoan.return_condition === 'sim' ? 'Perfeito estado' : 'Com problemas'}</strong></p>
                  )}
                  {selectedLoan.return_problem && <p className="text-sm text-red-600">Descrição do Problema: {selectedLoan.return_problem}</p>}
                  {selectedLoan.checklist_return && (
                    <div className="bg-white border border-emerald-100 rounded-xl p-3">
                      <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Checklist de Devolução</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedLoan.checklist_return}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Logs Timeline */}
              {selectedLoan.logs && selectedLoan.logs.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Histórico</h4>
                  <div className="space-y-3">
                    {selectedLoan.logs.map((log, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                          <Clock className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-900 text-sm">{log.action}</span>
                            <span className="text-xs text-slate-400 shrink-0">
                              {new Date(log.timestamp).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{log.user}</p>
                          {log.details && <p className="text-xs text-slate-600 mt-1 italic line-clamp-2">"{log.details}"</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </div>

      {/* Release Modal */}
      <AnimatePresence>
        {showReleaseModal && selectedLoan && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="max-w-lg w-full my-4">
              <Card className="p-8 space-y-6">
                {/* Step indicator */}
                <div className="flex items-center gap-2 mb-2">
                  {stepKeys.map((s, i) => (
                    <React.Fragment key={s}>
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                        releaseStep === s ? 'bg-blue-600 text-white' :
                        stepKeys.indexOf(releaseStep) > i ? 'bg-emerald-500 text-white' :
                        'bg-slate-100 text-slate-400'
                      )}>{i + 1}</div>
                      {i < 2 && <div className="flex-1 h-0.5 bg-slate-100" />}
                    </React.Fragment>
                  ))}
                </div>

                {/* Step 1: PIN */}
                {releaseStep === 'pin' && (
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-slate-900">Confirmar PIN</h3>
                    <p className="text-slate-500">Digite o PIN de 4 dígitos gerado na aprovação.</p>
                    <input
                      type="text" inputMode="numeric" maxLength={4}
                      value={releasePin} onChange={(e) => setReleasePin(e.target.value.replace(/\D/g, ''))}
                      placeholder="0000"
                      className="w-full text-center font-mono text-3xl tracking-widest px-4 py-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                    />
                    <div className="flex gap-3">
                      <Button variant="secondary" className="flex-1" onClick={() => setShowReleaseModal(false)}>Cancelar</Button>
                      <Button className="flex-1" disabled={releasePin.length !== 4} onClick={() => setReleaseStep('sign')}>Continuar</Button>
                    </div>
                  </div>
                )}

                {/* Step 2: Signature */}
                {releaseStep === 'sign' && (
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-slate-900">Assinar Termo</h3>
                    {selectedLoan.terms && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-40 overflow-y-auto">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Termos do Empréstimo</p>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedLoan.terms}</p>
                      </div>
                    )}
                    <div className="space-y-3">
                      <Input label="Nome Completo (Assinatura)" value={releaseName} onChange={(e: any) => setReleaseName(e.target.value)} required />
                      <Input label="Matrícula" value={releaseReg} onChange={(e: any) => setReleaseReg(e.target.value)} required />
                      <Input label="E-mail" type="email" value={releaseEmail} onChange={(e: any) => setReleaseEmail(e.target.value)} required />
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-600">
                        <span className="font-semibold">Data/Hora da assinatura: </span>{new Date().toLocaleString('pt-BR')}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="secondary" className="flex-1" onClick={() => setReleaseStep('pin')}>Voltar</Button>
                      <Button className="flex-1" disabled={!releaseName || !releaseReg || !releaseEmail} onClick={() => setReleaseStep('checklist')}>Continuar</Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Initial checklist */}
                {releaseStep === 'checklist' && (
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-slate-900">Checklist de Retirada</h3>
                    <p className="text-slate-500">Confirme as condições físicas do equipamento ao retirar.</p>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 ml-1">Estado do equipamento na retirada</label>
                      <textarea rows={5} value={releaseChecklist} onChange={(e) => setReleaseChecklist(e.target.value)}
                        placeholder="Ex: Carregador presente, tela sem riscos, sem marcas de queda..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button variant="secondary" className="flex-1" onClick={() => setReleaseStep('sign')}>Voltar</Button>
                      <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={!releaseChecklist || releaseLoading} onClick={handleRelease}>
                        {releaseLoading ? 'Confirmando...' : 'Confirmar Retirada'}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Return Modal */}
      <AnimatePresence>
        {showReturnModal && selectedLoan && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="max-w-lg w-full my-4">
              <Card className="p-8 space-y-6">
                <h3 className="text-2xl font-bold text-slate-900">Devolver Equipamento</h3>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 ml-1">PIN do Empréstimo</label>
                  <input
                    type="text" inputMode="numeric" maxLength={4}
                    value={returnPin} onChange={(e) => setReturnPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="0000"
                    className="w-full text-center font-mono text-3xl tracking-widest px-4 py-4 rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-3 ml-1">O equipamento está em bom estado?</p>
                  <div className="flex gap-3">
                    <button onClick={() => setReturnCondition('sim')} className={cn('flex-1 py-3 rounded-xl border-2 font-bold transition-all', returnCondition === 'sim' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-slate-100 text-slate-400')}>SIM</button>
                    <button onClick={() => setReturnCondition('nao')} className={cn('flex-1 py-3 rounded-xl border-2 font-bold transition-all', returnCondition === 'nao' ? 'bg-red-50 border-red-500 text-red-700' : 'border-slate-100 text-slate-400')}>NÃO</button>
                  </div>
                  {returnCondition === 'nao' && (
                    <div className="mt-3 space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 ml-1">Descreva o problema</label>
                      <textarea rows={3} value={returnProblem} onChange={(e) => setReturnProblem(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-red-100"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Checklist de Devolução</label>
                  <textarea rows={4} value={returnChecklist} onChange={(e) => setReturnChecklist(e.target.value)}
                    placeholder="Descreva o estado do equipamento ao devolver..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none transition-all"
                  />
                </div>

                <div className="flex gap-3">
                  <Button variant="secondary" className="flex-1" onClick={() => setShowReturnModal(false)}>Cancelar</Button>
                  <Button
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                    disabled={returnPin.length !== 4 || !returnChecklist || (returnCondition === 'nao' && !returnProblem) || returnLoading}
                    onClick={handleReturn}
                  >
                    {returnLoading ? 'Registrando...' : 'Confirmar Devolução'}
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// =====================================================================
// AgendamentoAmbienteView
// =====================================================================
export const AgendamentoAmbienteView = ({ onBack }: { onBack: () => void }) => {
  const url = AGENDAMENTO_AMBIENTES_URL;
  useEffect(() => {
    if (url) {
      window.location.href = url;
    }
  }, [url]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
      <Card className="max-w-md w-full p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center mx-auto">
          <Calendar className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Agendamento de Ambiente</h2>
          <p className="text-slate-500 text-sm">
            {url ? "Redirecionando para a plataforma de agendamentos..." : "O link para o sistema de agendamento será configurado em breve."}
          </p>
        </div>
        {url ? (
          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-full h-12 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all gap-2">
            Acessar Sistema <ExternalLink className="w-4 h-4" />
          </a>
        ) : (
          <Button variant="secondary" onClick={onBack} className="w-full h-12">
            <ArrowLeft className="w-4 h-4" /> Voltar ao Início
          </Button>
        )}
      </Card>
    </div>
  );
};

// =====================================================================
// PainelAulasView
// =====================================================================
export const PainelAulasView = ({ onBack }: { onBack: () => void }) => {
  const url = PAINEL_AULAS_URL;
  useEffect(() => {
    if (url) {
      window.location.href = url;
    }
  }, [url]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
      <Card className="max-w-md w-full p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
          <Briefcase className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Painel de Aulas</h2>
          <p className="text-slate-500 text-sm">
            {url ? "Redirecionando para o painel de aulas..." : "O link para o painel de aulas será configurado em breve."}
          </p>
        </div>
        {url ? (
          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-full h-12 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all gap-2">
            Acessar Painel <ExternalLink className="w-4 h-4" />
          </a>
        ) : (
          <Button variant="secondary" onClick={onBack} className="w-full h-12">
            <ArrowLeft className="w-4 h-4" /> Voltar ao Início
          </Button>
        )}
      </Card>
    </div>
  );
};

