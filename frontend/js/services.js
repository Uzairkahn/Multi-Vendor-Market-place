let loadedServices = [];

const setStatus = (message, type = 'info') => {
  const status = document.getElementById('serviceStatus');
  if (!status) return;
  const alertClass = type === 'error' ? 'danger' : type;
  status.innerHTML = `<div class="alert alert-${alertClass}" role="alert">${escapeHtml(message)}</div>`;
  if (typeof showToast === 'function' && type !== 'success') {
    showToast(message, alertClass === 'danger' ? 'danger' : alertClass);
  }
};

const clearStatus = () => {
  const status = document.getElementById('serviceStatus');
  if (status) status.innerHTML = '';
};

const renderServices = (services) => {
  const row = document.getElementById('servicesRow');
  if (!row) return;
  row.innerHTML = '';
  loadedServices = services;
  services.forEach((s) => {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';
    col.innerHTML = `
      <div class="card card-service h-100 shadow-sm">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${escapeHtml(s.title)}</h5>
          <div class="mb-2"><span class="badge text-bg-light border">${escapeHtml(s.category || 'Uncategorized')}</span></div>
          <p class="card-text text-muted mb-3">${escapeHtml(s.description || 'No description available.')}</p>
          <div class="mt-auto">
            <p class="mb-1"><strong>Provider:</strong> ${escapeHtml(getProviderName(s))}</p>
            <p class="mb-1"><strong>Rating:</strong> ${formatRating(s.providerStats?.averageRating)} (${s.providerStats?.reviewCount || 0} reviews)</p>
            <p class="mb-3"><strong>Price:</strong> $${s.price?.toFixed?.(2) ?? s.price ?? 0}</p>
            <p class="text-muted small">Delivery: ${s.deliveryTime || 'Standard'}</p>
            <div class="d-flex gap-2 flex-wrap">
              <a class="btn btn-sm btn-outline-primary" href="#" onclick="viewService('${s._id}')">View Details</a>
              <a class="btn btn-sm btn-primary" href="#" onclick="openRequestForm('${s._id}')">Request Service</a>
            </div>
          </div>
        </div>
      </div>`;
    row.appendChild(col);
  });
};

async function loadServices(){
  try{
    clearStatus();
    setStatus('Loading services...', 'success');
    renderServices([]);
    const search = document.getElementById('search')?.value || '';
    const category = document.getElementById('category')?.value || '';
    const q = new URLSearchParams();
    if (search) q.append('search', search);
    if (category) q.append('category', category);
    const res = await fetch('/api/services?' + q.toString());
    if (!res.ok) throw new Error('Could not load services');
    const services = await res.json();
    const list = Array.isArray(services) ? services : [];
    renderServices(list);
    if (list.length) {
      setStatus('Showing available services.', 'success');
    } else {
      setStatus('No services found for the selected category.', 'warning');
    }
  }catch(err){
    console.error(err);
    renderServices([]);
    setStatus('Unable to load services.', 'error');
  }
}

function viewService(id){
  location.href = '/services.html#' + id;
}

async function openRequestForm(id){
  const token = localStorage.getItem('token');
  if (!token) {
    setStatus('Please login as a customer first', 'warning');
    setTimeout(() => redirectWithMessage('Please login as a customer first'), 900);
    return;
  }
  const user = await getCurrentUser();
  if (!user) {
    setStatus('Please login as a customer first', 'warning');
    setTimeout(() => redirectWithMessage('Please login as a customer first'), 900);
    return;
  }
  if (user.role !== 'customer') {
    setStatus('Only customers can submit service requests', 'warning');
    return;
  }
  const service = loadedServices.find(item => item._id === id);
  const panel = document.getElementById('requestPanel');
  if (!panel) return;
  document.getElementById('requestServiceId').value = id;
  document.getElementById('selectedServiceTitle').textContent = service ? `Selected service: ${service.title}` : '';
  document.getElementById('requestMessage').innerHTML = '';
  panel.classList.remove('d-none');
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeRequestForm(){
  const panel = document.getElementById('requestPanel');
  const form = document.getElementById('requestForm');
  if (form) form.reset();
  if (panel) panel.classList.add('d-none');
}

function showRequestMessage(message, isError = false){
  if (typeof showToast === 'function') {
    showToast(message, isError ? 'danger' : 'success');
  }
  const el = document.getElementById('requestMessage');
  if (!el) return;
  el.innerHTML = `<div class="alert alert-${isError ? 'danger' : 'success'}" role="alert">${escapeHtml(message)}</div>`;
}

async function submitServiceRequest(e){
  e.preventDefault();
  const user = await getCurrentUser();
  if (!user) {
    showRequestMessage('Please login as a customer first', true);
    setTimeout(() => redirectWithMessage('Please login as a customer first'), 900);
    return;
  }
  if (user.role !== 'customer') {
    showRequestMessage('Only customers can submit service requests', true);
    return;
  }
  try{
    await apiFetch('/requests', {
      method: 'POST',
      body: JSON.stringify({
        serviceId: document.getElementById('requestServiceId').value,
        requirements: document.getElementById('requestRequirements').value,
        budget: document.getElementById('requestBudget').value,
        deadline: document.getElementById('requestDeadline').value
      })
    });
    showRequestMessage('Request submitted successfully. You can track it from your customer dashboard.');
    document.getElementById('requestForm').reset();
  }catch(err){
    showRequestMessage(err.message || 'Failed to submit request.', true);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btnSearch');
  if (btn) btn.addEventListener('click', loadServices);
  const requestForm = document.getElementById('requestForm');
  if (requestForm) requestForm.addEventListener('submit', submitServiceRequest);
  const closeRequestPanel = document.getElementById('closeRequestPanel');
  if (closeRequestPanel) closeRequestPanel.addEventListener('click', closeRequestForm);
  loadServices();
});

async function createService(data){
  return await apiFetch('/services', { method: 'POST', body: JSON.stringify(data) });
}

function formatRating(value){
  const rating = Number(value || 0);
  return rating ? `${rating.toFixed(1)}/5` : 'No ratings yet';
}

function getProviderName(service){
  return service.provider?.name || service.providerId?.name || 'Unknown provider';
}

function escapeHtml(value){
  return String(value || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
