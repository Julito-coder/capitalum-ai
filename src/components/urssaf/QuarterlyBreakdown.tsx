import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  ChevronRight, 
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { QuarterData } from '@/lib/urssafService';
import { formatCurrency } from '@/lib/dashboardService';

interface QuarterlyBreakdownProps {
  quarters: QuarterData[];
  onTogglePaid: (month: number, isPaid: boolean) => Promise<void>;
  loading?: boolean;
}

export const QuarterlyBreakdown = ({ 
  quarters, 
  onTogglePaid,
  loading = false 
}: QuarterlyBreakdownProps) => {
  const [expandedQuarters, setExpandedQuarters] = useState<number[]>([1, 2, 3, 4]);

  const toggleQuarter = (quarter: number) => {
    setExpandedQuarters(prev => 
      prev.includes(quarter) 
        ? prev.filter(q => q !== quarter)
        : [...prev, quarter]
    );
  };

  const getQuarterStatus = (quarter: QuarterData) => {
    const today = new Date();
    const dueDate = new Date(quarter.dueDate);
    
    if (quarter.allPaid) return 'paid';
    if (today > dueDate) return 'overdue';
    return 'pending';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-success/20 text-success border-success/30">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Payé
          </Badge>
        );
      case 'overdue':
        return (
          <Badge className="bg-destructive/20 text-destructive border-destructive/30">
            <AlertCircle className="h-3 w-3 mr-1" />
            En retard
          </Badge>
        );
      default:
        return (
          <Badge className="bg-warning/20 text-warning border-warning/30">
            <Clock className="h-3 w-3 mr-1" />
            À venir
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      {quarters.map((quarter) => {
        const status = getQuarterStatus(quarter);
        const isExpanded = expandedQuarters.includes(quarter.quarter);

        return (
          <Card 
            key={quarter.quarter} 
            className={`glass-card transition-all ${
              status === 'paid' ? 'border-success/30' : 
              status === 'overdue' ? 'border-destructive/30' : ''
            }`}
          >
            <Collapsible open={isExpanded} onOpenChange={() => toggleQuarter(quarter.quarter)}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-secondary/30 transition-colors rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary">
                        T{quarter.quarter}
                      </div>
                      <div>
                        <CardTitle className="text-lg">Trimestre {quarter.quarter}</CardTitle>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Échéance : {new Date(quarter.dueDate).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total cotisations</p>
                        <p className="font-bold text-lg">{formatCurrency(quarter.totalContribution)}</p>
                      </div>
                      {getStatusBadge(status)}
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="border-t pt-4 space-y-3">
                    {quarter.months.map((month) => (
                      <div 
                        key={month.month}
                        className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
                          month.isPaid ? 'bg-success/5' : 'bg-secondary/30 hover:bg-secondary/50'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <Checkbox
                            id={`month-${month.month}`}
                            checked={month.isPaid}
                            onCheckedChange={(checked) => onTogglePaid(month.month, !!checked)}
                            disabled={loading || month.revenue === 0}
                            className="h-5 w-5"
                          />
                          <div>
                            <label 
                              htmlFor={`month-${month.month}`}
                              className={`font-medium cursor-pointer ${month.isPaid ? 'line-through text-muted-foreground' : ''}`}
                            >
                              {month.monthName}
                            </label>
                            <p className="text-sm text-muted-foreground">
                              CA déclaré : {formatCurrency(month.revenue)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className={`font-bold ${month.isPaid ? 'text-success' : ''}`}>
                              {formatCurrency(month.contribution)}
                            </p>
                            {month.isPaid && month.paidDate && (
                              <p className="text-xs text-muted-foreground">
                                Payé le {new Date(month.paidDate).toLocaleDateString('fr-FR')}
                              </p>
                            )}
                          </div>
                          {month.isPaid && (
                            <CheckCircle2 className="h-5 w-5 text-success" />
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Quarter summary */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20 mt-4">
                      <div>
                        <p className="font-medium">Total T{quarter.quarter}</p>
                        <p className="text-sm text-muted-foreground">
                          CA cumulé : {formatCurrency(quarter.totalRevenue)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary">
                          {formatCurrency(quarter.totalContribution)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {quarter.allPaid ? 'Entièrement réglé' : 'À régler'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}
    </div>
  );
};
