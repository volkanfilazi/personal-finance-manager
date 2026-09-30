export const ApiErrorCode = {
  CategoryAlreadyExists: 'CATEGORY_ALREADY_EXISTS',
  CategoryNotFound: 'CATEGORY_NOT_FOUND',
} as const;

export type ApiErrorCode = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];
