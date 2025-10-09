import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="navbar">
            <div className="logo-area">
                <div className="logo"></div>
                <span className="brand">LUCT FICT Reporting</span>
            </div>
            
            <div className="nav-links">
                <Link to="/dashboard">Dashboard</Link>
                
                {user?.role === 'lecturer' && (
                    <Link to="/report-form">Submit Report</Link>
                )}
                
                <Link to="/reports">View Reports</Link>

                {user?.role === 'principal_lecturer' && (
                    <Link to="/courses">Courses</Link>
                )}

                {user?.role === 'program_leader' && (
                    <Link to="/management">Management</Link>
                )}

                 <div className="flex-row">
                    <span style={{ color: '#ffda77' }}>
                        {user?.name} ({user?.role?.replace('_', ' ')})
                        {user?.course_program && ` - ${user.course_program}`}
                    </span>
                    <button 
                        onClick={handleLogout}
                        style={{
                            background: 'transparent',
                            color: '#fff',
                            border: '1px solid #ffda77',
                            padding: '0.35rem 0.8rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            marginLeft: '1rem'
                        }}
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Navbar;