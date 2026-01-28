/**
 * Esplendidez 2026 - Registration Form Handler
 * Handles form submission with backend integration and localStorage fallback
 * Version: 2.0
 */

document.addEventListener('DOMContentLoaded', function() {
    const registrationForm = document.getElementById('registration-form');
    const eventSelector = document.getElementById('event-selector');
    const eventNameInput = document.getElementById('event-name');
    const eventFeeInput = document.getElementById('event-fee');

    // Initialize form
    initializeForm();

    function initializeForm() {
        // Populate event selector with all events
        if (eventSelector && typeof eventsList !== 'undefined') {
            populateEventSelector();
        }

        // Handle URL parameters for pre-selected events
        const urlParams = new URLSearchParams(window.location.search);
        const selectedEventName = urlParams.get('event');
        if (selectedEventName && eventSelector && typeof eventsList !== 'undefined') {
            // Find the event in the eventsList array
            const matchingEvent = eventsList.find(ev => ev.name === selectedEventName);
            if (matchingEvent) {
                // Set the selector value to the JSON stringified event
                eventSelector.value = JSON.stringify(matchingEvent);
                updateEventDetails();
                
                // Hide selector and show readonly input
                eventSelector.classList.add('hidden');
                if (eventNameInput) {
                    eventNameInput.classList.remove('hidden');
                }
            }
        }

        // Add form event listeners
        if (eventSelector) {
            eventSelector.addEventListener('change', updateEventDetails);
        }

        if (registrationForm) {
            registrationForm.addEventListener('submit', handleFormSubmission);
        }
    }

    function populateEventSelector() {
        // Clear existing options except the first one
        while (eventSelector.children.length > 1) {
            eventSelector.removeChild(eventSelector.lastChild);
        }

        // Add events grouped by category
        const categories = {};
        eventsList.forEach(event => {
            if (!categories[event.category]) {
                categories[event.category] = [];
            }
            categories[event.category].push(event);
        });

        Object.keys(categories).sort().forEach(category => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = category;
            
            categories[category].forEach(event => {
                const option = document.createElement('option');
                option.value = JSON.stringify(event);
                option.textContent = `${event.name} - ₹${event.fee}`;
                optgroup.appendChild(option);
            });
            
            eventSelector.appendChild(optgroup);
        });
    }

    function updateEventDetails() {
        if (!eventSelector.value) return;

        try {
            const selectedEvent = JSON.parse(eventSelector.value);
            
            if (eventNameInput) {
                eventNameInput.value = selectedEvent.name;
            }
            
            if (eventFeeInput) {
                eventFeeInput.value = `₹${selectedEvent.fee}`;
            }

            // Show/hide team member fields based on event type
            toggleTeamFields(selectedEvent.teamType === 'team');
            
        } catch (error) {
            console.error('Error parsing event data:', error);
        }
    }

    function toggleTeamFields(isTeamEvent) {
        const teamSection = document.getElementById('team-section');
        if (teamSection) {
            if (isTeamEvent) {
                teamSection.style.display = 'block';
                teamSection.classList.remove('hidden');
            } else {
                teamSection.style.display = 'none';
                teamSection.classList.add('hidden');
            }
        }
    }

    async function handleFormSubmission(event) {
        event.preventDefault();
        
        const submitButton = registrationForm.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        
        try {
            // Show loading state
            submitButton.innerHTML = '<i class="bi bi-hourglass-split animate-spin mr-2"></i>Processing...';
            submitButton.disabled = true;

            // Collect form data
            const formData = collectFormData();
            
            // Validate form data
            const validation = validateFormData(formData);
            if (!validation.isValid) {
                throw new Error(validation.message);
            }

            // Submit to backend with fallback to localStorage
            const result = await FallbackStorage.saveRegistration(formData);
            
            if (result.success) {
                // Redirect to payment page immediately (no popup)
                const registrationId = result.data.id || result.data._id || Date.now();
                window.location.href = `payment.html?registration=${registrationId}&event=${encodeURIComponent(formData.eventName)}`;
            } else {
                throw new Error(result.message || 'Registration failed');
            }

        } catch (error) {
            console.error('Registration error:', error);
            showErrorMessage(error.message || 'Registration failed. Please try again.');
            
            // Reset button
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }
    }

    function collectFormData() {
        const selectedEvent = eventSelector.value ? JSON.parse(eventSelector.value) : null;
        
        const formData = {
            // Event information
            eventName: selectedEvent?.name || '',
            eventCategory: selectedEvent?.category || '',
            eventFee: selectedEvent?.fee || 0,
            eventType: selectedEvent?.teamType || 'individual',
            
            // Personal information
            participantName: document.getElementById('participant-name')?.value || '',
            email: document.getElementById('participant-email')?.value || '',
            phone: document.getElementById('participant-phone')?.value || '',
            college: document.getElementById('participant-college')?.value || '',
            
            // Team information (if applicable)
            isTeamEvent: selectedEvent?.teamType === 'team',
            teamMembers: [],
            
            // Registration metadata
            registrationDate: new Date().toISOString(),
            paymentStatus: 'pending',
            utrNumber: '',
        };

        // Collect team member information if it's a team event
        if (formData.isTeamEvent) {
            const teamMemberInputs = document.querySelectorAll('.team-member-row');
            teamMemberInputs.forEach((row, index) => {
                const name = row.querySelector('.member-name')?.value || '';
                const email = row.querySelector('.member-email')?.value || '';
                const phone = row.querySelector('.member-phone')?.value || '';
                
                if (name || email || phone) {
                    formData.teamMembers.push({
                        name,
                        email,
                        phone,
                        isCaptain: index === 0 // First member is captain
                    });
                }
            });
        }

        return formData;
    }

    function validateFormData(data) {
        // Check required fields
        if (!data.eventName) {
            return { isValid: false, message: 'Please select an event' };
        }
        
        if (!data.participantName) {
            return { isValid: false, message: 'Please enter your name' };
        }
        
        if (!data.email || !isValidEmail(data.email)) {
            return { isValid: false, message: 'Please enter a valid email address' };
        }
        
        if (!data.phone || !isValidPhone(data.phone)) {
            return { isValid: false, message: 'Please enter a valid 10-digit phone number' };
        }
        
        if (!data.college) {
            return { isValid: false, message: 'Please enter your college/institution name' };
        }

        // Validate team members for team events
        if (data.isTeamEvent && data.teamMembers.length === 0) {
            return { isValid: false, message: 'Please add at least one team member' };
        }

        return { isValid: true };
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function isValidPhone(phone) {
        const phoneRegex = /^\d{10}$/;
        return phoneRegex.test(phone.replace(/\D/g, ''));
    }

    function showSuccessMessage(message) {
        // Use notification system if available
        if (window.showNotification) {
            window.showNotification(message, 'success');
        } else {
            alert(message);
        }
    }

    function showErrorMessage(message) {
        // Use notification system if available
        if (window.showNotification) {
            window.showNotification(message, 'error');
        } else {
            alert('Error: ' + message);
        }
    }

    // Export functions for global access
    window.registrationForm = {
        initializeForm,
        updateEventDetails,
        handleFormSubmission
    };
});