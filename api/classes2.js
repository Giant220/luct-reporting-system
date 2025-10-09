import { supabase } from '../utils/supabaseClient.js'
import jwt from 'jsonwebtoken'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'GET') {
    try {
      const token = req.headers.authorization?.split(' ')[1]
      const user = token ? jwt.verify(token, process.env.JWT_SECRET || 'luct-fict-2024-secret') : null

      let query = supabase
        .from('classes')
        .select(`
          *,
          courses (
            course_code,
            course_name,
            course_type,
            credits,
            program,
            faculty
          )
        `)

      // Students see only their enrolled classes
      if (user?.role === 'student') {
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

      // Lecturers see classes they teach
      if (user?.role === 'lecturer') {
        const { data: lecturerClasses } = await supabase
          .from('lecture_reports')
          .select('class_id')
          .eq('lecturer_id', user.id)

        if (lecturerClasses && lecturerClasses.length > 0) {
          const classIds = [...new Set(lecturerClasses.map(lc => lc.class_id))]
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
  } else if (req.method === 'POST') {
    try {
      const token = req.headers.authorization?.split(' ')[1]
      if (!token) {
        return res.status(401).json({ error: 'Authorization required' })
      }

      const user = jwt.verify(token, process.env.JWT_SECRET || 'luct-fict-2024-secret')
      
      if (user.role !== 'program_leader') {
        return res.status(403).json({ error: 'Only Program Leaders can add classes' })
      }

      const { class_name, course_id, venue, scheduled_time, total_registered_students } = req.body

      if (!class_name || !course_id || !venue || !scheduled_time) {
        return res.status(400).json({ error: 'Class name, course, venue, and scheduled time are required' })
      }

      const { data: newClass, error } = await supabase
        .from('classes')
        .insert([{
          class_name,
          course_id: parseInt(course_id),
          venue,
          scheduled_time,
          total_registered_students: total_registered_students || 0
        }])
        .select()

      if (error) throw error
      res.json({ message: 'Class added successfully', classId: newClass[0].id })
    } catch (error) {
      console.error('Add class error:', error)
      res.status(500).json({ error: error.message })
    }
  } else {
    res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }
}
