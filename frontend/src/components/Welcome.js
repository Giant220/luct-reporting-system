import React from 'react';
import { useNavigate } from 'react-router-dom';

const Welcome = () => {
  const navigate = useNavigate();

  const programs = [
    {
      name: 'Information Technology (IT)',
      code: 'IT',
      description: 'Comprehensive IT program focusing on software development, networking, and system architecture.',
      modules: [
        'BIOP2110 - Object Oriented Programming I (10.0 credits)',
        'BIMT2108 - Multimedia Technology (8.0 credits)',
        'BBCO2108 - Concepts of Organization (8.0 credits)',
        'BIDC2110 - Data Communication & Networking (10.0 credits)',
        'BIWA2110 - Web Application Development (10.0 credits)',
        'BIIC2110 - Introduction to Computer Architecture (10.0 credits)'
      ]
    },
    {
      name: 'Business Information Technology (BIT)',
      code: 'Business IT',
      description: 'Blend of business management and information technology for modern business solutions.',
      modules: [
        'BIOP2110 - Object Oriented Programming I (10.0 credits)',
        'BBCO2108 - Concepts of Organization (8.0 credits)',
        'BIDC2110 - Data Communication & Networking (10.0 credits)',
        'BIWA2110 - Web Application Development (10.0 credits)',
        'BICL2110 - Calculus II (10.0 credits)',
        'BIAC2110 - Accounting (10.0 credits)'
      ]
    },
    {
      name: 'Software & Multimedia Technology',
      code: 'Software & Multimedia',
      description: 'Specialized program in software development combined with multimedia and design.',
      modules: [
        'BIOP2110 - Object Oriented Programming I (10.0 credits)',
        'BIMT2108 - Multimedia Technology (8.0 credits)',
        'BBCO2108 - Concepts of Organization (8.0 credits)',
        'BIDC2110 - Data Communication & Networking (10.0 credits)',
        'BIWA2110 - Web Application Development (10.0 credits)',
        'BIGD2110 - Graphic Design (10.0 credits)'
      ]
    }
  ];

  return (
    <div className="welcome-container">
      <div className="welcome-header">
        <div className="logo-area">
          <div className="logo"></div>
          <span className="brand">LUCT Faculty of ICT (FICT)</span>
        </div>
      </div>

      <div className="welcome-content">
        <h1>Welcome to LUCT Reporting System</h1>
        <p>
          Faculty of Information and Communication Technology (FICT) - 
          Empowering the next generation of technology leaders through innovative education and practical experience.
        </p>

        <div className="program-cards">
          {programs.map((program, index) => (
            <div key={program.code} className="program-card">
              <h3>{program.name}</h3>
              <p>{program.description}</p>
              <ul className="program-modules">
                {program.modules.map((module, idx) => (
                  <li key={idx}>{module}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="welcome-actions">
          <button onClick={() => navigate('/login')}>
            Login to Your Account
          </button>
          <button onClick={() => navigate('/register')}>
            Create New Account
          </button>
        </div>

        <p style={{ marginTop: '2rem', fontSize: '0.9rem', opacity: 0.8 }}>
          To proceed with the system, please login if you have an account or register for a new one.
        </p>
      </div>
    </div>
  );
};

export default Welcome;