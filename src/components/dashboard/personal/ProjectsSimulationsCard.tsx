import { Building2, PiggyBank, LineChart, ChevronRight, Plus, FileDown, Settings } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/dashboardService';

interface ProjectSummary {
  id: string;
  type: 'immobilier' | 'epargne';
  title: string;
  effortMensuel: number;
  rendementEstime: number;
  risqueLabel: string;
  status: 'draft' | 'active' | 'completed';
}

// Mock projects - in real app, this would come from Supabase
const mockProjects: ProjectSummary[] = [
  {
    id: '1',
    type: 'immobilier',
    title: 'Investissement locatif Paris',
    effortMensuel: 450,
    rendementEstime: 5.2,
    risqueLabel: 'Modéré',
    status: 'active'
  },
  {
    id: '2',
    type: 'epargne',
    title: 'Épargne PEA long terme',
    effortMensuel: 300,
    rendementEstime: 7.0,
    risqueLabel: 'Équilibré',
    status: 'active'
  }
];

const getProjectIcon = (type: string) => {
  switch (type) {
    case 'immobilier': return <Building2 className="h-5 w-5" />;
    case 'epargne': return <PiggyBank className="h-5 w-5" />;
    default: return <LineChart className="h-5 w-5" />;
  }
};

const getRiskColor = (risk: string) => {
  if (risk.toLowerCase().includes('faible')) return 'text-success';
  if (risk.toLowerCase().includes('modéré') || risk.toLowerCase().includes('équilibré')) return 'text-warning';
  return 'text-destructive';
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'draft': return { label: 'Brouillon', color: 'bg-muted text-muted-foreground' };
    case 'active': return { label: 'Actif', color: 'bg-success/10 text-success' };
    case 'completed': return { label: 'Terminé', color: 'bg-info/10 text-info' };
    default: return { label: status, color: 'bg-muted text-muted-foreground' };
  }
};

const ProjectItem = ({ project }: { project: ProjectSummary }) => {
  const navigate = useNavigate();
  const statusBadge = getStatusBadge(project.status);
  
  const handleClick = () => {
    if (project.type === 'immobilier') {
      navigate('/simulator');
    } else {
      navigate('/savings');
    }
  };

  return (
    <div 
      className="p-4 rounded-xl bg-secondary/30 border border-border/50 hover:border-primary/30 transition-all cursor-pointer group"
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-lg ${
          project.type === 'immobilier' ? 'bg-info/10 text-info' : 'bg-success/10 text-success'
        }`}>
          {getProjectIcon(project.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
              {project.title}
            </h4>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusBadge.color}`}>
              {statusBadge.label}
            </span>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>
              <strong className="text-foreground">{formatCurrency(project.effortMensuel)}</strong>/mois
            </span>
            <span>
              Rdt <strong className="text-success">{project.rendementEstime.toFixed(1)}%</strong>
            </span>
            <span className={getRiskColor(project.risqueLabel)}>
              {project.risqueLabel}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <FileDown className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export const ProjectsSimulationsCard = () => {
  const navigate = useNavigate();
  const projects = mockProjects; // In real app: useQuery to fetch from Supabase

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-info/10">
              <LineChart className="h-5 w-5 text-info" />
            </div>
            Projets & Simulations
          </CardTitle>
          <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => navigate('/simulator/new')}>
            <Plus className="h-3.5 w-3.5" />
            Nouveau
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">Vos projets d'investissement actifs</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {projects.length > 0 ? (
          <>
            {projects.map((project) => (
              <ProjectItem key={project.id} project={project} />
            ))}
            
            {/* Quick access links */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button 
                variant="ghost" 
                className="justify-start text-muted-foreground hover:text-foreground h-auto py-2"
                onClick={() => navigate('/simulator')}
              >
                <Building2 className="h-4 w-4 mr-2" />
                Simulateur Immo
                <ChevronRight className="h-4 w-4 ml-auto" />
              </Button>
              <Button 
                variant="ghost" 
                className="justify-start text-muted-foreground hover:text-foreground h-auto py-2"
                onClick={() => navigate('/savings')}
              >
                <PiggyBank className="h-4 w-4 mr-2" />
                Simulateur Épargne
                <ChevronRight className="h-4 w-4 ml-auto" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-4 rounded-full bg-muted/50 mb-4">
              <LineChart className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-2">Aucun projet en cours</p>
            <p className="text-sm text-muted-foreground/70 mb-4 max-w-xs">
              Lancez une simulation immobilière ou d'épargne pour visualiser votre patrimoine futur.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/simulator/new')}>
                <Building2 className="h-4 w-4 mr-1" />
                Immobilier
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/savings')}>
                <PiggyBank className="h-4 w-4 mr-1" />
                Épargne
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
