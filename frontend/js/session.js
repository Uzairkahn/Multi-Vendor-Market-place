const AUTH_USER_KEY = 'user';

const authState = {
  user: null,
  loaded: false
};

function getToken(){
  return localStorage.getItem('token');
}

function getStoredUser(){
  try {
    return JSON.parse(localStorage.getItem(AUTH_USER_KEY) || 'null');
  } catch {
    return null;
  }
}

function setStoredUser(user){
  // normalize role to lowercase and trim to avoid casing or whitespace mismatches from backend
  if (user && user.role) user.role = String(user.role).trim().toLowerCase();
  authState.user = user;
  authState.loaded = true;
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

function clearSession(){
  authState.user = null;
  authState.loaded = false;
  localStorage.removeItem('token');
  localStorage.removeItem(AUTH_USER_KEY);
}

async function fetchCurrentUser(){
  const token = getToken();
  if (!token) return null;
  const res = await fetch('/api/auth/me', {
    headers: { Authorization: 'Bearer ' + token }
  });
  if (!res.ok) {
    clearSession();
    return null;
  }
  const user = await res.json();
  setStoredUser(user);
  return user;
}

async function getCurrentUser(){
  if (authState.loaded) return authState.user;
  const stored = getStoredUser();
  if (stored && getToken()) {
    // normalize stored role casing and whitespace
    if (stored.role) stored.role = String(stored.role).trim().toLowerCase();
    authState.user = stored;
    authState.loaded = true;
  }
  return await fetchCurrentUser();
}

async function requireAuth(requiredRole = null){
  const user = await getCurrentUser();
  const userRole = user && user.role ? String(user.role).trim().toLowerCase() : null;
  const required = requiredRole ? String(requiredRole).trim().toLowerCase() : null;
  if (!user || (required && userRole !== required)) {
    clearSession();
    window.location.href = '/login.html';
    return null;
  }
  return user;
}

function dashboardHrefForRole(role){
  const r = role ? String(role).trim().toLowerCase() : '';
  if (r === 'provider') return '/provider-dashboard.html';
  if (r === 'admin') return '/admin-dashboard.html';
  return '/customer-dashboard.html';
}

function dashboardLabelForRole(role){
  const r = role ? String(role).trim().toLowerCase() : '';
  if (r === 'provider') return 'Provider Dashboard';
  if (r === 'admin') return 'Admin Dashboard';
  return 'Dashboard';
}

function navLink(href, label, currentPath){
  const hrefPath = href.startsWith('/') ? href : '/' + href;
  const active = currentPath === hrefPath || (currentPath === '/' && hrefPath === '/index.html');
  return `<li class="nav-item"><a class="nav-link${active ? ' active fw-semibold' : ''}" href="${href}">${label}</a></li>`;
}

async function renderNavbar(){
  const nav = document.getElementById('mainNavLinks');
  if (!nav) return;
  const currentPath = window.location.pathname === '/' ? '/index.html' : window.location.pathname;
  const user = getToken() ? await getCurrentUser() : null;
  if (!user) {
    nav.innerHTML = [
      navLink('/index.html', 'Home', currentPath),
      navLink('/services.html', 'Services', currentPath),
      navLink('/login.html', 'Login', currentPath),
      `<li class="nav-item"><a class="btn btn-primary ms-lg-3" href="/register.html">Register</a></li>`
    ].join('');
    return;
  }
  nav.innerHTML = [
    `<li class="nav-item"><span class="nav-link text-muted">Welcome, ${escapeSessionHtml(user.name)}</span></li>`,
    navLink('/index.html', 'Home', currentPath),
    navLink('/services.html', 'Services', currentPath),
    navLink(dashboardHrefForRole(user.role), dashboardLabelForRole(user.role), currentPath),
    `<li class="nav-item"><button class="btn btn-outline-secondary ms-lg-3" type="button" onclick="logout()">Logout</button></li>`
  ].join('');
}

function logout(){
  clearSession();
  window.location.href = '/';
}

function redirectWithMessage(message, target = '/login.html'){
  sessionStorage.setItem('authMessage', message);
  window.location.href = target;
}

function showToast(message, variant = 'primary', delay = 4500){
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-bg-${variant} border-0 mb-3`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  toast.setAttribute('aria-atomic', 'true');
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${escapeSessionHtml(message)}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" aria-label="Close"></button>
    </div>`;
  container.appendChild(toast);
  const closeButton = toast.querySelector('.btn-close');
  closeButton?.addEventListener('click', () => toast.remove());
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => toast.classList.remove('show'), delay);
  toast.addEventListener('transitionend', () => {
    if (!toast.classList.contains('show') && toast.parentNode) toast.remove();
  });
}

function showPendingAuthMessage(selector){
  const message = sessionStorage.getItem('authMessage');
  if (!message) return;
  sessionStorage.removeItem('authMessage');
  if (typeof showToast === 'function') {
    showToast(message, 'warning', 5000);
    return;
  }
  const el = document.querySelector(selector);
  if (!el) return;
  el.textContent = message;
  el.className = 'alert alert-danger mt-3';
}

function escapeSessionHtml(value){
  return String(value || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

document.addEventListener('DOMContentLoaded', renderNavbar);
