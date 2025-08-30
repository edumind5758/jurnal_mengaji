function updateStudent(event) {
    event.preventDefault();
    const index = document.getElementById('editStudentId').value;
    const nis = document.getElementById('editStudentNis').value;
    const studentClass = document.getElementById('editStudentClass').value;
    const name = document.getElementById('editStudentName').value;
    const kibarAchievement = document.getElementById('editStudentKibar').value;
    const juzTahfidz = document.getElementById('editStudentJuz').value;

    const tahsinInput = document.getElementById('editStudentTahsin').value;
    const tahfidzInput = document.getElementById('editStudentTahfidz').value;

    // Bagian ini yang penting: Cek jika input kosong
    const tahsinScore = tahsinInput === '' ? null : parseFloat(tahsinInput);
    const tahfidzProgress = tahfidzInput === '' ? null : parseFloat(tahfidzInput);

    studentData[index].nis = nis;
    studentData[index].class = studentClass;
    studentData[index].name = name;
    studentData[index].kibarAchievement = kibarAchievement;
    studentData[index].juzTahfidz = juzTahfidz;
    studentData[index].tahsinScore = tahsinScore; // Nilai bisa null
    studentData[index].tahfidzProgress = tahfidzProgress; // Nilai bisa null

    localStorage.setItem('studentData', JSON.stringify(studentData));
    renderStudentsTable();
    updateAchievementCounts();
    hideEditStudentModal();
}
