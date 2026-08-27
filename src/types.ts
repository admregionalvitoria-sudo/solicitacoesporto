// --- Shared Types ---

export type Role = 'admin' | 'tecnico' | 'assistente' | 'estagiario' | 'gestor' | 'analista' | 'supervisor' | 'comprador';
export type Status = 'aberto' | 'pendente' | 'em_atendimento' | 'concluido' | 'recusado';
export type Priority = 'baixo' | 'medio' | 'urgente';
export type Category = 'TI' | 'Manutenção' | 'Limpeza' | 'Supervisão' | 'Compras';
export type Department = 'TI' | 'Manutenção' | 'Limpeza' | 'Supervisão' | 'Compras';

export type AppModule = 
  | 'chamados'            // Dashboard Geral de Chamados (TI, Manutenção, Limpeza)
  | 'compras_solicitar'   // Apenas Solicitar Compras & Acompanhar Histórico/Andamento (Supervisor/Solicitante)
  | 'compras_atender'     // Atendimento, Cotação Fluig & Aprovação de Compras (Comprador)
  | 'compras'             // Aba Geral de Compras (Compatibilidade)
  | 'emprestimos'         // Empréstimos de Equipamentos
  | 'supervisao'          // Supervisão
  | 'agendamento'         // Agendamento de Ambientes
  | 'painel_aulas'        // Painel de Aulas
  | 'users';              // Gestão de Usuários (Admin)

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  unit?: string;
  departments?: Department[];
  allowed_modules?: AppModule[];
}

export interface AvailableModuleOption {
  id: AppModule;
  label: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  warning?: string;
}

export const AVAILABLE_MODULES: AvailableModuleOption[] = [
  { 
    id: 'chamados', 
    label: 'Dashboard de Chamados', 
    description: 'Visualizar e atender chamados de TI, Manutenção e Limpeza' 
  },
  { 
    id: 'compras_solicitar', 
    label: 'Solicitar Compras & Acompanhamento (Supervisor / Solicitante)', 
    description: 'Permite criar novos pedidos de compras para turmas/cursos e acompanhar histórico, status e solicitar andamento. NÃO permite alterar status, cotar Fluig ou aprovar pedidos.',
    badge: 'Apenas Solicitação & Acompanhamento',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200'
  },
  { 
    id: 'compras_atender', 
    label: 'Atendimento, Cotação Fluig & Aprovação de Compras (Comprador)', 
    description: 'Permite ao setor de compras atender pedidos, vincular número do Fluig, alterar status de entrega, aprovar e enviar informativos. (ATENÇÃO: Segregação de Funções - Quem solicita NÃO deve ter essa permissão).',
    badge: 'Atendimento & Aprovação (Comprador)',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    warning: 'Por conformidade (Segregação de Funções), o solicitante não pode aprovar ou atender a própria compra.'
  },
  { 
    id: 'emprestimos', 
    label: 'Empréstimos de Equipamentos', 
    description: 'Autorizar, liberar e receber devoluções de equipamentos de TI' 
  },
  { 
    id: 'supervisao', 
    label: 'Supervisão', 
    description: 'Gestão e chamados do setor de supervisão escolar' 
  },
  { 
    id: 'agendamento', 
    label: 'Agendamento de Ambientes', 
    description: 'Consulta e agendamento de salas, auditório e laboratórios' 
  },
  { 
    id: 'painel_aulas', 
    label: 'Painel de Aulas', 
    description: 'Visualização da grade de aulas e ambientes em tempo real' 
  },
  { 
    id: 'users', 
    label: 'Gestão de Usuários & Perfis', 
    description: 'Cadastrar novos usuários, redefinir senhas e gerenciar permissões de abas' 
  },
];

export function hasModuleAccess(user: UserProfile | null | undefined, module: AppModule): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;

  // If explicit allowed_modules array is set
  if (Array.isArray(user.allowed_modules) && user.allowed_modules.length > 0) {
    if (user.allowed_modules.includes(module)) return true;

    // Mapping for Compras tab in navigation:
    // If checking 'compras' (for sidebar/hub), allow if user has either solicitar or atender
    if (module === 'compras') {
      return user.allowed_modules.includes('compras_solicitar') ||
             user.allowed_modules.includes('compras_atender') ||
             user.allowed_modules.includes('compras');
    }

    // Mapping legacy 'compras' permission
    if (user.allowed_modules.includes('compras')) {
      if (module === 'compras_solicitar' && user.role !== 'comprador') return true;
      if (module === 'compras_atender' && user.role === 'comprador') return true;
    }

    return false;
  }

  // Role & Department Fallback defaults
  if (module === 'users') {
    return false;
  }
  if (module === 'compras_solicitar') {
    return user.role === 'supervisor' || user.role === 'gestor';
  }
  if (module === 'compras_atender') {
    return user.role === 'comprador' || (user.departments?.includes('Compras') ?? false);
  }
  if (module === 'compras') {
    return user.role === 'comprador' || user.role === 'supervisor' || user.role === 'gestor' || (user.departments?.includes('Compras') ?? false);
  }
  if (module === 'emprestimos') {
    return (user.departments?.includes('TI') ?? false) || user.role === 'gestor';
  }
  if (module === 'supervisao') {
    return user.role === 'supervisor' || (user.departments?.includes('Supervisão') ?? false);
  }
  if (module === 'chamados') {
    return user.role !== 'comprador';
  }
  if (module === 'agendamento' || module === 'painel_aulas') {
    return true;
  }
  return false;
}

export interface Comment {
  id: string;
  author_name: string;
  author_role: string;
  message: string;
  created_at: string;
}

export interface Loan {
  id: string;
  requester_name: string;
  registration: string;
  email: string;
  phone: string;
  equipment: string;
  location: string;
  reason: string;
  status: 'pendente' | 'autorizado' | 'liberado' | 'em_uso' | 'concluido' | 'recusado';

  // Autorização
  terms?: string;
  pin?: string;
  authorized_by?: string;
  authorized_at?: string;

  // Reprovação
  rejected_by?: string;
  rejected_at?: string;
  rejection_reason?: string;

  // Assinatura / liberação
  signature_name?: string;
  signature_registration?: string;
  signature_email?: string;
  signature_date?: string;   // ISO, timestamp do servidor
  released_at?: string;

  // Checklists
  checklist_initial?: string;
  checklist_initial_at?: string;
  checklist_return?: string;
  checklist_return_at?: string;

  // Devolução
  return_condition?: 'sim' | 'nao';
  return_problem?: string;
  completed_by?: string;
  completed_at?: string;
  completed_via?: 'pin' | 'gestor_manual';

  created_at: string;
  logs: { action: string; user: string; timestamp: string; details?: string }[];
}

export interface Ticket {
  id: string;
  numeric_id?: number;
  unit?: 'PORTO';
  requester_name: string;
  email?: string;
  phone: string;
  location?: string;
  equipment?: string;
  category?: Category;
  description?: string;
  priority: Priority;
  urgent_explanation?: string;
  status: Status;
  technician_name?: string;
  assigned_technician_id?: string;
  created_at: string;
  completed_at?: string;
  total_time_ms: number;
  last_status_change_at: string;
  comments?: Comment[];
  evidenceUrls?: string[];
  evidencePaths?: string[];
  registration?: string;
  reason?: string;
}

// --- Purchase Module Types ---

export interface SenaiItem {
  id: string;
  codigo: string;
  contrato: string;
  entidade: string;
  fornecedor: string;
  nome_fantasia: string;
  descricao: string;
  full_name: string;
  search_key?: string;
}

export interface SenaiItemsMeta {
  last_updated?: string;
  updated_by?: string;
  total_items?: number;
}

export interface PurchaseItem {
  item_name: string;           // vem do banco ou texto livre
  item_code?: string;          // código do produto FLUIG (opcional)
  contract_number?: string;    // contrato (opcional)
  quantity: number;
  reason: string;              // motivo puxado do banco ou informado
  is_new_item?: boolean;       // se é um novo item solicitado
  new_item_description?: string;
  new_item_photo_url?: string; // URL da foto (opcional)
  new_item_photo_path?: string;
  arrived?: boolean;           // Flag simples: se o item já chegou/entregue
  arrived_at?: string;         // Data/hora em que foi marcado como chegado
  arrived_by?: string;         // Nome do comprador que marcou
}


export interface PurchaseUpdate {
  id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  message: string;
  created_at: string;
}

export interface PurchaseOrder {
  id: string;
  numeric_id?: number;
  curso: string;
  turma: string;
  items: PurchaseItem[];
  status: 'pendente' | 'ciente' | 'em_andamento' | 'concluido' | 'cancelado';
  
  // Solicitante (supervisor)
  requester_id: string;
  requester_name: string;
  requester_email: string;
  requester_role: string;
  unit: string;
  
  // Comprador
  buyer_id?: string;
  buyer_name?: string;
  buyer_email?: string;
  fluig_number?: string;        // número do Fluig preenchido pelo comprador
  
  // Informativos/comentários
  updates: PurchaseUpdate[];
  
  // Controle de e-mail
  email_paused?: boolean;       // comprador pode pausar envio de e-mails
  last_email_sent_at?: string;
  last_buyer_email_sent_at?: string;
  
  created_at: string;
  updated_at: string;
}
