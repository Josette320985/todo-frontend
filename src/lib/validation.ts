export function validatePassword(value: string): string {
  if (Array.from(value).length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  if (new TextEncoder().encode(value).length > 72) return 'La contraseña no puede superar 72 bytes UTF-8.';
  if (!/\p{L}/u.test(value) || !/\p{Nd}/u.test(value)) return 'Incluye al menos una letra y un número.';
  return '';
}
