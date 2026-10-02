import { ValidatorFn } from '@angular/forms';

export const MIN_YEAR = 2000;
export const MAX_YEAR = 2100;
export const MIN_MONTH = `${MIN_YEAR}-01`;
export const MAX_MONTH = `${MAX_YEAR}-12`;
export const MIN_DATE = `${MIN_MONTH}-01`;
export const MAX_DATE = `${MAX_MONTH}-31`;

export const supportedDate: ValidatorFn = (control) => {
  const value = control.value;

  if (!value) {
    return null;
  }

  if (typeof value !== 'string' || !/^\d{4}-(\d{2})(-\d{2})?$/.test(value)) {
    return { supportedDate: true };
  }

  const [year, month, day = 1] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  
  return year >= MIN_YEAR &&
    year <= MAX_YEAR &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
    ? null
    : { supportedDate: true };
};
