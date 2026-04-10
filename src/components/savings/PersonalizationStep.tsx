import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Target, 
  Calendar, 
  Wallet,
  TrendingUp,
  Shield,
  AlertTriangle,
  ChevronRight,
  Lightbulb,
  GraduationCap
} from 'lucide-react';
import { SavingsInputs } from '@/lib/savingsTypes';
import { RISK_PROFILES, getRiskProfileById } from '@/lib/savingsIndicesData';

interface PersonalizationStepProps {
  inputs: SavingsInputs;
  onChange: (inputs: SavingsInputs) => void;
  onProfileSelect: (profileId: string) => void;
  selectedProfileId: string;
}

export function PersonalizationStep({ 
  inputs, 
  onChange, 
  onProfileSelect,
  selectedProfileId 
}: PersonalizationStepProps) {
  
  // Determine suggested profile based on inputs
  const getSuggestedProfile = () => {
    const yearsToRetirement = 65 - inputs.age;
    
    if (inputs.objective === 'retraite') {
      if (yearsToRetirement > 20) return 'dynamique';
      if (yearsToRetirement > 10) return 'equilibre';
      if (yearsToRetirement > 5) return 'prudent';
      return 'securitaire';
    }
    
    if (inputs.durationYears >= 15) return 'dynamique';
    if (inputs.durationYears >= 8) return 'equilibre';
    if (inputs.durationYears >= 5) return 'prudent';
    return 'securitaire';
  };

  const suggestedProfileId = getSuggestedProfile();
  const selectedProfile = getRiskProfileById(selectedProfileId);

  const objectiveLabels = {
    retraite: 'Préparer ma retraite',
    capital: 'Constituer un capital',
    complement: 'Complément de revenus futur',
  };

  const tmiLabels: Record<number, string> = {
    0: 'Non imposable',
    11: 'TMI 11%',
    30: 'TMI 30%',
    41: 'TMI 41%',
    45: 'TMI 45%',
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Personnalisation avancée</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Affinez ton profil pour des recommandations plus précises.
        </p>
      </div>

      {/* Current Profile Summary */}
      <Card className="glass-card gradient-border">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Ta situation actuelle
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-muted/30 text-center">
              <Calendar className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xl font-bold">{inputs.age} ans</p>
              <p className="text-xs text-muted-foreground">Votre âge</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 text-center">
              <Wallet className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xl font-bold">{inputs.monthlyContribution}€</p>
              <p className="text-xs text-muted-foreground">Par mois</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 text-center">
              <Target className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xl font-bold">{inputs.durationYears} ans</p>
              <p className="text-xs text-muted-foreground">Horizon</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 text-center">
              <TrendingUp className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xl font-bold">{tmiLabels[inputs.tmi]}</p>
              <p className="text-xs text-muted-foreground">Fiscalité</p>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm">
              <strong>Objectif :</strong> {objectiveLabels[inputs.objective]}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Profile Selector */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Choisissez ton profil de risque
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-3">
            {RISK_PROFILES.map((profile) => {
              const isSelected = selectedProfileId === profile.id;
              const isSuggested = suggestedProfileId === profile.id;
              
              return (
                <button
                  key={profile.id}
                  onClick={() => onProfileSelect(profile.id)}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    isSelected 
                      ? 'bg-primary/10 border-primary ring-2 ring-primary' 
                      : 'bg-muted/30 border-border/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{profile.name}</span>
                    {isSuggested && (
                      <Badge variant="secondary" className="text-xs">
                        Conseillé
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5, 6, 7].map((level) => (
                      <div
                        key={level}
                        className={`w-2 h-4 rounded-sm ${
                          level <= profile.riskTolerance
                            ? level <= 2 ? 'bg-success' : level <= 4 ? 'bg-warning' : 'bg-destructive'
                            : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {profile.description}
                  </p>
                  <div className="mt-2 flex justify-between text-xs">
                    <span className="text-muted-foreground">Rend.</span>
                    <span className="font-medium text-success">+{profile.expectedReturn}%</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Profile Details */}
          {selectedProfile && (
            <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold">Profil {selectedProfile.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{selectedProfile.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">+{selectedProfile.expectedReturn}%</p>
                  <p className="text-xs text-muted-foreground">rendement annuel attendu</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Volatilité</p>
                  <p className="font-bold">{selectedProfile.expectedVolatility}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Horizon conseillé</p>
                  <p className="font-bold">{selectedProfile.horizon}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Supports</p>
                  <p className="font-bold">{selectedProfile.suggestedAllocation.length}</p>
                </div>
              </div>

              {/* Allocation Preview */}
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Allocation suggérée :</p>
                <div className="flex gap-1 h-3 rounded-full overflow-hidden">
                  {selectedProfile.suggestedAllocation.map((alloc, i) => (
                    <div
                      key={i}
                      className="h-full"
                      style={{
                        width: `${alloc.weight}%`,
                        backgroundColor: ['#1B3A5C', '#4B8264', '#f59e0b', '#8b5cf6', '#ec4899'][i % 5],
                      }}
                      title={`${alloc.indexId}: ${alloc.weight}%`}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedProfile.suggestedAllocation.map((alloc, i) => (
                    <span key={i} className="text-xs text-muted-foreground">
                      {alloc.indexId.replace(/-/g, ' ')}: {alloc.weight}%
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Educational Tips */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            À savoir sur les profils
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="horizon" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="horizon">Horizon</TabsTrigger>
              <TabsTrigger value="volatility">Volatilité</TabsTrigger>
              <TabsTrigger value="fiscalite">Fiscalité</TabsTrigger>
            </TabsList>

            <TabsContent value="horizon" className="mt-4">
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/30">
                  <Lightbulb className="h-5 w-5 text-primary mb-2" />
                  <p className="text-sm">
                    <strong>Plus ton horizon est long, plus tu peux prendre de risques.</strong>
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Sur 20 ans, les fluctuations à court terme s'effacent. Un profil dynamique 
                    devient alors pertinent car tu as le temps de récupérer d'éventuelles baisses.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="p-2 rounded bg-destructive/10">
                    <p className="font-semibold">0-5 ans</p>
                    <p className="text-xs text-muted-foreground">Sécuritaire/Prudent</p>
                  </div>
                  <div className="p-2 rounded bg-warning/10">
                    <p className="font-semibold">5-15 ans</p>
                    <p className="text-xs text-muted-foreground">Équilibré</p>
                  </div>
                  <div className="p-2 rounded bg-success/10">
                    <p className="font-semibold">15+ ans</p>
                    <p className="text-xs text-muted-foreground">Dynamique/Offensif</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="volatility" className="mt-4">
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/30">
                  <AlertTriangle className="h-5 w-5 text-warning mb-2" />
                  <p className="text-sm">
                    <strong>La volatilité mesure les fluctuations de valeur.</strong>
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Une volatilité de 15% signifie que votre portefeuille peut varier de 
                    +15% à -15% sur une année typique. Les baisses temporaires sont normales !
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                  <p className="text-sm">
                    <strong>Exemple concret :</strong> Un investissement de 10 000€ avec 15% de volatilité 
                    pourrait valoir entre 8 500€ et 11 500€ après un an, selon les conditions de marché.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="fiscalite" className="mt-4">
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/30">
                  <TrendingUp className="h-5 w-5 text-success mb-2" />
                  <p className="text-sm">
                    <strong>Votre TMI influence le choix entre PEA et PER.</strong>
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Plus votre TMI est élevé, plus le PER devient intéressant grâce à la 
                    déduction fiscale immédiate. À TMI 30%, chaque 1 000€ versés ne vous 
                    coûtent réellement que 700€.
                  </p>
                </div>
                {inputs.tmi >= 30 && (
                  <div className="p-4 rounded-lg bg-success/5 border border-success/20">
                    <p className="text-sm">
                      <strong>Avec votre TMI de {inputs.tmi}%</strong>, le PER peut être 
                      particulièrement avantageux. Économie d'impôt immédiate de {inputs.tmi}% 
                      sur vos versements.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
