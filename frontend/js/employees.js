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


function setupEmployeePage() {
  loadEmployees();
  $('#employeeSearch').oninput = employeeRows;

  $('#addEmployeeBtn').onclick = () => {
    $('#employeeForm').reset();
    $('#employeeId').value = '';
    $('#employeeModalTitle').textContent = 'Add employee';
  };

  handleFormSubmit($('#employeeForm'), async () => {
    const id = $('#employeeId').value;
    const data = formValues([
      ['full_name', '#employeeName'],
      ['email', '#employeeEmail'],
      ['phone', '#employeePhone'],
      ['job_title', '#employeeTitle'],
      ['department', '#employeeDepartment']
    ]);

    try {
      await api(`/employees${id ? `/${id}` : ''}`, {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(data)
      });
      hideModal('#employeeModal');
      notify(`Employee ${id ? 'updated' : 'added'}.`);
      loadEmployees();
    } catch (error) {
      notify(error.message, 'danger');
    }
  });
}

