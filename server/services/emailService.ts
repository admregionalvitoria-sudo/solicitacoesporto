import { sendEmail } from "../config/email.js";
import { db, isDummyFirebase, localDb, collection, getDocs } from "../config/firebase.js";

export interface PurchaseEmailData {
  title: string;
  orderId: string | number;
  curso: string;
  turma: string;
  items?: any[];
  status: string;
  requesterName?: string;
  buyerName?: string;
  message?: string;
  actionUrl?: string;
}

export function buildPurchaseEmailHtml({
  title, orderId, curso, turma, items, status, requesterName, buyerName, message
}: PurchaseEmailData): string {
  const itemsHtml = items && items.length > 0 ? `
    <div style="margin: 20px 0;">
      <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Itens do Pedido:</h4>
      ${items.map((it: any, idx: number) => `
        <div style="background: #f1f5f9; padding: 10px 14px; border-radius: 6px; margin-bottom: 6px; font-size: 14px; color: #1e293b;">
          <strong>${idx + 1}. ${it.item_name}</strong> &times; ${it.quantity} un
          ${it.reason ? `<br/><span style="font-size: 12px; color: #64748b;">Motivo: ${it.reason}</span>` : ''}
          ${it.is_new_item && it.new_item_description ? `<br/><span style="font-size: 12px; color: #d97706;">[Novo Item] ${it.new_item_description}</span>` : ''}
        </div>
      `).join('')}
    </div>
  ` : '';

  return `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <div style="background: #15803d; padding: 18px 24px; border-radius: 8px; color: #ffffff; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 20px; color: #ffffff;">${title.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim()}</h2>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #dcfce7;">SENAI Porto — Pedido #${orderId}</p>
      </div>
      
      <p style="font-size: 15px; color: #334155; line-height: 1.6;">
        Notificação automática do Sistema de Gestão e Compras — SENAI Porto.
      </p>
      
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #16a34a; padding: 16px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Curso:</strong> ${curso || 'Não informado'}</p>
        <p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Turma:</strong> ${turma || 'Não informado'}</p>
        ${requesterName ? `<p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Solicitante:</strong> ${requesterName}</p>` : ''}
        ${buyerName ? `<p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Comprador Responsável:</strong> ${buyerName}</p>` : ''}
        <p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Status:</strong> <span style="background: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; text-transform: uppercase;">${(status || 'pendente').toUpperCase()}</span></p>
      </div>
      
      ${itemsHtml}

      ${message ? `
        <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 16px 0; border-radius: 0 4px 4px 0;">
          <p style="margin: 0; font-size: 14px; color: #334155; white-space: pre-wrap;">${message}</p>
        </div>
      ` : ''}

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 12px; color: #94a3b8; margin: 0; text-align: center;">
        Sistema de Solicitações & Compras — SENAI Porto
      </p>
    </div>
  `;
}

export async function getPurchaseRecipients() {
  let buyers: { email: string; name: string; id?: string; role?: string; departments?: string[] }[] = [];
  let managers: { email: string; name: string; id?: string }[] = [];

  const processUser = (u: any) => {
    if (!u || !u.email) return;
    const rawEmail = String(u.email).trim();
    const emailLower = rawEmail.toLowerCase();
    
    if (!emailLower.includes('@')) return;

    let depts: string[] = [];
    if (Array.isArray(u.departments)) {
      depts = u.departments.map((d: any) => String(d).trim());
    } else if (u.department) {
      depts = [String(u.department).trim()];
    } else if (typeof u.departments === 'string') {
      depts = [u.departments.trim()];
    }

    const deptsLower = depts.map(d => d.toLowerCase());
    const isDeptCompras = deptsLower.some(d => d === 'compras' || d.includes('compra') || d.includes('suprimento') || d.includes('almoxarifado'));
    
    const allowedModules: string[] = Array.isArray(u.allowed_modules) ? u.allowed_modules : [];
    const hasComprasAtender = allowedModules.includes('compras') || allowedModules.includes('compras_atender');
    
    const roleLower = String(u.role || '').toLowerCase().trim();
    const isBuyerRole = roleLower === 'comprador' || roleLower === 'compras';

    if (isBuyerRole || hasComprasAtender || (isDeptCompras && (roleLower === 'comprador' || roleLower === 'tecnico' || roleLower === 'analista' || roleLower === 'assistente' || roleLower === 'gestor'))) {
      if (!buyers.some(b => b.email.toLowerCase() === emailLower)) {
        buyers.push({ 
          email: rawEmail, 
          name: u.name || 'Comprador', 
          id: u.id, 
          role: u.role,
          departments: depts 
        });
      }
    }

    if (roleLower === 'gestor' && (isDeptCompras || deptsLower.some(d => d.includes('supervis')))) {
      if (!managers.some(m => m.email.toLowerCase() === emailLower)) {
        managers.push({ email: rawEmail, name: u.name || 'Gestor', id: u.id });
      }
    }
  };

  if (isDummyFirebase) {
    const allUsers = localDb.getUsers();
    allUsers.forEach(processUser);
  } else if (db) {
    try {
      const snap = await getDocs(collection(db, "users"));
      snap.docs.forEach(d => {
        const u = { id: d.id, ...d.data() };
        processUser(u);
      });
    } catch (e) {
      console.error("Error fetching purchase recipients from Firestore:", e);
    }
  }

  const envBuyers = (process.env.BUYERS_EMAILS || process.env.COMPRADORES_EMAILS || "")
    .split(",")
    .map(e => e.trim())
    .filter(e => e.includes("@"));

  envBuyers.forEach(email => {
    if (!buyers.some(b => b.email.toLowerCase() === email.toLowerCase())) {
      buyers.push({ email, name: "Comprador (ENV)" });
    }
  });

  if (buyers.length === 0) {
    const fallbackUser = (u: any) => {
      if (!u || !u.email) return;
      const rawEmail = String(u.email).trim();
      if (!rawEmail.includes('@')) return;
      const roleLower = String(u.role || '').toLowerCase().trim();
      if (roleLower === 'comprador' || roleLower === 'admin' || roleLower === 'gestor') {
        if (!buyers.some(b => b.email.toLowerCase() === rawEmail.toLowerCase())) {
          buyers.push({ email: rawEmail, name: u.name || u.role, id: u.id });
        }
      }
    };
    if (isDummyFirebase) {
      localDb.getUsers().forEach(fallbackUser);
    } else if (db) {
      try {
        const snap = await getDocs(collection(db, "users"));
        snap.docs.forEach(d => fallbackUser({ id: d.id, ...d.data() }));
      } catch (err) {}
    }
  }

  const defaultRecipients = ["dluiz@findes.org.br", "admregionalvitoria@gmail.com"];
  defaultRecipients.forEach(email => {
    if (!buyers.some(b => b.email.toLowerCase() === email.toLowerCase())) {
      buyers.push({ email, name: email.includes('dluiz') ? 'Davi Moreira Luiz' : 'Administrador', id: email });
    }
  });

  return { buyers, managers };
}

export function notifyManagerAboutNewLoan(loan: any) {
  const managerEmail = process.env.MANAGER_EMAIL;
  if (!managerEmail) {
    console.warn("⚠️ MANAGER_EMAIL não configurado nas variáveis de ambiente. Alerta de novo empréstimo não enviado.");
    return;
  }

  sendEmail({
    to: managerEmail,
    subject: `📋 Novo Empréstimo Solicitado: ${loan.equipment} - ${loan.requester_name}`,
    html: `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e1e1e1; border-radius: 12px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="text-align: center; border-bottom: 1px solid #eee; padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="color: #007bff; margin: 0; font-size: 22px;">Nova Solicitação de Empréstimo</h2>
        </div>
        <p>Um novo empréstimo foi solicitado no sistema de solicitações:</p>
        <div style="background-color: #f8f9fa; border-left: 4px solid #007bff; padding: 15px; margin: 15px 0; border-radius: 4px; font-size: 15px;">
          <p style="margin: 6px 0;"><strong>Equipamento:</strong> ${loan.equipment}</p>
          <p style="margin: 6px 0;"><strong>Solicitante:</strong> ${loan.requester_name} (${loan.registration})</p>
          <p style="margin: 6px 0;"><strong>E-mail:</strong> ${loan.email}</p>
          <p style="margin: 6px 0;"><strong>Telefone:</strong> ${loan.phone}</p>
          <p style="margin: 6px 0;"><strong>Local de Uso:</strong> ${loan.location}</p>
          <p style="margin: 6px 0;"><strong>Motivo:</strong> ${loan.reason}</p>
          <p style="margin: 6px 0;"><strong>Solicitado em:</strong> ${new Date(loan.created_at).toLocaleString('pt-BR')}</p>
        </div>
        <p>Acesse o painel administrativo da aplicação para aprovar ou reprovar esta solicitação.</p>
        <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 16px; font-size: 12px; color: #777; text-align: center;">
          <p>Este é um e-mail automático gerado pelo sistema de Gestão de Empréstimos.</p>
        </div>
      </div>
    `
  }).catch(e => console.error("Error sending manager notification:", e));
}

export function notifyUserAboutAuthorization(loan: any) {
  if (!loan.email) return;

  sendEmail({
    to: loan.email,
    subject: `✅ Empréstimo Aprovado: ${loan.equipment}`,
    html: `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e1e1e1; border-radius: 12px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="text-align: center; border-bottom: 1px solid #eee; padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="color: #28a745; margin: 0; font-size: 22px;">Sua Solicitação foi Aprovada!</h2>
        </div>
        <p>Olá <strong>${loan.requester_name}</strong>,</p>
        <p>O seu empréstimo para o equipamento <strong>${loan.equipment}</strong> foi autorizado pela gestão.</p>
        
        <p>Abaixo está o seu **PIN de Liberação** de 4 dígitos:</p>
        <div style="text-align: center; margin: 25px 0;">
          <div style="display: inline-block; background-color: #e8f5e9; border: 2px dashed #28a745; border-radius: 12px; padding: 15px 30px; font-family: monospace; font-size: 32px; font-weight: bold; color: #28a745; letter-spacing: 4px;">
            ${loan.pin}
          </div>
        </div>
        
        ${loan.terms ? `
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
          <strong style="display: block; margin-bottom: 8px; color: #555;">Termos e Condições do Empréstimo:</strong>
          <p style="margin: 0; font-size: 14px; color: #666; white-space: pre-wrap;">${loan.terms}</p>
        </div>
        ` : ''}

        <p>Acesse o acompanhamento de empréstimos públicos com sua matrícula <strong>${loan.registration}</strong>, confirme o PIN, assine os termos e preencha o checklist para retirar o equipamento.</p>
        <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 16px; font-size: 12px; color: #777; text-align: center;">
          <p>Este é um e-mail automático gerado pelo sistema de Gestão de Empréstimos.</p>
        </div>
      </div>
    `
  }).catch(e => console.error("Error sending user authorization notification:", e));
}

export function notifyNewTicket(ticket: any) {
  const targetEmail = "dluiz@findes.org.br";
  const idStr = ticket.numeric_id ? `#${ticket.numeric_id}` : `#${ticket.id}`;
  const category = ticket.category || "Geral";
  const equipmentOrReason = ticket.equipment || ticket.reason || ticket.description || "Solicitação";

  sendEmail({
    to: targetEmail,
    subject: `🆕 Novo Chamado ${idStr}: ${category} - ${equipmentOrReason}`,
    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <div style="background: #2563eb; padding: 18px 24px; border-radius: 8px; color: #ffffff; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 20px; color: #ffffff;">Novo Chamado ABERTO</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #dbeafe;">SENAI Porto — Chamado ${idStr}</p>
        </div>

        <p style="font-size: 15px; color: #334155; line-height: 1.6;">
          Uma nova solicitação foi criada no sistema de chamados.
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Chamado:</strong> ${idStr}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Solicitante:</strong> ${ticket.requester_name || 'Não informado'}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>E-mail:</strong> ${ticket.email || ticket.requester_email || 'Não informado'}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Matrícula:</strong> ${ticket.registration || 'Não informada'}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Telefone:</strong> ${ticket.phone || 'Não informado'}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Unidade:</strong> ${ticket.unit || ticket.department || 'PORTO'}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Ambiente/Local:</strong> ${ticket.location || ticket.room || 'Não informado'}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Categoria:</strong> ${category}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Prioridade:</strong> <span style="text-transform: uppercase; font-weight: bold; color: ${ticket.priority === 'urgente' ? '#dc2626' : ticket.priority === 'medio' ? '#d97706' : '#2563eb'};">${(ticket.priority || 'baixo').toUpperCase()}</span></p>
          ${ticket.equipment ? `<p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Equipamento/Item:</strong> ${ticket.equipment}</p>` : ''}
          ${ticket.urgent_explanation ? `<p style="margin: 4px 0; font-size: 14px; color: #dc2626;"><strong>Motivo Urgência:</strong> ${ticket.urgent_explanation}</p>` : ''}
        </div>

        <div style="background: #f1f5f9; padding: 14px; border-radius: 6px; margin: 16px 0;">
          <strong style="font-size: 13px; color: #475569; text-transform: uppercase; display: block; margin-bottom: 6px;">Descrição / Motivo:</strong>
          <p style="margin: 0; font-size: 14px; color: #1e293b; white-space: pre-wrap;">${ticket.description || ticket.reason || 'Sem descrição'}</p>
        </div>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8; margin: 0; text-align: center;">
          Notificação automática — Sistema de Solicitações Porto
        </p>
      </div>
    `
  }).catch(e => console.error("Error sending new ticket email to dluiz@findes.org.br:", e));
}

export function notifyTicketUpdateToRequester(ticket: any, updateInfo: {
  type: 'status' | 'priority' | 'comment' | 'assigned';
  oldVal?: string;
  newVal?: string;
  commentText?: string;
  authorName?: string;
}) {
  const recipientEmail = (ticket.email || ticket.requester_email || "").trim();
  if (!recipientEmail || !recipientEmail.includes("@")) {
    console.warn(`⚠️ [E-mail] Não há e-mail válido de solicitante para o chamado #${ticket.numeric_id || ticket.id}.`);
    return;
  }

  const idStr = ticket.numeric_id ? `#${ticket.numeric_id}` : `#${ticket.id}`;
  const category = ticket.category || "Geral";
  const titleItem = ticket.equipment || ticket.reason || category;
  
  const statusLabels: Record<string, string> = {
    aberto: 'Aberto',
    em_atendimento: 'Em Atendimento',
    pendente: 'Pendente',
    concluido: 'Concluído'
  };

  let updateSubject = `🔔 Atualização no Chamado ${idStr}: ${titleItem}`;
  let headerTitle = "Movimentação no Seu Chamado";
  let headerColor = "#2563eb";
  let updateMessage = "";

  if (updateInfo.type === 'status') {
    const newStatusLabel = statusLabels[updateInfo.newVal || ticket.status] || (updateInfo.newVal || ticket.status);
    if (updateInfo.newVal === 'concluido') {
      updateSubject = `✅ Chamado ${idStr} CONCLUÍDO: ${titleItem}`;
      headerTitle = "Seu Chamado Foi Concluído!";
      headerColor = "#16a34a";
      updateMessage = `O status do seu chamado ${idStr} foi alterado para <strong>CONCLUÍDO</strong>.`;
    } else {
      updateSubject = `🔄 Status Alterado: Chamado ${idStr} (${newStatusLabel})`;
      updateMessage = `O status do seu chamado ${idStr} foi atualizado para <strong>${newStatusLabel.toUpperCase()}</strong>.`;
    }
  } else if (updateInfo.type === 'comment') {
    updateSubject = `💬 Novo Comentário no Chamado ${idStr}`;
    updateMessage = `Uma nova mensagem/atualização foi adicionada ao seu chamado por <strong>${updateInfo.authorName || 'Técnico'}</strong>:`;
  } else if (updateInfo.type === 'assigned') {
    updateSubject = `👤 Técnico Atribuído ao Chamado ${idStr}`;
    updateMessage = `O técnico <strong>${updateInfo.newVal || 'Responsável'}</strong> assumiu o atendimento do seu chamado.`;
  } else if (updateInfo.type === 'priority') {
    updateSubject = `⚡ Prioridade Alterada no Chamado ${idStr}`;
    updateMessage = `A prioridade do seu chamado foi ajustada para <strong>${(updateInfo.newVal || ticket.priority).toUpperCase()}</strong>.`;
  }

  sendEmail({
    to: recipientEmail,
    subject: updateSubject,
    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <div style="background: ${headerColor}; padding: 18px 24px; border-radius: 8px; color: #ffffff; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 20px; color: #ffffff;">${headerTitle}</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #ffffff; opacity: 0.9;">SENAI Porto — Chamado ${idStr}</p>
        </div>

        <p style="font-size: 15px; color: #334155; line-height: 1.6;">
          Olá, <strong>${ticket.requester_name || 'Solicitante'}</strong>!
        </p>

        <div style="background: #f8fafc; border-left: 4px solid ${headerColor}; padding: 16px; margin: 16px 0; border-radius: 0 6px 6px 0; font-size: 15px; color: #1e293b;">
          ${updateMessage}
          ${updateInfo.commentText ? `
            <div style="background: #ffffff; border: 1px solid #cbd5e1; padding: 12px; border-radius: 6px; margin-top: 10px; font-style: italic; color: #334155;">
              "${updateInfo.commentText}"
            </div>
          ` : ''}
        </div>

        <div style="background: #f1f5f9; border: 1px solid #e2e8f0; padding: 16px; margin: 20px 0; border-radius: 8px;">
          <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Resumo da Solicitação:</h4>
          <p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Chamado:</strong> ${idStr}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Categoria:</strong> ${category}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Local/Ambiente:</strong> ${ticket.location || ticket.room || 'Não informado'}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Status Atual:</strong> <span style="font-weight: bold; color: ${headerColor}; uppercase;">${(statusLabels[ticket.status] || ticket.status || 'Pendente').toUpperCase()}</span></p>
          ${ticket.equipment ? `<p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Equipamento/Item:</strong> ${ticket.equipment}</p>` : ''}
        </div>

        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
          Você pode acompanhar o andamento da sua solicitação acessando o painel de Acompanhamento de Chamados com seu número de chamado <strong>${idStr}</strong>.
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8; margin: 0; text-align: center;">
          Notificação automática — Sistema de Solicitações Porto
        </p>
      </div>
    `
  }).catch(e => console.error(`Error sending update email to ${recipientEmail}:`, e));
}

