const crypto = require('crypto');

// Metaphorical plant language mapping for encryption
const PLANT_METAPHORS = {
  // Emotional states
  'sad|depressed|lonely': '🍂 Leaf is wilting',
  'happy|joy|glad': '🌿 Fern is flourishing',
  'scared|afraid|frightened': '🌾 Wheat bends in harsh wind',
  'angry|rage|furious': '🌹 Rose has thorns',
  'calm|peace|safe': '🪷 Lily floats peacefully',
  'hurt|pain|suffering': '💀 Root is broken',
  'help|need|desperate': '🚨 Plant needs water urgently',
  'love|care|trust': '💚 Plant is nourished',
  
  // Safety states
  'danger|threat|risk': 'Soil is toxic',
  'protection|safe|secure': 'Garden is fenced',
  'abuse|harm|violence': 'Pesticide spray',
  'escape|leave|flee': 'Seed dispersal',
  'recovery|healing|better': 'New growth sprouting',
};

/**
 * Encrypt journal entry using AES-256-CBC
 * @param {string} text - Plain text journal entry
 * @param {string} key - Encryption key (from userId)
 * @returns {string} - Encrypted text (hex)
 */
const encryptJournal = (text, key) => {
  try {
    // Generate IV from userId for consistency
    const hash = crypto.createHash('sha256').update(key).digest();
    const iv = hash.slice(0, 16);
    const encryptionKey = hash;

    const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  } catch (error) {
    console.error('❌ Encryption error:', error);
    return text; // Return plain text if encryption fails
  }
};

/**
 * Decrypt journal entry
 * @param {string} encrypted - Encrypted text (hex)
 * @param {string} key - Decryption key (from userId)
 * @returns {string} - Decrypted plain text
 */
const decryptJournal = (encrypted, key) => {
  try {
    const hash = crypto.createHash('sha256').update(key).digest();
    const iv = hash.slice(0, 16);
    const decryptionKey = hash;

    const decipher = crypto.createDecipheriv('aes-256-cbc', decryptionKey, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('❌ Decryption error:', error);
    return encrypted; // Return encrypted if decryption fails
  }
};

/**
 * Transform journal entry into metaphorical plant language
 * Replaces sensitive keywords with plant metaphors
 * @param {string} text - Original journal entry
 * @returns {object} - { original, encrypted, metaphorical, keywords }
 */
const transformToMetaphor = (text) => {
  let metaphoricalText = text;
  const foundKeywords = [];

  // Replace sensitive keywords with plant metaphors
  for (const [keywords, metaphor] of Object.entries(PLANT_METAPHORS)) {
    const keywordArray = keywords.split('|');
    keywordArray.forEach((keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      if (regex.test(text)) {
        foundKeywords.push(keyword.toLowerCase());
        metaphoricalText = metaphoricalText.replace(regex, metaphor);
      }
    });
  }

  return {
    original: text,
    metaphorical: metaphoricalText,
    keywords: foundKeywords,
    hasMetaphor: foundKeywords.length > 0,
  };
};

/**
 * Analyze sentiment using simple keyword matching
 * (Can be enhanced with Google Natural Language API)
 * @param {string} text - Text to analyze
 * @returns {object} - Sentiment analysis
 */
const analyzeSentiment = (text) => {
  const positiveWords = [
    'good',
    'great',
    'happy',
    'love',
    'wonderful',
    'safe',
    'secure',
    'calm',
    'peace',
    'joy',
  ];
  const negativeWords = [
    'bad',
    'sad',
    'angry',
    'hate',
    'danger',
    'scared',
    'afraid',
    'hurt',
    'pain',
    'abuse',
  ];

  const lowerText = text.toLowerCase();
  const positiveCount = positiveWords.filter((word) => lowerText.includes(word)).length;
  const negativeCount = negativeWords.filter((word) => lowerText.includes(word)).length;

  let sentiment = 'NEUTRAL';
  if (positiveCount > negativeCount) sentiment = 'POSITIVE';
  else if (negativeCount > positiveCount) sentiment = 'NEGATIVE';

  return {
    sentiment,
    positiveCount,
    negativeCount,
    score: (positiveCount - negativeCount) / (positiveCount + negativeCount || 1),
  };
};

module.exports = {
  encryptJournal,
  decryptJournal,
  transformToMetaphor,
  analyzeSentiment,
};
