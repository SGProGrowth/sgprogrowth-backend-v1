/**
 * Rate-limit presets loaded from environment at startup.
 * Override via THROTTLE_* variables in .env (see backend/.env.example).
 */

function readLimit(name: string, fallback: number): number {
  const raw = process.env[name]
  if (raw === undefined || raw === '') return fallback
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback
}

const TTL_MS = (() => {
  const raw = process.env.THROTTLE_TTL_MS
  if (!raw) return 60_000
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 60_000
})()

function bucket(envKey: string, fallback: number) {
  return { limit: readLimit(envKey, fallback), ttl: TTL_MS }
}

/** Per-route throttle overrides (requests per THROTTLE_TTL_MS window). */
export const ThrottleLimits = {
  register: bucket('THROTTLE_REGISTER_LIMIT', 10),
  login: bucket('THROTTLE_LOGIN_LIMIT', 10),
  verifyEmail: bucket('THROTTLE_VERIFY_EMAIL_LIMIT', 20),
  resendVerification: bucket('THROTTLE_RESEND_VERIFICATION_LIMIT', 5),
  forgotPassword: bucket('THROTTLE_FORGOT_PASSWORD_LIMIT', 5),
  resetPassword: bucket('THROTTLE_RESET_PASSWORD_LIMIT', 10),
  refresh: bucket('THROTTLE_REFRESH_LIMIT', 30),
  logout: bucket('THROTTLE_LOGOUT_LIMIT', 30),
  changePassword: bucket('THROTTLE_CHANGE_PASSWORD_LIMIT', 10),
  upload: bucket('THROTTLE_UPLOAD_LIMIT', 30),
  certificateVerify: bucket('THROTTLE_CERTIFICATE_VERIFY_LIMIT', 30),
  public: bucket('THROTTLE_PUBLIC_LIMIT', 60),
} as const
