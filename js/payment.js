/**
 * Payment Page Handler
 * Handles payment verification for event registrations
 * 
 * Flow:
 * 1. Check localStorage for registration data (set by registration-form.js)
 * 2. Display registration information
 * 3. Handle payment form submission (UTR + screenshot)
 * 4. Submit to backend API /api/payment/verify or update registration
 * 5. Redirect to success page
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get registration data from localStorage
    const registrationId = localStorage.getItem('espl_registration_id');
    const registrationDataStr = localStorage.getItem('espl_registration_data');
    
    console.log('Payment page loaded. Registration ID:', registrationId);
    
    // Check if we have registration data
    if (!registrationId || !registrationDataStr) {
        console.error('No registration data found in localStorage');
        if (window.showNotification) {
            window.showNotification('No registration found. Please complete registration first.', 'error');
        } else {
            alert('No registration found. Please complete registration first.');
        }
        // Redirect to registration page after a short delay
        setTimeout(() => {
            window.location.href = 'register.html';
        }, 2000);
        return;
    }
    
    let registrationData;
    try {
        registrationData = JSON.parse(registrationDataStr);
        console.log('Registration data:', registrationData);
    } catch (e) {
        console.error('Failed to parse registration data:', e);
        if (window.showNotification) {
            window.showNotification('Invalid registration data. Please register again.', 'error');
        }
        setTimeout(() => {
            window.location.href = 'register.html';
        }, 2000);
        return;
    }
    
    // Display registration information on the page (if there are elements for it)
    displayRegistrationInfo(registrationData);
    
    // Get payment form
    const paymentForm = document.getElementById('payment-form');
    if (!paymentForm) {
        console.error('Payment form not found');
        return;
    }
    
    // Handle payment form submission
    paymentForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const utrInput = document.getElementById('utr-id');
        const screenshotInput = document.getElementById('payment-screenshot');
        const submitBtn = paymentForm.querySelector('button[type="submit"]');
        
        // Validate inputs
        if (!utrInput || !utrInput.value.trim()) {
            showError('Please enter UTR/Transaction ID');
            return;
        }
        
        if (!screenshotInput || !screenshotInput.files || !screenshotInput.files[0]) {
            showError('Please upload payment screenshot');
            return;
        }
        
        // Disable submit button and show loading state
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i data-feather="loader" class="w-5 h-5 animate-spin"></i> Processing...';
            if (window.feather) window.feather.replace();
        }
        
        try {
            const utrNumber = utrInput.value.trim();
            const screenshotFile = screenshotInput.files[0];
            
            // Get API base URL
            const apiBase = window.ESPL_API_BASE || 'https://ez-two-amber.vercel.app';
            
            // Create FormData to send file + data
            const formData = new FormData();
            formData.append('registrationId', registrationId);
            formData.append('utrNumber', utrNumber);
            formData.append('paymentScreenshot', screenshotFile);
            
            console.log('Submitting payment verification to:', `${apiBase}/api/payment/verify`);
            
            const response = await fetch(`${apiBase}/api/payment/verify`, {
                method: 'POST',
                body: formData
                // Note: Don't set Content-Type for FormData, browser sets it with boundary
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                // Payment verified successfully
                console.log('Payment verified:', result);
                
                // Clear localStorage
                localStorage.removeItem('espl_registration_id');
                localStorage.removeItem('espl_registration_data');
                
                // Show success message
                if (window.showNotification) {
                    window.showNotification('Payment submitted successfully! Redirecting...', 'success');
                }
                
                // Redirect to success page
                setTimeout(() => {
                    window.location.href = `success.html?registration=${registrationId}`;
                }, 1500);
            } else {
                // Payment verification failed
                showError(result.message || 'Payment verification failed. Please try again.');
                
                // Re-enable submit button
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i data-feather="check-circle" class="w-5 h-5"></i> Confirm Payment';
                    if (window.feather) window.feather.replace();
                }
            }
        } catch (error) {
            console.error('Payment submission error:', error);
            showError('Failed to submit payment. Please check your connection and try again.');
            
            // Re-enable submit button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i data-feather="check-circle" class="w-5 h-5"></i> Confirm Payment';
                if (window.feather) window.feather.replace();
            }
        }
    });
});

/**
 * Display registration information on the page
 */
function displayRegistrationInfo(data) {
    // Display event name, fee, participant name, etc. if there are elements for them
    console.log('Displaying registration info:', data);
    
    // You can add code here to populate any elements that show registration details
    // For example:
    // const eventNameEl = document.getElementById('display-event-name');
    // if (eventNameEl && data.eventName) {
    //     eventNameEl.textContent = data.eventName;
    // }
}

/**
 * Show error message to user
 */
function showError(message) {
    console.error('Error:', message);
    if (window.showNotification) {
        window.showNotification(message, 'error');
    } else {
        alert(message);
    }
}