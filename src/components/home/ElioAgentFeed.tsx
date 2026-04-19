import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, TrendingUp, AlertCircle, Lightbulb, X, ArrowRight, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FeedItem {
  id: string;
  type: 'deadline' | 'optimization' | 'alert' | 'insight' | string;
  title: string;
  message: string;
  priority: number;
  data: any;
}

const TYPE_STYLE: Record<string, { bg: string; icon: any; iconColor: string }> = {
  deadline:     { bg: '#FFF4E6', icon: Clock,        iconColor: '#C8943E' },
  optimization: { bg: '#F0F7FF', icon: TrendingUp,   iconColor: '#1B3A5C' },
  alert:        { bg: '#FFE8E8', icon: AlertCircle,  iconColor: '#C9432E' },
  insight:      { bg: '#F5F0FF', icon: Lightbulb,    iconColor: '#7B5BC0' },
};

export const ElioAgentFeed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const nowIso = new Date().toISOString();
      const { data } = await supabase
        .from('notifications')
        .select('id, type, title, message, priority, data, expires_at')
        .eq('user_id', user.id)
        .eq('category', 'agent_proactive')
        .eq('is_dismissed', false)
        .or(`expires_at.is.null,expires_at.gte.${nowIso}`)
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(5);
      setItems((data as FeedItem[]) || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const handleAction = (item: FeedItem) => {
    const prompt = item.data?.action_prompt;
    navigate('/agent', { state: { initialPrompt: prompt } });
  };

  const handleDismiss = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await supabase.from('notifications').update({ is_dismissed: true }).eq('id', id);
  };

  if (loading) return null;

  if (items.length === 0) {
    return (
      <div
        className="rounded-xl border border-[#E5DED3] bg-white p-5 text-center"
        style={{ fontFamily: 'Sora' }}
      >
        <Sparkles className="w-5 h-5 text-[#C8943E] mx-auto mb-2" />
        <p className="text-sm font-medium text-[#1B3A5C]">Tout est à jour</p>
        <p className="text-xs text-[#6B7A8D] mt-1">
          Élio vérifiera à nouveau lundi prochain.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3" style={{ fontFamily: 'Sora' }}>
      <h2 className="text-base font-semibold text-[#1B3A5C] flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[#C8943E]" />
        Ce qu'Élio a repéré pour toi
      </h2>
      {items.map((item) => {
        const style = TYPE_STYLE[item.type] || TYPE_STYLE.insight;
        const Icon = style.icon;
        const gain = item.data?.estimated_gain;
        const actionLabel = item.data?.action_label || 'Voir';
        return (
          <div
            key={item.id}
            className="relative rounded-xl border border-[#E5DED3] p-4"
            style={{ background: style.bg }}
          >
            {gain > 0 && (
              <span className="absolute top-3 right-10 text-xs font-semibold text-white bg-[#C8943E] px-2 py-0.5 rounded-full">
                +{gain}€
              </span>
            )}
            <button
              onClick={() => handleDismiss(item.id)}
              className="absolute top-3 right-3 text-[#6B7A8D] hover:text-[#1B3A5C] transition-colors"
              aria-label="Ignorer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex gap-3 pr-8">
              <div className="shrink-0 w-9 h-9 rounded-lg bg-white/70 flex items-center justify-center">
                <Icon className="w-5 h-5" style={{ color: style.iconColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-[#1B3A5C]">{item.title}</h3>
                <p className="text-sm text-[#1F3347] mt-1 leading-relaxed">{item.message}</p>
                <button
                  onClick={() => handleAction(item)}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#C8943E] hover:text-[#1B3A5C] transition-colors"
                >
                  {actionLabel}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
