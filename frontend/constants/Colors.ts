/**
 * Baby Luki colour palette.
 * Soft, calming tones — easy on the eyes at 3 AM.
 */
const tintColorLight = '#E8A87C'; // warm peach — primary accent
const tintColorDark = '#F2C094';

export default {
  light: {
    text: '#2C2C2C',
    textSecondary: '#8E8E93',
    background: '#FAFAFA',
    card: '#FFFFFF',
    tint: tintColorLight,
    tabIconDefault: '#C7C7CC',
    tabIconSelected: tintColorLight,
    border: '#E5E5EA',
    success: '#81C784',
    warning: '#FFB74D',
  },
  dark: {
    text: '#F5F5F5',
    textSecondary: '#8E8E93',
    background: '#1C1C1E',
    card: '#2C2C2E',
    tint: tintColorDark,
    tabIconDefault: '#636366',
    tabIconSelected: tintColorDark,
    border: '#38383A',
    success: '#66BB6A',
    warning: '#FFA726',
  },
};
