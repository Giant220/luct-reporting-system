import { supabase } from '../utils/supabaseClient.js'
import jwt from 'jsonwebtoken'

function authenticateToken(authHeader) {
  if (!authHeader) throw new Error('No authorization header')
  
  const token = authHeader.split(' ')[1]
  if (!token) throw new Error('No token provided')
  
  return jwt.verify(token, process.env.JWT_SECRET || 'luct-fict-2024-secret')
}

export default async function handler(req, res) {
  // Set CORS headers for ALL responses first
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    if (req.method === 'GET') {
      const user = authenticateToken(req.headers.authorization)
      
      let query = supabase
        .from('lecture_reports')
        .select(`
          *,
          classes (
            class_name, 
            venue,
            scheduled_time,
            total_registered_students,
            courses (
              course_code, 
              course_name, 
              course_type,
              credits,
              program,
              faculty
            )
          ),
          users!lecture_reports_lecturer_id_fkey (name as lecturer_name)
        `)

      // Role-based filtering
      if (user.role === 'lecturer') {
        query = query.eq('lecturer_id', user.id)
      } else if (user.role === 'student') {
        // Students see reports from their enrolled classes
        const { data: enrollments } = await supabase
          .from('student_classes')
          .select('class_id')
          .eq('student_id', user.id)

        if (enrollments && enrollments.length > 0) {
          const classIds = enrollments.map(e => e.class_id)
          query = query.in('class_id', classIds)
        } else {
          return res.json([])
        }
      } else if (user.role === 'principal_lecturer') {
        // PRL sees all reports from FICT faculty
        query = query.eq('classes.courses.faculty', 'Faculty of ICT (FICT)')
      }

      const { data: reports, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      res.json(reports || [])
    } else if (req.method === 'POST') {
      const user = authenticateToken(req.headers.authorization)
      
      if (user.role !== 'lecturer') {
        return res.status(403).json({ error: 'Only lecturers can submit reports' })
      }

      const {
        class_id,
        week_of_reporting,
        date_of_lecture,
        actual_students_present,
        topic_taught,
        learning_outcomes,
        lecturer_recommendations
      } = req.body

      // Validate required fields
      if (!class_id || !week_of_reporting || !date_of_lecture || !actual_students_present || !topic_taught || !learning_outcomes || !lecturer_recommendations) {
        return res.status(400).json({ error: 'All fields are required' })
      }

      const { data: report, error } = await supabase
        .from('lecture_reports')
        .insert([
          {
            class_id: parseInt(class_id),
            lecturer_id: user.id,
            week_of_reporting,
            date_of_lecture,
            actual_students_present: parseInt(actual_students_present),
            topic_taught,
            learning_outcomes,
            lecturer_recommendations
          }
        ])
        .select()

      if (error) throw error

      res.json({ message: 'Report submitted successfully', reportId: report[0].id })
    } else {
      res.status(405).json({ error: `Method ${req.method} Not Allowed` })
    }
  } catch (error) {
    console.error('Reports API error:', error)
    if (error.message.includes('authorization') || error.message.includes('token')) {
      res.status(401).json({ error: 'Invalid or expired token' })
    } else {
      res.status(500).json({ error: error.message })
    }
  }
}