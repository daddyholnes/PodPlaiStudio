/**
 * Safely accesses CSS rules from a stylesheet
 * @param {StyleSheet} stylesheet - The stylesheet to access
 * @returns {CSSRuleList|null} The CSS rules or null if access fails
 */
export const safelyAccessCssRules = (stylesheet) => {
  try {
    // Attempt to access the CSS rules
    return stylesheet.cssRules;
  } catch (error) {
    if (error.name === 'SecurityError') {
      console.warn('Cannot access cssRules due to security restrictions (likely cross-origin stylesheet)');
    } else {
      console.error('Error accessing CSS rules:', error);
    }
    return null;
  }
};

/**
 * Safely processes all stylesheets in the document
 * @param {Function} callback - Function to call with each accessible stylesheet's rules
 */
export const processSafeStylesheets = (callback) => {
  try {
    Array.from(document.styleSheets || []).forEach(stylesheet => {
      try {
        // Only process same-origin stylesheets
        if (stylesheet.href && 
            !stylesheet.href.startsWith(window.location.origin) && 
            !stylesheet.href.startsWith('http://localhost')) {
          // Skip cross-origin stylesheets silently
          return;
        }
        
        const rules = safelyAccessCssRules(stylesheet);
        if (rules && callback) {
          callback(rules, stylesheet);
        }
      } catch (innerError) {
        // Silent fail for individual stylesheets
      }
    });
  } catch (error) {
    console.error('Error processing stylesheets:', error);
  }
};
