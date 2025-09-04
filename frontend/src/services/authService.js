const KEY = 'ib_users'
function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}
function write(users) { localStorage.setItem(KEY, JSON.stringify(users)) }
export function registerUser({ aadhaar, phone, password, aadhaarFileName }) {
  const users = read()
  if (users.find((u) => u.phone === phone)) throw new Error('Phone already registered')
  users.push({ aadhaar, phone, password, aadhaarFileName })
  write(users)
  return true
}
export function loginUser({ phone, password }) {
  const users = read()
  return users.find((u) => u.phone === phone && u.password === password) || null
}
export function setCurrentUser(phone) { localStorage.setItem('ib_current_user', JSON.stringify({ phone })) }
export function getCurrentUser() { try { return JSON.parse(localStorage.getItem('ib_current_user') || 'null') } catch { return null } }
export function logout() { localStorage.removeItem('ib_current_user') }
