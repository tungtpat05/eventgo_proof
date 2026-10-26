import { ChecklistTemplatePreset } from '@/domain/constants/checklist-templates';

type TranslateFn = (key: string) => string;

/**
 * Localizes a checklist template preset (Layer 2 System Preset)
 * using the provided translation function `t('presets....')`.
 */
export function getLocalizedTemplatePreset(
  preset: ChecklistTemplatePreset,
  t: TranslateFn
): ChecklistTemplatePreset {
  const code = preset.code;
  return {
    ...preset,
    name: t(`presets.${code}.name`) || preset.name,
    description: t(`presets.${code}.description`) || preset.description,
    items: preset.items.map((item) => ({
      ...item,
      title: t(`presets.${code}.items.${item.orderIndex}.title`) || item.title,
      description: t(`presets.${code}.items.${item.orderIndex}.description`) || item.description,
    })),
  };
}
