import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { useState } from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import { Menu } from "react-native-paper";

import { colors, radius, spacing } from "../theme";

type LoginOption = {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  route: Href;
};

const loginOptions: LoginOption[] = [
  {
    label: "Estate Agent sign in",
    icon: "office-building-cog-outline",
    route: "/auth/agent/login" as Href,
  },
  {
    label: "Landlord sign in",
    icon: "home-account",
    route: "/auth/landlord/login" as Href,
  },
  {
    label: "Tenant sign in",
    icon: "account-key-outline",
    route: "/auth/tenant/login" as Href,
  },
  {
    label: "Maintenance sign in",
    icon: "tools",
    route: "/auth/maintenance/login" as Href,
  },
  {
    label: "Council / Inspector sign in",
    icon: "clipboard-check-outline",
    route: "/auth/council/login" as Href,
  },
];

export default function PublicHeader() {
  const { width } = useWindowDimensions();
  const compact = width < 760;
  const [menuVisible, setMenuVisible] = useState(false);

  const go = (route: Href) => {
    setMenuVisible(false);
    router.push(route);
  };

  return (
    <View style={styles.header}>
      <View style={styles.inner}>
        <Pressable
          onPress={() => router.push("/" as Href)}
          style={styles.brand}
          accessibilityRole="button"
          accessibilityLabel="TenureEx home"
        >
          <View style={styles.logoBox}>
            <MaterialCommunityIcons
              name="home-city-outline"
              size={22}
              color={colors.white}
            />
          </View>

          <View>
            <Text style={styles.brandName}>TENUREEX</Text>
            {!compact ? (
              <Text style={styles.brandSub}>UK rental platform</Text>
            ) : null}
          </View>
        </Pressable>

        <View style={styles.navigation}>
          <Pressable
            onPress={() => router.push("/rent" as Href)}
            style={({ pressed }) => [
              styles.rentLink,
              pressed && styles.pressed,
            ]}
          >
            <MaterialCommunityIcons
              name="home-search-outline"
              size={18}
              color={colors.primary}
            />
            <Text style={styles.rentText}>Rent</Text>
          </Pressable>

          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            contentStyle={styles.menu}
            anchor={
              <Pressable
                onPress={() => setMenuVisible(true)}
                style={({ pressed }) => [
                  styles.signInButton,
                  pressed && styles.pressed,
                ]}
              >
                <MaterialCommunityIcons
                  name="account-outline"
                  size={18}
                  color={colors.white}
                />
                <Text style={styles.signInText}>Sign in</Text>
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={17}
                  color={colors.white}
                />
              </Pressable>
            }
          >
            {loginOptions.map((option) => (
              <Menu.Item
                key={option.label}
                leadingIcon={option.icon}
                title={option.label}
                onPress={() => go(option.route)}
              />
            ))}

            <View style={styles.menuDivider} />

            <Pressable
              onPress={() => go("/auth/tenant/register" as Href)}
              style={styles.tenantRegister}
            >
              <MaterialCommunityIcons
                name="account-plus-outline"
                size={19}
                color={colors.primary}
              />
              <View style={styles.tenantRegisterCopy}>
                <Text style={styles.tenantRegisterTitle}>
                  New tenant?
                </Text>
                <Text style={styles.tenantRegisterText}>
                  Register to personalise your rental search
                </Text>
              </View>
            </Pressable>
          </Menu>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: "100%",
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 50,
  },
  inner: {
    width: "100%",
    maxWidth: 1380,
    alignSelf: "center",
    minHeight: 72,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    color: colors.primary,
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 2,
  },
  brandSub: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "700",
  },
  navigation: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  rentLink: {
    minHeight: 42,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: radius.md,
  },
  rentText: {
    color: colors.primary,
    fontWeight: "900",
    fontSize: 12,
  },
  signInButton: {
    minHeight: 42,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  signInText: {
    color: colors.white,
    fontWeight: "900",
    fontSize: 12,
  },
  pressed: {
    opacity: 0.82,
  },
  menu: {
    minWidth: 290,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 5,
  },
  tenantRegister: {
    marginHorizontal: 8,
    marginBottom: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },
  tenantRegisterCopy: {
    flex: 1,
  },
  tenantRegisterTitle: {
    color: colors.textPrimary,
    fontWeight: "900",
    fontSize: 12,
  },
  tenantRegisterText: {
    marginTop: 2,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 13,
  },
});
