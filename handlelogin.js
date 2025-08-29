function handleLogin(event) {
            event.preventDefault();
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            const loginMessage = document.getElementById('loginMessage');

            // Cek kredensial admin dan guru yang sudah ada
            if (username === 'admin' && password === 'admin123') {
                document.getElementById('currentUserName').textContent = 'Admin';
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
            } else if (username === 'guru' && password === 'guru123') {
                document.getElementById('currentUserName').textContent = 'Guru';
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
        
        function renderParentDashboard(studentId) {
            const child = studentData.find(s => s.id === studentId);
            if (!child) return;

            // Update judul dan info anak
            document.getElementById('childProgressTitle').textContent = `Progress ${child.name}`;
            document.getElementById('childTahsinScore').textContent = child.tahsinScore ? child.tahsinScore.toFixed(2) : 'N/A';
            document.getElementById('childTahfidzProgress').textContent = child.tahfidzProgress ? child.tahfidzProgress.toFixed(2) + '%' : 'N/A';
            document.getElementById('childClass').textContent = `Kelas: ${child.class}`;

            // Tampilkan aktivitas mengaji
            const activitiesContainer = document.getElementById('childActivities');
            activitiesContainer.innerHTML = '';
            const childJournals = journalEntries.filter(entry => entry.studentId === studentId);
            
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
