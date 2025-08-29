function handleLogin(event) {
            event.preventDefault();
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            const loginMessage = document.getElementById('loginMessage');

            // Cek kredensial admin dan guru yang sudah ada
            if (username === 'admin_tahfidz' && password === 'admin123') {
                document.getElementById('currentUserName').textContent = 'Admin Tahfidz';
                document.getElementById('adminTeacherDashboard').classList.remove('hidden');
                document.getElementById('parentDashboard').classList.add('hidden');
                document.getElementById('mainContent').classList.remove('hidden');
                document.getElementById('loginModal').classList.add('hidden');
                renderStudentsTable();
                updateStudentDropdowns();
                updateAchievementCounts();
                renderJournalEntries();
                renderExamSchedule();
                renderExamResults();
                renderRecentActivities();
                showTab('dashboard'); // Tampilkan dashboard utama
            } else if (username === 'guru_tahfidz' && password === 'guru123') {
                document.getElementById('currentUserName').textContent = 'Guru Tahfidz';
                document.getElementById('adminTeacherDashboard').classList.remove('hidden');
                document.getElementById('parentDashboard').classList.add('hidden');
                document.getElementById('mainContent').classList.remove('hidden');
                document.getElementById('loginModal').classList.add('hidden');
                renderStudentsTable();
                updateStudentDropdowns();
                updateAchievementCounts();
                renderJournalEntries();
                renderExamSchedule();
                renderExamResults();
                renderRecentActivities();
                showTab('dashboard'); // Tampilkan dashboard utama
            } else if (username === 'walimurid') {
                const child = studentData.find(s => s.nis === password);
                if (child) {
                    document.getElementById('currentUserName').textContent = 'Wali Murid';
                    document.getElementById('adminTeacherDashboard').classList.add('hidden');
                    document.getElementById('parentDashboard').classList.remove('hidden');
                    document.getElementById('mainContent').classList.remove('hidden');
                    document.getElementById('loginModal').classList.add('hidden');
                    renderParentDashboard(child.id);
                } else {
                    loginMessage.textContent = 'NIS tidak ditemukan.';
                    loginMessage.classList.remove('hidden');
                }
            } else {
                loginMessage.textContent = 'Nama pengguna atau kata sandi salah.';
                loginMessage.classList.remove('hidden');
            }
        }
