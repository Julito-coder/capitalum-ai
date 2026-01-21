import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Euro, Calendar, Building2 } from 'lucide-react';
import { Invoice, InvoiceInput } from '@/lib/invoiceService';

interface InvoiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InvoiceInput) => Promise<void>;
  invoice?: Invoice | null;
  defaultInvoiceNumber: string;
}

export const InvoiceForm = ({ 
  open, 
  onOpenChange, 
  onSubmit, 
  invoice,
  defaultInvoiceNumber 
}: InvoiceFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<InvoiceInput>({
    invoiceNumber: defaultInvoiceNumber,
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    clientSiret: '',
    amountHt: 0,
    tvaRate: 0,
    description: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'draft',
    notes: '',
  });

  useEffect(() => {
    if (invoice) {
      setFormData({
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName,
        clientEmail: invoice.clientEmail || '',
        clientAddress: invoice.clientAddress || '',
        clientSiret: invoice.clientSiret || '',
        amountHt: invoice.amountHt,
        tvaRate: invoice.tvaRate,
        description: invoice.description || '',
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        status: invoice.status,
        notes: invoice.notes || '',
      });
    } else {
      setFormData(prev => ({
        ...prev,
        invoiceNumber: defaultInvoiceNumber,
        clientName: '',
        clientEmail: '',
        clientAddress: '',
        clientSiret: '',
        amountHt: 0,
        tvaRate: 0,
        description: '',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'draft',
        notes: '',
      }));
    }
  }, [invoice, defaultInvoiceNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(formData);
    setLoading(false);
    onOpenChange(false);
  };

  const amountTtc = formData.amountHt * (1 + formData.tvaRate / 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {invoice ? 'Modifier la facture' : 'Nouvelle facture'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Invoice details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Numéro de facture</Label>
              <Input
                value={formData.invoiceNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: Invoice['status']) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="sent">Envoyée</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="paid">Payée</SelectItem>
                  <SelectItem value="overdue">En retard</SelectItem>
                  <SelectItem value="cancelled">Annulée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Client info */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Informations client
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom du client *</Label>
                <Input
                  value={formData.clientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                  placeholder="Nom ou raison sociale"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                  placeholder="client@email.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Adresse</Label>
              <Textarea
                value={formData.clientAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, clientAddress: e.target.value }))}
                placeholder="Adresse complète"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>SIRET client</Label>
              <Input
                value={formData.clientSiret}
                onChange={(e) => setFormData(prev => ({ ...prev, clientSiret: e.target.value }))}
                placeholder="XXX XXX XXX XXXXX"
              />
            </div>
          </div>

          {/* Amounts */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Euro className="h-4 w-4" />
              Montants
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Montant HT *</Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amountHt || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, amountHt: parseFloat(e.target.value) || 0 }))}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Taux TVA (%)</Label>
                <Select 
                  value={String(formData.tvaRate)} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, tvaRate: parseFloat(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0% (Franchise)</SelectItem>
                    <SelectItem value="5.5">5.5%</SelectItem>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="20">20%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Total TTC</Label>
                <div className="h-10 px-3 rounded-md bg-secondary/50 flex items-center font-bold text-primary">
                  {amountTtc.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                </div>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Dates
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date d'émission *</Label>
                <Input
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Date d'échéance *</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  required
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description de la prestation</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Décrivez la prestation facturée..."
              rows={3}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes internes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Notes privées (non visibles sur la facture)..."
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Enregistrement...' : invoice ? 'Mettre à jour' : 'Créer la facture'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
