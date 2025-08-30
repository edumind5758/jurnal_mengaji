const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyquWacoqOEbBkZMouWf_or_GmSDjsClqLmATVEExztus5eFYIbCe94lc1JXYUY_cCn/exec';

// Daftar pengguna dan peran (roles)
const users = {
    // Admin/Guru
    'admin': { password: 'admin123', role: 'admin' },
    'guru': { password: 'guru123', role: 'admin' },
    // Orang Tua (contoh: 'orangtua_nama_santri' dengan password berupa NIS santri)
    'orangtua_budi': { password: '101', role: 'parent', studentName: 'Budi Santoso' },
    'orangtua_siti': { password: '202', role: 'parent', studentName: 'Siti Rahayu' }
};

const sheets = {
    students: 'Santri',
    journals: 'Jurnal',
    exams: 'JadwalUjian',
    examResults: 'HasilUjian'
};

let allStudents = [];
let allJournals = [];
let allExams = [];
let allExamResults = [];

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

// Render data untuk dashboard guru
function renderAdminDashboard() {
    renderStudentsTable(allStudents);
    renderJournalsList();
    renderExamsList();
    renderExamResultsList();
}

// Render data untuk dashboard orang tua
function renderParentDashboard(studentName) {
    const student = allStudents.find(s => s.Nama === studentName);
    if (!student) {
        document.getElementById('parentStudentName').textContent = 'Data santri tidak ditemukan.';
        document.getElementById('parentStudentNis').textContent = '';
        document.getElementById('parentJournalsList').innerHTML = '';
        document.getElementById('parentExamResultsList').innerHTML = '';
        return;
    }

    document.getElementById('parentStudentName').textContent = `Nama Santri: ${student.Nama}`;
    document.getElementById('parentStudentNis').textContent = `NIS: ${student.NIS}`;
    
    // Filter jurnal dan hasil ujian berdasarkan nama santri
    const studentJournals = allJournals.filter(j => j.NamaSantri === studentName);
    const studentExamResults = allExamResults.filter(r => r.NamaSantri === studentName);

    // Render jurnal anak
    const parentJournalsList = document.getElementById('parentJournalsList');
    parentJournalsList.innerHTML = '';
    studentJournals.forEach(journal => {
        const journalCard = document.createElement('div');
        journalCard.className = 'bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200';
        journalCard.innerHTML = `
            <h3 class="text-lg font-semibold text-gray-800">${journal.Tanggal}</h3>
            <p class="text-sm text-gray-700 mt-1">${journal.Aktivitas}</p>
        `;
        parentJournalsList.appendChild(journalCard);
    });

    // Render hasil ujian anak
    const parentExamResultsList = document.getElementById('parentExamResultsList');
    parentExamResultsList.innerHTML = '';
    studentExamResults.forEach(result => {
        const resultCard = document.createElement('div');
        resultCard.className = 'bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200';
        resultCard.innerHTML = `
            <h3 class="text-lg font-semibold text-gray-800">${result.Ujian}</h3>
            <p class="text-sm text-gray-700 mt-1">Nilai: ${result.Nilai}</p>
        `;
        parentExamResultsList.appendChild(resultCard);
    });
}

// --- FUNGSI LOGIN DAN TAMPILAN DASHBOARD ---
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const loginMessage = document.getElementById('loginMessage');

    const user = users[username];
    if (user && user.password === password) {
        loginMessage.classList.add('hidden');
        localStorage.setItem('loggedIn', 'true');
        localStorage.setItem('username', username);
        localStorage.setItem('role', user.role);
        if (user.studentName) {
            localStorage.setItem('studentName', user.studentName);
        }
        initApp();
    } else {
        loginMessage.textContent = 'Username atau password salah.';
        loginMessage.classList.remove('hidden');
    }
});

function logout() {
    localStorage.clear();
    location.reload();
}
document.getElementById('logoutBtn').addEventListener('click', logout);

async function initApp() {
    document.getElementById('loginModal').classList.add('hidden');
    document.getElementById('mainContent').classList.remove('hidden');
    
    await fetchDataAndRender();
}

async function fetchDataAndRender() {
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('username');
    const studentName = localStorage.getItem('studentName');

    document.getElementById('welcomeMessage').textContent = `Selamat datang, ${username}!`;

    // Sembunyikan semua tab
    document.getElementById('studentsTabBtn').classList.add('hidden');
    document.getElementById('journalsTabBtn').classList.add('hidden');
    document.getElementById('examsTabBtn').classList.add('hidden');
    document.getElementById('examResultsTabBtn').classList.add('hidden');
    document.getElementById('parentViewBtn').classList.add('hidden');

    if (role === 'admin') {
        document.getElementById('studentsTabBtn').classList.remove('hidden');
        document.getElementById('journalsTabBtn').classList.remove('hidden');
        document.getElementById('examsTabBtn').classList.remove('hidden');
        document.getElementById('examResultsTabBtn').classList.remove('hidden');
        await fetchData();
        renderAdminDashboard();
        showTab('dashboard');
    } else if (role === 'parent' && studentName) {
        document.getElementById('parentViewBtn').classList.remove('hidden');
        await fetchData();
        renderParentDashboard(studentName);
        showTab('parent-view');
    } else {
        // Fallback jika role tidak valid
        showTab('dashboard');
    }
}

// --- FUNGSI TAMPILAN TAB ---
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', function() {
        const tab = this.dataset.tab;
        showTab(tab);
    });
});

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('text-emerald-600', 'bg-emerald-50', 'font-semibold');
        btn.classList.add('text-gray-600');
    });
    document.getElementById(tabId + '-tab').classList.remove('hidden');
    document.querySelector(`.tab-btn[data-tab="${tabId}"]`).classList.add('text-emerald-600', 'bg-emerald-50', 'font-semibold');
    
    // Render data untuk tab yang aktif
    const role = localStorage.getItem('role');
    if (role === 'admin') {
        renderAdminDashboard();
    } else if (role === 'parent') {
        renderParentDashboard(localStorage.getItem('studentName'));
    }
}

// --- FUNGSI LAINNYA ---
// (Fungsi renderStudentsTable, showAddStudentModal, deleteStudent, dll. tetap sama)

// Student functions
function renderStudentsTable(students) {
    const tableBody = document.getElementById('studentsTableBody');
    tableBody.innerHTML = '';
    students.forEach((student, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${index + 1}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${student.Nama}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${student.NIS}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${student.Kelas}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="editStudent(${student.id})" class="text-indigo-600 hover:text-indigo-900 mr-2">Edit</button>
                <button onclick="deleteStudent(${student.id})" class="text-red-600 hover:text-red-900">Hapus</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}
        
function showAddStudentModal(studentId = null) {
    const modal = document.getElementById('addStudentModal');
    const form = document.getElementById('studentForm');
    const title = document.getElementById('studentModalTitle');
    form.reset();
            
    if (studentId) {
        const student = allStudents.find(s => s.id === studentId);
        if (student) {
            title.textContent = 'Edit Santri';
            document.getElementById('studentId').value = student.id;
            document.getElementById('studentName').value = student.Nama;
            document.getElementById('studentNis').value = student.NIS;
            document.getElementById('studentClass').value = student.Kelas;
            document.getElementById('studentTahsinScore').value = student.NilaiTahsin;
            document.getElementById('studentTahfidzProgress').value = student.ProgresTahfidz;
        }
    } else {
        title.textContent = 'Tambah Santri';
        document.getElementById('studentId').value = '';
    }
    modal.classList.remove('hidden');
}

function hideAddStudentModal() {
    document.getElementById('addStudentModal').classList.add('hidden');
}

document.getElementById('studentForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const studentId = document.getElementById('studentId').value;
    const newStudent = {
        Nama: document.getElementById('studentName').value,
        NIS: document.getElementById('studentNis').value,
        Kelas: document.getElementById('studentClass').value,
        NilaiTahsin: document.getElementById('studentTahsinScore').value,
        ProgresTahfidz: document.getElementById('studentTahfidzProgress').value
    };
            
    let response;
    if (studentId) {
        // Update Student
        response = await manageData('PUT', sheets.students, newStudent, studentId);
    } else {
        // Add New Student
        response = await manageData('POST', sheets.students, newStudent);
    }

    if (response.status === 'success') {
        hideAddStudentModal();
        await fetchDataAndRender();
    } else {
        alert('Gagal menyimpan data: ' + response.message);
    }
});

async function deleteStudent(studentId) {
    if (confirm('Apakah Anda yakin ingin menghapus santri ini?')) {
        const response = await manageData('DELETE', sheets.students, {}, studentId);
        if (response.status === 'success') {
            await fetchDataAndRender();
        } else {
            alert('Gagal menghapus data: ' + response.message);
        }
    }
}

document.getElementById('studentSearchInput').addEventListener('keyup', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filteredStudents = allStudents.filter(student => 
        student.Nama.toLowerCase().includes(searchTerm) || 
        student.NIS.toString().includes(searchTerm)
    );
    renderStudentsTable(filteredStudents);
});

// Journal functions
function renderJournalsList() {
    const journalsList = document.getElementById('journalsList');
    journalsList.innerHTML = '';
            
    const sortedJournals = allJournals.sort((a, b) => new Date(b.Tanggal) - new Date(a.Tanggal));

    sortedJournals.forEach(journal => {
        const journalCard = document.createElement('div');
        journalCard.className = 'bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200';
        journalCard.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <p class="text-sm font-medium text-gray-500">Santri: ${journal.NamaSantri}</p>
                    <h3 class="text-xl font-semibold text-gray-800">${journal.Tanggal}</h3>
                </div>
            </div>
            <p class="mt-2 text-gray-700">${journal.Aktivitas}</p>
            <div class="flex justify-end mt-4 space-x-2">
                <button onclick="deleteJournal(${journal.id})" class="text-red-500 text-sm hover:underline">Hapus</button>
            </div>
        `;
        journalsList.appendChild(journalCard);
    });
}
        
function showAddJournalModal() {
    updateStudentDropdowns();
    document.getElementById('addJournalModal').classList.remove('hidden');
}

function hideAddJournalModal() {
    document.getElementById('addJournalModal').classList.add('hidden');
    document.getElementById('addJournalModal').querySelector('form').reset();
}

document.getElementById('journalForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const newJournal = {
        NamaSantri: document.getElementById('journalStudentName').value,
        Tanggal: document.getElementById('journalDate').value,
        Aktivitas: document.getElementById('journalActivities').value
    };
            
    const response = await manageData('POST', sheets.journals, newJournal);
    if (response.status === 'success') {
        hideAddJournalModal();
        await fetchDataAndRender();
    } else {
        alert('Gagal menambahkan jurnal: ' + response.message);
    }
});

async function deleteJournal(journalId) {
    if (confirm('Apakah Anda yakin ingin menghapus jurnal ini?')) {
        const response = await manageData('DELETE', sheets.journals, {}, journalId);
        if (response.status === 'success') {
            await fetchDataAndRender();
        } else {
            alert('Gagal menghapus jurnal: ' + response.message);
        }
    }
}

// Exam functions
function renderExamsList() {
    const examsList = document.getElementById('examsList');
    examsList.innerHTML = '';
            
    const sortedExams = allExams.sort((a, b) => new Date(a.Tanggal) - new Date(b.Tanggal));

    sortedExams.forEach(exam => {
        const examCard = document.createElement('div');
        examCard.className = 'bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200';
        examCard.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="text-xl font-semibold text-gray-800">${exam.Judul}</h3>
                    <p class="text-sm font-medium text-gray-500">${exam.Tanggal} at ${exam.Waktu}</p>
                </div>
            </div>
            <div class="flex justify-end mt-4 space-x-2">
                <button onclick="deleteExam(${exam.id})" class="text-red-500 text-sm hover:underline">Hapus</button>
            </div>
        `;
        examsList.appendChild(examCard);
    });
}
        
function showAddExamModal() {
    document.getElementById('addExamModal').classList.remove('hidden');
}

function hideAddExamModal() {
    document.getElementById('addExamModal').classList.add('hidden');
    document.getElementById('addExamModal').querySelector('form').reset();
}

document.getElementById('examForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const newExam = {
        Judul: document.getElementById('examTitle').value,
        Tanggal: document.getElementById('examDate').value,
        Waktu: document.getElementById('examTime').value
    };
            
    const response = await manageData('POST', sheets.exams, newExam);
    if (response.status === 'success') {
        hideAddExamModal();
        await fetchDataAndRender();
    } else {
        alert('Gagal menambahkan jadwal ujian: ' + response.message);
    }
});

async function deleteExam(examId) {
    if (confirm('Apakah Anda yakin ingin menghapus jadwal ujian ini?')) {
        const response = await manageData('DELETE', sheets.exams, {}, examId);
        if (response.status === 'success') {
            await fetchDataAndRender();
        } else {
            alert('Gagal menghapus jadwal ujian: ' + response.message);
        }
    }
}
        
// Exam Results functions
function renderExamResultsList() {
    const examResultsList = document.getElementById('examResultsList');
    examResultsList.innerHTML = '';
            
    const sortedResults = allExamResults.sort((a, b) => {
        const dateA = allJournals.find(j => j.NamaSantri === a.NamaSantri)?.Tanggal || '0';
        const dateB = allJournals.find(j => j.NamaSantri === b.NamaSantri)?.Tanggal || '0';
        return new Date(dateB) - new Date(dateA);
    });

    sortedResults.forEach(result => {
        const resultCard = document.createElement('div');
        resultCard.className = 'bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200';
        resultCard.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <p class="text-sm font-medium text-gray-500">Santri: ${result.NamaSantri}</p>
                    <h3 class="text-xl font-semibold text-gray-800">${result.Ujian}</h3>
                </div>
            </div>
            <p class="mt-2 text-gray-700">Nilai: ${result.Nilai}</p>
            <div class="flex justify-end mt-4 space-x-2">
                <button onclick="deleteExamResult(${result.id})" class="text-red-500 text-sm hover:underline">Hapus</button>
            </div>
        `;
        examResultsList.appendChild(resultCard);
    });
}
        
function showAddExamResultModal() {
    updateStudentDropdowns();
    document.getElementById('addExamResultModal').classList.remove('hidden');
}
        
function hideAddExamResultModal() {
    document.getElementById('addExamResultModal').classList.add('hidden');
    document.getElementById('addExamResultModal').querySelector('form').reset();
}

document.getElementById('examResultForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const newResult = {
        NamaSantri: document.getElementById('examResultStudentName').value,
        Ujian: document.getElementById('examName').value,
        Nilai: document.getElementById('examScore').value
    };
            
    const response = await manageData('POST', sheets.examResults, newResult);
    if (response.status === 'success') {
        hideAddExamResultModal();
        await fetchDataAndRender();
    } else {
        alert('Gagal menambahkan hasil ujian: ' + response.message);
    }
});

async function deleteExamResult(resultId) {
    if (confirm('Apakah Anda yakin ingin menghapus hasil ujian ini?')) {
        const response = await manageData('DELETE', sheets.examResults, {}, resultId);
        if (response.status === 'success') {
            await fetchDataAndRender();
        } else {
            alert('Gagal menghapus hasil ujian: ' + response.message);
        }
    }
}

// Helper function
function updateStudentDropdowns() {
    const studentDropdowns = [
        document.getElementById('journalStudentName'), 
        document.getElementById('examResultStudentName')
    ];
    
    studentDropdowns.forEach(dropdown => {
        dropdown.innerHTML = '';
        allStudents.forEach(student => {
            const option = document.createElement('option');
            option.value = student.Nama;
            option.textContent = student.Nama;
            dropdown.appendChild(option);
        });
    });
}

// Inisialisasi aplikasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    const isLoggedIn = localStorage.getItem('loggedIn');
    if (isLoggedIn === 'true') {
        initApp();
    } else {
        document.getElementById('loginModal').classList.remove('hidden');
        document.getElementById('mainContent').classList.add('hidden');
    }
});
