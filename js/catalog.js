// catalog.js — data layer for the course catalog

const SUPABASE_URL = 'https://hhyhulqngdkwsxhymmcd.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoeWh1bHFuZ2Rrd3N4aHltbWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMzEyMDEsImV4cCI6MjA5MjcwNzIwMX0.dmSy7Q8Je5lEY4XCFzwvfPnkBYLebPE0yZMhy6Y8czI'

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
    select: 'id,title,description,status,color_scheme,primary_color,accent_color,audience,duration_months,course_thread,course_modules(order_index,section_label,modules(id,title,description,driving_question,science_concept,diaspora_connection,month_number))',
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

/**
 * Fetch a single course with full module detail:
 * activities, journal prompts, and commons milestones.
 */
export async function fetchCourseDetail(courseId) {
  const params = new URLSearchParams({
    id: `eq.${courseId}`,
    select: 'id,title,description,status,accent_color,audience,duration_months,course_thread,course_modules(order_index,section_label,modules(id,title,description,driving_question,science_concept,diaspora_connection,month_number,activities(id,title,activity_type,instructions,materials,skill_focus,order_index),journal_prompts(id,prompt,prompt_type,order_index),commons_milestones(id,title,description,commons_activity,math_connection,diaspora_link,order_index)))'
  })
  const res = await fetch(`${SUPABASE_URL}/rest/v1/courses?${params}`, { headers: headers() })
  const data = await res.json()
  if (!res.ok) return { data: null, error: data }
  const course = data[0] || null
  if (course) {
    course.course_modules?.forEach(cm => {
      const m = cm.modules
      if (!m) return
      m.activities?.sort((a, b) => a.order_index - b.order_index)
      m.journal_prompts?.sort((a, b) => a.order_index - b.order_index)
      m.commons_milestones?.sort((a, b) => a.order_index - b.order_index)
    })
    course.course_modules?.sort((a, b) => a.order_index - b.order_index)
  }
  return { data: course, error: null }
}

/**
 * Fetch all community roles for the Classroom Commons project.
 */
export async function fetchCommonsRoles() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/commons_roles?select=*`, { headers: headers() })
  const data = await res.json()
  if (!res.ok) return { data: null, error: data }
  return { data, error: null }
}

export function escHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
