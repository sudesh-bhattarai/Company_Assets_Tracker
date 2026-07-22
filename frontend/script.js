/* Update this value when the Express API runs on a different port. */
const API_BASE_URL = 'http://localhost:5000/api';

let employees = [];
let assets = [];
let assignments = [];
let maintenanceRecords = [];

const $ = (selector) => document.querySelector(selector);

function getId(item) {
  return item.id ?? item.employee_id ?? item.asset_id ?? item.assignment_id ?? item.maintenance_id;
}

function valueFrom(item, ...keys) {
  return keys.map((key) => item?.[key]).find((value) => value != null) ?? '';
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[character]);
}

function toList(data) {
  return Array.isArray(data) ? data : data?.items || data?.rows || [];
}

function displayDate(value) {
  return value ? new Date(value).toLocaleDateString() : '—';
}

function dateInputValue(value) {
  return value ? String(value).slice(0, 10) : '';
}

function statusBadge(status) {
  const success = /available|completed|good/i.test(status);
  const warning = /assigned|progress|scheduled/i.test(status);
  const color = success ? 'success' : warning ? 'warning' : 'secondary';

  return `<span class="badge text-bg-${color} badge-status">${escapeHtml(status || '—')}</span>`;
}

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Request failed (${response.status})`);
  }
  return data?.data ?? data;
}

function notify(message, type = 'success') {
  const messageArea = $('#pageMessage') || $('#loginMessage');
  if (!messageArea) return;

  messageArea.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${escapeHtml(message)}
      <button class="btn-close" data-bs-dismiss="alert"></button>
    </div>`;
}

function showLoading(selector, columns) {
  $(selector).innerHTML = `
    <tr><td colspan="${columns}" class="text-center text-secondary p-4">
      <span class="spinner-border spinner-border-sm me-2"></span>Loading…
    </td></tr>`;
}

function showModal(selector) {
  bootstrap.Modal.getOrCreateInstance($(selector)).show();
}

function hideModal(selector) {
  bootstrap.Modal.getOrCreateInstance($(selector)).hide();
}

function navigation() {
  const page = document.body.dataset.page;
  if (!page) return;

  const pages = [
    ['dashboard', 'Dashboard'], ['employees', 'Employees'], ['assets', 'Assets'],
    ['assignments', 'Assignments'], ['maintenance', 'Maintenance']
  ];
  $('#appNav').innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark">
      <div class="container">
        <a class="navbar-brand" href="dashboard.html">Asset Tracker</a>
        <button class="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#navLinks">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navLinks">
          <ul class="navbar-nav me-auto">
            ${pages.map(([key, name]) => `<li class="nav-item"><a class="nav-link ${page === key ? 'active' : ''}" href="${key}.html">${name}</a></li>`).join('')}
          </ul>
          <a class="btn btn-outline-light btn-sm" href="index.html">Sign out</a>
        </div>
      </div>
    </nav>`;
}

function employeeRows() {
  const query = $('#employeeSearch').value.toLowerCase();
  const filtered = employees.filter((employee) => [
    valueFrom(employee, 'full_name', 'name'), valueFrom(employee, 'email'),
    valueFrom(employee, 'phone'), valueFrom(employee, 'job_title', 'title'),
    valueFrom(employee, 'department')
  ].join(' ').toLowerCase().includes(query));

  $('#employeeTable').innerHTML = filtered.map((employee) => `
    <tr>
      <td><strong>${escapeHtml(valueFrom(employee, 'full_name', 'name'))}</strong></td>
      <td>${escapeHtml(valueFrom(employee, 'email'))}<br><small class="text-secondary">${escapeHtml(valueFrom(employee, 'phone'))}</small></td>
      <td>${escapeHtml(valueFrom(employee, 'job_title', 'title'))}</td>
      <td>${escapeHtml(valueFrom(employee, 'department'))}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-primary" onclick="editEmployee('${getId(employee)}')">Edit</button>
        <button class="btn btn-sm btn-outline-danger ms-1" onclick="deleteEmployee('${getId(employee)}')">Delete</button>
      </td>
    </tr>`).join('') || '<tr><td colspan="5" class="text-center text-secondary p-4">No employees found.</td></tr>';
}

async function loadEmployees() {
  showLoading('#employeeTable', 5);
  try {
    employees = toList(await api('/employees'));
    employeeRows();
  } catch (error) {
    $('#employeeTable').innerHTML = `<tr><td colspan="5" class="text-center text-danger p-4">${escapeHtml(error.message)}</td></tr>`;
  }
}

window.editEmployee = (id) => {
  const employee = employees.find((item) => String(getId(item)) === String(id));
  if (!employee) return;
  $('#employeeModalTitle').textContent = 'Edit employee';
  $('#employeeId').value = getId(employee);
  $('#employeeName').value = valueFrom(employee, 'full_name', 'name');
  $('#employeeEmail').value = valueFrom(employee, 'email');
  $('#employeePhone').value = valueFrom(employee, 'phone');
  $('#employeeTitle').value = valueFrom(employee, 'job_title', 'title');
  $('#employeeDepartment').value = valueFrom(employee, 'department');
  showModal('#employeeModal');
};

window.deleteEmployee = async (id) => {
  if (!confirm('Delete this employee?')) return;
  try {
    await api(`/employees/${id}`, { method: 'DELETE' });
    notify('Employee deleted.');
    loadEmployees();
  } catch (error) { notify(error.message, 'danger'); }
};

function assetRows() {
  const query = $('#assetSearch').value.toLowerCase();
  const filtered = assets.filter((asset) => [valueFrom(asset, 'asset_tag', 'tag'), valueFrom(asset, 'asset_name', 'name'), valueFrom(asset, 'category'), valueFrom(asset, 'serial_number')].join(' ').toLowerCase().includes(query));
  $('#assetTable').innerHTML = filtered.map((asset) => `
    <tr><td><strong>${escapeHtml(valueFrom(asset, 'asset_tag', 'tag'))}</strong><div class="small text-secondary">${escapeHtml(valueFrom(asset, 'asset_name', 'name'))}</div></td>
    <td>${escapeHtml(valueFrom(asset, 'category'))}</td><td>${escapeHtml(valueFrom(asset, 'serial_number'))}</td><td>${statusBadge(valueFrom(asset, 'status'))}</td><td>${escapeHtml(valueFrom(asset, 'condition'))}</td>
    <td class="text-end"><button class="btn btn-sm btn-outline-primary" onclick="editAsset('${getId(asset)}')">Edit</button><button class="btn btn-sm btn-outline-danger ms-1" onclick="deleteAsset('${getId(asset)}')">Delete</button></td></tr>`).join('') || '<tr><td colspan="6" class="text-center text-secondary p-4">No assets found.</td></tr>';
}

async function loadAssets() {
  showLoading('#assetTable', 6);
  try { assets = toList(await api('/assets')); assetRows(); }
  catch (error) { $('#assetTable').innerHTML = `<tr><td colspan="6" class="text-center text-danger p-4">${escapeHtml(error.message)}</td></tr>`; }
}

window.editAsset = (id) => {
  const asset = assets.find((item) => String(getId(item)) === String(id));
  if (!asset) return;
  $('#assetModalTitle').textContent = 'Edit asset';
  $('#assetId').value = getId(asset);
  $('#assetTag').value = valueFrom(asset, 'asset_tag', 'tag'); $('#assetName').value = valueFrom(asset, 'asset_name', 'name');
  $('#assetCategory').value = valueFrom(asset, 'category'); $('#assetSerial').value = valueFrom(asset, 'serial_number');
  $('#assetPurchaseDate').value = dateInputValue(valueFrom(asset, 'purchase_date')); $('#assetStatus').value = valueFrom(asset, 'status') || 'Available'; $('#assetCondition').value = valueFrom(asset, 'condition') || 'Good';
  showModal('#assetModal');
};

window.deleteAsset = async (id) => {
  if (!confirm('Delete this asset?')) return;
  try { await api(`/assets/${id}`, { method: 'DELETE' }); notify('Asset deleted.'); loadAssets(); }
  catch (error) { notify(error.message, 'danger'); }
};

async function loadDashboard() {
  try {
    const results = await Promise.all([api('/assets'), api('/employees'), api('/assignments'), api('/maintenance')]);
    [assets, employees, assignments, maintenanceRecords] = results.map(toList);
    const count = (status) => assets.filter((asset) => valueFrom(asset, 'status').toLowerCase() === status).length;
    $('#totalAssets').textContent = assets.length; $('#availableAssets').textContent = count('available'); $('#assignedAssets').textContent = count('assigned'); $('#maintenanceAssets').textContent = count('maintenance'); $('#totalEmployees').textContent = employees.length;
    $('#recentAssets').innerHTML = assets.slice(0, 5).map((asset) => `<tr><td>${escapeHtml(valueFrom(asset, 'asset_tag', 'tag'))}</td><td>${escapeHtml(valueFrom(asset, 'asset_name', 'name'))}</td><td>${escapeHtml(valueFrom(asset, 'category'))}</td><td>${statusBadge(valueFrom(asset, 'status'))}</td></tr>`).join('') || '<tr><td colspan="4" class="text-center text-secondary">No assets found.</td></tr>';
    $('#recentAssignments').innerHTML = assignments.slice(0, 5).map((item) => `<tr><td>${escapeHtml(valueFrom(item, 'asset_name', 'asset_tag', 'asset'))}</td><td>${escapeHtml(valueFrom(item, 'employee_name', 'employee'))}</td><td>${displayDate(valueFrom(item, 'assigned_date', 'assignment_date'))}</td></tr>`).join('') || '<tr><td colspan="3" class="text-center text-secondary">No assignments found.</td></tr>';
  } catch (error) { notify(`Could not load dashboard: ${error.message}`, 'danger'); }
}

function formValues(fields) { return Object.fromEntries(fields.map(([key, selector]) => [key, $(selector).value.trim()])); }

async function loadAssignmentChoices() {
  try {
    const [employeeData, assetData] = await Promise.all([api('/employees'), api('/assets')]);
    employees = toList(employeeData); assets = toList(assetData);
    $('#assignmentEmployee').innerHTML = '<option value="">Choose employee</option>' + employees.map((employee) => `<option value="${getId(employee)}">${escapeHtml(valueFrom(employee, 'full_name', 'name'))}</option>`).join('');
    $('#assignmentAsset').innerHTML = '<option value="">Choose available asset</option>' + assets.filter((asset) => valueFrom(asset, 'status').toLowerCase() === 'available').map((asset) => `<option value="${getId(asset)}">${escapeHtml(valueFrom(asset, 'asset_tag', 'tag'))} — ${escapeHtml(valueFrom(asset, 'asset_name', 'name'))}</option>`).join('');
  } catch (error) { notify(error.message, 'danger'); }
}

async function loadAssignments() {
  showLoading('#assignmentTable', 6);
  try {
    assignments = toList(await api('/assignments'));
    $('#assignmentTable').innerHTML = assignments.map((item) => {
      const returned = valueFrom(item, 'return_date', 'returned_at');
      return `<tr><td>${escapeHtml(valueFrom(item, 'asset_name', 'asset_tag', 'asset'))}</td><td>${escapeHtml(valueFrom(item, 'employee_name', 'employee'))}</td><td>${displayDate(valueFrom(item, 'assigned_date', 'assignment_date'))}</td><td>${displayDate(valueFrom(item, 'expected_return_date'))}</td><td>${statusBadge(returned ? 'Returned' : valueFrom(item, 'status') || 'Assigned')}</td><td class="text-end">${returned ? '—' : `<button class="btn btn-sm btn-outline-success" onclick="returnAsset('${getId(item)}')">Return</button>`}</td></tr>`;
    }).join('') || '<tr><td colspan="6" class="text-center text-secondary p-4">No assignment history found.</td></tr>';
  } catch (error) { $('#assignmentTable').innerHTML = `<tr><td colspan="6" class="text-center text-danger p-4">${escapeHtml(error.message)}</td></tr>`; }
}

window.returnAsset = async (id) => {
  if (!confirm('Mark this asset as returned?')) return;
  try {
    await api(`/assignments/${id}/return`, { method: 'PUT', body: JSON.stringify({ return_date: new Date().toISOString().slice(0, 10) }) });
    notify('Asset marked as returned.'); loadAssignments(); loadAssignmentChoices();
  } catch (error) { notify(error.message, 'danger'); }
};

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

document.addEventListener('DOMContentLoaded', () => {
  navigation();
  const page = document.body.dataset.page;
  if (!page) { $('#loginForm').onsubmit = (event) => { event.preventDefault(); if (event.target.checkValidity()) window.location.href = 'dashboard.html'; else event.target.reportValidity(); }; return; }
  if (page === 'dashboard') { loadDashboard(); $('#refreshDashboard').onclick = loadDashboard; }
  if (page === 'employees') {
    loadEmployees(); $('#employeeSearch').oninput = employeeRows;
    $('#addEmployeeBtn').onclick = () => { $('#employeeForm').reset(); $('#employeeId').value = ''; $('#employeeModalTitle').textContent = 'Add employee'; };
    $('#employeeForm').onsubmit = async (event) => { event.preventDefault(); if (!event.target.checkValidity()) return event.target.reportValidity(); const id = $('#employeeId').value; const data = formValues([['full_name','#employeeName'],['email','#employeeEmail'],['phone','#employeePhone'],['job_title','#employeeTitle'],['department','#employeeDepartment']]); try { await api(`/employees${id ? `/${id}` : ''}`, { method: id ? 'PUT' : 'POST', body: JSON.stringify(data) }); hideModal('#employeeModal'); notify(`Employee ${id ? 'updated' : 'added'}.`); loadEmployees(); } catch (error) { notify(error.message, 'danger'); } };
  }
  if (page === 'assets') {
    loadAssets(); $('#assetSearch').oninput = assetRows;
    $('#addAssetBtn').onclick = () => { $('#assetForm').reset(); $('#assetId').value = ''; $('#assetModalTitle').textContent = 'Add asset'; };
    $('#assetForm').onsubmit = async (event) => { event.preventDefault(); if (!event.target.checkValidity()) return event.target.reportValidity(); const id = $('#assetId').value; const data = formValues([['asset_tag','#assetTag'],['asset_name','#assetName'],['category','#assetCategory'],['serial_number','#assetSerial'],['purchase_date','#assetPurchaseDate'],['status','#assetStatus'],['condition','#assetCondition']]); try { await api(`/assets${id ? `/${id}` : ''}`, { method: id ? 'PUT' : 'POST', body: JSON.stringify(data) }); hideModal('#assetModal'); notify(`Asset ${id ? 'updated' : 'added'}.`); loadAssets(); } catch (error) { notify(error.message, 'danger'); } };
  }
  if (page === 'assignments') {
    loadAssignments(); loadAssignmentChoices();
    $('#assignmentDate').value = new Date().toISOString().slice(0, 10);
    $('#assignmentForm').onsubmit = async (event) => {
      event.preventDefault(); if (!event.target.checkValidity()) return event.target.reportValidity();
      const data = formValues([['employee_id','#assignmentEmployee'],['asset_id','#assignmentAsset'],['assigned_date','#assignmentDate'],['expected_return_date','#expectedReturnDate']]);
      try { await api('/assignments', { method: 'POST', body: JSON.stringify(data) }); hideModal('#assignmentModal'); notify('Asset assigned.'); loadAssignments(); loadAssignmentChoices(); }
      catch (error) { notify(error.message, 'danger'); }
    };
  }
  if (page === 'maintenance') {
    loadMaintenance(); loadMaintenanceChoices();
    $('#maintenanceDate').value = new Date().toISOString().slice(0, 10);
    $('#maintenanceForm').onsubmit = async (event) => {
      event.preventDefault(); if (!event.target.checkValidity()) return event.target.reportValidity();
      const data = formValues([['asset_id','#maintenanceAsset'],['description','#maintenanceDescription'],['scheduled_date','#maintenanceDate'],['status','#maintenanceStatus']]);
      try { await api('/maintenance', { method: 'POST', body: JSON.stringify(data) }); hideModal('#maintenanceModal'); notify('Maintenance record added.'); loadMaintenance(); }
      catch (error) { notify(error.message, 'danger'); }
    };
  }
});
