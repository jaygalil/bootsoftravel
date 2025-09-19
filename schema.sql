-- Time Tracking System Database Schema
-- Handles accidental clock in/out scenarios

CREATE TABLE employees (
    id INT PRIMARY KEY IDENTITY(1,1),
    employee_id NVARCHAR(50) UNIQUE NOT NULL,
    name NVARCHAR(100) NOT NULL,
    email NVARCHAR(100),
    department NVARCHAR(50),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE time_entries (
    id INT PRIMARY KEY IDENTITY(1,1),
    employee_id INT NOT NULL,
    clock_in DATETIME2,
    clock_out DATETIME2,
    break_start DATETIME2,
    break_end DATETIME2,
    status NVARCHAR(20) DEFAULT 'active', -- active, completed, corrected, cancelled
    location NVARCHAR(100),
    ip_address NVARCHAR(45),
    notes NVARCHAR(500),
    is_correction BIT DEFAULT 0,
    original_entry_id INT,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (original_entry_id) REFERENCES time_entries(id)
);

CREATE TABLE correction_requests (
    id INT PRIMARY KEY IDENTITY(1,1),
    time_entry_id INT NOT NULL,
    employee_id INT NOT NULL,
    correction_type NVARCHAR(50), -- clock_in, clock_out, break_start, break_end, cancel
    original_time DATETIME2,
    requested_time DATETIME2,
    reason NVARCHAR(500) NOT NULL,
    status NVARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    approved_by INT,
    approved_at DATETIME2,
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (time_entry_id) REFERENCES time_entries(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (approved_by) REFERENCES employees(id)
);

CREATE TABLE audit_logs (
    id INT PRIMARY KEY IDENTITY(1,1),
    table_name NVARCHAR(50) NOT NULL,
    record_id INT NOT NULL,
    action NVARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    old_values NVARCHAR(MAX),
    new_values NVARCHAR(MAX),
    user_id INT,
    timestamp DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES employees(id)
);

-- Indexes for performance
CREATE INDEX IX_time_entries_employee_date ON time_entries(employee_id, created_at);
CREATE INDEX IX_correction_requests_status ON correction_requests(status);
CREATE INDEX IX_audit_logs_table_record ON audit_logs(table_name, record_id);