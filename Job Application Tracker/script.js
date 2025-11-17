/* Persistence key */
let jobs = JSON.parse(localStorage.getItem("jobs_v2")) || [];
let editingIndex = -1;

/* DOM refs */
const jobList = document.getElementById("jobList");
const companyInput = document.getElementById("company");
const roleInput = document.getElementById("role");
const dateInput = document.getElementById("date");
const statusInput = document.getElementById("status");
const notesInput = document.getElementById("notes");
const addBtn = document.getElementById("addBtn");
const cancelEditBtn = document.getElementById("cancelEdit");
const searchInput = document.getElementById("search");
const sortSelect = document.getElementById("sortBy");
const statTotal = document.getElementById("statTotal");
const statApplied = document.getElementById("statApplied");
const statInterview = document.getElementById("statInterview");
const statOffer = document.getElementById("statOffer");
const statRejected = document.getElementById("statRejected");
const darkToggle = document.getElementById("darkToggle");
const exportBtn = document.getElementById("exportBtn");
const clearAllBtn = document.getElementById("clearAllBtn");

/* Helpers */
function saveJobs() { localStorage.setItem("jobs_v2", JSON.stringify(jobs)); }
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }
function getBadgeClass(status){
  if(status==="Applied") return "status-applied";
  if(status==="Interviewing") return "status-interview";
  if(status==="Offer") return "status-offer";
  if(status==="Rejected") return "status-rejected";
  return "status-applied";
}
function formatDate(d){ if(!d) return "—"; const dt=new Date(d); if(isNaN(dt)) return d; return dt.toLocaleDateString(); }
function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}

/* Render */
function renderJobs(){
  jobList.innerHTML = "";
  const search = (searchInput.value || "").toLowerCase();
  let list = jobs.slice();

  // sorting
  const sort = sortSelect.value || "date-desc";
  if (sort === "date-desc") list.sort((a,b)=> new Date(b.date) - new Date(a.date));
  if (sort === "date-asc") list.sort((a,b)=> new Date(a.date) - new Date(b.date));
  if (sort === "company-asc") list.sort((a,b)=> a.company.localeCompare(b.company));
  if (sort === "company-desc") list.sort((a,b)=> b.company.localeCompare(a.company));
  if (sort === "status-asc") list.sort((a,b)=> a.status.localeCompare(b.status));

  // filter by search
  list = list.filter(j => (j.company + " " + j.role + " " + (j.notes||"")).toLowerCase().includes(search));

  if (list.length === 0) {
    jobList.innerHTML = `<div style="color:var(--muted); padding:14px;">No applications found.</div>`;
  } else {
    list.forEach(job => {
      const item = document.createElement("div");
      item.className = "job-item";
      item.innerHTML = `
        <div class="job-left">
          <div style="display:flex;gap:12px;align-items:center;">
            <div>
              <strong style="font-size:15px">${escapeHtml(job.company)}</strong>
              <div class="job-meta">${escapeHtml(job.role)} • ${formatDate(job.date)}</div>
            </div>
            <div style="margin-left:8px;">
              <span class="badge-status ${getBadgeClass(job.status)}">${escapeHtml(job.status)}</span>
            </div>
          </div>
          <div class="job-meta" style="margin-top:8px;color:var(--muted);">
            ${job.notes ? escapeHtml(job.notes) : "<em>No notes</em>"}
          </div>
        </div>
        <div class="item-actions">
          <button class="btn-ghost btn-edit" data-action="edit" data-id="${job.id}">Edit</button>
          <button class="btn-ghost btn-delete" data-action="delete" data-id="${job.id}">Delete</button>
        </div>
      `;
      jobList.appendChild(item);
    });
  }

  updateStats();
  attachItemListeners();
}

/* Listeners for edit/delete */
function attachItemListeners(){
  const editBtns = document.querySelectorAll('[data-action="edit"]');
  const delBtns = document.querySelectorAll('[data-action="delete"]');

  editBtns.forEach(btn => btn.addEventListener("click", () => {
    const id = btn.getAttribute("data-id");
    startEdit(id);
  }));
  delBtns.forEach(btn => btn.addEventListener("click", () => {
    const id = btn.getAttribute("data-id");
    confirmDelete(id);
  }));
}

/* CRUD */
function addJob(){
  const company = companyInput.value.trim();
  const role = roleInput.value.trim();
  const date = dateInput.value;
  const status = statusInput.value;
  const notes = notesInput.value.trim();

  if(!company || !role || !date){
    alert("Please provide company, role and date.");
    return;
  }

  if(editingIndex !== -1){
    const idx = jobs.findIndex(j => j.id === editingIndex);
    if(idx !== -1){
      jobs[idx] = { ...jobs[idx], company, role, date, status, notes };
    }
    editingIndex = -1;
    toggleEditUI(false);
  } else {
    jobs.push({ id: uid(), company, role, date, status, notes });
  }

  saveJobs();
  clearForm();
  renderJobs();
}

function startEdit(id){
  const j = jobs.find(x => x.id === id);
  if(!j) return;
  editingIndex = id;
  companyInput.value = j.company;
  roleInput.value = j.role;
  dateInput.value = j.date;
  statusInput.value = j.status;
  notesInput.value = j.notes || "";
  toggleEditUI(true);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleEditUI(isEditing){
  if(isEditing){
    addBtn.textContent = "Save Changes";
    cancelEditBtn.classList.remove("d-none");
  } else {
    addBtn.textContent = "Add Application";
    cancelEditBtn.classList.add("d-none");
    editingIndex = -1;
  }
}

function confirmDelete(id){
  const j = jobs.find(x => x.id === id);
  if(!j) return;
  if(!confirm(`Delete "${j.company} — ${j.role}"?`)) return;
  jobs = jobs.filter(x => x.id !== id);
  saveJobs();
  renderJobs();
}

function clearAll(){
  if(!confirm("Clear all saved applications? This cannot be undone.")) return;
  jobs = [];
  saveJobs();
  renderJobs();
}

/* Stats */
function updateStats(){
  statTotal.textContent = jobs.length;
  statApplied.textContent = jobs.filter(j=>j.status==="Applied").length;
  statInterview.textContent = jobs.filter(j=>j.status==="Interviewing").length;
  statOffer.textContent = jobs.filter(j=>j.status==="Offer").length;
  statRejected.textContent = jobs.filter(j=>j.status==="Rejected").length;
}

/* Search/Sort */
function onSearch(){ renderJobs(); }
function onSort(){ renderJobs(); }

/* CSV Export */
function exportCSV(){
  if(jobs.length === 0){ alert("No data to export."); return; }
  const header = ["Company","Role","Date","Status","Notes"];
  const rows = jobs.map(j => [
    csvEscape(j.company), csvEscape(j.role), csvEscape(j.date), csvEscape(j.status), csvEscape(j.notes || "")
  ]);
  const csv = [header, ...rows].map(r=>r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "job_applications.csv"; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
function csvEscape(s=''){ return `"${String(s).replaceAll('"','""')}"`; }

/* Dark mode */
function setDarkMode(on){
  if(on){
    document.body.classList.add("dark");
    localStorage.setItem("jobs_dark","1");
    darkToggle.textContent = "Light";
    darkToggle.classList.remove("btn-primary");
    darkToggle.classList.add("btn-light");
  } else {
    document.body.classList.remove("dark");
    localStorage.removeItem("jobs_dark");
    darkToggle.textContent = "Dark";
    darkToggle.classList.remove("btn-light");
    darkToggle.classList.add("btn-primary");
  }
}

/* Utilities */
function clearForm(){
  companyInput.value = ""; roleInput.value = ""; dateInput.value = ""; statusInput.value = "Applied"; notesInput.value = "";
}

/* Event wiring */
addBtn.addEventListener("click", addJob);
cancelEditBtn.addEventListener("click", () => { editingIndex = -1; toggleEditUI(false); clearForm(); });
searchInput.addEventListener("input", onSearch);
sortSelect.addEventListener("change", onSort);
exportBtn.addEventListener("click", exportCSV);
clearAllBtn.addEventListener("click", clearAll);
darkToggle.addEventListener("click", () => setDarkMode(!document.body.classList.contains("dark")));

/* Init */
(function init(){
  if(localStorage.getItem("jobs_dark")) setDarkMode(true);
  renderJobs();
})();
