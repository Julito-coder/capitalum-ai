import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { fetchProjects, fetchFullProject } from "@/lib/realEstateService";
import { RealEstateProject, FullProjectData } from "@/lib/realEstateTypes";
import { formatCurrency } from "@/data/mockData";
import { ArrowLeft, Scale, Loader2, Check, X, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";

const CompareSimulations = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState<RealEstateProject[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<FullProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    loadProjects();
    const idsParam = searchParams.get('ids');
    if (idsParam) {
      setSelectedIds(idsParam.split(','));
    }
  }, []);

  useEffect(() => {
    if (selectedIds.length >= 2) {
      loadComparison();
    } else {
      setComparisonData([]);
    }
  }, [selectedIds]);

  const loadProjects = async () => {
    try {
      const data = await fetchProjects();
      setProjects(data);
    } catch (error) {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const loadComparison = async () => {
    setComparing(true);
    try {
      const data = await Promise.all(selectedIds.map(id => fetchFullProject(id)));
      setComparisonData(data.filter(Boolean) as FullProjectData[]);
    } catch (error) {
      toast.error("Erreur lors de la comparaison");
    } finally {
      setComparing(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      }
      if (prev.length >= 4) {
        toast.warning("Maximum 4 projets à comparer");
        return prev;
      }
      return [...prev, id];
    });
  };

  const getBestValue = (values: (number | undefined)[], higherIsBetter: boolean = true) => {
    const nums = values.filter((v): v is number => v !== undefined);
    if (nums.length === 0) return undefined;
    return higherIsBetter ? Math.max(...nums) : Math.min(...nums);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/outils/simulateur")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Comparateur de scénarios</h1>
              <p className="text-muted-foreground">Sélectionne 2 à 4 projets à comparer</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">{selectedIds.length}/4 sélectionnés</span>
          </div>
        </div>

        {/* Project Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sélection des projets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {projects.map(project => (
                <div 
                  key={project.id} 
                  className={`p-3 border rounded-lg cursor-pointer transition ${selectedIds.includes(project.id) ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
                  onClick={() => toggleSelection(project.id)}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox checked={selectedIds.includes(project.id)} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{project.title}</p>
                      <p className="text-sm text-muted-foreground">{project.city} • {project.surface_m2}m²</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Comparison Table */}
        {comparing && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!comparing && comparisonData.length >= 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tableau comparatif</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Critère</th>
                      {comparisonData.map((d, i) => (
                        <th key={i} className="text-center py-3 px-2">
                          <div className="font-bold">{d.project.title}</div>
                          <div className="text-xs text-muted-foreground">{d.project.city}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <CompareRow 
                      label="Prix d'achat" 
                      values={comparisonData.map(d => d.acquisition.price_net_seller)} 
                      format={formatCurrency}
                      best={getBestValue(comparisonData.map(d => d.acquisition.price_net_seller), false)}
                    />
                    <CompareRow 
                      label="Surface" 
                      values={comparisonData.map(d => d.project.surface_m2)} 
                      format={(v) => `${v} m²`}
                      best={getBestValue(comparisonData.map(d => d.project.surface_m2))}
                    />
                    <CompareRow 
                      label="Prix / m²" 
                      values={comparisonData.map(d => d.acquisition.price_net_seller / d.project.surface_m2)} 
                      format={(v) => `${Math.round(v)} €/m²`}
                      best={getBestValue(comparisonData.map(d => d.acquisition.price_net_seller / d.project.surface_m2), false)}
                    />
                    <CompareRow 
                      label="Loyer mensuel" 
                      values={comparisonData.map(d => d.rental?.rent_monthly || 0)} 
                      format={formatCurrency}
                      best={getBestValue(comparisonData.map(d => d.rental?.rent_monthly))}
                    />
                    <CompareRow 
                      label="Mensualité crédit" 
                      values={comparisonData.map(d => d.financing.monthly_payment)} 
                      format={formatCurrency}
                      best={getBestValue(comparisonData.map(d => d.financing.monthly_payment), false)}
                    />
                    <CompareRow 
                      label="Taux" 
                      values={comparisonData.map(d => d.financing.nominal_rate)} 
                      format={(v) => `${v}%`}
                      best={getBestValue(comparisonData.map(d => d.financing.nominal_rate), false)}
                    />
                    <tr className="border-t-2"><td colSpan={comparisonData.length + 1} className="py-2 font-bold text-primary">Résultats</td></tr>
                    <CompareRow 
                      label="Rentabilité brute" 
                      values={comparisonData.map(d => d.results?.gross_yield)} 
                      format={(v) => `${v?.toFixed(2)}%`}
                      best={getBestValue(comparisonData.map(d => d.results?.gross_yield))}
                      highlight
                    />
                    <CompareRow 
                      label="Rentabilité nette" 
                      values={comparisonData.map(d => d.results?.net_yield)} 
                      format={(v) => `${v?.toFixed(2)}%`}
                      best={getBestValue(comparisonData.map(d => d.results?.net_yield))}
                      highlight
                    />
                    <CompareRow 
                      label="Cashflow mensuel" 
                      values={comparisonData.map(d => d.results?.monthly_cashflow_after_tax)} 
                      format={formatCurrency}
                      best={getBestValue(comparisonData.map(d => d.results?.monthly_cashflow_after_tax))}
                      highlight
                    />
                    <CompareRow 
                      label="TRI (IRR)" 
                      values={comparisonData.map(d => d.results?.irr)} 
                      format={(v) => `${v?.toFixed(1)}%`}
                      best={getBestValue(comparisonData.map(d => d.results?.irr))}
                      highlight
                    />
                    <CompareRow 
                      label="DSCR" 
                      values={comparisonData.map(d => d.results?.dscr)} 
                      format={(v) => v?.toFixed(2)}
                      best={getBestValue(comparisonData.map(d => d.results?.dscr))}
                    />
                    <CompareRow 
                      label="Patrimoine net" 
                      values={comparisonData.map(d => d.results?.net_patrimony)} 
                      format={formatCurrency}
                      best={getBestValue(comparisonData.map(d => d.results?.net_patrimony))}
                      highlight
                    />
                    <CompareRow 
                      label="Loyer seuil" 
                      values={comparisonData.map(d => d.results?.break_even_rent)} 
                      format={formatCurrency}
                      best={getBestValue(comparisonData.map(d => d.results?.break_even_rent), false)}
                    />
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        {!comparing && comparisonData.length >= 2 && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Recommandation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                // Simple scoring: highest IRR + positive cashflow
                const scored = comparisonData.map(d => ({
                  project: d.project,
                  score: (d.results?.irr || 0) + (d.results?.monthly_cashflow_after_tax || 0 > 0 ? 2 : 0) + (d.results?.dscr || 0 > 1 ? 1 : 0)
                }));
                const best = scored.reduce((a, b) => a.score > b.score ? a : b);
                return (
                  <p className="text-lg">
                    Le projet <span className="font-bold text-primary">{best.project.title}</span> présente le meilleur équilibre 
                    rentabilité/risque avec un TRI de {comparisonData.find(d => d.project.id === best.project.id)?.results?.irr?.toFixed(1)}%.
                  </p>
                );
              })()}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

// Compare Row Component
const CompareRow = ({ 
  label, 
  values, 
  format, 
  best,
  highlight = false 
}: { 
  label: string; 
  values: (number | undefined)[]; 
  format: (v: number | undefined) => string; 
  best?: number;
  highlight?: boolean;
}) => (
  <tr className={`border-b ${highlight ? 'bg-muted/50' : ''}`}>
    <td className="py-3 px-2 text-muted-foreground">{label}</td>
    {values.map((v, i) => {
      const isBest = v !== undefined && best !== undefined && v === best;
      return (
        <td key={i} className={`text-center py-3 px-2 ${isBest ? 'font-bold text-primary' : ''}`}>
          <div className="flex items-center justify-center gap-1">
            {format(v)}
            {isBest && <Check className="h-4 w-4 text-green-500" />}
          </div>
        </td>
      );
    })}
  </tr>
);

export default CompareSimulations;