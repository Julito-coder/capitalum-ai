import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { UserCircle, FileText, Settings, ChevronRight, LogOut, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { loadFiscalProfile, calculateProfileCompletion } from '@/lib/fiscalProfileService';

const ProfilPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [completion, setCompletion] = useState(0);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    try {
      const [fiscalData, { data }] = await Promise.all([
        loadFiscalProfile(user.id),
        supabase.from('profiles').select('full_name').eq('user_id', user.id).maybeSingle(),
      ]);
      setFullName((data as Record<string, unknown>)?.full_name as string || '');
      setCompletion(calculateProfileCompletion(fiscalData));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-foreground">Mon profil</h1>
        </motion.div>

        <Card className="shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <UserCircle className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">{fullName || 'Utilisateur'}</p>
              <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Complétude du profil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{completion}% complété</span>
              <span className="text-xs text-muted-foreground">
                {completion < 100 ? 'Continue pour des recommandations plus précises' : 'Profil complet'}
              </span>
            </div>
            <Progress value={completion} className="h-2" />
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => navigate('/profil/fiscal')}
            >
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Mon profil fiscal
              </span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-2">
            <Button
              variant="ghost"
              className="w-full justify-between py-4"
              onClick={() => navigate('/profil/parametres')}
            >
              <span className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Paramètres
              </span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Button
          variant="ghost"
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Déconnexion
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Élio fournit des estimations à titre indicatif. Elles ne constituent pas un conseil fiscal personnalisé au sens de l'article L. 541-1 du Code monétaire et financier.
        </p>
      </div>
    </AppLayout>
  );
};

export default ProfilPage;
