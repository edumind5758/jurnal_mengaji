const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyquWacoqOEbBkZMouWf_or_GmSDjsClqLmATVEExztus5eFYIbCe94lc1JXYUY_cCn/exec';

// Global variables to store data
let studentData = [];
let journalEntries = [];
let examSchedule = [];
let examResults = [];

// Fungsi untuk mengambil data dari Google Sheet
async function fetchData(sheetName) {
    const url = `${SCRIPT_URL}?sheet=${sheetName}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Could not fetch data:", error);
        return [];
    }
}

// Fungsi untuk mengirim/memperbarui/menghapus data ke Google Sheet
async function manageData(method, sheetName, data, id = null) {
    const url = SCRIPT_URL;
    try {
        const payload = { method, sheet: sheetName, data };
        if (id) payload.id = id;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        console.log("Response from server:", result);
        return result;
    } catch (error) {
        console.error("Could not manage data:", error);
        throw error;
    }
}

// Fungsi untuk menangani login
async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const waliData = await fetchData('parents');
    const adminData = await fetchData('admins');

    const admin = adminData.find(u => u.username === username && u.password === password);
    const wali = waliData.find(u => u.username === username && u.password === password);

    if (admin) {
        document.getElementById('loggedInAs').textContent = `Admin`;
        document.getElementById('loginModal').classList.add('hidden');
        document.getElementById('mainContent').classList.remove('hidden');
        document.getElementById('adminDashboard').classList.remove('hidden');
        document.getElementById('parentDashboard').classList.add('hidden');
        
        await renderStudentsTable();
        updateStudentDropdowns();
    } else if (wali) {
        document.getElementById('loggedInAs').textContent = `Wali Murid`;
        document.getElementById('loginModal').classList.add('hidden');
        document.getElementById('mainContent').classList.remove('hidden');
        document.getElementById('adminDashboard').classList.add('hidden');
        document.getElementById('parentDashboard').classList.remove('hidden');
        
        const student = studentData.find(s => s.waliUsername === username);
        if (student) {
            renderParentDashboard(student.id);
        } else {
            document.getElementById('childProgressTitle').textContent = `Data Anak Tidak Ditemukan`;
        }
    } else {
        alert("Username atau Password salah.");
    }
}

// Fungsi untuk merender tabel siswa di dashboard admin
async function renderStudentsTable() {
    studentData = await fetchData('students');
    const tableBody = document.getElementById('studentsTableBody');
    tableBody.innerHTML = '';

    if (studentData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-gray-500">Belum ada data siswa.</td></tr>`;
        return;
    }

    studentData.forEach(student => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition-colors duration-100';
        row.innerHTML = `
            <td class="py-3 px-4">${student.id}</td>
            <td class="py-3 px-4">${student.nis}</td>
            <td class="py-3 px-4">${student.name}</td>
            <td class="py-3 px-4">${student.class}</td>
            <td class="py-3 px-4">${student.kibarAchievement || 'N/A'}</td>
            <td class="py-3 px-4">${student.juzTahfidz || 'N/A'}</td>
            <td class="py-3 px-4">${student.tahsinScore || 'N/A'}</td>
            <td class="py-3 px-4">${student.tahfidzProgress || 'N/A'}</td>
            <td class="py-3 px-4 text-right space-x-2">
                <button onclick="showEditStudentModal(${student.id})" class="text-blue-600 hover:text-blue-800 transition-colors duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-7-9l5 5m-5-5l5 5m-2-12l4 4a2 2 0 010 2l-7 7-3 1 1-3 7-7a2 2 0 012 0z" /></svg>
                </button>
                <button onclick="deleteStudent(${student.id})" class="text-red-600 hover:text-red-800 transition-colors duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Fungsi untuk merender dashboard wali murid
async function renderParentDashboard(studentId) {
    journalEntries = await fetchData('journals');
    const child = studentData.find(s => s.id === studentId);
    if (!child) return;

    document.getElementById('childProgressTitle').textContent = `Progress ${child.name}`;
    document.getElementById('childKibarAchievement').textContent = child.kibarAchievement || 'N/A';
    document.getElementById('childTahfidzProgress').textContent = child.tahfidzProgress !== null ? child.tahfidzProgress.toFixed(2) + '%' : 'N/A';
    document.getElementById('childClass').textContent = `Kelas: ${child.class}`;

    const activitiesContainer = document.getElementById('childActivities');
    activitiesContainer.innerHTML = '';
    const childJournals = journalEntries.filter(entry => entry.studentId == studentId);
    
    if (childJournals.length === 0) {
        activitiesContainer.innerHTML = '<p class="text-center text-gray-500">Belum ada jurnal harian.</p>';
        return;
    }

    childJournals.forEach(entry => {
        const activityDiv = document.createElement('div');
        activityDiv.className = 'bg-gray-100 p-4 rounded-lg shadow-sm flex items-start space-x-3 fade-in';
        activityDiv.innerHTML = `
            <span class="text-2xl">${entry.status === 'Selesai' ? '✅' : '⏳'}</span>
            <div>
                <p class="text-sm font-semibold text-gray-800">${entry.date}</p>
                <p class="text-sm text-gray-700 mt-1">${entry.notes}</p>
            </div>
        `;
        activitiesContainer.appendChild(activityDiv);
    });
}

// Fungsi untuk memperbarui dropdown siswa
async function updateStudentDropdowns() {
    studentData = await fetchData('students');
    const dropdowns = document.querySelectorAll('.student-dropdown');
    dropdowns.forEach(dropdown => {
        dropdown.innerHTML = '<option value="" disabled selected>Pilih Siswa</option>';
        studentData.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = student.name;
            dropdown.appendChild(option);
        });
    });
}

// Fungsi untuk menambahkan siswa baru
async function addStudent(event) {
    event.preventDefault();

    const newStudent = {
        id: Date.now(),
        nis: document.getElementById('addStudentNis').value,
        name: document.getElementById('addStudentName').value,
        class: document.getElementById('addStudentClass').value,
        kibarAchievement: document.getElementById('addStudentKibar').value,
        juzTahfidz: document.getElementById('addStudentJuz').value,
        tahsinScore: document.getElementById('addStudentTahsin').value,
        tahfidzProgress: document.getElementById('addStudentTahfidz').value,
        waliUsername: document.getElementById('addStudentWaliUsername').value,
        waliPassword: document.getElementById('addStudentWaliPassword').value
    };

    await manageData('POST', 'students', newStudent);
    hideAddStudentModal();
    renderStudentsTable();
}

// Fungsi untuk memperbarui data siswa
async function updateStudent(event) {
    event.preventDefault();

    const studentId = document.getElementById('editStudentId').value;
    const updatedStudent = {
        id: studentId,
        nis: document.getElementById('editStudentNis').value,
        class: document.getElementById('editStudentClass').value,
        name: document.getElementById('editStudentName').value,
        kibarAchievement: document.getElementById('editStudentKibar').value,
        juzTahfidz: document.getElementById('editStudentJuz').value,
        tahsinScore: document.getElementById('editStudentTahsin').value,
        tahfidzProgress: document.getElementById('editStudentTahfidz').value
    };

    await manageData('PUT', 'students', updatedStudent, studentId);

    hideEditStudentModal();
    renderStudentsTable();
}

// Fungsi untuk menghapus data siswa
async function deleteStudent(studentId) {
    if (confirm("Apakah Anda yakin ingin menghapus siswa ini?")) {
        await manageData('DELETE', 'students', null, studentId);
        renderStudentsTable();
    }
}

// Fungsi untuk menambahkan jurnal harian
async function addJournal(event) {
    event.preventDefault();

    const newJournal = {
        id: Date.now(),
        studentId: document.getElementById('addJournalStudent').value,
        date: document.getElementById('addJournalDate').value,
        notes: document.getElementById('addJournalNotes').value,
        status: document.getElementById('addJournalStatus').value
    };

    await manageData('POST', 'journals', newJournal);
    hideAddJournalModal();
    renderStudentsTable();
}

// Fungsi untuk menambahkan jadwal ujian
async function addExam(event) {
    event.preventDefault();
    const newExam = {
        id: Date.now(),
        date: document.getElementById('addExamDate').value,
        type: document.getElementById('addExamType').value,
        notes: document.getElementById('addExamNotes').value
    };
    await manageData('POST', 'examschedule', newExam);
    hideAddExamModal();
    alert("Jadwal ujian berhasil ditambahkan!");
}

// Fungsi untuk menambahkan hasil ujian
async function addExamResult(event) {
    event.preventDefault();
    const newResult = {
        id: Date.now(),
        studentId: document.getElementById('addExamResultStudent').value,
        type: document.getElementById('addExamResultType').value,
        score: document.getElementById('addExamResultScore').value,
        notes: document.getElementById('addExamResultNotes').value
    };
    await manageData('POST', 'examresults', newResult);
    hideAddExamResultModal();
    alert("Hasil ujian berhasil ditambahkan!");
}

// Fungsi untuk menampilkan/menyembunyikan modal
function showAddStudentModal() { document.getElementById('addStudentModal').classList.remove('hidden'); }
function hideAddStudentModal() { document.getElementById('addStudentModal').classList.add('hidden'); document.getElementById('addStudentForm').reset(); }
async function showEditStudentModal(studentId) {
    const student = studentData.find(s => s.id == studentId);
    if (student) {
        document.getElementById('editStudentId').value = student.id;
        document.getElementById('editStudentNis').value = student.nis;
        document.getElementById('editStudentClass').value = student.class;
        document.getElementById('editStudentName').value = student.name;
        document.getElementById('editStudentKibar').value = student.kibarAchievement;
        document.getElementById('editStudentJuz').value = student.juzTahfidz;
        document.getElementById('editStudentTahsin').value = student.tahsinScore;
        document.getElementById('editStudentTahfidz').value = student.tahfidzProgress;
        document.getElementById('editStudentModal').classList.remove('hidden');
    }
}
function hideEditStudentModal() { document.getElementById('editStudentModal').classList.add('hidden'); }
function showAddJournalModal() { updateStudentDropdowns(); document.getElementById('addJournalModal').classList.remove('hidden'); }
function hideAddJournalModal() { document.getElementById('addJournalModal').classList.add('hidden'); document.getElementById('addJournalForm').reset(); }
function showAddExamModal() { document.getElementById('addExamModal').classList.remove('hidden'); }
function hideAddExamModal() { document.getElementById('addExamModal').classList.add('hidden'); document.getElementById('addExamForm').reset(); }
function showAddExamResultModal() { updateStudentDropdowns(); document.getElementById('addExamResultModal').classList.remove('hidden'); }
function hideAddExamResultModal() { document.getElementById('addExamResultModal').classList.add('hidden'); document.getElementById('addExamResultForm').reset(); }

// Fungsi untuk logout
function logout() {
    document.getElementById('loginModal').classList.remove('hidden');
    document.getElementById('mainContent').classList.add('hidden');
    document.getElementById('loginForm').reset();
}

// Inisialisasi aplikasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', async function() {
    // Memuat data awal saat halaman dimuat
    studentData = await fetchData('students');
    journalEntries = await fetchData('journals');
    
    // Asumsi: tidak ada data ujian di sini, karena hanya admin yang menambahkannya.
});
