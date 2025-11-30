/**
 * Horizontal Layout Toggle System
 * Handles sidebar collapse/expand and mobile menu
 */

(function() {
    'use strict';

    // Initialize layout on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', function() {
        initHorizontalLayout();
    });

    function initHorizontalLayout() {
        const layout = document.querySelector('.layout-horizontal');
        if (!layout) return; // Exit if horizontal layout not used

        // Get sidebar expanded preference from localStorage
        const savedState = localStorage.getItem('sidebar-expanded');
        const isMobile = window.innerWidth <= 768;

        // Default: collapsed on desktop, closed on mobile
        if (savedState === 'true' && !isMobile) {
            layout.classList.add('sidebar-expanded');
        }

        // Setup toggle button
        setupSidebarToggle(layout);

        // Setup mobile hamburger menu
        setupHamburgerMenu(layout);

        // Setup backdrop click (mobile)
        setupBackdropClick(layout);

        // Handle window resize
        handleResponsiveLayout(layout);
    }

    function setupSidebarToggle(layout) {
        const toggleBtn = document.querySelector('.sidebar-toggle-btn');
        if (!toggleBtn) return;

        toggleBtn.addEventListener('click', function() {
            const isExpanded = layout.classList.toggle('sidebar-expanded');

            // Save state to localStorage (desktop only)
            if (window.innerWidth > 768) {
                localStorage.setItem('sidebar-expanded', isExpanded);
            }

            // Update toggle button icon
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                icon.className = isExpanded ? 'fas fa-chevron-left' : 'fas fa-bars';
            }

            // Dispatch custom event for other components
            document.dispatchEvent(new CustomEvent('sidebarToggle', {
                detail: { expanded: isExpanded }
            }));
        });
    }

    function setupHamburgerMenu(layout) {
        const hamburger = document.querySelector('.hamburger-menu');
        if (!hamburger) return;

        hamburger.addEventListener('click', function() {
            const isExpanded = layout.classList.toggle('sidebar-expanded');
            hamburger.classList.toggle('active', isExpanded);

            // Toggle backdrop
            toggleBackdrop(isExpanded);
        });
    }

    function setupBackdropClick(layout) {
        let backdrop = document.querySelector('.sidebar-backdrop');

        // Create backdrop if it doesn't exist
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.className = 'sidebar-backdrop';
            layout.appendChild(backdrop);
        }

        backdrop.addEventListener('click', function() {
            layout.classList.remove('sidebar-expanded');
            const hamburger = document.querySelector('.hamburger-menu');
            if (hamburger) {
                hamburger.classList.remove('active');
            }
        });
    }

    function toggleBackdrop(show) {
        let backdrop = document.querySelector('.sidebar-backdrop');
        if (!backdrop) return;

        if (show && window.innerWidth <= 768) {
            backdrop.style.display = 'block';
        } else {
            backdrop.style.display = 'none';
        }
    }

    function handleResponsiveLayout(layout) {
        let previousWidth = window.innerWidth;

        window.addEventListener('resize', function() {
            const currentWidth = window.innerWidth;
            const crossedThreshold = (previousWidth <= 768 && currentWidth > 768) ||
                                   (previousWidth > 768 && currentWidth <= 768);

            if (crossedThreshold) {
                // Restore desktop state or close mobile menu
                if (currentWidth > 768) {
                    // Desktop: restore saved preference
                    const savedState = localStorage.getItem('sidebar-expanded');
                    if (savedState === 'true') {
                        layout.classList.add('sidebar-expanded');
                    } else {
                        layout.classList.remove('sidebar-expanded');
                    }
                } else {
                    // Mobile: close sidebar
                    layout.classList.remove('sidebar-expanded');
                    const hamburger = document.querySelector('.hamburger-menu');
                    if (hamburger) {
                        hamburger.classList.remove('active');
                    }
                }

                // Hide backdrop
                toggleBackdrop(false);
            }

            previousWidth = currentWidth;
        });
    }

    // Public API for programmatic control
    window.HorizontalLayout = {
        toggle: function() {
            const layout = document.querySelector('.layout-horizontal');
            if (!layout) return false;

            const toggleBtn = document.querySelector('.sidebar-toggle-btn');
            if (toggleBtn) {
                toggleBtn.click();
                return true;
            }
            return false;
        },

        expand: function() {
            const layout = document.querySelector('.layout-horizontal');
            if (!layout) return false;

            layout.classList.add('sidebar-expanded');
            localStorage.setItem('sidebar-expanded', 'true');

            const icon = document.querySelector('.sidebar-toggle-btn i');
            if (icon) {
                icon.className = 'fas fa-chevron-left';
            }
            return true;
        },

        collapse: function() {
            const layout = document.querySelector('.layout-horizontal');
            if (!layout) return false;

            layout.classList.remove('sidebar-expanded');
            localStorage.setItem('sidebar-expanded', 'false');

            const icon = document.querySelector('.sidebar-toggle-btn i');
            if (icon) {
                icon.className = 'fas fa-bars';
            }
            return true;
        },

        isExpanded: function() {
            const layout = document.querySelector('.layout-horizontal');
            return layout ? layout.classList.contains('sidebar-expanded') : false;
        }
    };

})();
