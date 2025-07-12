const API_ENDPOINT_LIMIT = "https://xfwkju2t96.execute-api.ap-south-1.amazonaws.com/prod";

window.onload = function () {
    document.getElementById("submitLimit").onclick = function () {
        const month = document.getElementById("month").value;
        const limit = document.getElementById("limit").value;
        const feedback = document.getElementById("feedback");

        const token = sessionStorage.getItem("idToken");
        console.log("Token being sent:", token); // ✅ Check this in browser console

        if (!token) {
            alert("❌ You are not logged in. Please login again.");
            window.location.href = "index.html";
            return;
        }

        if (!month || !limit) {
            feedback.className = 'error';
            feedback.innerHTML = "Please enter both month and limit.";
            feedback.style.display = 'block';
            return;
        }

        feedback.className = 'loading';
        feedback.innerHTML = "⏳ Setting budget limit...";
        feedback.style.display = 'block';

        const requestData = { month, limit };

        fetch(API_ENDPOINT_LIMIT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token  // ✅ Must be present
            },
            body: JSON.stringify(requestData)
        })
        .then(response => {
            console.log("Response status:", response.status);
            return response.json();
        })
        .then(data => {
            console.log("Response data:", data);
            if (data.error) {
                feedback.className = 'error';
                feedback.innerHTML = `❌ ${data.error}`;
            } else {
                feedback.className = 'success';
                feedback.innerHTML = `
                    ✅ <strong>Limit set for ${data.month}</strong><br><br>
                    🔹 <strong>Monthly Limit:</strong> ₹${data.monthly_limit}<br>
                    🔹 <strong>Total Expenses:</strong> ₹${data.monthly_expense}<br>
                    🔹 <strong>Remaining Budget:</strong> ₹${data.remaining_budget}
                `;
            }
            feedback.style.display = 'block';
        })
        .catch(error => {
            console.error("Fetch error:", error);
            feedback.className = 'error';
            feedback.innerHTML = `❌ Error setting limit: ${error.message}`;
            feedback.style.display = 'block';
        });
    };
};
