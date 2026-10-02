/* re-exports for App convenience */
export { getTheme, shiftHue } from './themes/themes';
import { hexToHsl } from './themes/themes';

export function isDarkThemeColor(hex: string): boolean {
  const [, , l] = hexToHsl(hex);
  return l < 55;
}
