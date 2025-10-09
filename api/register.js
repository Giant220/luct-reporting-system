import { supabase } from '../utils/supabaseClient.js'
import jwt from 'jsonwebtoken'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'POST') {
    try {
      const { name, email, password, role, faculty, course_program, gender } = req.body

      if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'Name, email, password, and role are required' })
      }

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' })
      }

      // Create new user
      const { data: user, error } = await supabase
        .from('users')
        .insert([{
          name,
          email,
          password,
          role,
          faculty: faculty || null,
          course_program: course_program || null,
          gender: gender || null
        }])
        .select()

      if (error) throw error

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user[0].id, 
          email: user[0].email, 
          role: user[0].role, 
          name: user[0].name,
          faculty: user[0].faculty,
          course_program: user[0].course_program,
          gender: user[0].gender
        },
        process.env.JWT_SECRET || 'luct-fict-2024-secret',
        { expiresIn: '24h' }
      )

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: user[0].id,
          email: user[0].email,
          role: user[0].role,
          name: user[0].name,
          faculty: user[0].faculty,
          course_program: user[0].course_program,
          gender: user[0].gender
        }
      })
    } catch (error) {
      console.error('Registration error:', error)
      res.status(500).json({ error: error.message })
    }
  } else {
    res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }
}
