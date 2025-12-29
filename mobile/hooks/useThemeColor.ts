import { useColorScheme } from 'react-native';
import useSettingsStore from '../store/settingsStore';
import { Colors } from '../constants/theme';

export function useThemeColor(
    props: { light?: string; dark?: string },
    colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
    const systemTheme = useColorScheme();
    const { theme: settingTheme } = useSettingsStore();

    const theme = settingTheme === 'system' ? systemTheme ?? 'light' : settingTheme;
    const colorFromProps = props[theme];

    if (colorFromProps) {
        return colorFromProps;
    } else {
        return Colors[theme][colorName];
    }
}

export function useTheme() {
    const systemTheme = useColorScheme();
    const { theme: settingTheme } = useSettingsStore();
    return settingTheme === 'system' ? systemTheme ?? 'light' : settingTheme;
}
