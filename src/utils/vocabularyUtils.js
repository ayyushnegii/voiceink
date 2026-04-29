/**
 * Vocabulary Utilities for VoiceInk
 * Applies custom vocabulary corrections to transcribed text
 */

/**
 * Get all vocabulary entries from localStorage
 */
export function getVocabulary() {
  try {
    const saved = localStorage.getItem("customVocabulary");
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Failed to load vocabulary:", error);
    return [];
  }
}

/**
 * Apply vocabulary corrections to transcribed text
 * Replaces misrecognized words with correct versions
 * 
 * @param {string} text - The transcribed text
 * @returns {string} - Text with vocabulary corrections applied
 */
export function applyVocabulary(text) {
  if (!text || typeof text !== 'string') {
    return text;
  }

  const vocabulary = getVocabulary();
  if (vocabulary.length === 0) {
    return text;
  }

  let result = text;
  
  // Apply each vocabulary correction
  for (const entry of vocabulary) {
    const original = entry.original;
    const replacement = entry.replacement;
    
    // Use word boundary matching to avoid partial replacements
    // Case-insensitive matching
    const regex = new RegExp(`\\b${escapeRegExp(original)}\\b`, 'gi');
    result = result.replace(regex, replacement);
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
 * Check if text contains any vocabulary originals
 * Useful for determining if vocabulary was applied
 */
export function checkVocabularyUsage(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const vocabulary = getVocabulary();
  const matched = [];
  
  for (const entry of vocabulary) {
    const regex = new RegExp(`\\b${escapeRegExp(entry.original)}\\b`, 'gi');
    if (regex.test(text)) {
      matched.push(entry);
    }
  }
  
  return matched;
}

/**
 * Format vocabulary entry for display
 */
export function formatVocabularyForDisplay(entry) {
  return {
    ...entry,
    displayText: `"${entry.original}" → "${entry.replacement}"`
  };
}
