// catalog.js — data layer for the course catalog

const SUPABASE_URL = 'https://nmemmfblpzrkwyljpmvp.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tZW1tZmJscHpya3d5bGpwbXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNDUzNzUsImV4cCI6MjA5MjcyMTM3NX0.iAEq-vnY481qdX0nmsonoDZWNFyFrao02GB_MS5BPzs'

const headers = () => ({
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
})

/**
 * Fetch all catalog courses (published + draft) with their ordered modules.
 * Draft courses are shown as "Coming Soon" in the UI.
 */
export async function fetchCatalog() {
  const params = new URLSearchParams({
    select: 'id,title,description,status,color_scheme,primary_color,accent_color,course_modules(order_index,section_label,modules(id,title,description))',
    order: 'title.asc'
  })
  const res = await fetch(`${SUPABASE_URL}/rest/v1/courses?${params}`, { headers: headers() })
  const data = await res.json()
  if (!res.ok) return { data: null, error: data }

  // Sort each course's modules by order_index
  data.forEach(c => {
    if (Array.isArray(c.course_modules)) {
      c.course_modules.sort((a, b) => a.order_index - b.order_index)
    }
  })

  // Published courses first, then draft
  data.sort((a, b) => {
    if (a.status === b.status) return 0
    return a.status === 'published' ? -1 : 1
  })

  return { data, error: null }
}

export function escHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
