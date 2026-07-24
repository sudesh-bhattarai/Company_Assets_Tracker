const pool = require('../db');

exports.getMaintenanceRecords = async (req, res, next) => {
  try {
    const query = `
      SELECT m.*, a.asset_tag, a.asset_name
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
    issue_description,
    maintenance_date,
    completion_date,
    maintenance_status,
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
      issue_description,
      maintenance_date || new Date().toISOString().slice(0, 10),
      completion_date || null,
      maintenance_status || 'Open',
      cost || 0,
      remarks || null
    ];

    const recordResult = await client.query(insertQuery, values);

    await client.query(
      "UPDATE assets SET status = 'Under Maintenance' WHERE asset_id = $1",
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
  const {
    issue_description,
    maintenance_date,
    completion_date,
    maintenance_status,
    cost,
    remarks
  } = req.body;

  try {
    const query = `
      UPDATE maintenance_records
      SET
        issue_description = $1,
        maintenance_date = $2,
        completion_date = $3,
        maintenance_status = $4,
        cost = $5,
        remarks = $6
      WHERE maintenance_id = $7
      RETURNING *
    `;

    const values = [
      issue_description,
      maintenance_date,
      completion_date || null,
      maintenance_status,
      cost,
      remarks || null,
      req.params.id
    ];

    const result = await pool.query(query, values);

    if (!result.rowCount) {
      return res.status(404).json({ error: 'Maintenance record not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};
