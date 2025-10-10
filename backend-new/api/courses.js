import { supabase } from '../utils/supabaseClient.js'
import jwt from 'jsonwebtoken'

export default async function handler(req, res) {
  // Set CORS headers for ALL responses first
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'GET') {
    try {
      const token = req.headers.authorization?.split(' ')[1]
      const user = token ? jwt.verify(token, process.env.JWT_SECRET || 'luct-fict-2024-secret') : null
      
      let query = supabase
        .from('courses')
        .select('*')
        .eq('faculty', 'Faculty of ICT (FICT)')

      // Students see only courses from their program
      if (user?.role === 'student' && user.course_program) {
        query = query.eq('program', user.course_program)
      }

      const { data: courses, error } = await query.order('course_code')

      if (error) throw error

      res.json(courses || [])
    } catch (error) {
      console.error('Courses API error:', error)
      res.status(500).json({ error: error.message })
    }
  } else if (req.method === 'POST') {
    try {
      const token = req.headers.authorization?.split(' ')[1]
      if (!token) {
        return res.status(401).json({ error: 'Authorization required' })
      }

      const user = jwt.verify(token, process.env.JWT_SECRET || 'luct-fict-2024-secret')
      
      if (user.role !== 'program_leader') {
        return res.status(403).json({ error: 'Only Program Leaders can add courses' })
      }

      const { course_code, course_name, course_type, credits, program } = req.body

      if (!course_code || !course_name || !course_type || !credits || !program) {
        return res.status(400).json({ error: 'All fields are required' })
      }

      const { data: course, error } = await supabase
        .from('courses')
        .insert([
          {
            course_code,
            course_name,
            course_type,
            credits: parseFloat(credits),
            program,
            faculty: 'Faculty of ICT (FICT)'
          }
        ])
        .select()

      if (error) throw error

      res.json({ message: 'Course added successfully', courseId: course[0].id })
    } catch (error) {
      console.error('Add course error:', error)
      res.status(500).json({ error: error.message })
    }
  } else {
    res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }
}