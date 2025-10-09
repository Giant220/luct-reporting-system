import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../config/api';
import Navbar from './Navbar';

const Dashboard = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [coursesRes, reportsRes] = await Promise.all([
        api.get('/api/courses'),
        api.get('/api/reports')
      ]);

      setCourses(coursesRes.data || []);
      setReports(reportsRes.data || []);
      calculateStats(coursesRes.data || [], reportsRes.data || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (coursesData, reportsData) => {
    const stats = {
      totalCourses: coursesData.length,
      totalReports: reportsData.length,
      myReports: reportsData.filter(r => r.lecturer_id === user?.id).length,
      myClasses: 0,
      attendanceRate: '0%',
      averageRating: '0.0'
    };

    if (user?.role === 'student') {
      stats.myClasses = coursesData.length;
      const presentReports = reportsData.filter(r => r.actual_students_present > 0);
      stats.attendanceRate = reportsData.length > 0 
        ? `${Math.round((presentReports.length / reportsData.length) * 100)}%` 
        : '0%';
    } else if (user?.role === 'lecturer') {
      // Count unique classes for lecturer
      const lecturerClasses = [...new Set(reportsData.filter(r => r.lecturer_id === user.id).map(r => r.class_id))];
      stats.myClasses = lecturerClasses.length;
    }

    setStats(stats);
  };

  const getDashboardStats = () => {
    switch (user.role) {
      case 'student':
        return [
          { title: 'My Courses', value: stats.totalCourses || 0 },
          { title: 'Classes', value: stats.myClasses || 0 },
          { title: 'Reports Available', value: stats.totalReports || 0 },
          { title: 'Attendance Rate', value: stats.attendanceRate || '0%' }
        ];
      case 'lecturer':
        return [
          { title: 'My Reports', value: stats.myReports || 0 },
          { title: 'My Classes', value: stats.myClasses || 0 },
          { title: 'Total Courses', value: stats.totalCourses || 0 },
          { title: 'Average Rating', value: stats.averageRating || '4.5' }
        ];
      case 'principal_lecturer':
        return [
          { title: 'Faculty Courses', value: stats.totalCourses || 0 },
          { title: 'Total Reports', value: stats.totalReports || 0 },
          { title: 'Lecturers', value: '8' },
          { title: 'Pending Feedback', value: '3' }
        ];
      case 'program_leader':
        return [
          { title: 'Total Courses', value: stats.totalCourses || 0 },
          { title: 'Programs', value: '3' },
          { title: 'Lecturers', value: '12' },
          { title: 'Students', value: '350' }
        ];
      default:
        return [];
    }
  };

  const getRoleFeatures = () => {
    const features = {
      student: [
        'View lecture reports from enrolled classes',
        'Monitor class activities and attendance',
        'Rate lectures and provide feedback',
        'Track course progress and materials'
      ],
      lecturer: [
        'Submit detailed lecture reports',
        'Manage assigned classes and courses',
        'Monitor student attendance and performance',
        'View student ratings and feedback'
      ],
      principal_lecturer: [
        'View all courses and lectures under FICT',
        'Provide constructive feedback on reports',
        'Monitor teaching quality and standards',
        'View analytics and performance ratings'
      ],
      program_leader: [
        'Add and assign course modules',
        'View comprehensive reports from PRLs',
        'Monitor overall program performance',
        'Manage lecturers and course allocations'
      ]
    };
    return features[user.role] || [];
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="main-content">
          <div className="section">
            <p>Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="main-content">
        <div className="dashboard-top">
          <h2>Welcome, {user.name}!</h2>
          <span className={`role-badge role-${user.role}`}>
            {user.role.replace('_', ' ')}
            {user.course_program && ` - ${user.course_program}`}
          </span>
        </div>
        
        <div className="dashboard-top">
          {getDashboardStats().map((stat, index) => (
            <div key={index} className="card">
              <h3>{stat.title}</h3>
              <p>{stat.value}</p>
            </div>
          ))}
        </div>

        {user.role === 'student' && courses.length > 0 && (
          <div className="section">
            <h3>My Course Modules - {user.course_program}</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Course Code</th>
                    <th>Course Name</th>
                    <th>Type</th>
                    <th>Credits</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map(course => (
                    <tr key={course.id}>
                      <td><strong>{course.course_code}</strong></td>
                      <td>{course.course_name}</td>
                      <td>
                        <span className={`role-badge ${course.course_type === 'Major' ? 'role-lecturer' : 'role-student'}`}>
                          {course.course_type}
                        </span>
                      </td>
                      <td>{course.credits}</td>
                      <td>
                        <span className="role-badge role-program_leader">
                          Enrolled
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        <div className="section">
          <h3>Your Capabilities</h3>
          <div className="role-grid">
            <div className="role-card">
              <h3>Available Features</h3>
              <ul className="role-features">
                {getRoleFeatures().map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
            
            <div className="role-card">
              <h3>Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {user.role === 'lecturer' && (
                  <a href="/report-form" className="form button" style={{ textAlign: 'center', textDecoration: 'none' }}>
                    Submit New Report
                  </a>
                )}
                <a href="/reports" className="form button btn-secondary" style={{ textAlign: 'center', textDecoration: 'none' }}>
                  View Reports
                </a>
                {user.role === 'student' && (
                  <a href="/reports" className="form button btn-success" style={{ textAlign: 'center', textDecoration: 'none' }}>
                    Rate Lectures
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="section">
          <h3>Recent Activity</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Topic</th>
                  <th>Date</th>
                  <th>Lecturer</th>
                  <th>Students</th>
                  {user.role === 'student' && <th>Status</th>}
                </tr>
              </thead>
              <tbody>
                {reports.slice(0, 5).map(report => (
                  <tr key={report.id}>
                    <td>{report.classes?.courses?.course_code}</td>
                    <td>{report.topic_taught}</td>
                    <td>{report.date_of_lecture}</td>
                    <td>{report.lecturer_name}</td>
                    <td>{report.actual_students_present}</td>
                    {user.role === 'student' && (
                      <td>
                        <span className="role-badge role-student">
                          Viewed
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr>
                    <td colSpan={user.role === 'student' ? 6 : 5} style={{ textAlign: 'center', color: '#95a5a6' }}>
                      No reports available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;