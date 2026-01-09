/**
 * Voice Expense Parser - Extracts amount, currency, and category from spoken text
 * Supports natural language input like "Spent 450 rupees on groceries"
 */

export interface ParsedExpense {
  amount: number | null;
  currency: string | null;
  categoryMatch: {
    id: string;
    name: string;
    confidence: number;
  } | null;
  rawText: string;
}

// Currency patterns with common spoken variations
const CURRENCY_PATTERNS: Record<string, RegExp[]> = {
  INR: [/₹/, /rupees?/i, /rs\.?/i, /inr/i],
  USD: [/\$/, /dollars?/i, /usd/i, /bucks?/i],
  EUR: [/€/, /euros?/i, /eur/i],
  GBP: [/£/, /pounds?/i, /gbp/i, /sterling/i],
  AED: [/د\.إ/, /dirhams?/i, /aed/i],
  SAR: [/﷼/, /riyals?/i, /sar/i],
  AUD: [/aud/i, /australian dollars?/i],
  CAD: [/cad/i, /canadian dollars?/i],
  JPY: [/¥/, /yen/i, /jpy/i],
  CNY: [/yuan/i, /cny/i, /rmb/i],
};

// Category synonyms for fuzzy matching
const CATEGORY_SYNONYMS: Record<string, string[]> = {
  'Food & Groceries': [
    'food', 'groceries', 'grocery', 'vegetables', 'fruits', 'supermarket',
    'lunch', 'dinner', 'breakfast', 'meal', 'eating', 'restaurant', 'dining',
    'cafe', 'coffee', 'snacks', 'takeaway', 'takeout', 'delivery', 'zomato',
    'swiggy', 'uber eats', 'doordash', 'kitchen', 'cooking', 'ingredients'
  ],
  'Travel & Transportation': [
    'travel', 'transport', 'transportation', 'cab', 'taxi', 'uber', 'ola',
    'lyft', 'metro', 'bus', 'train', 'flight', 'airline', 'petrol', 'gas',
    'fuel', 'diesel', 'parking', 'toll', 'commute', 'ride', 'auto', 'rickshaw'
  ],
  'Education': [
    'education', 'school', 'college', 'university', 'tuition', 'course',
    'class', 'books', 'stationery', 'learning', 'training', 'workshop',
    'certification', 'exam', 'fees', 'coaching', 'tutorial'
  ],
  'House Rent': [
    'rent', 'rental', 'lease', 'apartment', 'flat', 'house rent', 'accommodation',
    'housing', 'landlord', 'tenant', 'deposit', 'security deposit'
  ],
  'Utilities': [
    'utilities', 'utility', 'internet', 'wifi', 'broadband', 'phone',
    'mobile', 'telephone', 'cable', 'tv', 'satellite'
  ],
  'Cleaning & Maintenance': [
    'cleaning', 'maintenance', 'repair', 'repairs', 'plumber', 'electrician',
    'maid', 'housekeeping', 'laundry', 'dry cleaning', 'pest control',
    'renovation', 'painting', 'fixing'
  ],
  'Medical & Health': [
    'medical', 'health', 'doctor', 'hospital', 'clinic', 'medicine',
    'pharmacy', 'prescription', 'dentist', 'dental', 'checkup', 'treatment',
    'surgery', 'insurance', 'health insurance', 'gym', 'fitness', 'yoga'
  ],
  'Shopping': [
    'shopping', 'clothes', 'clothing', 'shoes', 'accessories', 'fashion',
    'amazon', 'flipkart', 'online shopping', 'mall', 'store', 'electronics',
    'gadgets', 'furniture', 'home decor', 'gifts', 'presents'
  ],
  'Entertainment': [
    'entertainment', 'movie', 'movies', 'cinema', 'theatre', 'concert',
    'show', 'netflix', 'spotify', 'music', 'games', 'gaming', 'party',
    'outing', 'vacation', 'holiday', 'trip', 'tour', 'fun', 'leisure'
  ],
  'Bills': [
    'bill', 'bills', 'payment', 'invoice', 'due', 'credit card', 'emi',
    'loan', 'installment', 'premium'
  ],
  'Subscription': [
    'subscription', 'subscriptions', 'monthly', 'yearly', 'annual',
    'membership', 'prime', 'streaming', 'saas', 'software'
  ],
  'Water & Electricity': [
    'water', 'electricity', 'electric', 'power', 'energy', 'current',
    'light bill', 'water bill', 'power bill', 'dewa', 'utility bill'
  ],
  'Miscellaneous': [
    'misc', 'miscellaneous', 'other', 'others', 'random', 'general',
    'various', 'sundry', 'extra'
  ],
};

/**
 * Extract amount from spoken text
 */
function extractAmount(text: string): number | null {
  // Remove currency symbols and words first to avoid confusion
  let cleanText = text;
  
  // Handle spoken numbers like "four fifty" or "twenty five"
  const numberWords: Record<string, number> = {
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
    'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
    'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13,
    'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17,
    'eighteen': 18, 'nineteen': 19, 'twenty': 20, 'thirty': 30,
    'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70,
    'eighty': 80, 'ninety': 90, 'hundred': 100, 'thousand': 1000,
    'lakh': 100000, 'lac': 100000, 'lakhs': 100000,
    'million': 1000000, 'crore': 10000000
  };

  // Try to find numeric amounts first (most reliable)
  const numericPatterns = [
    /(\d+(?:,\d{3})*(?:\.\d{1,2})?)/,  // Standard numbers: 1,234.56 or 450
    /(\d+(?:\.\d{1,2})?)\s*(?:k|K)/,    // 5k, 10K
  ];

  for (const pattern of numericPatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      let numStr = match[1].replace(/,/g, '');
      let num = parseFloat(numStr);
      
      // Handle "k" multiplier
      if (cleanText.match(/\d+(?:\.\d+)?\s*(?:k|K)/)) {
        num *= 1000;
      }
      
      if (!isNaN(num) && num > 0) {
        return num;
      }
    }
  }

  // Try word-based numbers
  const lowerText = cleanText.toLowerCase();
  let total = 0;
  let current = 0;
  let foundNumber = false;

  const words = lowerText.split(/\s+/);
  for (const word of words) {
    if (numberWords[word] !== undefined) {
      foundNumber = true;
      const value = numberWords[word];
      
      if (value >= 100) {
        current = current === 0 ? value : current * value;
      } else if (value >= 1000) {
        current = (current === 0 ? 1 : current) * value;
        total += current;
        current = 0;
      } else {
        current += value;
      }
    }
  }
  
  total += current;
  
  if (foundNumber && total > 0) {
    return total;
  }

  return null;
}

/**
 * Extract currency from spoken text
 */
function extractCurrency(text: string): string | null {
  const lowerText = text.toLowerCase();
  
  for (const [code, patterns] of Object.entries(CURRENCY_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text) || pattern.test(lowerText)) {
        return code;
      }
    }
  }
  
  return null;
}

/**
 * Match category using fuzzy matching
 */
function matchCategory(
  text: string,
  categories: Array<{ id: string; name: string }>
): { id: string; name: string; confidence: number } | null {
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);
  
  let bestMatch: { id: string; name: string; confidence: number } | null = null;
  
  for (const category of categories) {
    const categoryName = category.name;
    const synonyms = CATEGORY_SYNONYMS[categoryName] || [];
    
    // Check exact category name match
    if (lowerText.includes(categoryName.toLowerCase())) {
      return { ...category, confidence: 1.0 };
    }
    
    // Check synonym matches
    for (const synonym of synonyms) {
      const synonymWords = synonym.split(/\s+/);
      
      // Exact synonym match
      if (lowerText.includes(synonym)) {
        const confidence = synonym.length > 4 ? 0.9 : 0.8;
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = { ...category, confidence };
        }
      }
      
      // Partial word match
      for (const word of words) {
        if (word.length >= 3 && synonym.includes(word)) {
          const confidence = 0.6;
          if (!bestMatch || confidence > bestMatch.confidence) {
            bestMatch = { ...category, confidence };
          }
        }
        
        // Check if word starts with synonym or vice versa
        if (word.length >= 4 && (synonym.startsWith(word) || word.startsWith(synonym))) {
          const confidence = 0.7;
          if (!bestMatch || confidence > bestMatch.confidence) {
            bestMatch = { ...category, confidence };
          }
        }
      }
    }
  }
  
  // Only return if confidence is above threshold
  return bestMatch && bestMatch.confidence >= 0.6 ? bestMatch : null;
}

/**
 * Main parser function - extracts expense data from voice input
 */
export function parseVoiceExpense(
  text: string,
  categories: Array<{ id: string; name: string }>,
  defaultCurrency?: string
): ParsedExpense {
  const amount = extractAmount(text);
  const currency = extractCurrency(text) || defaultCurrency || null;
  const categoryMatch = matchCategory(text, categories);
  
  return {
    amount,
    currency,
    categoryMatch,
    rawText: text,
  };
}

/**
 * Check if Web Speech API is supported
 */
export function isSpeechRecognitionSupported(): boolean {
  return !!(
    (window as any).SpeechRecognition || 
    (window as any).webkitSpeechRecognition
  );
}
