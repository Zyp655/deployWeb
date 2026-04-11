export function isProductTimeValid(saleStartTime?: string | null, saleEndTime?: string | null): boolean {
  if (!saleStartTime && !saleEndTime) return true;

  const now = new Date();
  
  // Create a formatter for Asia/Ho_Chi_Minh
  const formatter = new Intl.DateTimeFormat('en-US', { 
    timeZone: 'Asia/Ho_Chi_Minh', 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  });
  
  const vnTime = formatter.format(now);
  const currentTime = vnTime; // "HH:mm"
  
  if (saleStartTime && saleEndTime) {
    if (saleStartTime <= saleEndTime) {
      // Normal slot, e.g. 06:00 to 11:00
      return currentTime >= saleStartTime && currentTime <= saleEndTime;
    } else {
      // Cross midnight slot, e.g. 22:00 to 02:00
      return currentTime >= saleStartTime || currentTime <= saleEndTime;
    }
  }
  
  if (saleStartTime) {
    return currentTime >= saleStartTime;
  }
  
  if (saleEndTime) {
    return currentTime <= saleEndTime;
  }
  
  return true;
}
