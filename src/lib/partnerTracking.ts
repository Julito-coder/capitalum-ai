const UTM_SOURCE = 'capitalum';
const UTM_MEDIUM = 'recommendation';

export type PartnerPosition = 'primary' | 'alternative' | 'neobanking';

export interface PartnerClickEvent {
  recommendationType: string;
  partnerName: string;
  position: PartnerPosition;
  userSegment: string;
  timestamp: number;
}

export const buildTrackedUrl = (baseUrl: string, campaign?: string): string => {
  try {
    const url = new URL(baseUrl);
    url.searchParams.set('utm_source', UTM_SOURCE);
    url.searchParams.set('utm_medium', UTM_MEDIUM);
    if (campaign) {
      url.searchParams.set('utm_campaign', campaign);
    }
    return url.toString();
  } catch {
    // If URL parsing fails, append manually
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}utm_source=${UTM_SOURCE}&utm_medium=${UTM_MEDIUM}${campaign ? `&utm_campaign=${campaign}` : ''}`;
  }
};

export const trackPartnerClick = (
  recommendationType: string,
  partnerName: string,
  position: PartnerPosition,
  userSegment: string
): void => {
  const event: PartnerClickEvent = {
    recommendationType,
    partnerName,
    position,
    userSegment,
    timestamp: Date.now(),
  };

  // Store locally for analytics
  try {
    const stored = localStorage.getItem('capitalum_partner_clicks');
    const clicks: PartnerClickEvent[] = stored ? JSON.parse(stored) : [];
    clicks.push(event);
    // Keep last 100 clicks
    if (clicks.length > 100) clicks.splice(0, clicks.length - 100);
    localStorage.setItem('capitalum_partner_clicks', JSON.stringify(clicks));
  } catch {
    // Silent fail for storage errors
  }

  // Custom event for external analytics
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('capitalum:partner_click', { detail: event })
    );
  }
};
