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
    navigate(project.type === 'immobilier' ? '/simulator' : '/savings');
  };

  return (
    <div 
      className="p-4 rounded-xl bg-secondary/30 border border-border/20 active:scale-[0.99] transition-transform cursor-pointer min-h-[72px]"
      onClick={handleClick}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl shrink-0 ${
          project.type === 'immobilier' ? 'bg-info/10 text-info' : 'bg-success/10 text-success'
        }`}>
          {getProjectIcon(project.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold truncate">
              {project.title}
            </h4>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${statusBadge.color}`}>
              {statusBadge.label}
            </span>
          </div>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>
              <strong className="text-foreground">{formatCurrency(project.effortMensuel)}</strong>/mois
            </span>
            <span>
              <strong className="text-success">{project.rendementEstime.toFixed(1)}%</strong>
            </span>
            <span className={getRiskColor(project.risqueLabel)}>
              {project.risqueLabel}
            </span>
          </div>
        </div>
        
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
    </div>
  );
};

export const ProjectsSimulationsCard = () => {
  const navigate = useNavigate();
  const projects = mockProjects;

  return (
    <Card className="border border-border/30 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3 pt-5 px-5 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-info/10 shrink-0">
              <LineChart className="h-5 w-5 text-info" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base sm:text-lg font-semibold">
                Projets & Simulations
              </CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground">Vos investissements</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 gap-1.5 shrink-0 min-w-[44px]" 
            onClick={() => navigate('/simulator/new')}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nouveau</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-3">
        {projects.length > 0 ? (
          <>
            {projects.map((project) => (
              <ProjectItem key={project.id} project={project} />
            ))}
            
            {/* Quick access - mobile friendly grid */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button 
                variant="ghost" 
                className="justify-start text-muted-foreground hover:text-foreground h-11 px-3"
                onClick={() => navigate('/simulator')}
              >
                <Building2 className="h-4 w-4 mr-2 shrink-0" />
                <span className="truncate">Immo</span>
              </Button>
              <Button 
                variant="ghost" 
                className="justify-start text-muted-foreground hover:text-foreground h-11 px-3"
                onClick={() => navigate('/savings')}
              >
                <PiggyBank className="h-4 w-4 mr-2 shrink-0" />
                <span className="truncate">Épargne</span>
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-4 rounded-2xl bg-muted/30 mb-4">
              <LineChart className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-base font-medium mb-1">Aucun projet</p>
            <p className="text-sm text-muted-foreground mb-5 max-w-[260px]">
              Lancez une simulation pour visualiser ton patrimoine futur.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="min-h-[44px]" onClick={() => navigate('/simulator/new')}>
                <Building2 className="h-4 w-4 mr-1.5" />
                Immobilier
              </Button>
              <Button variant="outline" className="min-h-[44px]" onClick={() => navigate('/savings')}>
                <PiggyBank className="h-4 w-4 mr-1.5" />
                Épargne
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
