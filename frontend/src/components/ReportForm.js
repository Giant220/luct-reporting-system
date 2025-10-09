import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../config/api';
import Navbar from './Navbar';

const ReportForm = () => {
    const [formData, setFormData] = useState({
        class_id: '',
        week_of_reporting: '',
        date_of_lecture: '',
        actual_students_present: '',
        topic_taught: '',
        learning_outcomes: '',
        lecturer_recommendations: ''
    });
    const [classes, setClasses] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [classLoading, setClassLoading] = useState(true);
    
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        loadClasses();
    }, []);

    const loadClasses = async () => {
        try {
            setClassLoading(true);
            const response = await api.get('/api/classes');
            setClasses(response.data);
        } catch (error) {
            console.error('Error loading classes:', error);
            setError('Failed to load classes');
        } finally {
            setClassLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await api.post('/api/reports', formData);
            setSuccess('Report submitted successfully!');
            setFormData({
                class_id: '',
                week_of_reporting: '',
                date_of_lecture: '',
                actual_students_present: '',
                topic_taught: '',
                learning_outcomes: '',
                lecturer_recommendations: ''
            });
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
        } catch (error) {
            console.error('Error submitting report:', error);
            setError(error.response?.data?.error || 'Failed to submit report');
        } finally {
            setLoading(false);
        }
    };

    if (user?.role !== 'lecturer') {
        return (
            <div>
                <Navbar />
                <div className="main-content">
                    <div className="error-message">
                        Access denied. Only lecturers can submit reports.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Navbar />
            <div className="main-content">
                <h2>Submit Lecture Report - FICT</h2>
                
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}
                
                <div className="form-container">
                    <form onSubmit={handleSubmit} className="form">
                        <select 
                            name="class_id" 
                            value={formData.class_id} 
                            onChange={handleChange}
                            required
                            disabled={loading || classLoading}
                        >
                            <option value="">Select Class</option>
                            {classes.map(cls => (
                                <option key={cls.id} value={cls.id}>
                                    {cls.class_name} - {cls.courses?.course_name} ({cls.courses?.program})
                                </option>
                            ))}
                        </select>

                        {classLoading && <p>Loading classes...</p>}

                        <input 
                            type="text" 
                            name="week_of_reporting"
                            placeholder="Week of Reporting (e.g., Week 1, Semester 1)" 
                            value={formData.week_of_reporting} 
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />

                        <input 
                            type="date" 
                            name="date_of_lecture"
                            value={formData.date_of_lecture} 
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />

                        <input 
                            type="number" 
                            name="actual_students_present"
                            placeholder="Actual Number of Students Present" 
                            value={formData.actual_students_present} 
                            onChange={handleChange}
                            required
                            min="1"
                            disabled={loading}
                        />

                        <input 
                            type="text" 
                            name="topic_taught"
                            placeholder="Topic Taught" 
                            value={formData.topic_taught} 
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />

                        <textarea 
                            name="learning_outcomes"
                            placeholder="Learning Outcomes of the Topic" 
                            value={formData.learning_outcomes} 
                            onChange={handleChange}
                            required
                            rows="4"
                            disabled={loading}
                        />

                        <textarea 
                            name="lecturer_recommendations"
                            placeholder="Lecturer's Recommendations" 
                            value={formData.lecturer_recommendations} 
                            onChange={handleChange}
                            required
                            rows="4"
                            disabled={loading}
                        />

                        <button type="submit" disabled={loading}>
                            {loading ? 'Submitting Report...' : 'Submit Report'}
                        </button>
                        <button 
                            type="button" 
                            onClick={() => navigate('/dashboard')} 
                            className="btn-secondary"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ReportForm;