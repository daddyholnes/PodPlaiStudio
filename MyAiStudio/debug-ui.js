/**
 * UI Debugging and Fix Script
 * This script helps diagnose and fix UI interaction issues
 */

// Fix for clickable elements
function fixClickableElements() {
  console.log("🔧 Applying UI interaction fixes...");
  
  // Extremely aggressive fix - try to identify any invisible overlays
  const possibleOverlays = Array.from(document.querySelectorAll('div, section'))
    .filter(el => {
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return (rect.width > window.innerWidth * 0.5 && rect.height > window.innerHeight * 0.5) && 
             (style.position === 'fixed' || style.position === 'absolute') &&
             (style.zIndex !== 'auto' && parseInt(style.zIndex) > 5);
    });
  
  console.log(`Found ${possibleOverlays.length} possible overlay elements blocking interaction`);
  possibleOverlays.forEach((el, i) => {
    console.log(`Removing overlay ${i}:`, el);
    el.style.display = 'none';
    // Alternatively: el.parentNode.removeChild(el);
  });
  
  // Try to enable all navigation items
  const navItems = document.querySelectorAll('.nav-item, .sidebar a, nav a');
  console.log(`Found ${navItems.length} navigation elements`);
  
  navItems.forEach(nav => {
    const pageName = nav.dataset.page || nav.getAttribute('href')?.replace('#', '') || nav.textContent.trim().toLowerCase();
    console.log(`Processing nav item to ${pageName}`);
    
    nav.style.pointerEvents = 'auto';
    nav.style.cursor = 'pointer';
    nav.style.position = 'relative';
    nav.style.zIndex = '1000';
    
    // Completely remove and rebuild the element
    const newNav = document.createElement(nav.tagName);
    newNav.innerHTML = nav.innerHTML;
    newNav.className = nav.className;
    if (nav.id) newNav.id = nav.id;
    
    // Copy all attributes
    Array.from(nav.attributes).forEach(attr => {
      if (attr.name !== 'id' && attr.name !== 'class') {
        newNav.setAttribute(attr.name, attr.value);
      }
    });
    
    // Add a completely new click handler
    newNav.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log(`Navigation clicked: ${pageName}`);
      
      // Try to navigate
      if (pageName) {
        const pageEl = document.getElementById(`${pageName}-page`);
        if (pageEl) {
          // Hide all pages
          document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
          // Show the target page
          pageEl.classList.remove('hidden');
          console.log(`Navigated to ${pageName} page`);
        } else {
          console.error(`Page element #${pageName}-page not found`);
        }
      }
      
      return false;
    });
    
    if (nav.parentNode) {
      nav.parentNode.replaceChild(newNav, nav);
    }
  });
  
  // Create emergency navigation panel
  createEmergencyNavPanel();
  
  // Clear any startup modals
  clearGenkitModals();
  
  console.log("✅ UI fixes applied - try clicking elements now");
}

// Create emergency navigation panel
function createEmergencyNavPanel() {
  // Remove any existing emergency panel
  const existingPanel = document.getElementById('emergency-nav-panel');
  if (existingPanel) {
    existingPanel.parentNode.removeChild(existingPanel);
  }
  
  // Create new panel
  const navPanel = document.createElement('div');
  navPanel.id = 'emergency-nav-panel';
  navPanel.style.position = 'fixed';
  navPanel.style.bottom = '20px';
  navPanel.style.left = '20px';
  navPanel.style.zIndex = '9999';
  navPanel.style.background = 'rgba(0,0,0,0.8)';
  navPanel.style.padding = '10px';
  navPanel.style.borderRadius = '8px';
  navPanel.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
  
  // Add page navigation buttons
  const pages = ['chat', 'sandbox', 'build', 'api', 'settings'];
  
  pages.forEach(page => {
    const btn = document.createElement('button');
    btn.textContent = page.toUpperCase();
    btn.style.margin = '0 5px';
    btn.style.padding = '8px 12px';
    btn.style.background = '#3498db';
    btn.style.color = 'white';
    btn.style.border = 'none';
    btn.style.borderRadius = '4px';
    btn.style.cursor = 'pointer';
    btn.style.fontWeight = 'bold';
    
    // Add direct click handler that doesn't rely on event bubbling
    btn.onclick = function(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      // Try to find the page
      const pageEl = document.getElementById(`${page}-page`);
      if (pageEl) {
        // Hide all pages first
        document.querySelectorAll('.page').forEach(p => {
          p.classList.add('hidden');
          p.style.display = 'none';
        });
        
        // Show this page
        pageEl.classList.remove('hidden');
        pageEl.style.display = 'block';
        console.log(`Emergency navigation: switched to ${page} page`);
      } else {
        console.error(`Page #${page}-page not found`);
      }
      
      return false;
    };
    
    navPanel.appendChild(btn);
  });
  
  // Add a close modals button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'CLOSE MODALS';
  closeBtn.style.margin = '0 5px';
  closeBtn.style.marginLeft = '15px';
  closeBtn.style.padding = '8px 12px';
  closeBtn.style.background = '#e74c3c';
  closeBtn.style.color = 'white';
  closeBtn.style.border = 'none';
  closeBtn.style.borderRadius = '4px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.fontWeight = 'bold';
  
  closeBtn.onclick = function(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    clearGenkitModals();
    return false;
  };
  
  navPanel.appendChild(closeBtn);
  document.body.appendChild(navPanel);
}

// Clear Genkit modals
function clearGenkitModals() {
  // Hide all modal elements
  document.querySelectorAll('.modal, .modal-content, .modal-backdrop, .genkit-modal').forEach(modal => {
    console.log('Removing modal:', modal);
    modal.style.display = 'none';
    modal.style.visibility = 'hidden';
    modal.style.opacity = '0';
    modal.style.pointerEvents = 'none';
  });
  
  // Remove any other overlay elements
  document.querySelectorAll('div, section').forEach(el => {
    const style = window.getComputedStyle(el);
    if (style.position === 'fixed' && parseInt(style.zIndex) > 10) {
      el.style.display = 'none';
      console.log('Removed possible overlay element:', el);
    }
  });
  
  console.log('✓ Cleared all modal dialogs');
}

// Add escape key handler to close modals
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.style.display = 'none';
    });
    console.log("🚪 Modal closed with Escape key");
  }
});

// Export for use in main application
module.exports = {
  fixClickableElements
};

// If running directly in renderer, apply fixes
if (typeof window !== 'undefined') {
  // Apply fixes immediately and after a delay to ensure DOM is ready
  setTimeout(fixClickableElements, 1000);
  
  // Also try after window load event
  window.addEventListener('load', () => {
    setTimeout(fixClickableElements, 500);
  });
  
  // Apply on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(fixClickableElements, 500);
    });
  } else {
    // DOM already loaded, apply now
    fixClickableElements();
  }
}
