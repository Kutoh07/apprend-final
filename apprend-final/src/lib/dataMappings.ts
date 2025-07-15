import { CSP_OPTIONS, COUNTRY_OPTIONS } from './constants';

export const getProfessionLabelFromValue = (value: string): string => {
  const option = CSP_OPTIONS.find(o => o.value === value);
  return option?.label || value;
};

export const getProfessionValueFromLabel = (label: string): string => {
  const option = CSP_OPTIONS.find(o => o.label === label);
  return option?.value || '';
};

export const getCountryLabelFromValue = (value: string): string => {
  const option = COUNTRY_OPTIONS.find(o => o.value === value);
  return option?.label || value;
};

export const getCountryValueFromLabel = (label: string): string => {
  const option = COUNTRY_OPTIONS.find(o => o.label === label);
  return option?.value || '';
};
