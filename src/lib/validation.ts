import { MAX_DESCRIPTION_LENGTH, MAX_EMAIL_LENGTH, MAX_PASSWORD_LENGTH, MAX_TITLE_LENGTH } from './limits';

/** Cheap input guards only: the server owns email syntax and Unicode/IDNA rules. */
export function validateEmail(value: string): string {
  if (!value.trim()) return 'Ingresa tu correo electrónico.';
  return Array.from(value.trim()).length > MAX_EMAIL_LENGTH ? 'El correo electrónico es demasiado largo.' : '';
}

export function validateTitle(value: string): string {
  if (!value.trim()) return 'El título no puede estar vacío.';
  return Array.from(value).length > MAX_TITLE_LENGTH ? `El título no puede superar ${MAX_TITLE_LENGTH} caracteres.` : '';
}

export function validateDescription(value: string): string {
  return Array.from(value).length > MAX_DESCRIPTION_LENGTH ? `La descripción no puede superar ${MAX_DESCRIPTION_LENGTH} caracteres.` : '';
}

export function validatePassword(value: string): string {
  if (Array.from(value).length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  if (new TextEncoder().encode(value).length > MAX_PASSWORD_LENGTH) return `La contraseña no puede superar ${MAX_PASSWORD_LENGTH} bytes UTF-8.`;
  if (!/\p{L}/u.test(value) || !/\p{Nd}/u.test(value)) return 'Incluye al menos una letra y un número.';
  return '';
}
