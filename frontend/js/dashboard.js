async function loadDashboard() {
  try {
    const results = await Promise.all([api('/assets'), api('/employees'), api('/assignments'), api('/maintenance')]);
    [assets, employees, assignments, maintenanceRecords] = results.map(toList);
    const count = (status) => assets.filter((asset) => valueFrom(asset, 'status').toLowerCase() === status).length;
    $('#totalAssets').textContent = assets.length;
    $('#availableAssets').textContent = count('available');
    $('#assignedAssets').textContent = count('assigned');
    $('#maintenanceAssets').textContent = count('maintenance');
    $('#totalEmployees').textContent = employees.length;

    const recentAssetRows = assets.slice(0, 5).map((asset) => `
      <tr>
        <td>${escapeHtml(valueFrom(asset, 'asset_tag', 'tag'))}</td>
        <td>${escapeHtml(valueFrom(asset, 'asset_name', 'name'))}</td>
        <td>${escapeHtml(valueFrom(asset, 'category'))}</td>
        <td>${statusBadge(valueFrom(asset, 'status'))}</td>
      </tr>
    `).join('');
    $('#recentAssets').innerHTML = recentAssetRows || `
      <tr><td colspan="4" class="text-center text-secondary">No assets found.</td></tr>
    `;

    const recentAssignmentRows = assignments.slice(0, 5).map((item) => `
      <tr>
        <td>${escapeHtml(valueFrom(item, 'asset_name', 'asset_tag', 'asset'))}</td>
        <td>${escapeHtml(valueFrom(item, 'employee_name', 'employee'))}</td>
        <td>${displayDate(valueFrom(item, 'assigned_date', 'assignment_date'))}</td>
      </tr>
    `).join('');
    $('#recentAssignments').innerHTML = recentAssignmentRows || `
      <tr><td colspan="3" class="text-center text-secondary">No assignments found.</td></tr>
    `;
  } catch (error) { notify(`Could not load dashboard: ${error.message}`, 'danger'); }
}

