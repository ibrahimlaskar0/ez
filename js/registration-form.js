/**
 * Registration Form Handler
 * 
 * IMPORTANT: This form submits to the backend API using the full base URL.
 * - The API base URL is set in runtime-config.js via window.ESPL_API_BASE
 * - For localhost dev: window.ESPL_API_BASE = 'http://localhost:5001'
 * - For production: window.ESPL_API_BASE = 'https://ez-two-amber.vercel.app'
 * 
 * This ensures the form works in all deployment scenarios (GitHub Pages, Netlify, Vercel).
 */
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('registration-form');
  const submitBtn = form?.querySelector('button[type="submit"]');
  form?.addEventListener('submit', async function(event) {
    event.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = "Processing...";

    const fd = new FormData();
    fd.append('eventName', document.getElementById('event-name')?.value || '');
    fd.append('eventCategory', document.getElementById('event-category')?.value || '');
    fd.append('eventFee', document.getElementById('event-fee')?.value || '');
    fd.append('participantName', document.getElementById('participant-name')?.value || '');
    fd.append('participantEmail', document.getElementById('participant-email')?.value || '');
    fd.append('participantPhone', document.getElementById('participant-phone')?.value || '');
    fd.append('participantCollege', document.getElementById('participant-college')?.value || '');
    fd.append('participantRoll', document.getElementById('participant-roll')?.value || '');
    fd.append('utrNumber', document.getElementById('utrNumber')?.value || '');

    // Team members, if present
    // fd.append('teamMembers', JSON.stringify(teamMembersArray));

    // Required file
    const idFile = document.getElementById('college-id-proof');
    if (idFile?.files?.[0]) fd.append('collegeIdProof', idFile.files[0]);

    try {
      // CRITICAL: Use full API base URL from window.ESPL_API_BASE
      // DO NOT use relative URLs like '/api/registration/register'
      const apiBase = window.ESPL_API_BASE || 'https://ez-two-amber.vercel.app';
      const apiUrl = `${apiBase}/api/registration/register`;
      
      console.log('🚀 Submitting registration to:', apiUrl);
      
      const res = await fetch(apiUrl, { 
        method: 'POST', 
        body: fd,
        // Note: Don't set Content-Type for FormData, browser sets it with boundary
      });
      
      const result = await res.json();
      if (result.success && result.registrationId) {
        localStorage.setItem('espl_registration_id', result.registrationId);
        localStorage.setItem('espl_registration_data', JSON.stringify(result));
        window.location.href = `payment.html?registration=${result.registrationId}`;
      } else {
        showError(result.message || 'Registration failed.');
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit";
      }
    } catch(e) {
      console.error('Registration error:', e);
      // Show meaningful error message about backend connectivity
      const errorMsg = `Server error: Failed to connect to registration server. ${e.message || 'Please check your internet connection and try again.'}`;
      showError(errorMsg);
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit";
    }
  });

  function showError(msg) {
    if (window.showNotification) window.showNotification(msg, 'error');
    else alert(msg);
  }
});
