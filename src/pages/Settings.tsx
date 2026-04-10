import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { User, Lock, Bell, Shield, Trash2, LogOut, Moon, Sun } from 'lucide-react';

const passwordSchema = z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères');

const Settings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  // Profile
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [profileLoading, setProfileLoading] = useState(false);

  // Notifications prefs (local state for now)
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);

  // Delete account
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    const result = passwordSchema.safeParse(newPassword);
    if (!result.success) errors.newPassword = result.error.errors[0].message;
    if (newPassword !== confirmPassword) errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    if (!currentPassword) errors.currentPassword = 'Veuillez entrer ton mot de passe actuel';

    setPasswordErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setPasswordLoading(true);

    // Verify current password by re-signing in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user?.email || '',
      password: currentPassword,
    });

    if (signInError) {
      setPasswordErrors({ currentPassword: 'Mot de passe actuel incorrect' });
      setPasswordLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);

    if (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour le mot de passe.' });
    } else {
      toast({ title: 'Succès', description: 'Mot de passe mis à jour avec succès.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Le nom ne peut pas être vide.' });
      return;
    }

    setProfileLoading(true);

    const { error: authError } = await supabase.auth.updateUser({
      data: { full_name: fullName.trim() },
    });

    if (!authError && user) {
      await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('user_id', user.id);
    }

    setProfileLoading(false);

    if (authError) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour le profil.' });
    } else {
      toast({ title: 'Succès', description: 'Profil mis à jour.' });
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'SUPPRIMER') return;

    setDeleteLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Session expirée.' });
        setDeleteLoading(false);
        return;
      }

      const response = await supabase.functions.invoke('delete-user-account', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error || response.data?.error) {
        toast({ variant: 'destructive', title: 'Erreur', description: response.data?.error || 'Impossible de supprimer le compte.' });
        setDeleteLoading(false);
        return;
      }

      // Clear local session
      await supabase.auth.signOut();
      setDeleteLoading(false);
      navigate('/auth', { replace: true });
      toast({ title: 'Compte supprimé', description: 'Ton compte et toutes tes données ont été définitivement supprimés.' });
    } catch (err) {
      console.error('Delete account error:', err);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Une erreur est survenue.' });
      setDeleteLoading(false);
    }
  };

  const handleSignOutAll = async () => {
    await supabase.auth.signOut({ scope: 'global' });
    navigate('/auth', { replace: true });
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Paramètres</h1>
          <p className="text-muted-foreground mt-1">Gérez ton compte et vos préférences</p>
        </div>

        {/* Profile Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>Informations personnelles</CardTitle>
            </div>
            <CardDescription>Modifie vos informations de profil</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="settings-email">Email</Label>
                <Input id="settings-email" value={user?.email || ''} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">L'email ne peut pas être modifié</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-name">Nom complet</Label>
                <Input
                  id="settings-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Votre nom"
                />
              </div>
              <Button type="submit" disabled={profileLoading}>
                {profileLoading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <CardTitle>Sécurité</CardTitle>
            </div>
            <CardDescription>Modifie ton mot de passe</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Mot de passe actuel</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                />
                {passwordErrors.currentPassword && (
                  <p className="text-sm text-destructive">{passwordErrors.currentPassword}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password-settings">Nouveau mot de passe</Label>
                <Input
                  id="new-password-settings"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
                {passwordErrors.newPassword && (
                  <p className="text-sm text-destructive">{passwordErrors.newPassword}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password-settings">Confirmer le nouveau mot de passe</Label>
                <Input
                  id="confirm-password-settings"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-sm text-destructive">{passwordErrors.confirmPassword}</p>
                )}
              </div>
              <Button type="submit" disabled={passwordLoading}>
                {passwordLoading ? 'Mise à jour...' : 'Changer le mot de passe'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>Gérez vos préférences de notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Notifications par email</Label>
                <p className="text-sm text-muted-foreground">Rappels fiscaux et alertes</p>
              </div>
              <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Notifications push</Label>
                <p className="text-sm text-muted-foreground">Alertes en temps réel</p>
              </div>
              <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
            </div>
          </CardContent>
        </Card>

        {/* Sessions Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Sessions</CardTitle>
            </div>
            <CardDescription>Gérez vos sessions actives</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Déconnectez-vous de toutes les sessions actives sur tous les appareils.
            </p>
            <Button variant="outline" onClick={handleSignOutAll} className="gap-2">
              <LogOut className="h-4 w-4" />
              Se déconnecter de partout
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">Zone de danger</CardTitle>
            </div>
            <CardDescription>Actions irréversibles sur ton compte</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              La suppression de ton compte est <strong>irréversible</strong>. Toutes tes données, simulations et documents seront définitivement supprimés.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Supprimer mon compte
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer ton compte ?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-3">
                    <p>Cette action est irréversible. Toutes tes données seront supprimées :</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>Profil fiscal et données personnelles</li>
                      <li>Simulations immobilières</li>
                      <li>Historique de scans fiscaux</li>
                      <li>Factures et données comptables</li>
                    </ul>
                    <div className="pt-2 space-y-2">
                      <Label htmlFor="delete-confirm">
                        Tapez <strong>SUPPRIMER</strong> pour confirmer
                      </Label>
                      <Input
                        id="delete-confirm"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="SUPPRIMER"
                      />
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== 'SUPPRIMER' || deleteLoading}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteLoading ? 'Suppression...' : 'Confirmer la suppression'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Settings;
