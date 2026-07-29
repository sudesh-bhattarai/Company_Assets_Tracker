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

exports.getAssets = async (req, res, next) => {
  try {
    const query = `
      SELECT a.*, c.category_name AS category, a.condition_description AS condition
      FROM assets a
      INNER JOIN asset_categories c ON a.category_id = c.category_id
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
      SELECT a.*, c.category_name AS category, a.condition_description AS condition
      FROM assets a
      INNER JOIN asset_categories c ON a.category_id = c.category_id
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
