const ADMIN_SESSION_KEY = 'vier-apparel-admin-unlocked';
const ADMIN_PASSCODE = import.meta.env.VITE_SHOP_ADMIN_PASSCODE || 'admin123';

export const isAdminUnlocked = () => sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';

export const unlockAdmin = (passcode) => {
  const isValid = passcode === ADMIN_PASSCODE;
  if (isValid) {
    sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
  }
  return isValid;
};

export const lockAdmin = () => {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
};