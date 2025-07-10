// API Configuration
const API_ENDPOINT = "https://vntwsfhnwj.execute-api.ap-south-1.amazonaws.com/prod";

// Check authentication on page load
window.onload = function() {
  const idToken = sessionStorage.getItem("idToken");
  
  if (!idToken) {
    // Redirect to login if not authenticated
    window.location.href = "index.html";
    return;
  }
  
  // Set today's date as default
  const dateField = document.getElementById("date");
  if (dateField) {
    dateField.value = new Date().toISOString().split('T')[0];
  }
  
  // Don't auto-generate expense ID - leave it empty for manual entry
  // Removed the auto-generation code
};

// Logout function
function logout() {
  // Clear all session data
  sessionStorage.clear();
  
  // Redirect to login page
  window.location.href = "index.html";
}

// ADD EXPENSE FUNCTIONALITY
document.addEventListener('DOMContentLoaded', function() {
  const addExpenseBtn = document.getElementById("addExpense");
  if (addExpenseBtn) {
    addExpenseBtn.onclick = function () {
      const expenseData = {
        expense_id: document.getElementById("expense_id").value.trim(),
        amount: parseFloat(document.getElementById("amount").value),
        purpose: document.getElementById("purpose").value.trim(),
        date: document.getElementById("date").value
      };

      // Validate required fields
      if (!expenseData.expense_id || !expenseData.amount || !expenseData.purpose || !expenseData.date) {
        showMessage("Please fill in all fields.", "error");
        return;
      }

      // Validate amount
      if (expenseData.amount <= 0) {
        showMessage("Amount must be greater than 0.", "error");
        return;
      }

      // Show loading state
      const addBtn = document.getElementById("addExpense");
      const originalText = addBtn.value;
      addBtn.value = "Adding...";
      addBtn.disabled = true;

      fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: sessionStorage.getItem("idToken")
        },
        body: JSON.stringify(expenseData)
      })
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          showMessage("Expense saved successfully!", "success");
          clearForm();
        })
        .catch(error => {
          console.error("Error saving expense:", error);
          showMessage("Failed to save expense. Please try again.", "error");
        })
        .finally(() => {
          // Reset button state
          addBtn.value = originalText;
          addBtn.disabled = false;
        });
    };
  }
});

// VIEW EXPENSES FUNCTIONALITY
document.addEventListener('DOMContentLoaded', function() {
  const viewExpensesBtn = document.getElementById("viewExpenses");
  if (viewExpensesBtn) {
    viewExpensesBtn.onclick = function () {
      const idToken = sessionStorage.getItem("idToken");
      
      if (!idToken) {
        alert("Please login first.");
        window.location.href = "index.html";
        return;
      }
      
      // Redirect to expenses page
      window.location.href = "expenses.html";
    };
  }
});

// LOGOUT FUNCTIONALITY
document.addEventListener('DOMContentLoaded', function() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.onclick = function () {
      if (confirm("Are you sure you want to logout?")) {
        logout();
      }
    };
  }
});

// Helper function to show messages
function showMessage(message, type) {
  const messageElement = document.getElementById("expenseSaved");
  if (messageElement) {
    messageElement.textContent = message;
    messageElement.style.display = "block";
    
    if (type === "success") {
      messageElement.style.background = "rgba(34, 197, 94, 0.1)";
      messageElement.style.color = "#16a34a";
      messageElement.style.border = "1px solid rgba(34, 197, 94, 0.2)";
    } else if (type === "error") {
      messageElement.style.background = "rgba(239, 68, 68, 0.1)";
      messageElement.style.color = "#dc2626";
      messageElement.style.border = "1px solid rgba(239, 68, 68, 0.2)";
    }
    
    // Hide message after 5 seconds
    setTimeout(() => {
      messageElement.style.display = "none";
    }, 5000);
  }
}

// Helper function to clear form
function clearForm() {
  const expenseIdField = document.getElementById("expense_id");
  const amountField = document.getElementById("amount");
  const purposeField = document.getElementById("purpose");
  const dateField = document.getElementById("date");
  
  // Clear expense ID field instead of auto-generating
  if (expenseIdField) expenseIdField.value = "";
  if (amountField) amountField.value = "";
  if (purposeField) purposeField.value = "";
  if (dateField) dateField.value = new Date().toISOString().split('T')[0];
}

// Handle Enter key press in form fields
document.addEventListener('keypress', function(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    const addExpenseBtn = document.getElementById("addExpense");
    if (addExpenseBtn) {
      addExpenseBtn.click();
    }
  }
});

// Validate amount input in real-time
document.addEventListener('DOMContentLoaded', function() {
  const amountField = document.getElementById("amount");
  if (amountField) {
    amountField.addEventListener('input', function() {
      const amount = parseFloat(this.value);
      if (amount < 0) {
        this.value = '';
        showMessage("Amount cannot be negative.", "error");
      }
    });
  }
});

// Auto-capitalize purpose field
document.addEventListener('DOMContentLoaded', function() {
  const purposeField = document.getElementById("purpose");
  if (purposeField) {
    purposeField.addEventListener('input', function() {
      this.value = this.value.charAt(0).toUpperCase() + this.value.slice(1);
    });
  }
});