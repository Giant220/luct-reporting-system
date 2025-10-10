import { supabase } from '../utils/supabaseClient.js'
import jwt from 'jsonwebtoken'

export default async function handler(req, res) {
  // Set CORS headers for ALL responses first
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'GET') {
    try {
      const token = req.headers.authorization?.split(' ')[1]
      const user = token ? jwt.verify(token, process.env.JWT_SECRET || 'luct-fict-2024-secret') : null
      
      const { q, type } = req.query

      if (!q) {
        return res.status(400).json({ error: 'Search query is required' })
      }

      let results = []

      switch (type) {
        case 'reports':
          let reportsQuery = supabase
            .from('lecture_reports')
            .select(`
              *,
              classes (
                class_name, 
                courses (course_code, course_name)
              ),
              users!lecture_reports_lecturer_id_fkey (name as lecturer_name)
            `)
            .or(`topic_taught.ilike.%${q}%,learning_outcomes.ilike.%${q}%,lecturer_recommendations.ilike.%${q}%`)

          if (user?.role === 'lecturer') {
            reportsQuery = reportsQuery.eq('lecturer_id', user.id)
          } else if (user?.role === 'student') {
            const { data: enrollments } = await supabase
              .from('student_classes')
              .select('class_id')
              .eq('student_id', user.id)

            if (enrollments && enrollments.length > 0) {
              const classIds = enrollments.map(e => e.class_id)
              reportsQuery = reportsQuery.in('class_id', classIds)
            } else {
              results = []
              break
            }
          }

          const { data: reports } = await reportsQuery
          results = reports || []
          break

        case 'courses':
          const { data: courses } = await supabase
            .from('courses')
            .select('*')
            .or(`course_code.ilike.%${q}%,course_name.ilike.%${q}%`)
            .eq('faculty', 'Faculty of ICT (FICT)')
          results = courses || []
          break

        case 'users':
          const { data: users } = await supabase
            .from('users')
            .select('id, name, email, role, faculty')
            .or(`name.ilike.%${q}%,email.ilike.%${q}%`)
          results = users || []
          break

        default:
          // Search everything
          const [reportsRes, coursesRes, usersRes] = await Promise.all([
            supabase.from('lecture_reports').select('*, classes (class_name, courses (course_code, course_name)), users!lecture_reports_lecturer_id_fkey (name as lecturer_name)').or(`topic_taught.ilike.%${q}%,learning_outcomes.ilike.%${q}%`).limit(10),
            supabase.from('courses').select('*').or(`course_code.ilike.%${q}%,course_name.ilike.%${q}%`).eq('faculty', 'Faculty of ICT (FICT)').limit(10),
            supabase.from('users').select('id, name, email, role, faculty').or(`name.ilike.%${q}%,email.ilike.%${q}%`).limit(10)
          ])

          results = {
            reports: reportsRes.data || [],
            courses: coursesRes.data || [],
            users: usersRes.data || []
          }
      }

      res.json(results)
    } catch (error) {
      console.error('Search error:', error)
      res.status(500).json({ error: error.message })
    }
  } else {
    res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }
}