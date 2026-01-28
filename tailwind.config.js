/**
 * Tailwind CSS Configuration for Esplendidez 2026
 * 
 * This configuration file customizes Tailwind CSS for the tennis tournament website.
 * It includes custom fonts, colors, and theme extensions specific to the project.
 * 
 * Features:
 * - JIT (Just-In-Time) compilation for faster builds
 * - Class-based dark mode support
 * - Custom font families (Poppins for body, Orbitron for hero text)
 * - Brand-specific color palette
 * - Content scanning for HTML and JS files
 * 
 * Author: Tennis Tournament Management System
 * Version: 2.0
 */

tailwind.config = {
    // Enable JIT mode for faster compilation and smaller file sizes
    mode: 'jit',
    
    // Define file paths where Tailwind classes are used
    // This helps with purging unused CSS in production
    content: [
        './*.html',      // All HTML files in root directory
        './js/*.js'      // All JavaScript files in js/ directory
    ],
    
    // Enable class-based dark mode (requires 'dark' class on html element)
    darkMode: 'class',
    
    // Theme customizations and extensions
    theme: {
        extend: {
            // Custom font families for different text types
            fontFamily: {
                'body': ['Poppins', 'system-ui', 'sans-serif'],      // Main body text font
                'hero': ['Orbitron', 'system-ui', 'sans-serif'],     // Futuristic font for hero sections
            },
            
            // Brand-specific color palette
            colors: {
                'espl-primary': '#6366f1',    // Indigo - Primary brand color
                'espl-secondary': '#f59e0b',  // Amber - Secondary accent color
            }
        }
    },
    
    // Additional plugins (none currently used)
    plugins: []
}
