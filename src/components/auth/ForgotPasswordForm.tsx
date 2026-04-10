import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Mail } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Adresse email invalide');

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export const ForgotPasswordForm = ({ onBack }: ForgotPasswordFormProps) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setIsLoading(false);

    if (resetError) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: "Impossible d'envoyer l'email de réinitialisation.",
      });
    } else {
      setEmailSent(true);
    }
  };

  if (emailSent) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Email envoyé</h3>
        <p className="text-sm text-muted-foreground">
          Si un compte existe avec l'adresse <strong>{email}</strong>, vous recevrez un email avec un lien de réinitialisation.
        </p>
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Retour à la connexion
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Mot de passe oublié</h3>
        <p className="text-sm text-muted-foreground">
          Entrez ton email pour recevoir un lien de réinitialisation.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="reset-email">Email</Label>
        <Input
          id="reset-email"
          type="email"
          placeholder="ton@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Envoi...' : 'Envoyer le lien'}
      </Button>
      <Button type="button" variant="ghost" onClick={onBack} className="w-full gap-2">
        <ArrowLeft className="h-4 w-4" />
        Retour à la connexion
      </Button>
    </form>
  );
};
