-- Student Portal Database Schema (MySQL / PostgreSQL / SQLite compatible)
CREATE DATABASE IF NOT EXISTS student_portal;
USE student_portal;

-- Users table (based on admin/1234 login logic)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    failed_attempts INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default admin user (Password: 1234)
INSERT INTO users (username, password_hash)
VALUES ('admin', '1234')
ON DUPLICATE KEY UPDATE username = username;

-- Subject Schedule table (based on ScheduleManager in Final Project.py)
CREATE TABLE IF NOT EXISTS schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_code VARCHAR(20) NOT NULL UNIQUE,
    subject_name VARCHAR(100) NOT NULL,
    day_of_week VARCHAR(20) NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    room VARCHAR(50) NOT NULL,
    schedule_date VARCHAR(30) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample seed data
INSERT INTO schedules (subject_code, subject_name, day_of_week, time_slot, room, schedule_date)
VALUES 
    ('CS101', 'Introduction to Programming', 'Monday', '8:00AM-9:30AM', 'Lab 1', '2026-11-23'),
    ('MATH201', 'Discrete Mathematics', 'Wednesday', '10:00AM-11:30AM', 'Room 304', '2026-11-25');

-- Grade Records table (optional persistence for Grade Average tool)
CREATE TABLE IF NOT EXISTS grade_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_count INT NOT NULL,
    average_grade DECIMAL(5,2) NOT NULL,
    highest_grade DECIMAL(5,2) NOT NULL,
    lowest_grade DECIMAL(5,2) NOT NULL,
    remarks VARCHAR(10) NOT NULL,
    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);