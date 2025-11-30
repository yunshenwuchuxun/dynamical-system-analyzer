/**
 * Dark Mode Toggle Functionality
 * Implements theme switching for Neobrutalism design system
 */

(function() {
    'use strict';

    // Configuration
    const STORAGE_KEY = 'theme-preference';
    const THEME_ATTRIBUTE = 'data-theme';

    /**
     * Get the current theme preference
     * Priority: localStorage > System Preference > Default (light)
     */
    function getThemePreference() {
        // Check localStorage first
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return stored;
        }

        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }

        // Default to light
        return 'light';
    }

    /**
     * Apply theme to document
     */
    function applyTheme(theme) {
        const root = document.documentElement;

        if (theme === 'dark') {
            root.classList.add('dark');
            root.setAttribute(THEME_ATTRIBUTE, 'dark');
        } else {
            root.classList.remove('dark');
            root.setAttribute(THEME_ATTRIBUTE, 'light');
        }

        // Update any theme toggle buttons
        updateToggleButtons(theme);
    }

    /**
     * Update all theme toggle buttons
     */
    function updateToggleButtons(theme) {
        const buttons = document.querySelectorAll('[data-theme-toggle]');
        buttons.forEach(button => {
            const icon = button.querySelector('i');
            if (icon) {
                if (theme === 'dark') {
                    icon.className = 'fas fa-sun';
                    button.setAttribute('aria-label', '切换到亮色主题');
                    button.title = '切换到亮色主题';
                } else {
                    icon.className = 'fas fa-moon';
                    button.setAttribute('aria-label', '切换到暗色主题');
                    button.title = '切换到暗色主题';
                }
            }
        });
    }

    /**
     * Toggle between light and dark themes
     */
    function toggleTheme() {
        const current = getThemePreference();
        const next = current === 'dark' ? 'light' : 'dark';

        localStorage.setItem(STORAGE_KEY, next);
        applyTheme(next);

        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('theme-changed', {
            detail: { theme: next }
        }));
    }

    /**
     * Initialize theme system
     */
    function initTheme() {
        // Apply initial theme immediately (before DOM loads)
        const initialTheme = getThemePreference();
        applyTheme(initialTheme);

        // Listen for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                // Only auto-switch if user hasn't manually set a preference
                if (!localStorage.getItem(STORAGE_KEY)) {
                    applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }

    /**
     * Setup theme toggle buttons
     */
    function setupToggleButtons() {
        const buttons = document.querySelectorAll('[data-theme-toggle]');
        buttons.forEach(button => {
            button.addEventListener('click', toggleTheme);
        });

        // Update button states
        updateToggleButtons(getThemePreference());
    }

    // Initialize theme immediately (blocking)
    initTheme();

    // Setup toggle buttons when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupToggleButtons);
    } else {
        setupToggleButtons();
    }

    // Export functions to global scope for external usage
    window.ThemeManager = {
        getTheme: getThemePreference,
        setTheme: function(theme) {
            if (theme === 'dark' || theme === 'light') {
                localStorage.setItem(STORAGE_KEY, theme);
                applyTheme(theme);
            }
        },
        toggleTheme: toggleTheme,
        applyTheme: applyTheme
    };

})();
