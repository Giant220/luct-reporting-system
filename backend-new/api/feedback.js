import { supabase } from '../utils/supabaseClient.js'
import jwt from 'jsonwebtoken'

export default async function handler(req, res) {
  // Set CORS headers for ALL responses first
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'GET') {
    try {
      const token = req.headers.authorization?.split(' ')[1]
      if (!token) {
        return res.status(401).json({ error: 'Authorization required' })
      }

      const user = jwt.verify(token, process.env.JWT_SECRET || 'luct-fict-2024-secret')
      
      let query = supabase
        .from('feedback')
        .select(`
          *,
          lecture_reports (
            class_id,
            topic_taught,
            classes (class_name, courses (course_name))
          ),
          users!feedback_principal_lecturer_id_fkey (name as prl_name)
        `)

      if (user.role === 'principal_lecturer') {
        query = query.eq('principal_lecturer_id', user.id)
      } else if (user.role === 'lecturer') {
        // Lecturers see feedback on their reports
        const { data: lecturerReports } = await supabase
          .from('lecture_reports')
          .select('id')
          .eq('lecturer_id', user.id)

        if (lecturerReports && lecturerReports.length > 0) {
          const reportIds = lecturerReports.map(r => r.id)
          query = query.in('report_id', reportIds)
        } else {
          return res.json([])
        }
      }

      const { data: feedback, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      res.json(feedback || [])
    } catch (error) {
      console.error('Get feedback error:', error)
      res.status(500).json({ error: error.message })
    }
  } else if (req.method === 'POST') {
    try {
      const token = req.headers.authorization?.split(' ')[1]
      if (!token) {
        return res.status(401).json({ error: 'Authorization required' })
      }

      const user = jwt.verify(token, process.env.JWT_SECRET || 'luct-fict-2024-secret')
      
      if (user.role !== 'principal_lecturer') {
        return res.status(403).json({ error: 'Only Principal Lecturers can add feedback' })
      }

      const { report_id, feedback_text } = req.body

      if (!report_id || !feedback_text) {
        return res.status(400).json({ error: 'Report ID and feedback text are required' })
      }

      const { data: feedback, error } = await supabase
        .from('feedback')
        .insert([
          {
            report_id: parseInt(report_id),
            principal_lecturer_id: user.id,
            feedback_text
          }
        ])
        .select()

      if (error) throw error

      res.json({ message: 'Feedback added successfully', feedbackId: feedback[0].id })
    } catch (error) {
      console.error('Add feedback error:', error)
      res.status(500).json({ error: error.message })
    }
  } else {
    res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }
}