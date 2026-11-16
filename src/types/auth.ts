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
 * Standard FastAPI HTTPException response body.
 */
export interface ApiErrorResponse {
  detail?: string;
}
