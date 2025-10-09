import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../config/api';
import Navbar from './Navbar';

const ReportsView = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({});
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');

  useEffect(() => {
    loadReports();
  }, [user]);

  useEffect(() => {
    filterReports();
  }, [reports, searchTerm]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/reports');
      setReports(response.data);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    if (!searchTerm) {
      setFilteredReports(reports);
      return;
    }

    const filtered = reports.filter(report =>
      report.topic_taught?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.classes?.courses?.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.lecturer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.classes?.courses?.program?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredReports(filtered);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/api/export', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `luct-reports-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export reports');
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/feedback', {
        report_id: selectedReport.id,
        feedback_text: feedbackText
      });
      
      setFeedback({
        ...feedback,
        [selectedReport.id]: feedbackText
      });
      setShowFeedbackForm(false);
      setSelectedReport(null);
      setFeedbackText('');
      alert('Feedback submitted successfully!');
    } catch (error) {
      console.error('Feedback error:', error);
      alert('Failed to submit feedback');
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="main-content">
          <div className="section">
            <p>Loading reports...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="main-content">
        <div className="flex-row">
          <h2>Lecture Reports - FICT</h2>
          <div className="right">
            <button onClick={handleExport} className="export-btn">
              Export to Excel
            </button>
          </div>
        </div>

        <div className="flex-row">
          <input
            type="text"
            placeholder="Search reports by topic, course, lecturer, or program..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-bar"
          />
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Course</th>
                <th>Program</th>
                <th>Lecturer</th>
                <th>Week</th>
                <th>Date</th>
                <th>Students Present</th>
                <th>Topic</th>
                {(user.role === 'principal_lecturer' || user.role === 'lecturer') && <th>PRL Feedback</th>}
                {user.role === 'principal_lecturer' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredReports.map(report => (
                <tr key={report.id}>
                  <td>{report.classes?.class_name}</td>
                  <td>
                    <strong>{report.classes?.courses?.course_code}</strong><br/>
                    {report.classes?.courses?.course_name}
                  </td>
                  <td>{report.classes?.courses?.program}</td>
                  <td>{report.lecturer_name}</td>
                  <td>{report.week_of_reporting}</td>
                  <td>{report.date_of_lecture}</td>
                  <td>{report.actual_students_present}</td>
                  <td>{report.topic_taught}</td>
                  
                  {(user.role === 'principal_lecturer' || (user.role === 'lecturer' && report.lecturer_id === user.id)) && (
                    <td>
                      {feedback[report.id] ? (
                        <div>
                          <strong>Feedback:</strong> {feedback[report.id]}
                        </div>
                      ) : (
                        <span style={{ color: '#95a5a6' }}>No feedback yet</span>
                      )}
                    </td>
                  )}
                  
                  {user.role === 'principal_lecturer' && (
                    <td>
                      <button
                        onClick={() => {
                          setSelectedReport(report);
                          setShowFeedbackForm(true);
                        }}
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                      >
                        Add Feedback
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={user.role === 'principal_lecturer' ? 10 : 9} style={{ textAlign: 'center', color: '#95a5a6' }}>
                    {searchTerm ? 'No reports match your search' : 'No reports available'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showFeedbackForm && selectedReport && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '10px',
            width: '90%',
            maxWidth: '500px'
          }}>
            <h3>Add Feedback for: {selectedReport.topic_taught}</h3>
            <form onSubmit={handleFeedbackSubmit} className="form">
              <textarea
                placeholder="Enter your feedback..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows="6"
                required
              />
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit">Submit Feedback</button>
                <button
                  type="button"
                  onClick={() => {
                    setShowFeedbackForm(false);
                    setSelectedReport(null);
                    setFeedbackText('');
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsView;