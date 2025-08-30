function renderParentDashboard(studentId) {
    const child = studentData.find(s => s.id === studentId);
    if (!child) return;

    // Update judul dan info anak
    document.getElementById('childProgressTitle').textContent = `Progress ${child.name}`;
    document.getElementById('childTahfidzProgress').textContent = child.tahfidzProgress !== null ? child.tahfidzProgress.toFixed(2) + '%' : 'N/A';
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
