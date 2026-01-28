/**
 * Esplendidez 2026 - Main JavaScript File
 * Handles core website functionality including countdown, theme toggle, mobile menu, and animations
 * Author: Tennis Tournament Management System
 * Version: 2.0
 */

/**
 * Initializes the countdown timer for Esplendidez 2026 event
 * Displays days, hours, minutes, and seconds until the event starts
 */
function initCountdown() {
    // Get countdown display elements from the DOM
    const daysEl = document.getElementById('days-display');
    const hoursEl = document.getElementById('hours-display');
    const minutesEl = document.getElementById('minutes-display');
    const secondsEl = document.getElementById('seconds-display');
    const titleEl = document.querySelector('.countdown-title');
    
    // Exit if any required elements are missing
    if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;
    
    // Set target date for Esplendidez 2026 event
    const targetDate = new Date('February 16, 2026 00:00:00').getTime();
    
    /**
     * Updates the countdown display every second
     * Shows celebration message when event starts
     */
    function updateCountdown() {
        const now = new Date().getTime();
        const distance = targetDate - now;
        
        // Event has started - show celebration
        if (distance < 0) {
            if (titleEl) titleEl.innerHTML = "<span class='text-green-400'>The fest has started! 🎉</span>";
            if (daysEl) daysEl.parentElement.innerHTML = '<div class="text-4xl font-bold text-green-400 animate-pulse">🎉</div><div class="text-white/80 mt-2">Started!</div>';
            if (hoursEl) hoursEl.parentElement.style.display = 'none';
            if (minutesEl) minutesEl.parentElement.style.display = 'none';
            if (secondsEl) secondsEl.parentElement.style.display = 'none';
            clearInterval(interval);
            return;
        }
        
        // Calculate time remaining
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        // Update display with zero-padded values
        daysEl.textContent = String(days).padStart(2, '0');
        hoursEl.textContent = String(hours).padStart(2, '0');
        minutesEl.textContent = String(minutes).padStart(2, '0');
        secondsEl.textContent = String(seconds).padStart(2, '0');
        
        // Add pulse animation to seconds for visual feedback
        secondsEl.classList.add('animate-pulse');
        setTimeout(() => secondsEl.classList.remove('animate-pulse'), 500);
    }
    
    // Start countdown interval and run initial update
    const interval = setInterval(updateCountdown, 1000);
    updateCountdown();
}

/**
 * Initializes dark/light theme toggle functionality
 * Supports both desktop and mobile theme toggles with persistent storage
 */
function initThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const mobileThemeToggle = document.getElementById('mobile-theme-toggle');
    
    /**
     * Updates theme toggle icons based on current theme
     * @param {string} theme - Current theme ('dark' or 'light')
     */
    function updateThemeIcons(theme) {
        // Check if we're on the home page
        const isHomePage = document.body.classList.contains('home-page');
        const iconColorClass = isHomePage ? 'text-white' : '';
        
        const desktopIcon = theme === 'dark' ? 
            `<i data-feather="sun" class="w-5 h-5 ${iconColorClass}"></i>` : 
            `<i data-feather="moon" class="w-5 h-5 ${iconColorClass}"></i>`;
        const mobileIcon = theme === 'dark' ? 
            `<i data-feather="sun" class="w-5 h-5 ${iconColorClass}"></i>` : 
            `<i data-feather="moon" class="w-5 h-5 ${iconColorClass}"></i>`;
        
        if (themeToggle) {
            themeToggle.innerHTML = desktopIcon;
        }
        if (mobileThemeToggle) {
            mobileThemeToggle.innerHTML = mobileIcon + '<span>Toggle Theme</span>';
        }
        
        // Refresh feather icons after DOM update
        setTimeout(() => {
            if (typeof feather !== 'undefined') {
                feather.replace();
            }
        }, 10);
    }
    
    /**
     * Applies theme to document and updates UI
     * @param {string} theme - Theme to apply ('dark' or 'light')
     */
    function applyTheme(theme) {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(theme);
        document.body.classList.remove('light', 'dark');
        document.body.classList.add(theme);
        localStorage.setItem('espl-theme', theme);
        updateThemeIcons(theme);
    }
    
    /**
     * Toggles between dark and light themes
     */
    function toggleTheme() {
        const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        const newTheme = current === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    }
    
    // Initialize theme based on saved preference or system preference
    const saved = localStorage.getItem('espl-theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = saved || (prefersDark ? 'dark' : 'light');
    applyTheme(initial);
    
    // Add event listeners for theme toggle buttons
    if (themeToggle) {
        themeToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleTheme();
        });
    }
    if (mobileThemeToggle) {
        mobileThemeToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleTheme();
        });
    }
    
    // Make toggleTheme globally accessible
    window.toggleTheme = toggleTheme;
}

/**
 * Initializes Vanta.js globe animation background
 * Falls back gracefully if Vanta is not available
 */
function initVanta() {
    const video = document.getElementById('hero-bg-video');
    
    /**
     * Safely initializes Vanta globe effect with error handling
     */
    function initVantaSafe() {
        try {
            if (typeof VANTA !== 'undefined' && !window.vantaEffect) {
                window.vantaEffect = VANTA.GLOBE({
                    el: "#vanta-bg",
                    mouseControls: true,
                    touchControls: true,
                    gyroControls: false,
                    color: 0x6366f1,      // Primary color (blue)
                    color2: 0xf59e0b,     // Secondary color (amber)
                    size: 1.2,
                    scale: 1.0,
                    scaleMobile: 1.0,
                    backgroundColor: 0x000000
                });
            }
        } catch (err) {
            // Silently fail if Vanta initialization fails
        }
    }
    
    // Initialize after video loads or with fallback timeout
    if (video) {
        if (video.readyState >= 2) {
            initVantaSafe();
        } else {
            video.addEventListener('loadedmetadata', initVantaSafe, { once: true });
            setTimeout(initVantaSafe, 2500);
        }
    } else {
        initVantaSafe();
    }
}

/**
 * Initializes background video autoplay with user interaction fallback
 */
function initVideoPlay() {
    const video = document.getElementById('hero-bg-video');
    if (video) {
        // Try to autoplay, fallback to click-to-play
        video.play().catch(e => {
            document.addEventListener('click', () => {
                video.play();
            }, { once: true });
        });
    }
}

/**
 * Initializes navbar scroll effects
 * Adds 'scrolled' class when page is scrolled down
 */
function initNavbarScroll() {
    const nav = document.querySelector('.site-nav');
    if (!nav) return;
    
    const onScroll = () => {
        if (window.scrollY > 20) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    };
    
    // Initial check and event listener
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    
    // Handle focus states for keyboard navigation
    nav.addEventListener('focusin', () => nav.classList.add('scrolled'));
    nav.addEventListener('focusout', () => {
        if (window.scrollY <= 20) nav.classList.remove('scrolled');
    });
}

/**
 * Initializes scroll unlock functionality for landing page
 * Temporarily disables scrolling with unlock button
 */
function initScrollUnlock() {
    const unlockBtn = document.getElementById('unlock-scroll-btn');
    if (!unlockBtn) return;
    
    /**
     * Unlocks scrolling and removes event listeners
     */
    const unlock = () => {
        document.documentElement.classList.remove('no-scroll');
        document.body.classList.remove('no-scroll');
        window.removeEventListener('wheel', prevent, { passive: false });
        window.removeEventListener('touchmove', prevent, { passive: false });
        window.removeEventListener('keydown', keyHandler, false);
    };
    
    // Event prevention functions
    const prevent = (e) => e.preventDefault();
    const keyHandler = (e) => {
        const keys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];
        if (keys.includes(e.key)) e.preventDefault();
    };
    
    // Lock scrolling initially
    document.documentElement.classList.add('no-scroll');
    document.body.classList.add('no-scroll');
    window.addEventListener('wheel', prevent, { passive: false });
    window.addEventListener('touchmove', prevent, { passive: false });
    window.addEventListener('keydown', keyHandler, false);
    
    // Unlock on button click
    unlockBtn.addEventListener('click', function(e) {
        e.preventDefault();
        unlock();
        const target = document.querySelector(this.getAttribute('href'));
        target?.scrollIntoView({ behavior: 'smooth' });
    }, { once: true });
    
    // Auto-unlock after 5 seconds
    setTimeout(unlock, 5000);
}

/**
 * Initializes mobile menu functionality
 * Handles menu toggle, outside clicks, and responsive behavior
 */
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    // Exit if required elements are missing
    if (!mobileMenuBtn || !mobileMenu) {
        return;
    }
    
    /**
     * Gets appropriate icon class based on page and theme
     * @returns {string} CSS class for menu icon
     */
    function getIconClass() {
        const isHomePage = document.body.classList.contains('home-page');
        const isDark = document.documentElement.classList.contains('dark');
        
        if (isHomePage) {
            return 'text-white drop-shadow-lg';
        } else if (isDark) {
            return 'text-white';
        } else {
            return 'text-gray-600';
        }
    }
    
    /**
     * Toggles mobile menu visibility and updates button icon
     */
    function toggleMenu() {
        const isHidden = mobileMenu.classList.contains('hidden');
        const iconClass = getIconClass();
        
        if (isHidden) {
            // Show menu
            mobileMenu.classList.remove('hidden');
            mobileMenuBtn.innerHTML = `<i data-feather="x" class="w-6 h-6 ${iconClass}"></i>`;
            mobileMenuBtn.setAttribute('aria-expanded', 'true');
            mobileMenuBtn.setAttribute('aria-label', 'Close menu');
        } else {
            // Hide menu
            mobileMenu.classList.add('hidden');
            mobileMenuBtn.innerHTML = `<i data-feather="menu" class="w-6 h-6 ${iconClass}"></i>`;
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
            mobileMenuBtn.setAttribute('aria-label', 'Open menu');
        }
        
        // Refresh feather icons
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }
    
    // Add click event listener
    mobileMenuBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        toggleMenu();
    });
    
    // Make globally accessible
    window.toggleMobileMenu = toggleMenu;
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            if (!mobileMenu.classList.contains('hidden')) {
                toggleMenu();
            }
        }
    });
    
    // Close menu on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
            toggleMenu();
        }
    });
    
    // Close menu on window resize (desktop)
    window.addEventListener('resize', function() {
        if (window.innerWidth >= 768 && !mobileMenu.classList.contains('hidden')) {
            toggleMenu();
        }
    });
    
    // Initialize menu button with correct icon
    const initialIconClass = getIconClass();
    mobileMenuBtn.innerHTML = `<i data-feather="menu" class="w-6 h-6 ${initialIconClass}"></i>`;
    mobileMenuBtn.setAttribute('aria-expanded', 'false');
    
    // Initialize feather icons
    if (typeof feather !== 'undefined') {
        setTimeout(() => feather.replace(), 100);
    }
}

/**
 * Initializes floating social buttons and scroll-to-top functionality
 * Handles responsive behavior and keyboard shortcuts
 */
function initFloatingButtons() {
    const floatingContainer = document.getElementById('floating-social');
    const scrollBtn = document.getElementById('scroll-to-top');
    
    if (!floatingContainer) return;
    
    // Utility functions for responsive behavior
    const isMobile = () => window.innerWidth <= 768;
    const isLandscape = () => window.innerHeight < window.innerWidth;
    const isKeyboardVisible = () => document.body.classList.contains('keyboard-open');
    
    /**
     * Hide floating buttons (for mobile landscape or keyboard)
     */
    const hideButtons = () => {
        floatingContainer.style.opacity = '0';
        floatingContainer.style.pointerEvents = 'none';
        floatingContainer.style.transform = 'translateX(-100%)';
    };
    
    /**
     * Show floating buttons
     */
    const showButtons = () => {
        floatingContainer.style.opacity = '1';
        floatingContainer.style.pointerEvents = 'auto';
        floatingContainer.style.transform = 'translateX(0)';
    };
    
    /**
     * Check if buttons should be visible based on device state
     */
    const checkButtonVisibility = () => {
        if (isMobile() && (isLandscape() || isKeyboardVisible())) {
            hideButtons();
        } else {
            showButtons();
        }
    };
    
    /**
     * Toggle scroll-to-top button visibility based on scroll position
     */
    const toggleScrollButton = () => {
        if (scrollBtn) {
            if (window.scrollY > 300) {
                scrollBtn.classList.remove('opacity-0', 'pointer-events-none');
                scrollBtn.classList.add('opacity-100');
            } else {
                scrollBtn.classList.add('opacity-0', 'pointer-events-none');
                scrollBtn.classList.remove('opacity-100');
            }
        }
    };
    
    // Event listeners for scroll and resize
    window.addEventListener('scroll', () => {
        checkButtonVisibility();
        toggleScrollButton();
    }, { passive: true });
    
    window.addEventListener('resize', () => {
        checkButtonVisibility();
        toggleScrollButton();
    }, { passive: true });
    
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            checkButtonVisibility();
            toggleScrollButton();
        }, 500);
    });
    
    // Scroll to top functionality
    if (scrollBtn) {
        scrollBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    // Keyboard shortcut for scroll to top (Ctrl+Home)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Home' && e.ctrlKey) {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    });
    
    // Mobile keyboard detection
    const initialViewportHeight = window.innerHeight;
    window.addEventListener('resize', () => {
        const currentViewportHeight = window.innerHeight;
        const viewportHeightDiff = initialViewportHeight - currentViewportHeight;
        
        if (isMobile() && viewportHeightDiff > 150) {
            document.body.classList.add('keyboard-open');
        } else {
            document.body.classList.remove('keyboard-open');
        }
    });
    
    // Initialize
    toggleScrollButton();
    if (isMobile()) {
        hideButtons();
    }
}

/**
 * Initializes and handles the loading screen animation
 * Auto-hides after timeout or page load
 */
function initLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (!loadingScreen) return;
    
    let hidden = false;
    
    /**
     * Hides the loading screen with animation
     */
    function hide() {
        if (hidden) return;
        hidden = true;
        
        loadingScreen.style.opacity = '0';
        loadingScreen.style.transform = 'scale(1.02)';
        setTimeout(() => loadingScreen.remove(), 400);
    }
    
    // Auto-hide after 1.2 seconds
    setTimeout(hide, 1200);
    
    // Also hide when page fully loads
    window.addEventListener('load', () => setTimeout(hide, 300));
}

/**
 * Main initialization function
 * Sets up all website functionality when DOM is ready
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize core functionality
    initLoadingScreen();
    initCountdown();
    initThemeToggle();
    initVideoPlay();
    initNavbarScroll();
    initScrollUnlock();
    initMobileMenu();
    initFloatingButtons();
    
    // Initialize feather icons
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
    
    // Backup event listener setup with delay
    setTimeout(() => {
        const themeToggle = document.getElementById('theme-toggle');
        const mobileThemeToggle = document.getElementById('mobile-theme-toggle');
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        
        // Ensure theme toggle buttons work
        if (themeToggle && !themeToggle.hasAttribute('data-initialized')) {
            themeToggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (window.toggleTheme) window.toggleTheme();
            });
            themeToggle.setAttribute('data-initialized', 'true');
        }
        
        if (mobileThemeToggle && !mobileThemeToggle.hasAttribute('data-initialized')) {
            mobileThemeToggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (window.toggleTheme) window.toggleTheme();
            });
            mobileThemeToggle.setAttribute('data-initialized', 'true');
        }
        
        // Ensure mobile menu button works
        if (mobileMenuBtn && !mobileMenuBtn.hasAttribute('data-initialized')) {
            mobileMenuBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (window.toggleMobileMenu) window.toggleMobileMenu();
            });
            mobileMenuBtn.setAttribute('data-initialized', 'true');
        }
    }, 500);
    
    // Welcome notification for first-time visitors
    setTimeout(() => {
        if (window.notifications && !localStorage.getItem('welcomed')) {
            window.notifications.info('Welcome to Esplendidez 2026! 🎉');
            localStorage.setItem('welcomed', 'true');
        }
    }, 2000);
});

/**
 * Cleanup function for page unload
 * Destroys Vanta effect to prevent memory leaks
 */
window.addEventListener('beforeunload', function() {
    if (window.vantaEffect && typeof window.vantaEffect.destroy === 'function') {
        window.vantaEffect.destroy();
    }
});
