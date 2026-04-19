import { TaxBreakdown } from './rich-views/TaxBreakdown';
import { RealEstateCashflow } from './rich-views/RealEstateCashflow';
import { DeadlinesList } from './rich-views/DeadlinesList';
import { RecommendationsList } from './rich-views/RecommendationsList';
import { AidsEligibility } from './rich-views/AidsEligibility';
import { FiscalConcept } from './rich-views/FiscalConcept';
import { ProfileUpdateProposal } from './rich-views/ProfileUpdateProposal';
import type { RichView } from '@/hooks/useElioAgent';

interface Props {
  rich_view: RichView | null | undefined;
  onRunPrompt?: (prompt: string) => void;
  onConfirmProfileUpdate?: (updates: Array<{ field: string; value: any }>) => void;
}

export const RichViewRenderer = ({ rich_view, onRunPrompt, onConfirmProfileUpdate }: Props) => {
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
    case 'aids_eligibility':
      return <AidsEligibility data={rich_view.data} />;
    case 'fiscal_concept':
      return <FiscalConcept data={rich_view.data} />;
    case 'profile_update_proposal':
      return <ProfileUpdateProposal data={rich_view.data} onConfirm={onConfirmProfileUpdate} />;
    default:
      return null;
  }
};
