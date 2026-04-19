import { TaxBreakdown } from './rich-views/TaxBreakdown';
import { RealEstateCashflow } from './rich-views/RealEstateCashflow';
import { DeadlinesList } from './rich-views/DeadlinesList';
import { RecommendationsList } from './rich-views/RecommendationsList';
import type { RichView } from '@/hooks/useElioAgent';

interface Props {
  rich_view: RichView | null | undefined;
  onRunPrompt?: (prompt: string) => void;
}

export const RichViewRenderer = ({ rich_view, onRunPrompt }: Props) => {
  if (!rich_view || !rich_view.type) return null;

  switch (rich_view.type) {
    case 'tax_breakdown':
      return <TaxBreakdown data={rich_view.data} />;
    case 'real_estate_cashflow':
      return <RealEstateCashflow data={rich_view.data} />;
    case 'deadlines_list':
      return <DeadlinesList data={rich_view.data} />;
    case 'recommendations_list':
      return <RecommendationsList data={rich_view.data} onRunPrompt={onRunPrompt} />;
    default:
      return null;
  }
};
