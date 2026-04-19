import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { fetchProjects, deleteProject, duplicateProject } from "@/lib/realEstateService";
import { RealEstateProject } from "@/lib/realEstateTypes";
import { Plus, Copy, Trash2, Eye, Building2, Home, Loader2, TrendingUp, MapPin } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/data/mockData";

const RealEstateSimulator = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<RealEstateProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadProjects();
  }, [user]);

  const loadProjects = async () => {
    try {
      const data = await fetchProjects();
      setProjects(data);
    } catch (error) {
      toast.error("Erreur lors du chargement des projets");
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    if (!user) return;
    try {
      await duplicateProject(id, user.id);
      toast.success("Projet dupliqué");
      loadProjects();
    } catch (error) {
      toast.error("Erreur lors de la duplication");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProject(id);
      toast.success("Projet supprimé");
      loadProjects();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Simulateur Immobilier</h1>
            <p className="text-muted-foreground">Locatif & Résidence Principale</p>
          </div>
          <div className="flex gap-2">
            {projects.length >= 2 && (
              <Button variant="outline" onClick={() => navigate("/outils/simulateur/compare")} className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Comparer
              </Button>
            )}
            <Button onClick={() => navigate("/outils/simulateur/new")} className="gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle simulation
            </Button>
          </div>
        </div>

        {projects.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune simulation</h3>
              <p className="text-muted-foreground text-center mb-4">
                Créez votre première simulation immobilière pour analyser rentabilité, cashflow et fiscalité.
              </p>
              <Button onClick={() => navigate("/outils/simulateur/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Créer une simulation
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {project.type === 'LOCATIF' ? (
                        <Building2 className="h-5 w-5 text-primary" />
                      ) : (
                        <Home className="h-5 w-5 text-primary" />
                      )}
                      <CardTitle className="text-base">{project.title}</CardTitle>
                    </div>
                    <Badge variant={project.type === 'LOCATIF' ? 'default' : 'secondary'}>
                      {project.type === 'LOCATIF' ? 'Locatif' : 'RP'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{project.city || 'Non défini'}</span>
                    <span>•</span>
                    <span>{project.surface_m2} m²</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-muted-foreground">Horizon:</span>
                    <span className="font-medium">{project.horizon_years} ans</span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {project.tags?.slice(0, 3).map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(`/simulator/${project.id}`)}>
                      <Eye className="h-4 w-4 mr-1" />
                      Voir
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDuplicate(project.id)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(project.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RealEstateSimulator;
