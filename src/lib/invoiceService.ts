import { supabase } from '@/integrations/supabase/client';

export interface Invoice {
  id: string;
  userId: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail?: string;
  clientAddress?: string;
  clientSiret?: string;
  amountHt: number;
  tvaRate: number;
  amountTtc: number;
  description?: string;
  issueDate: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  paidDate?: string;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceInput {
  invoiceNumber: string;
  clientName: string;
  clientEmail?: string;
  clientAddress?: string;
  clientSiret?: string;
  amountHt: number;
  tvaRate: number;
  description?: string;
  issueDate: string;
  dueDate: string;
  status?: Invoice['status'];
  notes?: string;
}

// Load all invoices for a user
export const loadInvoices = async (userId: string): Promise<Invoice[]> => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', userId)
    .order('issue_date', { ascending: false });

  if (error) {
    console.error('Error loading invoices:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    userId: row.user_id,
    invoiceNumber: row.invoice_number,
    clientName: row.client_name,
    clientEmail: row.client_email,
    clientAddress: row.client_address,
    clientSiret: row.client_siret,
    amountHt: Number(row.amount_ht) || 0,
    tvaRate: Number(row.tva_rate) || 0,
    amountTtc: Number(row.amount_ttc) || 0,
    description: row.description,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    status: row.status as Invoice['status'],
    paidDate: row.paid_date,
    paymentMethod: row.payment_method,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
};

// Create a new invoice
export const createInvoice = async (
  userId: string,
  input: InvoiceInput
): Promise<{ success: boolean; invoice?: Invoice; error?: string }> => {
  const amountTtc = input.amountHt * (1 + input.tvaRate / 100);

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      user_id: userId,
      invoice_number: input.invoiceNumber,
      client_name: input.clientName,
      client_email: input.clientEmail,
      client_address: input.clientAddress,
      client_siret: input.clientSiret,
      amount_ht: input.amountHt,
      tva_rate: input.tvaRate,
      amount_ttc: amountTtc,
      description: input.description,
      issue_date: input.issueDate,
      due_date: input.dueDate,
      status: input.status || 'draft',
      notes: input.notes,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating invoice:', error);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    invoice: {
      id: data.id,
      userId: data.user_id,
      invoiceNumber: data.invoice_number,
      clientName: data.client_name,
      clientEmail: data.client_email,
      clientAddress: data.client_address,
      clientSiret: data.client_siret,
      amountHt: Number(data.amount_ht),
      tvaRate: Number(data.tva_rate),
      amountTtc: Number(data.amount_ttc),
      description: data.description,
      issueDate: data.issue_date,
      dueDate: data.due_date,
      status: data.status as Invoice['status'],
      paidDate: data.paid_date,
      paymentMethod: data.payment_method,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  };
};

// Update invoice
export const updateInvoice = async (
  invoiceId: string,
  updates: Partial<InvoiceInput> & { status?: Invoice['status']; paidDate?: string; paymentMethod?: string }
): Promise<{ success: boolean; error?: string }> => {
  const updateData: Record<string, any> = {};

  if (updates.invoiceNumber !== undefined) updateData.invoice_number = updates.invoiceNumber;
  if (updates.clientName !== undefined) updateData.client_name = updates.clientName;
  if (updates.clientEmail !== undefined) updateData.client_email = updates.clientEmail;
  if (updates.clientAddress !== undefined) updateData.client_address = updates.clientAddress;
  if (updates.clientSiret !== undefined) updateData.client_siret = updates.clientSiret;
  if (updates.amountHt !== undefined) {
    updateData.amount_ht = updates.amountHt;
    updateData.amount_ttc = updates.amountHt * (1 + (updates.tvaRate ?? 0) / 100);
  }
  if (updates.tvaRate !== undefined) updateData.tva_rate = updates.tvaRate;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.issueDate !== undefined) updateData.issue_date = updates.issueDate;
  if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.paidDate !== undefined) updateData.paid_date = updates.paidDate;
  if (updates.paymentMethod !== undefined) updateData.payment_method = updates.paymentMethod;
  if (updates.notes !== undefined) updateData.notes = updates.notes;

  const { error } = await supabase
    .from('invoices')
    .update(updateData)
    .eq('id', invoiceId);

  if (error) {
    console.error('Error updating invoice:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

// Delete invoice
export const deleteInvoice = async (invoiceId: string): Promise<{ success: boolean; error?: string }> => {
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', invoiceId);

  if (error) {
    console.error('Error deleting invoice:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

// Generate next invoice number
export const generateInvoiceNumber = async (userId: string): Promise<string> => {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('issue_date', `${year}-01-01`);

  const nextNumber = (count ?? 0) + 1;
  return `FAC-${year}-${String(nextNumber).padStart(3, '0')}`;
};

// Get invoice stats
export const getInvoiceStats = (invoices: Invoice[]) => {
  const paid = invoices.filter(i => i.status === 'paid');
  const pending = invoices.filter(i => i.status === 'pending' || i.status === 'sent');
  const overdue = invoices.filter(i => i.status === 'overdue');
  const draft = invoices.filter(i => i.status === 'draft');

  return {
    totalPaid: paid.reduce((sum, i) => sum + i.amountTtc, 0),
    totalPending: pending.reduce((sum, i) => sum + i.amountTtc, 0),
    totalOverdue: overdue.reduce((sum, i) => sum + i.amountTtc, 0),
    totalDraft: draft.reduce((sum, i) => sum + i.amountTtc, 0),
    countPaid: paid.length,
    countPending: pending.length,
    countOverdue: overdue.length,
    countDraft: draft.length,
  };
};
