import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingCart,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ArrowLeft,
  Search,
  Filter,
  RefreshCw,
  Send,
  Bell,
  BellOff,
  FileText,
  Camera,
  Trash2,
  Plus,
  ExternalLink,
  MessageSquare,
  User,
  GraduationCap,
  Users2,
  Calendar,
  Layers,
  X,
  Sparkles,
  Info,
  ShieldAlert,
  Check,
  UserCheck,
  Mail,
  Upload,
  AlertTriangle
} from 'lucide-react';
import { Button, Card, Badge, Input } from './ui';
import { cn } from '../lib/utils';
import { UserProfile, PurchaseOrder, PurchaseItem, SenaiItem, SenaiItemsMeta, Role, hasModuleAccess } from '../types';


// =====================================================================
// Props & Helper Types
// =====================================================================

interface PurchasesProps {
  user: UserProfile | null;
  token: string | null;
  onNavigate: (path: string) => void;
  showMessage: (type: 'success' | 'error', text: string) => void;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  pendente: {
    label: 'Pendente',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200'
  },
  ciente: {
    label: 'Ciente',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200'
  },
  em_andamento: {
    label: 'Em Andamento',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200'
  },
  concluido: {
    label: 'Concluído',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200'
  },
  cancelado: {
    label: 'Cancelado',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200'
  }
};

// =====================================================================
// ComprasHomeView — Hub Principal (/compras)
// =====================================================================

export const ComprasHomeView: React.FC<PurchasesProps> = ({
  user,
  token,
  onNavigate,
  showMessage
}) => {
  const canRequest = hasModuleAccess(user, 'compras_solicitar');
  const canAttend = hasModuleAccess(user, 'compras_atender');
  const [showCsvModal, setShowCsvModal] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-green-100/50 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full text-center space-y-8 relative z-10"
      >
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <img
              src="https://lh3.googleusercontent.com/d/1x_2FRXCBA5T2PDG7JjDx6me8RboCVaj0"
              alt="Logo SENAI Porto"
              className="h-16 md:h-20 object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold uppercase tracking-wider mb-1">
              <ShoppingCart className="w-3.5 h-3.5" /> Módulo de Compras
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Gestão e Solicitação de Compras
            </h1>
            <p className="text-slate-500 text-sm md:text-base max-w-xl mx-auto">
              Realize novos pedidos para cursos e turmas ou acompanhe o status dos pedidos em atendimento.
            </p>
          </div>
        </div>

        {/* Informative Banner on Segregation of Duties */}
        {user && (
          <div className="max-w-2xl mx-auto space-y-3">
            {canRequest && !canAttend ? (
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-start gap-3 text-left">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl mt-0.5 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="text-xs text-indigo-950 space-y-0.5">
                  <p className="font-bold text-sm">Perfil: Solicitante (Supervisor / Docente)</p>
                  <p className="text-indigo-800 leading-relaxed">
                    Você possui permissão para <strong>solicitar novos pedidos de compra</strong> e <strong>acompanhar o histórico e andamento</strong>. O atendimento, cotação e aprovação são executados exclusivamente pelo setor de compras.
                  </p>
                </div>
              </div>
            ) : canAttend || user.role === 'admin' ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-left">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl mt-0.5 shrink-0">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div className="text-xs text-emerald-950 space-y-0.5">
                    <p className="font-bold text-sm">Perfil: Comprador / Administrador</p>
                    <p className="text-emerald-800 leading-relaxed">
                      Você pode atender pedidos, gerenciar a cotação e fazer o <strong>upload da planilha de itens do SENAI (CSV)</strong>.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowCsvModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3.5 shrink-0 rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  <Upload className="w-4 h-4" /> Upload CSV
                </Button>
              </div>
            ) : (
              <div className="p-3.5 bg-slate-100/90 border border-slate-200 rounded-2xl flex items-center justify-between text-xs text-slate-700 text-left">
                <span className="font-semibold">Acesso Administrativo Completo aos submódulos de compras</span>
                <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded-md font-bold text-slate-800 uppercase">Admin / Gestor</span>
              </div>
            )}
          </div>
        )}


        {/* Action Cards */}
        {!user ? (
          <Card className="p-8 max-w-md mx-auto text-center space-y-4">
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
              <Info className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Acesso Restrito</h3>
            <p className="text-slate-500 text-sm">
              O módulo de compras é de uso interno para Supervisores, Compradores e Administradores. Faça login para continuar.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <Button onClick={() => onNavigate('/login')} className="w-full">
                Fazer Login
              </Button>
              <Button variant="ghost" onClick={() => onNavigate('/')} className="w-full">
                Voltar à Página Inicial
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Card 1: Realizar Pedido (Apenas Solicitante/Supervisor/Admin) */}
            {canRequest ? (
              <motion.button
                whileHover={{ scale: 1.02, translateY: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate('/compras/novo')}
                className="group relative bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-all flex flex-col items-center justify-between text-center overflow-hidden min-h-[260px] text-left cursor-pointer"
              >
                <div className="w-full flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-green-600 text-white flex items-center justify-center shadow-lg shadow-green-200 group-hover:scale-110 transition-transform">
                    <PlusCircle className="w-8 h-8" />
                  </div>
                  <div className="space-y-1 text-center">
                    <h2 className="text-xl font-bold text-slate-900">Realizar Pedido de Compra</h2>
                    <p className="text-sm text-slate-500">
                      Cadastre itens necessários para seus cursos, turmas e projetos pedagógicos.
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-green-700 font-bold text-sm gap-1">
                  <span>Criar Novo Pedido</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.button>
            ) : (
              <div className="bg-slate-100/70 p-8 rounded-3xl border border-slate-200 flex flex-col items-center justify-center text-center space-y-3 min-h-[260px] opacity-75">
                <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-400 flex items-center justify-center">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-700 text-sm">Abertura de Pedidos Desabilitada</p>
                  <p className="text-xs text-slate-500 max-w-xs">
                    Pelo princípio de segregação de funções, compradores não abrem solicitações diretamente.
                  </p>
                </div>
              </div>
            )}

            {/* Card 2: Acompanhar Compras / Atendimento */}
            <motion.button
              whileHover={{ scale: 1.02, translateY: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('/compras/acompanhamento')}
              className="group relative bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-all flex flex-col items-center justify-between text-center overflow-hidden min-h-[260px] text-left cursor-pointer"
            >
              <div className="w-full flex flex-col items-center gap-4">
                <div className={cn(
                  "w-16 h-16 rounded-2xl text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform",
                  canAttend ? "bg-emerald-600 shadow-emerald-200" : "bg-indigo-600 shadow-indigo-200"
                )}>
                  {canAttend ? <ShoppingCart className="w-8 h-8" /> : <Clock className="w-8 h-8" />}
                </div>
                <div className="space-y-1 text-center">
                  <h2 className="text-xl font-bold text-slate-900">
                    {canAttend ? 'Painel de Atendimento' : 'Acompanhar Minhas Compras'}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {canAttend
                      ? 'Atenda solicitações, defina número de Fluig, altere status e emita comunicados.'
                      : 'Consulte o andamento, histórico de atualizações e solicite posição aos compradores.'}
                  </p>
                </div>
              </div>
              <div className={cn("mt-4 flex items-center font-bold text-sm gap-1", canAttend ? "text-emerald-700" : "text-indigo-700")}>
                <span>{canAttend ? 'Acessar Fila de Atendimento' : 'Ver Meus Pedidos'}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.button>
          </div>
        )}

        {/* Back Link */}
        <div className="pt-4">
          <Button
            variant="ghost"
            onClick={() => onNavigate(user ? '/dashboard' : '/')}
            className="text-slate-500 hover:text-slate-900 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> {user ? 'Voltar ao Painel Interno' : 'Voltar ao Menu Principal'}
          </Button>
        </div>
      </motion.div>

      {/* Modal Upload CSV de Itens */}
      <AnimatePresence>
        {showCsvModal && (
          <BuyerCsvModal
            user={user}
            token={token}
            onClose={() => setShowCsvModal(false)}
            showMessage={showMessage}
          />
        )}
      </AnimatePresence>
    </div>
  );

};

// =====================================================================
// NovoPedidoCompraView — Formulário de Pedido (/compras/novo)
// =====================================================================

export const NovoPedidoCompraView: React.FC<PurchasesProps> = ({
  user,
  token,
  onNavigate,
  showMessage
}) => {
  const [curso, setCurso] = useState('');
  const [turma, setTurma] = useState('');
  const [items, setItems] = useState<PurchaseItem[]>([
    { item_name: '', quantity: 1, reason: '' }
  ]);

  // Expandable New Item Request
  const [showNewItemSection, setShowNewItemSection] = useState(false);
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemPhotoUrl, setNewItemPhotoUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Available pre-registered items and reasons (from SENAI CSV / DB)
  const [availableSenaiItems, setAvailableSenaiItems] = useState<SenaiItem[]>([]);
  const [availableItems, setAvailableItems] = useState<string[]>([]);
  const [availableReasons, setAvailableReasons] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Fetch pre-registered SENAI items and reasons
    fetch('/api/purchases/items')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.items)) {
          setAvailableSenaiItems(data.items);
          setAvailableItems(data.items.map((i: SenaiItem) => i.full_name || i.descricao));
        } else if (Array.isArray(data)) {
          if (data.length > 0 && typeof data[0] === 'object') {
            setAvailableSenaiItems(data);
            setAvailableItems(data.map((i: any) => i.full_name || i.descricao));
          } else {
            setAvailableItems(data);
          }
        }
      })
      .catch(() => {});

    fetch('/api/purchases/reasons')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAvailableReasons(data);
        }
      })
      .catch(() => {});
  }, []);


  const handleAddItemRow = () => {
    setItems([...items, { item_name: '', quantity: 1, reason: '' }]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof PurchaseItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setNewItemPhotoUrl(data.url);
        showMessage('success', 'Foto anexada com sucesso!');
      } else {
        showMessage('error', data.error || 'Erro ao enviar foto');
      }
    } catch {
      showMessage('error', 'Erro ao fazer upload da foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!curso.trim()) {
      showMessage('error', 'Por favor, informe o nome do curso');
      return;
    }
    if (!turma.trim()) {
      showMessage('error', 'Por favor, informe o código/nome da turma');
      return;
    }

    // Filter valid items
    const validItems = items.filter(it => it.item_name.trim().length > 0);
    
    // If user filled in new item section, include it as an item
    if (showNewItemSection && newItemDescription.trim()) {
      validItems.push({
        item_name: `[Novo Item] ${newItemDescription.trim()}`,
        quantity: 1,
        reason: 'Item novo solicitado',
        is_new_item: true,
        new_item_description: newItemDescription.trim(),
        new_item_photo_url: newItemPhotoUrl || undefined
      });
    }

    if (validItems.length === 0) {
      showMessage('error', 'Por favor, adicione pelo menos um item ao pedido');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          curso: curso.trim(),
          turma: turma.trim(),
          items: validItems
        })
      });

      const data = await res.json();
      if (res.ok) {
        showMessage('success', `Pedido #${data.numeric_id || data.id} registrado com sucesso!`);
        onNavigate('/compras/acompanhamento');
      } else {
        showMessage('error', data.error || 'Erro ao enviar pedido');
      }
    } catch {
      showMessage('error', 'Erro de comunicação com o servidor');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 md:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => onNavigate(hasModuleAccess(user, 'compras') ? '/compras' : (user ? '/dashboard' : '/'))}
            className="text-slate-600 hover:text-slate-900 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Voltar
          </Button>
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Novo Pedido de Compra
          </Badge>
        </div>

        <Card className="p-6 md:p-8 space-y-8 bg-white border border-slate-200/80 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-600 text-white flex items-center justify-center">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Realizar Pedido de Compra</h2>
            </div>
            <p className="text-slate-500 text-sm">
              Preencha os dados da turma e adicione todos os itens necessários para a solicitação.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Informações Gerais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-green-600" /> Curso
                </label>
                <Input
                  placeholder="Ex: Eletrotécnica, Mecânica, Informática..."
                  value={curso}
                  onChange={(e: any) => setCurso(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <Users2 className="w-4 h-4 text-green-600" /> Turma
                </label>
                <Input
                  placeholder="Ex: ELE-2026-1, MEC-NOITE-02..."
                  value={turma}
                  onChange={(e: any) => setTurma(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Lista Dinâmica de Itens */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <label className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-green-600" /> Itens Solicitados
                </label>
                <span className="text-xs text-slate-400 font-medium">
                  {items.length} {items.length === 1 ? 'item' : 'itens'} adicionado(s)
                </span>
              </div>

              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <span>Item #{idx + 1}</span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remover
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-6 space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Descrição do Item</label>
                        {availableItems.length > 0 ? (
                          <>
                            <input
                              list={`items-list-${idx}`}
                              value={item.item_name}
                              onChange={(e) => handleItemChange(idx, 'item_name', e.target.value)}
                              placeholder="Selecione ou digite o nome do item..."
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-green-500"
                              required
                            />
                            <datalist id={`items-list-${idx}`}>
                              {availableItems.map((opt, i) => (
                                <option key={i} value={opt} />
                              ))}
                            </datalist>
                          </>
                        ) : (
                          <input
                            type="text"
                            value={item.item_name}
                            onChange={(e) => handleItemChange(idx, 'item_name', e.target.value)}
                            placeholder="Ex: Alicate de corte, Multímetro..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-green-500"
                            required
                          />
                        )}
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Qtd.</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-green-500 text-center font-bold"
                          required
                        />
                      </div>

                      <div className="sm:col-span-4 space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Motivo</label>
                        {availableReasons.length > 0 ? (
                          <>
                            <input
                              list={`reasons-list-${idx}`}
                              value={item.reason}
                              onChange={(e) => handleItemChange(idx, 'reason', e.target.value)}
                              placeholder="Motivo do pedido..."
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-green-500"
                            />
                            <datalist id={`reasons-list-${idx}`}>
                              {availableReasons.map((r, i) => (
                                <option key={i} value={r} />
                              ))}
                            </datalist>
                          </>
                        ) : (
                          <input
                            type="text"
                            value={item.reason}
                            onChange={(e) => handleItemChange(idx, 'reason', e.target.value)}
                            placeholder="Ex: Aula prática módulo 2..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-green-500"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="secondary"
                onClick={handleAddItemRow}
                className="w-full py-3 border-dashed border-2 border-slate-200 text-slate-600 hover:text-green-700 hover:border-green-300 hover:bg-green-50/50 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all"
              >
                <Plus className="w-4 h-4" /> Adicionar Outro Item
              </Button>
            </div>

            {/* Seção Item Não Encontrado (Novo Item) */}
            <div className="pt-2">
              <div
                onClick={() => setShowNewItemSection(!showNewItemSection)}
                className="flex items-center gap-3 p-4 bg-amber-50/70 border border-amber-200 rounded-2xl cursor-pointer hover:bg-amber-50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={showNewItemSection}
                  onChange={(e) => setShowNewItemSection(e.target.checked)}
                  className="w-5 h-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <div>
                  <p className="font-bold text-amber-900 text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" /> Item não encontrado na lista? Solicitar novo item
                  </p>
                  <p className="text-xs text-amber-700">
                    Marque para incluir uma descrição detalhada e foto de um material que ainda não está cadastrado.
                  </p>
                </div>
              </div>

              <AnimatePresence>
                {showNewItemSection && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 p-5 bg-white border border-amber-200 rounded-2xl space-y-4 shadow-sm">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Descrição detalhada do novo item
                        </label>
                        <textarea
                          rows={3}
                          value={newItemDescription}
                          onChange={(e) => setNewItemDescription(e.target.value)}
                          placeholder="Informe marca, especificações técnicas, dimensões ou detalhes importantes para o comprador cotar o item correto..."
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white resize-none"
                        />
                      </div>

                      {/* Photo Upload */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-amber-600" /> Foto do Item (Opcional)
                        </label>

                        {newItemPhotoUrl ? (
                          <div className="relative inline-block border border-slate-200 rounded-2xl overflow-hidden group">
                            <img
                              src={newItemPhotoUrl}
                              alt="Foto do item"
                              className="w-48 h-36 object-cover rounded-2xl"
                            />
                            <button
                              type="button"
                              onClick={() => setNewItemPhotoUrl('')}
                              className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-600 text-white rounded-xl transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 hover:border-amber-400 hover:bg-amber-50/30 rounded-2xl cursor-pointer transition-all">
                            <Camera className="w-8 h-8 text-slate-400 mb-1" />
                            <span className="text-xs font-semibold text-slate-600">
                              {uploadingPhoto ? 'Enviando foto...' : 'Clique para tirar uma foto ou carregar arquivo'}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={handlePhotoUpload}
                              className="hidden"
                              disabled={uploadingPhoto}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => onNavigate('/compras')}
                className="flex-1 py-3.5"
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg shadow-green-200"
                disabled={submitting}
              >
                {submitting ? 'Enviando Pedido...' : 'Enviar Pedido de Compra'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

// =====================================================================
// BuyerCsvModal — Upload de CSV de Itens (SENAI) para Compradores
// =====================================================================

interface BuyerCsvModalProps {
  user: UserProfile | null;
  token: string | null;
  onClose: () => void;
  showMessage: (type: 'success' | 'error', text: string) => void;
  onItemsUpdated?: () => void;
}

const BuyerCsvModal: React.FC<BuyerCsvModalProps> = ({
  user,
  token,
  onClose,
  showMessage,
  onItemsUpdated
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [senaiItems, setSenaiItems] = useState<SenaiItem[]>([]);
  const [meta, setMeta] = useState<SenaiItemsMeta>({});
  const [loadingItems, setLoadingItems] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');

  // Mode and Conflict states
  const [uploadMode, setUploadMode] = useState<'replace' | 'merge'>('replace');
  const [conflictsData, setConflictsData] = useState<{
    conflicts: any[];
    newItemsCount: number;
    totalCsvItems: number;
  } | null>(null);

  const fetchCurrentItems = async () => {
    setLoadingItems(true);
    try {
      const res = await fetch('/api/purchases/items');
      const data = await res.json();
      if (data && Array.isArray(data.items)) {
        setSenaiItems(data.items);
        setMeta(data.meta || {});
      } else if (Array.isArray(data)) {
        setSenaiItems(data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    fetchCurrentItems();
  }, []);

  const executeUpload = async (mode: 'replace' | 'merge', resolveConflicts: 'check' | 'overwrite' | 'ignore' = 'check') => {
    if (!file) {
      showMessage('error', 'Selecione um arquivo CSV para fazer o upload');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', mode);
      formData.append('resolveConflicts', resolveConflicts);

      const res = await fetch('/api/purchases/upload-items', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();

      if (res.ok && data.hasConflicts) {
        setConflictsData({
          conflicts: data.conflicts || [],
          newItemsCount: data.newItemsCount || 0,
          totalCsvItems: data.totalCsvItems || 0
        });
        setUploading(false);
        return;
      }

      if (res.ok && data.success) {
        showMessage('success', data.message || `${data.count} itens do SENAI importados com sucesso!`);
        fetchCurrentItems();
        if (onItemsUpdated) onItemsUpdated();
        setFile(null);
        setConflictsData(null);
      } else {
        showMessage('error', data.error || 'Erro ao processar arquivo CSV');
      }
    } catch {
      showMessage('error', 'Erro ao conectar ao servidor para enviar o CSV');
    } finally {
      setUploading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeUpload(uploadMode, 'check');
  };

  const filteredItems = senaiItems.filter(item => {
    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase();
    return (
      (item.full_name && item.full_name.toLowerCase().includes(term)) ||
      (item.codigo && item.codigo.toLowerCase().includes(term)) ||
      (item.descricao && item.descricao.toLowerCase().includes(term)) ||
      (item.fornecedor && item.fornecedor.toLowerCase().includes(term))
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100"
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Upload className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Gestão de Itens Disponíveis (SENAI)</h3>
              <p className="text-xs text-blue-200">
                Upload de CSV com catálogo de itens vigentes para solicitações
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Conflict Warning Screen */}
          {conflictsData ? (
            <div className="space-y-5">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-950 space-y-1">
                  <p className="font-bold text-sm">
                    {conflictsData.conflicts.length} Conflito(s) Encontrado(s) na Base
                  </p>
                  <p>
                    O sistema identificou itens no CSV enviado que já possuem cadastro ativo ou código idêntico no banco de dados.
                  </p>
                  <p className="text-slate-600 font-medium pt-1">
                    Itens novos inéditos: <span className="font-bold text-slate-800">{conflictsData.newItemsCount}</span> | Conflitos: <span className="font-bold text-amber-800">{conflictsData.conflicts.length}</span>
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Lista de Conflitos para Decisão
                </h4>
                <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 bg-slate-50/50 p-2">
                  {conflictsData.conflicts.map((conf, idx) => (
                    <div key={idx} className="p-3 text-xs space-y-1 bg-white rounded-xl mb-2 border border-slate-100 shadow-sm">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>Código / Item: {conf.codigo || 'Sem código'}</span>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] rounded-md uppercase">
                          Conflito
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                        <div className="p-2 bg-red-50/60 rounded-lg border border-red-100">
                          <p className="font-bold text-red-900">Atual no Sistema:</p>
                          <p className="text-slate-700 truncate">{conf.existing?.full_name}</p>
                          <p className="text-slate-500">{conf.existing?.fornecedor ? `Fornecedor: ${conf.existing.fornecedor}` : ''}</p>
                        </div>
                        <div className="p-2 bg-blue-50/60 rounded-lg border border-blue-100">
                          <p className="font-bold text-blue-900">Novo no CSV:</p>
                          <p className="text-slate-700 truncate">{conf.incoming?.full_name}</p>
                          <p className="text-slate-500">{conf.incoming?.fornecedor ? `Fornecedor: ${conf.incoming.fornecedor}` : ''}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => executeUpload('merge', 'overwrite')}
                  disabled={uploading}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 text-xs rounded-xl flex-1"
                >
                  <RefreshCw className={cn("w-4 h-4 mr-1.5", uploading && "animate-spin")} />
                  Substituir Conflitos e Salvar
                </Button>
                <Button
                  onClick={() => executeUpload('merge', 'ignore')}
                  disabled={uploading}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 text-xs rounded-xl flex-1"
                >
                  Ignorar Conflitos e Manter Atuais
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setConflictsData(null)}
                  disabled={uploading}
                  className="text-xs font-bold py-3 px-4 rounded-xl"
                >
                  Voltar
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Info Notice */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 space-y-1">
                  <p className="font-bold">Filtro de Entidade: Exclusivo SENAI</p>
                  <p>
                    O sistema processa o arquivo CSV e armazena <strong>apenas os itens do SENAI</strong> (coluna ENTIDADE indicando SENAI). Demais linhas são ignoradas.
                  </p>
                </div>
              </div>

              {/* Current Status Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center font-bold text-lg">
                    {meta.totalSenaiItems || senaiItems.length}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Itens do SENAI Cadastrados</p>
                    <p className="text-sm font-bold text-slate-800">
                      {senaiItems.length} itens ativos
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Última Atualização</p>
                    <p className="text-xs font-bold text-slate-800">
                      {meta.last_updated
                        ? new Date(meta.last_updated).toLocaleString('pt-BR')
                        : 'Base padrão carregada'}
                    </p>
                    {meta.updatedBy && (
                      <p className="text-[11px] text-slate-500">Por: {meta.updatedBy}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Upload Mode Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Modo de Importação
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUploadMode('replace')}
                    className={cn(
                      "p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between",
                      uploadMode === 'replace'
                        ? "border-red-500 bg-red-50/50 ring-2 ring-red-500/20"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    )}
                  >
                    <div className="flex items-center justify-between font-bold text-xs text-slate-900 mb-1">
                      <span>🔴 Substituir Base Atual</span>
                      {uploadMode === 'replace' && <Check className="w-4 h-4 text-red-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Zera o cadastro existente e importa todos os itens do CSV do zero.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUploadMode('merge')}
                    className={cn(
                      "p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between",
                      uploadMode === 'merge'
                        ? "border-green-600 bg-green-50/50 ring-2 ring-green-600/20"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    )}
                  >
                    <div className="flex items-center justify-between font-bold text-xs text-slate-900 mb-1">
                      <span>🟢 Adicionar e Mesclar</span>
                      {uploadMode === 'merge' && <Check className="w-4 h-4 text-green-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Mantém os itens atuais e adiciona os novos itens do CSV.
                    </p>
                  </button>
                </div>
              </div>

              {/* Form Upload */}
              <form onSubmit={handleFormSubmit} className="space-y-3 pt-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Enviar Arquivo CSV (.csv)
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-slate-200 rounded-xl cursor-pointer"
                  />
                  <Button
                    type="submit"
                    disabled={!file || uploading}
                    className={cn(
                      "font-bold py-2.5 px-5 text-xs rounded-xl shrink-0 text-white",
                      uploadMode === 'replace' ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                    )}
                  >
                    <Upload className={cn("w-4 h-4 mr-1.5", uploading && "animate-spin")} />
                    {uploading ? 'Processando...' : uploadMode === 'replace' ? 'Zerar e Subir Nova Base' : 'Adicionar Novos Itens'}
                  </Button>
                </div>
                {file && (
                  <p className="text-xs text-slate-500">
                    Arquivo selecionado: <span className="font-semibold text-slate-800">{file.name}</span> ({(file.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </form>

              {/* Current Registered Items Preview */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" /> Itens Disponíveis SENAI ({filteredItems.length})
                  </h4>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por código, descrição ou fornecedor..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 bg-slate-50/50">
                  {loadingItems ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      Carregando catálogo de itens...
                    </div>
                  ) : filteredItems.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      Nenhum item do SENAI encontrado.
                    </div>
                  ) : (
                    filteredItems.map((item, idx) => (
                      <div key={idx} className="p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-100/80 transition-colors">
                        <div>
                          <p className="font-bold text-slate-800">{item.full_name}</p>
                          <p className="text-[11px] text-slate-500">
                            {item.fornecedor ? `Fornecedor: ${item.fornecedor}` : ''} {item.contrato ? `| Contrato: ${item.contrato}` : ''}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md uppercase shrink-0 border border-blue-100 self-start sm:self-auto">
                          {item.entidade || 'SENAI'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <Button variant="secondary" onClick={onClose} className="text-xs font-bold px-5">
            Fechar
          </Button>
        </div>
      </motion.div>
    </div>
  );
};


// =====================================================================
// PurchaseTrackingView — Acompanhamento de Compras (/compras/acompanhamento)
// =====================================================================

export const PurchaseTrackingView: React.FC<PurchasesProps> = ({
  user,
  token,
  onNavigate,
  showMessage
}) => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [testingEmail, setTestingEmail] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);


  const canAttend = hasModuleAccess(user, 'compras_atender');
  const canRequest = hasModuleAccess(user, 'compras_solicitar');

  const handleTestEmail = async () => {
    setTestingEmail(true);
    try {
      const res = await fetch('/api/purchases/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (res.ok) {
        showMessage('success', data.message || 'E-mail de teste enviado com sucesso!');
      } else {
        showMessage('error', data.error || 'Erro ao enviar e-mail de teste');
      }
    } catch {
      showMessage('error', 'Erro ao conectar com o servidor para teste de e-mail');
    } finally {
      setTestingEmail(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/purchases', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch {
      showMessage('error', 'Erro ao carregar lista de compras');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === 'todos' || order.status === statusFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      order.curso.toLowerCase().includes(term) ||
      order.turma.toLowerCase().includes(term) ||
      order.requester_name.toLowerCase().includes(term) ||
      (order.fluig_number && order.fluig_number.toLowerCase().includes(term)) ||
      String(order.numeric_id || '').includes(term) ||
      order.items.some(i => i.item_name.toLowerCase().includes(term));

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => onNavigate(hasModuleAccess(user, 'compras') ? '/compras' : (user ? '/dashboard' : '/'))}
              className="text-slate-600 hover:text-slate-900 -ml-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-green-600" /> Acompanhamento de Compras
              </h1>
              <p className="text-xs text-slate-500">
                {canAttend ? 'Visão do Comprador — Atendimento, Cotação Fluig e Gestão de Pedidos' : 'Visão do Solicitante — Acompanhe o histórico e andamento das suas solicitações'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {(canAttend || user?.role === 'admin') && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowCsvModal(true)}
                  className="text-xs font-bold py-2 px-3.5 h-auto text-blue-800 border-blue-300 bg-blue-50/70 hover:bg-blue-100 flex items-center gap-1.5 shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  Upload CSV (Itens SENAI)
                </Button>

                <Button
                  variant="outline"
                  onClick={handleTestEmail}
                  disabled={testingEmail}
                  className="text-xs font-bold py-2 px-3 h-auto text-green-800 border-green-300 hover:bg-green-50"
                >
                  <Mail className={cn("w-3.5 h-3.5", testingEmail && "animate-pulse")} />
                  {testingEmail ? 'Testando...' : 'Testar E-mails Compradores'}
                </Button>
              </>
            )}

            <Button
              variant="secondary"
              onClick={fetchOrders}
              className="text-xs font-bold py-2 px-3 h-auto"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} /> Atualizar
            </Button>


            {canRequest && (
              <Button
                onClick={() => onNavigate('/compras/novo')}
                className="text-xs font-bold py-2 px-3.5 h-auto bg-green-600 hover:bg-green-700 text-white"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Novo Pedido
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
        {/* Filters and Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-7 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por curso, turma, solicitante, item ou Fluig..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
            />
          </div>

          <div className="md:col-span-5 flex gap-2 overflow-x-auto pb-1 md:pb-0">
            {['todos', 'pendente', 'em_andamento', 'concluido'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={cn(
                  "px-4 py-2.5 rounded-2xl text-xs font-bold uppercase transition-all whitespace-nowrap border shadow-sm",
                  statusFilter === st
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
              >
                {st === 'todos' ? 'Todos' : STATUS_CONFIG[st]?.label || st}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="text-center py-20">
            <RefreshCw className="w-8 h-8 text-green-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500">Carregando pedidos de compra...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card className="p-12 text-center space-y-4 max-w-md mx-auto">
            <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
              <ShoppingCart className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-800">Nenhum pedido encontrado</h3>
              <p className="text-xs text-slate-500">
                Não há pedidos correspondentes aos filtros aplicados.
              </p>
            </div>
            {canRequest && (
              <Button onClick={() => onNavigate('/compras/novo')} className="text-xs py-2 bg-green-600 hover:bg-green-700">
                <PlusCircle className="w-4 h-4" /> Criar Primeiro Pedido
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map((order) => {
              const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pendente;
              return (
                <motion.div
                  key={order.id}
                  whileHover={{ y: -2 }}
                  onClick={() => setSelectedOrder(order)}
                  className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black text-slate-900 text-sm tracking-tight">
                        Pedido #{order.numeric_id || order.id.substring(0, 6)}
                      </span>
                      <span
                        className={cn(
                          "px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border",
                          statusCfg.bg,
                          statusCfg.text,
                          statusCfg.border
                        )}
                      >
                        {statusCfg.label}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 text-base line-clamp-1">{order.curso}</h3>
                      <p className="text-xs text-slate-500 font-medium">Turma: {order.turma}</p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl space-y-2 border border-slate-100">
                      <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-bold text-slate-700">
                        <span>{order.items.length} {order.items.length === 1 ? 'item' : 'itens'}</span>
                        <div className="flex items-center gap-1.5">
                          {order.fluig_number && (
                            <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[10px] font-bold">
                              Fluig: {order.fluig_number}
                            </span>
                          )}
                          {!order.buyer_id ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Aguardando Comprador
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-green-100 text-green-800 border border-green-200 inline-flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-green-700" /> {order.buyer_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {order.items.map(i => `${i.quantity}x ${i.item_name}`).join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      <span className="font-medium truncate max-w-[120px]">{order.requester_name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(order.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modais: Detalhes do Pedido e Upload de CSV */}
      <AnimatePresence>
        {selectedOrder && (
          <PurchaseDetailModal
            order={selectedOrder}
            user={user}
            token={token}
            onClose={() => setSelectedOrder(null)}
            onUpdated={(updated) => {
              setSelectedOrder(updated);
              fetchOrders();
            }}
            showMessage={showMessage}
          />
        )}
        {showCsvModal && (
          <BuyerCsvModal
            user={user}
            token={token}
            onClose={() => setShowCsvModal(false)}
            showMessage={showMessage}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

// =====================================================================
// PurchaseDetailModal — Modal de Atendimento & Detalhes
// =====================================================================

interface DetailModalProps {
  order: PurchaseOrder;
  user: UserProfile | null;
  token: string | null;
  onClose: () => void;
  onUpdated: (updated: PurchaseOrder) => void;
  showMessage: (type: 'success' | 'error', text: string) => void;
}

const PurchaseDetailModal: React.FC<DetailModalProps> = ({
  order,
  user,
  token,
  onClose,
  onUpdated,
  showMessage
}) => {
  const [fluigNumber, setFluigNumber] = useState(order.fluig_number || '');
  const [savingFluig, setSavingFluig] = useState(false);

  const [message, setMessage] = useState('');
  const [sendingUpdate, setSendingUpdate] = useState(false);
  const [requestingProgress, setRequestingProgress] = useState(false);
  const [togglingEmail, setTogglingEmail] = useState(false);
  const [claimingOrder, setClaimingOrder] = useState(false);

  const canAttend = hasModuleAccess(user, 'compras_atender');
  const canRequest = hasModuleAccess(user, 'compras_solicitar');

  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pendente;

  const handleClaimOrder = async () => {
    setClaimingOrder(true);
    try {
      const res = await fetch(`/api/purchases/${order.id}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({})
      });

      const data = await res.json();
      if (res.ok) {
        showMessage('success', 'Você assumiu a responsabilidade por este pedido!');
        if (data.order) {
          onUpdated(data.order);
        }
      } else {
        showMessage('error', data.error || 'Erro ao assumir pedido');
      }
    } catch {
      showMessage('error', 'Erro ao conectar ao servidor');
    } finally {
      setClaimingOrder(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/purchases/${order.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();
      if (res.ok) {
        showMessage('success', `Status alterado para ${newStatus.toUpperCase()}`);
        onUpdated({ ...order, status: newStatus as any });
      } else {
        showMessage('error', data.error || 'Erro ao atualizar status');
      }
    } catch {
      showMessage('error', 'Erro ao conectar ao servidor');
    }
  };

  const handleSaveFluig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingFluig(true);
    try {
      const res = await fetch(`/api/purchases/${order.id}/update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fluig_number: fluigNumber })
      });

      if (res.ok) {
        showMessage('success', 'Número do Fluig salvo com sucesso!');
        onUpdated({ ...order, fluig_number: fluigNumber });
      } else {
        showMessage('error', 'Erro ao salvar número do Fluig');
      }
    } catch {
      showMessage('error', 'Erro ao comunicar com o servidor');
    } finally {
      setSavingFluig(false);
    }
  };

  const handleSendInformativo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSendingUpdate(true);
    try {
      const res = await fetch(`/api/purchases/${order.id}/update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: message.trim(),
          fluig_number: fluigNumber || undefined
        })
      });

      if (res.ok) {
        showMessage('success', 'Atualização enviada por e-mail ao solicitante!');
        setMessage('');
        // Refresh order data
        const getRes = await fetch(`/api/purchases/${order.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (getRes.ok) {
          const fresh = await getRes.json();
          onUpdated(fresh);
        }
      } else {
        showMessage('error', 'Erro ao enviar informativo');
      }
    } catch {
      showMessage('error', 'Erro ao conectar ao servidor');
    } finally {
      setSendingUpdate(false);
    }
  };

  const handleRequestProgress = async () => {
    setRequestingProgress(true);
    try {
      const res = await fetch(`/api/purchases/${order.id}/request-update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        showMessage('success', 'Solicitação de andamento enviada aos compradores!');
        const getRes = await fetch(`/api/purchases/${order.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (getRes.ok) {
          const fresh = await getRes.json();
          onUpdated(fresh);
        }
      } else {
        showMessage('error', 'Erro ao solicitar andamento');
      }
    } catch {
      showMessage('error', 'Erro ao conectar ao servidor');
    } finally {
      setRequestingProgress(false);
    }
  };

  const handleToggleEmailPause = async () => {
    setTogglingEmail(true);
    try {
      const res = await fetch(`/api/purchases/${order.id}/pause-emails`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        showMessage('success', data.email_paused ? 'Envio de e-mails pausado para este pedido' : 'Envio de e-mails reativado');
        onUpdated({ ...order, email_paused: data.email_paused });
      }
    } catch {
      showMessage('error', 'Erro ao alterar configuração de e-mail');
    } finally {
      setTogglingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 z-50 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="max-w-3xl w-full my-auto"
      >
        <Card className="p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto bg-white rounded-3xl border border-slate-200 shadow-2xl">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Pedido #{order.numeric_id || order.id}
                </span>
                <span
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border",
                    statusCfg.bg,
                    statusCfg.text,
                    statusCfg.border
                  )}
                >
                  {statusCfg.label}
                </span>
              </div>
              <h2 className="text-2xl font-black text-slate-900">{order.curso}</h2>
              <p className="text-sm text-slate-600 font-medium">Turma: {order.turma}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Info Solicitante e Comprador */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
            <div className="space-y-1">
              <p className="font-bold text-slate-400 uppercase tracking-wider">Solicitante</p>
              <p className="font-bold text-slate-800 text-sm">{order.requester_name}</p>
              <p className="text-slate-500">{order.requester_email} • {order.requester_role}</p>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-slate-400 uppercase tracking-wider">Comprador Responsável</p>
              <p className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                {order.buyer_name ? (
                  <>
                    <UserCheck className="w-4 h-4 text-green-600" />
                    <span>{order.buyer_name}</span>
                  </>
                ) : (
                  <span className="text-amber-700 font-semibold bg-amber-100/80 px-2 py-0.5 rounded-md">
                    Ainda não atribuído (notificando todos)
                  </span>
                )}
              </p>
              <p className="text-slate-500">
                Criado em: {new Date(order.created_at).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          {/* Itens do Pedido */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-green-600" /> Itens do Pedido
            </h3>
            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{idx + 1}. {item.item_name}</span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-bold text-xs">
                        &times; {item.quantity}
                      </span>
                      {item.is_new_item && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md font-bold text-[10px] uppercase">
                          Novo Item
                        </span>
                      )}
                    </div>
                    {item.reason && (
                      <p className="text-xs text-slate-500">
                        <span className="font-semibold text-slate-600">Motivo:</span> {item.reason}
                      </p>
                    )}
                    {item.new_item_description && (
                      <p className="text-xs text-amber-800 bg-amber-50/70 p-2 rounded-xl border border-amber-200">
                        {item.new_item_description}
                      </p>
                    )}
                  </div>

                  {item.new_item_photo_url && (
                    <a
                      href={item.new_item_photo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-bold text-xs transition-colors shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Ver Foto
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Seção do Comprador: Status, Fluig e Ações */}
          {canAttend && (
            <div className="p-5 bg-green-50/50 border border-green-200 rounded-2xl space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="font-bold text-green-900 text-sm uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4 text-green-700" /> Painel do Comprador (Atendimento & Aprovação)
                </h4>
                <button
                  type="button"
                  onClick={handleToggleEmailPause}
                  disabled={togglingEmail}
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-sm"
                >
                  {order.email_paused ? (
                    <>
                      <BellOff className="w-3.5 h-3.5 text-red-500" /> E-mails Pausados (Reativar)
                    </>
                  ) : (
                    <>
                      <Bell className="w-3.5 h-3.5 text-green-600" /> E-mails Ativos (Pausar)
                    </>
                  )}
                </button>
              </div>

              {/* Atribuição de Comprador Banner */}
              {!order.buyer_id ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-amber-900">Pedido aguardando comprador responsável</p>
                      <p className="text-xs text-amber-700">Todos os compradores estão sendo notificados por e-mail até que alguém assuma o atendimento deste pedido.</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={handleClaimOrder}
                    disabled={claimingOrder}
                    className="text-xs py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold shrink-0 shadow-sm"
                  >
                    <UserCheck className="w-4 h-4" /> {claimingOrder ? 'Assumindo...' : 'Assumir Pedido'}
                  </Button>
                </div>
              ) : (
                <div className="p-3 bg-white/90 border border-green-200 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-green-600" />
                    <span className="text-slate-700 font-medium">
                      Comprador responsável: <strong className="text-slate-900">{order.buyer_name}</strong>
                    </span>
                  </div>
                  {user?.id !== order.buyer_id && (
                    <button
                      type="button"
                      onClick={handleClaimOrder}
                      disabled={claimingOrder}
                      className="text-[11px] text-green-700 hover:underline font-bold"
                    >
                      {claimingOrder ? 'Transferindo...' : 'Transferir responsabilidade para mim'}
                    </button>
                  )}
                </div>
              )}

              {/* Status Actions */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Alterar Status do Pedido</label>
                <div className="flex flex-wrap gap-2">
                  {order.status === 'pendente' && (
                    <Button
                      type="button"
                      onClick={() => handleUpdateStatus('ciente')}
                      className="text-xs py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                    >
                      Marcar como Ciente
                    </Button>
                  )}
                  {order.status !== 'em_andamento' && order.status !== 'concluido' && (
                    <Button
                      type="button"
                      onClick={() => handleUpdateStatus('em_andamento')}
                      className="text-xs py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                    >
                      Marcar como Em Andamento
                    </Button>
                  )}
                  {order.status !== 'concluido' && (
                    <Button
                      type="button"
                      onClick={() => handleUpdateStatus('concluido')}
                      className="text-xs py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                      Concluir Pedido
                    </Button>
                  )}
                  {order.status !== 'cancelado' && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleUpdateStatus('cancelado')}
                      className="text-xs py-2 px-3 text-red-600 hover:bg-red-50 font-bold"
                    >
                      Cancelar Pedido
                    </Button>
                  )}
                </div>
              </div>

              {/* Fluig Form */}
              <form onSubmit={handleSaveFluig} className="flex gap-2 items-center pt-2 border-t border-green-100">
                <div className="flex-1">
                  <Input
                    placeholder="Número do Fluig (Ex: 123456)"
                    value={fluigNumber}
                    onChange={(e: any) => setFluigNumber(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={savingFluig}
                  className="font-bold text-xs py-3"
                >
                  {savingFluig ? 'Salvando...' : 'Salvar Fluig'}
                </Button>
              </form>

              {/* Enviar Informativo */}
              <form onSubmit={handleSendInformativo} className="space-y-2 pt-2 border-t border-green-100">
                <label className="text-xs font-bold text-slate-700 uppercase">Enviar Atualização ao Solicitante</label>
                <textarea
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ex: Cotação aprovada, aguardando faturamento do fornecedor..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={sendingUpdate || !message.trim()}
                    className="text-xs py-2 px-4 bg-green-700 hover:bg-green-800 text-white font-bold"
                  >
                    <Send className="w-3.5 h-3.5" /> Enviar Informativo por E-mail
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Ação e Informação do Solicitante: Apenas Leitura e Solicitação de Posição */}
          {!canAttend && (
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl space-y-3">
              <div className="flex items-start gap-2.5">
                <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-indigo-950">
                    Acompanhamento do Pedido (Visão do Solicitante)
                  </p>
                  <p className="text-[11px] text-indigo-800 leading-relaxed mt-0.5">
                    Você pode acompanhar o andamento, itens e histórico. Por diretriz de segregação de funções, a cotação, inserção de Fluig e aprovação são executados exclusivamente pelo setor de compras.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-indigo-100">
                <span className="text-xs text-indigo-900 font-medium">Precisa de uma posição atualizada deste pedido?</span>
                <Button
                  type="button"
                  onClick={handleRequestProgress}
                  disabled={requestingProgress}
                  className="text-xs py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shrink-0"
                >
                  <Send className="w-3.5 h-3.5" /> {requestingProgress ? 'Enviando...' : 'Solicitar Posição aos Compradores'}
                </Button>
              </div>
            </div>
          )}

          {/* Timeline de Atualizações */}
          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-500" /> Histórico de Atualizações
            </h3>

            {order.updates && order.updates.length > 0 ? (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {order.updates.map((upd) => (
                  <div
                    key={upd.id}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="font-bold text-slate-800">
                        {upd.author_name} ({upd.author_role})
                      </span>
                      <span>{new Date(upd.created_at).toLocaleString('pt-BR')}</span>
                    </div>
                    <p className="text-slate-700 whitespace-pre-wrap">{upd.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Nenhuma atualização registrada ainda.</p>
            )}
          </div>

          {/* Close */}
          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <Button variant="secondary" onClick={onClose} className="px-6">
              Fechar
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
