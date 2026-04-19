import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, TrendingDown, TrendingUp, Info } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { compareSeparateVsJoint } from '@/lib/pacsCalculations';
import { formatCurrency } from '@/data/mockData';

const PacsSimulator = () => {
  const navigate = useNavigate();
  const [revenuA, setRevenuA] = useState(35000);
  const [revenuB, setRevenuB] = useState(25000);
  const [enfants, setEnfants] = useState(0);
  const [parentIsoleAvant, setParentIsoleAvant] = useState(false);
  const [pensionVersee, setPensionVersee] = useState(0);
  const [pensionRecue, setPensionRecue] = useState(0);

  const result = useMemo(
    () => compareSeparateVsJoint({ revenuA, revenuB, enfants, parentIsoleAvant, pensionVersee, pensionRecue }),
    [revenuA, revenuB, enfants, parentIsoleAvant, pensionVersee, pensionRecue]
  );

  const isAdvantageous = result.savings > 100;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6 pb-24">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="ghost" size="sm" onClick={() => navigate('/simulateurs')} className="mb-2 -ml-2">
            <ArrowLeft className="h-4 w-4" /> Retour
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">PACS / Mariage</h1>
              <p className="text-sm text-muted-foreground">Compare ton impôt avant et après l'union</p>
            </div>
          </div>
        </motion.div>

        <Card>
          <CardContent className="p-5 space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Ton revenu net imposable annuel</Label>
                <span className="font-semibold text-foreground">{formatCurrency(revenuA)}</span>
              </div>
              <Slider value={[revenuA]} onValueChange={(v) => setRevenuA(v[0])} min={0} max={150000} step={1000} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Revenu net imposable de ton/ta partenaire</Label>
                <span className="font-semibold text-foreground">{formatCurrency(revenuB)}</span>
              </div>
              <Slider value={[revenuB]} onValueChange={(v) => setRevenuB(v[0])} min={0} max={150000} step={1000} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Enfants à charge</Label>
                <span className="font-semibold text-foreground">{enfants}</span>
              </div>
              <Slider value={[enfants]} onValueChange={(v) => setEnfants(v[0])} min={0} max={6} step={1} />
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <div>
                <Label>Parent isolé avant l'union</Label>
                <p className="text-xs text-muted-foreground mt-1">Case T : demi-part supplémentaire</p>
              </div>
              <Switch checked={parentIsoleAvant} onCheckedChange={setParentIsoleAvant} />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <Label className="text-xs">Pension versée (€/an)</Label>
                <Input
                  type="number"
                  value={pensionVersee || ''}
                  onChange={(e) => setPensionVersee(Number(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Pension reçue (€/an)</Label>
                <Input
                  type="number"
                  value={pensionRecue || ''}
                  onChange={(e) => setPensionRecue(Number(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={isAdvantageous ? 'border-success/40' : 'border-border'}>
          <CardContent className="p-5 space-y-4">
            <div className="text-center space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Économie annuelle estimée</p>
              <p className={`text-4xl font-bold ${isAdvantageous ? 'text-success' : 'text-foreground'}`}>
                {result.savings > 0 ? '+' : ''}
                {formatCurrency(result.savings)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Impôt séparé</p>
                <p className="text-lg font-semibold text-foreground">{formatCurrency(result.separateIR)}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Impôt en commun</p>
                <p className="text-lg font-semibold text-foreground">{formatCurrency(result.jointIR)}</p>
              </div>
            </div>

            <div className={`flex gap-3 rounded-lg p-3 ${isAdvantageous ? 'bg-success/10' : 'bg-muted/40'}`}>
              {isAdvantageous ? (
                <TrendingDown className="h-5 w-5 text-success shrink-0" />
              ) : (
                <TrendingUp className="h-5 w-5 text-warning shrink-0" />
              )}
              <p className="text-sm text-foreground">{result.recommendation}</p>
            </div>

            <div className="flex gap-3 rounded-lg bg-info/10 p-3">
              <Info className="h-5 w-5 text-info shrink-0" />
              <p className="text-xs text-foreground">
                <strong>Année de l'union :</strong> tu peux choisir entre déclaration commune ou séparée pour l'année du
                PACS/mariage. À partir de l'année suivante, la déclaration commune est obligatoire.
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center px-4">
          Élio fournit des estimations à titre indicatif basées sur le barème 2025. Pour toute décision fiscale, consulte
          un professionnel habilité.
        </p>
      </div>
    </AppLayout>
  );
};

export default PacsSimulator;
