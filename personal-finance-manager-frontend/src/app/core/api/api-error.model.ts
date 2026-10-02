import { ApiErrorCode } from "./api-error-code";

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  errors?: Record<string, string[]>;
}
