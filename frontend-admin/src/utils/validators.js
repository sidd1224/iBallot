export function isValidAadhaar(v) {
  return typeof v === 'string' && /^\d{12}$/.test(v.trim())
}
export function isValidPhone(v) {
  return typeof v === 'string' && /^\d{10}$/.test(v.trim())
}
export function isStrongPassword(v) {
  return typeof v === 'string' && /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(v)
}
