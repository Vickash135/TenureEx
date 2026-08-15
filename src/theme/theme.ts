import { MD3LightTheme } from "react-native-paper";
import { colors } from "./colors";

export const appTheme = {
  ...MD3LightTheme,

  roundness: 14,

  colors: {
    ...MD3LightTheme.colors,

    primary: colors.primary,
    onPrimary: colors.white,

    primaryContainer: colors.primaryLight,
    onPrimaryContainer: colors.primaryDark,

    secondary: colors.secondary,
    onSecondary: colors.white,

    secondaryContainer: colors.secondaryLight,
    onSecondaryContainer: colors.textPrimary,

    background: colors.background,
    onBackground: colors.textPrimary,

    surface: colors.surface,
    onSurface: colors.textPrimary,

    surfaceVariant: colors.surfaceSoft,
    onSurfaceVariant: colors.textSecondary,

    outline: colors.border,

    error: colors.error,
    onError: colors.white,

    errorContainer: colors.errorLight,
    onErrorContainer: colors.error,
  },
};