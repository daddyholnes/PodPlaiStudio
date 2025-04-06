/**
 * Check if a stylesheet is from the same origin
 * @param {StyleSheet} stylesheet - The stylesheet to check
 * @returns {boolean} True if the stylesheet is from the same origin
 */
export const isSameOriginStylesheet = (stylesheet) => {
  if (!stylesheet.href) return true; // Inline stylesheets are always same-origin
  
  try {
    // Check if the stylesheet URL is from the same origin as the current page
    const stylesheetUrl = new URL(stylesheet.href);
    const currentUrl = window.location;
    return stylesheetUrl.origin === currentUrl.origin;
  } catch (error) {
    console.warn('Error checking stylesheet origin:', error);
    return false;
  }
};

/**
 * Safely accesses CSS rules from a stylesheet
 * @param {StyleSheet} stylesheet - The stylesheet to access
 * @returns {CSSRuleList|null} The CSS rules or null if access fails
 */
export const safelyAccessCssRules = (stylesheet) => {
  try {
    // Skip cross-origin stylesheets to avoid security errors
    if (!isSameOriginStylesheet(stylesheet)) {
      return null;
    }
    
    // Try to access CSS rules
    return stylesheet.cssRules;
  } catch (error) {
    if (error.name === 'SecurityError') {
      // This is expected for cross-origin stylesheets
      console.debug('Cannot access cssRules due to security restrictions (cross-origin stylesheet)');
    } else {
      console.warn('Error accessing CSS rules:', error);
    }
    return null;
  }
};

/**
 * Process all accessible stylesheets in the document
 * @param {Function} callback - Function to call with each stylesheet's rules
 */
export const processStylesheets = (callback) => {
  if (!document || !document.styleSheets) return;
  
  try {
    Array.from(document.styleSheets).forEach(stylesheet => {
      const rules = safelyAccessCssRules(stylesheet);
      if (rules && callback) {
        callback(rules, stylesheet);
      }
    });
  } catch (error) {
    console.error('Error processing stylesheets:', error);
  }
};
