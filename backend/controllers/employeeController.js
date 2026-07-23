const pool = require('../db');

const sendEmployeeNotFound = (res) => {
  return res.status(404).json({ error: 'Employee not found' });
};

exports.getEmployees = async (req, res, next) => {
  try {
    const query = `
      SELECT e.*, d.department_name
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
      SELECT e.*, d.department_name
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
  const { full_name, email, phone, job_title, department_id } = req.body;

  try {
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
      department_id
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.updateEmployee = async (req, res, next) => {
  const { full_name, email, phone, job_title, department_id } = req.body;

  try {
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
      department_id,
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
