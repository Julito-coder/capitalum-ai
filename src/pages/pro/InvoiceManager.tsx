import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  Filter,
  FileText,
  Euro,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  MoreVertical,
  Edit,
  Trash2,
  Send
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  loadInvoices, 
  createInvoice, 
  updateInvoice,
  deleteInvoice,
  generateInvoiceNumber,
  getInvoiceStats,
  Invoice,
  InvoiceInput
} from '@/lib/invoiceService';
import { loadProProfile, ProProfile } from '@/lib/proService';
import { downloadInvoicePDF } from '@/lib/invoicePdfGenerator';
import { formatCurrency } from '@/lib/dashboardService';
import { InvoiceForm } from '@/components/invoices/InvoiceForm';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

const InvoiceManager = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [profile, setProfile] = useState<ProProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Invoice | null>(null);
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState('');

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    const [invoiceData, proProfile, invoiceNum] = await Promise.all([
      loadInvoices(user.id),
      loadProProfile(user.id),
      generateInvoiceNumber(user.id)
    ]);
    
    setInvoices(invoiceData);
    setProfile(proProfile);
    setNextInvoiceNumber(invoiceNum);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = getInvoiceStats(invoices);

  const handleCreateInvoice = async (data: InvoiceInput) => {
    if (!user) return;
    
    const result = await createInvoice(user.id, data);
    if (result.success) {
      toast.success('Facture créée avec succès');
      loadData();
    } else {
      toast.error('Erreur lors de la création');
    }
  };

  const handleUpdateInvoice = async (data: InvoiceInput) => {
    if (!editingInvoice) return;
    
    const result = await updateInvoice(editingInvoice.id, data);
    if (result.success) {
      toast.success('Facture mise à jour');
      setEditingInvoice(null);
      loadData();
    } else {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDeleteInvoice = async () => {
    if (!deleteConfirm) return;
    
    const result = await deleteInvoice(deleteConfirm.id);
    if (result.success) {
      toast.success('Facture supprimée');
      setDeleteConfirm(null);
      loadData();
    } else {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleMarkAsPaid = async (invoice: Invoice) => {
    const result = await updateInvoice(invoice.id, {
      status: 'paid',
      paidDate: new Date().toISOString().split('T')[0]
    });
    if (result.success) {
      toast.success('Facture marquée comme payée');
      loadData();
    }
  };

  const handleDownloadPDF = (invoice: Invoice) => {
    downloadInvoicePDF(invoice, profile);
    toast.success('PDF téléchargé');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-success/20 text-success border-success/30"><CheckCircle2 className="h-3 w-3 mr-1" />Payée</Badge>;
      case 'pending':
      case 'sent':
        return <Badge className="bg-warning/20 text-warning border-warning/30"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case 'overdue':
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30"><AlertCircle className="h-3 w-3 mr-1" />En retard</Badge>;
      case 'draft':
        return <Badge className="bg-muted text-muted-foreground"><FileText className="h-3 w-3 mr-1" />Brouillon</Badge>;
      case 'cancelled':
        return <Badge className="bg-muted text-muted-foreground">Annulée</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Gestion des factures</h1>
            <p className="text-muted-foreground mt-1">
              Créez, suivez et gérez toutes tes factures
            </p>
          </div>
          <button 
            onClick={() => {
              setEditingInvoice(null);
              setShowForm(true);
            }}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" />
            Nouvelle facture
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card 
            className={`glass-card cursor-pointer transition-colors ${statusFilter === 'paid' ? 'border-success ring-2 ring-success/20' : 'hover:border-success/50'}`}
            onClick={() => setStatusFilter(statusFilter === 'paid' ? 'all' : 'paid')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Encaissées ({stats.countPaid})</p>
                  <p className="text-2xl font-bold text-success">{formatCurrency(stats.totalPaid)}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-success/30" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`glass-card cursor-pointer transition-colors ${statusFilter === 'pending' ? 'border-warning ring-2 ring-warning/20' : 'hover:border-warning/50'}`}
            onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">En attente ({stats.countPending})</p>
                  <p className="text-2xl font-bold text-warning">{formatCurrency(stats.totalPending)}</p>
                </div>
                <Clock className="h-8 w-8 text-warning/30" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`glass-card cursor-pointer transition-colors ${statusFilter === 'overdue' ? 'border-destructive ring-2 ring-destructive/20' : 'hover:border-destructive/50'}`}
            onClick={() => setStatusFilter(statusFilter === 'overdue' ? 'all' : 'overdue')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">En retard ({stats.countOverdue})</p>
                  <p className="text-2xl font-bold text-destructive">{formatCurrency(stats.totalOverdue)}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-destructive/30" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`glass-card cursor-pointer transition-colors ${statusFilter === 'draft' ? 'border-muted-foreground ring-2 ring-muted-foreground/20' : 'hover:border-muted-foreground/50'}`}
            onClick={() => setStatusFilter(statusFilter === 'draft' ? 'all' : 'draft')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Brouillons ({stats.countDraft})</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalDraft)}</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par client ou numéro..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'
              }`}
            >
              Toutes ({invoices.length})
            </button>
          </div>
        </div>

        {/* Invoice List */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Factures {statusFilter !== 'all' && `(${filteredInvoices.length})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Aucune facture ne correspond à vos critères'
                    : 'Aucune facture pour le moment'}
                </p>
                <button 
                  onClick={() => setShowForm(true)}
                  className="btn-primary mt-4"
                >
                  <Plus className="h-4 w-4" />
                  Créer votre première facture
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredInvoices.map((invoice) => (
                  <div 
                    key={invoice.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Euro className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{invoice.invoiceNumber}</p>
                          {getStatusBadge(invoice.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{invoice.clientName}</p>
                        {invoice.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{invoice.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-lg">{formatCurrency(invoice.amountTtc)}</p>
                        <p className="text-xs text-muted-foreground">
                          Échéance : {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 hover:bg-secondary rounded-lg">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownloadPDF(invoice)}>
                            <Download className="h-4 w-4 mr-2" />
                            Télécharger PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setEditingInvoice(invoice);
                            setShowForm(true);
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          {invoice.status !== 'paid' && (
                            <DropdownMenuItem onClick={() => handleMarkAsPaid(invoice)}>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Marquer comme payée
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setDeleteConfirm(invoice)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoice Form Modal */}
      <InvoiceForm
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingInvoice(null);
        }}
        onSubmit={editingInvoice ? handleUpdateInvoice : handleCreateInvoice}
        invoice={editingInvoice}
        defaultInvoiceNumber={nextInvoiceNumber}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette facture ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La facture {deleteConfirm?.invoiceNumber} sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteInvoice} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default InvoiceManager;
