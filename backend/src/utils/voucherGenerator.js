import crypto from 'crypto';

export function generateVoucherCode(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars
  let code = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    code += chars[randomIndex];
    
    // Add dash every 4 characters
    if ((i + 1) % 4 === 0 && i < length - 1) {
      code += '-';
    }
  }
  
  return code;
}

