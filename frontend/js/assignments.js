function formValues(fields) {
  return Object.fromEntries(
    fields.map(([key, selector]) => [key, $(selector).value.trim()])
  );
}

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


function handleFormSubmit(form, callback) {
  form.onsubmit = async (event) => {
    event.preventDefault();

    if (!event.target.checkValidity()) {
      event.target.reportValidity();
      return;
    }

    await callback();
  };
}


function setupAssignmentPage() {
  loadAssignments();
  loadAssignmentChoices();
  $('#assignmentDate').value = new Date().toISOString().slice(0, 10);

  handleFormSubmit($('#assignmentForm'), async () => {
    const data = formValues([
      ['employee_id', '#assignmentEmployee'],
      ['asset_id', '#assignmentAsset'],
      ['assigned_date', '#assignmentDate'],
      ['expected_return_date', '#expectedReturnDate']
    ]);

    try {
      await api('/assignments', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      hideModal('#assignmentModal');
      notify('Asset assigned.');
      loadAssignments();
      loadAssignmentChoices();
    } catch (error) {
      notify(error.message, 'danger');
    }
  });
}

