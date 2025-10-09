import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CourseSelection from './CourseSelection';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student',
        gender: '',
        faculty: 'Faculty of ICT (FICT)',
        course_program: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleCourseSelect = (programCode) => {
        setFormData({
            ...formData,
            course_program: programCode
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            return setError('Passwords do not match');
        }

        if (formData.password.length < 6) {
            return setError('Password must be at least 6 characters');
        }

        if (formData.role === 'student' && !formData.course_program) {
            return setError('Please select a course program');
        }

        setLoading(true);

        const result = await register({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role,
            gender: formData.gender,
            faculty: formData.faculty,
            course_program: formData.role === 'student' ? formData.course_program : null
        });
        
        if (result.success) {
            alert('Registration successful! Please sign in with your credentials.');
            navigate('/login');
        } else {
            setError(result.error);
        }
        
        setLoading(false);
    };

    return (
        <div className="login-container">
            <div className="login-form" style={{ maxWidth: '600px' }}>
                <h2>Create New Account - FICT</h2>
                {error && <div className="error-message">{error}</div>}
                
                <form onSubmit={handleSubmit} className="form">
                    <input
                        type="text"
                        name="name"
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        disabled={loading}
                    />
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={loading}
                    />
                    
                    <select 
                        name="role" 
                        value={formData.role} 
                        onChange={handleChange}
                        required
                        disabled={loading}
                    >
                        <option value="student">Student</option>
                        <option value="lecturer">Lecturer</option>
                        <option value="principal_lecturer">Principal Lecturer</option>
                        <option value="program_leader">Program Leader</option>
                    </select>
                    
                    <select 
                        name="gender" 
                        value={formData.gender} 
                        onChange={handleChange}
                        disabled={loading}
                    >
                        <option value="">Select Gender (Optional)</option>
                        <option value="m">Male</option>
                        <option value="f">Female</option>
                    </select>
                    
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        disabled={loading}
                    />
                    <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        disabled={loading}
                    />

                    {formData.role === 'student' && (
                        <CourseSelection onCourseSelect={handleCourseSelect} />
                    )}
                    
                    <button type="submit" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <p>Already have an account? <Link to="/login">Sign in here</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Register;