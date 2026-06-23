document.addEventListener('DOMContentLoaded', initDashboard);

async function initDashboard(){
  try{
    if (document.getElementById('requests')) {
      const user = await requireAuth('customer');
      if (!user) return;
      await loadCustomerDashboard(user);
      return;
    }
    if (document.getElementById('myServices')) {
      const user = await requireAuth('provider');
      if (!user) return;
      bindProviderForms();
      await loadProviderDashboard();
      return;
    }
    // admin stats page (admin-dashboard.html)
    if (document.getElementById('stats') && !document.getElementById('requests') && !document.getElementById('myServices')) {
      const user = await requireAuth('admin');
      if (!user) return;
      await loadAdminStats();
    }
  }catch(err){ console.error(err); }
}

function showMessage(selector, message, isError = false){
  if (typeof showToast === 'function') {
    showToast(message, isError ? 'danger' : 'success');
  }
  const el = document.querySelector(selector);
  if (!el) return;
  el.className = isError ? 'alert alert-danger mt-3' : 'alert alert-success mt-3';
  el.textContent = message;
}

async function loadAdminStats(){
  try{
    const stats = await apiFetch('/admin/stats');
    const el = document.getElementById('stats');
    if (!el) return;
    el.innerHTML = `
      <div class="col-md-6 col-xl-3 mb-3">
        <div class="card shadow-sm h-100 p-4">
          <div class="d-flex align-items-start justify-content-between">
            <div>
              <span class="text-muted">Users</span>
              <h3 class="mt-2 mb-0">${stats.users}</h3>
            </div>
            <span class="badge bg-primary rounded-pill">Total</span>
          </div>
        </div>
      </div>
      <div class="col-md-6 col-xl-3 mb-3">
        <div class="card shadow-sm h-100 p-4">
          <div class="d-flex align-items-start justify-content-between">
            <div>
              <span class="text-muted">Providers</span>
              <h3 class="mt-2 mb-0">${stats.providers}</h3>
            </div>
            <span class="badge bg-success rounded-pill">Live</span>
          </div>
        </div>
      </div>
      <div class="col-md-6 col-xl-3 mb-3">
        <div class="card shadow-sm h-100 p-4">
          <div class="d-flex align-items-start justify-content-between">
            <div>
              <span class="text-muted">Services</span>
              <h3 class="mt-2 mb-0">${stats.services}</h3>
            </div>
            <span class="badge bg-warning text-dark rounded-pill">Catalog</span>
          </div>
        </div>
      </div>
      <div class="col-md-6 col-xl-3 mb-3">
        <div class="card shadow-sm h-100 p-4">
          <div class="d-flex align-items-start justify-content-between">
            <div>
              <span class="text-muted">Requests</span>
              <h3 class="mt-2 mb-0">${stats.requests}</h3>
            </div>
            <span class="badge bg-info text-dark rounded-pill">Active</span>
          </div>
        </div>
      </div>
      <div class="col-12">
        <div class="card shadow-sm p-4 chart-panel">
          <div class="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between mb-3">
            <div>
              <h5 class="mb-1">Platform overview</h5>
              <p class="text-muted mb-0">View usage trends for users, providers and marketplace activity.</p>
            </div>
          </div>
          <div class="chart-wrapper">
            <canvas id="adminStatsChart"></canvas>
          </div>
        </div>
      </div>`;
    renderAdminChart(stats);
  }catch(err){
    console.error(err);
    if (typeof showToast === 'function') showToast('Failed to load admin stats', 'danger');
  }
}

function renderAdminChart(stats){
  const canvas = document.getElementById('adminStatsChart');
  if (!canvas || typeof Chart === 'undefined') return;
  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: ['Users', 'Providers', 'Services', 'Requests'],
      datasets: [{
        label: 'Counts',
        data: [stats.users, stats.providers, stats.services, stats.requests],
        backgroundColor: ['#6366f1', '#22c55e', '#fbbf24', '#38bdf8'],
        borderRadius: 12,
        barPercentage: 0.6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, grid: { color: 'rgba(15,23,42,0.08)' } }
      }
    }
  });
}

async function loadCustomerDashboard(user){
  const elStats = document.getElementById('stats');
  const el = document.getElementById('requests');
  const welcome = document.getElementById('customerWelcome');
  try{
    if (welcome) welcome.textContent = `Welcome, ${user.name}`;
    const requests = await apiFetch('/requests');
    const completed = requests.filter(r => r.status === 'Completed').length;
    const delivered = requests.filter(r => r.status === 'Delivered').length;
    const active = requests.length - completed;
    if (elStats) elStats.innerHTML = `
      <div class="col-md-3"><div class="card p-3">Active Requests: ${active}</div></div>
      <div class="col-md-3"><div class="card p-3">Completed Projects: ${completed}</div></div>
      <div class="col-md-3"><div class="card p-3">Awaiting Acceptance: ${delivered}</div></div>
      <div class="col-md-3"><div class="card p-3">Total Requests: ${requests.length}</div></div>`;
    if (!el) return;
    if (!requests.length){ el.innerHTML = '<div class="alert alert-info">No requests yet. Browse services and submit your first project request.</div>'; return; }
    let html = `<table class="table"><thead><tr><th>Service</th><th>Budget</th><th>Deadline</th><th>Status</th><th></th></tr></thead><tbody>`;
    for (const r of requests){
      const svcTitle = r.serviceId?.title || (typeof r.serviceId === 'string' ? r.serviceId : '—');
      html += `<tr><td>${escapeHtml(svcTitle)}</td><td>${r.budget}</td><td>${formatDate(r.deadline)}</td><td>${r.status}</td><td>${renderCustomerRequestActions(r)}</td></tr>`;
    }
    html += '</tbody></table>';
    el.innerHTML = html;
    document.querySelectorAll('.review-provider').forEach(btn => btn.addEventListener('click', async (e)=>{ e.preventDefault(); await reviewProvider(requests.find(r => r._id === btn.dataset.id)); }));
    document.querySelectorAll('.view-delivery').forEach(btn => btn.addEventListener('click', (e)=>{ e.preventDefault(); viewDelivery(requests.find(r => r._id === btn.dataset.id)); }));
    document.querySelectorAll('.accept-delivery').forEach(btn => btn.addEventListener('click', async (e)=>{ e.preventDefault(); await acceptDelivery(btn.dataset.id); }));
  }catch(err){ console.error(err); if (el) el.innerHTML = '<div class="alert alert-danger">Failed to load requests.</div>'; }
}

async function loadProviderDashboard(){
  const elStats = document.getElementById('stats');
  const elServices = document.getElementById('myServices');
  const elReviews = document.getElementById('providerReviews');
  const elPending = document.getElementById('pendingRequests');
  const elActive = document.getElementById('activeProjects');
  try{
    await loadProviderProfile();
    const token = localStorage.getItem('token');
    const payload = parseJwt(token);
    const userId = payload?.id || payload?._id || payload?.userId || payload?.sub || null;
    const [allServices, requests, reviewSummary] = await Promise.all([
      apiFetch('/services'),
      apiFetch('/requests'),
      apiFetch(`/reviews/provider/${userId}`)
    ]);
    const myServices = allServices.filter(s => {
      const pid = s.providerId?._id || s.providerId;
      return pid == userId;
    });
    const pendingRequests = requests.filter(r => r.status === 'Pending');
    const active = requests.filter(r => ['Accepted','In Progress','Delivered'].includes(r.status));
    if (elStats) elStats.innerHTML = `
      <div class="col-md-3"><div class="card p-3">My Services: ${myServices.length}</div></div>
      <div class="col-md-3"><div class="card p-3">Pending Requests: ${pendingRequests.length}</div></div>
      <div class="col-md-3"><div class="card p-3">Active Projects: ${active.length}</div></div>
      <div class="col-md-3"><div class="card p-3">Earnings: $${calculateEarnings(requests).toFixed(2)}</div></div>`;
    if (elServices) elServices.innerHTML = renderProviderServices(myServices);
    if (elReviews) elReviews.innerHTML = renderProviderReviews(reviewSummary);
    if (elPending) elPending.innerHTML = renderRequestTable(pendingRequests);
    if (elActive) elActive.innerHTML = renderRequestTable(active);
    document.querySelectorAll('.view-request').forEach(btn => btn.addEventListener('click', (e)=>{ e.preventDefault(); const id = btn.dataset.id; showRequestDetails(id); }));
    document.querySelectorAll('.update-request-status').forEach(btn => btn.addEventListener('click', async (e)=>{ e.preventDefault(); await updateRequestStatus(btn.dataset.id, btn.dataset.status); }));
    document.querySelectorAll('.deliver-request').forEach(btn => btn.addEventListener('click', async (e)=>{ e.preventDefault(); await openDeliveryPanel(btn.dataset.id); }));
    document.querySelectorAll('.view-service').forEach(btn => btn.addEventListener('click',(e)=>{ e.preventDefault(); location.href = '/services.html#' + btn.dataset.id; }));
    document.querySelectorAll('.delete-service').forEach(btn => btn.addEventListener('click', async (e)=>{ e.preventDefault(); await deleteProviderService(btn.dataset.id); }));
    document.querySelectorAll('.edit-service').forEach(btn => btn.addEventListener('click', async (e)=>{ e.preventDefault(); await editProviderService(myServices.find(s => s._id === btn.dataset.id)); }));
  }catch(err){ console.error(err); if (elServices) elServices.innerHTML = '<div class="alert alert-danger">Failed to load provider dashboard.</div>'; }
}

function renderCustomerRequestActions(request){
  if (request.status === 'Delivered') {
    return `<div class="btn-group btn-group-sm"><a href="#" class="btn btn-outline-primary view-delivery" data-id="${request._id}">View Delivery</a><a href="#" class="btn btn-success accept-delivery" data-id="${request._id}">Accept Delivery</a></div>`;
  }
  if (request.status !== 'Completed') return '';
  if (request.hasReviewedProvider) return '<span class="badge text-bg-success">Review submitted</span>';
  return `<a href="#" class="btn btn-sm btn-primary review-provider" data-id="${request._id}">Review</a>`;
}

function viewDelivery(request){
  if (!request?.deliveryFileUrl) {
    alert('No delivery file is available yet.');
    return;
  }
  const message = request.deliveryMessage || 'No delivery message provided.';
  alert(`Delivery message:\n${message}\n\nFile: ${request.deliveryFileName || request.deliveryFileUrl}`);
  window.open(request.deliveryFileUrl, '_blank', 'noopener');
}

async function acceptDelivery(id){
  if (!confirm('Accept this delivery and mark the project completed?')) return;
  try{
    await apiFetch(`/requests/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'Completed' })
    });
    const user = await getCurrentUser();
    if (user) await loadCustomerDashboard(user);
  }catch(err){
    alert(err.message || 'Failed to accept delivery.');
  }
}

async function reviewProvider(request){
  const providerId = request?.serviceId?.providerId?._id || request?.serviceId?.providerId;
  if (!providerId) {
    alert('Provider information is missing for this request.');
    return;
  }
  const rating = prompt('Rating from 1 to 5');
  if (rating === null) return;
  const feedback = prompt('Feedback');
  if (feedback === null) return;
  try{
    await apiFetch('/reviews', {
      method: 'POST',
      body: JSON.stringify({ providerId, rating, feedback })
    });
    alert('Review submitted successfully.');
    const user = await getCurrentUser();
    if (user) await loadCustomerDashboard(user);
  }catch(err){
    alert(err.message || 'Failed to submit review.');
  }
}

function bindProviderForms(){
  const profileForm = document.getElementById('providerProfileForm');
  if (profileForm && !profileForm.dataset.bound) {
    profileForm.dataset.bound = 'true';
    profileForm.addEventListener('submit', saveProviderProfile);
  }
  const serviceForm = document.getElementById('serviceForm');
  if (serviceForm && !serviceForm.dataset.bound) {
    serviceForm.dataset.bound = 'true';
    serviceForm.addEventListener('submit', saveProviderService);
  }
  const deliveryForm = document.getElementById('deliveryForm');
  if (deliveryForm && !deliveryForm.dataset.bound) {
    deliveryForm.dataset.bound = 'true';
    deliveryForm.addEventListener('submit', submitDelivery);
  }
  const closeDeliveryPanel = document.getElementById('closeDeliveryPanel');
  if (closeDeliveryPanel && !closeDeliveryPanel.dataset.bound) {
    closeDeliveryPanel.dataset.bound = 'true';
    closeDeliveryPanel.addEventListener('click', closeDeliveryPanelView);
  }
  const uploadProfilePictureBtn = document.getElementById('uploadProfilePictureBtn');
  if (uploadProfilePictureBtn && !uploadProfilePictureBtn.dataset.bound) {
    uploadProfilePictureBtn.dataset.bound = 'true';
    uploadProfilePictureBtn.addEventListener('click', uploadProviderProfilePicture);
  }
}

async function loadProviderProfile(){
  const form = document.getElementById('providerProfileForm');
  if (!form) return;
  try{
    const profile = await apiFetch('/provider-profiles/me');
    document.getElementById('profileBio').value = profile.bio || '';
    document.getElementById('profilePicture').value = profile.profilePicture || '';
    updateProfilePicturePreview(profile.profilePicture);
    document.getElementById('profileSkills').value = (profile.skills || []).join(', ');
    document.getElementById('profileExperience').value = profile.experience || 0;
    document.getElementById('profilePricing').value = profile.pricing || 0;
    document.getElementById('profilePortfolio').value = (profile.portfolioItems || []).map(item => `${item.title} | ${item.description || ''} | ${item.link || ''}`).join('\n');
  }catch(err){
    if (!String(err.message).includes('not found')) console.error(err);
  }
}

async function uploadProviderProfilePicture(){
  const input = document.getElementById('profilePictureFile');
  const file = input?.files?.[0];
  if (!file) {
    showMessage('#profileMessage', 'Please choose an image file first.', true);
    return;
  }
  const formData = new FormData();
  formData.append('profilePicture', file);
  try{
    const token = localStorage.getItem('token');
    const res = await fetch('/api/provider-profiles/me/photo', {
      method: 'POST',
      headers: token ? { Authorization: 'Bearer ' + token } : {},
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || 'Upload failed');
    document.getElementById('profilePicture').value = data.profilePicture;
    updateProfilePicturePreview(data.profilePicture);
    input.value = '';
    showMessage('#profileMessage', 'Profile picture uploaded successfully.');
  }catch(err){
    showMessage('#profileMessage', err.message || 'Failed to upload profile picture.', true);
  }
}

function updateProfilePicturePreview(url){
  const preview = document.getElementById('profilePicturePreview');
  if (!preview) return;
  if (!url) {
    preview.classList.add('d-none');
    preview.removeAttribute('src');
    return;
  }
  preview.src = url;
  preview.classList.remove('d-none');
}

async function saveProviderProfile(e){
  e.preventDefault();
  try{
    await apiFetch('/provider-profiles', {
      method: 'POST',
      body: JSON.stringify({
        bio: document.getElementById('profileBio').value,
        profilePicture: document.getElementById('profilePicture').value,
        skills: document.getElementById('profileSkills').value,
        experience: document.getElementById('profileExperience').value,
        pricing: document.getElementById('profilePricing').value,
        portfolioItems: parsePortfolioItems(document.getElementById('profilePortfolio').value)
      })
    });
    showMessage('#profileMessage', 'Profile saved successfully.');
  }catch(err){
    showMessage('#profileMessage', err.message || 'Failed to save profile.', true);
  }
}

async function saveProviderService(e){
  e.preventDefault();
  try{
    await apiFetch('/services', {
      method: 'POST',
      body: JSON.stringify({
        title: document.getElementById('serviceTitle').value,
        description: document.getElementById('serviceDescription').value,
        category: document.getElementById('serviceCategory').value,
        price: document.getElementById('servicePrice').value,
        deliveryTime: document.getElementById('serviceDeliveryTime').value
      })
    });
    document.getElementById('serviceForm').reset();
    showMessage('#serviceFormMessage', 'Service created successfully.');
    await loadProviderDashboard();
  }catch(err){
    showMessage('#serviceFormMessage', err.message || 'Failed to create service.', true);
  }
}

function parsePortfolioItems(value){
  return value.split('\n').map(line => {
    const [title, description, link] = line.split('|').map(part => part?.trim() || '');
    return { title, description, link };
  }).filter(item => item.title);
}

function renderProviderServices(services){
  if (!services.length) return '<p>No services yet.</p>';
  return '<ul class="list-group">' + services.map(s => `
    <li class="list-group-item d-flex flex-wrap justify-content-between align-items-center gap-2">
      <span><strong>${escapeHtml(s.title)}</strong> - $${s.price ?? 0}</span>
      <span class="btn-group btn-group-sm">
        <a href="#" class="btn btn-outline-primary view-service" data-id="${s._id}">View</a>
        <a href="#" class="btn btn-outline-secondary edit-service" data-id="${s._id}">Edit</a>
        <a href="#" class="btn btn-outline-danger delete-service" data-id="${s._id}">Delete</a>
      </span>
    </li>`).join('') + '</ul>';
}

function renderProviderReviews(summary){
  const reviews = summary?.reviews || [];
  const averageRating = Number(summary?.averageRating || 0);
  const header = `
    <div class="row g-3 mb-3">
      <div class="col-md-4"><div class="card p-3">Average Rating: ${averageRating ? averageRating.toFixed(1) + '/5' : 'No ratings yet'}</div></div>
      <div class="col-md-4"><div class="card p-3">Total Reviews: ${reviews.length}</div></div>
    </div>`;
  if (!reviews.length) return header + '<div class="alert alert-info">No reviews yet.</div>';
  return header + '<div class="list-group">' + reviews.map(review => `
    <div class="list-group-item">
      <div class="d-flex flex-wrap justify-content-between gap-2">
        <strong>${escapeHtml(review.customerId?.name || 'Customer')}</strong>
        <span>${Number(review.rating || 0).toFixed(1)}/5</span>
      </div>
      <p class="mb-0 text-muted">${escapeHtml(review.feedback || 'No feedback provided.')}</p>
    </div>`).join('') + '</div>';
}

function renderRequestTable(requests){
  if (!requests.length) return '<p>No requests found.</p>';
  return '<table class="table"><thead><tr><th>Service</th><th>Customer</th><th>Budget</th><th>Deadline</th><th>Status</th><th></th></tr></thead><tbody>' +
    requests.map(r => `<tr><td>${escapeHtml(r.serviceId?.title||'')}</td><td>${escapeHtml(r.customerId?.name||r.customerId||'')}</td><td>${r.budget}</td><td>${formatDate(r.deadline)}</td><td>${r.status}</td><td>${renderRequestActions(r)}</td></tr>`).join('') +
    '</tbody></table>';
}

function renderRequestActions(request){
  const next = nextProviderRequestStatus(request.status);
  const statusButton = next ? `<a href="#" class="btn btn-sm btn-primary update-request-status" data-id="${request._id}" data-status="${next}">${providerActionLabel(next)}</a>` : '';
  const deliverButton = request.status === 'In Progress' ? `<a href="#" class="btn btn-sm btn-success deliver-request" data-id="${request._id}">Deliver</a>` : '';
  return `<div class="btn-group btn-group-sm"><a href="#" class="btn btn-secondary view-request" data-id="${request._id}">View</a>${statusButton}${deliverButton}</div>`;
}

function nextProviderRequestStatus(status){
  if (status === 'Pending') return 'Accepted';
  if (status === 'Accepted') return 'In Progress';
  return null;
}

function providerActionLabel(status){
  if (status === 'Accepted') return 'Accept';
  if (status === 'In Progress') return 'Start';
  return status;
}

async function updateRequestStatus(id, status){
  try{
    await apiFetch(`/requests/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    await loadProviderDashboard();
  }catch(err){
    alert(err.message || 'Failed to update request status.');
  }
}

async function openDeliveryPanel(id){
  const all = await apiFetch('/requests');
  const request = all.find(item => item._id === id);
  if (!request) {
    alert('Request not found');
    return;
  }
  document.getElementById('deliveryRequestId').value = id;
  document.getElementById('deliveryRequestTitle').textContent = `Delivering: ${request.serviceId?.title || 'Service request'}`;
  document.getElementById('deliveryMessageBox').innerHTML = '';
  document.getElementById('deliveryPanel').classList.remove('d-none');
  document.getElementById('deliveryPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeDeliveryPanelView(){
  const panel = document.getElementById('deliveryPanel');
  const form = document.getElementById('deliveryForm');
  if (form) form.reset();
  if (panel) panel.classList.add('d-none');
}

async function submitDelivery(e){
  e.preventDefault();
  const id = document.getElementById('deliveryRequestId').value;
  const file = document.getElementById('deliveryFile').files[0];
  if (!file) {
    showDeliveryMessage('Please choose a delivery file.', true);
    return;
  }
  const formData = new FormData();
  formData.append('deliveryMessage', document.getElementById('deliveryMessage').value);
  formData.append('deliveryFile', file);
  try{
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/requests/${id}/deliver`, {
      method: 'POST',
      headers: token ? { Authorization: 'Bearer ' + token } : {},
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || 'Failed to submit delivery');
    showDeliveryMessage('Delivery submitted successfully.');
    closeDeliveryPanelView();
    await loadProviderDashboard();
  }catch(err){
    showDeliveryMessage(err.message || 'Failed to submit delivery.', true);
  }
}

function showDeliveryMessage(message, isError = false){
  const el = document.getElementById('deliveryMessageBox');
  if (!el) return;
  el.innerHTML = `<div class="alert alert-${isError ? 'danger' : 'success'}">${message}</div>`;
}

async function deleteProviderService(id){
  if (!confirm('Delete this service?')) return;
  try{
    await apiFetch(`/services/${id}`, { method: 'DELETE' });
    await loadProviderDashboard();
  }catch(err){
    alert(err.message || 'Failed to delete service.');
  }
}

async function editProviderService(service){
  if (!service) return;
  const title = prompt('Service title', service.title || '');
  if (title === null) return;
  const price = prompt('Price', service.price ?? 0);
  if (price === null) return;
  const deliveryTime = prompt('Delivery time', service.deliveryTime || 'Standard');
  if (deliveryTime === null) return;
  try{
    await apiFetch(`/services/${service._id}`, {
      method: 'PUT',
      body: JSON.stringify({ title, price, deliveryTime })
    });
    await loadProviderDashboard();
  }catch(err){
    alert(err.message || 'Failed to update service.');
  }
}

function calculateEarnings(requests){
  return requests
    .filter(r => r.status === 'Completed')
    .reduce((sum, r) => sum + Number(r.budget || 0), 0);
}

function formatDate(value){
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
}

async function showRequestDetails(id){
  try{
    const all = await apiFetch('/requests');
    const r = all.find(x => x._id === id);
    if (!r) { alert('Request not found'); return; }
    alert(`Request details\nService: ${r.serviceId?.title}\nCustomer: ${r.customerId?.name}\nRequirements: ${r.requirements}\nBudget: ${r.budget}\nDeadline: ${r.deadline}\nStatus: ${r.status}`);
  }catch(err){ console.error(err); alert('Failed to load request details'); }
}

function parseJwt(token){ try{ const p = token.split('.')[1]; return JSON.parse(atob(p.replace(/-/g,'+').replace(/_/g,'/'))); }catch(e){ return null; } }
function escapeHtml(s){ if(!s) return ''; return s.replaceAll && typeof s.replaceAll === 'function' ? s.replaceAll('<','&lt;').replaceAll('>','&gt;') : s.toString().replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
