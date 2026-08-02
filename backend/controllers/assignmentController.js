const pool = require('../db');

exports.getAssignments = async (req, res, next) => {
  try {
    const query = `
      SELECT
        aa.assignment_id AS id,
        aa.assignment_id,
        aa.asset_id,
        aa.employee_id,
        aa.assigned_date,
        aa.expected_return_date,
        aa.returned_date AS return_date,
        aa.assignment_status AS status,
        a.asset_tag,
        a.asset_name,
        e.full_name AS employee_name
      FROM asset_assignments aa
      INNER JOIN assets a ON aa.asset_id = a.asset_id
      INNER JOIN employees e ON aa.employee_id = e.employee_id
      ORDER BY aa.assignment_id DESC
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

exports.assignAsset = async (req, res, next) => {
  const { asset_id, employee_id, assigned_date, expected_return_date } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const assetResult = await client.query(
      'SELECT * FROM assets WHERE asset_id = $1 FOR UPDATE',
      [asset_id]
    );

    if (!assetResult.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Asset not found' });
    }

    if (assetResult.rows[0].status !== 'Available') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Asset is not available' });
    }

    const employeeResult = await client.query(
      'SELECT employee_id FROM employees WHERE employee_id = $1',
      [employee_id]
    );

    if (!employeeResult.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Employee not found' });
    }

    const assignmentQuery = `
      INSERT INTO asset_assignments (
        asset_id,
        employee_id,
        assigned_date,
        expected_return_date,
        assignment_status
      )
      VALUES ($1, $2, $3, $4, 'Assigned')
      RETURNING *
    `;

    const assignmentResult = await client.query(assignmentQuery, [
      asset_id,
      employee_id,
      assigned_date || new Date().toISOString().slice(0, 10),
      expected_return_date || null
    ]);

    await client.query(
      "UPDATE assets SET status = 'Assigned' WHERE asset_id = $1",
      [asset_id]
    );

    await client.query('COMMIT');
    res.status(201).json(assignmentResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

exports.returnAsset = async (req, res, next) => {
  const { return_date } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const returnQuery = `
      UPDATE asset_assignments
      SET
        returned_date = $1,
        assignment_status = 'Returned'
      WHERE assignment_id = $2 AND assignment_status = 'Assigned'
      RETURNING *
    `;

    const assignmentResult = await client.query(returnQuery, [
      return_date || new Date().toISOString().slice(0, 10),
      req.params.id
    ]);

    if (!assignmentResult.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Active assignment not found' });
    }

    await client.query(
      "UPDATE assets SET status = 'Available' WHERE asset_id = $1",
      [assignmentResult.rows[0].asset_id]
    );

    await client.query('COMMIT');
    res.json(assignmentResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};
