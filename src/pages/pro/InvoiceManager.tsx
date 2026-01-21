import { useState } from 'react';
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
  TrendingUp,
  Users
} from 'lucide-react';
import { formatCurrency } from '@/lib/dashboardService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Invoice {
  id: string;
  number: string;
  client: string;
  amount: number;
  date: string;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue' | 'draft';
  description: string;
}

const mockInvoices: Invoice[] = [
  { id: '1', number: 'FAC-2025-001', client: 'Startup Tech SAS', amount: 3500, date: '2025-01-15', dueDate: '2025-02-15', status: 'paid', description: 'Développement application web' },
  { id: '2', number: 'FAC-2025-002', client: 'Cabinet Martin', amount: 1200, date: '2025-01-18', dueDate: '2025-02-18', status: 'pending', description: 'Consulting stratégique' },
  { id: '3', number: 'FAC-2025-003', client: 'E-commerce Plus', amount: 5800, date: '2025-01-20', dueDate: '2025-02-05', status: 'overdue', description: 'Refonte site e-commerce' },
  { id: '4', number: 'FAC-2025-004', client: 'Agence Digitale', amount: 2400, date: '2025-01-21', dueDate: '2025-02-21', status: 'draft', description: 'Formation équipe dev' },
];

const InvoiceManager = () => {
  const [invoices] = useState<Invoice[]>(mockInvoices);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inv.number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
  const totalPending = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0);
  const totalOverdue = invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.amount, 0);
  const totalDraft = invoices.filter(i => i.status === 'draft').reduce((sum, i) => sum + i.amount, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-success/20 text-success border-success/30"><CheckCircle2 className="h-3 w-3 mr-1" />Payée</Badge>;
      case 'pending':
        return <Badge className="bg-warning/20 text-warning border-warning/30"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case 'overdue':
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30"><AlertCircle className="h-3 w-3 mr-1" />En retard</Badge>;
      case 'draft':
        return <Badge className="bg-muted text-muted-foreground"><FileText className="h-3 w-3 mr-1" />Brouillon</Badge>;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Gestion des factures</h1>
            <p className="text-muted-foreground mt-1">
              Créez, suivez et gérez toutes vos factures
            </p>
          </div>
          <button className="btn-primary">
            <Plus className="h-4 w-4" />
            Nouvelle facture
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card cursor-pointer hover:border-success/50 transition-colors" onClick={() => setStatusFilter('paid')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Encaissées</p>
                  <p className="text-2xl font-bold text-success">{formatCurrency(totalPaid)}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-success/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card cursor-pointer hover:border-warning/50 transition-colors" onClick={() => setStatusFilter('pending')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">En attente</p>
                  <p className="text-2xl font-bold text-warning">{formatCurrency(totalPending)}</p>
                </div>
                <Clock className="h-8 w-8 text-warning/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card cursor-pointer hover:border-destructive/50 transition-colors" onClick={() => setStatusFilter('overdue')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">En retard</p>
                  <p className="text-2xl font-bold text-destructive">{formatCurrency(totalOverdue)}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-destructive/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card cursor-pointer hover:border-muted-foreground/50 transition-colors" onClick={() => setStatusFilter('draft')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Brouillons</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalDraft)}</p>
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
              Toutes
            </button>
            <button className="btn-secondary">
              <Filter className="h-4 w-4" />
              Filtres
            </button>
          </div>
        </div>

        {/* Invoice List */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Factures récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                        <p className="font-medium">{invoice.number}</p>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{invoice.client}</p>
                      <p className="text-xs text-muted-foreground">{invoice.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatCurrency(invoice.amount)}</p>
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
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FileText className="h-4 w-4 mr-2" />
                          Voir détails
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Users className="h-4 w-4 mr-2" />
                          Relancer client
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default InvoiceManager;
