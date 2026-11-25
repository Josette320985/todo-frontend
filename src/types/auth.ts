/**
 * Request body for registering a new user (`UserCreate` schema).
 */
export interface UserCreate {
  email: string;
  password: string;
}

/**
 * User representation returned by the backend API (`UserRead` schema).
 */
export interface UserRead {
  id: number;
  id: string;
  email: string;
}

/**
 * Authentication response returned by `/api/v1/auth/login` (`Token` schema).
 */
export interface TokenResponse {
  access_token: string;
  token_type: string;
}

/**
 * Individual Pydantic validation error item returned by FastAPI on HTTP 422.
 */
export interface ValidationErrorItem {
  loc?: Array<string | number>;
  msg: string;
  type?: string;
}

/**
 * Standard FastAPI HTTPException or 422 RequestValidationError response body.
 */
export interface ApiErrorResponse {
  detail?: string | ValidationErrorItem[];
}
