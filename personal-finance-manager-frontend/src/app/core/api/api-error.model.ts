import { ApiErrorCode } from "./api-error-code";

export interface ApiError {
  code: ApiErrorCode;
  message: string;
}