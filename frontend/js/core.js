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

