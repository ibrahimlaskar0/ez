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

  // Test localStorage availability
  function testLocalStorage() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.error('❌ localStorage is not available:', e);
      return false;
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    console.log('=== Payment Page Initialization ===');
    
    // Check localStorage availability
    const hasLocalStorage = testLocalStorage();
    if (!hasLocalStorage) {
      alert('⚠ Browser storage is not available.\n\nYou may be in private/incognito mode or storage is disabled.\n\nPlease enable storage or use a regular browser window and try again.');
      console.error('❌ localStorage test failed - redirecting to registration');
      window.location.href = 'register.html';
      return;
    }
    console.log('✓ localStorage is available');
    
    const form = document.getElementById('payment-form');
    const utrInput = document.getElementById('utr-id');

    // Auto-capitalize and sanitize UTR as user types
    if (utrInput) {
      utrInput.addEventListener('input', () => {
        const v = utrInput.value.toUpperCase().replace(/\s+/g,'').replace(/[^A-Z0-9]/g,'');
        if (v !== utrInput.value) utrInput.value = v;
      });
    }

    // DEVELOPER NOTE: Always read registration ID from the standardized key 'espl_registration_id'
    // Support legacy URL parameters for backward compatibility
    let regId = getParam('regId') || getParam('registration') || localStorage.getItem('espl_registration_id');
    
    console.log('=== Payment Page Debug Info ===');
    console.log('Payment Debug - RegId from URL or storage:', regId);
    console.log('Payment Debug - URL params:', window.location.search);
    console.log('Payment Debug - localStorage espl_registration_id:', localStorage.getItem('espl_registration_id'));
    console.log('Payment Debug - localStorage keys:', Object.keys(localStorage).filter(k => k.includes('espl')));
    
    // DEVELOPER NOTE: Show clear error with recovery options when registration ID is missing
    if(!regId){
      console.error('❌ No pending registration ID found in localStorage key "espl_registration_id"');
      
      // Display user-friendly error with recovery UI using existing Tailwind classes
      const errorOverlay = document.createElement('div');
      errorOverlay.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-5';
      errorOverlay.innerHTML = `
        <div class="bg-white p-8 rounded-2xl max-w-lg shadow-2xl">
          <div class="text-center mb-5">
            <div class="w-16 h-16 mx-auto mb-5 bg-red-50 rounded-full flex items-center justify-center">
              <svg width="32" height="32" fill="red" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
              </svg>
            </div>
            <h2 class="text-2xl font-bold text-red-600 mb-4">Registration Not Found</h2>
            <p class="text-gray-600 mb-5 leading-relaxed">
              No registration data found. This can happen if:
            </p>
            <ul class="text-left text-gray-600 my-5 pl-6 leading-loose list-disc">
              <li>You're using private/incognito browsing mode</li>
              <li>Browser storage is disabled or full</li>
              <li>You're using a different browser or device</li>
              <li>You cleared browser data</li>
              <li>You came directly to this page without registering</li>
            </ul>
          </div>
          <div class="flex gap-3 mt-6">
            <a href="register.html" class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg text-center font-semibold transition-colors">
              Register Now
            </a>
            <a href="index.html" class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg text-center font-semibold transition-colors">
              Go Home
            </a>
          </div>
        </div>
      `;
      document.body.appendChild(errorOverlay);
      return;
    } else {
      console.log('✓ Registration ID found:', regId);
    }

    // Load pending record for summary display
    let pending = null;
    let fileNeedsReupload = false;
    
    // Try IndexedDB first
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
    
    // Fallback to localStorage if IndexedDB didn't have the data
    // DEVELOPER NOTE: Always use standardized key 'espl_registration_id' and 'espl_registration_data'
    if (!pending) {
      console.log('⚠ No data in IndexedDB, trying localStorage fallback...');
      try {
        const storedRegId = localStorage.getItem('espl_registration_id');
        const storedData = localStorage.getItem('espl_registration_data');
        
        console.log('localStorage check - storedRegId:', storedRegId);
        console.log('localStorage check - has storedData:', !!storedData);
        console.log('localStorage check - comparing:', storedRegId, 'vs', regId);
        
        if (storedData && (storedRegId === regId || !regId)) {
          const data = JSON.parse(storedData);
          pending = {
            id: storedRegId,
            data: data,
            collegeIdFile: null // File not available from localStorage
          };
          fileNeedsReupload = true;
          console.log('✓ Successfully loaded registration from localStorage:', pending);
          console.log('⚠ File re-upload will be required');
          
          // Update regId if it was missing
          if (!regId) {
            regId = storedRegId;
            console.log('✓ Updated regId from localStorage:', regId);
          }
        } else {
          console.error('❌ localStorage data not found or ID mismatch');
          if (!storedData) console.error('  - No espl_registration_data in localStorage');
          if (storedRegId !== regId) console.error('  - ID mismatch: stored=' + storedRegId + ' vs expected=' + regId);
        }
      } catch (e) {
        console.error('❌ localStorage fallback failed:', e);
      }
    } else {
      console.log('✓ Successfully loaded data from IndexedDB');
    }
      
    if (!pending) {
      console.error('❌ No pending record found for regId:', regId);
      console.error('❌ Storage check results:');
      console.error('  - IndexedDB: No data');
      console.error('  - localStorage: No data or ID mismatch');
      console.error('  - Possible causes:');
      console.error('    1. Private/incognito browsing mode');
      console.error('    2. Browser storage disabled or full');
      console.error('    3. Different browser/device than registration');
      console.error('    4. Storage data was cleared');
      console.error('    5. Came directly to payment page');
      
      // Show detailed error to user
      alert(`❌ No saved registration found. Please register again.

This can happen if:
1. You're using private/incognito browsing
2. Browser storage is disabled or full
3. You're using a different browser or device
4. You cleared browser data
5. You navigated here directly without registering

Current Registration ID: ${regId || 'Not found'}

Click OK to go to the registration page.`);
      window.location.href = 'register.html';
      return;
    }
    
    console.log('✅ Successfully loaded pending registration data');
    console.log('Registration details:', {
      id: pending.id,
      name: pending.data?.participantName,
      email: pending.data?.participantEmail,
      event: pending.data?.eventName
    });

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
          if(btn){ btn.disabled = true; btn.innerHTML = '<span class="animate-pulse">Submitting...</span>'; }
          const res = await window.ApiService.registerForEventMultipart(fd);

          // Cleanup local pending record
          // DEVELOPER NOTE: Clean up all localStorage keys after successful payment submission
          try { const db = await idbOpen(); await idbDelete(db, regId); } catch {}
          localStorage.removeItem('espl_registration_id');
          localStorage.removeItem('espl_registration_data');

          // Navigate to success page
          const rid = res?.registrationId || res?.data?.registrationId || regId;
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
