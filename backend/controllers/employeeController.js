const pool = require('../db');

const sendEmployeeNotFound = (res) => {
  return res.status(404).json({ error: 'Employee not found' });
};

const getDepartmentId = async (department) => {
  const result = await pool.query(
    `INSERT INTO departments (department_name)
     VALUES ($1)
     ON CONFLICT (department_name)
     DO UPDATE SET department_name = EXCLUDED.department_name
     RETURNING department_id`,
    [department]
  );

  return result.rows[0].department_id;
};

exports.getEmployees = async (req, res, next) => {
  try {
    const query = `
      SELECT e.*, d.department_name AS department
      FROM employees e
      INNER JOIN departments d ON e.department_id = d.department_id
      ORDER BY e.employee_id
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

exports.getEmployeeById = async (req, res, next) => {
  try {
    const query = `
      SELECT e.*, d.department_name AS department
      FROM employees e
      INNER JOIN departments d ON e.department_id = d.department_id
      WHERE e.employee_id = $1
    `;

    const result = await pool.query(query, [req.params.id]);

    if (!result.rowCount) {
      return sendEmployeeNotFound(res);
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.createEmployee = async (req, res, next) => {
  const { full_name, email, phone, job_title, department } = req.body;

  try {
    const departmentId = await getDepartmentId(department);
    const query = `
      INSERT INTO employees (full_name, email, phone, job_title, department_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await pool.query(query, [
      full_name,
      email,
      phone,
      job_title,
      departmentId
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.updateEmployee = async (req, res, next) => {
  const { full_name, email, phone, job_title, department } = req.body;

  try {
    const departmentId = await getDepartmentId(department);
    const query = `
      UPDATE employees
      SET
        full_name = $1,
        email = $2,
        phone = $3,
        job_title = $4,
        department_id = $5
      WHERE employee_id = $6
      RETURNING *
    `;

    const result = await pool.query(query, [
      full_name,
      email,
      phone,
      job_title,
      departmentId,
      req.params.id
    ]);

    if (!result.rowCount) {
      return sendEmployeeNotFound(res);
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.deleteEmployee = async (req, res, next) => {
  try {
    const result = await pool.query(
      'DELETE FROM employees WHERE employee_id = $1 RETURNING *',
      [req.params.id]
    );

    if (!result.rowCount) {
      return sendEmployeeNotFound(res);
    }

    res.json({ message: 'Employee deleted' });
  } catch (error) {
    next(error);
  }
};
