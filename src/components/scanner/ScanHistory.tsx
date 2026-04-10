import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ScanResult, TaxError, TaxOptimization } from '@/data/taxScannerTypes';
import { formatCurrency } from '@/data/mockData';
import { History, Trash2, Eye, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Calendar, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ScanHistoryItem {
  id: string;
  form_type: string;
  file_name: string | null;
  scan_source: string;
  score: number;
  errors_count: number;
  critical_errors_count: number;
  optimizations_count: number;
  total_potential_savings: number;
  total_risk_amount: number;
  errors: TaxError[];
  optimizations: TaxOptimization[];
  created_at: string;
}

interface Props {
  onViewScan: (result: ScanResult) => void;
  onClose: () => void;
}

export const ScanHistory = ({ onViewScan, onClose }: Props) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tax_scan_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData: ScanHistoryItem[] = (data || []).map(item => ({
        ...item,
        errors: (item.errors as unknown as TaxError[]) || [],
        optimizations: (item.optimizations as unknown as TaxOptimization[]) || [],
      }));
      
      setHistory(transformedData);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Erreur lors du chargement de l\'historique');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tax_scan_history')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setHistory(prev => prev.filter(item => item.id !== id));
      setSelectedIds(prev => prev.filter(i => i !== id));
      toast.success('Analyse supprimée');
    } catch (error) {
      console.error('Error deleting scan:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleViewScan = (item: ScanHistoryItem) => {
    const result: ScanResult = {
      score: item.score,
      errors: item.errors,
      optimizations: item.optimizations,
      totalPotentialSavings: Number(item.total_potential_savings),
      totalRiskAmount: Number(item.total_risk_amount),
      timestamp: new Date(item.created_at)
    };
    onViewScan(result);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id].slice(-2)
    );
  };

  const getScoreTrend = (currentIndex: number): { trend: 'up' | 'down' | 'same'; diff: number } | null => {
    if (currentIndex >= history.length - 1) return null;
    const current = history[currentIndex].score;
    const previous = history[currentIndex + 1].score;
    const diff = current - previous;
    return { 
      trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'same',
      diff: Math.abs(diff)
    };
  };

  const selectedScans = history.filter(h => selectedIds.includes(h.id));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <History className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-xl font-bold">Historique des analyses</h2>
            <p className="text-sm text-muted-foreground">{history.length} analyse(s) sauvegardée(s)</p>
          </div>
        </div>
        <button onClick={onClose} className="btn-secondary">
          Fermer
        </button>
      </div>

      {/* Comparison panel */}
      {selectedIds.length === 2 && (
        <div className="glass-card rounded-2xl p-6 mb-6 border-primary/20">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Comparaison
          </h3>
          <div className="grid grid-cols-2 gap-6">
            {selectedScans.map((scan, idx) => (
              <div key={scan.id} className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  {new Date(scan.created_at).toLocaleDateString('fr-FR', { 
                    day: 'numeric', month: 'short', year: 'numeric' 
                  })}
                </div>
                <div className="flex items-center gap-4">
                  <div className={`text-3xl font-bold ${
                    scan.score >= 80 ? 'text-success' : scan.score >= 60 ? 'text-warning' : 'text-destructive'
                  }`}>
                    {scan.score}
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="flex items-center gap-1 text-destructive">
                      <AlertTriangle className="w-3 h-3" />
                      {scan.errors_count} erreur(s)
                    </div>
                    <div className="flex items-center gap-1 text-success">
                      <CheckCircle2 className="w-3 h-3" />
                      {scan.optimizations_count} optim.
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-success/10">
                    <p className="text-muted-foreground">Économies</p>
                    <p className="font-semibold text-success">+{formatCurrency(Number(scan.total_potential_savings))}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <p className="text-muted-foreground">Risque</p>
                    <p className="font-semibold text-destructive">{formatCurrency(Number(scan.total_risk_amount))}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Difference summary */}
          {selectedScans.length === 2 && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Score:</span>
                  <span className={`font-semibold ${
                    selectedScans[0].score > selectedScans[1].score ? 'text-success' : 
                    selectedScans[0].score < selectedScans[1].score ? 'text-destructive' : ''
                  }`}>
                    {selectedScans[0].score > selectedScans[1].score ? '+' : ''}
                    {selectedScans[0].score - selectedScans[1].score} pts
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Économies:</span>
                  <span className={`font-semibold ${
                    Number(selectedScans[0].total_potential_savings) > Number(selectedScans[1].total_potential_savings) ? 'text-success' : 'text-destructive'
                  }`}>
                    {Number(selectedScans[0].total_potential_savings) > Number(selectedScans[1].total_potential_savings) ? '+' : ''}
                    {formatCurrency(Number(selectedScans[0].total_potential_savings) - Number(selectedScans[1].total_potential_savings))}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedIds.length > 0 && selectedIds.length < 2 && (
        <div className="text-sm text-muted-foreground text-center mb-4 p-3 bg-muted/30 rounded-lg">
          Sélectionne une deuxième analyse pour comparer
        </div>
      )}

      {/* History list */}
      {history.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Aucune analyse sauvegardée</p>
          <p className="text-sm">Lancez une analyse pour commencer</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item, index) => {
            const trend = getScoreTrend(index);
            const isSelected = selectedIds.includes(item.id);
            
            return (
              <div 
                key={item.id} 
                className={`glass-card rounded-xl p-4 transition-all cursor-pointer ${
                  isSelected ? 'ring-2 ring-primary border-primary/50' : 'hover:border-primary/30'
                }`}
                onClick={() => toggleSelection(item.id)}
              >
                <div className="flex items-center gap-4">
                  {/* Score */}
                  <div className="relative">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold ${
                      item.score >= 80 ? 'bg-success/10 text-success' : 
                      item.score >= 60 ? 'bg-warning/10 text-warning' : 
                      'bg-destructive/10 text-destructive'
                    }`}>
                      {item.score}
                    </div>
                    {trend && (
                      <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${
                        trend.trend === 'up' ? 'bg-success text-success-foreground' : 
                        trend.trend === 'down' ? 'bg-destructive text-destructive-foreground' : 
                        'bg-muted'
                      }`}>
                        {trend.trend === 'up' ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : trend.trend === 'down' ? (
                          <TrendingDown className="w-3 h-3" />
                        ) : null}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{item.form_type}</span>
                      {item.file_name && (
                        <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                          {item.file_name}
                        </span>
                      )}
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        item.scan_source === 'upload' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>
                        {item.scan_source === 'upload' ? 'IA' : 'Manuel'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                      <span className="text-destructive">{item.critical_errors_count} critique(s)</span>
                      <span className="text-warning">{item.errors_count - item.critical_errors_count} alerte(s)</span>
                    </div>
                  </div>

                  {/* Savings */}
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-success">+{formatCurrency(Number(item.total_potential_savings))}</p>
                    <p className="text-xs text-muted-foreground">économies</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <button 
                      onClick={() => handleViewScan(item)}
                      className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                      title="Voir les détails"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
