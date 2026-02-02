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
      const res = await fetch('https://ez-6jm2ucdgz-ibees-projects.vercel.app/api/registration/register', { method: 'POST', body: fd });
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
      showError('Server error: ' + (e.message || 'Unknown'));
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit";
    }
  });

  function showError(msg) {
    if (window.showNotification) window.showNotification(msg, 'error');
    else alert(msg);
  }
});
