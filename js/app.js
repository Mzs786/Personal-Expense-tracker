class ExpenseTracker {
  constructor() {
      this.state = {
          budget: 0,
          expenses: [],
          totalSpent: 0,
          remaining: 0
      };
      this.chart = null;
      this.init();
  }

  init() {
      this.loadFromLocalStorage();
      this.setupEventListeners();
      this.initChart();
      this.render();
  }

  setupEventListeners() {
      document.getElementById('setBudget').addEventListener('click', () => this.setBudget());
      document.getElementById('expenseForm').addEventListener('submit', (e) => this.addExpense(e));
      document.getElementById('expensesContainer').addEventListener('click', (e) => this.handleExpenseActions(e));
      window.addEventListener('resize', () => this.drawChart());
  }

  validateNumber(input) {
      const value = parseFloat(input);
      return !isNaN(value) && value > 0;
  }

  setBudget() {
      const budgetInput = document.getElementById('budgetInput');
      const budgetValue = budgetInput.value.trim();

      if (!this.validateNumber(budgetValue)) {
          this.showAlert('Please enter a valid budget amount', 'danger');
          return;
      }

      this.state.budget = parseFloat(budgetValue);
      this.calculateTotals();
      this.saveToLocalStorage();
      this.render();
      budgetInput.value = '';
      this.showAlert('Budget set successfully!', 'success');
  }

  addExpense(e) {
      e.preventDefault();
      
      if (this.state.budget <= 0) {
          this.showAlert('Please set a budget first!', 'danger');
          return;
      }

      const name = document.getElementById('expenseName').value.trim();
      const amountInput = document.getElementById('expenseAmount').value.trim();

      if (!name || !this.validateNumber(amountInput)) {
          this.showAlert('Please enter valid expense details', 'danger');
          return;
      }

      const amount = parseFloat(amountInput);

      this.state.expenses.push({ 
          name, 
          amount, 
          id: Date.now(),
          date: new Date().toLocaleDateString('en-IN')
      });
      
      this.calculateTotals();
      this.saveToLocalStorage();
      this.render();
      e.target.reset();
      this.showAlert('Expense added successfully!', 'success');
  }

  handleExpenseActions(e) {
      if (e.target.classList.contains('delete-btn')) {
          const id = parseInt(e.target.closest('li').dataset.id);
          this.deleteExpense(id);
      }
  }

  deleteExpense(id) {
      this.state.expenses = this.state.expenses.filter(exp => exp.id !== id);
      this.calculateTotals();
      this.saveToLocalStorage();
      this.render();
      this.showAlert('Expense deleted!', 'warning');
  }

  calculateTotals() {
      this.state.totalSpent = this.state.expenses.reduce((sum, exp) => sum + exp.amount, 0);
      this.state.remaining = this.state.budget - this.state.totalSpent;
      this.updateProgressBar();
  }

  updateProgressBar() {
      const progressBar = document.getElementById('budgetProgress');
      const percentage = this.state.budget > 0 
          ? (this.state.totalSpent / this.state.budget) * 100 
          : 0;
      progressBar.style.width = `${percentage}%`;
      progressBar.textContent = `${percentage.toFixed(1)}% Spent`;
  }

  render() {
      this.renderBudget();
      this.renderExpenses();
      this.renderSummary();
      this.drawChart();
  }

  renderBudget() {
      document.querySelector('.budget-display').textContent = 
          `Current Budget: ₹${this.state.budget.toLocaleString('en-IN')}`;
      document.getElementById('totalBudget').textContent = 
          `₹${this.state.budget.toLocaleString('en-IN')}`;
  }

  renderExpenses() {
      const list = document.getElementById('expensesContainer').querySelector('ul');
      list.innerHTML = this.state.expenses.map(exp => `
          <li class="list-group-item expense-item d-flex justify-content-between align-items-center" 
              data-id="${exp.id}">
              <div class="expense-details">
                  <span class="expense-name fw-bold">${exp.name}</span>
                  <small class="text-muted d-block">${exp.date}</small>
              </div>
              <div class="expense-amount">
                  <span class="badge bg-primary rounded-pill fs-6">
                      ₹${exp.amount.toLocaleString('en-IN')}
                  </span>
                  <button class="btn btn-danger btn-sm delete-btn ms-2">
                  <img src="images/trash-can.png" alt="Delete" class="trash-icon">
                  </button>
              </div>
          </li>
      `).join('');
  }

  renderSummary() {
      document.getElementById('remainingBudget').textContent = 
          `₹${this.state.remaining.toLocaleString('en-IN')}`;
      document.getElementById('totalSpent').textContent = 
          `₹${this.state.totalSpent.toLocaleString('en-IN')}`;
      
      const remainingEl = document.getElementById('remainingBudget');
      remainingEl.parentElement.className = 
          `alert alert-${this.state.remaining < 0 ? 'danger' : 'success'}`;
  }

  initChart() {
      google.charts.load('current', { 
          packages: ['corechart'],
          callback: () => this.drawChart()
      });
  }

  drawChart() {
      const container = document.getElementById('expenseChart');
      container.innerHTML = '';

      if (this.state.expenses.length === 0) {
          container.innerHTML = '<p class="text-center text-muted">Add expenses to see the chart</p>';
          return;
      }

      const data = new google.visualization.DataTable();
      data.addColumn('string', 'Expense');
      data.addColumn('number', 'Amount');
      
      this.state.expenses.forEach(exp => {
          data.addRow([exp.name, exp.amount]);
      });

      const options = {
          title: 'Expense Distribution',
          is3D: true,
          backgroundColor: 'transparent',
          titleTextStyle: { 
              color: '#2c3e50',
              fontSize: 18
          },
          legend: { 
              position: 'labeled', 
              textStyle: { 
                  color: '#2c3e50',
                  fontSize: 14
              } 
          },
          chartArea: {
              width: '90%',
              height: '80%'
          },
          pieSliceText: 'value',
          tooltip: { 
              showColorCode: true 
          }
      };

      this.chart = new google.visualization.PieChart(container);
      this.chart.draw(data, options);
  }

  saveToLocalStorage() {
      localStorage.setItem('expenseTrackerState', JSON.stringify(this.state));
  }

  loadFromLocalStorage() {
      const savedState = localStorage.getItem('expenseTrackerState');
      if (savedState) {
          this.state = JSON.parse(savedState);
          this.calculateTotals();
      }
  }

  showAlert(message, type) {
      const alert = document.createElement('div');
      alert.className = `alert alert-${type} alert-dismissible fade show`;
      alert.innerHTML = `
          ${message}
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      `;
      
      const container = document.getElementById('alertContainer');
      container.appendChild(alert);
      
      setTimeout(() => alert.remove(), 3000);
  }
}

// Initialize Application
new ExpenseTracker();