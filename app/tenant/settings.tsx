import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Button,
  Divider,
  Snackbar,
  Switch,
  TextInput,
} from "react-native-paper";

import InternationalPhoneInput from "@/src/components/InternationalPhoneInput";
import ScreenContainer from "../../src/components/ScreenContainer";
import { colors, radius, spacing } from "../../src/theme";

export default function TenantSettingsScreen() {
  const [name, setName] =
    useState("Vickash Sivakumar");
  const [email, setEmail] =
    useState("vickash@example.com");
  const [phone, setPhone] =
    useState("+44 7700 900123");
  const [address, setAddress] =
    useState("42 King Street, Leeds, LS1 2HQ");

  const [emailNotifications, setEmailNotifications] =
    useState(true);
  const [pushNotifications, setPushNotifications] =
    useState(true);
  const [
    maintenanceNotifications,
    setMaintenanceNotifications,
  ] = useState(true);
  const [paymentNotifications, setPaymentNotifications] =
    useState(true);
  const [marketingMessages, setMarketingMessages] =
    useState(false);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      setMessage("Enter your full name.");
      return;
    }

    if (!email.includes("@")) {
      setMessage("Enter a valid email address.");
      return;
    }

    setSaving(true);

    try {
      await new Promise((resolve) =>
        setTimeout(resolve, 700),
      );

      console.log("Profile settings saved:", {
        name,
        email,
        phone,
        address,
      });

      setMessage("Profile information saved.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = () => {
    console.log("Notification preferences saved:", {
      emailNotifications,
      pushNotifications,
      maintenanceNotifications,
      paymentNotifications,
      marketingMessages,
    });

    setMessage("Notification preferences saved.");
  };

  const handleLogout = () => {
    router.replace("/login" as never);
  };

  return (
    <ScreenContainer
      scrollable
      contentStyle={styles.screenContent}
    >
      <View style={styles.page}>
        <View style={styles.topBar}>
          <Pressable
            style={styles.brand}
            onPress={() =>
              router.replace(
                "/tenant/dashboard" as never,
              )
            }
          >
            <View style={styles.logo}>
              <MaterialCommunityIcons
                name="cog-outline"
                size={27}
                color={colors.white}
              />
            </View>

            <View>
              <Text style={styles.brandName}>
                Settings
              </Text>

              <Text style={styles.brandSubtitle}>
                Account and preferences
              </Text>
            </View>
          </Pressable>

          <Button
            mode="text"
            icon="arrow-left"
            onPress={() => router.back()}
          >
            Back
          </Button>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons
              name="account-cog-outline"
              size={38}
              color={colors.primary}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.heroLabel}>
              ACCOUNT SETTINGS
            </Text>

            <Text style={styles.heroTitle}>
              Manage your tenant account
            </Text>

            <Text style={styles.heroDescription}>
              Update your personal details, notifications
              and security preferences.
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <SectionHeader
            icon="account-outline"
            title="Personal information"
            description="Keep your contact details correct and up to date."
          />

          <Divider style={styles.divider} />

          <View style={styles.formGrid}>
            <TextInput
              mode="outlined"
              label="Full name"
              value={name}
              onChangeText={setName}
              style={styles.field}
              left={
                <TextInput.Icon icon="account-outline" />
              }
            />

            <TextInput
              mode="outlined"
              label="Email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.field}
              left={
                <TextInput.Icon icon="email-outline" />
              }
            />

            <InternationalPhoneInput
              label="Telephone number"
              value={phone}
              onChangeText={setPhone}
              style={styles.field}
            />

            <TextInput
              mode="outlined"
              label="Current address"
              value={address}
              onChangeText={setAddress}
              style={styles.field}
              left={
                <TextInput.Icon icon="map-marker-outline" />
              }
            />
          </View>

          <View style={styles.actionRow}>
            <Button
              mode="contained"
              icon="content-save-outline"
              loading={saving}
              disabled={saving}
              onPress={handleSaveProfile}
            >
              Save profile
            </Button>
          </View>
        </View>

        <View style={styles.card}>
          <SectionHeader
            icon="bell-outline"
            title="Notifications"
            description="Choose which updates you want to receive."
          />

          <Divider style={styles.divider} />

          <SettingSwitch
            title="Email notifications"
            description="Receive important account updates by email."
            value={emailNotifications}
            onValueChange={setEmailNotifications}
          />

          <SettingSwitch
            title="Push notifications"
            description="Receive notifications inside the TenureEx app."
            value={pushNotifications}
            onValueChange={setPushNotifications}
          />

          <SettingSwitch
            title="Maintenance updates"
            description="Receive status changes for maintenance requests."
            value={maintenanceNotifications}
            onValueChange={setMaintenanceNotifications}
          />

          <SettingSwitch
            title="Payment reminders"
            description="Receive reminders before rent payments are due."
            value={paymentNotifications}
            onValueChange={setPaymentNotifications}
          />

          <SettingSwitch
            title="Marketing messages"
            description="Receive optional property and service information."
            value={marketingMessages}
            onValueChange={setMarketingMessages}
          />

          <View style={styles.actionRow}>
            <Button
              mode="contained"
              icon="bell-check-outline"
              onPress={handleSaveNotifications}
            >
              Save notifications
            </Button>
          </View>
        </View>

        <View style={styles.card}>
          <SectionHeader
            icon="shield-lock-outline"
            title="Security"
            description="Manage your password and account access."
          />

          <Divider style={styles.divider} />

          <View style={styles.securityRow}>
            <View style={styles.securityIcon}>
              <MaterialCommunityIcons
                name="lock-reset"
                size={25}
                color={colors.primary}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.securityTitle}>
                Change password
              </Text>

              <Text style={styles.securityDescription}>
                Update your password regularly to keep
                your account secure.
              </Text>
            </View>

            <Button
              mode="outlined"
              onPress={() =>
                setMessage(
                  "Password change can be connected to your backend later.",
                )
              }
            >
              Change
            </Button>
          </View>
        </View>

        <View style={styles.dangerCard}>
          <View style={styles.dangerHeader}>
            <MaterialCommunityIcons
              name="logout"
              size={27}
              color={colors.error}
            />

            <View style={{ flex: 1 }}>
              <Text style={styles.dangerTitle}>
                Sign out
              </Text>

              <Text style={styles.dangerDescription}>
                Sign out from your TenureEx tenant
                account on this device.
              </Text>
            </View>
          </View>

          <Button
            mode="outlined"
            icon="logout"
            textColor={colors.error}
            onPress={handleLogout}
          >
            Sign out
          </Button>
        </View>
      </View>

      <Snackbar
        visible={Boolean(message)}
        duration={3000}
        onDismiss={() => setMessage("")}
        action={{
          label: "Close",
          onPress: () => setMessage(""),
        }}
      >
        {message}
      </Snackbar>
    </ScreenContainer>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon:
    keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={25}
          color={colors.primary}
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>
          {title}
        </Text>

        <Text style={styles.sectionDescription}>
          {description}
        </Text>
      </View>
    </View>
  );
}

function SettingSwitch({
  title,
  description,
  value,
  onValueChange,
}: {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.settingTitle}>
          {title}
        </Text>

        <Text style={styles.settingDescription}>
          {description}
        </Text>
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContent: { padding: 0 },

  page: {
    width: "100%",
    maxWidth: 1100,
    alignSelf: "center",
    gap: spacing.xl,
    padding: spacing.lg,
    paddingBottom: 70,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  logo: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: colors.primary,
  },

  brandName: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "900",
  },

  brandSubtitle: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 9,
  },

  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  heroIcon: {
    width: 67,
    height: 67,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: colors.primaryLight,
  },

  heroLabel: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  heroTitle: {
    marginTop: 5,
    color: colors.textPrimary,
    fontSize: 23,
    fontWeight: "900",
  },

  heroDescription: {
    marginTop: 6,
    color: colors.textMuted,
    fontSize: 10,
  },

  card: {
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  sectionIcon: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
  },

  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "900",
  },

  sectionDescription: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 9,
  },

  divider: {
    marginVertical: spacing.lg,
  },

  formGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },

  field: {
    flexGrow: 1,
    flexBasis: 320,
    minWidth: 240,
  },

  actionRow: {
    alignItems: "flex-end",
    marginTop: spacing.xl,
  },

  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  settingTitle: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },

  settingDescription: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 15,
  },

  securityRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.md,
  },

  securityIcon: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
  },

  securityTitle: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "900",
  },

  securityDescription: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 9,
  },

  dangerCard: {
    gap: spacing.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  dangerHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },

  dangerTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "900",
  },

  dangerDescription: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 15,
  },
});