const API_ENDPOINT_EXPENSES = "https://vntwsfhnwj.execute-api.ap-south-1.amazonaws.com/prod"; // GET expenses
const API_ENDPOINT_LIMITS = "https://xfwkju2t96.execute-api.ap-south-1.amazonaws.com/prod";   // GET limits

const idToken = sessionStorage.getItem("idToken");

if (!idToken) {
  alert("User not authenticated. Please log in.");
  window.location.href = "login.html";
}

// Load expenses when page loads
window.onload = function () {
  loadExpenses();
};

// Fetch & render all expenses
function loadExpenses() {
  fetch(API_ENDPOINT_EXPENSES, {
    method: "GET",
    headers: {
      Authorization: idToken,
    }
  })
    .then(response => {
      if (!response.ok) throw new Error("Failed to load expenses");
      return response.json();
    })
    .then(data => {
      displayExpenses(data);
      renderChart(data);
      showSummary(data);
    })
    .catch(error => {
      console.error("Error loading expenses:", error);
      alert("Unable to load expenses. Please log in again.");
    });
}

// Display list of expenses
function displayExpenses(expenses) {
  const list = document.getElementById("expenseList");
  list.innerHTML = "";

  expenses.forEach(exp => {
    const li = document.createElement("li");
    li.textContent = `📅 ${exp.date} | 💰 ₹${exp.amount} | 📝 ${exp.purpose}`;
    list.appendChild(li);
  });
}

// Filter expenses by month and/or purpose
function filterExpenses() {
  const keyword = document.getElementById("searchInput").value.toLowerCase();
  const month = document.getElementById("monthFilter").value;

  fetch(API_ENDPOINT_EXPENSES, {
    method: "GET",
    headers: {
      Authorization: idToken,
    }
  })
    .then(res => res.json())
    .then(data => {
      let filtered = data;

      if (keyword) {
        filtered = filtered.filter(exp => exp.purpose.toLowerCase().includes(keyword));
      }

      if (month) {
        filtered = filtered.filter(exp => exp.date.startsWith(month));
      }

      displayExpenses(filtered);
      renderChart(filtered);
      showSummary(filtered, month);
    })
    .catch(err => {
      console.error("Error filtering:", err);
    });
}

// Render bar chart of monthly totals
function renderChart(expenses) {
  const ctx = document.getElementById("expenseChart").getContext("2d");

  const monthlyTotals = {};
  expenses.forEach(e => {
    const month = e.date.substring(0, 7);
    monthlyTotals[month] = (monthlyTotals[month] || 0) + parseFloat(e.amount);
  });

  const labels = Object.keys(monthlyTotals);
  const values = Object.values(monthlyTotals);

  if (window.barChart) window.barChart.destroy();

  window.barChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Monthly Expenses (₹)',
        data: values,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// Show summary of current/selected month vs. limit
function showSummary(expenses, selectedMonth = null) {
  const box = document.getElementById("summaryBox");

  if (!selectedMonth) {
    const now = new Date();
    selectedMonth = now.toISOString().substring(0, 7);
  }

  const monthlyExpenses = expenses
    .filter(e => e.date.startsWith(selectedMonth))
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);

  fetch(API_ENDPOINT_LIMITS, {
    method: "GET",
    headers: {
      Authorization: idToken
    }
  })
    .then(response => {
      if (!response.ok) throw new Error("Failed to fetch limits");
      return response.json();
    })
    .then(limitData => {
      const monthLimit = limitData.find(entry => entry.month === selectedMonth);
      const limit = monthLimit ? parseFloat(monthLimit.limit) : null;

      let html = `📅 Month: <strong>${selectedMonth}</strong><br/>`;
      html += `💸 Total Expenses: <strong>₹${monthlyExpenses.toFixed(2)}</strong><br/>`;

      if (limit !== null) {
        const remaining = limit - monthlyExpenses;
        const color = remaining < 0 ? 'red' : 'green';
        html += `🧾 Budget Limit: ₹${limit.toFixed(2)}<br/>`;
        html += `📉 Remaining Budget: <strong style="color:${color}">₹${remaining.toFixed(2)}</strong>`;
      } else {
        html += `⚠️ No limit set for this month.`;
      }

      box.innerHTML = html;
    })
    .catch(err => {
      console.error("Limit fetch failed", err);
      box.innerHTML = `📅 Month: ${selectedMonth}<br/>💸 Total Expenses: ₹${monthlyExpenses.toFixed(2)}<br/>⚠️ Unable to fetch budget limit.`;
    });
}
