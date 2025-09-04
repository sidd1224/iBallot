const store = new Map()
export async function sendOTP(phone) {
  const otp = String(Math.floor(100000 + Math.random() * 900000))
  store.set(phone, { otp, expires: Date.now() + 2 * 60 * 1000 })
  await new Promise((r) => setTimeout(r, 300))
  return { success: true, otp }
}
export async function verifyOTP(phone, code) {
  await new Promise((r) => setTimeout(r, 200))
  const rec = store.get(phone)
  if (!rec) return false
  const ok = Date.now() < rec.expires && rec.otp === String(code)
  if (ok) store.delete(phone)
  return ok
}
