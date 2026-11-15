export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/;
export const isValidEmail = (value: string) => EMAIL_REGEX.test(value.trim());
export const isValidNickname = (value: string) =>
  value.trim().length >= 2 && value.trim().length <= 12;
