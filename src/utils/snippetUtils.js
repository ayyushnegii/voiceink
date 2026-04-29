/**
 * Snippet Utilities for VoiceInk
 * Applies voice snippets/shortcuts to transcribed text
 */

/**
 * Get all snippets from localStorage
 */
export function getSnippets() {
  try {
    const saved = localStorage.getItem("voiceSnippets");
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Failed to load snippets:", error);
    return [];
  }
}

/**
 * Apply snippets to transcribed text
 * Checks if the text (or last part of it) matches any snippet trigger
 * If match found, replaces trigger with the replacement text
 * 
 * @param {string} text - The transcribed text
 * @returns {string} - Text with snippets applied
 */
export function applySnippets(text) {
  if (!text || typeof text !== 'string') {
    return text;
  }

  const snippets = getSnippets();
  if (snippets.length === 0) {
    return text;
  }

  let result = text;
  
  // Check for snippet triggers in the text
  // We check the entire text, but focus on the last part (where the trigger likely is)
  // Snippets are typically short phrases at the end of dictation
  
  for (const snippet of snippets) {
    const trigger = snippet.trigger.toLowerCase();
    const textLower = result.toLowerCase();
    
    // Check if the trigger appears in the text
    if (textLower.includes(trigger)) {
      // Replace the trigger with the replacement
      // Use word boundary matching to avoid partial replacements
      const regex = new RegExp(`\\b${escapeRegExp(trigger)}\\b`, 'gi');
      result = result.replace(regex, snippet.replacement);
    }
  }

  return result;
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Check if text ends with a snippet trigger
 * Useful for real-time detection during dictation
 * 
 * @param {string} text - Current transcribed text
 * @returns {object|null} - Matching snippet or null
 */
export function checkForSnippetTrigger(text) {
  if (!text || typeof text !== 'string') {
    return null;
  }

  const snippets = getSnippets();
  const textLower = text.toLowerCase().trim();
  
  for (const snippet of snippets) {
    const trigger = snippet.trigger.toLowerCase();
    if (textLower.endsWith(trigger)) {
      return snippet;
    }
  }
  
  return null;
}

/**
 * Format snippet for display
 */
export function formatSnippetForDisplay(snippet) {
  const maxLength = 50;
  const replacement = snippet.replacement.length > maxLength
    ? snippet.replacement.substring(0, maxLength) + '...'
    : snippet.replacement;
  
  return {
    ...snippet,
    displayReplacement: replacement.replace(/\n/g, ' ↩ '),
  };
}
