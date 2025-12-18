  const searchInput = document.getElementById('teacherSearch');
const filterSelect = document.getElementById('teacherFilter');
const table = document.querySelector('.teacher-table tbody');

searchInput.addEventListener('keyup', filterTable);
filterSelect.addEventListener('change', filterTable);

function filterTable() {
    const filterValue = searchInput.value.toLowerCase();
    const filterColumn = filterSelect.value;
    const rows = table.querySelectorAll('tr');

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        let text = '';

        if (filterColumn === 'all') {
            text = Array.from(cells).map(cell => cell.textContent.toLowerCase()).join(' ');
        } else if (filterColumn === 'name') {
            text = cells[0].textContent.toLowerCase();
        } else if (filterColumn === 'email') {
            text = cells[1].textContent.toLowerCase();
        } else if (filterColumn === 'department') {
            text = cells[2].textContent.toLowerCase();
        } else if (filterColumn === 'status') {
            text = cells[3].textContent.toLowerCase();
        }

        row.style.display = text.includes(filterValue) ? '' : 'none';
    });
}
 