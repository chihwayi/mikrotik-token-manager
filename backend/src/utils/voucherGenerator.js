import crypto from 'crypto';

export function generateVoucherCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars
  let code = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    code += chars[randomIndex];
  }
  
  return code;
}

