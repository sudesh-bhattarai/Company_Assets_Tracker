const pool = require('../db');

exports.getMaintenanceRecords = async (req, res, next) => {
  try {
    const query = `
      SELECT
        m.maintenance_id AS id,
        m.maintenance_id,
        m.asset_id,
        m.issue_description AS description,
        m.maintenance_date AS scheduled_date,
        m.completion_date AS completed_date,
        m.maintenance_status AS status,
        m.cost,
        m.remarks,
        a.asset_tag,
        a.asset_name
      FROM maintenance_records m
      INNER JOIN assets a ON m.asset_id = a.asset_id
      ORDER BY m.maintenance_id DESC
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

exports.createMaintenanceRecord = async (req, res, next) => {
  const {
    asset_id,
    description,
    scheduled_date,
    status,
    cost,
    remarks
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const assetResult = await client.query(
      'SELECT asset_id FROM assets WHERE asset_id = $1 FOR UPDATE',
      [asset_id]
    );

    if (!assetResult.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Asset not found' });
    }

    const insertQuery = `
      INSERT INTO maintenance_records (
        asset_id,
        issue_description,
        maintenance_date,
        completion_date,
        maintenance_status,
        cost,
        remarks
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      asset_id,
      description,
      scheduled_date || new Date().toISOString().slice(0, 10),
      null,
      status || 'Scheduled',
      cost || 0,
      remarks || null
    ];

    const recordResult = await client.query(insertQuery, values);

    await client.query(
      "UPDATE assets SET status = 'Maintenance' WHERE asset_id = $1",
      [asset_id]
    );

    await client.query('COMMIT');
    res.status(201).json(recordResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

exports.updateMaintenanceRecord = async (req, res, next) => {
  const { status } = req.body;
  const allowedStatuses = ['Scheduled', 'In Progress', 'Completed'];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Please select a valid maintenance status' });
  }

  try {
    const query = `
      UPDATE maintenance_records
      SET
        maintenance_status = $1::VARCHAR,
        completion_date = CASE
          WHEN $1::VARCHAR = 'Completed' THEN CURRENT_DATE
          ELSE NULL
        END
      WHERE maintenance_id = $2
      RETURNING *
    `;

    const values = [status, req.params.id];

    const result = await pool.query(query, values);

    if (!result.rowCount) {
      return res.status(404).json({ error: 'Maintenance record not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};
