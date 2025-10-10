import { supabase } from '../utils/supabaseClient.js'
import jwt from 'jsonwebtoken'

export default async function handler(req, res) {
  // Set CORS headers for ALL responses first
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization')

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'POST') {
    try {
      const { email, password } = req.body

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' })
      }

      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single()

      if (error || !user) {
        return res.status(400).json({ error: 'Invalid email or password' })
      }

      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role, 
          name: user.name,
          faculty: user.faculty,
          course_program: user.course_program,
          gender: user.gender
        },
        process.env.JWT_SECRET || 'luct-fict-2024-secret',
        { expiresIn: '24h' }
      )

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          faculty: user.faculty,
          course_program: user.course_program,
          gender: user.gender
        }
      })
    } catch (error) {
      console.error('Login error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else {
    res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }
}