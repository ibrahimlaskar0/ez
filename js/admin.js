/**
 * Admin Dashboard JavaScript
 * Handles admin dashboard functionality for event registrations
 * Version: 2.1
 */

let currentCategory = 'technical';
// Disable optional backend metadata enrichment for images (no API in your backend)
window.ENABLE_IMAGE_METADATA = false;

/**
 * Get backend category name from frontend category name
 * Maps lowercase frontend categories to proper case backend categories
 */
function getBackendCategoryName(frontendCategory) {
    const categoryMap = {
        'technical': 'Technical',
        'cultural': 'Cultural',
        'sports': 'Sports',
        'e-sports': 'E-Sports',
        'e_sports': 'E-Sports',
        'competitions': 'Competitions'
    };
    return categoryMap[frontendCategory.toLowerCase().replace('-', '_')] || frontendCategory;
}

/**
 * Show/hide category tables and update active tab
 */
function showCategory(category) {
    document.querySelectorAll('.category-table').forEach(table => {
        table.classList.add('hidden');
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('bg-indigo-600', 'text-white');
        btn.classList.add('text-gray-600', 'hover:text-gray-900');
    });
    
    const targetTable = document.getElementById(`${category}-table`);
    if (targetTable) {
        targetTable.classList.remove('hidden');
    }
    
    const activeBtn = document.querySelector(`[data-category="${category}"]`);
    if (activeBtn) {
        activeBtn.classList.add('bg-indigo-600', 'text-white');
        activeBtn.classList.remove('text-gray-600', 'hover:text-gray-900');
    }
    
    currentCategory = category;
    loadCategoryData(category);
    
    setTimeout(() => {
        try {
            applyFilters();
        } catch (e) {}
    }, 100);
}

/**
 * Format team members list for display
 */
function formatTeamMembers(reg) {
    if (!reg || !Array.isArray(reg.teamMembers) || reg.teamMembers.length === 0) return '';
    return reg.teamMembers.map(m => m.email ? `${m.name} <${m.email}>` : m.name).join('; ');
}

/**
 * Load and display data for a specific category
 */
async function loadCategoryData(category) {
    const listEl = document.getElementById(`${category}-list`);
    
    if (!listEl) {
        return;
    }
    
    listEl.innerHTML = '<div class="px-6 py-8 text-center text-gray-500"><i class="bi bi-hourglass-split animate-spin text-3xl mb-2"></i><p>Loading...</p></div>';
    
    // Fetch from backend API using ApiService
    let registrations = [];
    try {
        const categoryName = getBackendCategoryName(category);
        const result = await ApiService.getRegistrationsByCategory(categoryName);
        if (result.success && result.data) {
            // Transform backend data to match frontend format
            registrations = result.data.map(reg => {
                // Safely parse payment_proof
                let screenshot = null;
                let screenshotStored = null;
                if (reg.payment_proof) {
                    try {
                        const proof = typeof reg.payment_proof === 'string' ? JSON.parse(reg.payment_proof) : reg.payment_proof;
                        screenshot = proof.originalName || proof.original || null;
                        screenshotStored = proof.path || proof.storedName || proof.filename || proof.fileName || null;
                    } catch (e) {
                        console.warn('Failed to parse payment_proof:', e);
                    }
                }
                
                // Safely parse team_members
                let teamMembers = [];
                if (reg.team_members) {
                    try {
                        teamMembers = typeof reg.team_members === 'string' ? JSON.parse(reg.team_members) : reg.team_members;
                    } catch (e) {
                        console.warn('Failed to parse team_members:', e);
                    }
                }
                
                const idProofStored = reg.college_id_path || reg.college_id_filename || reg.college_id_stored_name || reg.college_id_file_name || null;
                
                const mappedReg = {
                    id: reg.registration_id,
                    event: reg.event_name,
                    category: reg.event_category,
                    name: reg.participant_name,
                    email: reg.participant_email,
                    phone: reg.participant_phone,
                    college: reg.participant_college,
                    rollNumber: reg.participant_roll,
                    idProofName: reg.college_id_original_name,
                    idProofStored: idProofStored,
                    screenshot: screenshot,
                    screenshotStored: screenshotStored,
                    teamSize: reg.team_size,
                    teamName: reg.team_name,
                    teamCaptain: reg.team_captain,
                    teamMembers: teamMembers,
                    fee: `₹${reg.event_fee}`,
                    utr: reg.utr_number,
                    status: reg.payment_status,
                    timestamp: reg.submitted_at,
                    lastUpdated: reg.updated_at
                };
                
                // Debug log to verify registration IDs
                if (!mappedReg.id || mappedReg.id.length < 10) {
                    console.warn('Invalid or short registration ID:', mappedReg.id, 'from registration:', reg);
                }
                
                return mappedReg;
            });
        }
    } catch (error) {
        console.error('Failed to fetch registrations from backend:', error);
        // Fallback to localStorage
        const categoryKey = `registrations_${category.toLowerCase().replace('-', '_')}`;
        registrations = JSON.parse(localStorage.getItem(categoryKey)) || [];
    }
    
    listEl.innerHTML = '';
    
    if (registrations.length === 0) {
        listEl.innerHTML = `
            <div class="px-6 py-8 text-center text-gray-500">
                <div class="flex flex-col items-center">
                    <i class="bi bi-inbox text-3xl mb-2"></i>
                    <p>No registrations for ${category} events yet</p>
                </div>
            </div>`;
        return;
    }
    
    // Group registrations by event
    const grouped = registrations.reduce((acc, reg) => {
        const key = reg.event || 'Unknown Event';
        (acc[key] = acc[key] || []).push(reg);
        return acc;
    }, {});
    
    // Create sections for each event
    Object.keys(grouped).sort().forEach(eventName => {
        const regs = grouped[eventName];
        const section = document.createElement('div');
        section.className = 'mb-6';
        
        section.innerHTML = `
            <div class="px-6 py-3 bg-white border-b flex items-center justify-between flex-wrap gap-2">
                <h4 class="text-base font-semibold">${eventName}</h4>
                <div class="flex items-center gap-2 text-sm">
                    <button onclick="exportEventData('${category}','${eventName.replace(/'/g, "&#39;")}','excel')" class="btn btn-ghost px-3 py-2">
                        <i data-feather="download" class="w-4 h-4"></i>
                        Excel
                    </button>
                </div>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reg ID</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">College</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll Number</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Proof</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Proof</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Size</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Name</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Captain</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Members</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UTR ID</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200"></tbody>
                </table>
            </div>`;
        
        const tbody = section.querySelector('tbody');
        regs.forEach(reg => {
            // Validate registration ID before rendering
            if (!reg.id || typeof reg.id !== 'string' || reg.id.length < 5) {
                console.error('Skipping registration with invalid ID:', reg);
                return;
            }
            
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-50';
            
            // Escape the ID for use in onclick handlers
            const safeId = reg.id.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
            const safeCategory = category.replace(/'/g, "&#39;");
            
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono text-xs">${reg.id ? (reg.id.length > 12 ? reg.id.substring(0, 12) + '...' : reg.id) : 'N/A'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${reg.name || 'N/A'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${reg.email || 'N/A'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${reg.phone || 'N/A'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${reg.college || 'N/A'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${reg.rollNumber || 'N/A'}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${reg.idProofName ? `<span class=\"text-xs bg-green-100 text-green-800 px-2 py-1 rounded cursor-pointer hover:bg-green-200\" onclick=\"viewIdProof('${safeId}','${(reg.idProofStored || reg.idProofName).replace(/'/g, "&#39;")}')\" title=\"Click to view ID proof\">${reg.idProofName.substring(0, 20)}${reg.idProofName.length > 20 ? '...' : ''} 📄</span>` : 'N/A'}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${reg.screenshot ? `<span class=\"text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded cursor-pointer hover:bg-blue-200\" onclick=\"viewPaymentProof('${safeId}','${(reg.screenshotStored || reg.screenshot).replace(/'/g, "&#39;")}','${(reg.utr || 'N/A').toString().replace(/'/g, "&#39;")}')\" title=\"Click to view payment proof\">${reg.screenshot.substring(0, 20)}${reg.screenshot.length > 20 ? '...' : ''} 💳</span>` : 'N/A'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${reg.teamSize || '1'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${reg.teamName || ''}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${reg.teamCaptain || ''}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formatTeamMembers(reg)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">${reg.fee || '₹0'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">${reg.utr || reg.utrId || 'Pending'}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center space-x-2">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${reg.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">${reg.status === 'confirmed' ? 'Confirmed' : 'Pending'}</span>
                        ${reg.status === 'pending' ? `<button onclick="updateStatus('${safeCategory}','${safeId}','confirmed')" class="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded transition-colors" title="Mark as Confirmed"><i class="bi bi-check"></i></button>` : `<button onclick="updateStatus('${safeCategory}','${safeId}','pending')" class="text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded transition-colors" title="Mark as Pending"><i class="bi bi-clock"></i></button>`}
                    </div>
                </td>`;
            tbody.appendChild(tr);
        });
        
        listEl.appendChild(section);
    });
    
    // Refresh feather icons
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
    
    // Apply filters after loading
    try {
        applyFilters();
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    } catch (e) {}
}

/**
 * Update statistics dashboard
 */
async function updateStats() {
    try {
        // Fetch stats from backend API using ApiService
        const result = await ApiService.makeRequest('/admin/stats');
        if (result.success && result.data) {
            const totalRegsEl = document.getElementById('total-registrations');
            const pendingPaymentsEl = document.getElementById('pending-payments');
            const totalRevenueEl = document.getElementById('total-revenue');
            
            if (totalRegsEl) totalRegsEl.textContent = result.data.totalRegistrations;
            if (pendingPaymentsEl) pendingPaymentsEl.textContent = result.data.pendingPayments;
            if (totalRevenueEl) totalRevenueEl.textContent = `₹${result.data.totalRevenue}`;
            return;
        }
    } catch (error) {
        console.error('Failed to fetch stats from backend:', error);
    }
    
    // Fallback to localStorage
    const categories = ['technical', 'cultural', 'sports', 'e_sports', 'competitions'];
    let totalRegistrations = 0;
    let pendingPayments = 0;
    let totalRevenue = 0;
    
    categories.forEach(category => {
        const categoryKey = `registrations_${category}`;
        const registrations = JSON.parse(localStorage.getItem(categoryKey)) || [];
        totalRegistrations += registrations.length;
        
        registrations.forEach(reg => {
            if (reg.status === 'pending') pendingPayments++;
            if (reg.status === 'confirmed') {
                const fee = parseInt(reg.fee.replace('₹', '')) || 0;
                totalRevenue += fee;
            }
        });
    });
    
    const totalRegsEl = document.getElementById('total-registrations');
    const pendingPaymentsEl = document.getElementById('pending-payments');
    const totalRevenueEl = document.getElementById('total-revenue');
    
    if (totalRegsEl) totalRegsEl.textContent = totalRegistrations;
    if (pendingPaymentsEl) pendingPaymentsEl.textContent = pendingPayments;
    if (totalRevenueEl) totalRevenueEl.textContent = `₹${totalRevenue}`;
}

/**
 * Export all registrations to Excel
 */
async function exportAllData() {
    if (typeof window.XLSX === 'undefined') {
        showStatusMessage('Excel export library not loaded. Please refresh the page and try again.', 'error');
        return;
    }
    
    try {
        // Fetch all registrations from backend API
        const result = await ApiService.makeRequest('/registration/all');
        
        if (!result.success || !result.data || result.data.length === 0) {
            // Fallback to localStorage if backend fails
            console.warn('Backend fetch failed, trying localStorage fallback');
            const categories = ['technical', 'cultural', 'sports', 'e_sports', 'competitions'];
            let allRegistrations = [];
            
            categories.forEach(category => {
                const categoryKey = `registrations_${category}`;
                const registrations = JSON.parse(localStorage.getItem(categoryKey)) || [];
                allRegistrations = allRegistrations.concat(registrations);
            });
            
            if (allRegistrations.length === 0) {
                showStatusMessage('No data to export', 'error');
                return;
            }
            
            return processExcelExport(allRegistrations);
        }
        
        // Process backend data for Excel export
        const allRegistrations = result.data;
        return processExcelExport(allRegistrations);
        
    } catch (error) {
        console.error('Export failed:', error);
        showStatusMessage('Failed to fetch data for export', 'error');
        return;
    }
}

/**
 * Process registrations and export to Excel
 */
function processExcelExport(allRegistrations) {
    if (!allRegistrations || allRegistrations.length === 0) {
        showStatusMessage('No data to export', 'error');
        return;
    }
    
    const excelData = allRegistrations.map(reg => {
        // Handle both backend format and frontend format
        const registrationId = reg.registration_id || reg.id || 'N/A';
        const eventName = reg.event_name || reg.event || 'N/A';
        const category = reg.event_category || reg.category || 'N/A';
        const name = reg.participant_name || reg.name || 'N/A';
        const email = reg.participant_email || reg.email || 'N/A';
        const phone = reg.participant_phone || reg.phone || 'N/A';
        const college = reg.participant_college || reg.college || 'N/A';
        const rollNumber = reg.participant_roll || reg.rollNumber || 'N/A';
        const idProofName = reg.college_id_original_name || reg.idProofName || 'N/A';
        const teamSize = reg.team_size || reg.teamSize || '1';
        const teamName = reg.team_name || reg.teamName || '';
        const teamCaptain = reg.team_captain || reg.teamCaptain || '';
        
        // Handle team members - may be JSON string from backend
        let teamMembers = [];
        if (reg.team_members) {
            try {
                teamMembers = typeof reg.team_members === 'string' ? JSON.parse(reg.team_members) : reg.team_members;
            } catch (e) {
                console.warn('Failed to parse team_members:', e);
            }
        } else if (reg.teamMembers) {
            teamMembers = reg.teamMembers;
        }
        
        const teamMembersStr = formatTeamMembers({ teamMembers });
        const fee = reg.event_fee ? `₹${reg.event_fee}` : reg.fee || '₹0';
        const utr = reg.utr_number || reg.utr || reg.utrId || 'Pending';
        const screenshot = reg.screenshot || 'N/A';
        const status = reg.payment_status || reg.status || 'pending';
        const timestamp = reg.submitted_at || reg.timestamp;
        const lastUpdated = reg.updated_at || reg.lastUpdated;
        
        return {
            'Registration ID': registrationId,
            'Event': eventName,
            'Category': category,
            'Name': name,
            'Email': email,
            'Phone': phone,
            'College': college,
            'Roll Number': rollNumber,
            'ID Proof File': idProofName,
            'Team Size': teamSize,
            'Team Name': teamName,
            'Team Captain': teamCaptain,
            'Team Members': teamMembersStr,
            'Fee': fee,
            'UTR ID': utr,
            'Payment Screenshot': screenshot,
            'Status': status,
            'Registration Date': timestamp ? new Date(timestamp).toLocaleDateString() : 'N/A',
            'Last Updated': lastUpdated ? new Date(lastUpdated).toLocaleDateString() : 'N/A'
        };
    });
    
    try {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);
        
        const colWidths = [
            {wch: 20}, {wch: 25}, {wch: 12}, {wch: 20}, {wch: 30}, {wch: 15}, {wch: 25}, {wch: 15}, {wch: 20},
            {wch: 10}, {wch: 20}, {wch: 18}, {wch: 30}, {wch: 10}, {wch: 15}, {wch: 25}, {wch: 12}, {wch: 15}, {wch: 15}
        ];
        ws['!cols'] = colWidths;
        
        XLSX.utils.book_append_sheet(wb, ws, "All Registrations");
        
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const filename = `esplendidez-registrations-${dateStr}.xlsx`;
        
        XLSX.writeFile(wb, filename);
        showStatusMessage(`Excel file downloaded: ${filename}`, 'success');
    } catch (error) {
        showStatusMessage('Error generating Excel file', 'error');
    }
}

/**
 * Update registration status
 */
async function updateStatus(category, idOrEmail, newStatus) {
    // Validate inputs
    if (!idOrEmail || !newStatus) {
        console.error('Invalid parameters:', { idOrEmail, newStatus });
        showStatusMessage('Missing registration ID or status', 'error');
        return;
    }
    
    // Validate that idOrEmail looks like a registration ID or email
    // Registration IDs are in format: ESP2026XXXX (e.g., ESP20260001)
    const isEmail = idOrEmail.includes('@');
    const looksLikeRegId = idOrEmail.startsWith('ESP') || idOrEmail.length >= 5;
    
    if (!isEmail && !looksLikeRegId) {
        console.error('Invalid registration ID format:', idOrEmail);
        showStatusMessage(`Invalid registration ID format: ${idOrEmail.substring(0, 20)}`, 'error');
        return;
    }
    
    try {
        console.log('Updating status:', { idOrEmail, newStatus });
        
        // Update via backend API using ApiService
        const result = await ApiService.updatePaymentStatus(idOrEmail, newStatus);
        if (result.success) {
            showStatusMessage(`Registration status updated to ${newStatus}`, 'success');
            await updateStats();
            await loadCategoryData(currentCategory);
            try {
                applyFilters();
            } catch (_) {}
            return;
        }
        throw new Error('Backend update failed');
    } catch (error) {
        console.error('Failed to update status via backend:', error);
        
        // Fallback to localStorage
        const key = category.toLowerCase().replace('-', '_');
        const categoryKey = `registrations_${key}`;
        let registrations = JSON.parse(localStorage.getItem(categoryKey)) || [];
        
        const idx = registrations.findIndex(reg => 
            (reg.id && reg.id === idOrEmail) || 
            (!reg.id && reg.email === idOrEmail)
        );
        
        if (idx !== -1) {
            registrations[idx].status = newStatus;
            registrations[idx].lastUpdated = new Date().toISOString();
            localStorage.setItem(categoryKey, JSON.stringify(registrations));
            
            // Also update in main registrations if it exists
            try {
                let all = JSON.parse(localStorage.getItem('registrations')) || [];
                const allIdx = all.findIndex(r => 
                    (r.id && r.id === registrations[idx].id) || 
                    (!r.id && r.email === registrations[idx].email && r.event === registrations[idx].event)
                );
                if (allIdx !== -1) {
                    all[allIdx].status = newStatus;
                    all[allIdx].lastUpdated = registrations[idx].lastUpdated;
                    localStorage.setItem('registrations', JSON.stringify(all));
                }
            } catch (_) {}
            
            showStatusMessage(`Registration status updated to ${newStatus} (localStorage)`, 'success');
            updateStats();
            loadCategoryData(currentCategory);
            try {
                applyFilters();
            } catch (_) {}
        } else {
            showStatusMessage('Registration not found', 'error');
        }
    }
}

/**
 * Show status messages to user
 */
function showStatusMessage(message, type) {
    try {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all duration-300 ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    } catch (e) {
        alert(message);
    }
}

/**
 * Export category-specific data to Excel
 */
async function exportCategoryData(category, format = 'excel') {
    if (format === 'excel' && typeof window.XLSX === 'undefined') {
        showStatusMessage('Excel export library not loaded. Please refresh the page and try again.', 'error');
        return;
    }
    
    // Fetch data from backend API
    let registrations = [];
    try {
        const backendCategoryName = getBackendCategoryName(category);
        const result = await ApiService.getRegistrationsByCategory(backendCategoryName);
        
        if (result.success && result.data && result.data.length > 0) {
            // Transform backend data to match frontend format (same as loadCategoryData)
            registrations = result.data.map(reg => ({
                id: reg.registration_id,
                event: reg.event_name,
                category: reg.event_category,
                name: reg.participant_name,
                email: reg.participant_email,
                phone: reg.participant_phone,
                college: reg.participant_college,
                rollNumber: reg.participant_roll,
                idProofName: reg.college_id_original_name,
                teamSize: reg.team_size,
                teamName: reg.team_name,
                teamCaptain: reg.team_captain,
                teamMembers: typeof reg.team_members === 'string' ? JSON.parse(reg.team_members) : reg.team_members,
                fee: `₹${reg.event_fee}`,
                utr: reg.utr_number,
                status: reg.payment_status,
                timestamp: reg.submitted_at,
                lastUpdated: reg.updated_at
            }));
        }
    } catch (error) {
        console.error('Failed to fetch registrations from backend:', error);
        // Fallback to localStorage
        const categoryKey = `registrations_${category.toLowerCase().replace('-', '_')}`;
        registrations = JSON.parse(localStorage.getItem(categoryKey)) || [];
    }
    
    if (registrations.length === 0) {
        showStatusMessage(`No ${category} registrations to export`, 'error');
        return;
    }
    
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ');
    
    const excelData = registrations.map(reg => {
        return {
            'Event': reg.event || 'N/A',
            'Name': reg.name || 'N/A',
            'Email': reg.email || 'N/A',
            'Phone': reg.phone || 'N/A',
            'College': reg.college || 'N/A',
            'Roll Number': reg.rollNumber || 'N/A',
            'ID Proof File': reg.idProofName || 'N/A',
            'Team Size': reg.teamSize || '1',
            'Team Name': reg.teamName || '',
            'Team Captain': reg.teamCaptain || '',
            'Team Members': formatTeamMembers(reg),
            'Fee': reg.fee || '₹0',
            'UTR ID': reg.utr || reg.utrId || 'Pending',
            'Payment Screenshot': reg.screenshot || 'N/A',
            'Status': reg.status || 'pending',
            'Registration Date': reg.timestamp ? new Date(reg.timestamp).toLocaleDateString() : 'N/A',
            'Last Updated': reg.lastUpdated ? new Date(reg.lastUpdated).toLocaleDateString() : 'N/A'
        };
    });
    
    try {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);
        
        const colWidths = [
            {wch: 25}, {wch: 20}, {wch: 30}, {wch: 15}, {wch: 25}, {wch: 15}, {wch: 20},
            {wch: 10}, {wch: 20}, {wch: 18}, {wch: 30}, {wch: 10}, {wch: 15}, {wch: 25},
            {wch: 12}, {wch: 15}, {wch: 15}
        ];
        ws['!cols'] = colWidths;
        
        XLSX.utils.book_append_sheet(wb, ws, `${categoryName} Events`);
        
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const filename = `esplendidez-${category}-registrations-${dateStr}.xlsx`;
        
        XLSX.writeFile(wb, filename);
        showStatusMessage(`${categoryName} Excel file downloaded`, 'success');
    } catch (error) {
        showStatusMessage('Error generating Excel file', 'error');
    }
}

/**
 * Export specific event data to Excel
 */
async function exportEventData(category, eventName, format = 'excel') {
    if (format === 'excel' && typeof window.XLSX === 'undefined') {
        showStatusMessage('Excel export library not loaded. Please refresh the page and try again.', 'error');
        return;
    }
    
    // Fetch data from backend API
    let allRegistrations = [];
    try {
        const backendCategoryName = getBackendCategoryName(category);
        const result = await ApiService.getRegistrationsByCategory(backendCategoryName);
        
        if (result.success && result.data && result.data.length > 0) {
            // Transform backend data to match frontend format (same as loadCategoryData)
            allRegistrations = result.data.map(reg => ({
                id: reg.registration_id,
                event: reg.event_name,
                category: reg.event_category,
                name: reg.participant_name,
                email: reg.participant_email,
                phone: reg.participant_phone,
                college: reg.participant_college,
                rollNumber: reg.participant_roll,
                idProofName: reg.college_id_original_name,
                teamSize: reg.team_size,
                teamName: reg.team_name,
                teamCaptain: reg.team_captain,
                teamMembers: typeof reg.team_members === 'string' ? JSON.parse(reg.team_members) : reg.team_members,
                fee: `₹${reg.event_fee}`,
                utr: reg.utr_number,
                status: reg.payment_status,
                timestamp: reg.submitted_at,
                lastUpdated: reg.updated_at
            }));
        }
    } catch (error) {
        console.error('Failed to fetch registrations from backend:', error);
        // Fallback to localStorage
        const categoryKey = `registrations_${category.toLowerCase().replace('-', '_')}`;
        allRegistrations = JSON.parse(localStorage.getItem(categoryKey)) || [];
    }
    
    const filtered = allRegistrations.filter(r => (r.event || '') === eventName);
    
    if (filtered.length === 0) {
        showStatusMessage(`No data to export for ${eventName}`, 'error');
        return;
    }
    
    const excelData = filtered.map(reg => ({
        'Registration ID': reg.id || 'N/A',
        'Name': reg.name || 'N/A',
        'Email': reg.email || 'N/A',
        'Phone': reg.phone || 'N/A',
        'College': reg.college || 'N/A',
        'Roll Number': reg.rollNumber || 'N/A',
        'ID Proof File': reg.idProofName || 'N/A',
        'Team Size': reg.teamSize || '1',
        'Team Name': reg.teamName || '',
        'Team Captain': reg.teamCaptain || '',
        'Team Members': formatTeamMembers(reg),
        'Fee': reg.fee || '₹0',
        'UTR ID': reg.utr || reg.utrId || 'Pending',
        'Payment Screenshot': reg.screenshot || 'N/A',
        'Status': reg.status || 'pending',
        'Registration Date': reg.timestamp ? new Date(reg.timestamp).toLocaleDateString() : 'N/A',
        'Last Updated': reg.lastUpdated ? new Date(reg.lastUpdated).toLocaleDateString() : 'N/A'
    }));
    
    try {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);
        ws['!cols'] = [
            {wch: 20}, {wch: 20}, {wch: 28}, {wch: 15}, {wch: 24}, {wch: 15}, {wch: 20},
            {wch: 10}, {wch: 20}, {wch: 18}, {wch: 30}, {wch: 10}, {wch: 15}, {wch: 25},
            {wch: 12}, {wch: 14}, {wch: 14}
        ];
        
        XLSX.utils.book_append_sheet(wb, ws, eventName.substring(0, 28));
        
        const dateStr = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `esplendidez-${category}-${eventName.replace(/\s+/g, '_')}-${dateStr}.xlsx`);
        showStatusMessage(`${eventName} Excel downloaded`, 'success');
    } catch (err) {
        showStatusMessage('Error generating Excel file', 'error');
    }
}

/**
 * Apply search and status filters
 */
function applyFilters() {
    const filterInput = document.getElementById('admin-filter');
    const statusSel = document.getElementById('admin-status-filter');
    const list = document.getElementById(`${currentCategory}-list`);
    
    if (!list) {
        return;
    }
    
    const q = (filterInput?.value || '').toLowerCase().trim();
    const status = (statusSel?.value || 'all');
    
    let visibleCount = 0;
    let totalCount = 0;
    
    list.querySelectorAll('tbody tr').forEach(tr => {
        totalCount++;
        const text = (tr.textContent || '').toLowerCase();
        const statusBadge = (tr.querySelector('span')?.textContent || '').toLowerCase();
        
        const matchQ = q === '' || text.includes(q);
        const matchStatus = status === 'all' || statusBadge.includes(status);
        
        if (matchQ && matchStatus) {
            tr.style.display = '';
            visibleCount++;
        } else {
            tr.style.display = 'none';
        }
    });
}

/**
 * Admin authentication check
 */
function ensureAdminAuth() {
    const overlay = document.getElementById('admin-login');
    if (!overlay) return true;
    
    if (sessionStorage.getItem('adminAuthed') === '1') {
        overlay.classList.add('hidden');
        return true;
    }
    
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    
    const passInput = document.getElementById('admin-pass-input');
    const loginBtn = document.getElementById('admin-login-btn');
    const cancelBtn = document.getElementById('admin-login-cancel');
    const errorEl = document.getElementById('admin-login-error');
    
    function tryLogin() {
        const pass = (passInput.value || '').trim();
        const saved = localStorage.getItem('admin_password') || 'esplendidez2026';
        
        if (pass === saved) {
            sessionStorage.setItem('adminAuthed', '1');
            overlay.classList.add('hidden');
            overlay.classList.remove('flex');
            
            const filterInput = document.getElementById('admin-filter');
            const statusSel = document.getElementById('admin-status-filter');
            
            filterInput?.addEventListener('input', applyFilters);
            statusSel?.addEventListener('change', applyFilters);
            
            updateStats();
            showCategory('technical');
        } else {
            errorEl.classList.remove('hidden');
        }
    }
    
    loginBtn.addEventListener('click', tryLogin);
    passInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            tryLogin();
        }
    });
    cancelBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    return false;
}

// ID Proof and Payment Proof viewers using backend API
async function viewIdProof(registrationId, originalName) {
    try {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50';
        
        // Show image immediately using uploads path; we'll enrich with metadata if available.
        const immediateUrl = ApiService.getImageUrl(originalName || '');
        console.log('Attempting to load ID proof from:', immediateUrl);
        modal.innerHTML = `
            <div class="bg-white rounded-lg max-w-4xl mx-4 max-h-90vh overflow-auto">
                <div class="flex justify-between items-center p-4 border-b">
                    <h3 class="text-lg font-semibold">ID Proof</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700 text-2xl font-bold">&times;</button>
                </div>
                <div class="p-6 text-center">
                    <div id="id-proof-wrap">
                        <img src="${immediateUrl}" alt="ID Proof" class="max-w-full max-h-96 mx-auto border rounded shadow"
                             onclick="window.open(this.src, '_blank')"
                             onload="const e=document.getElementById('id-proof-error'); if(e) e.classList.add('hidden');"
                             onerror="const e=document.getElementById('id-proof-error'); if(e) e.classList.remove('hidden');"/>
                    </div>
                    <div id="id-proof-error" class="p-4 bg-red-50 rounded hidden"><p class="text-red-600">❌ Failed to load image</p><p class="text-sm text-red-500 mt-1">File not found at uploads</p></div>
                    <p class="text-xs text-gray-500 mt-2">Click image to open in new tab</p>
                </div>
            </div>`;
        
        document.body.appendChild(modal);
        
        // Try to fetch image metadata from backend (non-blocking for display)
        if (window.ENABLE_IMAGE_METADATA) {
            try {
                const result = await ApiService.getImageInfo(registrationId, 'id-proof');
                if (result && result.success) {
                    const imageData = result.data;
                    const computedUrl = ApiService.getImageUrl(imageData.filename || imageData.fileName || '');
                    const imageUrl = computedUrl || (`http://localhost:5001${imageData.url || ''}`);
                    // Enrich modal with metadata (do not remove the already loaded image)
                    const metaHtml = `
                        <div class=\"grid grid-cols-2 gap-4 text-sm mt-4\">
                            <div><strong>Name:</strong> ${(imageData.participant && imageData.participant.name) || 'Unknown'}</div>
                            <div><strong>Email:</strong> ${(imageData.participant && imageData.participant.email) || 'Unknown'}</div>
                            <div><strong>Original Filename:</strong> ${imageData.originalName || ''}</div>
                            <div><strong>Registration ID:</strong> ${registrationId}</div>
                            <div><strong>Backend Path:</strong> <code>${imageData.url || ''}</code></div>
                            <div><strong>Stored as:</strong> <code>${imageData.filename || imageData.fileName || ''}</code></div>
                        </div>`;
                    const container = modal.querySelector('.p-6');
                    if (container) container.insertAdjacentHTML('beforeend', metaHtml);
                }
            } catch (_) { /* silently ignore */ }
        }
            
    } catch (error) {
        console.error('Error loading ID proof:', error);
        // Try a graceful fallback: directly load from uploads using the original filename
        const fallbackUrl = ApiService.getImageUrl(originalName || '');
        const existingModal = document.querySelector('.fixed.inset-0');
        if (existingModal && fallbackUrl) {
            existingModal.innerHTML = `
                <div class="bg-white rounded-lg max-w-4xl mx-4 max-h-90vh overflow-auto">
                    <div class="flex justify-between items-center p-4 border-b">
                        <h3 class="text-lg font-semibold">ID Proof</h3>
                        <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700 text-2xl font-bold">&times;</button>
                    </div>
                    <div class="p-6 text-center">
                        <img src="${fallbackUrl}" alt="ID Proof" class="max-w-full max-h-96 mx-auto border rounded shadow"
                             onerror="this.parentElement.innerHTML='<div class=\"p-4 bg-red-50 rounded\"><p class=\"text-red-600\">❌ Failed to load image</p><p class=\"text-sm text-red-500 mt-1\">${error.message || 'Image not found'}</p></div>'"/>
                        <p class="text-xs text-gray-500 mt-2">Attempted fallback path</p>
                    </div>
                </div>`;
            return;
        }
        
        const errorModal = document.createElement('div');
        errorModal.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50';
        errorModal.innerHTML = `
            <div class="bg-white rounded-lg max-w-md mx-4">
                <div class="p-6 text-center">
                    <div class="text-red-500 text-4xl mb-4">❌</div>
                    <h3 class="text-lg font-semibold mb-2">Failed to Load ID Proof</h3>
                    <p class="text-gray-600 mb-4">${error.message}</p>
                    <button onclick="this.closest('.fixed').remove()" class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Close</button>
                </div>
            </div>`;
        document.body.appendChild(errorModal);
    }
}

async function viewPaymentProof(registrationId, originalName, utr) {
    try {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50';
        
        // Show image immediately using uploads path; we'll enrich with metadata if available.
        const immediateUrl = ApiService.getImageUrl(originalName || '');
        console.log('Attempting to load payment proof from:', immediateUrl);
        modal.innerHTML = `
            <div class="bg-white rounded-lg max-w-4xl mx-4 max-h-90vh overflow-auto">
                <div class="flex justify-between items-center p-4 border-b">
                    <h3 class="text-lg font-semibold">Payment Proof - UTR: ${utr}</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700 text-2xl font-bold">&times;</button>
                </div>
                <div class="p-6 text-center">
                    <div id="pay-proof-wrap">
                        <img src="${immediateUrl}" alt="Payment Screenshot" class="max-w-full max-h-96 mx-auto border rounded shadow"
                             onclick="window.open(this.src, '_blank')"
                             onload="const e=document.getElementById('pay-proof-error'); if(e) e.classList.add('hidden');"
                             onerror="const e=document.getElementById('pay-proof-error'); if(e) e.classList.remove('hidden');"/>
                    </div>
                    <div id="pay-proof-error" class="p-4 bg-red-50 rounded hidden"><p class="text-red-600">❌ Failed to load payment screenshot</p><p class="text-sm text-red-500 mt-1">File not found at uploads</p></div>
                    <p class="text-xs text-gray-500 mt-2">Click image to open in new tab</p>
                </div>
            </div>`;
        
        document.body.appendChild(modal);
        
        // Try to fetch image metadata from backend (non-blocking for display)
        if (window.ENABLE_IMAGE_METADATA) {
            try {
                const result = await ApiService.getImageInfo(registrationId, 'payment-proof');
                if (result && result.success) {
                    const imageData = result.data;
                    const computedUrl = ApiService.getImageUrl(imageData.filename || imageData.fileName || '');
                    const imageUrl = computedUrl || (`http://localhost:5001${imageData.url || ''}`);
                    const fileSizeMB = imageData.size ? (imageData.size / (1024 * 1024)).toFixed(2) : 'Unknown';
                    const container = modal.querySelector('.p-6');
                    if (container) {
                        const metaHtml = `
                            <div class=\"grid grid-cols-2 gap-4 text-sm mb-4 mt-4\">
                                <div><strong>Student:</strong> ${(imageData.participant && imageData.participant.name) || ''}</div>
                                <div><strong>Email:</strong> ${(imageData.participant && imageData.participant.email) || ''}</div>
                                <div><strong>Original Filename:</strong> ${imageData.originalName || ''}</div>
                                <div><strong>File Size:</strong> ${fileSizeMB} MB</div>
                                <div><strong>File Type:</strong> ${imageData.mimetype || 'Image'}</div>
                                <div><strong>Backend Path:</strong> <code>${imageData.url || ''}</code></div>
                                <div><strong>Stored as:</strong> <code>${imageData.filename || imageData.fileName || ''}</code></div>
                            </div>`;
                        container.insertAdjacentHTML('beforeend', metaHtml);
                    }
                }
            } catch (_) { /* silently ignore */ }
        }
            
    } catch (error) {
        console.error('Error loading payment proof:', error);
        const fallbackUrl = ApiService.getImageUrl(originalName || '');
        const existingModal = document.querySelector('.fixed.inset-0');
        if (existingModal && fallbackUrl) {
            existingModal.innerHTML = `
                <div class="bg-white rounded-lg max-w-4xl mx-4 max-h-90vh overflow-auto">
                    <div class="flex justify-between items-center p-4 border-b">
                        <h3 class="text-lg font-semibold">Payment Proof - UTR: ${utr}</h3>
                        <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700 text-2xl font-bold">&times;</button>
                    </div>
                    <div class="p-6 text-center">
                        <img src="${fallbackUrl}" alt="Payment Screenshot" class="max-w-full max-h-96 mx-auto border rounded shadow"
                             onerror="this.parentElement.innerHTML='<div class=\"p-4 bg-red-50 rounded\"><p class=\"text-red-600\">❌ Failed to load payment screenshot</p><p class=\"text-sm text-red-500 mt-1\">${error.message || 'Image not found'}</p></div>'"/>
                    </div>
                </div>`;
            return;
        }
        
        const errorModal = document.createElement('div');
        errorModal.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50';
        errorModal.innerHTML = `
            <div class="bg-white rounded-lg max-w-md mx-4">
                <div class="p-6 text-center">
                    <div class="text-red-500 text-4xl mb-4">❌</div>
                    <h3 class="text-lg font-semibold mb-2">Failed to Load Payment Proof</h3>
                    <p class="text-gray-600 mb-4">${error.message}</p>
                    <button onclick="this.closest('.fixed').remove()" class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Close</button>
                </div>
            </div>`;
        document.body.appendChild(errorModal);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (!document.querySelector('.category-table')) {
        return;
    }
    
    const filterInput = document.getElementById('admin-filter');
    const statusSel = document.getElementById('admin-status-filter');
    
    if (filterInput) {
        filterInput.addEventListener('input', applyFilters);
    }
    if (statusSel) {
        statusSel.addEventListener('change', applyFilters);
    }
    
    if (!ensureAdminAuth()) {
        return;
    }
    
    updateStats();
    showCategory('technical');
    
    // Auto-refresh every 30 seconds
    setInterval(() => {
        try {
            updateStats();
            loadCategoryData(currentCategory);
            applyFilters();
        } catch (e) {}
    }, 30000);
});

// Make functions globally available
if (typeof window !== 'undefined') {
    window.showCategory = showCategory;
    window.exportAllData = exportAllData;
    window.exportCategoryData = exportCategoryData;
    window.exportEventData = exportEventData;
    window.updateStatus = updateStatus;
    window.viewIdProof = viewIdProof;
    window.viewPaymentProof = viewPaymentProof;
    window.refreshData = function() {
        try {
            updateStats();
            loadCategoryData(currentCategory);
            applyFilters();
        } catch (e) {}
    };
    
    window.bulkUpdateStatus = async function(status, cat) {
        try {
            const targetCategory = (cat && typeof cat === 'string') ? cat : currentCategory;
            
            if (!confirm(`Are you sure you want to mark all ${targetCategory} registrations as ${status}?`)) {
                return;
            }
            
            // Map frontend category to backend category name
            const backendCategoryName = getBackendCategoryName(targetCategory);
            
            console.log('Bulk updating category:', { frontend: targetCategory, backend: backendCategoryName, status });
            
            // Call backend API for bulk update with mapped category
            const result = await ApiService.bulkUpdatePaymentStatus(backendCategoryName, status);
            if (result.success) {
                showStatusMessage(`Updated ${result.data?.modified || 0} ${targetCategory} registrations to ${status}`, 'success');
                await updateStats();
                await loadCategoryData(currentCategory);
                try {
                    applyFilters();
                } catch (e) {}
            } else {
                throw new Error('Backend bulk update failed');
            }
        } catch (error) {
            console.error('Failed to bulk update status via backend:', error);
            
            // Fallback to localStorage
            const targetCat = (cat && typeof cat === 'string') ? cat : currentCategory;
            const categoryKey = `registrations_${targetCat.toLowerCase().replace('-', '_')}`;
            let registrations = JSON.parse(localStorage.getItem(categoryKey)) || [];
            
            if (registrations.length === 0) {
                showStatusMessage('No registrations to update', 'error');
                return;
            }
            
            let updatedCount = 0;
            const timestamp = new Date().toISOString();
            
            registrations.forEach(reg => {
                if (reg.status !== status) {
                    reg.status = status;
                    reg.lastUpdated = timestamp;
                    updatedCount++;
                }
            });
            
            localStorage.setItem(categoryKey, JSON.stringify(registrations));
            
            // Also update main registrations
            try {
                let allRegistrations = JSON.parse(localStorage.getItem('registrations')) || [];
                registrations.forEach(updatedReg => {
                    const index = allRegistrations.findIndex(r => 
                        (r.id && r.id === updatedReg.id) || 
                        (!r.id && r.email === updatedReg.email && r.event === updatedReg.event)
                    );
                    if (index !== -1) {
                        allRegistrations[index].status = updatedReg.status;
                        allRegistrations[index].lastUpdated = updatedReg.lastUpdated;
                    }
                });
                localStorage.setItem('registrations', JSON.stringify(allRegistrations));
            } catch (e) {}
            
            showStatusMessage(`Updated ${updatedCount} ${targetCat} registrations to ${status} (localStorage)`, 'success');
            updateStats();
            loadCategoryData(currentCategory);
            try {
                applyFilters();
            } catch (e) {}
        }
    };
}