import { useState, useCallback, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { FolderLock, Upload, File, Image, FileText, Loader2, CalendarPlus, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { analyzeDocumentForDeadlines } from '@/lib/recurringDeadlinesService';

interface StoredFile {
  name: string;
  created_at: string;
  metadata: { size: number; mimetype: string };
}

const getFileIcon = (name: string) => {
  if (name.match(/\.(jpg|jpeg|png|webp)$/i)) return Image;
  if (name.match(/\.pdf$/i)) return FileText;
  return File;
};

const CoffreFortPage = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [analyzedFiles, setAnalyzedFiles] = useState<Set<string>>(new Set());

  const loadFiles = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.storage
        .from('tax-documents')
        .list(user.id, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
      if (!error && data) {
        setFiles(data as unknown as StoredFile[]);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  const extractTextFromFile = async (file: globalThis.File): Promise<string> => {
    // For text-based files, read directly
    if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
      return await file.text();
    }
    // For PDFs and images, we'll send the raw content and let the AI handle it
    // In practice, for PDFs we'd need a proper parser, but we can send base64
    const buffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer).slice(0, 50000)));
    return `[Document: ${file.name}, type: ${file.type}]\n\nContenu base64 (extrait) : ${base64.substring(0, 10000)}`;
  };

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Le fichier ne doit pas dépasser 10 Mo');
      return;
    }

    setUploading(true);
    try {
      const path = `${user.id}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('tax-documents').upload(path, file);
      if (error) throw error;
      toast.success('Document ajouté au coffre-fort');
      loadFiles();

      // Auto-analyze for deadlines
      setAnalyzing(file.name);
      try {
        const textContent = await extractTextFromFile(file);
        const result = await analyzeDocumentForDeadlines(textContent, path);
        if (result.deadlines && result.deadlines.length > 0) {
          toast.success(`${result.deadlines.length} échéance(s) détectée(s) et ajoutée(s) à ton calendrier !`, {
            icon: '📅',
            duration: 5000,
          });
          setAnalyzedFiles(prev => new Set(prev).add(file.name));
        } else {
          toast.info('Aucune échéance récurrente détectée dans ce document.');
        }
      } catch (analyzeErr) {
        console.error('Document analysis error:', analyzeErr);
        // Non-blocking - the upload still succeeded
      } finally {
        setAnalyzing(null);
      }
    } catch {
      toast.error("Erreur lors de l'envoi du document");
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }, [user, loadFiles]);

  const handleAnalyzeExisting = useCallback(async (fileName: string) => {
    if (!user) return;
    setAnalyzing(fileName);
    try {
      // Download file content for analysis
      const path = `${user.id}/${fileName}`;
      const { data, error } = await supabase.storage.from('tax-documents').download(path);
      if (error) throw error;

      const text = await data.text();
      const result = await analyzeDocumentForDeadlines(text, path);
      if (result.deadlines && result.deadlines.length > 0) {
        toast.success(`${result.deadlines.length} échéance(s) détectée(s) et ajoutée(s) à ton calendrier !`, {
          icon: '📅',
          duration: 5000,
        });
        setAnalyzedFiles(prev => new Set(prev).add(fileName));
      } else {
        toast.info('Aucune échéance récurrente détectée dans ce document.');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      toast.error("Erreur lors de l'analyse du document");
    } finally {
      setAnalyzing(null);
    }
  }, [user]);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-foreground">Coffre-fort</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Tes documents fiscaux en sécurité, accessibles à tout moment. Les échéances sont détectées automatiquement.
          </p>
        </motion.div>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <label className="flex flex-col items-center justify-center gap-3 py-8 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/40 transition-colors">
              {uploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : (
                <Upload className="h-8 w-8 text-muted-foreground" />
              )}
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  {uploading ? 'Envoi en cours...' : 'Ajouter un document'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">PDF, image — max 10 Mo • Les échéances seront détectées automatiquement</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
          </CardContent>
        </Card>

        {analyzing && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl p-4"
          >
            <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Analyse en cours...</p>
              <p className="text-xs text-muted-foreground">
                Détection des échéances dans « {analyzing} »
              </p>
            </div>
          </motion.div>
        )}

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Tes documents ({files.length})
          </h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : files.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="p-8 text-center">
                <FolderLock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Aucun document pour l'instant. Ajoute ton premier contrat ou avis d'imposition.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {files.map((file, i) => {
                const FileIcon = getFileIcon(file.name);
                const isAnalyzed = analyzedFiles.has(file.name);
                const isAnalyzing = analyzing === file.name;
                return (
                  <motion.div
                    key={file.name}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-card rounded-lg border border-border p-4 flex items-center gap-3"
                  >
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {file.name.replace(/^\d+_/, '')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {file.created_at && format(new Date(file.created_at), 'dd MMM yyyy', { locale: fr })}
                      </p>
                    </div>
                    {isAnalyzed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    ) : (
                      <button
                        onClick={() => handleAnalyzeExisting(file.name)}
                        disabled={isAnalyzing}
                        className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium shrink-0 disabled:opacity-50"
                        title="Détecter les échéances"
                      >
                        {isAnalyzing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CalendarPlus className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default CoffreFortPage;
