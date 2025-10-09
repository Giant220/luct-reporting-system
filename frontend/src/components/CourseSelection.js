import React, { useState } from 'react';

const CourseSelection = ({ onCourseSelect }) => {
  const [selectedCourse, setSelectedCourse] = useState('');

  const programs = [
    {
      code: 'IT',
      name: 'Information Technology (IT)',
      description: 'Software development, networking, and system architecture'
    },
    {
      code: 'Business IT',
      name: 'Business Information Technology (BIT)',
      description: 'Business management and IT solutions'
    },
    {
      code: 'Software & Multimedia',
      name: 'Software & Multimedia Technology',
      description: 'Software development with multimedia and design'
    }
  ];

  const handleCourseSelect = (programCode) => {
    setSelectedCourse(programCode);
    onCourseSelect(programCode);
  };

  return (
    <div className="section">
      <h3>Select Your Program</h3>
      <p>Choose the program you want to enroll in. This will determine your course modules.</p>
      
      <div className="course-selection">
        {programs.map((program) => (
          <div
            key={program.code}
            className={`course-option ${selectedCourse === program.code ? 'selected' : ''}`}
            onClick={() => handleCourseSelect(program.code)}
          >
            <h4>{program.name}</h4>
            <p>{program.description}</p>
          </div>
        ))}
      </div>
      
      {selectedCourse && (
        <div className="success-message">
          Selected: {programs.find(p => p.code === selectedCourse)?.name}
        </div>
      )}
    </div>
  );
};

export default CourseSelection;