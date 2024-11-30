export type FeatureKey = 
  | 'analysisRequests'
  | 'dataVisualization'
  | 'apiAccess'
  | 'support'
  | 'customModels'
  | 'exportFormats';

type PlanLimits = {
  [key in FeatureKey]: {
    enabled: boolean;
    limit?: number;
  };
};

const planFeatures: Record<string, PlanLimits> = {
  free: {
    analysisRequests: { enabled: true, limit: 5 },
    dataVisualization: { enabled: true, limit: 3 },
    apiAccess: { enabled: true, limit: 100 },
    support: { enabled: true },
    customModels: { enabled: false },
    exportFormats: { enabled: true, limit: 1 },
  },
  pro: {
    analysisRequests: { enabled: true },
    dataVisualization: { enabled: true },
    apiAccess: { enabled: true, limit: 10000 },
    support: { enabled: true },
    customModels: { enabled: true },
    exportFormats: { enabled: true },
  },
  enterprise: {
    analysisRequests: { enabled: true },
    dataVisualization: { enabled: true },
    apiAccess: { enabled: true },
    support: { enabled: true },
    customModels: { enabled: true },
    exportFormats: { enabled: true },
  },
};

export function checkFeatureAccess(
  plan: string | null,
  feature: FeatureKey
): { allowed: boolean; limit?: number } {
  const planName = plan?.toLowerCase() || 'free';
  const planFeature = planFeatures[planName]?.[feature];

  if (!planFeature) {
    return { allowed: false };
  }

  return {
    allowed: planFeature.enabled,
    limit: planFeature.limit,
  };
}
