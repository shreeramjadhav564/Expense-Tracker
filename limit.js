const API_ENDPOINT_LIMIT = "https://xfwkju2t96.execute-api.ap-south-1.amazonaws.com/prod"; // Replace with your endpoint

        window.onload = function () {
            document.getElementById("submitLimit").onclick = function () {
                const month = document.getElementById("month").value;
                const limit = document.getElementById("limit").value;
                const feedback = document.getElementById("feedback");

                // Debug logging
                console.log("Month value:", month);
                console.log("Limit value:", limit);

                if (!month || !limit) {
                    feedback.className = 'error';
                    feedback.innerHTML = "Please enter both month and limit.";
                    feedback.style.display = 'block';
                    return;
                }

                // Show loading state
                feedback.className = 'loading';
                feedback.innerHTML = "⏳ Setting budget limit...";
                feedback.style.display = 'block';

                // Debug the request
                const requestData = { month, limit };
                console.log("Sending request:", requestData);

                fetch(API_ENDPOINT_LIMIT, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(requestData)
                })
                .then(response => {
                    console.log("Response status:", response.status);
                    console.log("Response headers:", response.headers);
                    return response.json();
                })
                .then(data => {
                    console.log("Response data:", data);
                    
                    if (!feedback) {
                        console.error("Feedback element not found.");
                        return;
                    }

                    if (data.error) {
                        feedback.className = 'error';
                        feedback.innerHTML = `❌ ${data.error}`;
                        feedback.style.display = 'block';
                    } else {
                        feedback.className = 'success';
                        feedback.innerHTML = `
                            ✅ <strong>Limit set for ${data.month}</strong><br><br>
                            🔹 <strong>Monthly Limit:</strong> ₹${data.monthly_limit}<br>
                            🔹 <strong>Total Expenses:</strong> ₹${data.monthly_expense}<br>
                            🔹 <strong>Remaining Budget:</strong> ₹${data.remaining_budget}
                        `;
                        feedback.style.display = 'block';
                    }
                })
                .catch(error => {
                    console.error("Fetch error:", error);
                    feedback.className = 'error';
                    feedback.innerHTML = `❌ Error setting limit: ${error.message}`;
                    feedback.style.display = 'block';
                });
            };
        };