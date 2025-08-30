const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyquWacoqOEbBkZMouWf_or_GmSDjsClqLmATVEExztus5eFYIbCe94lc1JXYUY_cCn/exec';

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
            method: 'POST', // Apps Script menggunakan POST untuk semua metode kustom
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
    }
}

// ===================== FUNGSI APLIKASI UTAMA =====================

// Fungsi untuk login
async function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const studentData = await fetchData('students');
    const user = studentData.find(s => s.waliUsername === username && s.waliPassword === password);

    if (user) {
        document.getElementById('loginModal').classList.add('hidden');
        document.getElementById('parentDashboard').classList.remove('hidden');
        document.getElementById('loggedInAs').textContent = user.name;
        renderParentDashboard(user.id);
    } else if (username === 'admin' && password === 'admin') {
        document.getElementById('loginModal').classList.add('hidden');
        document.getElementById('adminDashboard').classList.remove('hidden');
        document.getElementById('loggedInAs').textContent = 'Admin';
        renderStudentsTable();
        updateAchievementCounts();
    } else {
        alert('Login gagal. Periksa kembali username dan password.');
    }
}

// Fungsi untuk menampilkan dashboard wali murid
async function renderParentDashboard(studentId) {
    const studentData = await fetchData('students');
    const journalEntries = await fetchData('journals');
    
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

// Fungsi untuk merender tabel siswa (admin dashboard)
async function renderStudentsTable() {
    const studentData = await fetchData('students');
    const tableBody = document.getElementById('studentsTableBody');
    tableBody.innerHTML = '';

    if (studentData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-gray-500">Belum ada data siswa.</td></tr>';
        return;
    }

    studentData.forEach((student, index) => {
        const row = document.createElement('tr');
        row.className = 'bg-white border-b hover:bg-gray-50';
        row.innerHTML = `
            <td class="py-3 px-4">${student.id}</td>
            <td class="py-3 px-4">${student.nis}</td>
            <td class="py-3 px-4">${student.name}</td>
            <td class="py-3 px-4">${student.class}</td>
            <td class="py-3 px-4">${student.kibarAchievement || 'N/A'}</td>
            <td class="py-3 px-4">${student.juzTahfidz || 'N/A'}</td>
            <td class="py-3 px-4">${student.tahsinScore || 'N/A'}</td>
            <td class="py-3 px-4">${student.tahfidzProgress || 'N/A'}</td>
            <td class="py-3 px-4 text-right">
                <button onclick="showEditStudentModal(${student.id})" class="text-emerald-600 hover:text-emerald-900 text-sm">Edit</button>
                <button onclick="deleteStudent(${student.id})" class="text-red-600 hover:text-red-900 text-sm ml-2">Hapus</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Fungsi untuk menambah data siswa baru
async function addStudent(event) {
    event.preventDefault();

    const newStudent = {
        id: new Date().getTime(),
        nis: document.getElementById('addStudentNis').value,
        class: document.getElementById('addStudentClass').value,
        name: document.getElementById('addStudentName').value,
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

// Fungsi untuk menambah jurnal harian
async function addJournal(event) {
    event.preventDefault();
    const newJournal = {
        id: new Date().getTime(),
        studentId: document.getElementById('addJournalStudent').value,
        date: document.getElementById('addJournalDate').value,
        notes: document.getElementById('addJournalNotes').value,
        status: document.getElementById('addJournalStatus').value
    };

    await manageData('POST', 'journals', newJournal);
    hideAddJournalModal();
    renderStudentsTable();
}

// Fungsi untuk memperbarui data siswa (baru)
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

// Fungsi untuk menghapus data siswa (baru)
async function deleteStudent(studentId) {
    if (confirm("Apakah Anda yakin ingin menghapus siswa ini?")) {
        await manageData('DELETE', 'students', null, studentId);
        renderStudentsTable();
    }
}

// Fungsi untuk inisialisasi pada saat dokumen dimuat
document.addEventListener('DOMContentLoaded', async function() {
    await renderStudentsTable();
    updateStudentDropdowns();
});
