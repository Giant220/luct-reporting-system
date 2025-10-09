import { supabase } from '../utils/supabaseClient.js'
import jwt from 'jsonwebtoken'
import ExcelJS from 'exceljs'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'GET') {
    try {
      const token = req.headers.authorization?.split(' ')[1]
      if (!token) return res.status(401).json({ error: 'Authorization required' })

      const user = jwt.verify(token, process.env.JWT_SECRET || 'luct-fict-2024-secret')

      let query = supabase
        .from('lecture_reports')
        .select(`*, classes (class_name, venue, scheduled_time, total_registered_students, courses (course_code, course_name, course_type, credits, program)), users!lecture_reports_lecturer_id_fkey (name as lecturer_name)`)

      if (user.role === 'lecturer') {
        query = query.eq('lecturer_id', user.id)
      } else if (user.role === 'student') {
        const { data: enrollments } = await supabase
          .from('student_classes')
          .select('class_id')
          .eq('student_id', user.id)

        if (enrollments && enrollments.length > 0) {
          const classIds = enrollments.map(e => e.class_id)
          query = query.in('class_id', classIds)
        } else {
          return res.status(400).json({ error: 'No enrolled classes found' })
        }
      } else if (user.role === 'principal_lecturer') {
        query = query.eq('classes.courses.faculty', 'Faculty of ICT (FICT)')
      }

      const { data: reports, error } = await query.order('created_at', { ascending: false })
      if (error) throw error

      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Lecture Reports')

      worksheet.columns = [
        { header: 'Report ID', key: 'id', width: 10 },
        { header: 'Class', key: 'class_name', width: 15 },
        { header: 'Course Code', key: 'course_code', width: 15 },
        { header: 'Course Name', key: 'course_name', width: 25 },
        { header: 'Program', key: 'program', width: 20 },
        { header: 'Lecturer', key: 'lecturer_name', width: 20 },
        { header: 'Week', key: 'week_of_reporting', width: 12 },
        { header: 'Date', key: 'date_of_lecture', width: 12 },
        { header: 'Students Present', key: 'actual_students_present', width: 15 },
        { header: 'Total Students', key: 'total_students', width: 15 },
        { header: 'Venue', key: 'venue', width: 15 },
        { header: 'Time', key: 'scheduled_time', width: 12 },
        { header: 'Topic', key: 'topic_taught', width: 30 },
        { header: 'Learning Outcomes', key: 'learning_outcomes', width: 40 },
        { header: 'Recommendations', key: 'lecturer_recommendations', width: 40 }
      ]

      if (reports && reports.length > 0) {
        reports.forEach(report => {
          worksheet.addRow({
            id: report.id,
            class_name: report.classes?.class_name,
            course_code: report.classes?.courses?.course_code,
            course_name: report.classes?.courses?.course_name,
            program: report.classes?.courses?.program,
            lecturer_name: report.lecturer_name,
            week_of_reporting: report.week_of_reporting,
            date_of_lecture: report.date_of_lecture,
            actual_students_present: report.actual_students_present,
            total_students: report.classes?.total_registered_students,
            venue: report.classes?.venue,
            scheduled_time: report.classes?.scheduled_time,
            topic_taught: report.topic_taught,
            learning_outcomes: report.learning_outcomes,
            lecturer_recommendations: report.lecturer_recommendations
          })
        })
      }

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      res.setHeader('Content-Disposition', `attachment; filename=luct-reports-${new Date().toISOString().split('T')[0]}.xlsx`)

      await workbook.xlsx.write(res)
      res.end()
    } catch (error) {
      console.error('Export error:', error)
      res.status(500).json({ error: error.message })
    }
  } else {
    res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }
}
