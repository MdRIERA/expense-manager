// DOM Elements
const expenseForm = document.getElementById('expense-form');
const transactionList = document.getElementById('transaction-list');
const totalAmountElement = document.getElementById('total-amount');
const chartCanvas = document.getElementById('expensesChart');

// Edit Modal Elements
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-expense-form');
const editIdInput = document.getElementById('edit-id');
const editDescInput = document.getElementById('edit-description');
const editAmountInput = document.getElementById('edit-amount');
const editCategoryInput = document.getElementById('edit-category');
const editNotesInput = document.getElementById('edit-notes');
const editDateInput = document.getElementById('edit-date');

// Detail Modal Elements
const detailModal = document.getElementById('detail-modal');
const detailDesc = document.getElementById('detail-description');
const detailAmount = document.getElementById('detail-amount');
const detailCategory = document.getElementById('detail-category');
const detailDate = document.getElementById('detail-date');
const detailNotes = document.getElementById('detail-notes');

// State
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let globalChart;

// Configuration
const CATEGORY_CONFIG = {
    comida: { label: 'Comida', color: '#ff9f43' },
    tecnologia: { label: 'Tecnología', color: '#0abde3' },
    ropa: { label: 'Ropa', color: '#ff6b6b' },
    transporte: { label: 'Transporte', color: '#feca57' },
    hogar: { label: 'Hogar', color: '#1dd1a1' },
    ocio: { label: 'Ocio', color: '#5f27cd' },
    otros: { label: 'Otros', color: '#c8d6e5' }
};

// Format Currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
}

// Generate ID
function generateID() {
    return Math.floor(Math.random() * 100000000);
}

// Update Local Storage
function updateLocalStorage() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

// Add Expense
function addExpense(e) {
    e.preventDefault();

    const description = document.getElementById('description').value;
    const amount = +document.getElementById('amount').value;
    const category = document.getElementById('category').value;
    const notes = document.getElementById('notes').value;
    const date = document.getElementById('date').value;

    if (description.trim() === '' || amount === 0 || date === '') {
        alert('Por favor, rellena todos los campos correctamente');
        return;
    }

    const transaction = {
        id: generateID(),
        description,
        amount,
        category,
        notes,
        date
    };

    expenses.unshift(transaction);
    updateLocalStorage();
    init();

    expenseForm.reset();
    document.getElementById('date').valueAsDate = new Date();
}

// Edit Expense Functions
window.openEditModal = function (id) {
    const transaction = expenses.find(item => item.id === id);
    if (!transaction) return;

    editIdInput.value = transaction.id;
    editDescInput.value = transaction.description;
    editAmountInput.value = transaction.amount;
    editCategoryInput.value = transaction.category;
    editNotesInput.value = transaction.notes || '';
    editDateInput.value = transaction.date;

    editModal.classList.remove('hidden');
}

function updateExpense(e) {
    e.preventDefault();

    const id = +editIdInput.value;
    const index = expenses.findIndex(item => item.id === id);

    if (index === -1) return;

    expenses[index] = {
        id,
        description: editDescInput.value,
        amount: +editAmountInput.value,
        category: editCategoryInput.value,
        notes: editNotesInput.value,
        date: editDateInput.value
    };

    updateLocalStorage();
    init();
    closeModal();
}

// Detail Modal Function
window.openDetailModal = function (id) {
    const transaction = expenses.find(item => item.id === id);
    if (!transaction) return;

    detailDesc.innerText = transaction.description;
    detailAmount.innerText = formatCurrency(transaction.amount);
    detailCategory.innerText = CATEGORY_CONFIG[transaction.category]?.label || transaction.category;
    detailDate.innerText = transaction.date ? new Date(transaction.date).toLocaleDateString() : 'Sin fecha';
    detailNotes.innerText = transaction.notes || 'Sin notas adicionales.';

    detailModal.classList.remove('hidden');
}

// Modal Utilities
function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => modal.classList.add('hidden'));
}

window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        closeModal();
    }
}

// Remove Expense
window.removeExpense = function (id) {
    if (confirm('¿Seguro que quieres borrar este gasto?')) {
        expenses = expenses.filter(transaction => transaction.id !== id);
        updateLocalStorage();
        init();
    }
}

// Render Transaction List
function renderTransactions() {
    transactionList.innerHTML = '';

    if (expenses.length === 0) {
        transactionList.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-ghost"></i>
                <p>No hay gastos registrados aún</p>
            </div>
        `;
        return;
    }

    expenses.forEach(transaction => {
        const config = CATEGORY_CONFIG[transaction.category] || { color: '#ccc', label: transaction.category };
        const item = document.createElement('div');
        item.classList.add('transaction-item');
        item.style.borderLeft = `4px solid ${config.color}`;

        item.innerHTML = `
            <div class="t-info">
                <span class="t-desc">${transaction.description}</span>
                <div class="t-meta">
                    <span class="t-category" style="color:${config.color}">${config.label}</span>
                    <span class="t-date">${new Date(transaction.date).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="t-right">
                <button class="view-btn" onclick="openDetailModal(${transaction.id})" title="Ver Detalles">
                    <i class="fa-solid fa-eye"></i>
                </button>
                <button class="edit-btn" onclick="openEditModal(${transaction.id})" title="Editar">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="delete-btn" onclick="removeExpense(${transaction.id})" title="Eliminar">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;

        transactionList.appendChild(item);
    });
}

// Update Values (Total & Chart)
function updateValues() {
    const amounts = expenses.map(transaction => transaction.amount);
    const total = amounts.reduce((acc, item) => acc + item, 0);

    totalAmountElement.innerText = formatCurrency(total);
    updateGlobalChart();
}

// Update Global Chart
function updateGlobalChart() {
    const categories = {};
    expenses.forEach(transaction => {
        if (categories[transaction.category]) {
            categories[transaction.category] += transaction.amount;
        } else {
            categories[transaction.category] = transaction.amount;
        }
    });

    const labels = Object.keys(categories).map(key => CATEGORY_CONFIG[key]?.label || key);
    const backgroundColors = Object.keys(categories).map(key => CATEGORY_CONFIG[key]?.color || '#ccc');
    const data = Object.values(categories);

    if (globalChart) {
        globalChart.destroy();
    }

    globalChart = new Chart(chartCanvas, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: '#a0a0c0', font: { family: 'Inter' } }
                }
            },
            cutout: '70%'
        }
    });
}

// Init
function init() {
    renderTransactions();
    updateValues();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    expenseForm.addEventListener('submit', addExpense);
    editForm.addEventListener('submit', updateExpense);

    // Close Buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.onclick = function () {
            closeModal();
        }
    });

    document.getElementById('date').valueAsDate = new Date();
    init();
});
