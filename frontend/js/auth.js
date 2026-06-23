const showAuthMessage = (selector, message, isError = true) => {
  if (typeof showToast === 'function') {
    showToast(message, isError ? 'danger' : 'success');
  }
  const el = document.querySelector(selector);
  if (!el) return;
  el.textContent = message;
  el.className = isError ? 'alert alert-danger mt-3' : 'alert alert-success mt-3';
};

const normalizeRole = (role) => role ? String(role).trim().toLowerCase() : '';

function getEmailValidationMessage(email) {
  if (!email || !String(email).trim()) {
    return 'Please enter your email address.';
  }
  const value = String(email).trim();
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!pattern.test(value)) {
    return 'Enter a valid email address like user@example.com.';
  }
  const localPart = value.split('@')[0].toLowerCase();
  const genericPrefixes = ['test', 'demo', 'example', 'abc', 'user', 'admin', 'info', 'mail'];
  if (genericPrefixes.some(prefix => localPart === prefix || localPart.startsWith(prefix + '.') || localPart.startsWith(prefix + '_'))) {
    return 'Please use a real email address instead of a generic test/example address.';
  }
  return '';
}

function getPasswordValidationMessage(password) {
  if (!password) {
    return 'Password is required.';
  }
  if (password.length < 8) {
    return 'Password should be at least 8 characters long.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password should include at least one uppercase letter.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password should include at least one lowercase letter.';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password should include at least one number.';
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password should include at least one special character like !@#$%^&*.';
  }
  return '';
}

function validateAuthInput(type, email, password) {
  const emailMessage = getEmailValidationMessage(email);
  if (emailMessage) {
    return { valid: false, message: emailMessage };
  }
  if (!password) {
    return { valid: false, message: 'Password is required.' };
  }
  if (type === 'register') {
    const passwordMessage = getPasswordValidationMessage(password);
    if (passwordMessage) {
      return { valid: false, message: passwordMessage };
    }
  }
  return { valid: true };
}

const parseApiError = async (response) => {
  let errorText = 'Server error';
  try {
    const data = await response.json();
    errorText = data.message || data.error || errorText;
  } catch (err) {
    errorText = response.statusText || errorText;
  }
  return errorText;
};

const handleFormSubmit = async (event, url, data, successCallback, messageSelector) => {
  event.preventDefault();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const errorMessage = await parseApiError(res);
      showAuthMessage(messageSelector, errorMessage, true);
      return;
    }
    const result = await res.json();
    localStorage.setItem('token', result.token);
    if (result.user) {
      if (typeof setStoredUser === 'function') setStoredUser(result.user);
      else localStorage.setItem('user', JSON.stringify(result.user));
    }
    successCallback(result);
  } catch (err) {
    showAuthMessage(messageSelector, err.message || 'Network error', true);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (typeof showPendingAuthMessage === 'function') showPendingAuthMessage('#loginMessage');
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const validation = validateAuthInput('register', email, password);
      if (!validation.valid) {
        showAuthMessage('#registerMessage', validation.message, true);
        return;
      }
      await handleFormSubmit(e, '/api/auth/register', {
        name: document.getElementById('name').value,
        email: email,
        password: password,
        role: document.getElementById('role').value
      }, () => {
        showAuthMessage('#registerMessage', 'Registration successful! Redirecting...', false);
        setTimeout(() => window.location.href = '/', 1200);
      }, '#registerMessage');
    });
  }

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const validation = validateAuthInput('login', email, password);
      if (!validation.valid) {
        showAuthMessage('#loginMessage', validation.message, true);
        return;
      }
      await handleFormSubmit(e, '/api/auth/login', {
        email: document.getElementById('email').value,
        password: document.getElementById('password').value
      }, (result) => {
        showAuthMessage('#loginMessage', 'Login successful! Redirecting...', false);
        setTimeout(() => {
            const role = (result.user && result.user.role) ? String(result.user.role).trim().toLowerCase() : '';
            const redirectPath = (typeof dashboardHrefForRole === 'function')
              ? dashboardHrefForRole(role)
              : (role === 'provider' ? '/provider-dashboard.html' : role === 'admin' ? '/admin-dashboard.html' : '/customer-dashboard.html');
            window.location.href = redirectPath;
          }, 900);
      }, '#loginMessage');
    });
  }
});

function logout(){ localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/'; }
