import { supabase } from '../utils/supabaseClient.js'
import jwt from 'jsonwebtoken'

export default async function handler(req, res) {
  // Set CORS headers for ALL responses first
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS')
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

      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      // Remove password from response
      const { password, ...userWithoutPassword } = profile
      res.json(userWithoutPassword)

    } catch (error) {
      console.error('Get profile error:', error)
      res.status(500).json({ error: error.message })
    }
  } else if (req.method === 'PUT') {
    try {
      const token = req.headers.authorization?.split(' ')[1]
      if (!token) {
        return res.status(401).json({ error: 'Authorization required' })
      }

      const user = jwt.verify(token, process.env.JWT_SECRET || 'luct-fict-2024-secret')
      const { name, email, faculty, course_program, gender } = req.body

      const { data: profile, error } = await supabase
        .from('users')
        .update({
          name,
          email,
          faculty,
          course_program,
          gender,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()

      if (error) throw error

      res.json({ message: 'Profile updated successfully', profile })

    } catch (error) {
      console.error('Update profile error:', error)
      res.status(500).json({ error: error.message })
    }
  } else {
    res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }
}