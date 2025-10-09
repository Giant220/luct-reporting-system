import { supabase } from '../utils/supabaseClient.js'
import jwt from 'jsonwebtoken'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method === 'GET') {
    try {
      const token = req.headers.authorization?.split(' ')[1]
      if (!token) {
        return res.status(401).json({ error: 'Authorization required' })
      }

      const user = jwt.verify(token, process.env.JWT_SECRET || 'luct-fict-2024-secret')
      
      let query = supabase
        .from('ratings')
        .select(`
          *,
          lecture_reports (
            class_id,
            topic_taught,
            classes (class_name, courses (course_name))
          ),
          users!ratings_student_id_fkey (name as student_name)
        `)

      if (user.role === 'student') {
        query = query.eq('student_id', user.id)
      } else if (user.role === 'lecturer') {
        // Lecturers see ratings for their reports
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

      const { data: ratings, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      res.json(ratings || [])
    } catch (error) {
      console.error('Get ratings error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  if (req.method === 'POST') {
    try {
      const token = req.headers.authorization?.split(' ')[1]
      if (!token) {
        return res.status(401).json({ error: 'Authorization required' })
      }

      const user = jwt.verify(token, process.env.JWT_SECRET || 'luct-fict-2024-secret')
      
      if (user.role !== 'student') {
        return res.status(403).json({ error: 'Only students can add ratings' })
      }

      const { report_id, rating_value, comment } = req.body

      if (!report_id || !rating_value) {
        return res.status(400).json({ error: 'Report ID and rating value are required' })
      }

      // Check if student is enrolled in the class of this report
      const { data: report } = await supabase
        .from('lecture_reports')
        .select('class_id')
        .eq('id', report_id)
        .single()

      if (!report) {
        return res.status(404).json({ error: 'Report not found' })
      }

      const { data: enrollment } = await supabase
        .from('student_classes')
        .select('id')
        .eq('student_id', user.id)
        .eq('class_id', report.class_id)
        .single()

      if (!enrollment) {
        return res.status(403).json({ error: 'You can only rate lectures from your enrolled classes' })
      }

      const { data: rating, error } = await supabase
        .from('ratings')
        .insert([
          {
            report_id: parseInt(report_id),
            student_id: user.id,
            rating_value: parseInt(rating_value),
            comment: comment || ''
          }
        ])
        .select()

      if (error) throw error

      res.json({ message: 'Rating added successfully', ratingId: rating[0].id })
    } catch (error) {
      console.error('Add rating error:', error)
      res.status(500).json({ error: error.message })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }
}