(function(){
  function getParam(name){
    try { return new URLSearchParams(window.location.search).get(name); } catch { return null; }
  }

  // Detect iOS/Mobile browsers
  function isMobileBrowser() {
    const ua = navigator.userAgent || '';
    return /iPhone|iPad|iPod|Android|Mobile/i.test(ua);
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

  // NEW: Try to parse URL-encoded data fallback
  function parseUrlEncodedData() {
    try {
      const encodedData = getParam('data');
      if (encodedData) {
        const decoded = decodeURIComponent(encodedData);
        return JSON.parse(atob(decoded));
      }
    } catch (e) {
      console.warn('Failed to parse URL-encoded data:', e);
    }
    return null;
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
    let regId = getParam('regId') || getParam('registration');
    
    // Try sessionStorage only if not on mobile
    if (!regId && !isMobileBrowser()) {
      try {
        regId = sessionStorage.getItem('pendingPaymentId');
      } catch (e) {
        console.warn('sessionStorage blocked:', e);
      }
    }
    
    console.log('Payment Debug - RegId:', regId);
    console.log('Payment Debug - URL params:', window.location.search);
    console.log('Payment Debug - Mobile browser:', isMobileBrowser());
    
    if(!regId){
      console.error('No pending registration ID found');
    }

    // Load pending record for summary display
    let pending = null;
    let fileNeedsReupload = false;
    
    // Try URL-encoded data first (best for mobile)
    const urlData = parseUrlEncodedData();
    if (urlData) {
      pending = {
        id: regId || urlData.regId || ('REG_' + Date.now()),
        data: urlData,
        collegeIdFile: null
      };
      fileNeedsReupload = true;
      console.log('✅ Loaded registration from URL parameters (mobile-friendly)');
    }
    
    // Try IndexedDB second (if URL data not available)
    if (!pending && !isMobileBrowser()) {
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
      } catch (e) {
        console.warn('IndexedDB unavailable:', e);
      }
    }
    
    // Fallback to sessionStorage if IndexedDB didn't have the data
    if (!pending && !isMobileBrowser()) {
      console.log('Trying sessionStorage fallback...');
      try {
        const storedRegId = sessionStorage.getItem('pendingPaymentId');
        const storedData = sessionStorage.getItem('pendingRegData');
        
        if (storedData && (storedRegId === regId || !regId)) {
          const data = JSON.parse(storedData);
          pending = {
            id: storedRegId,
            data: data,
            collegeIdFile: null // File not available from sessionStorage
          };
          fileNeedsReupload = true;
          console.log('Loaded registration from sessionStorage (file will need re-upload):', pending);
          
          // Update regId if it was missing
          if (!regId) regId = storedRegId;
        }
      } catch (e) {
        console.warn('sessionStorage fallback failed:', e);
      }
    }
      
    if (!pending) {
      console.error('No pending record found for regId:', regId);
      console.error('Storage attempts failed. URL params:', window.location.search);
      
      // Show detailed error to user
      alert(`No saved registration found. Please register again.\n\nThis can happen if:\n1. You're using private/incognito browsing\n2. Browser storage is disabled\n3. You navigated here directly\n\nClick OK to go to the registration page.`);
      window.location.href = 'register.html';
      return;
    }

    console.log('✅ Registration data loaded successfully:', pending.data);

    // Show College ID re-upload field if file is not available
    if (fileNeedsReupload || !pending.collegeIdFile) {
      const reuploadSection = document.getElementById('college-id-reupload');
      const reuploadInput = document.getElementById('college-id-reupload-input');
      if (reuploadSection) {
        reuploadSection.classList.remove('hidden');
        if (reuploadInput) reuploadInput.required = true;
      }
      console.log('College ID re-upload required (file not available from storage)');
    }

    // Optional: show summary
    if (pending) {
      try {
        const card = document.querySelector('.bg-gradient-to-r.from-indigo-600.to-purple-600');
        if (card) {
          const summary = document.createElement('div');
          summary.className = 'mt-4 text-white/90 text-sm';

          const grid = document.createElement('div');
          grid.className = 'grid grid-cols-2 gap-2';

          const nameDiv = document.createElement('div');
          const nameLabel = document.createElement('strong');
          nameLabel.textContent = 'Name:';
          nameDiv.appendChild(nameLabel);
          nameDiv.appendChild(document.createTextNode(' ' + (pending.data.participantName || '')));

          const emailDiv = document.createElement('div');
          const emailLabel = document.createElement('strong');
          emailLabel.textContent = 'Email:';
          emailDiv.appendChild(emailLabel);
          emailDiv.appendChild(document.createTextNode(' ' + (pending.data.participantEmail || '')));

          const eventDiv = document.createElement('div');
          const eventLabel = document.createElement('strong');
          eventLabel.textContent = 'Event:';
          eventDiv.appendChild(eventLabel);
          eventDiv.appendChild(document.createTextNode(' ' + (pending.data.eventName || '')));

          const feeDiv = document.createElement('div');
          const feeLabel = document.createElement('strong');
          feeLabel.textContent = 'Fee:';
          feeDiv.appendChild(feeLabel);
          feeDiv.appendChild(document.createTextNode(' ₹' + (pending.data.eventFee || '')));

          grid.appendChild(nameDiv);
          grid.appendChild(emailDiv);
          grid.appendChild(eventDiv);
          grid.appendChild(feeDiv);

          summary.appendChild(grid);
          card.appendChild(summary);
        }
      } catch {}
    }

    if(form){
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          if(!regId){
            regId = pending.id || ('REG_' + Date.now());
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

          // Attach college ID proof file (from IndexedDB or re-upload)
          let collegeIdFile = pending.collegeIdFile;
          
          // Check if re-upload input has a file
          const reuploadInput = document.getElementById('college-id-reupload-input');
          if (reuploadInput && reuploadInput.files && reuploadInput.files[0]) {
            collegeIdFile = reuploadInput.files[0];
          }
          
          if(collegeIdFile){
            const filename = collegeIdFile.name || 'college-id-proof';
            const attach = (collegeIdFile instanceof File) ? collegeIdFile : new File([collegeIdFile], filename, { type: collegeIdFile.type || 'application/octet-stream' });
            fd.append('collegeIdProof', attach);
          } else {
            alert('College ID file is required. Please upload your college ID proof.');
            return;
          }

          // Attach payment screenshot if provided
          const ssInput = document.getElementById('payment-screenshot');
          const ssFile = ssInput && ssInput.files && ssInput.files[0];

          // console.log(ssFile)
          if (ssFile) {
            fd.append('paymentScreenshot', ssFile);
          }

          // Submit to backend
          const btn = form.querySelector('button[type="submit"]');
          const original = btn?.innerHTML;
          if(btn){ btn.disabled = true; btn.innerHTML = '<span class="animate-pulse">Submitting...</span>'; };
          const res = await window.ApiService.registerForEventMultipart(fd);

          // Cleanup local pending record
          try { const db = await idbOpen(); await idbDelete(db, regId); } catch {}
          try { sessionStorage.removeItem('pendingPaymentId'); } catch {}

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