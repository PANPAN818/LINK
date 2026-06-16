import type { VoomFrequency } from '@/types/domain';

export const voomFrequencyOptions: Array<{ value: VoomFrequency; label: string; chance: number }> = [
  { value: 'very-low', label: '极低', chance: 0.05 },
  { value: 'low', label: '低', chance: 0.12 },
  { value: 'medium', label: '中', chance: 0.25 },
  { value: 'high', label: '高', chance: 0.42 },
  { value: 'very-high', label: '极高', chance: 0.65 },
  { value: 'always', label: '每次', chance: 1 }
];

const voomFrequencyValues = new Set(voomFrequencyOptions.map((option) => option.value));

export function normalizeVoomFrequency(value: unknown, fallback: VoomFrequency = 'medium'): VoomFrequency {
  const frequency = String(value ?? '').trim() as VoomFrequency;
  return voomFrequencyValues.has(frequency) ? frequency : fallback;
}

export function getVoomFrequencyChance(frequency: VoomFrequency) {
  return voomFrequencyOptions.find((option) => option.value === frequency)?.chance ?? 0.25;
}