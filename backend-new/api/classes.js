import { supabase } from '../utils/supabaseClient.js'
import jwt from 'jsonwebtoken'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method === 'GET') {
    try {
      const token = req.headers.authorization?.split(' ')[1]
      const user = token ? jwt.verify(token, process.env.JWT_SECRET || 'luct-fict-2024-secret') : null
      
      let query = supabase
        .from('classes')
        .select(`
          *,
          courses (course_code, course_name, course_type, credits, program),
          users!classes_lecturer_id_fkey (name as lecturer_name)
        `)

      // Role-based filtering
      if (user?.role === 'lecturer') {
        query = query.eq('lecturer_id', user.id)
      } else if (user?.role === 'student') {
        // Students see only their enrolled classes
        const { data: enrollments } = await supabase
          .from('student_classes')
          .select('class_id')
          .eq('student_id', user.id)

        if (enrollments && enrollments.length > 0) {
          const classIds = enrollments.map(e => e.class_id)
          query = query.in('id', classIds)
        } else {
          return res.json([])
        }
      }

      const { data: classes, error } = await query.order('class_name')

      if (error) throw error

      res.json(classes || [])
    } catch (error) {
      console.error('Classes API error:', error)
      res.status(500).json({ error: error.message })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }
}