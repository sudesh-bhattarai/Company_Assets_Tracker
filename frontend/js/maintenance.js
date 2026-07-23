async function loadMaintenance() {
  showLoading('#maintenanceTable', 6);
  try {
    maintenanceRecords = toList(await api('/maintenance'));
    $('#maintenanceTable').innerHTML = maintenanceRecords.map((record) => `<tr><td>${escapeHtml(valueFrom(record, 'asset_name', 'asset_tag', 'asset'))}</td><td>${escapeHtml(valueFrom(record, 'description', 'issue', 'notes'))}</td><td>${displayDate(valueFrom(record, 'scheduled_date', 'maintenance_date'))}</td><td>${displayDate(valueFrom(record, 'completed_date'))}</td><td>${statusBadge(valueFrom(record, 'status'))}</td><td class="text-end"><button class="btn btn-sm btn-outline-primary" onclick="updateMaintenance('${getId(record)}')">Update</button></td></tr>`).join('') || '<tr><td colspan="6" class="text-center text-secondary p-4">No maintenance records found.</td></tr>';
  } catch (error) { $('#maintenanceTable').innerHTML = `<tr><td colspan="6" class="text-center text-danger p-4">${escapeHtml(error.message)}</td></tr>`; }
}

async function loadMaintenanceChoices() {
  try {
    assets = toList(await api('/assets'));
    $('#maintenanceAsset').innerHTML = '<option value="">Choose asset</option>' + assets.map((asset) => `<option value="${getId(asset)}">${escapeHtml(valueFrom(asset, 'asset_tag', 'tag'))} — ${escapeHtml(valueFrom(asset, 'asset_name', 'name'))}</option>`).join('');
  } catch (error) { notify(error.message, 'danger'); }
}

window.updateMaintenance = async (id) => {
  const status = prompt('New status: Scheduled, In Progress, or Completed');
  if (!status) return;
  try { await api(`/maintenance/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }); notify('Maintenance status updated.'); loadMaintenance(); }
  catch (error) { notify(error.message, 'danger'); }
};


function setupMaintenancePage() {
  loadMaintenance();
  loadMaintenanceChoices();
  $('#maintenanceDate').value = new Date().toISOString().slice(0, 10);

  handleFormSubmit($('#maintenanceForm'), async () => {
    const data = formValues([
      ['asset_id', '#maintenanceAsset'],
      ['description', '#maintenanceDescription'],
      ['scheduled_date', '#maintenanceDate'],
      ['status', '#maintenanceStatus']
    ]);

    try {
      await api('/maintenance', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      hideModal('#maintenanceModal');
      notify('Maintenance record added.');
      loadMaintenance();
    } catch (error) {
      notify(error.message, 'danger');
    }
  });
}

