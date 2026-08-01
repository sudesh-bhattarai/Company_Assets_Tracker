
CREATE TABLE departments (
  department_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  department_name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE users (
  user_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE employees (
  employee_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(30) NOT NULL,
  job_title VARCHAR(100) NOT NULL,
  department_id INTEGER NOT NULL REFERENCES departments(department_id)
);

CREATE TABLE asset_categories (
  category_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE assets (
  asset_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  asset_tag VARCHAR(50) NOT NULL UNIQUE,
  asset_name VARCHAR(150) NOT NULL,
  category_id INTEGER NOT NULL REFERENCES asset_categories(category_id),
  serial_number VARCHAR(100) UNIQUE,
  purchase_date DATE,
  status VARCHAR(30) NOT NULL DEFAULT 'Available'
    CHECK (status IN ('Available', 'Assigned', 'Maintenance', 'Retired')),
  condition_description TEXT NOT NULL
);

CREATE TABLE asset_assignments (
  assignment_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  asset_id INTEGER NOT NULL REFERENCES assets(asset_id),
  employee_id INTEGER NOT NULL REFERENCES employees(employee_id),
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_return_date DATE,
  returned_date DATE,
  assignment_status VARCHAR(20) NOT NULL DEFAULT 'Assigned'
    CHECK (assignment_status IN ('Assigned', 'Returned')),
  CHECK (returned_date IS NULL OR returned_date >= assigned_date)
);

CREATE TABLE maintenance_records (
  maintenance_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  asset_id INTEGER NOT NULL REFERENCES assets(asset_id),
  issue_description TEXT NOT NULL,
  maintenance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completion_date DATE,
  maintenance_status VARCHAR(20) NOT NULL DEFAULT 'Scheduled'
    CHECK (maintenance_status IN ('Scheduled', 'In Progress', 'Completed')),
  cost NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (cost >= 0),
  remarks TEXT,
  CHECK (completion_date IS NULL OR completion_date >= maintenance_date)
);
