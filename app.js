const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwhA_cxbHt7zW4L3q6ODqiiYbb2rkdeU5j15GmUGTsmUrfecDklCX5hDw_N8crPUHco/exec';
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

// Variabel global untuk menyimpan data
let studentData = [];
let journalEntries = [];
let examSchedule = [];
let examResults = [];

// Fungsi untuk login
async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const loginMessage = document.getElementById('loginMessage');

    try {
        // Ambil data siswa dari Google Sheets
        studentData = await fetchData('students');
        
        // Cek kredensial admin dan guru
        if (username === 'admin_tahfidz' && password === 'admin123') {
            document.getElementById('currentUserName').textContent = 'Admin Tahfidz';
            document.getElementById('adminTeacherDashboard').classList.remove('hidden');
            document.getElementById('parentDashboard').classList.add('hidden');
            document.getElementById('mainContent').classList.remove('hidden');
            document.getElementById('loginModal').classList.add('hidden');
            
            // Ambil data lainnya
            journalEntries = await fetchData('journals');
            examSchedule = await fetchData('exams');
            examResults = await fetchData('exam_results');
            
            // Render semua data
            renderStudentsTable();
            updateStudentDropdowns();
            updateAchievementCounts();
            renderJournalEntries();
            renderExamSchedule();
            renderExamResults();
            renderRecentActivities();
            showTab('dashboard');
            
        } else if (username === 'guru_tahfidz' && password === 'guru123') {
            document.getElementById('currentUserName').textContent = 'Guru Tahfidz';
            document.getElementById('adminTeacherDashboard').classList.remove('hidden');
            document.getElementById('parentDashboard').classList.add('hidden');
            document.getElementById('mainContent').classList.remove('hidden');
            document.getElementById('loginModal').classList.add('hidden');
            
            // Ambil data lainnya
            journalEntries = await fetchData('journals');
            examSchedule = await fetchData('exams');
            examResults = await fetchData('exam_results');
            
            // Render semua data
            renderStudentsTable();
            updateStudentDropdowns();
            updateAchievementCounts();
            renderJournalEntries();
            renderExamSchedule();
            renderExamResults();
            renderRecentActivities();
            showTab('dashboard');
            
        } else {
            // Cek kredensial wali murid
            const child = studentData.find(s => s.waliUsername === username && s.waliPassword === password);
            if (child) {
                document.getElementById('currentUserName').textContent = 'Wali Murid';
                document.getElementById('adminTeacherDashboard').classList.add('hidden');
                document.getElementById('parentDashboard').classList.remove('hidden');
                document.getElementById('mainContent').classList.remove('hidden');
                document.getElementById('loginModal').classList.add('hidden');
                
                // Ambil data jurnal untuk anak
                journalEntries = await fetchData('journals');
                renderParentDashboard(child.id);
            } else {
                loginMessage.textContent = 'Nama pengguna atau kata sandi salah.';
                loginMessage.classList.remove('hidden');
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        loginMessage.textContent = 'Terjadi kesalahan saat login. Silakan coba lagi.';
        loginMessage.classList.remove('hidden');
    }
}

// Fungsi untuk menampilkan dashboard wali murid
async function renderParentDashboard(studentId) {
    const child = studentData.find(s => s.id == studentId);
    if (!child) {
        console.error('Student not found with ID:', studentId);
        return;
    }

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

// Fungsi untuk merender tabel siswa
function renderStudentsTable(filteredStudents = studentData) {
    const tableBody = document.getElementById('studentsTable');
    tableBody.innerHTML = '';

    if (studentData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-gray-500">Belum ada data siswa.</td></tr>';
        return;
    }

    filteredStudents.forEach((student) => {
        const tahsinScore = student.tahsinScore ? student.tahsinScore.toFixed(2) : 'N/A';
        const tahfidzProgress = student.tahfidzProgress ? student.tahfidzProgress.toFixed(2) + '%' : 'N/A';
        const row = document.createElement('tr');
        row.className = 'bg-white border-b hover:bg-gray-50';
        row.innerHTML = `
            <td class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">${student.nis}</td>
            <td class="px-6 py-4">${student.name}</td>
            <td class="px-6 py-4">${student.class}</td>
            <td class="px-6 py-4">${tahsinScore}</td>
            <td class="px-6 py-4">${student.juzTahfidz || 'N/A'}</td>
            <td class="px-6 py-4">${student.kibarAchievement || 'N/A'}</td>
            <td class="px-6 py-4">${tahfidzProgress}</td>
            <td class="px-6 py-4">${student.status || 'Aktif'}</td>
            <td class="px-6 py-4 text-right space-x-2">
                <button onclick="editStudent('${student.id}')" class="font-medium text-blue-600 hover:underline">Edit</button>
                <button onclick="deleteStudent('${student.id}')" class="font-medium text-red-600 hover:underline">Hapus</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Fungsi untuk mengupdate dropdown siswa
function updateStudentDropdowns() {
    const studentSelects = document.querySelectorAll('#journalStudentIdInput, #examStudentIdInput');
    studentSelects.forEach(select => {
        select.innerHTML = '<option value="">Pilih Santri</option>';
        studentData.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = `${student.name} (${student.nis})`;
            select.appendChild(option);
        });
    });
}

// Fungsi untuk mengupdate statistik pencapaian
function updateAchievementCounts() {
    const alQuranCount = studentData.filter(s => s.kibarAchievement === 'Al Quran').length;
    const kibarACount = studentData.filter(s => s.kibarAchievement === 'Kibar A').length;
    const kibarBCount = studentData.filter(s => s.kibarAchievement === 'Kibar B').length;
    const kibarCCount = studentData.filter(s => s.kibarAchievement === 'Kibar C').length;
    
    document.getElementById('totalStudents').textContent = studentData.length;
    document.getElementById('alQuranCount').textContent = alQuranCount;
    document.getElementById('kibarACount').textContent = kibarACount;
    document.getElementById('kibarBCount').textContent = kibarBCount;
    document.getElementById('kibarCCount').textContent = kibarCCount;
}

// Fungsi untuk menambah data siswa baru
async function addStudent(event) {
    event.preventDefault();

    const newStudent = {
        id: new Date().getTime(),
        nis: document.getElementById('studentNisInput').value,
        class: document.getElementById('studentClassInput').value,
        name: document.getElementById('studentNameInput').value,
        kibarAchievement: document.getElementById('studentKibarInput').value,
        juzTahfidz: document.getElementById('studentJuzInput').value,
        tahsinScore: document.getElementById('studentTahsinScoreInput').value || null,
        tahfidzProgress: document.getElementById('studentTahfidzProgressInput').value || null,
        waliUsername: document.getElementById('studentWaliUsername').value,
        waliPassword: document.getElementById('studentWaliPassword').value,
        status: 'Aktif'
    };

    try {
        await manageData('POST', 'students', newStudent);
        studentData.push(newStudent);
        renderStudentsTable();
        updateStudentDropdowns();
        updateAchievementCounts();
        hideAddStudentModal();
        alert('Siswa berhasil ditambahkan!');
    } catch (error) {
        console.error('Error adding student:', error);
        alert('Gagal menambahkan siswa. Silakan coba lagi.');
    }
}

// Fungsi untuk mengedit data siswa
async function editStudent(studentId) {
    const student = studentData.find(s => s.id == studentId);
    if (!student) {
        alert('Siswa tidak ditemukan!');
        return;
    }

    document.getElementById('editStudentId').value = student.id;
    document.getElementById('editStudentNis').value = student.nis;
    document.getElementById('editStudentClass').value = student.class;
    document.getElementById('editStudentName').value = student.name;
    document.getElementById('editStudentKibar').value = student.kibarAchievement;
    document.getElementById('editStudentJuz').value = student.juzTahfidz;
    document.getElementById('editStudentTahsin').value = student.tahsinScore || '';
    document.getElementById('editStudentTahfidz').value = student.tahfidzProgress || '';
    
    showEditStudentModal();
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
        tahsinScore: document.getElementById('editStudentTahsin').value ? parseFloat(document.getElementById('editStudentTahsin').value) : null,
        tahfidzProgress: document.getElementById('editStudentTahfidz').value ? parseFloat(document.getElementById('editStudentTahfidz').value) : null
    };

    try {
        await manageData('PUT', 'students', updatedStudent, studentId);
        // Update data lokal
        const index = studentData.findIndex(s => s.id == studentId);
        if (index !== -1) {
            studentData[index] = {...studentData[index], ...updatedStudent};
        }
        renderStudentsTable();
        updateAchievementCounts();
        hideEditStudentModal();
        alert('Data siswa berhasil diperbarui!');
    } catch (error) {
        console.error('Error updating student:', error);
        alert('Gagal memperbarui data siswa. Silakan coba lagi.');
    }
}

// Fungsi untuk menghapus data siswa
async function deleteStudent(studentId) {
    if (!confirm("Apakah Anda yakin ingin menghapus siswa ini?")) return;
    try {
        await manageData('DELETE', 'students', null, studentId);
        // Hapus dari data lokal
        studentData = studentData.filter(s => s.id != studentId);
        renderStudentsTable();
        updateStudentDropdowns();
        updateAchievementCounts();
        alert('Siswa berhasil dihapus!');
    } catch (error) {
        console.error('Error deleting student:', error);
        alert('Gagal menghapus siswa. Silakan coba lagi.');
    }
}

// Fungsi untuk menambah jurnal harian
async function addJournal(event) {
    event.preventDefault();
    const newJournal = {
        id: new Date().getTime(),
        studentId: document.getElementById('journalStudentIdInput').value,
        date: document.getElementById('journalDateInput').value,
        notes: document.getElementById('journalNotesInput').value,
        status: 'Selesai' // Default status
    };

    try {
        await manageData('POST', 'journals', newJournal);
        journalEntries.push(newJournal);
        renderJournalEntries();
        renderRecentActivities();
        hideAddJournalModal();
        alert('Jurnal berhasil ditambahkan!');
    } catch (error) {
        console.error('Error adding journal:', error);
        alert('Gagal menambahkan jurnal. Silakan coba lagi.');
    }
}

// Fungsi untuk menambah jadwal ujian
async function addExam(event) {
    event.preventDefault();
    const newExam = {
        id: new Date().getTime(),
        title: document.getElementById('examTitleInput').value,
        date: document.getElementById('examDateInput').value,
        time: document.getElementById('examTimeInput').value
    };

    try {
        await manageData('POST', 'exams', newExam);
        examSchedule.push(newExam);
        renderExamSchedule();
        renderRecentActivities();
        hideAddExamModal();
        alert('Jadwal ujian berhasil ditambahkan!');
    } catch (error) {
        console.error('Error adding exam:', error);
        alert('Gagal menambahkan jadwal ujian. Silakan coba lagi.');
    }
}

// Fungsi untuk menambah hasil ujian
async function addExamResult(event) {
    event.preventDefault();
    const newResult = {
        id: new Date().getTime(),
        studentId: document.getElementById('examStudentIdInput').value,
        examName: document.getElementById('examNameInput').value,
        score: document.getElementById('examScoreInput').value,
        notes: document.getElementById('examResultNotesInput').value
    };

    try {
        await manageData('POST', 'exam_results', newResult);
        examResults.push(newResult);
        renderExamResults();
        renderRecentActivities();
        hideAddExamResultModal();
        alert('Hasil ujian berhasil ditambahkan!');
    } catch (error) {
        console.error('Error adding exam result:', error);
        alert('Gagal menambahkan hasil ujian. Silakan coba lagi.');
    }
}

// Fungsi untuk logout
function logout() {
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginMessage').classList.add('hidden');
    document.getElementById('mainContent').classList.add('hidden');
    document.getElementById('adminTeacherDashboard').classList.add('hidden');
    document.getElementById('parentDashboard').classList.add('hidden');
    document.getElementById('loginModal').classList.remove('hidden');
    
    // Reset data
    studentData = [];
    journalEntries = [];
    examSchedule = [];
    examResults = [];
}

// Fungsi untuk menampilkan tab
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('border-emerald-500', 'text-emerald-600', 'hover:text-emerald-800');
        btn.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700');
    });
    
    document.getElementById(`content-${tabId}`).classList.remove('hidden');
    document.getElementById(`tab-${tabId}`).classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700');
    document.getElementById(`tab-${tabId}`).classList.add('border-emerald-500', 'text-emerald-600', 'hover:text-emerald-800');
}

// Fungsi untuk merender entri jurnal
function renderJournalEntries() {
    const journalEntriesContainer = document.getElementById('journalEntries');
    journalEntriesContainer.innerHTML = '';
    const sortedJournals = journalEntries.sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedJournals.forEach(entry => {
        const student = studentData.find(s => s.id == entry.studentId);
        const studentName = student ? student.name : 'Santri Tidak Dikenal';
        const card = document.createElement('div');
        card.className = 'bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200 fade-in';
        card.innerHTML = `
            <p class="text-sm font-medium text-gray-500">Santri: ${studentName}</p>
            <h3 class="text-xl font-semibold text-gray-800">${entry.date}</h3>
            <p class="mt-2 text-gray-700">${entry.notes}</p>
            <div class="flex justify-end mt-4 space-x-2">
                <button onclick="deleteJournal('${entry.id}')" class="text-red-500 text-sm hover:underline">Hapus</button>
            </div>
        `;
        journalEntriesContainer.appendChild(card);
    });
}

// Fungsi untuk menghapus jurnal
async function deleteJournal(journalId) {
    if (!confirm("Apakah Anda yakin ingin menghapus jurnal ini?")) return;
    try {
        await manageData('DELETE', 'journals', null, journalId);
        journalEntries = journalEntries.filter(entry => entry.id != journalId);
        renderJournalEntries();
        alert('Jurnal berhasil dihapus!');
    } catch (error) {
        console.error('Error deleting journal:', error);
        alert('Gagal menghapus jurnal. Silakan coba lagi.');
    }
}

// Fungsi untuk merender jadwal ujian
function renderExamSchedule() {
    const examScheduleContainer = document.getElementById('examSchedule');
    examScheduleContainer.innerHTML = '';
    const sortedExams = examSchedule.sort((a, b) => new Date(a.date) - new Date(b.date));

    sortedExams.forEach(exam => {
        const card = document.createElement('div');
        card.className = 'bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200 fade-in';
        card.innerHTML = `
            <h3 class="text-xl font-semibold text-gray-800">${exam.title}</h3>
            <p class="text-sm font-medium text-gray-500">${exam.date} at ${exam.time}</p>
            <div class="flex justify-end mt-4 space-x-2">
                <button onclick="deleteExam('${exam.id}')" class="text-red-500 text-sm hover:underline">Hapus</button>
            </div>
        `;
        examScheduleContainer.appendChild(card);
    });
}

// Fungsi untuk menghapus jadwal ujian
async function deleteExam(examId) {
    if (!confirm("Apakah Anda yakin ingin menghapus jadwal ujian ini?")) return;
    try {
        await manageData('DELETE', 'exams', null, examId);
        examSchedule = examSchedule.filter(exam => exam.id != examId);
        renderExamSchedule();
        alert('Jadwal ujian berhasil dihapus!');
    } catch (error) {
        console.error('Error deleting exam:', error);
        alert('Gagal menghapus jadwal ujian. Silakan coba lagi.');
    }
}

// Fungsi untuk merender hasil ujian
function renderExamResults() {
    const examResultsContainer = document.getElementById('examResults');
    examResultsContainer.innerHTML = '';
    const sortedResults = examResults.sort((a, b) => {
        const studentA = studentData.find(s => s.id == a.studentId);
        const studentB = studentData.find(s => s.id == b.studentId);
        const nameA = studentA ? studentA.name : '';
        const nameB = studentB ? studentB.name : '';
        return nameA.localeCompare(nameB);
    });
    
    sortedResults.forEach(result => {
        const student = studentData.find(s => s.id == result.studentId);
        const studentName = student ? student.name : 'Santri Tidak Dikenal';
        const card = document.createElement('div');
        card.className = 'bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200 fade-in';
        card.innerHTML = `
            <p class="text-sm font-medium text-gray-500">Santri: ${studentName}</p>
            <h3 class="text-xl font-semibold text-gray-800">${result.examName}</h3>
            <p class="mt-2 text-gray-700">Nilai: ${result.score}</p>
            <div class="flex justify-end mt-4 space-x-2">
                <button onclick="deleteExamResult('${result.id}')" class="text-red-500 text-sm hover:underline">Hapus</button>
            </div>
        `;
        examResultsContainer.appendChild(card);
    });
}

// Fungsi untuk menghapus hasil ujian
async function deleteExamResult(resultId) {
    if (!confirm("Apakah Anda yakin ingin menghapus hasil ujian ini?")) return;
    try {
        await manageData('DELETE', 'exam_results', null, resultId);
        examResults = examResults.filter(result => result.id != resultId);
        renderExamResults();
        alert('Hasil ujian berhasil dihapus!');
    } catch (error) {
        console.error('Error deleting exam result:', error);
        alert('Gagal menghapus hasil ujian. Silakan coba lagi.');
    }
}

// Fungsi untuk merender aktivitas terbaru
function renderRecentActivities() {
    const recentActivitiesContainer = document.getElementById('recentActivities');
    recentActivitiesContainer.innerHTML = '';
    const allActivities = [
        ...journalEntries.map(j => ({ type: 'Jurnal', date: j.date, description: `Jurnal ${j.date}` })),
        ...examResults.map(r => ({ type: 'Hasil Ujian', date: r.date, description: `Hasil Ujian ${r.examName}` })),
        ...examSchedule.map(e => ({ type: 'Jadwal Ujian', date: e.date, description: `Jadwal Ujian ${e.title}` }))
    ];

    const sortedActivities = allActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
    const recent = sortedActivities.slice(0, 5); // Tampilkan 5 aktivitas terbaru

    if (recent.length === 0) {
        recentActivitiesContainer.innerHTML = '<div class="text-center text-gray-500 text-sm">Belum ada aktivitas.</div>';
        return;
    }

    recent.forEach(activity => {
        const activityDiv = document.createElement('div');
        activityDiv.className = 'bg-gray-100 p-2 rounded-md';
        activityDiv.innerHTML = `
            <p class="text-sm font-medium">${activity.type}</p>
            <p class="text-xs text-gray-600">${activity.description}</p>
        `;
        recentActivitiesContainer.appendChild(activityDiv);
    });
}

// Fungsi modal
function showAddStudentModal() {
    document.getElementById('addStudentModal').classList.remove('hidden');
}

function hideAddStudentModal() {
    document.getElementById('addStudentModal').classList.add('hidden');
}

function showAddJournalModal() {
    updateStudentDropdowns();
    document.getElementById('addJournalModal').classList.remove('hidden');
}

function hideAddJournalModal() {
    document.getElementById('addJournalModal').classList.add('hidden');
    document.getElementById('addJournalModal').querySelector('form').reset();
}

function showAddExamModal() {
    document.getElementById('addExamModal').classList.remove('hidden');
}

function hideAddExamModal() {
    document.getElementById('addExamModal').classList.add('hidden');
    document.getElementById('addExamModal').querySelector('form').reset();
}

function showAddExamResultModal() {
    updateStudentDropdowns();
    document.getElementById('addExamResultModal').classList.remove('hidden');
}

function hideAddExamResultModal() {
    document.getElementById('addExamResultModal').classList.add('hidden');
    document.getElementById('addExamResultModal').querySelector('form').reset();
}

// Event listener
document.getElementById('loginForm').addEventListener('submit', handleLogin);
document.getElementById('logoutButton').addEventListener('click', logout);
document.getElementById('studentForm').addEventListener('submit', addStudent);
document.getElementById('editStudentForm').addEventListener('submit', updateStudent);
document.getElementById('journalForm').addEventListener('submit', addJournal);
document.getElementById('examForm').addEventListener('submit', addExam);
document.getElementById('examResultForm').addEventListener('submit', addExamResult);
document.getElementById('studentSearchInput').addEventListener('keyup', filterStudents);
document.getElementById('classFilter').addEventListener('change', filterStudents);

// Inisialisasi
function initApp() {
    document.getElementById('mainContent').classList.remove('hidden');
    document.getElementById('loginModal').classList.add('hidden');
    fetchDataAndRender();
}

async function fetchDataAndRender() {
    studentData = await fetchData('students');
    journalEntries = await fetchData('journals');
    examSchedule = await fetchData('exams');
    examResults = await fetchData('exam_results');
    
    renderStudentsTable();
    updateStudentDropdowns();
    updateAchievementCounts();
    renderJournalEntries();
    renderExamSchedule();
    renderExamResults();
    renderRecentActivities();
    showTab('dashboard');
}

function filterStudents() {
    const searchTerm = document.getElementById('studentSearchInput').value.toLowerCase();
    const classFilter = document.getElementById('classFilter').value;
    const filtered = studentData.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm) || student.nis.toLowerCase().includes(searchTerm);
        const matchesClass = classFilter ? student.class === classFilter : true;
        return matchesSearch && matchesClass;
    });
    renderStudentsTable(filtered);
}

document.addEventListener('DOMContentLoaded', () => {
    // Di sini, Anda bisa menambahkan logika untuk mengecek apakah user sudah login atau belum,
    // tapi untuk saat ini, kita akan langsung menampilkan modal login.
    document.getElementById('loginModal').classList.remove('hidden');
});
