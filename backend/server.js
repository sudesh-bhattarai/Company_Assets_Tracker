const express = require('express');
const employeeRoutes = require('./routes/employeeRoutes');
const assetRoutes = require('./routes/assetRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const assetController = require('./controllers/assetController');

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use('/api/employees', employeeRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.get('/api/dashboard/summary', assetController.getDashboardSummary);

app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
