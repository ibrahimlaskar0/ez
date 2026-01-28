(function(){
  function getParam(name){
    try { return new URLSearchParams(window.location.search).get(name); } catch { return null; }
  }

  // IndexedDB helpers
  function idbOpen(){
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('esplendidez_db', 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('pendingRegs')) {
          db.createObjectStore('pendingRegs', { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  function idbGet(db, id){
    return new Promise((resolve, reject) => {
      const tx = db.transaction('pendingRegs', 'readonly');
      const req = tx.objectStore('pendingRegs').get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }
  function idbDelete(db, id){
    return new Promise((resolve, reject) => {
      const tx = db.transaction('pendingRegs', 'readwrite');
      tx.objectStore('pendingRegs').delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('payment-form');
    const utrInput = document.getElementById('utr-id');

    // Auto-capitalize and sanitize UTR as user types
    if (utrInput) {
      utrInput.addEventListener('input', () => {
        const v = utrInput.value.toUpperCase().replace(/\s+/g,'').replace(/[^A-Z0-9]/g,'');
        if (v !== utrInput.value) utrInput.value = v;
      });
    }

    // Determine pending reg id - support both 'regId' and 'registration' parameters
    let regId = getParam('regId') || getParam('registration') || sessionStorage.getItem('pendingPaymentId');
    
    console.log('Payment Debug - RegId:', regId);
    console.log('Payment Debug - URL params:', window.location.search);
    
    if(!regId){
      console.error('No pending registration ID found');
    }

    // Load pending record for summary display
    let pending = null;
    try {
      const db = await idbOpen();
      console.log('IndexedDB opened successfully');
      
      // Debug: List all records in the database
      const allRecords = await new Promise((resolve, reject) => {
        const tx = db.transaction('pendingRegs', 'readonly');
        const req = tx.objectStore('pendingRegs').getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
      console.log('All records in IndexedDB:', allRecords.length, allRecords.map(r => r.id));
      
      pending = regId ? await idbGet(db, regId) : null;
      console.log('Pending record from IndexedDB:', pending);
      
      if (!pending) {
        console.error('No pending record found for regId:', regId);
        console.error('Available IDs in IndexedDB:', allRecords.map(r => r.id));
        
        // Show detailed error to user
        alert(`Registration data not found.\n\nLooking for: ${regId}\nAvailable records: ${allRecords.length}\n\nThis might be a browser storage issue. Please try:\n1. Registering again\n2. Using a different browser\n3. Ensuring cookies/storage are enabled`);
      }
    } catch (e) {
      console.error('Could not open IndexedDB:', e);
      alert(`IndexedDB Error: ${e.message}\n\nYour browser might not support local storage or it may be disabled. Please enable storage and try again.`);
    }

    // Optional: show summary
    if (pending) {
      try {
        const card = document.querySelector('.bg-gradient-to-r.from-indigo-600.to-purple-600');
        if (card) {
          const summary = document.createElement('div');
          summary.className = 'mt-4 text-white/90 text-sm';
          summary.innerHTML = `
            <div class="grid grid-cols-2 gap-2">
              <div><strong>Name:</strong> ${pending.data.participantName}</div>
              <div><strong>Email:</strong> ${pending.data.participantEmail}</div>
              <div><strong>Event:</strong> ${pending.data.eventName}</div>
              <div><strong>Fee:</strong> ₹${pending.data.eventFee}</div>
            </div>`;
          card.appendChild(summary);
        }
      } catch {}
    }

    if(form){
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          if(!regId){
            alert('Missing registration reference. Please complete the registration form first.\n\nClick OK to go to the registration page.');
            window.location.href = 'register.html';
            return;
          }
          if(!pending){
            const db = await idbOpen();
            pending = await idbGet(db, regId);
            if(!pending){
              alert('No saved registration found. Please register again.\n\nYour registration data could not be retrieved from local storage.\n\nClick OK to return to the registration page.');
              window.location.href = 'register.html';
              return;
            }
          }

          const utr = (utrInput?.value || '').trim();
          if(!utr){
            alert('Please enter UTR ID');
            return;
          }

          // Build FormData
          const fd = new FormData();
          const d = pending.data;
          fd.append('eventName', d.eventName);
          fd.append('eventCategory', d.eventCategory);
          fd.append('eventFee', String(d.eventFee || 0));
          fd.append('participantName', d.participantName);
          fd.append('participantEmail', d.participantEmail);
          fd.append('participantPhone', d.participantPhone);
          fd.append('participantCollege', d.participantCollege);
          fd.append('participantRoll', d.participantRoll);
          fd.append('teamSize', String(d.teamSize || 1));
          if (d.teamName) fd.append('teamName', d.teamName);
          if (d.teamCaptain) fd.append('teamCaptain', d.teamCaptain);
          if (Array.isArray(d.teamMembers)) {
            fd.append('teamMembers', JSON.stringify(d.teamMembers));
          }
          fd.append('utrNumber', utr);

          // Attach college ID proof file
          const file = pending.collegeIdFile;
          if(file){
            const filename = file.name || 'college-id-proof';
            const attach = (file instanceof File) ? file : new File([file], filename, { type: file.type || 'application/octet-stream' });
            fd.append('collegeIdProof', attach);
          } else {
            alert('Saved college ID file missing. Please re-upload from registration page.');
            return;
          }

          // Attach payment screenshot if provided
          const ssInput = document.getElementById('payment-screenshot');
          const ssFile = ssInput && ssInput.files && ssInput.files[0];
          if (ssFile) {
            fd.append('paymentScreenshot', ssFile);
          }

          // Submit to backend
          const btn = form.querySelector('button[type="submit"]');
          const original = btn?.innerHTML;
          if(btn){ btn.disabled = true; btn.innerHTML = '<span class="animate-pulse">Submitting...</span>'; }
          const res = await window.ApiService.registerForEventMultipart(fd);

          // Cleanup local pending record
          try { const db = await idbOpen(); await idbDelete(db, regId); } catch {}
          sessionStorage.removeItem('pendingPaymentId');

          // Navigate to success page
          const rid = res?.data?.registrationId || regId;
          window.location.href = `success.html?registrationId=${encodeURIComponent(rid)}`;
        } catch (err) {
          console.error('Payment submit failed:', err);
          alert(err.message || 'Submission failed. Please try again.');
        } finally {
          const btn = form.querySelector('button[type="submit"]');
          if(btn){ btn.disabled = false; btn.innerHTML = '<i data-feather="check-circle" class="w-5 h-5"></i> Confirm Payment'; }
        }
      });
    }
  });
})();
