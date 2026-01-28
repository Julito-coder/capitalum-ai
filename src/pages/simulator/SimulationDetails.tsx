import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { fetchFullProject, recalculateProject } from "@/lib/realEstateService";
import { FullProjectData, SimulationResults } from "@/lib/realEstateTypes";
import { formatCurrency } from "@/data/mockData";
import { 
  ArrowLeft, RefreshCw, FileDown, Loader2, AlertTriangle, CheckCircle2, Edit
} from "lucide-react";
import { toast } from "sonner";
import { generateBankPDF } from "@/lib/simulationPdfExport";
import { generateRPBankPDF } from "@/lib/rpPdfExport";
import { supabase } from "@/integrations/supabase/client";
import { HouseholdData, createHouseholdFromProfile } from "@/lib/rpCalculations";

// Professional components for LOCATIF
import { KPICardsGrid } from "@/components/simulator/results/KPICardsGrid";
import { YieldComparisonChart } from "@/components/simulator/results/YieldComparisonChart";
import { CashflowEvolutionChart } from "@/components/simulator/results/CashflowEvolutionChart";
import { AmortizationChart } from "@/components/simulator/results/AmortizationChart";
import { PatrimonyEvolutionChart } from "@/components/simulator/results/PatrimonyEvolutionChart";
import { SensitivityCharts } from "@/components/simulator/results/SensitivityCharts";
import { SensitivityHeatmap } from "@/components/simulator/results/SensitivityHeatmap";
import { BreakEvenAnalysis } from "@/components/simulator/results/BreakEvenAnalysis";

// Dedicated RP dashboard
import { RPResultsDashboard } from "@/components/simulator/results/RPResultsDashboard";

const SimulationDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<FullProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [householdData, setHouseholdData] = useState<HouseholdData>({
    primaryIncome: 0,
    primaryExistingCredits: 0,
    members: [],
    otherChargesMonthly: 0,
  });
  const [clientProfile, setClientProfile] = useState<{
    fullName: string;
    professionalStatus?: string;
    contractType?: string;
    netMonthlySalary?: number;
    spouseIncome?: number;
    mortgageRemaining?: number;
  }>({ fullName: "Client" });

  useEffect(() => {
    if (id) loadData();
    loadClientProfile();
  }, [id]);

  const loadClientProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, professional_status, contract_type, net_monthly_salary, spouse_income, mortgage_remaining")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        setClientProfile({
          fullName: profile.full_name || user.user_metadata?.full_name || "Client",
          professionalStatus: profile.professional_status || undefined,
          contractType: profile.contract_type || undefined,
          netMonthlySalary: profile.net_monthly_salary || undefined,
          spouseIncome: profile.spouse_income || undefined,
          mortgageRemaining: profile.mortgage_remaining || undefined,
        });
        
        // Create household data from profile
        const household = createHouseholdFromProfile(profile);
        setHouseholdData(household);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const loadData = async () => {
    try {
      const result = await fetchFullProject(id!);
      setData(result);
    } catch (error) {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    if (!id) return;
    setRecalculating(true);
    try {
      await recalculateProject(id);
      await loadData();
      toast.success("Simulation recalculée");
    } catch (error) {
      toast.error("Erreur lors du recalcul");
    } finally {
      setRecalculating(false);
    }
  };

  const handleExportPDF = async () => {
    if (!data) return;
    
    try {
      if (data.project.type === 'RP') {
        // For RP projects, use dedicated RP PDF export with household data
        const config = {
          household: {
            members: householdData.members.map(m => ({
              firstName: m.firstName,
              relation: m.relation,
              professionalStatus: m.professionalStatus,
              netMonthlySalary: m.netMonthlySalary,
              contractType: m.contractType,
              existingCredits: m.existingCredits,
            })),
            totalIncome: householdData.primaryIncome + householdData.members.reduce((sum, m) => sum + m.netMonthlySalary, 0),
            totalExistingCredits: householdData.primaryExistingCredits + householdData.members.reduce((sum, m) => sum + m.existingCredits, 0),
          },
          stressTests: {
            rateIncrease: 1,
            chargesIncrease: 20,
            incomeDecrease: 10,
          },
        };
        await generateRPBankPDF(data, config);
        toast.success("Dossier de financement RP exporté");
      } else {
        // For LOCATIF projects, use standard bank PDF
        await generateBankPDF(data);
        toast.success("PDF exporté");
      }
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error("Erreur lors de l'export");
    }
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

  if (!data) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Projet introuvable</p>
          <Button variant="link" onClick={() => navigate("/simulator")}>Retour à la liste</Button>
        </div>
      </Layout>
    );
  }

  const { project, acquisition, financing, rental, results, tax_config } = data;
  const r = results || {} as SimulationResults;
  const isRP = project.type === 'RP';

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/simulator")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{project.title || "Sans titre"}</h1>
                <Badge variant={isRP ? 'secondary' : 'default'}>
                  {isRP ? 'Résidence Principale' : 'Locatif'}
                </Badge>
                {!isRP && r.dscr >= 1.2 && r.monthly_cashflow_after_tax >= 0 && (
                  <Badge className="bg-success text-success-foreground">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Viable
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">
                {project.city} • {project.surface_m2} m² • {project.rooms} pièces
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/simulator/edit/${id}`)}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            <Button variant="outline" onClick={handleRecalculate} disabled={recalculating}>
              <RefreshCw className={`h-4 w-4 mr-2 ${recalculating ? 'animate-spin' : ''}`} />
              Recalculer
            </Button>
            <Button onClick={handleExportPDF}>
              <FileDown className="h-4 w-4 mr-2" />
              {isRP ? 'Dossier Banque' : 'Export PDF'}
            </Button>
          </div>
        </div>

        {/* Conditional Dashboard based on project type */}
        {isRP ? (
          // RP Dashboard - focused on solvency and household analysis
          <RPResultsDashboard data={data} results={r} household={householdData} />
        ) : (
          // LOCATIF Dashboard - focused on profitability
          <>
            {/* Professional KPI Cards */}
            <KPICardsGrid 
              results={r}
              projectType="LOCATIF"
              acquisition={acquisition}
              financing={financing}
              rental={rental}
            />

            {/* Warnings */}
            {(r.monthly_cashflow_after_tax < 0 || r.dscr < 1) && (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="py-3 flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <div className="text-sm">
                    {r.monthly_cashflow_after_tax < 0 && (
                      <span className="block">
                        ⚠️ Cashflow négatif : effort d'épargne de {formatCurrency(Math.abs(r.monthly_cashflow_after_tax))}/mois requis
                      </span>
                    )}
                    {r.dscr < 1 && (
                      <span className="block">
                        ⚠️ DSCR &lt; 1 : les revenus locatifs ne couvrent pas le service de la dette
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabs */}
            <Tabs defaultValue="synthese" className="space-y-4">
              <TabsList className="grid grid-cols-6 w-full max-w-3xl">
                <TabsTrigger value="synthese">Synthèse</TabsTrigger>
                <TabsTrigger value="cashflows">Cashflows</TabsTrigger>
                <TabsTrigger value="amortissement">Crédit</TabsTrigger>
                <TabsTrigger value="patrimoine">Patrimoine</TabsTrigger>
                <TabsTrigger value="fiscalite">Fiscalité</TabsTrigger>
                <TabsTrigger value="sensibilite">Sensibilité</TabsTrigger>
              </TabsList>

              {/* Synthèse Tab */}
              <TabsContent value="synthese" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Budget acquisition */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Budget d'acquisition</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between"><span>Prix net vendeur</span><span className="font-medium">{formatCurrency(acquisition.price_net_seller)}</span></div>
                      <div className="flex justify-between"><span>Frais d'agence</span><span>{formatCurrency(acquisition.agency_fee_amount)}</span></div>
                      <div className="flex justify-between"><span>Frais de notaire</span><span>{formatCurrency(acquisition.notary_fee_amount)}</span></div>
                      {acquisition.works_amount > 0 && <div className="flex justify-between"><span>Travaux</span><span>{formatCurrency(acquisition.works_amount)}</span></div>}
                      {acquisition.furniture_amount > 0 && <div className="flex justify-between"><span>Mobilier</span><span>{formatCurrency(acquisition.furniture_amount)}</span></div>}
                      <div className="border-t pt-2 flex justify-between font-bold">
                        <span>Coût total</span>
                        <span>{formatCurrency(acquisition.total_project_cost || (acquisition.price_net_seller + acquisition.agency_fee_amount + acquisition.notary_fee_amount + acquisition.works_amount))}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Financement */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Structure de financement</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between"><span>Apport personnel</span><span className="font-medium">{formatCurrency(financing.down_payment)}</span></div>
                      <div className="flex justify-between"><span>Montant emprunté</span><span>{formatCurrency(financing.loan_amount)}</span></div>
                      <div className="flex justify-between"><span>Durée</span><span>{financing.duration_months / 12} ans</span></div>
                      <div className="flex justify-between"><span>Taux nominal</span><span>{financing.nominal_rate}%</span></div>
                      <div className="border-t pt-2 flex justify-between font-bold">
                        <span>Mensualité</span>
                        <span>{formatCurrency(financing.monthly_payment)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Yield comparison chart */}
                <YieldComparisonChart 
                  grossYield={r.gross_yield || 0}
                  netYield={r.net_yield || 0}
                  netNetYield={r.net_net_yield || 0}
                />

                {/* Break-even analysis */}
                <BreakEvenAnalysis 
                  results={r}
                  currentRent={rental?.rent_monthly || 0}
                  currentPrice={acquisition.price_net_seller}
                  currentRate={financing.nominal_rate}
                />
              </TabsContent>

              {/* Cashflows Tab */}
              <TabsContent value="cashflows" className="space-y-6">
                <CashflowEvolutionChart cashflowSeries={r.cashflow_series || []} />
                
                {/* Cashflow table */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Tableau des cashflows annuels</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Année</th>
                            <th className="text-right py-2">Revenus</th>
                            <th className="text-right py-2">Charges</th>
                            <th className="text-right py-2">Crédit</th>
                            <th className="text-right py-2">Impôts</th>
                            <th className="text-right py-2 font-bold">Cashflow net</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(r.cashflow_series || []).slice(0, 10).map((row, i) => (
                            <tr key={i} className="border-b border-muted">
                              <td className="py-2">An {row.year}</td>
                              <td className="text-right text-success">{formatCurrency(row.rental_income)}</td>
                              <td className="text-right text-destructive">-{formatCurrency(row.operating_costs)}</td>
                              <td className="text-right text-muted-foreground">-{formatCurrency(row.loan_payment)}</td>
                              <td className="text-right text-warning">-{formatCurrency(row.tax)}</td>
                              <td className={`text-right font-bold ${row.cashflow_after_tax >= 0 ? 'text-success' : 'text-destructive'}`}>
                                {formatCurrency(row.cashflow_after_tax)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Amortissement Tab */}
              <TabsContent value="amortissement" className="space-y-6">
                <AmortizationChart 
                  amortizationTable={financing.amortization_table || []}
                  loanAmount={financing.loan_amount}
                  totalInterest={financing.total_interest || 0}
                  totalInsurance={financing.total_insurance || 0}
                />
              </TabsContent>

              {/* Patrimoine Tab */}
              <TabsContent value="patrimoine" className="space-y-6">
                <PatrimonyEvolutionChart 
                  patrimonySeries={r.patrimony_series || []}
                  downPayment={financing.down_payment}
                />
              </TabsContent>

              {/* Fiscalité Tab */}
              <TabsContent value="fiscalite" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Configuration fiscale</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between"><span>Mode</span><span className="font-medium capitalize">{tax_config.tax_mode}</span></div>
                      <div className="flex justify-between"><span>Régime</span><span>{tax_config.regime_key?.replace(/_/g, ' ')}</span></div>
                      <div className="flex justify-between"><span>TMI</span><span>{tax_config.tmi_rate}%</span></div>
                      <div className="flex justify-between"><span>Prélèvements sociaux</span><span>{tax_config.social_rate}%</span></div>
                      <div className="border-t pt-2 flex justify-between font-bold">
                        <span>Taux global</span>
                        <span>{tax_config.tmi_rate + tax_config.social_rate}%</span>
                      </div>
                      {tax_config.amortization_enabled && (
                        <Badge className="bg-success/20 text-success">Amortissements activés</Badge>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Impact fiscal annuel</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(r.cashflow_series || []).slice(0, 5).map((cf, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>Année {cf.year}</span>
                          <span className="text-warning font-medium">{formatCurrency(cf.tax)}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Sensibilité Tab */}
              <TabsContent value="sensibilite" className="space-y-6">
                <SensitivityCharts 
                  sensitivityData={r.sensitivity_data || { rent_sensitivity: [], price_sensitivity: [], rate_sensitivity: [], heatmap: [] }}
                  currentRent={rental?.rent_monthly || 0}
                  currentRate={financing.nominal_rate}
                />
                <SensitivityHeatmap heatmapData={r.sensitivity_data?.heatmap || []} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </Layout>
  );
};

export default SimulationDetails;
