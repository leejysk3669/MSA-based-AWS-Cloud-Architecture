const maskPII = (text) => {
  // TODO: Implement PII masking logic using regular expressions
  console.log('Masking PII in text...');
  
  // null/undefined 체크 추가
  if (!text || typeof text !== 'string') {
    console.warn('Invalid text provided to maskPII:', text);
    return text || '';
  }
  
  // Simple example: mask email addresses
  const maskedText = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]');
  return maskedText;
};

module.exports = { maskPII };
