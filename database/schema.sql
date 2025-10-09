-- Create tables in Supabase
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'lecturer', 'principal_lecturer', 'program_leader')),
    name VARCHAR(255) NOT NULL,
    gender VARCHAR(10),
    faculty VARCHAR(255) DEFAULT 'Faculty of ICT (FICT)',
    course_program VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    course_code VARCHAR(50) UNIQUE NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    course_type VARCHAR(50) NOT NULL,
    credits DECIMAL(3,1) NOT NULL,
    program VARCHAR(100) NOT NULL,
    faculty VARCHAR(255) DEFAULT 'Faculty of ICT (FICT)'
);

CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    class_name VARCHAR(255) NOT NULL,
    course_id INTEGER REFERENCES courses(id),
    lecturer_id INTEGER REFERENCES users(id),
    total_registered_students INTEGER DEFAULT 0,
    venue VARCHAR(255),
    scheduled_time TIME,
    faculty VARCHAR(255) DEFAULT 'Faculty of ICT (FICT)'
);

CREATE TABLE lecture_reports (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id),
    lecturer_id INTEGER REFERENCES users(id),
    week_of_reporting VARCHAR(50),
    date_of_lecture DATE,
    actual_students_present INTEGER,
    topic_taught TEXT,
    learning_outcomes TEXT,
    lecturer_recommendations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE feedback (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES lecture_reports(id),
    principal_lecturer_id INTEGER REFERENCES users(id),
    feedback_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE ratings (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES lecture_reports(id),
    student_id INTEGER REFERENCES users(id),
    rating_value INTEGER CHECK (rating_value >= 1 AND rating_value <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE student_classes (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id),
    class_id INTEGER REFERENCES classes(id),
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    UNIQUE(student_id, class_id)
);

-- Insert FICT Programs and Courses
INSERT INTO courses (course_code, course_name, course_type, credits, program) VALUES
-- IT Program
('BIOP2110', 'Object Oriented Programming I', 'Major', 10.0, 'IT'),
('BIMT2108', 'Multimedia Technology', 'Major', 8.0, 'IT'),
('BBCO2108', 'Concepts of Organization', 'Minor', 8.0, 'IT'),
('BIDC2110', 'Data Communication & Networking', 'Major', 10.0, 'IT'),
('BIWA2110', 'Web Application Development', 'Major', 10.0, 'IT'),
('BIIC2110', 'Introduction to Computer Architecture', 'Major', 10.0, 'IT'),

-- Business IT Program
('BIOP2110', 'Object Oriented Programming I', 'Major', 10.0, 'Business IT'),
('BBCO2108', 'Concepts of Organization', 'Minor', 8.0, 'Business IT'),
('BIDC2110', 'Data Communication & Networking', 'Major', 10.0, 'Business IT'),
('BIWA2110', 'Web Application Development', 'Major', 10.0, 'Business IT'),
('BICL2110', 'Calculus II', 'Major', 10.0, 'Business IT'),
('BIAC2110', 'Accounting', 'Major', 10.0, 'Business IT'),

-- Software & Multimedia Technology
('BIOP2110', 'Object Oriented Programming I', 'Major', 10.0, 'Software & Multimedia'),
('BIMT2108', 'Multimedia Technology', 'Major', 8.0, 'Software & Multimedia'),
('BBCO2108', 'Concepts of Organization', 'Minor', 8.0, 'Software & Multimedia'),
('BIDC2110', 'Data Communication & Networking', 'Major', 10.0, 'Software & Multimedia'),
('BIWA2110', 'Web Application Development', 'Major', 10.0, 'Software & Multimedia'),
('BIGD2110', 'Graphic Design', 'Major', 10.0, 'Software & Multimedia');

-- Insert Users with Sotho Names
INSERT INTO users (email, password, role, name, gender, course_program) VALUES
-- Students
('lerato@student.luct.com', 'student123', 'student', 'Lerato Maepe', 'f', 'IT'),
('tshepo@student.luct.com', 'student123', 'student', 'Tshepo Marumo', 'm', 'Business IT'),
('lebohang@student.luct.com', 'student123', 'student', 'Lebohang Setho', 'm', 'Software & Multimedia'),
('sebolelo@student.luct.com', 'student123', 'student', 'Sebolelo Mohapi', 'f', 'IT'),
('lereko@student.luct.com', 'student123', 'student', 'Lereko Mohau', 'm', 'Business IT'),

-- Lecturers
('thabo@lecturer.luct.com', 'lecturer123', 'lecturer', 'Dr. Thabo Moloi', 'm', NULL),
('mpho@lecturer.luct.com', 'lecturer123', 'lecturer', 'Dr. Mpho van Wyk', 'f', NULL),

-- Principal Lecturers
('prl@luct.com', 'prl123', 'principal_lecturer', 'Prof. John PRL', 'm', NULL),

-- Program Leader
('pl@luct.com', 'pl123', 'program_leader', 'Dr. Sarah PL', 'f', NULL);

-- Insert Classes for IT Program
INSERT INTO classes (class_name, course_id, lecturer_id, total_registered_students, venue, scheduled_time) VALUES
('IT-BIOP2110-A', 1, 6, 45, 'Lab 101', '08:00:00'),
('IT-BIMT2108-A', 2, 6, 38, 'Lab 102', '10:00:00'),
('IT-BBCO2108-A', 3, 7, 52, 'Room 201', '14:00:00'),
('IT-BIDC2110-A', 4, 6, 42, 'Lab 103', '12:00:00'),
('IT-BIWA2110-A', 5, 7, 48, 'Lab 104', '16:00:00'),
('IT-BIIC2110-A', 6, 6, 35, 'Room 202', '09:00:00');

-- Insert Classes for Business IT Program
INSERT INTO classes (class_name, course_id, lecturer_id, total_registered_students, venue, scheduled_time) VALUES
('BIT-BIOP2110-B', 7, 7, 40, 'Lab 105', '08:00:00'),
('BIT-BBCO2108-B', 8, 6, 36, 'Room 203', '11:00:00'),
('BIT-BIDC2110-B', 9, 7, 44, 'Lab 106', '13:00:00'),
('BIT-BIWA2110-B', 10, 6, 39, 'Lab 107', '15:00:00'),
('BIT-BICL2110-B', 11, 7, 42, 'Room 204', '17:00:00'),
('BIT-BIAC2110-B', 12, 6, 38, 'Room 205', '10:00:00');

-- Insert Classes for Software & Multimedia Program
INSERT INTO classes (class_name, course_id, lecturer_id, total_registered_students, venue, scheduled_time) VALUES
('SMT-BIOP2110-C', 13, 6, 43, 'Lab 108', '08:00:00'),
('SMT-BIMT2108-C', 14, 7, 41, 'Lab 109', '10:00:00'),
('SMT-BBCO2108-C', 15, 6, 37, 'Room 206', '14:00:00'),
('SMT-BIDC2110-C', 16, 7, 45, 'Lab 110', '12:00:00'),
('SMT-BIWA2110-C', 17, 6, 40, 'Lab 111', '16:00:00'),
('SMT-BIGD2110-C', 18, 7, 39, 'Studio 101', '09:00:00');

-- Enroll Students in their respective program classes
-- Lerato Maepe (IT Program)
INSERT INTO student_classes (student_id, class_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6);

-- Tshepo Marumo (Business IT Program)
INSERT INTO student_classes (student_id, class_id) VALUES
(2, 7), (2, 8), (2, 9), (2, 10), (2, 11), (2, 12);

-- Lebohang Setho (Software & Multimedia Program)
INSERT INTO student_classes (student_id, class_id) VALUES
(3, 13), (3, 14), (3, 15), (3, 16), (3, 17), (3, 18);

-- Sebolelo Mohapi (IT Program)
INSERT INTO student_classes (student_id, class_id) VALUES
(4, 1), (4, 2), (4, 3), (4, 4), (4, 5), (4, 6);

-- Lereko Mohau (Business IT Program)
INSERT INTO student_classes (student_id, class_id) VALUES
(5, 7), (5, 8), (5, 9), (5, 10), (5, 11), (5, 12);

-- Sample Lecture Reports
INSERT INTO lecture_reports (class_id, lecturer_id, week_of_reporting, date_of_lecture, actual_students_present, topic_taught, learning_outcomes, lecturer_recommendations) VALUES
(1, 6, 'Week 1', '2024-01-15', 42, 'Introduction to OOP Concepts', 'Understand classes and objects, Learn encapsulation basics, Write simple Java programs', 'More practice with object creation needed'),
(7, 7, 'Week 1', '2024-01-16', 38, 'Business Organization Structures', 'Understand different business types, Learn organizational hierarchy, Analyze case studies', 'Good participation in group discussions'),
(13, 6, 'Week 1', '2024-01-17', 40, 'Programming Fundamentals', 'Learn basic syntax, Understand variables and data types, Write simple programs', 'Students need more hands-on coding practice');