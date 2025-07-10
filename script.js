// AWS Cognito Configuration
const REGION = "ap-south-1";
const USER_POOL_ID = "ap-south-1_Rpt02l1z7";
const CLIENT_ID = "5nemt4bm5c7ekpngqsj7nob8lo";
const COGNITO_ENDPOINT = `https://cognito-idp.${REGION}.amazonaws.com/`;

const headers = {
  "Content-Type": "application/x-amz-json-1.1",
  "X-Amz-Target": "AWSCognitoIdentityProviderService"
};

// Check if user is already logged in
window.onload = function() {
  // If user has valid token, redirect to expense tracker
  if (sessionStorage.getItem("idToken")) {
    window.location.href = "expense-tracker.html";
    return;
  }
  
  // Otherwise show login page
  document.getElementById("authSection").style.display = "block";
  document.getElementById("verifySection").style.display = "none";
  
  // Reset to login tab
  document.getElementById('loginTab').classList.add('active');
  document.getElementById('signupTab').classList.remove('active');
  document.getElementById('login-section').style.display = 'block';
  document.getElementById('signup-section').style.display = 'none';
  
  // Clear any status messages
  document.getElementById('authStatus').innerText = '';
};

// Tab switching functionality
document.getElementById('loginTab').addEventListener('click', function() {
  document.getElementById('loginTab').classList.add('active');
  document.getElementById('signupTab').classList.remove('active');
  document.getElementById('login-section').style.display = 'block';
  document.getElementById('signup-section').style.display = 'none';
  document.getElementById('authStatus').innerText = '';
});

document.getElementById('signupTab').addEventListener('click', function() {
  document.getElementById('signupTab').classList.add('active');
  document.getElementById('loginTab').classList.remove('active');
  document.getElementById('signup-section').style.display = 'block';
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('authStatus').innerText = '';
});

// SIGNUP FUNCTIONALITY
document.getElementById("signupBtn").onclick = function () {
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  if (!email || !password) {
    document.getElementById("authStatus").innerText = "Please fill in all fields.";
    return;
  }

  fetch(COGNITO_ENDPOINT, {
    method: "POST",
    headers: { ...headers, "X-Amz-Target": "AWSCognitoIdentityProviderService.SignUp" },
    body: JSON.stringify({
      ClientId: CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [{ Name: "email", Value: email }]
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.userSub) {
        document.getElementById("authSection").style.display = "none";
        document.getElementById("verifySection").style.display = "block";
        document.getElementById("verifyEmail").value = email;
        sessionStorage.setItem("signupEmail", email);
      } else if (data.__type === "UsernameExistsException") {
        document.getElementById("authStatus").innerText = "User already exists. Please login instead.";
        // Switch to login tab
        document.getElementById('loginTab').classList.add('active');
        document.getElementById('signupTab').classList.remove('active');
        document.getElementById('login-section').style.display = 'block';
        document.getElementById('signup-section').style.display = 'none';
      } else {
        document.getElementById("authStatus").innerText = data.message || "Signup failed.";
      }
    })
    .catch(error => {
      document.getElementById("authStatus").innerText = "Network error. Please try again.";
    });
};

// EMAIL VERIFICATION FUNCTIONALITY
document.getElementById("verifyBtn").onclick = function () {
  const email = document.getElementById("verifyEmail").value;
  const code = document.getElementById("verifyCode").value;

  if (!email || !code) {
    document.getElementById("verifyStatus").innerText = "Please fill in all fields.";
    return;
  }

  fetch(COGNITO_ENDPOINT, {
    method: "POST",
    headers: { ...headers, "X-Amz-Target": "AWSCognitoIdentityProviderService.ConfirmSignUp" },
    body: JSON.stringify({
      ClientId: CLIENT_ID,
      Username: email,
      ConfirmationCode: code
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.CodeMismatchException) {
        document.getElementById("verifyStatus").innerText = "Invalid verification code.";
      } else {
        document.getElementById("verifySection").style.display = "none";
        document.getElementById("authSection").style.display = "block";
        document.getElementById("authStatus").innerText = "Email verified! You can now login.";
        document.getElementById("authStatus").style.background = "rgba(34, 197, 94, 0.1)";
        document.getElementById("authStatus").style.color = "#16a34a";
        document.getElementById("authStatus").style.border = "1px solid rgba(34, 197, 94, 0.2)";
        // Switch to login tab
        document.getElementById('loginTab').classList.add('active');
        document.getElementById('signupTab').classList.remove('active');
        document.getElementById('login-section').style.display = 'block';
        document.getElementById('signup-section').style.display = 'none';
      }
    })
    .catch(error => {
      document.getElementById("verifyStatus").innerText = "Network error. Please try again.";
    });
};

// LOGIN FUNCTIONALITY
document.getElementById("loginBtn").onclick = function () {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  if (!email || !password) {
    document.getElementById("authStatus").innerText = "Please fill in all fields.";
    return;
  }

  fetch(COGNITO_ENDPOINT, {
    method: "POST",
    headers: { ...headers, "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth" },
    body: JSON.stringify({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password
      }
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.AuthenticationResult && data.AuthenticationResult.IdToken) {
        sessionStorage.setItem("idToken", data.AuthenticationResult.IdToken);
        // Redirect to expense tracker
        window.location.href = "expense-tracker.html";
      } else if (data.__type === "UserNotConfirmedException") {
        document.getElementById("authStatus").innerText = "Please verify your email first.";
        document.getElementById("authSection").style.display = "none";
        document.getElementById("verifySection").style.display = "block";
        document.getElementById("verifyEmail").value = email;
      } else {
        document.getElementById("authStatus").innerText = data.message || "Login failed. Please check your credentials.";
      }
    })
    .catch(error => {
      document.getElementById("authStatus").innerText = "Network error. Please try again.";
    });
};