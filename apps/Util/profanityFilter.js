/**
 * Profanity Filter Utility
 * Filters out profanity and offensive words from user input
 */

// List of profanity and offensive words (Vietnamese and English)
const profanityList = [
  // Vietnamese profanity
  'địt', 'đụ', 'đéo', 'đĩ', 'đồ chó', 'đồ khùng', 'đồ ngu', 'đồ ngốc',
  'đồ điên', 'đồ dốt', 'đồ đần', 'đồ súc vật', 'đồ thú vật',
  'chết tiệt', 'chết bà', 'chết mẹ', 'chết cha', 'chết cha mày',
  'đồ khốn', 'đồ khốn nạn', 'đồ súc sinh', 'đồ chó má',
  'mẹ mày', 'cha mày', 'bố mày', 'mẹ kiếp', 'cha kiếp',
  'đồ ngu xuẩn', 'đồ đần độn', 'đồ ngu dốt',
  
  // English profanity
  'fuck', 'fucking', 'fucked', 'fucker', 'fuckers',
  'shit', 'shitting', 'shitted', 'shitty',
  'damn', 'damned', 'dammit',
  'bitch', 'bitches', 'bitching',
  'ass', 'asses', 'asshole', 'assholes',
  'bastard', 'bastards',
  'crap', 'crappy',
  'hell', 'hells',
  'idiot', 'idiots', 'idiotic',
  'stupid', 'stupidity',
  'moron', 'morons',
  'retard', 'retarded',
  'piss', 'pissing', 'pissed',
  'cunt', 'cunts',
  'dick', 'dicks', 'dickhead',
  'pussy', 'pussies',
  
  // Common offensive phrases
  'go to hell', 'go to hell you', 'screw you', 'screw off',
  'fuck off', 'fuck you', 'fuck yourself',
  'shut up', 'shut the fuck up',
  'you suck', 'you are stupid', 'you are an idiot',
];

// Create a regex pattern for matching profanity (case insensitive)
const profanityPattern = new RegExp(
  profanityList
    .map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // Escape special regex characters
    .join('|'),
  'gi'
);

/**
 * Check if text contains profanity
 * @param {string} text - Text to check
 * @returns {boolean} - True if profanity is found
 */
function containsProfanity(text) {
  if (!text || typeof text !== 'string') {
    return false;
  }
  
  // Normalize text (remove accents for better matching)
  const normalizedText = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics
  
  return profanityPattern.test(normalizedText);
}

/**
 * Filter profanity from text by replacing with asterisks
 * @param {string} text - Text to filter
 * @param {string} replacement - Replacement string (default: '***')
 * @returns {string} - Filtered text
 */
function filterProfanity(text, replacement = '***') {
  if (!text || typeof text !== 'string') {
    return text;
  }
  
  return text.replace(profanityPattern, (match) => {
    return replacement.repeat(match.length);
  });
}

/**
 * Sanitize text by filtering profanity
 * @param {string} text - Text to sanitize
 * @returns {object} - { sanitized: string, hasProfanity: boolean }
 */
function sanitizeText(text) {
  if (!text || typeof text !== 'string') {
    return { sanitized: text, hasProfanity: false };
  }
  
  const hasProfanity = containsProfanity(text);
  const sanitized = hasProfanity ? filterProfanity(text) : text;
  
  return { sanitized, hasProfanity };
}

module.exports = {
  containsProfanity,
  filterProfanity,
  sanitizeText,
};

