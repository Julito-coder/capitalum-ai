import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { 
  Send, 
  Bot, 
  User,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const initialMessages: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: `Bonjour ! 👋 Je suis votre assistant fiscal Capitalum.

Je peux vous aider à comprendre vos calculs, expliquer les recommandations et répondre à toutes vos questions fiscales.

**Questions fréquentes :**
• Pourquoi j'aurais 690€ d'économies avec les frais réels ?
• C'est quoi exactement le PER ?
• Comment fonctionne le seuil micro-entrepreneur ?

Que puis-je faire pour vous ?`,
    timestamp: new Date()
  }
];

const suggestedQuestions = [
  "Pourquoi les frais réels sont plus avantageux pour moi ?",
  "Combien je peux verser sur mon PER ?",
  "Que se passe-t-il si je dépasse le seuil micro ?"
];

const Assistant = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const response = generateResponse(messageText);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const generateResponse = (question: string): string => {
    const lowerQ = question.toLowerCase();
    
    if (lowerQ.includes('frais réels') || lowerQ.includes('690')) {
      return `**Bonne question !** Voici le calcul détaillé :

**Votre revenu net :** 28 400€

**Option A — Abattement 10%**
• Déduction automatique : 28 400€ × 10% = **2 840€**
• Revenu imposable : 25 560€

**Option B — Frais réels (recommandée ✅)**
• Dépenses réelles détectées : **4 300€**
• Revenu imposable : 24 100€

**Différence :**
• 25 560€ - 24 100€ = 1 460€ de revenu en moins
• 1 460€ × 45% (taux marginal) = **657€ d'IR économisé**

**Effort requis :**
• Classer vos factures (15 min, déjà en cours)
• Garder les justificatifs 6 ans

➜ **GAIN NET : +657€ d'IR** ✅`;
    }
    
    if (lowerQ.includes('per')) {
      return `**Le PER (Plan Épargne Retraite)** est un placement qui vous permet de déduire vos versements de votre revenu imposable.

**Pour vous :**
• Revenu 2024 : 28 400€
• Plafond PER : (28 400€ × 10%) + 1 250€ = **4 090€**
• Versement recommandé : **3 400€**

**Impact fiscal immédiat :**
• 3 400€ × 45% (TMI) = **1 530€ d'économies**

**Avantages :**
✅ Déduction fiscale immédiate
✅ Épargne bloquée = discipline
✅ Rendement moyen 5%/an

**Inconvénient :**
⚠️ Argent bloqué jusqu'à la retraite (sauf exceptions)

⏰ **Date limite : 31 décembre 2024**

Voulez-vous que je vous explique comment ouvrir un PER ?`;
    }
    
    if (lowerQ.includes('seuil') || lowerQ.includes('micro')) {
      return `**Le seuil micro-entrepreneur** est crucial pour votre régime fiscal.

**Seuil 2024 :** 28 050€ de CA
**Votre CA projeté :** 30 200€

⚠️ **Vous dépassez de 2 150€**

**Conséquences du dépassement :**
1. Passage au régime réel simplifié
2. Comptabilité plus complexe
3. TVA applicable (si > 36 800€)
4. Cotisations calculées différemment

**Vos options :**
1. **Freiner** les facturations en décembre
2. **Basculer** au réel (et optimiser vos charges)
3. **Laisser** dépasser (coût estimé : +6 200€)

💡 Avec vos dépenses réelles (4 300€), le régime réel peut être avantageux !

Voulez-vous une simulation détaillée ?`;
    }
    
    return `Je comprends votre question sur "${question}".

Pour vous donner une réponse précise, j'aurais besoin de plus de contexte. 

**Je peux vous aider avec :**
• Les calculs d'impôt sur le revenu
• Les recommandations d'optimisation
• Le fonctionnement du régime micro
• Les cotisations URSSAF
• Le calendrier fiscal

N'hésitez pas à me poser une question plus spécifique ! 😊`;
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-xl bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Assistant fiscal</h1>
            <p className="text-sm text-muted-foreground">Posez vos questions, je vous explique tout</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
            >
              {message.role === 'assistant' && (
                <div className="p-2 rounded-lg bg-primary/10 h-fit">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl p-4 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'glass-card'
                }`}
              >
                <div className="prose prose-sm prose-invert max-w-none">
                  {message.content.split('\n').map((line, i) => (
                    <p key={i} className="mb-2 last:mb-0">
                      {line.startsWith('**') ? (
                        <strong>{line.replace(/\*\*/g, '')}</strong>
                      ) : line.startsWith('•') || line.startsWith('✅') || line.startsWith('⚠️') ? (
                        <span className="block ml-2">{line}</span>
                      ) : (
                        line
                      )}
                    </p>
                  ))}
                </div>
              </div>
              {message.role === 'user' && (
                <div className="p-2 rounded-lg bg-muted h-fit">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-primary/10 h-fit">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="glass-card rounded-2xl p-4">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Suggestions */}
        {messages.length < 3 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                className="text-sm px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
              >
                {q}
                <ArrowRight className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Posez votre question..."
            className="flex-1 bg-muted/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim()}
            className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Assistant;
