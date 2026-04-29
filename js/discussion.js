// discussion.js — data layer for discussion boards

const SUPABASE_URL = 'https://nmemmfblpzrkwyljpmvp.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tZW1tZmJscHpya3d5bGpwbXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNDUzNzUsImV4cCI6MjA5MjcyMTM3NX0.iAEq-vnY481qdX0nmsonoDZWNFyFrao02GB_MS5BPzs'

const headers = () => ({
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
})

// Status sort order: pinned first, then open, then closed
const STATUS_ORDER = { pinned: 0, open: 1, closed: 2 }

/**
 * Fetch published courses for the course filter/selector.
 */
export async function fetchCourses() {
  const params = new URLSearchParams({
    status: 'eq.published',
    select: 'id,title',
    order: 'title.asc'
  })
  const res = await fetch(`${SUPABASE_URL}/rest/v1/courses?${params}`, { headers: headers() })
  const data = await res.json()
  if (!res.ok) return { data: null, error: data }
  return { data, error: null }
}

/**
 * Fetch discussion threads, optionally filtered by course.
 * Pinned threads are always sorted first client-side.
 */
export async function fetchThreads(courseId = null) {
  const params = new URLSearchParams({
    select: 'id,title,body,author_name,author_type,status,source,created_at,updated_at,course_id,module_id',
    order: 'updated_at.desc'
  })
  if (courseId) params.set('course_id', `eq.${courseId}`)

  const res = await fetch(`${SUPABASE_URL}/rest/v1/discussion_threads?${params}`, { headers: headers() })
  const data = await res.json()
  if (!res.ok) return { data: null, error: data }

  // Sort: pinned → open → closed
  data.sort((a, b) => (STATUS_ORDER[a.status] ?? 1) - (STATUS_ORDER[b.status] ?? 1))
  return { data, error: null }
}

/**
 * Fetch a single thread by ID.
 */
export async function fetchThread(threadId) {
  const params = new URLSearchParams({
    id: `eq.${threadId}`,
    select: 'id,title,body,author_name,author_type,status,source,created_at,updated_at,course_id,module_id',
    limit: '1'
  })
  const res = await fetch(`${SUPABASE_URL}/rest/v1/discussion_threads?${params}`, {
    headers: { ...headers(), 'Accept': 'application/vnd.pgrst.object+json' }
  })
  const data = await res.json()
  if (!res.ok) return { data: null, error: data }
  return { data, error: null }
}

/**
 * Fetch approved discussion_posts for a thread.
 * These are the primary posts written within the Training Portal.
 */
export async function fetchPosts(threadId) {
  const params = new URLSearchParams({
    thread_id: `eq.${threadId}`,
    status: 'eq.approved',
    select: 'id,author_name,author_type,content,source,created_at',
    order: 'created_at.asc'
  })
  const res = await fetch(`${SUPABASE_URL}/rest/v1/discussion_posts?${params}`, { headers: headers() })
  const data = await res.json()
  if (!res.ok) return { data: null, error: data }
  return { data, error: null }
}

/**
 * Fetch approved thread_replies for a thread.
 * These may originate from other apps — the linked message carries app_context
 * (e.g. 'lawnscaping', 'training') which we surface as a source badge.
 */
export async function fetchReplies(threadId) {
  const params = new URLSearchParams({
    thread_id: `eq.${threadId}`,
    status: 'eq.approved',
    select: 'id,author_name,content,created_at,message_id,messages(app_context)',
    order: 'created_at.asc'
  })
  const res = await fetch(`${SUPABASE_URL}/rest/v1/thread_replies?${params}`, { headers: headers() })
  const data = await res.json()
  if (!res.ok) return { data: null, error: data }
  return { data, error: null }
}

/**
 * Submit a new post to a thread (lands in 'pending' status, awaits moderation).
 */
export async function submitPost(threadId, authorName, content) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/discussion_posts`, {
    method: 'POST',
    headers: { ...headers(), 'Prefer': 'return=representation' },
    body: JSON.stringify({
      thread_id: threadId,
      author_name: authorName,
      content,
      author_type: 'student',
      source: 'training_portal'
    })
  })
  const data = await res.json()
  if (!res.ok) return { data: null, error: data }
  return { data: Array.isArray(data) ? data[0] : data, error: null }
}

/**
 * Submit a new thread (lands in 'open' status).
 */
export async function submitThread(courseId, title, body, authorName) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/discussion_threads`, {
    method: 'POST',
    headers: { ...headers(), 'Prefer': 'return=representation' },
    body: JSON.stringify({
      course_id: courseId,
      title,
      body: body || null,
      author_name: authorName,
      author_type: 'student',
      source: 'training_portal'
    })
  })
  const data = await res.json()
  if (!res.ok) return { data: null, error: data }
  return { data: Array.isArray(data) ? data[0] : data, error: null }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function formatDate(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

/**
 * Returns a human-readable label when a record originates from another app.
 * Returns null for training_portal records (no badge needed).
 */
export function sourceLabel(source) {
  if (!source || source === 'training_portal') return null
  const map = {
    lawnscaping: 'Lawnscaping App',
    training:    'Training (legacy)',
    general:     'General'
  }
  return map[source] || source
}

/**
 * Derive a source string from a thread_reply's linked message app_context.
 */
export function replySourceLabel(reply) {
  const ctx = reply?.messages?.app_context
  return sourceLabel(ctx === 'training' ? 'training' : ctx)
}

export function escHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
