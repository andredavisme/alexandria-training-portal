// discussion.js — data layer for discussion boards

const SUPABASE_URL = 'https://hhyhulqngdkwsxhymmcd.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoeWh1bHFuZ2Rrd3N4aHltbWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMzEyMDEsImV4cCI6MjA5MjcwNzIwMX0.dmSy7Q8Je5lEY4XCFzwvfPnkBYLebPE0yZMhy6Y8czI'

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
 * Pinned threads (welcome + commons) always sort first.
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

  data.sort((a, b) => (STATUS_ORDER[a.status] ?? 1) - (STATUS_ORDER[b.status] ?? 1))
  return { data, error: null }
}

/**
 * Fetch threads scoped to a specific module.
 * Returns the module thread plus any student-created threads in the same module.
 */
export async function fetchThreadsByModule(courseId, moduleId) {
  const params = new URLSearchParams({
    select: 'id,title,body,author_name,author_type,status,source,created_at,updated_at,course_id,module_id',
    course_id: `eq.${courseId}`,
    module_id: `eq.${moduleId}`,
    order: 'updated_at.desc'
  })
  const res = await fetch(`${SUPABASE_URL}/rest/v1/discussion_threads?${params}`, { headers: headers() })
  const data = await res.json()
  if (!res.ok) return { data: null, error: data }
  data.sort((a, b) => (STATUS_ORDER[a.status] ?? 1) - (STATUS_ORDER[b.status] ?? 1))
  return { data, error: null }
}

/**
 * Fetch the pinned Classroom Commons thread for a course.
 */
export async function fetchCommonsThread(courseId) {
  const params = new URLSearchParams({
    select: 'id,title,body,author_name,author_type,status,source,created_at,updated_at,course_id,module_id',
    course_id: `eq.${courseId}`,
    module_id: 'is.null',
    status: 'eq.pinned',
    title: 'like.*Classroom Commons*',
    limit: '1'
  })
  const res = await fetch(`${SUPABASE_URL}/rest/v1/discussion_threads?${params}`, { headers: headers() })
  const data = await res.json()
  if (!res.ok) return { data: null, error: data }
  return { data: data[0] || null, error: null }
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
 * Linked message carries app_context surfaced as a source badge.
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
 * Submit a new post to a thread (lands as 'approved' for classroom use).
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
      source: 'training_portal',
      status: 'approved'
    })
  })
  const data = await res.json()
  if (!res.ok) return { data: null, error: data }
  return { data: Array.isArray(data) ? data[0] : data, error: null }
}

/**
 * Submit a new thread (lands as 'open').
 * Pass moduleId to scope the thread to a specific module.
 */
export async function submitThread(courseId, title, body, authorName, moduleId = null) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/discussion_threads`, {
    method: 'POST',
    headers: { ...headers(), 'Prefer': 'return=representation' },
    body: JSON.stringify({
      course_id: courseId,
      module_id: moduleId || null,
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
