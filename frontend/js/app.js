function setupLoginPage() {
  $('#loginForm').onsubmit = (event) => {
    event.preventDefault();

    if (event.target.checkValidity()) {
      window.location.href = 'dashboard.html';
      return;
    }

    event.target.reportValidity();
  };
}


document.addEventListener('DOMContentLoaded', () => {
  navigation();

  const page = document.body.dataset.page;
  if (!page) {
    setupLoginPage();
    return;
  }

  if (page === 'dashboard') {
    loadDashboard();
    $('#refreshDashboard').onclick = loadDashboard;
  }

  if (page === 'employees') {
    setupEmployeePage();
  }

  if (page === 'assets') {
    setupAssetPage();
  }

  if (page === 'assignments') {
    setupAssignmentPage();
  }

  if (page === 'maintenance') {
    setupMaintenancePage();
  }
});
