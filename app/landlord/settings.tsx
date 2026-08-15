import { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import {
    Button,
    Divider,
    Switch,
    TextInput,
} from "react-native-paper";

import { colors, radius, spacing } from "../../src/theme";
import LandlordModuleScreen from "./LandlordModuleScreen";

export default function LandlordSettingsScreen() {
  const [settings, setSettings] = useState({
    fullName: "Daniel Thompson",
    email: "daniel.thompson@example.com",
    phone: "07123 987654",
    address:
      "25 Green Lane, Manchester, M20 4AB",
    preferredLanguage: "English",

    bankName: "Example Bank",
    accountName: "Daniel Thompson",
    sortCode: "12-34-56",
    accountNumber: "12345678",

    maintenanceRoute:
      "Contact landlord first",
    preferredContractor:
      "NorthWest Heating Ltd",
    emergencyLimit: "250",

    emailNotifications: true,
    pushNotifications: true,
    paymentNotifications: true,
    maintenanceNotifications: true,
    documentReminders: true,
    messageNotifications: true,

    twoFactorAuthentication: false,
  });

  const [saved, setSaved] = useState(false);

  const update = (
    field: keyof typeof settings,
    value: string | boolean,
  ) => {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));

    setSaved(false);
  };

  const saveSettings = () => {
    setSaved(true);
  };

  return (
    <LandlordModuleScreen
      pageTitle="Settings"
      pageSubtitle="Manage your landlord profile, payment details, maintenance preferences and notifications."
      activePage="Settings"
      statistics={[
        {
          label: "Profile",
          value: "Active",
          icon: "account-check-outline",
          helper: "Landlord account",
        },
        {
          label: "Properties",
          value: "4",
          icon: "home-city-outline",
          helper: "Connected properties",
        },
        {
          label: "Notifications",
          value: settings.pushNotifications
            ? "On"
            : "Off",
          icon: "bell-outline",
          helper: "Push notifications",
        },
        {
          label: "Security",
          value:
            settings.twoFactorAuthentication
              ? "2FA On"
              : "Standard",
          icon: "shield-lock-outline",
          helper: "Account security",
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.page}
      >
        {saved ? (
          <View style={styles.successMessage}>
            <Text style={styles.successText}>
              Settings saved successfully.
            </Text>
          </View>
        ) : null}

        <SettingsSection
          title="Personal information"
          description="Update your landlord contact information."
        >
          <View style={styles.fields}>
            <SettingInput
              label="Full name"
              value={settings.fullName}
              onChangeText={(value) =>
                update("fullName", value)
              }
            />

            <SettingInput
              label="Email address"
              value={settings.email}
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={(value) =>
                update("email", value)
              }
            />

            <SettingInput
              label="Phone number"
              value={settings.phone}
              keyboardType="phone-pad"
              onChangeText={(value) =>
                update("phone", value)
              }
            />

            <SettingInput
              label="Home address"
              value={settings.address}
              onChangeText={(value) =>
                update("address", value)
              }
            />

            <SettingInput
              label="Preferred language"
              value={settings.preferredLanguage}
              onChangeText={(value) =>
                update(
                  "preferredLanguage",
                  value,
                )
              }
            />
          </View>
        </SettingsSection>

        <SettingsSection
          title="Bank details"
          description="These details may be used for landlord payments."
        >
          <View style={styles.fields}>
            <SettingInput
              label="Bank name"
              value={settings.bankName}
              onChangeText={(value) =>
                update("bankName", value)
              }
            />

            <SettingInput
              label="Account holder name"
              value={settings.accountName}
              onChangeText={(value) =>
                update("accountName", value)
              }
            />

            <SettingInput
              label="Sort code"
              value={settings.sortCode}
              keyboardType="number-pad"
              onChangeText={(value) =>
                update("sortCode", value)
              }
            />

            <SettingInput
              label="Account number"
              value={settings.accountNumber}
              keyboardType="number-pad"
              secureTextEntry
              onChangeText={(value) =>
                update(
                  "accountNumber",
                  value,
                )
              }
            />
          </View>
        </SettingsSection>

        <SettingsSection
          title="Maintenance preferences"
          description="Choose how repairs should be handled."
        >
          <View style={styles.fields}>
            <SettingInput
              label="Default maintenance route"
              value={
                settings.maintenanceRoute
              }
              onChangeText={(value) =>
                update(
                  "maintenanceRoute",
                  value,
                )
              }
            />

            <SettingInput
              label="Preferred contractor"
              value={
                settings.preferredContractor
              }
              onChangeText={(value) =>
                update(
                  "preferredContractor",
                  value,
                )
              }
            />

            <SettingInput
              label="Emergency spending limit (£)"
              value={settings.emergencyLimit}
              keyboardType="decimal-pad"
              onChangeText={(value) =>
                update(
                  "emergencyLimit",
                  value.replace(
                    /[^0-9.]/g,
                    "",
                  ),
                )
              }
            />
          </View>
        </SettingsSection>

        <SettingsSection
          title="Notifications"
          description="Choose which alerts you receive."
        >
          <SettingToggle
            title="Email notifications"
            description="Receive important account updates by email."
            value={
              settings.emailNotifications
            }
            onValueChange={(value) =>
              update(
                "emailNotifications",
                value,
              )
            }
          />

          <Divider />

          <SettingToggle
            title="Push notifications"
            description="Receive notifications on your phone."
            value={
              settings.pushNotifications
            }
            onValueChange={(value) =>
              update(
                "pushNotifications",
                value,
              )
            }
          />

          <Divider />

          <SettingToggle
            title="Payment notifications"
            description="Receive rent and payment updates."
            value={
              settings.paymentNotifications
            }
            onValueChange={(value) =>
              update(
                "paymentNotifications",
                value,
              )
            }
          />

          <Divider />

          <SettingToggle
            title="Maintenance notifications"
            description="Receive repair request updates."
            value={
              settings.maintenanceNotifications
            }
            onValueChange={(value) =>
              update(
                "maintenanceNotifications",
                value,
              )
            }
          />

          <Divider />

          <SettingToggle
            title="Document reminders"
            description="Receive certificate expiry reminders."
            value={
              settings.documentReminders
            }
            onValueChange={(value) =>
              update(
                "documentReminders",
                value,
              )
            }
          />

          <Divider />

          <SettingToggle
            title="Message notifications"
            description="Receive new-message alerts."
            value={
              settings.messageNotifications
            }
            onValueChange={(value) =>
              update(
                "messageNotifications",
                value,
              )
            }
          />
        </SettingsSection>

        <SettingsSection
          title="Security"
          description="Protect access to your landlord account."
        >
          <SettingToggle
            title="Two-factor authentication"
            description="Require an additional security code when signing in."
            value={
              settings.twoFactorAuthentication
            }
            onValueChange={(value) =>
              update(
                "twoFactorAuthentication",
                value,
              )
            }
          />

          <View style={styles.securityActions}>
            <Button
              mode="outlined"
              icon="lock-reset"
              onPress={() => {}}
            >
              Change password
            </Button>

            <Button
              mode="outlined"
              icon="logout"
              onPress={() => {}}
            >
              Sign out all devices
            </Button>
          </View>
        </SettingsSection>

        <SettingsSection
          title="Danger zone"
          description="These actions may affect your account."
          danger
        >
          <Button
            mode="outlined"
            icon="download-outline"
            onPress={() => {}}
          >
            Download my data
          </Button>

          <Button
            mode="outlined"
            icon="account-off-outline"
            textColor={colors.error}
            style={styles.deleteButton}
            onPress={() => {}}
          >
            Request account deletion
          </Button>
        </SettingsSection>

        <View style={styles.saveArea}>
          <Button
            mode="contained"
            icon="content-save-outline"
            onPress={saveSettings}
          >
            Save settings
          </Button>
        </View>
      </ScrollView>
    </LandlordModuleScreen>
  );
}

function SettingsSection({
  title,
  description,
  children,
  danger = false,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <View
      style={[
        styles.section,
        danger && styles.dangerSection,
      ]}
    >
      <View style={styles.sectionHeader}>
        <Text
          style={[
            styles.sectionTitle,
            danger && styles.dangerTitle,
          ]}
        >
          {title}
        </Text>

        <Text style={styles.sectionDescription}>
          {description}
        </Text>
      </View>

      <View style={styles.sectionBody}>
        {children}
      </View>
    </View>
  );
}

function SettingInput(
  props: React.ComponentProps<typeof TextInput>,
) {
  return (
    <View style={styles.inputWrapper}>
      <TextInput
        mode="outlined"
        style={styles.input}
        {...props}
      />
    </View>
  );
}

function SettingToggle({
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
    <View style={styles.toggle}>
      <View style={styles.toggleText}>
        <Text style={styles.toggleTitle}>
          {title}
        </Text>

        <Text
          style={styles.toggleDescription}
        >
          {description}
        </Text>
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        color={colors.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },

  successMessage: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.successLight,
  },

  successText: {
    color: colors.success,
    fontWeight: "800",
  },

  section: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  dangerSection: {
    borderColor: colors.error,
  },

  sectionHeader: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },

  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "900",
  },

  dangerTitle: {
    color: colors.error,
  },

  sectionDescription: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 16,
  },

  sectionBody: {
    padding: spacing.lg,
    gap: spacing.md,
  },

  fields: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },

  inputWrapper: {
    flexGrow: 1,
    flexBasis: 280,
    minWidth: 240,
  },

  input: {
    backgroundColor: colors.white,
  },

  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },

  toggleText: {
    flex: 1,
  },

  toggleTitle: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "800",
  },

  toggleDescription: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 14,
  },

  securityActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  deleteButton: {
    borderColor: colors.error,
  },

  saveArea: {
    alignItems: "flex-end",
  },
});