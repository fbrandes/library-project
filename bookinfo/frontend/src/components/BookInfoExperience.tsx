import { AppThemeProvider } from '../theme/AppThemeProvider';
import { BookInfoWorkspace } from './BookInfoWorkspace';

interface BookInfoExperienceProps {
  embedded?: boolean;
}

export function BookInfoExperience({ embedded = false }: BookInfoExperienceProps) {
  return (
    <AppThemeProvider includeCssBaseline={!embedded}>
      <BookInfoWorkspace embedded={embedded} />
    </AppThemeProvider>
  );
}
