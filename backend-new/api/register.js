import { supabase } from '../utils/supabaseClient.js'

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      const { email, password, role, name, gender, faculty, course_program } = req.body;

      if (!email || !password || !role || !name) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      // Validate course program for students
      if (role === 'student' && !course_program) {
        return res.status(400).json({ error: 'Course program is required for students' });
      }

      const { data: existing, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)

      if (checkError) throw checkError

      if (existing && existing.length > 0) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const { data: user, error } = await supabase
        .from('users')
        .insert([
          { 
            email, 
            password, 
            role, 
            name, 
            gender: gender || null,
            faculty: faculty || 'Faculty of ICT (FICT)',
            course_program: role === 'student' ? course_program : null
          }
        ])
        .select()

      if (error) throw error

      // Auto-enroll students in their program classes
      if (role === 'student' && course_program) {
        const { data: programClasses, error: classError } = await supabase
          .from('classes')
          .select('id')
          .eq('classes.courses.program', course_program)

        if (!classError && programClasses) {
          const enrollments = programClasses.map(classItem => ({
            student_id: user[0].id,
            class_id: classItem.id
          }))

          if (enrollments.length > 0) {
            await supabase
              .from('student_classes')
              .insert(enrollments)
          }
        }
      }

      res.json({ 
        message: 'User registered successfully', 
        userId: user[0].id,
        user: user[0]
      })
    } catch (error) {
      console.error('Registration error:', error)
      res.status(500).json({ error: error.message })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }
}