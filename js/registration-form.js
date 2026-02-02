// js/registration-form.js

// This method collects form data and sends it to the backend
function submitRegistrationForm() {
    const formData = new FormData();
    const registrationData = {
        participantName: document.getElementById('participantName').value,
        participantEmail: document.getElementById('participantEmail').value,
        participantPhone: document.getElementById('participantPhone').value,
        participantCollege: document.getElementById('participantCollege').value,
        participantRoll: document.getElementById('participantRoll').value,
        eventName: document.getElementById('eventName').value,
        eventCategory: document.getElementById('eventCategory').value,
        eventFee: document.getElementById('eventFee').value,
        utrNumber: document.getElementById('utrNumber').value,
        teamMembers: JSON.stringify(getTeamMembers()), // Assuming a function to get team members
        collegeIdProof: document.getElementById('collegeIdProof').files[0] // File input
    };

    // Append all data to FormData
    Object.keys(registrationData).forEach(key => {
        formData.append(key, registrationData[key]);
    });

    fetch('/api/registration', {
        method: 'POST',
        body: formData,
    }).then(response => response.json())
    .then(data => {
        if (data.success && data.registrationId) {
            window.location.href = `/payment?registrationId=${data.registrationId}`;
        } else {
            // Show backend error messages if any
            showErrorMessage(data.message || 'Registration failed');
            document.getElementById('submitBtn').disabled = false; // Reset submit button
        }
    }).catch(error => {
        showErrorMessage('Network error: ' + error.message);
        document.getElementById('submitBtn').disabled = false; // Reset submit button
    });
}

// Function to show error messages
function showErrorMessage(message) {
    alert(message);
}