const pool = require('../db');

const sendAssetNotFound = (res) => {
  return res.status(404).json({ error: 'Asset not found' });
};

const getCategoryId = async (category) => {
  const result = await pool.query(
    `INSERT INTO asset_categories (category_name)
     VALUES ($1)
     ON CONFLICT (category_name)
     DO UPDATE SET category_name = EXCLUDED.category_name
     RETURNING category_id`,
    [category]
  );

  return result.rows[0].category_id;
};

const createMaintenanceRecordIfNeeded = async (assetId) => {
  const activeRecord = await pool.query(
    `SELECT maintenance_id
     FROM maintenance_records
     WHERE asset_id = $1
       AND maintenance_status IN ('Scheduled', 'In Progress')`,
    [assetId]
  );

  if (!activeRecord.rowCount) {
    await pool.query(
      `INSERT INTO maintenance_records (
        asset_id,
        issue_description,
        maintenance_status
      )
      VALUES ($1, $2, 'Scheduled')`,
      [assetId, 'Asset marked for maintenance from the Assets page']
    );
  }
};

exports.getAssets = async (req, res, next) => {
  try {
    const query = `
      SELECT
        a.*,
        c.category_name AS category,
        a.condition_description AS condition,
        e.full_name AS assigned_employee
      FROM assets a
      INNER JOIN asset_categories c ON a.category_id = c.category_id
      LEFT JOIN asset_assignments aa
        ON a.asset_id = aa.asset_id AND aa.assignment_status = 'Assigned'
      LEFT JOIN employees e ON aa.employee_id = e.employee_id
      ORDER BY a.asset_id
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

exports.getAssetById = async (req, res, next) => {
  try {
    const query = `
      SELECT
        a.*,
        c.category_name AS category,
        a.condition_description AS condition,
        e.full_name AS assigned_employee
      FROM assets a
      INNER JOIN asset_categories c ON a.category_id = c.category_id
      LEFT JOIN asset_assignments aa
        ON a.asset_id = aa.asset_id AND aa.assignment_status = 'Assigned'
      LEFT JOIN employees e ON aa.employee_id = e.employee_id
      WHERE a.asset_id = $1
    `;

    const result = await pool.query(query, [req.params.id]);

    if (!result.rowCount) {
      return sendAssetNotFound(res);
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.createAsset = async (req, res, next) => {
  const {
    asset_tag,
    asset_name,
    category,
    serial_number,
    purchase_date,
    status,
    condition
  } = req.body;

  try {
    if (status === 'Assigned') {
      return res.status(400).json({
        error: 'Use the Assignments page to assign an asset to an employee'
      });
    }

    const categoryId = await getCategoryId(category);
    const query = `
      INSERT INTO assets (
        asset_tag,
        asset_name,
        category_id,
        serial_number,
        purchase_date,
        status,
        condition_description
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await pool.query(query, [
      asset_tag,
      asset_name,
      categoryId,
      serial_number,
      purchase_date,
      status,
      condition
    ]);

    if (status === 'Maintenance') {
      await createMaintenanceRecordIfNeeded(result.rows[0].asset_id);
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.updateAsset = async (req, res, next) => {
  const {
    asset_tag,
    asset_name,
    category,
    serial_number,
    purchase_date,
    status,
    condition
  } = req.body;

  try {
    if (status === 'Assigned') {
      const activeAssignment = await pool.query(
        `SELECT assignment_id
         FROM asset_assignments
         WHERE asset_id = $1 AND assignment_status = 'Assigned'`,
        [req.params.id]
      );

      if (!activeAssignment.rowCount) {
        return res.status(400).json({
          error: 'Use the Assignments page to assign an asset to an employee'
        });
      }
    }

    const categoryId = await getCategoryId(category);
    const query = `
      UPDATE assets
      SET
        asset_tag = $1,
        asset_name = $2,
        category_id = $3,
        serial_number = $4,
        purchase_date = $5,
        status = $6,
        condition_description = $7
      WHERE asset_id = $8
      RETURNING *
    `;

    const result = await pool.query(query, [
      asset_tag,
      asset_name,
      categoryId,
      serial_number,
      purchase_date,
      status,
      condition,
      req.params.id
    ]);

    if (!result.rowCount) {
      return sendAssetNotFound(res);
    }

    if (status === 'Maintenance') {
      await createMaintenanceRecordIfNeeded(result.rows[0].asset_id);
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.deleteAsset = async (req, res, next) => {
  try {
    const result = await pool.query(
      'DELETE FROM assets WHERE asset_id = $1 RETURNING *',
      [req.params.id]
    );

    if (!result.rowCount) {
      return sendAssetNotFound(res);
    }

    res.json({ message: 'Asset deleted' });
  } catch (error) {
    next(error);
  }
};

exports.getDashboardSummary = async (req, res, next) => {
  try {
    const [assetsResult, employeesResult, maintenanceResult] = await Promise.all([
      pool.query('SELECT status, COUNT(*)::int AS count FROM assets GROUP BY status'),
      pool.query('SELECT COUNT(*)::int AS count FROM employees'),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM maintenance_records
        WHERE maintenance_status <> 'Completed'
      `)
    ]);

    res.json({
      assets_by_status: assetsResult.rows,
      total_employees: employeesResult.rows[0].count,
      open_maintenance: maintenanceResult.rows[0].count
    });
  } catch (error) {
    next(error);
  }
};
