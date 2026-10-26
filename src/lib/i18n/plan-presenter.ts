import { PlanConfig } from '@/domain/entities';

/**
 * Return a localized copy of PlanConfig with translated name and description.
 */
export function getLocalizedPlanConfig(
  config: PlanConfig,
  t: (key: string, values?: Record<string, string | number>) => string
): PlanConfig {
  return {
    ...config,
    name: t(`tiers.${config.tier}.name`),
    description: t(`tiers.${config.tier}.description`),
  };
}
