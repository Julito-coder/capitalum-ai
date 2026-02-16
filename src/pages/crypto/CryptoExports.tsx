import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, FileText, FolderArchive, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

const CryptoExports = () => {
  const navigate = useNavigate();

  const handleExportPdf = (type: 'synthese' | 'audit') => {
    toast({
      title: '📄 Export en cours',
      description: type === 'synthese'
        ? 'Le dossier 2086 synthèse va être généré.'
        : 'Le journal d\'audit va être généré.',
    });
    // TODO: implement PDF generation using jsPDF
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 p-4 pb-24">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/crypto/2086')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">Exports & Archivage</h1>
        </div>

        {/* Export cards */}
        <div className="grid gap-4">
          <Card className="hover:border-primary/30 transition-colors">
            <CardContent className="flex items-center gap-4 py-5">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <FileText className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">Dossier 2086 — Synthèse</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Résumé complet : comptes, cessions, montants à reporter, hypothèses
                </p>
              </div>
              <Button size="sm" onClick={() => handleExportPdf('synthese')}>
                <Download className="h-4 w-4 mr-1" /> PDF
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/30 transition-colors">
            <CardContent className="flex items-center gap-4 py-5">
              <div className="p-3 rounded-xl bg-accent/10 text-accent">
                <FolderArchive className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">Journal de calcul (Audit)</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Formules, inputs, étapes détaillées du calcul PV/MV
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleExportPdf('audit')}>
                <Download className="h-4 w-4 mr-1" /> PDF
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Archive section */}
        <Card>
          <CardContent className="py-6 text-center space-y-3">
            <Clock className="h-10 w-10 text-muted-foreground/30 mx-auto" />
            <p className="text-sm text-muted-foreground">
              Les documents exportés seront archivés automatiquement dans
              <br />
              <span className="font-mono text-xs">Capitalum Drive / 2025 / Fiscalité / Crypto / 2086</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CryptoExports;
