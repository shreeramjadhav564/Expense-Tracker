window.onload = function () {
      const API_ENDPOINT = "https://vntwsfhnwj.execute-api.ap-south-1.amazonaws.com/prod";
      
      let allExpenses = [];
      let filteredExpenses = [];

      // Check if user is authenticated
      const idToken = sessionStorage.getItem("idToken");
      if (!idToken) {
        alert("Please login first.");
        window.location.href = "index.html";
        return;
      }

      // Load expenses on page load
      loadExpenses();

      // Search functionality
      document.getElementById("searchInput").addEventListener("input", function() {
        filterAndDisplayExpenses();
      });

      // Sort functionality
      document.getElementById("sortSelect").addEventListener("change", function() {
        filterAndDisplayExpenses();
      });

      // === LOAD ALL EXPENSES ===
      function loadExpenses() {
        document.getElementById("loadingMessage").style.display = "block";
        document.getElementById("expensesTable").style.display = "none";
        document.getElementById("noExpensesMessage").style.display = "none";
        document.getElementById("errorMessage").style.display = "none";

        const requestConfig = {
          method: "GET",
          headers: {
            "Authorization": idToken,
            "Content-Type": "application/json"
          }
        };

        fetch(API_ENDPOINT, requestConfig)
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            // Handle different response formats
            let expenses = [];
            if (Array.isArray(data)) {
              expenses = data;
            } else if (data && data.expenses && Array.isArray(data.expenses)) {
              expenses = data.expenses;
            } else if (data && data.body) {
              try {
                const bodyData = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
                expenses = Array.isArray(bodyData) ? bodyData : (bodyData.expenses || []);
              } catch (e) {
                expenses = [];
              }
            }
            
            allExpenses = expenses;
            filteredExpenses = [...allExpenses];
            
            document.getElementById("loadingMessage").style.display = "none";
            
            if (allExpenses.length === 0) {
              document.getElementById("noExpensesMessage").style.display = "block";
            } else {
              updateSummaryCards();
              filterAndDisplayExpenses();
              document.getElementById("expensesTable").style.display = "table";
            }
          })
          .catch(error => {
            console.error("Error loading expenses:", error);
            
            document.getElementById("loadingMessage").style.display = "none";
            document.getElementById("errorMessage").style.display = "block";
            document.getElementById("errorMessage").textContent = `Error loading expenses: ${error.message}`;
          });
      }

      // === UPDATE SUMMARY CARDS ===
      function updateSummaryCards() {
        const total = allExpenses.reduce((sum, expense) => {
          const amount = parseFloat(expense.amount || 0);
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
        
        const count = allExpenses.length;
        const average = count > 0 ? total / count : 0;

        document.getElementById("totalExpenses").textContent = `${total.toFixed(2)}`;
        document.getElementById("expenseCount").textContent = count;
        document.getElementById("averageExpense").textContent = `${average.toFixed(2)}`;
      }

      // === FILTER AND DISPLAY EXPENSES ===
      function filterAndDisplayExpenses() {
        const searchTerm = document.getElementById("searchInput").value.toLowerCase();
        const sortOption = document.getElementById("sortSelect").value;

        // Filter expenses based on search term
        filteredExpenses = allExpenses.filter(expense => {
          const purpose = (expense.purpose || "").toLowerCase();
          const expenseId = (expense.expense_id || expense.id || "").toLowerCase();
          return purpose.includes(searchTerm) || expenseId.includes(searchTerm);
        });

        // Sort expenses
        filteredExpenses.sort((a, b) => {
          switch (sortOption) {
            case "date-desc":
              return new Date(b.date || b.timestamp || 0) - new Date(a.date || a.timestamp || 0);
            case "date-asc":
              return new Date(a.date || a.timestamp || 0) - new Date(b.date || b.timestamp || 0);
            case "amount-desc":
              return parseFloat(b.amount || 0) - parseFloat(a.amount || 0);
            case "amount-asc":
              return parseFloat(a.amount || 0) - parseFloat(b.amount || 0);
            default:
              return 0;
          }
        });

        // Display filtered and sorted expenses
        displayExpenses();
      }

      // === DISPLAY EXPENSES IN TABLE ===
      function displayExpenses() {
        const tbody = document.getElementById("expenseTableBody");
        tbody.innerHTML = "";

        if (filteredExpenses.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="4" style="text-align: center; padding: 32px; color: #888;">
                No expenses match your search criteria.
              </td>
            </tr>
          `;
          return;
        }

        filteredExpenses.forEach(expense => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${expense.expense_id || expense.id || "N/A"}</td>
            <td class="amount-cell">$${parseFloat(expense.amount || 0).toFixed(2)}</td>
            <td>${expense.purpose || expense.description || "N/A"}</td>
            <td>${formatDate(expense.date || expense.timestamp)}</td>
          `;
          tbody.appendChild(row);
        });
      }

      // === FORMAT DATE ===
      function formatDate(dateString) {
        if (!dateString) return "N/A";
        
        try {
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return dateString;
          
          return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
          });
        } catch (error) {
          return dateString;
        }
      }

      // === GO BACK TO MAIN PAGE ===
      window.goBack = function() {
        window.location.href = "expense-tracker.html";
      };
    };