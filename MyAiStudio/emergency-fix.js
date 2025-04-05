/**
 * SIMPLE EMERGENCY FIX - COPY THIS ENTIRE BLOCK INTO CONSOLE
 * 
 * HOW TO USE:
 * 1. Press Ctrl+Shift+I to open Developer Tools
 * 2. Click on "Console" tab at the top
 * 3. Copy ALL OF THIS CODE (from beginning to end)
 * 4. Paste it at the console prompt and press Enter
 */

// Simple emergency fix that will work in any browser context
(function() {
  console.log("🔧 Running simple emergency UI fix...");
  
  // Immediately remove Genkit template selection modal
  function removeGenkitModal() {
    // Target specific Genkit modal elements
    document.querySelectorAll('.genkit-option, .genkit-template, .genkit-modal, [id*="genkit"], [class*="genkit"]').forEach(el => {
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
        console.log('Removed Genkit element:', el);
      }
    });
    
    // Look for common modal elements that might be the Genkit selector
    document.querySelectorAll('.modal, .dialog, .popup, .overlay').forEach(el => {
      if (el.textContent && (
          el.textContent.includes('Genkit') || 
          el.textContent.includes('template') || 
          el.textContent.includes('Select')
      )) {
        if (el && el.parentNode) {
          el.parentNode.removeChild(el);
          console.log('Removed modal element:', el);
        }
      } else {
        el.style.display = 'none';
      }
    });
    
    // Remove any backdrop/overlay elements
    document.querySelectorAll('.modal-backdrop, .overlay, .backdrop').forEach(el => {
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
    
    // Reset body styles that might be set by modal
    document.body.style.overflow = 'auto';
    document.body.style.paddingRight = '0';
    document.body.classList.remove('modal-open');
  }
  
  // Run genkit removal immediately and again after a delay
  removeGenkitModal();
  setTimeout(removeGenkitModal, 500);
  
  // Create a floating panel with navigation buttons
  const panel = document.createElement('div');
  panel.style.position = 'fixed';
  panel.style.top = '20px';
  panel.style.left = '50%';
  panel.style.transform = 'translateX(-50%)';
  panel.style.backgroundColor = 'black';
  panel.style.color = 'white';
  panel.style.padding = '15px';
  panel.style.borderRadius = '5px';
  panel.style.zIndex = '99999';
  panel.style.fontFamily = 'Arial, sans-serif';
  panel.style.fontSize = '14px';
  panel.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
  panel.innerHTML = '<div style="text-align:center; margin-bottom:10px; font-weight:bold;">NAVIGATION FIX</div>';
  
  // Add page buttons
  const pages = ['chat', 'sandbox', 'build', 'api', 'settings'];
  pages.forEach(page => {
    const btn = document.createElement('button');
    btn.textContent = page.toUpperCase();
    btn.style.margin = '5px';
    btn.style.padding = '8px 15px';
    btn.style.backgroundColor = '#2980b9';
    btn.style.color = 'white';
    btn.style.border = 'none';
    btn.style.borderRadius = '3px';
    btn.style.cursor = 'pointer';
    
    btn.onclick = function() {
      // Hide all pages
      pages.forEach(p => {
        const pageEl = document.getElementById(`${p}-page`);
        if (pageEl) {
          pageEl.style.display = 'none';
        }
      });
      
      // Show selected page
      const pageEl = document.getElementById(`${page}-page`);
      if (pageEl) {
        pageEl.style.display = 'block';
        console.log(`Switched to ${page} page`);
      } else {
        console.error(`Page ${page} not found!`);
      }
    };
    
    panel.appendChild(btn);
  });
  
  // Add clear modals button
  const clearBtn = document.createElement('button');
  clearBtn.textContent = 'CLEAR MODALS';
  clearBtn.style.display = 'block';
  clearBtn.style.width = '100%';
  clearBtn.style.marginTop = '10px';
  clearBtn.style.padding = '8px';
  clearBtn.style.backgroundColor = '#e74c3c';
  clearBtn.style.color = 'white';
  clearBtn.style.border = 'none';
  clearBtn.style.borderRadius = '3px';
  clearBtn.style.cursor = 'pointer';
  
  clearBtn.onclick = function() {
    // Remove any modal or overlay elements
    document.querySelectorAll('.modal, [class*="modal"], .overlay').forEach(el => {
      el.style.display = 'none';
    });
    console.log('Cleared modals');
  };
  
  panel.appendChild(clearBtn);
  
  // Add permanent solution - modify settings to disable Genkit templates
  const disableGenkitBtn = document.createElement('button');
  disableGenkitBtn.textContent = 'DISABLE GENKIT STARTUP';
  disableGenkitBtn.style.display = 'block';
  disableGenkitBtn.style.width = '100%';
  disableGenkitBtn.style.marginTop = '10px';
  disableGenkitBtn.style.padding = '8px';
  disableGenkitBtn.style.backgroundColor = '#8e44ad';
  disableGenkitBtn.style.color = 'white';
  disableGenkitBtn.style.border = 'none';
  disableGenkitBtn.style.borderRadius = '3px';
  disableGenkitBtn.style.cursor = 'pointer';
  
  disableGenkitBtn.onclick = function() {
    // Try to save a setting to disable Genkit templates
    try {
      // Check if electronAPI is available (it might not be in the web context)
      if (window.electronAPI && window.electronAPI.saveSettings) {
        // Load current settings first
        window.electronAPI.loadSettings().then(settings => {
          // Disable Genkit startup
          settings = settings || {};
          settings.disableGenkitStartup = true;
          settings.showGenkitTemplates = false;
          
          // Save modified settings
          window.electronAPI.saveSettings(settings).then(() => {
            console.log('Saved settings to disable Genkit startup');
            alert('Genkit startup disabled! Please restart the application.');
          });
        });
      } else {
        localStorage.setItem('disableGenkitStartup', 'true');
        console.log('Saved setting to localStorage (limited functionality)');
        alert('Attempted to disable Genkit startup using localStorage. You may need to modify the settings file manually.');
      }
    } catch (e) {
      console.error('Failed to save settings:', e);
      alert('Could not save settings. Please restart and try again.');
    }
  };
  
  panel.appendChild(disableGenkitBtn);
  document.body.appendChild(panel);
  
  // Also try to force the first page to show
  const chatPage = document.getElementById('chat-page');
  if (chatPage) {
    chatPage.style.display = 'block';
    console.log('Forced chat page to display');
  }
  
  console.log('✅ Navigation fix applied!');
})();
