import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../../theme";

type TenureExLogoProps = {
  light?: boolean;
  compact?: boolean;
};

export default function TenureExLogo({
  light = false,
  compact = false,
}: TenureExLogoProps) {
  const mainTextColour = light ? colors.white : colors.textPrimary;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.logoMark,
          compact && styles.compactLogoMark,
          light ? styles.lightLogoMark : styles.darkLogoMark,
        ]}
      >
        <MaterialCommunityIcons
          name="home-city-outline"
          size={compact ? 22 : 28}
          color={light ? colors.primary : colors.white}
        />
      </View>

      <View>
        <Text
          style={[
            styles.wordmark,
            compact && styles.compactWordmark,
            { color: mainTextColour },
          ]}
        >
          Tenure<Text style={styles.highlight}>Ex</Text>
        </Text>

        {!compact && (
          <Text
            style={[
              styles.tagline,
              {
                color: light
                  ? "rgba(255,255,255,0.72)"
                  : colors.textMuted,
              },
            ]}
          >
            PROPERTY OPERATIONS
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  logoMark: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  compactLogoMark: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },

  darkLogoMark: {
    backgroundColor: colors.primary,
  },

  lightLogoMark: {
    backgroundColor: colors.white,
  },

  wordmark: {
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: -0.7,
  },

  compactWordmark: {
    fontSize: 21,
  },

  highlight: {
    color: colors.secondary,
  },

  tagline: {
    marginTop: 1,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.6,
  },
});