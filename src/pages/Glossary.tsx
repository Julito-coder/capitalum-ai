import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { 
  Search, 
  BookOpen, 
  Receipt, 
  Building2, 
  Users, 
  PiggyBank, 
  FileText, 
  Scale,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  MessageCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  glossaryTerms, 
  categoryLabels, 
  getTermsByCategory, 
  searchTerms, 
  getTermById,
  getRelatedTerms,
  type GlossaryCategory,
  type GlossaryTerm 
} from '@/data/glossaryData';
import { ConversationHistory } from '@/components/glossary/ConversationHistory';

const categoryIcons: Record<GlossaryCategory, React.ReactNode> = {
  impots: <Receipt className="h-5 w-5" />,
  entreprise: <Building2 className="h-5 w-5" />,
  social: <Users className="h-5 w-5" />,
  patrimoine: <PiggyBank className="h-5 w-5" />,
  declarations: <FileText className="h-5 w-5" />,
  statuts: <Scale className="h-5 w-5" />
};

const Glossary = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GlossaryCategory | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);
  const [activeTab, setActiveTab] = useState('glossary');

  const filteredTerms = searchQuery 
    ? searchTerms(searchQuery)
    : selectedCategory 
      ? getTermsByCategory(selectedCategory)
      : [];

  const handleTermClick = (term: GlossaryTerm) => {
    setSelectedTerm(term);
  };

  const handleBack = () => {
    if (selectedTerm) {
      setSelectedTerm(null);
    } else if (selectedCategory) {
      setSelectedCategory(null);
    }
  };

  const handleRelatedTermClick = (termId: string) => {
    const term = getTermById(termId);
    if (term) {
      setSelectedTerm(term);
      setActiveTab('glossary');
    }
  };

  // Term detail view
  if (selectedTerm) {
    const relatedTerms = getRelatedTerms(selectedTerm.id);
    
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>

          {/* Term header */}
          <div className="glass-card rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                {categoryIcons[selectedTerm.category]}
              </div>
              <div className="flex-1">
                <Badge variant="outline" className="mb-2">
                  {categoryLabels[selectedTerm.category].label}
                </Badge>
                <h1 className="text-2xl font-bold mb-2">{selectedTerm.term}</h1>
                <p className="text-lg text-muted-foreground">{selectedTerm.shortDefinition}</p>
              </div>
            </div>
          </div>

          {/* Full explanation */}
          <div className="glass-card rounded-xl p-6 mb-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Explication détaillée
            </h2>
            <div className="prose prose-invert max-w-none">
              {selectedTerm.fullExplanation.split('\n\n').map((paragraph, i) => (
                <p key={i} className="mb-4 text-muted-foreground leading-relaxed whitespace-pre-line">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          {/* Examples */}
          {selectedTerm.examples && selectedTerm.examples.length > 0 && (
            <div className="glass-card rounded-xl p-6 mb-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Exemples concrets
              </h2>
              <ul className="space-y-3">
                {selectedTerm.examples.map((example, i) => (
                  <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <span className="text-primary font-bold">→</span>
                    <span className="text-muted-foreground">{example}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Related terms */}
          {relatedTerms.length > 0 && (
            <div className="glass-card rounded-xl p-6 mb-6">
              <h2 className="font-semibold mb-4">Termes associés</h2>
              <div className="flex flex-wrap gap-2">
                {relatedTerms.map(term => (
                  <Button
                    key={term.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleRelatedTermClick(term.id)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {term.term}
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Official source */}
          {selectedTerm.officialSource && (
            <div className="glass-card rounded-xl p-4">
              <a 
                href={selectedTerm.officialSource}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                Source officielle
              </a>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // Category list view
  if (selectedCategory) {
    const terms = getTermsByCategory(selectedCategory);
    
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Toutes les catégories
          </Button>

          {/* Category header */}
          <div className="glass-card rounded-xl p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                {categoryIcons[selectedCategory]}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{categoryLabels[selectedCategory].label}</h1>
                <p className="text-muted-foreground">{categoryLabels[selectedCategory].description}</p>
              </div>
            </div>
          </div>

          {/* Terms list */}
          <div className="space-y-3">
            {terms.map(term => (
              <button
                key={term.id}
                onClick={() => handleTermClick(term)}
                className="w-full text-left glass-card rounded-xl p-4 hover:border-primary/30 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {term.term}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {term.shortDefinition}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  // Main view with categories and search
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-xl bg-primary/10">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Glossaire fiscal</h1>
            <p className="text-muted-foreground">Formez-vous sur tous les sujets finance et fiscalité</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="glossary" className="gap-2">
              <BookOpen className="h-4 w-4" /> Glossaire
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <MessageCircle className="h-4 w-4" /> Historique conversations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="glossary">
            {/* Search */}
            <div className="relative mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher un terme fiscal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-6 text-lg bg-muted/50 border-border"
              />
            </div>

            {/* Search results */}
            {searchQuery && (
              <div className="mb-8">
                <h2 className="text-sm font-medium text-muted-foreground mb-4">
                  {filteredTerms.length} résultat{filteredTerms.length > 1 ? 's' : ''} pour "{searchQuery}"
                </h2>
                <div className="space-y-3">
                  {filteredTerms.map(term => (
                    <button
                      key={term.id}
                      onClick={() => handleTermClick(term)}
                      className="w-full text-left glass-card rounded-xl p-4 hover:border-primary/30 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {categoryLabels[term.category].label}
                            </Badge>
                          </div>
                          <h3 className="font-semibold group-hover:text-primary transition-colors">
                            {term.term}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {term.shortDefinition}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </button>
                  ))}
                  {filteredTerms.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucun terme trouvé. Essayez une autre recherche.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Categories grid */}
            {!searchQuery && (
              <>
                <h2 className="text-lg font-semibold mb-4">Parcourir par catégorie</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {(Object.keys(categoryLabels) as GlossaryCategory[]).map(category => {
                    const termsCount = getTermsByCategory(category).length;
                    return (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className="glass-card rounded-xl p-5 hover:border-primary/30 transition-all group text-left"
                      >
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            {categoryIcons[category]}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold group-hover:text-primary transition-colors">
                              {categoryLabels[category].label}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {categoryLabels[category].description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {termsCount} terme{termsCount > 1 ? 's' : ''}
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors mt-1" />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Popular terms */}
                <h2 className="text-lg font-semibold mb-4">Termes populaires</h2>
                <div className="flex flex-wrap gap-2">
                  {glossaryTerms.slice(0, 12).map(term => (
                    <Button
                      key={term.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleTermClick(term)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {term.term}
                    </Button>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="history">
            <ConversationHistory
              onSelectGlossaryTerm={handleRelatedTermClick}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Glossary;
