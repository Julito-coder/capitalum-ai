import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { fetchFullProject, recalculateProject } from "@/lib/realEstateService";
import { FullProjectData, SimulationResults } from "@/lib/realEstateTypes";
import { formatCurrency } from "@/data/mockData";
import { 
  ArrowLeft, RefreshCw, FileDown, TrendingUp, TrendingDown, 
  Wallet, Home, Percent, Calculator, AlertTriangle, Info, Loader2,
  Building2, PiggyBank, BarChart3
} from "lucide-react";
import { toast } from "sonner";
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, 
  ResponsiveContainer, ComposedChart, Cell
} from "recharts";
import { generateBankPDF } from "@/lib/simulationPdfExport";

const SimulationDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<FullProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

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
      await generateBankPDF(data);
      toast.success("PDF exporté");
    } catch (error) {
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

  const { project, acquisition, financing, results } = data;
  const r = results || {} as SimulationResults;

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
                <Badge variant={project.type === 'LOCATIF' ? 'default' : 'secondary'}>
                  {project.type === 'LOCATIF' ? 'Locatif' : 'RP'}
                </Badge>
              </div>
              <p className="text-muted-foreground">{project.city} • {project.surface_m2} m²</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRecalculate} disabled={recalculating}>
              <RefreshCw className={`h-4 w-4 mr-2 ${recalculating ? 'animate-spin' : ''}`} />
              Recalculer
            </Button>
            <Button onClick={handleExportPDF}>
              <FileDown className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <KPICard 
            title="Renta. brute" 
            value={`${r.gross_yield?.toFixed(2) || 0}%`}
            icon={<Percent className="h-4 w-4" />}
            tooltip="Loyer annuel / Coût total projet"
            status={r.gross_yield >= 6 ? 'good' : r.gross_yield >= 4 ? 'warning' : 'bad'}
          />
          <KPICard 
            title="Renta. nette" 
            value={`${r.net_yield?.toFixed(2) || 0}%`}
            icon={<TrendingUp className="h-4 w-4" />}
            tooltip="(Loyer - Charges) / Coût total"
            status={r.net_yield >= 5 ? 'good' : r.net_yield >= 3 ? 'warning' : 'bad'}
          />
          <KPICard 
            title="Cashflow/mois" 
            value={formatCurrency(r.monthly_cashflow_after_tax || 0)}
            icon={<Wallet className="h-4 w-4" />}
            tooltip="Cashflow mensuel après impôts"
            status={(r.monthly_cashflow_after_tax || 0) >= 0 ? 'good' : 'bad'}
          />
          <KPICard 
            title="TRI (IRR)" 
            value={`${r.irr?.toFixed(1) || 0}%`}
            icon={<Calculator className="h-4 w-4" />}
            tooltip="Taux de Rentabilité Interne sur l'horizon"
            status={r.irr >= 8 ? 'good' : r.irr >= 4 ? 'warning' : 'bad'}
          />
          <KPICard 
            title="DSCR" 
            value={r.dscr?.toFixed(2) || 0}
            icon={<PiggyBank className="h-4 w-4" />}
            tooltip="Ratio de couverture de la dette"
            status={r.dscr >= 1.25 ? 'good' : r.dscr >= 1 ? 'warning' : 'bad'}
          />
          <KPICard 
            title="Patrimoine net" 
            value={formatCurrency(r.net_patrimony || 0)}
            icon={<Building2 className="h-4 w-4" />}
            tooltip="Valeur estimée à horizon - dette + cashflows"
          />
        </div>

        {/* Warnings */}
        {(r.monthly_cashflow_after_tax < 0 || r.dscr < 1) && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="py-3 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div className="text-sm">
                {r.monthly_cashflow_after_tax < 0 && <span className="block">Cashflow négatif : effort d'épargne de {formatCurrency(Math.abs(r.monthly_cashflow_after_tax))}/mois</span>}
                {r.dscr < 1 && <span className="block">DSCR inférieur à 1 : le loyer ne couvre pas la dette</span>}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="synthese" className="space-y-4">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl">
            <TabsTrigger value="synthese">Synthèse</TabsTrigger>
            <TabsTrigger value="cashflows">Cashflows</TabsTrigger>
            <TabsTrigger value="amortissement">Amortissement</TabsTrigger>
            <TabsTrigger value="fiscalite">Fiscalité</TabsTrigger>
            <TabsTrigger value="sensibilite">Sensibilité</TabsTrigger>
          </TabsList>

          <TabsContent value="synthese" className="space-y-4">
            <SynthesisTab data={data} />
          </TabsContent>

          <TabsContent value="cashflows" className="space-y-4">
            <CashflowTab results={r} />
          </TabsContent>

          <TabsContent value="amortissement" className="space-y-4">
            <AmortizationTab financing={financing} />
          </TabsContent>

          <TabsContent value="fiscalite" className="space-y-4">
            <TaxTab data={data} />
          </TabsContent>

          <TabsContent value="sensibilite" className="space-y-4">
            <SensitivityTab results={r} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

// KPI Card Component
const KPICard = ({ title, value, icon, tooltip, status }: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  tooltip: string;
  status?: 'good' | 'warning' | 'bad';
}) => (
  <Card className={status === 'bad' ? 'border-destructive/30' : status === 'good' ? 'border-green-500/30' : ''}>
    <CardContent className="pt-4">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">{icon}</span>
        <Tooltip>
          <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
          <TooltipContent><p className="max-w-xs">{tooltip}</p></TooltipContent>
        </Tooltip>
      </div>
      <div className="mt-2">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{title}</p>
      </div>
    </CardContent>
  </Card>
);

// Synthesis Tab
const SynthesisTab = ({ data }: { data: FullProjectData }) => {
  const { project, acquisition, financing, results } = data;
  const totalCost = (acquisition.price_net_seller || 0) + (acquisition.agency_fee_amount || 0) + 
                    (acquisition.notary_fee_amount || 0) + (acquisition.works_amount || 0);

  // Prepare data for yield comparison chart
  const yieldData = [
    { name: 'Brute', value: results?.gross_yield || 0, fill: 'hsl(var(--primary))' },
    { name: 'Nette', value: results?.net_yield || 0, fill: 'hsl(var(--chart-2))' },
    { name: 'Nette-nette', value: results?.net_net_yield || 0, fill: 'hsl(var(--chart-3))' },
  ];

  // Patrimony evolution chart
  const patrimonyData = results?.patrimony_series || [];

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Budget d'acquisition</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between"><span>Prix net vendeur</span><span className="font-medium">{formatCurrency(acquisition.price_net_seller)}</span></div>
          <div className="flex justify-between"><span>Frais d'agence</span><span>{formatCurrency(acquisition.agency_fee_amount)}</span></div>
          <div className="flex justify-between"><span>Frais de notaire</span><span>{formatCurrency(acquisition.notary_fee_amount)}</span></div>
          {acquisition.works_amount > 0 && <div className="flex justify-between"><span>Travaux</span><span>{formatCurrency(acquisition.works_amount)}</span></div>}
          <div className="border-t pt-2 flex justify-between font-bold"><span>Total</span><span>{formatCurrency(totalCost)}</span></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Financement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between"><span>Apport</span><span className="font-medium">{formatCurrency(financing.down_payment)}</span></div>
          <div className="flex justify-between"><span>Emprunt</span><span>{formatCurrency(financing.loan_amount)}</span></div>
          <div className="flex justify-between"><span>Durée</span><span>{financing.duration_months / 12} ans</span></div>
          <div className="flex justify-between"><span>Taux</span><span>{financing.nominal_rate}%</span></div>
          <div className="border-t pt-2 flex justify-between font-bold"><span>Mensualité</span><span>{formatCurrency(financing.monthly_payment)}</span></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rentabilités comparées</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yieldData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" domain={[0, 'auto']} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" width={80} />
                <RechartsTooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {yieldData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Évolution du patrimoine net</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={patrimonyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="year" tickFormatter={(v) => `An ${v}`} />
                <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                <Area 
                  type="monotone" 
                  dataKey="net_patrimony" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary)/0.2)" 
                  name="Patrimoine net"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Points morts (break-even)</CardTitle>
          <CardDescription>Seuils à ne pas dépasser pour rester rentable</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{formatCurrency(results?.break_even_rent || 0)}</p>
              <p className="text-sm text-muted-foreground">Loyer minimum</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{formatCurrency(results?.break_even_price || 0)}</p>
              <p className="text-sm text-muted-foreground">Prix maximum</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{(results?.break_even_rate || 0).toFixed(2)}%</p>
              <p className="text-sm text-muted-foreground">Taux maximum</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Cashflow Tab
const CashflowTab = ({ results }: { results: SimulationResults }) => {
  const cashflowData = results?.cashflow_series || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Évolution des cashflows annuels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={cashflowData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="year" tickFormatter={(v) => `An ${v}`} />
                <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="rental_income" name="Revenus" fill="hsl(var(--chart-2))" />
                <Bar dataKey="operating_costs" name="Charges" fill="hsl(var(--chart-4))" />
                <Line type="monotone" dataKey="cashflow_after_tax" name="Cashflow net" stroke="hsl(var(--primary))" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tableau des cashflows</CardTitle>
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
                {cashflowData.slice(0, 10).map((row, i) => (
                  <tr key={i} className="border-b border-muted">
                    <td className="py-2">An {row.year}</td>
                    <td className="text-right text-green-600">{formatCurrency(row.rental_income)}</td>
                    <td className="text-right text-red-600">-{formatCurrency(row.operating_costs)}</td>
                    <td className="text-right text-red-600">-{formatCurrency(row.loan_payment)}</td>
                    <td className="text-right text-orange-600">-{formatCurrency(row.tax)}</td>
                    <td className={`text-right font-bold ${row.cashflow_after_tax >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(row.cashflow_after_tax)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Amortization Tab
const AmortizationTab = ({ financing }: { financing: any }) => {
  const amortTable = financing?.amortization_table || [];
  
  // Aggregate by year
  const yearlyData = [];
  for (let year = 1; year <= Math.ceil(amortTable.length / 12); year++) {
    const yearRows = amortTable.filter((r: any) => r.year === year);
    if (yearRows.length > 0) {
      yearlyData.push({
        year,
        principal: yearRows.reduce((s: number, r: any) => s + r.principal, 0),
        interest: yearRows.reduce((s: number, r: any) => s + r.interest, 0),
        remaining_balance: yearRows[yearRows.length - 1].remaining_balance,
      });
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Capital restant dû</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={yearlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="year" tickFormatter={(v) => `An ${v}`} />
                <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                <Area 
                  type="monotone" 
                  dataKey="remaining_balance" 
                  stroke="hsl(var(--chart-4))" 
                  fill="hsl(var(--chart-4)/0.3)" 
                  name="Capital restant"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Répartition capital / intérêts par an</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyData.slice(0, 20)}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="year" tickFormatter={(v) => `An ${v}`} />
                <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="principal" name="Capital" stackId="a" fill="hsl(var(--primary))" />
                <Bar dataKey="interest" name="Intérêts" stackId="a" fill="hsl(var(--chart-4))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coût total du crédit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{formatCurrency(financing.loan_amount)}</p>
              <p className="text-sm text-muted-foreground">Capital emprunté</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{formatCurrency(financing.total_interest)}</p>
              <p className="text-sm text-muted-foreground">Intérêts totaux</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{formatCurrency(financing.total_insurance)}</p>
              <p className="text-sm text-muted-foreground">Assurance totale</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Tax Tab
const TaxTab = ({ data }: { data: FullProjectData }) => {
  const { tax_config, results, rental } = data;
  const cashflowData = results?.cashflow_series || [];
  
  const taxData = cashflowData.map(cf => ({
    year: cf.year,
    revenu: cf.rental_income,
    impot: cf.tax,
    net: cf.cashflow_after_tax,
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuration fiscale</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between"><span>Mode</span><span className="font-medium capitalize">{tax_config.tax_mode}</span></div>
          <div className="flex justify-between"><span>Régime</span><span>{tax_config.regime_key?.replace(/_/g, ' ')}</span></div>
          <div className="flex justify-between"><span>TMI</span><span>{tax_config.tmi_rate}%</span></div>
          <div className="flex justify-between"><span>Prélèvements sociaux</span><span>{tax_config.social_rate}%</span></div>
          <div className="flex justify-between"><span>Taux global</span><span className="font-bold">{tax_config.tmi_rate + tax_config.social_rate}%</span></div>
          {tax_config.amortization_enabled && (
            <div className="flex justify-between text-green-600"><span>Amortissements</span><span>Activés</span></div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Évolution impôts vs revenus nets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={taxData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="year" tickFormatter={(v) => `An ${v}`} />
                <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="impot" name="Impôts" fill="hsl(var(--chart-4))" />
                <Line type="monotone" dataKey="net" name="Cashflow net" stroke="hsl(var(--primary))" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Sensitivity Tab  
const SensitivityTab = ({ results }: { results: SimulationResults }) => {
  const sensitivity = results?.sensitivity_data;
  
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sensibilité au loyer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sensitivity?.rent_sensitivity || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="rent" tickFormatter={(v) => `${v}€`} />
                  <YAxis tickFormatter={(v) => `${v}€`} />
                  <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                  <Line type="monotone" dataKey="cashflow" name="Cashflow" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sensibilité au taux</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sensitivity?.rate_sensitivity || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="rate" tickFormatter={(v) => `${v}%`} />
                  <YAxis tickFormatter={(v) => `${v}€`} />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="cashflow" name="Cashflow" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Line type="monotone" dataKey="monthly_payment" name="Mensualité" stroke="hsl(var(--chart-4))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Matrice de sensibilité (Prix / Loyer)</CardTitle>
          <CardDescription>Rentabilité nette selon différentes combinaisons</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left">Prix \ Loyer</th>
                  {[...new Set(sensitivity?.heatmap?.map(h => h.rent) || [])].slice(0, 5).map((rent, i) => (
                    <th key={i} className="py-2 text-center">{rent}€</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...new Set(sensitivity?.heatmap?.map(h => h.price) || [])].slice(0, 5).map((price, i) => (
                  <tr key={i} className="border-b border-muted">
                    <td className="py-2 font-medium">{formatCurrency(price)}</td>
                    {[...new Set(sensitivity?.heatmap?.map(h => h.rent) || [])].slice(0, 5).map((rent, j) => {
                      const cell = sensitivity?.heatmap?.find(h => h.price === price && h.rent === rent);
                      const yieldVal = cell?.net_yield || 0;
                      const color = yieldVal >= 5 ? 'bg-green-100 text-green-800' : 
                                   yieldVal >= 3 ? 'bg-yellow-100 text-yellow-800' : 
                                   'bg-red-100 text-red-800';
                      return (
                        <td key={j} className={`py-2 text-center ${color}`}>
                          {yieldVal.toFixed(1)}%
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimulationDetails;