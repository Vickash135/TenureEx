import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import {
    Avatar,
    Button,
    Divider,
    IconButton,
    Menu,
    Snackbar,
    Switch,
    TextInput,
} from "react-native-paper";
import Animated, {
    FadeInDown,
    FadeInLeft,
    FadeInRight,
    FadeInUp,
} from "react-native-reanimated";

import ScreenContainer from "../../src/components/ScreenContainer";
import {
    colors,
    radius,
    spacing,
    typography,
} from "../../src/theme";

type IconName =
  keyof typeof MaterialCommunityIcons.glyphMap;

type NavigationItem = {
  label: string;
  icon: IconName;
  route: string;
  badge?: number;
};

type SettingsSection =
  | "Profile"
  | "Council"
  | "Notifications"
  | "Security"
  | "Appearance";

type NotificationSettings = {
  inspectionReminders: boolean;
  reportUpdates: boolean;
  newMessages: boolean;
  urgentCases: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklySummary: boolean;
};

const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    icon: "view-dashboard-outline",
    route: "/council/dashboard",
  },
  {
    label: "Inspections",
    icon: "clipboard-search-outline",
    route: "/council/inspections",
    badge: 8,
  },
  {
    label: "Reports",
    icon: "file-document-outline",
    route: "/council/reports",
  },
  {
    label: "Messages",
    icon: "message-text-outline",
    route: "/council/messages",
    badge: 3,
  },
  {
    label: "Settings",
    icon: "cog-outline",
    route: "/council/settings",
  },
];

const settingsSections: {
  label: SettingsSection;
  icon: IconName;
  description: string;
}[] = [
  {
    label: "Profile",
    icon: "account-outline",
    description: "Personal and contact information",
  },
  {
    label: "Council",
    icon: "office-building-outline",
    description: "Council account and department details",
  },
  {
    label: "Notifications",
    icon: "bell-outline",
    description: "Email, push and reminder preferences",
  },
  {
    label: "Security",
    icon: "shield-lock-outline",
    description: "Password and account security",
  },
  {
    label: "Appearance",
    icon: "palette-outline",
    description: "Display and accessibility preferences",
  },
];

export default function CouncilSettingsScreen() {
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1050;
  const isTablet = width >= 720;

  const [activeSection, setActiveSection] =
    useState<SettingsSection>("Profile");

  const [mobileMenuVisible, setMobileMenuVisible] =
    useState(false);

  const [profileMenuVisible, setProfileMenuVisible] =
    useState(false);

  const [snackbarVisible, setSnackbarVisible] =
    useState(false);

  const [snackbarMessage, setSnackbarMessage] =
    useState("");

  const [firstName, setFirstName] =
    useState("Alex");

  const [lastName, setLastName] =
    useState("Morgan");

  const [email, setEmail] = useState(
    "alex.morgan@leeds.gov.uk"
  );

  const [phone, setPhone] =
    useState("0113 555 0184");

  const [jobTitle, setJobTitle] =
    useState("Housing Inspector");

  const [employeeId, setEmployeeId] =
    useState("LCC-HS-2048");

  const [councilName, setCouncilName] =
    useState("Leeds City Council");

  const [department, setDepartment] =
    useState("Housing Standards");

  const [officeAddress, setOfficeAddress] =
    useState(
      "Merrion House, 110 Merrion Way, Leeds LS2 8BB"
    );

  const [managerName, setManagerName] =
    useState("Sophie Turner");

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [twoFactorEnabled, setTwoFactorEnabled] =
    useState(true);

  const [biometricEnabled, setBiometricEnabled] =
    useState(false);

  const [compactMode, setCompactMode] =
    useState(false);

  const [largeText, setLargeText] =
    useState(false);

  const [reduceMotion, setReduceMotion] =
    useState(false);

  const [darkMode, setDarkMode] =
    useState(false);

  const [notifications, setNotifications] =
    useState<NotificationSettings>({
      inspectionReminders: true,
      reportUpdates: true,
      newMessages: true,
      urgentCases: true,
      emailNotifications: true,
      pushNotifications: true,
      weeklySummary: false,
    });

  const navigateTo = (route: string) => {
    setMobileMenuVisible(false);
    router.push(route as never);
  };

  const showMessage = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleLogout = () => {
    setProfileMenuVisible(false);

    router.replace(
      "/auth/council/login" as never
    );
  };

  const updateNotification = (
    key: keyof NotificationSettings
  ) => {
    setNotifications((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const handleSaveProfile = () => {
    if (!firstName.trim() || !lastName.trim()) {
      showMessage(
        "Please enter your first and last name."
      );
      return;
    }

    if (!email.trim().includes("@")) {
      showMessage(
        "Please enter a valid email address."
      );
      return;
    }

    showMessage(
      "Profile information saved successfully."
    );
  };

  const handleSaveCouncil = () => {
    if (!councilName.trim() || !department.trim()) {
      showMessage(
        "Council name and department are required."
      );
      return;
    }

    showMessage(
      "Council information saved successfully."
    );
  };

  const handleSaveNotifications = () => {
    showMessage(
      "Notification preferences saved successfully."
    );
  };

  const handleChangePassword = () => {
    if (!currentPassword) {
      showMessage(
        "Please enter your current password."
      );
      return;
    }

    if (newPassword.length < 8) {
      showMessage(
        "The new password must contain at least 8 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage(
        "The new passwords do not match."
      );
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    showMessage(
      "Your password has been changed successfully."
    );
  };

  const handleSaveAppearance = () => {
    showMessage(
      "Appearance preferences saved successfully."
    );
  };

  return (
    <ScreenContainer
      scrollable
      contentStyle={styles.screenContent}
    >
      <View style={styles.page}>
        {!isDesktop ? (
          <Animated.View
            entering={FadeInUp.duration(400)}
            style={styles.mobileHeader}
          >
            <Pressable
              style={styles.mobileBrand}
              onPress={() =>
                router.replace(
                  "/council/dashboard" as never
                )
              }
            >
              <View style={styles.mobileBrandLogo}>
                <MaterialCommunityIcons
                  name="home-city-outline"
                  size={24}
                  color={colors.white}
                />
              </View>

              <View>
                <Text style={styles.mobileBrandName}>
                  TENUREEX
                </Text>

                <Text
                  style={styles.mobileBrandSubtitle}
                >
                  Council Portal
                </Text>
              </View>
            </Pressable>

            <IconButton
              icon={
                mobileMenuVisible
                  ? "close"
                  : "menu"
              }
              size={25}
              iconColor={colors.primary}
              onPress={() =>
                setMobileMenuVisible(
                  !mobileMenuVisible
                )
              }
            />
          </Animated.View>
        ) : null}

        {!isDesktop && mobileMenuVisible ? (
          <Animated.View
            entering={FadeInDown.duration(250)}
            style={styles.mobileNavigation}
          >
            {navigationItems.map((item) => {
              const active =
                item.route ===
                "/council/settings";

              return (
                <Pressable
                  key={item.label}
                  onPress={() =>
                    navigateTo(item.route)
                  }
                  style={({ pressed }) => [
                    styles.mobileNavigationItem,
                    active &&
                      styles.activeMobileNavigationItem,
                    pressed &&
                      styles.pressedNavigationItem,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={21}
                    color={
                      active
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />

                  <Text
                    style={[
                      styles.mobileNavigationLabel,
                      active &&
                        styles.activeMobileNavigationLabel,
                    ]}
                  >
                    {item.label}
                  </Text>

                  {item.badge ? (
                    <View
                      style={styles.navigationBadge}
                    >
                      <Text
                        style={
                          styles.navigationBadgeText
                        }
                      >
                        {item.badge}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}

            <Divider
              style={styles.mobileDivider}
            />

            <Pressable
              style={styles.mobileLogoutButton}
              onPress={handleLogout}
            >
              <MaterialCommunityIcons
                name="logout"
                size={21}
                color="#B42318"
              />

              <Text
                style={styles.mobileLogoutText}
              >
                Sign out
              </Text>
            </Pressable>
          </Animated.View>
        ) : null}

        <View
          style={[
            styles.layout,
            isDesktop && styles.desktopLayout,
          ]}
        >
          {isDesktop ? (
            <Animated.View
              entering={FadeInLeft.duration(450)}
              style={styles.sidebar}
            >
              <Pressable
                style={styles.brandRow}
                onPress={() =>
                  router.replace(
                    "/council/dashboard" as never
                  )
                }
              >
                <View style={styles.brandLogo}>
                  <MaterialCommunityIcons
                    name="home-city-outline"
                    size={29}
                    color={colors.white}
                  />
                </View>

                <View>
                  <Text style={styles.brandName}>
                    TENUREEX
                  </Text>

                  <Text
                    style={styles.brandSubtitle}
                  >
                    Council & Inspection Portal
                  </Text>
                </View>
              </Pressable>

              <View style={styles.profileCard}>
                <Avatar.Text
                  size={48}
                  label="AM"
                  labelStyle={styles.avatarLabel}
                  style={styles.avatar}
                />

                <View
                  style={styles.profileInformation}
                >
                  <Text style={styles.profileName}>
                    Alex Morgan
                  </Text>

                  <Text style={styles.profileRole}>
                    Housing Inspector
                  </Text>

                  <View style={styles.verifiedRow}>
                    <MaterialCommunityIcons
                      name="check-decagram"
                      size={14}
                      color="#277A46"
                    />

                    <Text
                      style={styles.verifiedText}
                    >
                      Verified council account
                    </Text>
                  </View>
                </View>
              </View>

              <Text
                style={styles.navigationTitle}
              >
                MAIN MENU
              </Text>

              <View style={styles.navigation}>
                {navigationItems.map((item) => {
                  const active =
                    item.route ===
                    "/council/settings";

                  return (
                    <Pressable
                      key={item.label}
                      onPress={() =>
                        navigateTo(item.route)
                      }
                      style={({ pressed }) => [
                        styles.navigationItem,
                        active &&
                          styles.activeNavigationItem,
                        pressed &&
                          styles.pressedNavigationItem,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={item.icon}
                        size={21}
                        color={
                          active
                            ? colors.primary
                            : colors.textSecondary
                        }
                      />

                      <Text
                        style={[
                          styles.navigationLabel,
                          active &&
                            styles.activeNavigationLabel,
                        ]}
                      >
                        {item.label}
                      </Text>

                      {item.badge ? (
                        <View
                          style={
                            styles.navigationBadge
                          }
                        >
                          <Text
                            style={
                              styles.navigationBadgeText
                            }
                          >
                            {item.badge}
                          </Text>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>

              <View
                style={styles.sidebarFooter}
              >
                <View
                  style={
                    styles.councilInformation
                  }
                >
                  <View
                    style={styles.councilIcon}
                  >
                    <MaterialCommunityIcons
                      name="office-building-outline"
                      size={22}
                      color={colors.primary}
                    />
                  </View>

                  <View
                    style={
                      styles.councilInformationText
                    }
                  >
                    <Text
                      style={styles.councilName}
                    >
                      Leeds City Council
                    </Text>

                    <Text
                      style={
                        styles.councilDepartment
                      }
                    >
                      Housing Standards
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={handleLogout}
                  style={({ pressed }) => [
                    styles.logoutButton,
                    pressed &&
                      styles.pressedNavigationItem,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="logout"
                    size={20}
                    color="#B42318"
                  />

                  <Text
                    style={styles.logoutText}
                  >
                    Sign out
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          ) : null}

          <View style={styles.mainContent}>
            <Animated.View
              entering={FadeInRight.duration(450)}
              style={styles.topBar}
            >
              <View style={styles.headingSection}>
                <View
                  style={styles.breadcrumbRow}
                >
                  <Pressable
                    onPress={() =>
                      navigateTo(
                        "/council/dashboard"
                      )
                    }
                  >
                    <Text
                      style={
                        styles.breadcrumbLink
                      }
                    >
                      Dashboard
                    </Text>
                  </Pressable>

                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={15}
                    color={colors.textMuted}
                  />

                  <Text
                    style={
                      styles.breadcrumbCurrent
                    }
                  >
                    Settings
                  </Text>
                </View>

                <Text style={styles.pageTitle}>
                  Settings
                </Text>

                <Text
                  style={styles.pageDescription}
                >
                  Manage your council account,
                  security, notifications and
                  accessibility preferences.
                </Text>
              </View>

              {isDesktop ? (
                <Menu
                  visible={profileMenuVisible}
                  onDismiss={() =>
                    setProfileMenuVisible(false)
                  }
                  anchor={
                    <Pressable
                      style={styles.headerProfile}
                      onPress={() =>
                        setProfileMenuVisible(true)
                      }
                    >
                      <Avatar.Text
                        size={38}
                        label="AM"
                        labelStyle={
                          styles.smallAvatarLabel
                        }
                        style={
                          styles.smallAvatar
                        }
                      />

                      <View>
                        <Text
                          style={
                            styles.headerProfileName
                          }
                        >
                          Alex Morgan
                        </Text>

                        <Text
                          style={
                            styles.headerProfileRole
                          }
                        >
                          Housing Inspector
                        </Text>
                      </View>

                      <MaterialCommunityIcons
                        name="chevron-down"
                        size={18}
                        color={colors.textMuted}
                      />
                    </Pressable>
                  }
                >
                  <Menu.Item
                    leadingIcon="view-dashboard-outline"
                    title="Dashboard"
                    onPress={() => {
                      setProfileMenuVisible(false);
                      navigateTo(
                        "/council/dashboard"
                      );
                    }}
                  />

                  <Divider />

                  <Menu.Item
                    leadingIcon="logout"
                    title="Sign out"
                    onPress={handleLogout}
                  />
                </Menu>
              ) : null}
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(
                100
              ).duration(430)}
              style={[
                styles.settingsLayout,
                !isDesktop &&
                  styles.mobileSettingsLayout,
              ]}
            >
              <View
                style={[
                  styles.settingsNavigation,
                  !isDesktop &&
                    styles.mobileSettingsNavigation,
                ]}
              >
                <View
                  style={styles.settingsMenuHeader}
                >
                  <Text
                    style={styles.settingsMenuTitle}
                  >
                    Account settings
                  </Text>

                  <Text
                    style={
                      styles.settingsMenuDescription
                    }
                  >
                    Select a section to manage your
                    account.
                  </Text>
                </View>

                <View
                  style={[
                    styles.settingsSectionList,
                    !isDesktop &&
                      styles.mobileSectionList,
                  ]}
                >
                  {settingsSections.map(
                    (section) => {
                      const active =
                        activeSection ===
                        section.label;

                      return (
                        <Pressable
                          key={section.label}
                          onPress={() =>
                            setActiveSection(
                              section.label
                            )
                          }
                          style={({ pressed }) => [
                            styles.settingsSectionButton,
                            !isDesktop &&
                              styles.mobileSettingsSectionButton,
                            active &&
                              styles.activeSettingsSectionButton,
                            pressed &&
                              styles.pressedNavigationItem,
                          ]}
                        >
                          <View
                            style={[
                              styles.settingsSectionIcon,
                              active &&
                                styles.activeSettingsSectionIcon,
                            ]}
                          >
                            <MaterialCommunityIcons
                              name={section.icon}
                              size={21}
                              color={
                                active
                                  ? colors.primary
                                  : colors.textSecondary
                              }
                            />
                          </View>

                          <View
                            style={
                              styles.settingsSectionText
                            }
                          >
                            <Text
                              style={[
                                styles.settingsSectionLabel,
                                active &&
                                  styles.activeSettingsSectionLabel,
                              ]}
                            >
                              {section.label}
                            </Text>

                            {isDesktop ? (
                              <Text
                                style={
                                  styles.settingsSectionDescription
                                }
                              >
                                {
                                  section.description
                                }
                              </Text>
                            ) : null}
                          </View>

                          {isDesktop ? (
                            <MaterialCommunityIcons
                              name="chevron-right"
                              size={18}
                              color={
                                active
                                  ? colors.primary
                                  : colors.textMuted
                              }
                            />
                          ) : null}
                        </Pressable>
                      );
                    }
                  )}
                </View>

                {isDesktop ? (
                  <View
                    style={styles.supportCard}
                  >
                    <View
                      style={styles.supportIcon}
                    >
                      <MaterialCommunityIcons
                        name="lifebuoy"
                        size={25}
                        color={colors.primary}
                      />
                    </View>

                    <Text
                      style={styles.supportTitle}
                    >
                      Need help?
                    </Text>

                    <Text
                      style={
                        styles.supportDescription
                      }
                    >
                      Contact the TenureEx council
                      support team.
                    </Text>

                    <Button
                      mode="outlined"
                      icon="message-question-outline"
                      textColor={colors.primary}
                      style={styles.supportButton}
                      onPress={() =>
                        showMessage(
                          "Support request opened."
                        )
                      }
                    >
                      Contact support
                    </Button>
                  </View>
                ) : null}
              </View>

              <View style={styles.settingsContent}>
                {activeSection === "Profile" ? (
                  <ProfileSettings
                    firstName={firstName}
                    lastName={lastName}
                    email={email}
                    phone={phone}
                    jobTitle={jobTitle}
                    employeeId={employeeId}
                    setFirstName={setFirstName}
                    setLastName={setLastName}
                    setEmail={setEmail}
                    setPhone={setPhone}
                    setJobTitle={setJobTitle}
                    setEmployeeId={setEmployeeId}
                    onSave={handleSaveProfile}
                    isTablet={isTablet}
                    showMessage={showMessage}
                  />
                ) : null}

                {activeSection === "Council" ? (
                  <CouncilSettings
                    councilName={councilName}
                    department={department}
                    officeAddress={officeAddress}
                    managerName={managerName}
                    setCouncilName={
                      setCouncilName
                    }
                    setDepartment={setDepartment}
                    setOfficeAddress={
                      setOfficeAddress
                    }
                    setManagerName={setManagerName}
                    onSave={handleSaveCouncil}
                    isTablet={isTablet}
                  />
                ) : null}

                {activeSection ===
                "Notifications" ? (
                  <NotificationSettingsPanel
                    notifications={notifications}
                    updateNotification={
                      updateNotification
                    }
                    onSave={
                      handleSaveNotifications
                    }
                  />
                ) : null}

                {activeSection === "Security" ? (
                  <SecuritySettings
                    currentPassword={
                      currentPassword
                    }
                    newPassword={newPassword}
                    confirmPassword={
                      confirmPassword
                    }
                    showCurrentPassword={
                      showCurrentPassword
                    }
                    showNewPassword={
                      showNewPassword
                    }
                    showConfirmPassword={
                      showConfirmPassword
                    }
                    twoFactorEnabled={
                      twoFactorEnabled
                    }
                    biometricEnabled={
                      biometricEnabled
                    }
                    setCurrentPassword={
                      setCurrentPassword
                    }
                    setNewPassword={
                      setNewPassword
                    }
                    setConfirmPassword={
                      setConfirmPassword
                    }
                    setShowCurrentPassword={
                      setShowCurrentPassword
                    }
                    setShowNewPassword={
                      setShowNewPassword
                    }
                    setShowConfirmPassword={
                      setShowConfirmPassword
                    }
                    setTwoFactorEnabled={
                      setTwoFactorEnabled
                    }
                    setBiometricEnabled={
                      setBiometricEnabled
                    }
                    onChangePassword={
                      handleChangePassword
                    }
                    showMessage={showMessage}
                  />
                ) : null}

                {activeSection ===
                "Appearance" ? (
                  <AppearanceSettings
                    compactMode={compactMode}
                    largeText={largeText}
                    reduceMotion={reduceMotion}
                    darkMode={darkMode}
                    setCompactMode={setCompactMode}
                    setLargeText={setLargeText}
                    setReduceMotion={
                      setReduceMotion
                    }
                    setDarkMode={setDarkMode}
                    onSave={handleSaveAppearance}
                  />
                ) : null}
              </View>
            </Animated.View>
          </View>
        </View>

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() =>
            setSnackbarVisible(false)
          }
          duration={3000}
          action={{
            label: "Close",
            onPress: () =>
              setSnackbarVisible(false),
          }}
        >
          {snackbarMessage}
        </Snackbar>
      </View>
    </ScreenContainer>
  );
}

type ProfileSettingsProps = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  employeeId: string;
  setFirstName: (value: string) => void;
  setLastName: (value: string) => void;
  setEmail: (value: string) => void;
  setPhone: (value: string) => void;
  setJobTitle: (value: string) => void;
  setEmployeeId: (value: string) => void;
  onSave: () => void;
  isTablet: boolean;
  showMessage: (message: string) => void;
};

function ProfileSettings({
  firstName,
  lastName,
  email,
  phone,
  jobTitle,
  employeeId,
  setFirstName,
  setLastName,
  setEmail,
  setPhone,
  setJobTitle,
  setEmployeeId,
  onSave,
  isTablet,
  showMessage,
}: ProfileSettingsProps) {
  return (
    <Animated.View
      entering={FadeInRight.duration(350)}
    >
      <SettingsHeader
        icon="account-outline"
        title="Profile information"
        description="Update your personal information and council contact details."
      />

      <View style={styles.profilePhotoCard}>
        <Avatar.Text
          size={82}
          label="AM"
          labelStyle={
            styles.largeProfileAvatarLabel
          }
          style={styles.largeProfileAvatar}
        />

        <View
          style={styles.profilePhotoInformation}
        >
          <Text
            style={styles.profilePhotoTitle}
          >
            Profile photograph
          </Text>

          <Text
            style={
              styles.profilePhotoDescription
            }
          >
            Upload a clear photograph for your
            council account. JPG or PNG, maximum
            size 5 MB.
          </Text>

          <View
            style={styles.profilePhotoActions}
          >
            <Button
              mode="outlined"
              icon="camera-outline"
              textColor={colors.primary}
              onPress={() =>
                showMessage(
                  "Profile image picker opened."
                )
              }
            >
              Change photo
            </Button>

            <Button
              mode="text"
              textColor="#B42318"
              onPress={() =>
                showMessage(
                  "Profile photograph removed."
                )
              }
            >
              Remove
            </Button>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.formGrid,
          !isTablet && styles.mobileFormGrid,
        ]}
      >
        <SettingsInput
          label="First name"
          value={firstName}
          onChangeText={setFirstName}
          icon="account-outline"
        />

        <SettingsInput
          label="Last name"
          value={lastName}
          onChangeText={setLastName}
          icon="account-outline"
        />

        <SettingsInput
          label="Council email"
          value={email}
          onChangeText={setEmail}
          icon="email-outline"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <SettingsInput
          label="Telephone number"
          value={phone}
          onChangeText={setPhone}
          icon="phone-outline"
          keyboardType="phone-pad"
        />

        <SettingsInput
          label="Job title"
          value={jobTitle}
          onChangeText={setJobTitle}
          icon="briefcase-outline"
        />

        <SettingsInput
          label="Employee ID"
          value={employeeId}
          onChangeText={setEmployeeId}
          icon="card-account-details-outline"
        />
      </View>

      <SettingsActions onSave={onSave} />
    </Animated.View>
  );
}

type CouncilSettingsProps = {
  councilName: string;
  department: string;
  officeAddress: string;
  managerName: string;
  setCouncilName: (value: string) => void;
  setDepartment: (value: string) => void;
  setOfficeAddress: (value: string) => void;
  setManagerName: (value: string) => void;
  onSave: () => void;
  isTablet: boolean;
};

function CouncilSettings({
  councilName,
  department,
  officeAddress,
  managerName,
  setCouncilName,
  setDepartment,
  setOfficeAddress,
  setManagerName,
  onSave,
  isTablet,
}: CouncilSettingsProps) {
  return (
    <Animated.View
      entering={FadeInRight.duration(350)}
    >
      <SettingsHeader
        icon="office-building-outline"
        title="Council information"
        description="Review the council organisation connected to your account."
      />

      <View style={styles.verifiedCouncilCard}>
        <View
          style={styles.verifiedCouncilIcon}
        >
          <MaterialCommunityIcons
            name="check-decagram"
            size={28}
            color="#277A46"
          />
        </View>

        <View
          style={styles.verifiedCouncilText}
        >
          <Text
            style={styles.verifiedCouncilTitle}
          >
            Verified council organisation
          </Text>

          <Text
            style={
              styles.verifiedCouncilDescription
            }
          >
            This account is connected to Leeds City
            Council and has been approved by a
            council administrator.
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.formGrid,
          !isTablet && styles.mobileFormGrid,
        ]}
      >
        <SettingsInput
          label="Council name"
          value={councilName}
          onChangeText={setCouncilName}
          icon="office-building-outline"
        />

        <SettingsInput
          label="Department"
          value={department}
          onChangeText={setDepartment}
          icon="domain"
        />

        <SettingsInput
          label="Line manager"
          value={managerName}
          onChangeText={setManagerName}
          icon="account-supervisor-outline"
        />

        <SettingsInput
          label="Council reference"
          value="LCC-HOUSING-STANDARDS"
          onChangeText={() => undefined}
          icon="identifier"
          editable={false}
        />
      </View>

      <TextInput
        mode="outlined"
        label="Office address"
        value={officeAddress}
        onChangeText={setOfficeAddress}
        multiline
        numberOfLines={4}
        left={
          <TextInput.Icon icon="map-marker-outline" />
        }
        outlineColor={colors.border}
        activeOutlineColor={colors.primary}
        style={styles.fullWidthInput}
      />

      <SettingsActions onSave={onSave} />
    </Animated.View>
  );
}

type NotificationSettingsPanelProps = {
  notifications: NotificationSettings;
  updateNotification: (
    key: keyof NotificationSettings
  ) => void;
  onSave: () => void;
};

function NotificationSettingsPanel({
  notifications,
  updateNotification,
  onSave,
}: NotificationSettingsPanelProps) {
  return (
    <Animated.View
      entering={FadeInRight.duration(350)}
    >
      <SettingsHeader
        icon="bell-outline"
        title="Notification preferences"
        description="Choose how and when TenureEx should notify you."
      />

      <SettingsGroup
        title="Case notifications"
        description="Notifications connected to your inspections, messages and reports."
      >
        <ToggleSetting
          icon="calendar-clock-outline"
          title="Inspection reminders"
          description="Receive reminders before scheduled property inspections."
          value={
            notifications.inspectionReminders
          }
          onValueChange={() =>
            updateNotification(
              "inspectionReminders"
            )
          }
        />

        <ToggleSetting
          icon="file-document-edit-outline"
          title="Report updates"
          description="Receive notifications when reports are reviewed, approved or returned."
          value={notifications.reportUpdates}
          onValueChange={() =>
            updateNotification("reportUpdates")
          }
        />

        <ToggleSetting
          icon="message-text-outline"
          title="New messages"
          description="Receive alerts for new tenant, landlord and council messages."
          value={notifications.newMessages}
          onValueChange={() =>
            updateNotification("newMessages")
          }
        />

        <ToggleSetting
          icon="alert-octagon-outline"
          title="Urgent cases"
          description="Immediately alert me about high-priority or urgent housing cases."
          value={notifications.urgentCases}
          onValueChange={() =>
            updateNotification("urgentCases")
          }
          showDivider={false}
        />
      </SettingsGroup>

      <SettingsGroup
        title="Delivery methods"
        description="Select where you want to receive notifications."
      >
        <ToggleSetting
          icon="email-outline"
          title="Email notifications"
          description="Send notifications to your registered council email address."
          value={
            notifications.emailNotifications
          }
          onValueChange={() =>
            updateNotification(
              "emailNotifications"
            )
          }
        />

        <ToggleSetting
          icon="cellphone-message"
          title="Push notifications"
          description="Display notifications on your mobile device."
          value={
            notifications.pushNotifications
          }
          onValueChange={() =>
            updateNotification(
              "pushNotifications"
            )
          }
        />

        <ToggleSetting
          icon="calendar-week-outline"
          title="Weekly activity summary"
          description="Receive a weekly summary of inspections, reports and outstanding work."
          value={notifications.weeklySummary}
          onValueChange={() =>
            updateNotification("weeklySummary")
          }
          showDivider={false}
        />
      </SettingsGroup>

      <SettingsActions onSave={onSave} />
    </Animated.View>
  );
}

type SecuritySettingsProps = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  showCurrentPassword: boolean;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  twoFactorEnabled: boolean;
  biometricEnabled: boolean;
  setCurrentPassword: (value: string) => void;
  setNewPassword: (value: string) => void;
  setConfirmPassword: (value: string) => void;
  setShowCurrentPassword: (
    value: boolean
  ) => void;
  setShowNewPassword: (
    value: boolean
  ) => void;
  setShowConfirmPassword: (
    value: boolean
  ) => void;
  setTwoFactorEnabled: (
    value: boolean
  ) => void;
  setBiometricEnabled: (
    value: boolean
  ) => void;
  onChangePassword: () => void;
  showMessage: (message: string) => void;
};

function SecuritySettings({
  currentPassword,
  newPassword,
  confirmPassword,
  showCurrentPassword,
  showNewPassword,
  showConfirmPassword,
  twoFactorEnabled,
  biometricEnabled,
  setCurrentPassword,
  setNewPassword,
  setConfirmPassword,
  setShowCurrentPassword,
  setShowNewPassword,
  setShowConfirmPassword,
  setTwoFactorEnabled,
  setBiometricEnabled,
  onChangePassword,
  showMessage,
}: SecuritySettingsProps) {
  return (
    <Animated.View
      entering={FadeInRight.duration(350)}
    >
      <SettingsHeader
        icon="shield-lock-outline"
        title="Security settings"
        description="Protect your council account and manage secure sign-in options."
      />

      <View style={styles.securityStatusCard}>
        <View
          style={styles.securityStatusIcon}
        >
          <MaterialCommunityIcons
            name="shield-check-outline"
            size={28}
            color="#277A46"
          />
        </View>

        <View
          style={styles.securityStatusText}
        >
          <Text
            style={styles.securityStatusTitle}
          >
            Your account is protected
          </Text>

          <Text
            style={
              styles.securityStatusDescription
            }
          >
            Two-factor authentication is active and
            your account has no recent security
            warnings.
          </Text>
        </View>
      </View>

      <SettingsGroup
        title="Change password"
        description="Use a strong password that you do not use for another account."
      >
        <TextInput
          mode="outlined"
          label="Current password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry={
            !showCurrentPassword
          }
          left={
            <TextInput.Icon icon="lock-outline" />
          }
          right={
            <TextInput.Icon
              icon={
                showCurrentPassword
                  ? "eye-off-outline"
                  : "eye-outline"
              }
              onPress={() =>
                setShowCurrentPassword(
                  !showCurrentPassword
                )
              }
            />
          }
          outlineColor={colors.border}
          activeOutlineColor={colors.primary}
          style={styles.securityInput}
        />

        <TextInput
          mode="outlined"
          label="New password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry={!showNewPassword}
          left={
            <TextInput.Icon icon="lock-plus-outline" />
          }
          right={
            <TextInput.Icon
              icon={
                showNewPassword
                  ? "eye-off-outline"
                  : "eye-outline"
              }
              onPress={() =>
                setShowNewPassword(
                  !showNewPassword
                )
              }
            />
          }
          outlineColor={colors.border}
          activeOutlineColor={colors.primary}
          style={styles.securityInput}
        />

        <TextInput
          mode="outlined"
          label="Confirm new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={
            !showConfirmPassword
          }
          left={
            <TextInput.Icon icon="lock-check-outline" />
          }
          right={
            <TextInput.Icon
              icon={
                showConfirmPassword
                  ? "eye-off-outline"
                  : "eye-outline"
              }
              onPress={() =>
                setShowConfirmPassword(
                  !showConfirmPassword
                )
              }
            />
          }
          outlineColor={colors.border}
          activeOutlineColor={colors.primary}
          style={styles.securityInput}
        />

        <View
          style={styles.passwordRequirements}
        >
          <Text
            style={
              styles.passwordRequirementsTitle
            }
          >
            Password requirements
          </Text>

          <PasswordRequirement
            label="At least 8 characters"
            met={newPassword.length >= 8}
          />

          <PasswordRequirement
            label="Contains an uppercase letter"
            met={/[A-Z]/.test(newPassword)}
          />

          <PasswordRequirement
            label="Contains a number"
            met={/\d/.test(newPassword)}
          />

          <PasswordRequirement
            label="Passwords match"
            met={
              Boolean(confirmPassword) &&
              newPassword === confirmPassword
            }
          />
        </View>

        <Button
          mode="contained"
          icon="lock-reset"
          buttonColor={colors.primary}
          contentStyle={
            styles.primaryButtonContent
          }
          style={styles.changePasswordButton}
          onPress={onChangePassword}
        >
          Change password
        </Button>
      </SettingsGroup>

      <SettingsGroup
        title="Additional security"
        description="Add another level of protection to your account."
      >
        <ToggleSetting
          icon="two-factor-authentication"
          title="Two-factor authentication"
          description="Require a verification code when signing in from a new device."
          value={twoFactorEnabled}
          onValueChange={() =>
            setTwoFactorEnabled(
              !twoFactorEnabled
            )
          }
        />

        <ToggleSetting
          icon="fingerprint"
          title="Biometric sign-in"
          description="Use Face ID, Touch ID or fingerprint recognition on supported devices."
          value={biometricEnabled}
          onValueChange={() =>
            setBiometricEnabled(
              !biometricEnabled
            )
          }
          showDivider={false}
        />
      </SettingsGroup>

      <SettingsGroup
        title="Active sessions"
        description="Review devices currently signed in to your council account."
      >
        <View style={styles.sessionItem}>
          <View style={styles.sessionIcon}>
            <MaterialCommunityIcons
              name="laptop"
              size={24}
              color={colors.primary}
            />
          </View>

          <View style={styles.sessionInformation}>
            <Text style={styles.sessionTitle}>
              Chrome on macOS
            </Text>

            <Text
              style={styles.sessionDescription}
            >
              Current session · Leeds, United
              Kingdom
            </Text>
          </View>

          <View
            style={styles.currentSessionBadge}
          >
            <Text
              style={
                styles.currentSessionBadgeText
              }
            >
              Current
            </Text>
          </View>
        </View>

        <Divider style={styles.settingDivider} />

        <View style={styles.sessionItem}>
          <View style={styles.sessionIcon}>
            <MaterialCommunityIcons
              name="cellphone"
              size={24}
              color={colors.primary}
            />
          </View>

          <View style={styles.sessionInformation}>
            <Text style={styles.sessionTitle}>
              TenureEx on iPhone
            </Text>

            <Text
              style={styles.sessionDescription}
            >
              Last active yesterday · Leeds,
              United Kingdom
            </Text>
          </View>

          <Button
            mode="text"
            textColor="#B42318"
            onPress={() =>
              showMessage(
                "The selected device has been signed out."
              )
            }
          >
            Sign out
          </Button>
        </View>
      </SettingsGroup>
    </Animated.View>
  );
}

type AppearanceSettingsProps = {
  compactMode: boolean;
  largeText: boolean;
  reduceMotion: boolean;
  darkMode: boolean;
  setCompactMode: (value: boolean) => void;
  setLargeText: (value: boolean) => void;
  setReduceMotion: (value: boolean) => void;
  setDarkMode: (value: boolean) => void;
  onSave: () => void;
};

function AppearanceSettings({
  compactMode,
  largeText,
  reduceMotion,
  darkMode,
  setCompactMode,
  setLargeText,
  setReduceMotion,
  setDarkMode,
  onSave,
}: AppearanceSettingsProps) {
  return (
    <Animated.View
      entering={FadeInRight.duration(350)}
    >
      <SettingsHeader
        icon="palette-outline"
        title="Appearance and accessibility"
        description="Adjust the application display to suit your preferences."
      />

      <SettingsGroup
        title="Display"
        description="Control how information is displayed across the council portal."
      >
        <ToggleSetting
          icon="theme-light-dark"
          title="Dark mode"
          description="Use a darker colour scheme in the TenureEx council portal."
          value={darkMode}
          onValueChange={() =>
            setDarkMode(!darkMode)
          }
        />

        <ToggleSetting
          icon="view-compact-outline"
          title="Compact layout"
          description="Display more inspections and reports on the screen at the same time."
          value={compactMode}
          onValueChange={() =>
            setCompactMode(!compactMode)
          }
          showDivider={false}
        />
      </SettingsGroup>

      <SettingsGroup
        title="Accessibility"
        description="Change text and animation options for improved accessibility."
      >
        <ToggleSetting
          icon="format-size"
          title="Larger text"
          description="Increase text size throughout the application."
          value={largeText}
          onValueChange={() =>
            setLargeText(!largeText)
          }
        />

        <ToggleSetting
          icon="motion-pause-outline"
          title="Reduce motion"
          description="Reduce transitions and animated movement within the application."
          value={reduceMotion}
          onValueChange={() =>
            setReduceMotion(!reduceMotion)
          }
          showDivider={false}
        />
      </SettingsGroup>

      <View style={styles.previewCard}>
        <Text style={styles.previewTitle}>
          Interface preview
        </Text>

        <Text
          style={styles.previewDescription}
        >
          This preview demonstrates your selected
          display preferences.
        </Text>

        <View
          style={[
            styles.previewWindow,
            darkMode &&
              styles.darkPreviewWindow,
          ]}
        >
          <View
            style={[
              styles.previewSidebar,
              darkMode &&
                styles.darkPreviewSidebar,
            ]}
          >
            <View
              style={styles.previewLogo}
            />

            <View
              style={styles.previewNavigationLine}
            />

            <View
              style={styles.previewNavigationLine}
            />

            <View
              style={styles.previewNavigationLine}
            />
          </View>

          <View
            style={styles.previewMainContent}
          >
            <View
              style={[
                styles.previewHeading,
                largeText &&
                  styles.largePreviewHeading,
                darkMode &&
                  styles.darkPreviewElement,
              ]}
            />

            <View
              style={[
                styles.previewCardRow,
                compactMode &&
                  styles.compactPreviewCardRow,
              ]}
            >
              <View
                style={[
                  styles.previewContentCard,
                  darkMode &&
                    styles.darkPreviewCard,
                ]}
              />

              <View
                style={[
                  styles.previewContentCard,
                  darkMode &&
                    styles.darkPreviewCard,
                ]}
              />

              <View
                style={[
                  styles.previewContentCard,
                  darkMode &&
                    styles.darkPreviewCard,
                ]}
              />
            </View>
          </View>
        </View>
      </View>

      <SettingsActions onSave={onSave} />
    </Animated.View>
  );
}

function SettingsHeader({
  icon,
  title,
  description,
}: {
  icon: IconName;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.settingsHeader}>
      <View style={styles.settingsHeaderIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={27}
          color={colors.primary}
        />
      </View>

      <View style={styles.settingsHeaderText}>
        <Text style={styles.settingsHeaderTitle}>
          {title}
        </Text>

        <Text
          style={
            styles.settingsHeaderDescription
          }
        >
          {description}
        </Text>
      </View>
    </View>
  );
}

function SettingsInput({
  label,
  value,
  onChangeText,
  icon,
  editable = true,
  keyboardType = "default",
  autoCapitalize = "sentences",
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  icon: IconName;
  editable?: boolean;
  keyboardType?:
    | "default"
    | "email-address"
    | "phone-pad";
  autoCapitalize?:
    | "none"
    | "sentences"
    | "words"
    | "characters";
}) {
  return (
    <TextInput
      mode="outlined"
      label={label}
      value={value}
      onChangeText={onChangeText}
      editable={editable}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      left={<TextInput.Icon icon={icon} />}
      outlineColor={colors.border}
      activeOutlineColor={colors.primary}
      style={[
        styles.formInput,
        !editable && styles.disabledInput,
      ]}
    />
  );
}

function SettingsGroup({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.settingsGroup}>
      <View style={styles.settingsGroupHeader}>
        <Text style={styles.settingsGroupTitle}>
          {title}
        </Text>

        <Text
          style={
            styles.settingsGroupDescription
          }
        >
          {description}
        </Text>
      </View>

      <View style={styles.settingsGroupContent}>
        {children}
      </View>
    </View>
  );
}

function ToggleSetting({
  icon,
  title,
  description,
  value,
  onValueChange,
  showDivider = true,
}: {
  icon: IconName;
  title: string;
  description: string;
  value: boolean;
  onValueChange: () => void;
  showDivider?: boolean;
}) {
  return (
    <>
      <View style={styles.toggleSetting}>
        <View style={styles.toggleSettingIcon}>
          <MaterialCommunityIcons
            name={icon}
            size={22}
            color={colors.primary}
          />
        </View>

        <View style={styles.toggleSettingText}>
          <Text
            style={styles.toggleSettingTitle}
          >
            {title}
          </Text>

          <Text
            style={
              styles.toggleSettingDescription
            }
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

      {showDivider ? (
        <Divider style={styles.settingDivider} />
      ) : null}
    </>
  );
}

function PasswordRequirement({
  label,
  met,
}: {
  label: string;
  met: boolean;
}) {
  return (
    <View style={styles.requirementRow}>
      <MaterialCommunityIcons
        name={
          met
            ? "check-circle"
            : "circle-outline"
        }
        size={16}
        color={
          met ? "#277A46" : colors.textMuted
        }
      />

      <Text
        style={[
          styles.requirementText,
          met && styles.completedRequirementText,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function SettingsActions({
  onSave,
}: {
  onSave: () => void;
}) {
  return (
    <View style={styles.settingsActions}>
      <Button
        mode="outlined"
        textColor={colors.primary}
        style={styles.cancelChangesButton}
        onPress={() => undefined}
      >
        Cancel
      </Button>

      <Button
        mode="contained"
        icon="content-save-outline"
        buttonColor={colors.primary}
        contentStyle={styles.primaryButtonContent}
        style={styles.saveChangesButton}
        onPress={onSave}
      >
        Save changes
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flexGrow: 1,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },

  page: {
    flex: 1,
    width: "100%",
    backgroundColor: colors.background,
  },

  mobileHeader: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },

  mobileBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  mobileBrandLogo: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.primary,
  },

  mobileBrandName: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.8,
  },

  mobileBrandSubtitle: {
    marginTop: 1,
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "700",
  },

  mobileNavigation: {
    margin: spacing.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    elevation: 3,
  },

  mobileNavigationItem: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },

  activeMobileNavigationItem: {
    backgroundColor: colors.primaryLight,
  },

  mobileNavigationLabel: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "800",
  },

  activeMobileNavigationLabel: {
    color: colors.primary,
    fontWeight: "900",
  },

  mobileDivider: {
    marginVertical: spacing.sm,
  },

  mobileLogoutButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },

  mobileLogoutText: {
    color: "#B42318",
    fontSize: 10,
    fontWeight: "900",
  },

  layout: {
    width: "100%",
    maxWidth: 1600,
    alignSelf: "center",
  },

  desktopLayout: {
    minHeight: 950,
    flexDirection: "row",
  },

  sidebar: {
    width: 280,
    minHeight: 950,
    padding: spacing.lg,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.surface,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },

  brandLogo: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: colors.primary,
  },

  brandName: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2.3,
  },

  brandSubtitle: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "700",
  },

  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },

  avatar: {
    backgroundColor: colors.primary,
  },

  avatarLabel: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "900",
  },

  profileInformation: {
    flex: 1,
  },

  profileName: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "900",
  },

  profileRole: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: "700",
  },

  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 5,
  },

  verifiedText: {
    color: "#277A46",
    fontSize: 7,
    fontWeight: "700",
  },

  navigationTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    color: colors.textMuted,
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  navigation: {
    gap: 5,
  },

  navigationItem: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },

  activeNavigationItem: {
    backgroundColor: colors.primaryLight,
  },

  pressedNavigationItem: {
    opacity: 0.68,
  },

  navigationLabel: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "800",
  },

  activeNavigationLabel: {
    color: colors.primary,
    fontWeight: "900",
  },

  navigationBadge: {
    minWidth: 23,
    height: 23,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },

  navigationBadgeText: {
    color: colors.white,
    fontSize: 7,
    fontWeight: "900",
  },

  sidebarFooter: {
    marginTop: "auto",
    paddingTop: spacing.xl,
  },

  councilInformation: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },

  councilIcon: {
    width: 39,
    height: 39,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
  },

  councilInformationText: {
    flex: 1,
  },

  councilName: {
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "900",
  },

  councilDepartment: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 7,
  },

  logoutButton: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },

  logoutText: {
    color: "#B42318",
    fontSize: 9,
    fontWeight: "900",
  },

  mainContent: {
    flex: 1,
    minWidth: 0,
    padding: spacing.lg,
  },

  topBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },

  headingSection: {
    flex: 1,
    minWidth: 240,
  },

  breadcrumbRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: spacing.sm,
  },

  breadcrumbLink: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: "800",
  },

  breadcrumbCurrent: {
    color: colors.textMuted,
    fontSize: 8,
  },

  pageTitle: {
    ...typography.headingLarge,
    color: colors.textPrimary,
  },

  pageDescription: {
    ...typography.bodyMedium,
    maxWidth: 650,
    marginTop: 5,
    color: colors.textSecondary,
  },

  headerProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    paddingRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },

  smallAvatar: {
    backgroundColor: colors.primary,
  },

  smallAvatarLabel: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "900",
  },

  headerProfileName: {
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "900",
  },

  headerProfileRole: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 7,
  },

  settingsLayout: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },

  mobileSettingsLayout: {
    flexDirection: "column",
  },

  settingsNavigation: {
    width: 290,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },

  mobileSettingsNavigation: {
    width: "100%",
  },

  settingsMenuHeader: {
    padding: spacing.sm,
    marginBottom: spacing.md,
  },

  settingsMenuTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "900",
  },

  settingsMenuDescription: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 8,
    lineHeight: 14,
  },

  settingsSectionList: {
    gap: 5,
  },

  mobileSectionList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  settingsSectionButton: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: radius.md,
  },

  mobileSettingsSectionButton: {
    flex: 1,
    minWidth: 130,
  },

  activeSettingsSectionButton: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },

  settingsSectionIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.background,
  },

  activeSettingsSectionIcon: {
    backgroundColor: colors.white,
  },

  settingsSectionText: {
    flex: 1,
    minWidth: 0,
  },

  settingsSectionLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: "800",
  },

  activeSettingsSectionLabel: {
    color: colors.primary,
    fontWeight: "900",
  },

  settingsSectionDescription: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 7,
    lineHeight: 12,
  },

  supportCard: {
    alignItems: "center",
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },

  supportIcon: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
  },

  supportTitle: {
    marginTop: spacing.sm,
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "900",
  },

  supportDescription: {
    marginTop: 5,
    color: colors.textSecondary,
    fontSize: 7,
    lineHeight: 13,
    textAlign: "center",
  },

  supportButton: {
    marginTop: spacing.md,
    borderColor: colors.primary,
  },

  settingsContent: {
    flex: 1,
    minWidth: 0,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },

  settingsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  settingsHeaderIcon: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
  },

  settingsHeaderText: {
    flex: 1,
  },

  settingsHeaderTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "900",
  },

  settingsHeaderDescription: {
    maxWidth: 650,
    marginTop: 5,
    color: colors.textSecondary,
    fontSize: 8,
    lineHeight: 15,
  },

  profilePhotoCard: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },

  largeProfileAvatar: {
    backgroundColor: colors.primary,
  },

  largeProfileAvatarLabel: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "900",
  },

  profilePhotoInformation: {
    flex: 1,
    minWidth: 220,
  },

  profilePhotoTitle: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "900",
  },

  profilePhotoDescription: {
    maxWidth: 570,
    marginTop: 5,
    color: colors.textSecondary,
    fontSize: 8,
    lineHeight: 15,
  },

  profilePhotoActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  formGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },

  mobileFormGrid: {
    flexDirection: "column",
  },

  formInput: {
    flex: 1,
    minWidth: 250,
    backgroundColor: colors.white,
  },

  disabledInput: {
    backgroundColor: colors.background,
  },

  fullWidthInput: {
    marginTop: spacing.md,
    backgroundColor: colors.white,
  },

  verifiedCouncilCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "#B8DFCA",
    borderRadius: radius.lg,
    backgroundColor: "#F1FBF5",
  },

  verifiedCouncilIcon: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: "#DDF3E6",
  },

  verifiedCouncilText: {
    flex: 1,
  },

  verifiedCouncilTitle: {
    color: "#277A46",
    fontSize: 11,
    fontWeight: "900",
  },

  verifiedCouncilDescription: {
    marginTop: 5,
    color: colors.textSecondary,
    fontSize: 8,
    lineHeight: 15,
  },

  settingsGroup: {
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.white,
  },

  settingsGroupHeader: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },

  settingsGroupTitle: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "900",
  },

  settingsGroupDescription: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 8,
    lineHeight: 14,
  },

  settingsGroupContent: {
    paddingHorizontal: spacing.lg,
  },

  toggleSetting: {
    minHeight: 84,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },

  toggleSettingIcon: {
    width: 43,
    height: 43,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
  },

  toggleSettingText: {
    flex: 1,
    minWidth: 0,
  },

  toggleSettingTitle: {
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "900",
  },

  toggleSettingDescription: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 7,
    lineHeight: 13,
  },

  settingDivider: {
    backgroundColor: colors.border,
  },

  securityStatusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "#B8DFCA",
    borderRadius: radius.lg,
    backgroundColor: "#F1FBF5",
  },

  securityStatusIcon: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: "#DDF3E6",
  },

  securityStatusText: {
    flex: 1,
  },

  securityStatusTitle: {
    color: "#277A46",
    fontSize: 11,
    fontWeight: "900",
  },

  securityStatusDescription: {
    marginTop: 5,
    color: colors.textSecondary,
    fontSize: 8,
    lineHeight: 15,
  },

  securityInput: {
    marginVertical: spacing.sm,
    backgroundColor: colors.white,
  },

  passwordRequirements: {
    gap: spacing.sm,
    marginVertical: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },

  passwordRequirementsTitle: {
    marginBottom: 2,
    color: colors.textPrimary,
    fontSize: 8,
    fontWeight: "900",
  },

  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  requirementText: {
    color: colors.textMuted,
    fontSize: 7,
  },

  completedRequirementText: {
    color: "#277A46",
    fontWeight: "800",
  },

  changePasswordButton: {
    alignSelf: "flex-start",
    marginBottom: spacing.lg,
    borderRadius: radius.md,
  },

  primaryButtonContent: {
    minHeight: 46,
    flexDirection: "row-reverse",
  },

  sessionItem: {
    minHeight: 80,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },

  sessionIcon: {
    width: 45,
    height: 45,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: colors.primaryLight,
  },

  sessionInformation: {
    flex: 1,
    minWidth: 0,
  },

  sessionTitle: {
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "900",
  },

  sessionDescription: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 7,
    lineHeight: 13,
  },

  currentSessionBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#E8F7EE",
  },

  currentSessionBadgeText: {
    color: "#277A46",
    fontSize: 7,
    fontWeight: "900",
  },

  previewCard: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },

  previewTitle: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "900",
  },

  previewDescription: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 8,
  },

  previewWindow: {
    height: 250,
    flexDirection: "row",
    marginTop: spacing.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: "#F7F8FC",
  },

  darkPreviewWindow: {
    borderColor: "#354052",
    backgroundColor: "#151B26",
  },

  previewSidebar: {
    width: "25%",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.white,
  },

  darkPreviewSidebar: {
    backgroundColor: "#202938",
  },

  previewLogo: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.primary,
  },

  previewNavigationLine: {
    width: "100%",
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primaryLight,
  },

  previewMainContent: {
    flex: 1,
    padding: spacing.lg,
  },

  previewHeading: {
    width: "45%",
    height: 17,
    borderRadius: 8,
    backgroundColor: "#C8CFDB",
  },

  largePreviewHeading: {
    height: 24,
  },

  darkPreviewElement: {
    backgroundColor: "#566274",
  },

  previewCardRow: {
    flex: 1,
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },

  compactPreviewCardRow: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  previewContentCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },

  darkPreviewCard: {
    borderColor: "#354052",
    backgroundColor: "#202938",
  },

  settingsActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  cancelChangesButton: {
    borderColor: colors.primary,
  },

  saveChangesButton: {
    borderRadius: radius.md,
  },
});