import { FileText, Download, Clock, FileSpreadsheet, FileCheck, ChevronRight, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface DocumentItem {
  id: string;
  title: string;
  type: 'pdf' | 'excel' | 'other';
  generatedAt: Date;
  size: string;
}

// Mock recent documents - in real app, this would come from Supabase
const recentDocuments: DocumentItem[] = [
  {
    id: '1',
    title: 'Bilan prévisionnel 2025',
    type: 'pdf',
    generatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    size: '245 Ko'
  },
  {
    id: '2',
    title: 'Export URSSAF T4 2024',
    type: 'excel',
    generatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    size: '89 Ko'
  },
  {
    id: '3',
    title: 'Simulation immobilière Lyon',
    type: 'pdf',
    generatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    size: '1.2 Mo'
  }
];

const getDocIcon = (type: string) => {
  switch (type) {
    case 'pdf': return <FileText className="h-4 w-4 text-destructive" />;
    case 'excel': return <FileSpreadsheet className="h-4 w-4 text-success" />;
    default: return <FileCheck className="h-4 w-4 text-info" />;
  }
};

const formatRelativeDate = (date: Date) => {
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

export const DocumentsExportsCard = () => {
  const navigate = useNavigate();

  const quickExports = [
    { id: 'bilan', label: 'Bilan financier', icon: FileText },
    { id: 'urssaf', label: 'Récap URSSAF', icon: FileSpreadsheet },
    { id: 'factures', label: 'Export factures', icon: FileCheck },
  ];

  return (
    <Card className="border border-border/30 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-lg bg-info/10">
            <FileText className="h-5 w-5 text-info" />
          </div>
          Documents & Exports
        </CardTitle>
        <p className="text-sm text-muted-foreground">Vos documents générés</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recent documents */}
        {recentDocuments.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Documents récents
            </p>
            {recentDocuments.map((doc) => (
              <div 
                key={doc.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer group"
              >
                <div className="p-2 rounded-lg bg-muted/50">
                  {getDocIcon(doc.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                    {doc.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatRelativeDate(doc.generatedAt)}</span>
                    <span>•</span>
                    <span>{doc.size}</span>
                  </div>
                </div>
                
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Aucun document récent
          </div>
        )}

        {/* Quick export buttons */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Export rapide
          </p>
          <div className="grid grid-cols-3 gap-2">
            {quickExports.map((exp) => (
              <Button 
                key={exp.id}
                variant="outline" 
                className="h-auto py-3 flex-col gap-1"
                onClick={() => {/* Generate export */}}
              >
                <exp.icon className="h-4 w-4" />
                <span className="text-xs">{exp.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Generate new report */}
        <Button 
          variant="ghost" 
          className="w-full justify-between text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/pro/cashflow')}
        >
          <span className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Générer un nouveau rapport
          </span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};
