// invitations.js — shared module for token verification and access request submission

const SUPABASE_URL = 'https://nmemmfblpzrkwyljpmvp.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tZW1tZmJscHpya3d5bGpwbXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNDUzNzUsImV4cCI6MjA5MjcyMTM3NX0.iAEq-vnY481qdX0nmsonoDZWNFyFrao02GB_MS5BPzs'

const headers = () => ({
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
})

/**
 * Verify an invite token — returns the invitation row if valid (pending + not expired),
 * or null if not found/expired/already used.
 */
export async function verifyInviteToken(token) {
  const params = new URLSearchParams({
    token: `eq.${token}`,
    status: 'eq.pending',
    expires_at: `gt.${new Date().toISOString()}`,
    select: 'id,email,role,expires_at',
    limit: '1'
  })
  const res = await fetch(`${SUPABASE_URL}/rest/v1/invitations?${params}`, { headers: headers() })
  const data = await res.json()
  if (!res.ok || !Array.isArray(data) || data.length === 0) return { data: null, error: true }
  return { data: data[0], error: null }
}

/**
 * Submit a public access request.
 * Returns { error, duplicate } where duplicate is a human-readable string if the
 * email already has a pending or approved request.
 */
export async function submitAccessRequest({ name, email, message }) {
  // Check for existing pending/approved request with this email
  const checkParams = new URLSearchParams({
    email: `eq.${email}`,
    'status': 'in.(pending,approved)',
    select: 'id,status',
    limit: '1'
  })
  const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/access_requests?${checkParams}`, { headers: headers() })
  const existing = await checkRes.json()

  if (checkRes.ok && Array.isArray(existing) && existing.length > 0) {
    const msg = existing[0].status === 'approved'
      ? 'This email has already been approved — check your inbox for an invite link.'
      : 'A request from this email is already pending review. We'll be in touch soon.'
    return { data: null, error: null, duplicate: msg }
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/access_requests`, {
    method: 'POST',
    headers: { ...headers(), 'Prefer': 'return=minimal' },
    body: JSON.stringify({ name, email, message })
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return { data: null, error: err, duplicate: null }
  }

  return { data: true, error: null, duplicate: null }
}
