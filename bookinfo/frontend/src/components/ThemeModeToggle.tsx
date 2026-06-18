import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';

import { useBookInfoStore } from '../stores/bookInfoStore';

export function ThemeModeToggle() {
  const themeMode = useBookInfoStore((state) => state.themeMode);
  const toggleThemeMode = useBookInfoStore((state) => state.toggleThemeMode);
  const isDarkMode = themeMode === 'dark';

  return (
    <FormControlLabel
      control={
        <Switch
          checked={isDarkMode}
          onChange={toggleThemeMode}
          slotProps={{
            input: {
              'aria-label': 'Toggle dark mode',
            },
          }}
        />
      }
      label={
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          {isDarkMode ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
          <Typography variant="body2">Dark mode</Typography>
        </Stack>
      }
      labelPlacement="start"
      sx={{ m: 0 }}
    />
  );
}
