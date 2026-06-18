import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';

import { AppThemeProvider } from '../theme/AppThemeProvider';

export function renderWithTheme(ui: ReactElement, options?: RenderOptions) {
  return render(<AppThemeProvider>{ui}</AppThemeProvider>, options);
}
