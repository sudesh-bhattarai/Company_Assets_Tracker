function showAuthForm(formName) {
  const loginForm = $('#loginForm');
  const signupForm = $('#signupForm');

  loginForm.classList.toggle('d-none', formName !== 'login');
  signupForm.classList.toggle('d-none', formName !== 'signup');
  $('#showLogin').classList.toggle('btn-primary', formName === 'login');
  $('#showLogin').classList.toggle('btn-outline-primary', formName !== 'login');
  $('#showSignup').classList.toggle('btn-primary', formName === 'signup');
  $('#showSignup').classList.toggle('btn-outline-primary', formName !== 'signup');
}

function saveLoggedInUser(user) {
  sessionStorage.setItem('assetTrackerUser', JSON.stringify(user));
}

function setupLoginPage() {
  $('#showLogin').onclick = () => showAuthForm('login');
  $('#showSignup').onclick = () => showAuthForm('signup');

  $('#tryDemo').onclick = async () => {
    showAuthForm('login');
    $('#loginEmail').value = 'demo@companyassettracker.com';
    $('#loginPassword').value = 'Demo@123';

    try {
      const result = await api('/auth/demo', { method: 'POST' });
      saveLoggedInUser(result.user);
      window.location.href = 'dashboard.html';
    } catch (error) {
      notify(error.message, 'danger');
    }
  };

  $('#loginForm').onsubmit = async (event) => {
    event.preventDefault();

    if (!event.target.checkValidity()) {
      event.target.reportValidity();
      return;
    }

    try {
      const result = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: $('#loginEmail').value.trim(),
          password: $('#loginPassword').value
        })
      });

      saveLoggedInUser(result.user);
      window.location.href = 'dashboard.html';
    } catch (error) {
      notify(error.message, 'danger');
    }
  };

  $('#signupForm').onsubmit = async (event) => {
    event.preventDefault();

    if (!event.target.checkValidity()) {
      event.target.reportValidity();
      return;
    }

    const password = $('#signupPassword').value;
    const confirmPassword = $('#signupConfirmPassword').value;

    if (password !== confirmPassword) {
      notify('Passwords do not match.', 'danger');
      return;
    }

    try {
      await api('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email: $('#signupEmail').value.trim(),
          password
        })
      });

      notify('Account created. You can now log in.');
      $('#loginEmail').value = $('#signupEmail').value.trim();
      $('#loginPassword').value = '';
      event.target.reset();
      showAuthForm('login');
    } catch (error) {
      notify(error.message, 'danger');
    }
  };
}

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;

  if (!page) {
    setupLoginPage();
    return;
  }

  if (!sessionStorage.getItem('assetTrackerUser')) {
    window.location.href = 'index.html';
    return;
  }

  navigation();

  if (page === 'dashboard') {
    loadDashboard();
    $('#refreshDashboard').onclick = loadDashboard;
  }

  if (page === 'employees') setupEmployeePage();
  if (page === 'assets') setupAssetPage();
  if (page === 'assignments') setupAssignmentPage();
  if (page === 'maintenance') setupMaintenancePage();
});
