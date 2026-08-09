// GANTI URL INI DENGAN URL WEB APP GOOGLE APPS SCRIPT YANG BARU DIDEPLOY
const scriptURL = 'MASUKKAN_URL_APPS_SCRIPT_DISINI';

const AppState = {
  data: null,
  currentPage: 'dashboard',
  historyLimit: 10
};

// Mengganti google.script.run dengan fetch()
const server = new Proxy({}, {
  get: function(target, prop) {
    return async function(...args) {
      try {
        const response = await fetch(scriptURL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: prop, args: args })
        });
        const result = await response.json();
        if (result.status === 'error') {
            throw new Error(result.message);
        }
        return result.data;
      } catch (error) {
        throw error;
      }
    }
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  startClock();
  updateGreeting();
  
  const container = document.getElementById('appContainer');
  container.innerHTML = `<div class="text-center mt-5"><div class="spinner-border text-success" role="status"></div><p class="mt-2 text-muted">Memuat Sistem & Membaca Database...</p></div>`;
  
  try {
    AppState.data = await server.getInitialData();
    navigate('dashboard');
  } catch (e) {
    container.innerHTML = `
      <div class="alert alert-danger m-4 shadow-sm border-0 border-start border-5 border-danger">
        <h5><span class="material-icons align-middle text-danger">error</span> Gagal Memuat Data</h5>
        <p class="mb-0">Pesan Sistem: <strong>${e.message || e}</strong></p>
        <hr>
        <small>Pastikan Sheet 'DATA' dan 'REKAP' tidak ada baris yang error (#N/A).</small>
      </div>`;
  }
});

function startClock() {
  const days = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  
  setInterval(() => {
    const now = new Date();
    document.getElementById('liveClock').innerText = now.toLocaleTimeString('id-ID') + ' WIB';
    document.getElementById('currentDate').innerText = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  }, 1000);
}

function updateGreeting() {
  const hour = new Date().getHours();
  let ucapan = "Malam";
  if (hour >= 4 && hour < 10) ucapan = "Pagi";
  else if (hour >= 10 && hour < 15) ucapan = "Siang";
  else if (hour >= 15 && hour < 18) ucapan = "Sore";
  
  const headerTitle = document.querySelector('.content-wrapper h4');
  if(headerTitle) headerTitle.innerHTML = `Ahlan Wa Sahlan! Selamat ${ucapan} <strong>Miss Haury & Ustadz Anam 🙌🏻</strong>`;
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('active');
}

function navigate(page) {
  AppState.currentPage = page;
  const container = document.getElementById('appContainer');
  
  document.querySelectorAll('.sidebar-menu a').forEach(el => el.classList.remove('active'));
  const activeMenu = document.querySelector(`.sidebar-menu a[onclick="navigate('${page}')"]`);
  if(activeMenu) activeMenu.classList.add('active');

  if(window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('active');
  }

  if(page === 'dashboard') renderDashboard(container);
  if(page === 'attendance') renderAttendance(container);
  if(page === 'settings') renderSettings(container);
  if(page === 'rekap') renderRekap(container);
}

function renderDashboard(container) {
  const totalActivities = Object.keys(AppState.data.activities).length;
  const totalTeachers = AppState.data.teachers.length;
  const stats = AppState.data.stats; 
  
  AppState.historyLimit = 10; 
  
  let html = `
    <!-- Baris 1: Informasi Umum -->
    <div class="row">
      <div class="col-12 col-md-4 mb-3"><div class="card p-3 shadow-sm border-0 border-start border-4 border-success h-100">
        <p class="text-muted mb-1 text-nowrap" style="font-size:0.85rem;">Periode Aktif</p>
        <h5 class="text-success fw-bold mb-0">${AppState.data.activePeriod}</h5>
      </div></div>

      <div class="col-6 col-md-4 mb-3"><div class="card card-stats p-3 border-0 shadow-sm h-100">
        <p class="mb-1 text-nowrap" style="opacity:0.8; font-size:0.85rem;">Total Kegiatan</p>
        <h3 class="mb-0 fw-bold">${totalActivities}</h3>
      </div></div>
      
      <div class="col-6 col-md-4 mb-3"><div class="card card-stats p-3 border-0 shadow-sm h-100" style="background: linear-gradient(135deg, #198754, #20c997);">
        <p class="mb-1 text-nowrap" style="opacity:0.8; font-size:0.85rem;">Total Pengajar</p>
        <h3 class="mb-0 fw-bold">${totalTeachers}</h3>
      </div></div>
    </div>

    <!-- Baris 2: Statistik Jam Kehadiran -->
    <div class="row">
      <div class="col-6 col-md-4 mb-3"><div class="card p-3 shadow-sm border-0 border-start border-4 border-primary h-100">
        <p class="text-muted mb-1 text-nowrap" style="font-size:0.85rem;">Total Jam Hadir</p>
        <h5 class="text-primary fw-bold mb-0">${stats.hadir || 0} <small class="text-muted fw-normal" style="font-size:0.75rem;">Jam</small></h5>
      </div></div>

      <div class="col-6 col-md-4 mb-3"><div class="card p-3 shadow-sm border-0 border-start border-4 border-danger h-100">
        <p class="text-muted mb-1 text-nowrap" style="font-size:0.85rem;">Total Jam Tdk Hadir</p>
        <h5 class="text-danger fw-bold mb-0">${stats.tidakHadir || 0} <small class="text-muted fw-normal" style="font-size:0.75rem;">Jam</small></h5>
      </div></div>

      <div class="col-12 col-md-4 mb-3"><div class="card p-3 shadow-sm border-0 border-start border-4 border-warning h-100">
        <p class="text-muted mb-1 text-nowrap" style="font-size:0.85rem;">Total Jam Badal</p>
        <h5 class="text-warning fw-bold mb-0">${stats.badal || 0} <small class="text-muted fw-normal" style="font-size:0.75rem;">Jam</small></h5>
      </div></div>
    </div>

    <!-- TABEL RIWAYAT TERBARU -->
    <div class="row mt-3">
      <div class="col-12">
        <div class="card p-3 shadow-sm border-0">
          <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3">
            <h6 class="text-success fw-bold mb-2 mb-md-0"><i class="material-icons align-middle" style="font-size: 18px;">history</i> Riwayat Input Terbaru</h6>
            <input type="text" id="searchHistory" class="form-control form-control-sm" style="max-width: 250px;" placeholder="Cari nama/kegiatan..." onkeyup="renderHistoryTable()">
          </div>
          <div class="table-responsive">
            <table class="table table-hover table-sm align-middle" style="font-size: 0.85rem;">
              <thead class="table-light">
                <tr><th class="text-nowrap">Tanggal & Jam</th><th class="text-nowrap">Kegiatan</th><th class="text-nowrap">Pengajar</th><th class="text-nowrap">Status</th><th class="text-nowrap">Jam</th><th class="text-nowrap">Badal</th></tr>
              </thead>
              <tbody id="historyTableBody">
              </tbody>
            </table>
          </div>
          <div class="text-center mt-2">
            <button class="btn btn-sm btn-outline-success rounded-pill px-4" id="btnLoadMore" onclick="loadMoreHistory()">Tampilkan Lebih Banyak</button>
          </div>
        </div>
      </div>
    </div>
  `;
  container.innerHTML = html;
  renderHistoryTable();
}

function renderHistoryTable() {
  const tbody = document.getElementById('historyTableBody');
  const keyword = document.getElementById('searchHistory') ? document.getElementById('searchHistory').value.toLowerCase() : "";
  const btnLoadMore = document.getElementById('btnLoadMore');
  
  if(!tbody) return;

  let filteredData = AppState.data.history.filter(item => 
    item.pengajar.toLowerCase().includes(keyword) || 
    item.kegiatan.toLowerCase().includes(keyword)
  );

  let html = '';
  let displayCount = Math.min(AppState.historyLimit, filteredData.length);

  if(filteredData.length === 0) {
    html = `<tr><td colspan="6" class="text-center text-muted py-3">Tidak ada data ditemukan.</td></tr>`;
    btnLoadMore.style.display = 'none';
  } else {
    for(let i = 0; i < displayCount; i++) {
      let row = filteredData[i];
      let statusBadge = row.status === 'Hadir' ? 'bg-success' : (row.status === 'Tidak Hadir' ? 'bg-danger' : 'bg-secondary');
      html += `<tr>
        <td class="text-nowrap text-muted">${row.tanggal}</td>
        <td class="text-nowrap fw-bold">${row.kegiatan}</td>
        <td class="text-nowrap">${row.pengajar}</td>
        <td class="text-nowrap"><span class="badge ${statusBadge}">${row.status}</span></td>
        <td class="text-nowrap">${row.jam}</td>
        <td class="text-nowrap"><span class="badge bg-warning text-dark">${row.badal || '-'}</span></td>
      </tr>`;
    }
    
    if(AppState.historyLimit >= filteredData.length) {
      btnLoadMore.style.display = 'none';
    } else {
      btnLoadMore.style.display = 'inline-block';
    }
  }
  tbody.innerHTML = html;
}

function loadMoreHistory() {
  AppState.historyLimit += 10;
  renderHistoryTable();
}

function renderAttendance(container) {
  const todayYMD = new Date().toISOString().split('T')[0];
  
  container.innerHTML = `
    <div class="card p-4 shadow-sm border-0">
      <h5 class="mb-4 text-success fw-bold"><i class="material-icons align-middle me-2">edit_note</i> Form Daftar Hadir Terintegrasi</h5>
      
      <div class="row mb-4 align-items-center">
        <div class="col-12 col-md-5">
          <label class="text-muted mb-1 fw-bold" style="font-size: 0.85rem;">Pilih Tanggal & Bulan:</label>
          <input type="date" id="selectDate" class="form-control form-control-lg shadow-sm" style="border-color:#198754;" value="${todayYMD}" onchange="handleDateChange(this.value)">
        </div>
        <div class="col-12 col-md-7 mt-2 mt-md-0">
          <div class="p-2 bg-light rounded border">
            <span id="dayNameDisplay" class="text-success fw-bold d-block" style="font-size: 0.95rem;"></span>
            <small class="text-muted">Seluruh jadwal kegiatan pada hari tersebut otomatis ditampilkan di bawah.</small>
          </div>
        </div>
      </div>

      <div id="teachersFormContainer"></div>
    </div>
  `;
  
  handleDateChange(todayYMD);
}

function handleDateChange(dateString) {
  const dayDisplay = document.getElementById('dayNameDisplay');
  const container = document.getElementById('teachersFormContainer');
  container.innerHTML = '';
  
  if (!dateString) return;

  const daysIndo = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const dateObj = new Date(dateString + 'T00:00:00'); 
  const dayName = daysIndo[dateObj.getDay()];
  
  dayDisplay.innerText = `Hari Terdeteksi: ${dayName}`;
  
  const scheduledActivities = AppState.data.schedule && AppState.data.schedule[dayName] ? AppState.data.schedule[dayName] : [];
  
  if (scheduledActivities.length === 0) {
    container.innerHTML = `<div class="alert alert-warning border-0 shadow-sm"><i class="material-icons align-middle me-2">event_busy</i>Tidak ada jadwal kegiatan yang terdaftar untuk hari <b>${dayName}</b>.</div>`;
    return;
  }

  const allTeachers = AppState.data.teachers;
  let globalRowIndex = 0; 

  let html = `<form id="attendanceForm" onsubmit="submitAttendance(event)">`;

  scheduledActivities.forEach((act) => {
    const teachers = AppState.data.activities[act];
    if (!teachers || teachers.length === 0) return;

    html += `
      <div class="mb-4 p-3 bg-white rounded border shadow-sm" style="border-left: 4px solid #0B4619 !important;">
        <h6 class="text-success fw-bold mb-3"><i class="material-icons align-middle me-1" style="font-size:18px;">menu_book</i> ${act}</h6>
        <div class="table-responsive">
          <table class="table align-middle table-hover mb-0" style="font-size: 0.9rem;">
            <thead class="table-success">
              <tr>
                <th class="text-nowrap">Nama Pengajar</th>
                <th class="text-nowrap" width="140">Status</th>
                <th class="text-nowrap" width="100">Jml Jam</th>
                <th class="text-nowrap" width="200">Badal (Opsional)</th>
                <th class="text-nowrap">Keterangan</th>
              </tr>
            </thead>
            <tbody>`;

    teachers.forEach((teacher) => {
      let badalOptions = allTeachers.filter(t => t !== teacher).map(t => `<option value="${t.replace(/"/g, '&quot;')}">${t}</option>`).join('');
      
      html += `
        <tr>
          <td class="text-nowrap">
            ${teacher}
            <input type="hidden" name="activity_${globalRowIndex}" value="${act.replace(/"/g, '&quot;')}">
            <input type="hidden" name="teacher_${globalRowIndex}" value="${teacher.replace(/"/g, '&quot;')}">
          </td>
          <td>
            <select name="status_${globalRowIndex}" class="form-select form-select-sm" onchange="handleStatusChange(this, ${globalRowIndex})">
              <option value="">-- Lewati --</option>
              <option value="Hadir">Hadir</option>
              <option value="Tidak Hadir">Tidak Hadir</option>
            </select>
          </td>
          <td>
            <select name="jam_${globalRowIndex}" class="form-select form-select-sm">
              <option value="">-</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option>
            </select>
          </td>
          <td>
            <select name="badal_${globalRowIndex}" id="badal_${globalRowIndex}" class="form-select form-select-sm bg-light" disabled>
              <option value="">-- Pengganti --</option>
              ${badalOptions}
            </select>
          </td>
          <td><input type="text" name="ket_${globalRowIndex}" class="form-control form-control-sm" placeholder="Catatan..."></td>
        </tr>
      `;
      globalRowIndex++;
    });

    html += `</tbody></table></div></div>`;
  });

  html += `
    <input type="hidden" id="totalRowsCount" value="${globalRowIndex}">
    <div class="text-end mt-4 mb-5">
      <button type="reset" class="btn btn-light me-2 shadow-sm border">Reset Semua</button>
      <button type="submit" class="btn btn-success shadow-sm px-4" id="btnSubmit">
        <i class="material-icons align-middle" style="font-size:18px;">save</i> Simpan Kehadiran Hari Ini
      </button>
    </div>
  </form>`;

  container.innerHTML = html;
}

function handleStatusChange(selectEl, index) {
  const badalDropdown = document.getElementById(`badal_${index}`);
  if(selectEl.value === 'Tidak Hadir') {
    badalDropdown.disabled = false;
    badalDropdown.classList.remove('bg-light');
  } else {
    badalDropdown.disabled = true;
    badalDropdown.value = '';
    badalDropdown.classList.add('bg-light');
  }
}

async function submitAttendance(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSubmit');
  const formData = new FormData(e.target);
  
  const totalRows = parseInt(document.getElementById('totalRowsCount').value || 0);
  
  const selectedDateYMD = document.getElementById('selectDate').value;
  const [year, month, day] = selectedDateYMD.split('-');
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0]; 
  const customDateFormatted = `${day}/${month}/${year} ${timeStr}`;

  let payload = [];

  for (let i = 0; i < totalRows; i++) {
    let statusVal = formData.get(`status_${i}`);
    if (!statusVal) continue; 

    let jamVal = formData.get(`jam_${i}`);
    let teacherVal = formData.get(`teacher_${i}`);
    let activityVal = formData.get(`activity_${i}`);
    
    if (!jamVal) {
      Swal.fire({
         icon: 'warning',
         title: 'Validasi Gagal',
         html: `Jumlah Jam untuk pengajar <b>${teacherVal}</b> pada kegiatan <b>${activityVal}</b> belum diisi!`
      });
      return; 
    }

    payload.push({
      kegiatan: activityVal,
      pengajar: teacherVal,
      status: statusVal,
      jam: jamVal,
      badal: formData.get(`badal_${i}`),
      keterangan: formData.get(`ket_${i}`)
    });
  }

  if (payload.length === 0) {
    Swal.fire('Perhatian', 'Semua baris dilewati. Tidak ada data yang disimpan.', 'info');
    return;
  }

  btn.disabled = true; 
  btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Menyimpan...`;

  try {
    const res = await server.saveAttendanceBatch(payload, customDateFormatted);
    if (res.status === 'success') {
      Swal.fire({ icon: 'success', title: 'Tersimpan!', text: res.message, timer: 2000, showConfirmButton: false });
      e.target.reset(); 
      document.querySelectorAll('select[id^="badal_"]').forEach(el => { el.disabled = true; el.classList.add('bg-light'); });
      
      AppState.data = await server.getInitialData(); 
    } else {
      Swal.fire('Gagal', res.message, 'error');
    }
  } catch(err) {
    Swal.fire('Error', err.message, 'error');
  } finally {
    btn.disabled = false; 
    btn.innerHTML = `<i class="material-icons align-middle" style="font-size:18px;">save</i> Simpan Kehadiran Hari Ini`;
  }
}

async function renderRekap(container) {
  container.innerHTML = `<div class="text-center mt-5"><div class="spinner-border text-success"></div><p>Memuat Rekapitulasi...</p></div>`;
  try {
    const data = await server.getRekapData();
    let html = `<h5 class="mb-4 text-success fw-bold"><i class="material-icons align-middle">bar_chart</i> Rekapitulasi Periode Aktif</h5>`;
    if(!data || Object.keys(data.activities).length === 0) {
      html += `<div class="alert alert-info border-0 shadow-sm">Belum ada data rekap yang tersedia.</div>`;
    } else {
      for (let kegiatan in data.activities) {
        html += `<div class="card p-3 shadow-sm border-0 mb-4">
            <h5 class="border-bottom pb-2 mb-3 text-success fw-bold">${kegiatan}</h5>
            <div class="table-responsive"><table class="table table-hover table-sm align-middle">
                <thead class="table-light"><tr>
                  <th class="text-nowrap">Pengajar</th>
                  <th class="text-nowrap text-center">Hadir</th>
                  <th class="text-nowrap text-center">Tidak Hadir</th>
                  <th class="text-nowrap text-center">Persentase</th>
                </tr></thead>
                <tbody>`;
        data.activities[kegiatan].forEach(row => {
          html += `<tr>
                     <td class="text-nowrap">${row.pengajar}</td>
                     <td class="text-center"><span class="badge bg-success rounded-pill px-2">${row.hadir}</span></td>
                     <td class="text-center"><span class="badge bg-danger rounded-pill px-2">${row.tidakHadir}</span></td>
                     <td class="text-center fw-bold">${row.persen}</td>
                   </tr>`;
        });
        html += `</tbody></table></div>`;
        
        if(data.badalDetails && data.badalDetails[kegiatan]) {
          html += `<div class="mt-2 p-3 bg-light rounded border border-warning">
                     <h6 class="mb-2 text-warning-emphasis"><i class="material-icons align-middle" style="font-size:18px;">swap_horiz</i> Rekap Badal ${kegiatan}</h6>
                     <ul class="list-unstyled mb-0" style="font-size:0.95rem;">`;
          let sortedBadal = Object.entries(data.badalDetails[kegiatan]).sort((a,b) => b[1] - a[1]);
          sortedBadal.forEach(([text, count]) => {
             let parts = text.split(" -> "); 
             html += `<li class="mb-1 border-bottom pb-1"><strong>${parts[0]}</strong> <span class="text-muted">-></span> ${parts[1]} <span class="badge bg-secondary ms-2 float-end">${count} jam</span></li>`;
          });
          html += `</ul></div>`;
        }
        html += `</div>`; 
      }
    }
    container.innerHTML = html;
  } catch(e) { container.innerHTML = `<div class="alert alert-danger">Error Rekap: ${e.message}</div>`; }
}

function renderSettings(container) {
  container.innerHTML = `
    <div class="card p-4 shadow-sm border-0 w-100" style="max-width: 600px;">
      <h5 class="text-success fw-bold"><i class="material-icons align-middle">settings</i> Pengaturan Sistem</h5>
      
      <div class="alert alert-warning mt-3 border-0 shadow-sm">
         <h6 class="alert-heading fw-bold"><i class="material-icons align-middle text-warning">warning</i> Perhatian!</h6>
         
         <div style="text-align: justify;">
           <p class="mb-3">
             Setelah Ustadz Anam selesai menginput rekap kehadiran pengajar pesantren, harap segera konfirmasi agar Ustadzah Haury bisa mengganti periode untuk bulan berikutnya.
           </p>
           <p class="mb-0">
             Pastikan data rekap periode ini benar-benar sudah diinput di COD YDGA. Karena setelah periode diganti, seluruh daftar kehadiran di database akan dipindahkan ke Recovery dan Rekap akan di-reset menjadi nol.
           </p>
         </div>
         
      </div>
      
      <p class="text-muted mt-2">Periode Aktif Saat Ini: <strong class="text-dark">${AppState.data.activePeriod}</strong></p>
      <hr>
      <label class="fw-bold mb-2">Input Nama Periode Baru</label>
      <div class="input-group mb-3">
        <input type="text" id="newPeriodInput" class="form-control" placeholder="Contoh: Januari 2027">
        <button class="btn btn-danger px-4" onclick="confirmShiftPeriod()">Ganti & Arsipkan</button>
      </div>
    </div>
  `;
}

function confirmShiftPeriod() {
  const newPeriod = document.getElementById('newPeriodInput').value;
  if(!newPeriod) return Swal.fire('Perhatian', 'Nama periode baru tidak boleh kosong!', 'warning');

  Swal.fire({
    title: 'Apakah Anda Yakin?', text: "Seluruh data periode saat ini akan dipindahkan ke Recovery.",
    icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc3545', cancelButtonColor: '#6c757d',
    confirmButtonText: 'Ya, Pindahkan Data!'
  }).then(async (result) => {
    if (result.isConfirmed) {
      Swal.fire({title: 'Memproses...', allowOutsideClick: false, didOpen: () => Swal.showLoading()});
      try {
        const res = await server.shiftPeriod(newPeriod);
        if(res.status === 'success') {
          AppState.data.activePeriod = newPeriod; 
          Swal.fire('Berhasil!', res.message, 'success');
          renderSettings(document.getElementById('appContainer')); 
        } else {
          Swal.fire('Gagal', res.message, 'error');
        }
      } catch (e) { Swal.fire('Error', e.message, 'error'); }
    }
  })
}
