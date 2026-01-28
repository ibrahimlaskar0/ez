/**
 * Esplendidez 2026 - Event Registration System
 * Handles event listing, registration forms, and validation
 * Author: Tennis Tournament Management System
 * Version: 2.0
 */

/**
 * Master list of all participating events in Esplendidez 2026
 * Each event includes category, name, fee, schedule, and team type
 * Used for registration forms and event display
 */
const eventsList = [
    // Cultural Events - Creative and artistic competitions
    {category:"Cultural", name:"Prom Night", fee:"600/250 (single for girls)", teamType:"individual/Duo"},
    {category:"Cultural", name:"Cos Play", fee:300, teamType:"individual"},
    {category:"Cultural", name:"Dance Competition", fee:"200 (solo) / 500 (group)", teamType:"individual"},
    {category:"Cultural", name:"Song Competition", fee:200, teamType:"individual"},
    {category:"Cultural", name:"Fashion Show", fee:500, teamType:"individual"},    
    // Sports Events - Physical competitions and athletics
    {category:"Sports", name:"Kabaddi (Girls)", fee:900, teamType:"team"},
    {category:"Sports", name:"Tug of War", fee:800, teamType:"team"},
    {category:"Sports", name:"Badminton", fee:400, teamType:"team"},
    {category:"Sports", name:"Futsal", fee:1000, teamType:"team"},
    {category:"Sports", name:"Volleyball", fee:700, teamType:"team"},
    {category:"Sports", name:"Arm Wrestling", fee:300, teamType:"individual"},
    {category:"Sports", name:"Weight Lifting", fee:300, teamType:"individual"},
    {category:"Sports", name:"Table Tennis", fee:250, teamType:"individual"},
    
    // Technical Events - Engineering and programming challenges
    {category:"Technical", name:"Coding Competition", fee:200, teamType:"individual"},
    {category:"Technical", name:"Robotron", fee:1000, teamType:"team"},
    {category:"Technical", name:"Model Making", fee:200, teamType:"individual"},

    // E-Sports Events - Gaming competitions
    {category:"E-Sports", name:"BGMI", fee:500, teamType:"team"},
    {category:"E-Sports", name:"ML", fee:600, teamType:"team"},
    {category:"E-Sports", name:"FIFA", fee:250, teamType:"individual"},
    
    // Competition Events - Academic and skill-based contests
    {category:"Competitions", name:"Quiz", fee:150, teamType:"individual"},
    {category:"Competitions", name:"Debate", fee:150, teamType:"individual"},
];

/**
 * Gets Bootstrap icon class based on event category
 * @param {string} category - Event category name
 * @returns {string} Bootstrap icon class name
 */
function getCategoryIcon(category) {
    switch(category.toLowerCase()) {
        case 'technical': return 'bi-code-slash';    // Programming/tech icon
        case 'cultural': return 'bi-palette';        // Art/creativity icon
        case 'sports': return 'bi-trophy';           // Sports/competition icon
        case 'e-sports': return 'bi-controller';     // Gaming controller icon
        case 'competitions': return 'bi-award';      // Award/achievement icon
        default: return 'bi-star';                   // Default fallback icon
    }
}

/**
 * Gets consistent color theme for event cards
 * Uses blue gradient for visual consistency across all categories
 * @param {string} category - Event category (currently unused, all same color)
 * @returns {string} Tailwind CSS gradient classes
 */
function getCategoryColor(category) {
    // Use bright, visible blue gradient for all categories for consistency
    return 'from-blue-500 to-cyan-500';
}

/**
 * Converts string to URL-friendly slug for file naming
 * Used for generating image filenames from event names
 * @param {string} str - Input string to convert
 * @returns {string} Slugified string
 */
function slugify(str){
    return String(str).toLowerCase().trim()
        .replace(/[^a-z0-9\s-]/g,'')    // Remove special characters
        .replace(/\s+/g,'-')            // Replace spaces with hyphens
        .replace(/-+/g,'-');            // Remove duplicate hyphens
}

/**
 * Generates image path information for events with fallback options
 * Creates multiple fallback paths for event images
 * @param {string} name - Event name
 * @param {string} category - Event category
 * @returns {Object} Image info with paths and metadata
 */
function getEventImageInfo(name, category){
    const slug = slugify(name);
    
    // Map of specific event name aliases for image files
    const aliasMap = {
        'f1-gaming-console-by-red-bull': 'f1',
        'verbal-combat-debate': 'debate',
        'coding-competition': 'coding',
        'bridge-making-competition': 'bridge-making',
        'prom-night': 'prom',
        'kabaddi-girls': 'kabaddi',
        'badminton-team': 'badminton'
    };
    
    const alias = aliasMap[slug] || '';
    const catSlug = slugify(category || '');
    const initial = `assets/events/${(alias || slug)}.jpg`;
    
    return { initial, slug, alias, catSlug };
}

// Function to create event card HTML with enhanced design + image
function createEventCard(ev) {
    const gradient = getCategoryColor(ev.category);
    const info = getEventImageInfo(ev.name, ev.category);
    
    return `
        <div class="event-card bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-lg rounded-3xl shadow-2xl hover:shadow-3xl p-6 md:p-8 border-2 border-white/30 hover:border-white/50 transition-all duration-500 transform hover:scale-105 hover:from-gray-700/90 hover:to-gray-800/90 group overflow-hidden relative">
            <!-- Top Image -->
            <div class="relative h-44 sm:h-48 md:h-56 w-full overflow-hidden rounded-2xl mb-5">
<img src="${info.initial}" data-slug="${info.slug}" data-alias="${info.alias}" data-cat="${info.catSlug}" alt="${ev.name}" class="event-thumb w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onerror="(function(img){var s=+img.dataset.step||0,slug=img.dataset.slug,alias=img.dataset.alias,cat=img.dataset.cat;var list=['assets/events/'+slug+'.jpeg','assets/events/'+slug+'.png'];if(alias&&alias!==slug){list.unshift('assets/events/'+alias+'.jpg','assets/events/'+alias+'.jpeg','assets/events/'+alias+'.png');}if(cat){list.push('assets/events/'+cat+'.jpg','assets/events/'+cat+'.png');}list.push('assets/events/placeholder.jpg');if(s<list.length){img.dataset.step=s+1;img.src=list[s];}else{img.onerror=null;}})(this)">
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
                <div class="absolute top-3 right-3 bg-gradient-to-r ${gradient} text-white px-3 py-1 rounded-full font-bold text-sm shadow-lg">₹${ev.fee}</div>
            </div>
            
            <!-- Card Header (title below image as requested) -->
            <div class="relative z-10 mb-4">
                <h3 class="event-title-below text-xl md:text-2xl font-bold mb-1 group-hover:text-yellow-300 transition-colors duration-300">${ev.name}</h3>
            </div>
            
            <!-- Event Description -->
            <div class="relative z-10 mb-5">
                <p class="event-desc leading-relaxed opacity-90">
                    Join this exciting ${ev.category.toLowerCase()} event and showcase your skills among talented participants from across the region.
                </p>
            </div>
            
            <!-- Event Details -->
            <div class="relative z-10 mb-5">
                <div class="flex justify-center">
                    <div class="bg-black/20 rounded-lg p-3 backdrop-blur-sm">
                        <i class="bi ${ev.teamType === 'team' ? 'bi-people' : 'bi-person'} text-blue-400 mb-1"></i>
                        <div class="text-gray-300">${ev.teamType === 'team' ? 'Team Event' : 'Individual Event'}</div>
                    </div>
                </div>
            </div>
            
            <!-- Register Button -->
            <div class="relative z-10">
                <a href="register.html?event=${encodeURIComponent(ev.name)}" 
                   class="w-full bg-gradient-to-r ${gradient} text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:translate-y-[-2px] flex items-center justify-center space-x-3 group-hover:bg-opacity-90">
                    <i class="bi bi-person-plus text-xl"></i>
                    <span>Register Now</span>
                    <i class="bi bi-arrow-right text-xl transform group-hover:translate-x-2 transition-transform duration-300"></i>
                </a>
            </div>
        </div>
    `;
}

// Populate Events page with categorized sections
function populateEventsByCategory() {
    console.log('populateEventsByCategory called');
    console.log('Total events:', eventsList.length);
    
    const categories = {
        'Technical': 'technical-events',
        'Cultural': 'cultural-events', 
        'Sports': 'sports-events',
        'E-Sports': 'e-sports-events',
        'Competitions': 'competitions-events'
    };
    
    // Clear all containers first
    Object.values(categories).forEach(containerId => {
        const container = document.getElementById(containerId);
        console.log(`Container ${containerId}:`, container ? 'found' : 'NOT FOUND');
        if (container) {
            container.innerHTML = '';
        }
    });
    
    // Group events by category and populate
    eventsList.forEach(ev => {
        const containerId = categories[ev.category];
        const container = document.getElementById(containerId);
        console.log(`Event: ${ev.name}, Category: ${ev.category}, Container ID: ${containerId}, Container found: ${!!container}`);
        
        if (container) {
            const eventCard = document.createElement('div');
            eventCard.innerHTML = createEventCard(ev);
            console.log('Created card HTML length:', eventCard.innerHTML.length);
            container.appendChild(eventCard.firstElementChild);
            console.log('Appended to container. Container children count:', container.children.length);
        } else {
            console.error(`Container not found for ${ev.category} (ID: ${containerId})`);
        }
    });
    
    // Initialize feather icons for the new buttons
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
}

// Category filtering functionality
function showCategory(category) {
    const sections = document.querySelectorAll('.event-category-section');
    const buttons = document.querySelectorAll('.category-nav-btn');
    
    // Update button states
    buttons.forEach(btn => {
        btn.classList.remove('active', 'bg-white/20', 'backdrop-blur-md');
        btn.classList.add('bg-transparent');
    });
    
    const activeButton = document.querySelector(`[data-category="${category}"]`);
    if (activeButton) {
        activeButton.classList.add('active', 'bg-white/20', 'backdrop-blur-md');
        activeButton.classList.remove('bg-transparent');
    }
    
    if (category === 'all') {
        // Show all sections
        sections.forEach(section => {
            section.style.display = 'block';
        });
    } else {
        // Hide all sections first
        sections.forEach(section => {
            section.style.display = 'none';
        });
        
        // Show selected category
        const targetSection = document.getElementById(`${category}-section`);
        if (targetSection) {
            targetSection.style.display = 'block';
        }
    }
}

// Initialize events page
const eventsContainer = document.getElementById("events-container");
if (eventsContainer) {
    populateEventsByCategory();
    
    // Set up category navigation if it exists
    const categoryButtons = document.querySelectorAll('.category-nav-btn');
    if (categoryButtons.length > 0) {
        // Show all categories by default
        showCategory('all');
    }
}

// Registration page
const eventInput = document.getElementById("event-name");
const eventSelector = document.getElementById("event-selector");
const feeInput = document.getElementById("event-fee");
const form = document.getElementById("registration-form");
const teamSizeInput = document.getElementById("participant-team");
const teamMetaSection = document.getElementById("team-meta-section");
const teamNameInput = document.getElementById("team-name");
const teamCaptainInput = document.getElementById("team-captain");
const teamMembersSection = document.getElementById("team-members-section");
const teamMembersContainer = document.getElementById("team-members-container");

function getCurrentEventDetails(){
    const name = eventInput ? eventInput.value : '';
    return eventsList.find(e => e.name === name) || null;
}

function renderTeamMemberRows(count){
    if(!teamMembersContainer) return;
    teamMembersContainer.innerHTML = '';
    for(let i=1;i<=count;i++){
        const row = document.createElement('div');
        row.className = 'team-member-row grid md:grid-cols-2 gap-4';
        row.innerHTML = `
            <div>
                <label class="block text-xs font-semibold text-gray-200 mb-1">Member ${i} Name *</label>
                <input type="text" name="member-name" id="member-name-${i}" class="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-purple-400 focus:border-transparent" placeholder="Enter member ${i} name" required>
            </div>
            <div>
                <label class="block text-xs font-semibold text-gray-200 mb-1">Member ${i} Email (optional)</label>
                <input type="email" name="member-email" id="member-email-${i}" class="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-purple-400 focus:border-transparent" placeholder="Enter member ${i} email">
            </div>
        `;
        teamMembersContainer.appendChild(row);
    }
}

function updateTeamMembersUI(){
    if(!teamSizeInput) return;

    let size = parseInt(teamSizeInput.value || '1');
    if(isNaN(size) || size < 1) size = 1;
    if(size > 20) size = 20;
    
    // Only update the input value if it's actually different to avoid cursor issues
    if(teamSizeInput.value !== String(size)) {
        teamSizeInput.value = String(size);
    }

    // Always allow team entries for any event
    teamSizeInput.removeAttribute('disabled');

    if(size > 1){
        if(teamMetaSection){ teamMetaSection.classList.remove('hidden'); }
        if(teamNameInput){ teamNameInput.setAttribute('required','true'); }
        if(teamMembersSection){ teamMembersSection.classList.remove('hidden'); }
        renderTeamMemberRows(size - 1);
    } else {
        if(teamMetaSection){ teamMetaSection.classList.add('hidden'); }
        if(teamNameInput){ teamNameInput.removeAttribute('required'); teamNameInput.value=''; }
        if(teamCaptainInput){ teamCaptainInput.value=''; }
        if(teamMembersSection){ teamMembersSection.classList.add('hidden'); }
        if(teamMembersContainer){ teamMembersContainer.innerHTML=''; }
    }
}

// Populate event selector dropdown
if(eventSelector) {
    eventsList.forEach(ev => {
        const option = document.createElement('option');
        option.value = ev.name;
        option.textContent = `${ev.name} (${ev.category}) - ₹${ev.fee}`;
        option.className = 'bg-gray-800 text-white';
        eventSelector.appendChild(option);
    });
    
    // Handle event selection from dropdown
    eventSelector.addEventListener('change', function() {
        const selectedEventName = this.value;
        if(selectedEventName) {
            const ev = eventsList.find(e => e.name === selectedEventName);
            if(ev) {
                eventInput.value = ev.name;
                feeInput.value = "₹" + ev.fee;
                
                // Hide selector and show readonly input
                eventSelector.classList.add('hidden');
                eventInput.classList.remove('hidden');

                // Update team members UI based on event type
                updateTeamMembersUI();
            }
        } else {
            eventInput.value = "";
            feeInput.value = "₹0";
            updateTeamMembersUI();
        }
    });
}

// React to team size changes
if(teamSizeInput){
    // Use 'change' event instead of 'input' to avoid interfering with typing
    teamSizeInput.addEventListener('change', () => {
        let v = parseInt(teamSizeInput.value || '1');
        if(isNaN(v) || v < 1) v = 1;
        if(v > 20) v = 20;
        
        // Only update if value actually changed
        if(teamSizeInput.value !== String(v)) {
            teamSizeInput.value = String(v);
        }
        updateTeamMembersUI();
    });
    
    // Also add blur event for when user finishes editing
    teamSizeInput.addEventListener('blur', () => {
        let v = parseInt(teamSizeInput.value || '1');
        if(isNaN(v) || v < 1) v = 1;
        if(v > 20) v = 20;
        
        if(teamSizeInput.value !== String(v)) {
            teamSizeInput.value = String(v);
            updateTeamMembersUI();
        }
    });
}

// Handle URL parameters for single event registration
if(eventInput && feeInput){
    const params = new URLSearchParams(window.location.search);
    const selectedEvent = params.get("event");
    
    if(selectedEvent) {
        // Single event from URL parameter - sanitize input
        const sanitizedEvent = selectedEvent.replace(/[<>\"'&]/g, '');
        const ev = eventsList.find(e=>e.name===sanitizedEvent);
        
        if (ev) {
            eventInput.value = ev.name;
            feeInput.value = "₹"+ev.fee;
            
            // Hide selector and show readonly input for URL-based selection
            if(eventSelector) {
                eventSelector.classList.add('hidden');
                eventSelector.value = ev.name; // Set selector value
            }
            eventInput.classList.remove('hidden');
            updateTeamMembersUI();
        } else {
            // Invalid event name - show selector
            if(eventSelector) {
                eventSelector.classList.remove('hidden');
                eventInput.classList.add('hidden');
            }
            feeInput.value = "₹0";
            updateTeamMembersUI();
        }
    } else {
        // No event selected - show selector
        if(eventSelector) {
            eventSelector.classList.remove('hidden');
            eventInput.classList.add('hidden');
        }
        feeInput.value = "₹0";
        updateTeamMembersUI();
    }
}

if(form){
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        // Validate inputs with comprehensive security checks
        const name = document.getElementById("participant-name").value.trim();
        const email = document.getElementById("participant-email").value.trim();
        const phone = document.getElementById("participant-phone").value.trim();
        const college = document.getElementById("participant-college").value.trim();
        const teamSizeVal = teamSizeInput ? teamSizeInput.value : 1;
        const teamName = (teamNameInput ? teamNameInput.value.trim() : '');
        const teamCaptain = (teamCaptainInput ? teamCaptainInput.value.trim() : '');

        // Get the new required fields
        const rollNumber = document.getElementById("participant-roll")?.value.trim();
        const idProof = document.getElementById("college-id-proof")?.files[0];
        const termsAccepted = document.getElementById("terms-acceptance")?.checked;

        // Basic required field validation
        if(!name || !email || !phone || !college || !rollNumber){
            alert("Please fill in all required fields.");
            return;
        }
        
        // Terms acceptance validation
        if(!termsAccepted){
            alert("You must accept the registration rules and terms to proceed.");
            return;
        }
        
        // ID proof validation
        if(!idProof){
            alert("Please upload your college ID proof.");
            return;
        }
        
        // Validate file type and size
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        if(!allowedTypes.includes(idProof.type)){
            alert("Please upload a valid image (JPG, PNG) or PDF file.");
            return;
        }
        
        if(idProof.size > 5 * 1024 * 1024) { // 5MB limit
            alert("File size must be less than 5MB.");
            return;
        }
        
        // Roll number validation
        if(rollNumber.length < 3 || rollNumber.length > 50 || /<script|javascript:|data:|vbscript:/i.test(rollNumber)){
            alert("Please enter a valid college roll number (3-50 characters).");
            return;
        }
        
        // Name validation - prevent XSS and ensure reasonable length
        if(name.length < 2 || name.length > 100 || /<script|javascript:|data:|vbscript:/i.test(name)){
            alert("Please enter a valid name (2-100 characters, no scripts).");
            return;
        }
        
        // Email validation - comprehensive check
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        if(!emailRegex.test(email) || email.length > 254){
            alert("Please enter a valid email address.");
            return;
        }
        
        // Phone validation - Indian mobile numbers (10 digits only)
        const cleanPhone = phone.replace(/\D/g, ''); // Remove non-digits
        if(cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)){
            alert("Please enter exactly 10 digits for your mobile number (starting with 6, 7, 8, or 9).");
            return;
        }
        
        // College validation
        if(college.length < 3 || college.length > 200 || /<script|javascript:|data:|vbscript:/i.test(college)){
            alert("Please enter a valid college/institution name (3-200 characters).");
            return;
        }
        
        // Team size validation
        let teamSizeNum = parseInt(teamSizeVal);
        if(isNaN(teamSizeNum) || teamSizeNum < 1 || teamSizeNum > 20){
            alert("Please enter a valid team size (1-20 members).");
            return;
        }

        // Team meta validation
        if(teamSizeNum > 1){
            if(!teamName || teamName.length < 2 || teamName.length > 100){
                alert('Please enter a valid team name (2-100 characters).');
                return;
            }
            if(teamCaptain && (teamCaptain.length < 2 || teamCaptain.length > 100)){
                alert('Please enter a valid captain name (2-100 characters) or leave it blank.');
                return;
            }
        }

        // Get event details for category
        const eventName = eventInput.value;
        const eventDetails = eventsList.find(e => e.name === eventName);
        const eventCategory = eventDetails ? eventDetails.category : 'General';

        // Duplicate team name check (per event)
        if(teamSizeNum > 1){
            try{
                const existing = JSON.parse(localStorage.getItem('registrations')) || [];
                const norm = s => String(s || '').toLowerCase().trim().replace(/\s+/g,' ');
                const exists = existing.some(r => (r.event === eventName) && norm(r.teamName) === norm(teamName));
                if(exists){
                    alert('A team with this name has already registered for this event. Please choose a different team name.');
                    return;
                }
            }catch(_e){/* ignore parse issues */}
        }

        // Collect team members if size > 1 (allowed for every event)
        let teamMembers = [];
        if(teamSizeNum > 1 && teamMembersContainer){
            const rows = teamMembersContainer.querySelectorAll('.team-member-row');
            if(rows.length !== teamSizeNum - 1){
                renderTeamMemberRows(teamSizeNum - 1);
            }
            for(const row of rows){
                const mName = row.querySelector('input[name="member-name"]').value.trim();
                const mEmail = row.querySelector('input[name="member-email"]').value.trim();
                if(!mName || mName.length < 2 || mName.length > 100){
                    alert('Please provide a valid team member name (2-100 chars).');
                    return;
                }
                if(mEmail && (!emailRegex.test(mEmail) || mEmail.length > 254)){
                    alert('Please provide a valid email for team members or leave it blank.');
                    return;
                }
                teamMembers.push({ name: mName, email: mEmail });
            }
        }
        
        // Generate unique registration ID
        const regId = 'REG_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
// Save pending registration (including file) to IndexedDB, then go to payment
        const pendingRecord = {
            id: regId,
            data: {
                eventName: eventName,
                eventCategory: eventCategory,
                eventFee: parseInt((feeInput.value || '0').replace(/[^\d]/g,'')) || 0,
                participantName: name,
                participantEmail: email,
                participantPhone: phone,
                participantCollege: college,
                participantRoll: rollNumber,
                teamSize: teamSizeNum,
                teamName: teamSizeNum > 1 ? teamName : '',
                teamCaptain: teamSizeNum > 1 ? teamCaptain : '',
                teamMembers: teamMembers
            },
            collegeIdFile: idProof // File/Blob is storable in IndexedDB
        };

        // IndexedDB helpers
        const idbOpen = () => new Promise((resolve, reject) => {
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
        const idbPut = (db, record) => new Promise((resolve, reject) => {
            const tx = db.transaction('pendingRegs', 'readwrite');
            tx.objectStore('pendingRegs').put(record);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });

        // Save to sessionStorage as backup (works better on mobile)
        try {
            sessionStorage.setItem('pendingPaymentId', regId);
            sessionStorage.setItem('pendingPaymentEmail', email);
            sessionStorage.setItem('pendingPaymentEvent', eventName);
            sessionStorage.setItem('pendingRegData', JSON.stringify(pendingRecord.data));
            console.log('Saved registration to sessionStorage as backup');
        } catch (e) {
            console.warn('sessionStorage backup failed:', e);
        }

        // Try IndexedDB for file storage
        let idbSuccess = false;
        try {
            const db = await idbOpen();
            await idbPut(db, pendingRecord);
            console.log('Successfully saved to IndexedDB:', regId);
            
            // Verify the save by reading it back
            const verification = await new Promise((resolve, reject) => {
                const tx = db.transaction('pendingRegs', 'readonly');
                const req = tx.objectStore('pendingRegs').get(regId);
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
            
            if (verification) {
                console.log('Verified IndexedDB save:', verification);
                idbSuccess = true;
            }
        } catch (e) {
            console.error('IndexedDB save failed (using sessionStorage backup):', e);
        }

        // If IndexedDB failed but we have sessionStorage, continue anyway
        if (!idbSuccess) {
            console.warn('IndexedDB unavailable - file will need to be re-uploaded on payment page');
        }

        // Redirect to payment with unique registration ID
        const paymentUrl = `payment.html?regId=${regId}&email=${encodeURIComponent(email)}&event=${encodeURIComponent(eventName)}`;
        window.location.href = paymentUrl;
    });
}

// Handle terms acceptance checkbox to enable/disable submit button
document.addEventListener('DOMContentLoaded', function() {
    const termsCheckbox = document.getElementById('terms-acceptance');
    const submitBtn = document.getElementById('submit-btn');
    
    if (termsCheckbox && submitBtn) {
        // Initial state - button is disabled
        submitBtn.disabled = true;
        
        termsCheckbox.addEventListener('change', function() {
            if (this.checked) {
                submitBtn.disabled = false;
                submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                submitBtn.classList.add('hover:scale-110', 'hover:shadow-2xl');
            } else {
                submitBtn.disabled = true;
                submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
                submitBtn.classList.remove('hover:scale-110', 'hover:shadow-2xl');
            }
        });
    }
});
