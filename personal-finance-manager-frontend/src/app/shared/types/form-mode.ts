export const FormMode = {
  Create: 'create',
  Edit: 'edit',
} as const;

export type FormMode = (typeof FormMode)[keyof typeof FormMode];
