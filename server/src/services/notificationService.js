export const notifyPatientNextInLine = async (token) => {
  // Mock SMS notification service
  if (!token.phoneNumber) {
    console.log(`[SMS MOCK] No phone number for token #${token.tokenNumber}. Skipping notification.`);
    return;
  }
  console.log(`[SMS MOCK] 📱 Sending SMS to ${token.phoneNumber}: "Hello ${token.patientName}, you are next in line (Token #${token.tokenNumber}). Please proceed to the waiting area."`);
};
