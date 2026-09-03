import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import {
  Avatar,
  Button,
  Divider,
  Menu,
  Snackbar,
  TextInput
} from "react-native-paper";

import InternationalPhoneInput from "@/src/components/InternationalPhoneInput";
import TenureExLogo from "../../src/components/Logo/TenureExLogo";
import {
  colors,
  radius,
  spacing
} from "../../src/theme";

type IconName =
  keyof typeof MaterialCommunityIcons.glyphMap;

type NavigationItem = {
  label: string;
  icon: IconName;
  route: Href;
};

type AgencyRole =
  | "Agency Administrator"
  | "Branch Manager"
  | "Property Manager"
  | "Lettings Agent"
  | "Maintenance Coordinator"
  | "Read-only User";

type UserStatus = "Active" | "Pending" | "Disabled";

type PermissionAccess = "none" | "read" | "write";

type PermissionKey =
  | "properties"
  | "landlords"
  | "applicants"
  | "tenants"
  | "maintenance"
  | "compliance"
  | "reports"
  | "users"
  | "settings";

type PermissionSettings = Record<
  PermissionKey,
  PermissionAccess
>;

type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  branch: string;
  role: AgencyRole;
  status: UserStatus;
  lastLogin: string;
  invitedDate: string;
  createdBy: string;
  permissions: PermissionSettings;
};

type FormErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  branch?: string;
  role?: string;
  permissions?: string;
};

const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    icon: "view-dashboard-outline",
    route: "/agent/dashboard" as Href,
  },
  {
    label: "Properties",
    icon: "office-building-outline",
    route: "/agent/properties" as Href,
  },
  {
    label: "Landlords",
    icon: "account-tie-outline",
    route: "/agent/landlords" as Href,
  },
  {
    label: "Applicants",
    icon: "account-search-outline",
    route: "/agent/applicants" as Href,
  },
  {
    label: "Tenants",
    icon: "account-group-outline",
    route: "/agent/tenants" as Href,
  },
  {
    label: "Maintenance",
    icon: "tools",
    route: "/agent/maintenance" as Href,
  },
  {
    label: "Contractors",
    icon: "hard-hat",
    route: "/agent/contractors" as Href,
  },
  {
    label: "Compliance",
    icon: "shield-check-outline",
    route: "/agent/compliance" as Href,
  },
  {
    label: "Reports",
    icon: "chart-box-outline",
    route: "/agent/reports" as Href,
  },
  {
    label: "Messages",
    icon: "message-text-outline",
    route: "/agent/messages" as Href,
  },
  {
    label: "Users",
    icon: "account-multiple-outline",
    route: "/agent/users" as Href,
  },
  {
    label: "Roles & Permissions",
    icon: "shield-account-outline",
    route: "/agent/roles-permissions" as Href,
  },
  {
    label: "Settings",
    icon: "cog-outline",
    route: "/agent/settings" as Href,
  },
];

const roles: AgencyRole[] = [
  "Agency Administrator",
  "Branch Manager",
  "Property Manager",
  "Lettings Agent",
  "Maintenance Coordinator",
  "Read-only User",
];

const branches = [
  "Head Office",
  "London Branch",
  "Manchester Branch",
  "Birmingham Branch",
  "Leeds Branch",
];

const permissionLabels: {
  key: PermissionKey;
  label: string;
  description: string;
  icon: IconName;
}[] = [
  {
    key: "properties",
    label: "Properties",
    description: "Property records and listings",
    icon: "office-building-outline",
  },
  {
    key: "landlords",
    label: "Landlords",
    description: "Landlord profiles and portfolios",
    icon: "account-tie-outline",
  },
  {
    key: "applicants",
    label: "Applicants",
    description: "Applications and referencing",
    icon: "account-search-outline",
  },
  {
    key: "tenants",
    label: "Tenants",
    description: "Tenant records and tenancies",
    icon: "account-group-outline",
  },
  {
    key: "maintenance",
    label: "Maintenance",
    description: "Maintenance requests and contractors",
    icon: "tools",
  },
  {
    key: "compliance",
    label: "Compliance",
    description: "Certificates and legal requirements",
    icon: "shield-check-outline",
  },
  {
    key: "reports",
    label: "Reports",
    description: "Agency reports and analytics",
    icon: "chart-box-outline",
  },
  {
    key: "users",
    label: "Users",
    description: "Agency users and invitations",
    icon: "account-multiple-outline",
  },
  {
    key: "settings",
    label: "Settings",
    description: "Agency settings and preferences",
    icon: "cog-outline",
  },
];

const users: Record<string, UserProfile> = {
  "USR-001": {
    id: "USR-001",
    firstName: "Vickash",
    lastName: "Sivakumar",
    email: "vickash@northgateestates.co.uk",
    phone: "+44 7700 900101",
    jobTitle: "Agency Administrator",
    branch: "Head Office",
    role: "Agency Administrator",
    status: "Active",
    lastLogin: "Today, 9:20 AM",
    invitedDate: "01 July 2026",
    createdBy: "TenureEx Administrator",
    permissions: {
      properties: "write",
      landlords: "write",
      applicants: "write",
      tenants: "write",
      maintenance: "write",
      compliance: "write",
      reports: "write",
      users: "write",
      settings: "write",
    },
  },
  "USR-002": {
    id: "USR-002",
    firstName: "Sarah",
    lastName: "Williams",
    email: "sarah.williams@northgateestates.co.uk",
    phone: "+44 7700 900102",
    jobTitle: "Property Manager",
    branch: "London Branch",
    role: "Property Manager",
    status: "Active",
    lastLogin: "Today, 8:45 AM",
    invitedDate: "05 July 2026",
    createdBy: "Vickash Sivakumar",
    permissions: {
      properties: "write",
      landlords: "read",
      applicants: "write",
      tenants: "write",
      maintenance: "write",
      compliance: "write",
      reports: "read",
      users: "none",
      settings: "none",
    },
  },
  "USR-004": {
    id: "USR-004",
    firstName: "Emily",
    lastName: "Johnson",
    email: "emily.johnson@northgateestates.co.uk",
    phone: "+44 7700 900104",
    jobTitle: "Lettings Agent",
    branch: "Birmingham Branch",
    role: "Lettings Agent",
    status: "Pending",
    lastLogin: "Invitation not accepted",
    invitedDate: "29 July 2026",
    createdBy: "Vickash Sivakumar",
    permissions: {
      properties: "read",
      landlords: "read",
      applicants: "write",
      tenants: "write",
      maintenance: "read",
      compliance: "read",
      reports: "read",
      users: "none",
      settings: "none",
    },
  },
  "USR-006": {
    id: "USR-006",
    firstName: "Sophia",
    lastName: "Brown",
    email: "sophia.brown@northgateestates.co.uk",
    phone: "+44 7700 900106",
    jobTitle: "Property Assistant",
    branch: "London Branch",
    role: "Read-only User",
    status: "Disabled",
    lastLogin: "22 July 2026",
    invitedDate: "11 July 2026",
    createdBy: "Vickash Sivakumar",
    permissions: {
      properties: "read",
      landlords: "read",
      applicants: "read",
      tenants: "read",
      maintenance: "read",
      compliance: "read",
      reports: "read",
      users: "none",
      settings: "none",
    },
  },
};

const fallbackUser: UserProfile = users["USR-002"];

export default function UserDetailsScreen() {
  const params = useLocalSearchParams<{
    userId?: string;
  }>();

  const { width } = useWindowDimensions();

  const isDesktop = width >= 1050;
  const isTablet = width >= 700;

  const requestedUserId =
    typeof params.userId === "string"
      ? params.userId
      : "USR-002";

  const initialUser =
    users[requestedUserId] ?? fallbackUser;

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [roleMenuVisible, setRoleMenuVisible] =
    useState(false);

  const [branchMenuVisible, setBranchMenuVisible] =
    useState(false);

  const [profile, setProfile] =
    useState<UserProfile>(initialUser);

  const [firstName, setFirstName] =
    useState(initialUser.firstName);

  const [lastName, setLastName] =
    useState(initialUser.lastName);

  const [email, setEmail] =
    useState(initialUser.email);

  const [phone, setPhone] =
    useState(initialUser.phone);

  const [jobTitle, setJobTitle] =
    useState(initialUser.jobTitle);

  const [branch, setBranch] =
    useState(initialUser.branch);

  const [role, setRole] =
    useState<AgencyRole>(initialUser.role);

  const [permissions, setPermissions] =
    useState<PermissionSettings>(
      initialUser.permissions
    );

  const [errors, setErrors] =
    useState<FormErrors>({});

  const [loading, setLoading] =
    useState(false);

  const [snackbarMessage, setSnackbarMessage] =
    useState("");

  const fullName = useMemo(
    () =>
      `${firstName.trim()} ${lastName.trim()}`.trim(),
    [firstName, lastName]
  );

  const initials = useMemo(
    () =>
      `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() ||
      "AU",
    [firstName, lastName]
  );

  const navigateTo = (route: Href) => {
    setMobileMenuOpen(false);
    router.push(route);
  };

  const handleSignOut = () => {
    router.replace("/auth/agent/login" as Href);
  };

  const clearError = (field: keyof FormErrors) => {
    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  };

  const applyRolePermissions = (
    selectedRole: AgencyRole
  ) => {
    setRole(selectedRole);
    clearError("role");

    if (selectedRole === "Agency Administrator") {
      setPermissions({
        properties: "write",
        landlords: "write",
        applicants: "write",
        tenants: "write",
        maintenance: "write",
        compliance: "write",
        reports: "write",
        users: "write",
        settings: "write",
      });
      return;
    }

    if (selectedRole === "Branch Manager") {
      setPermissions({
        properties: "write",
        landlords: "write",
        applicants: "write",
        tenants: "write",
        maintenance: "write",
        compliance: "read",
        reports: "read",
        users: "read",
        settings: "none",
      });
      return;
    }

    if (selectedRole === "Property Manager") {
      setPermissions({
        properties: "write",
        landlords: "read",
        applicants: "write",
        tenants: "write",
        maintenance: "write",
        compliance: "write",
        reports: "read",
        users: "none",
        settings: "none",
      });
      return;
    }

    if (selectedRole === "Lettings Agent") {
      setPermissions({
        properties: "read",
        landlords: "read",
        applicants: "write",
        tenants: "write",
        maintenance: "read",
        compliance: "read",
        reports: "read",
        users: "none",
        settings: "none",
      });
      return;
    }

    if (
      selectedRole === "Maintenance Coordinator"
    ) {
      setPermissions({
        properties: "read",
        landlords: "read",
        applicants: "none",
        tenants: "read",
        maintenance: "write",
        compliance: "read",
        reports: "read",
        users: "none",
        settings: "none",
      });
      return;
    }

    setPermissions({
      properties: "read",
      landlords: "read",
      applicants: "read",
      tenants: "read",
      maintenance: "read",
      compliance: "read",
      reports: "read",
      users: "none",
      settings: "none",
    });
  };

  const updatePermission = (
    permission: PermissionKey,
    access: PermissionAccess
  ) => {
    setPermissions((current) => ({
      ...current,
      [permission]: access,
    }));

    clearError("permissions");
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!firstName.trim()) {
      nextErrors.firstName =
        "Please enter the first name.";
    }

    if (!lastName.trim()) {
      nextErrors.lastName =
        "Please enter the last name.";
    }

    if (!email.trim() || !email.includes("@")) {
      nextErrors.email =
        "Please enter a valid work email.";
    }

    if (phone.trim().length < 7) {
      nextErrors.phone =
        "Please enter a valid phone number.";
    }

    if (!jobTitle.trim()) {
      nextErrors.jobTitle =
        "Please enter the job title.";
    }

    if (!branch) {
      nextErrors.branch =
        "Please select a branch.";
    }

    if (!role) {
      nextErrors.role =
        "Please select a role.";
    }

    const hasPermission = Object.values(
      permissions
    ).some((access) => access !== "none");

    if (!hasPermission) {
      nextErrors.permissions =
        "The user must have at least one permission.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSaveChanges = () => {
    if (!validateForm()) {
      setSnackbarMessage(
        "Please correct the highlighted fields."
      );
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setProfile((current) => ({
        ...current,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        jobTitle: jobTitle.trim(),
        branch,
        role,
        permissions,
      }));

      setLoading(false);
      setSnackbarMessage(
        "User details and permissions saved."
      );
    }, 650);
  };

  const handleResendInvitation = () => {
    setSnackbarMessage(
      `Invitation resent to ${email.trim()}.`
    );
  };

  const handleResetPassword = () => {
    setSnackbarMessage(
      `Password reset instructions prepared for ${email.trim()}.`
    );
  };

  const handleDisableUser = () => {
    if (profile.role === "Agency Administrator") {
      Alert.alert(
        "Administrator account",
        "The main Agency Administrator account cannot be disabled."
      );
      return;
    }

    Alert.alert(
      "Disable user",
      `Disable ${fullName}? They will no longer be able to access the Estate Agent portal.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Disable",
          style: "destructive",
          onPress: () => {
            setProfile((current) => ({
              ...current,
              status: "Disabled",
            }));

            setSnackbarMessage(
              `${fullName} has been disabled.`
            );
          },
        },
      ]
    );
  };

  const handleReactivateUser = () => {
    setProfile((current) => ({
      ...current,
      status: "Active",
      lastLogin: "Account reactivated",
    }));

    setSnackbarMessage(
      `${fullName} has been reactivated.`
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.appShell}>
          {isDesktop ? (
            <View style={styles.sidebar}>
              <TenureExLogo light compact />

              <View style={styles.agencyCard}>
                <View style={styles.agencyIcon}>
                  <MaterialCommunityIcons
                    name="office-building-outline"
                    size={22}
                    color={colors.white}
                  />
                </View>

                <View style={styles.agencyDetails}>
                  <Text style={styles.agencyName}>
                    Northgate Estates
                  </Text>

                  <Text style={styles.agencyPlan}>
                    Professional plan
                  </Text>
                </View>
              </View>

              <ScrollView
                style={styles.sidebarScroll}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.navigationLabel}>
                  WORKSPACE
                </Text>

                <View style={styles.navigationList}>
                  {navigationItems.map((item) => (
                    <NavigationButton
                      key={item.label}
                      item={item}
                      active={item.label === "Users"}
                      onPress={() =>
                        navigateTo(item.route)
                      }
                    />
                  ))}
                </View>
              </ScrollView>

              <View style={styles.sidebarFooter}>
                <Avatar.Text
                  size={39}
                  label="VS"
                  style={styles.sidebarAvatar}
                  labelStyle={
                    styles.sidebarAvatarLabel
                  }
                />

                <View style={styles.sidebarUser}>
                  <Text
                    style={styles.sidebarUserName}
                  >
                    Vickash Sivakumar
                  </Text>

                  <Text
                    style={styles.sidebarUserRole}
                  >
                    Agency administrator
                  </Text>
                </View>

                <Pressable onPress={handleSignOut}>
                  <MaterialCommunityIcons
                    name="logout"
                    size={20}
                    color="rgba(255,255,255,0.75)"
                  />
                </Pressable>
              </View>
            </View>
          ) : null}

          <View style={styles.mainArea}>
            <View style={styles.topBar}>
              {!isDesktop ? (
                <Pressable
                  onPress={() =>
                    setMobileMenuOpen(
                      (current) => !current
                    )
                  }
                  style={styles.headerIconButton}
                >
                  <MaterialCommunityIcons
                    name={
                      mobileMenuOpen
                        ? "close"
                        : "menu"
                    }
                    size={24}
                    color={colors.textPrimary}
                  />
                </Pressable>
              ) : null}

              {!isDesktop ? (
                <TenureExLogo compact />
              ) : (
                <View>
                  <Text style={styles.topBarTitle}>
                    User Details
                  </Text>

                  <Text
                    style={styles.topBarSubtitle}
                  >
                    Estate Agent Workspace
                  </Text>
                </View>
              )}

              <View style={styles.topBarActions}>
                <Pressable
                  style={styles.headerIconButton}
                >
                  <MaterialCommunityIcons
                    name="bell-outline"
                    size={22}
                    color={colors.textSecondary}
                  />

                  <View
                    style={styles.notificationDot}
                  />
                </Pressable>

                {isTablet ? (
                  <View style={styles.profile}>
                    <Avatar.Text
                      size={38}
                      label="VS"
                      style={styles.avatar}
                      labelStyle={styles.avatarLabel}
                    />

                    <View>
                      <Text
                        style={styles.profileName}
                      >
                        Vickash
                      </Text>

                      <Text
                        style={styles.profileRole}
                      >
                        Administrator
                      </Text>
                    </View>
                  </View>
                ) : null}
              </View>
            </View>

            {!isDesktop && mobileMenuOpen ? (
              <>
                <Pressable
                  onPress={() =>
                    setMobileMenuOpen(false)
                  }
                  style={styles.menuBackdrop}
                />

                <View style={styles.mobileMenu}>
                  <ScrollView
                    showsVerticalScrollIndicator={
                      false
                    }
                  >
                    {navigationItems.map((item) => (
                      <NavigationButton
                        key={item.label}
                        item={item}
                        active={
                          item.label === "Users"
                        }
                        mobile
                        onPress={() =>
                          navigateTo(item.route)
                        }
                      />
                    ))}

                    <Pressable
                      onPress={handleSignOut}
                      style={styles.mobileSignOut}
                    >
                      <MaterialCommunityIcons
                        name="logout"
                        size={20}
                        color={colors.error}
                      />

                      <Text
                        style={
                          styles.mobileSignOutText
                        }
                      >
                        Sign out
                      </Text>
                    </Pressable>
                  </ScrollView>
                </View>
              </>
            ) : null}

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={
                styles.pageContent
              }
            >
              <View style={styles.pageContainer}>
                <Pressable
                  style={styles.backButton}
                  onPress={() =>
                    router.replace(
                      "/agent/users" as Href
                    )
                  }
                >
                  <MaterialCommunityIcons
                    name="arrow-left"
                    size={18}
                    color={colors.primary}
                  />

                  <Text style={styles.backButtonText}>
                    Back to users
                  </Text>
                </Pressable>

                <View
                  style={[
                    styles.profileHeader,
                    !isTablet &&
                      styles.mobileProfileHeader,
                  ]}
                >
                  <View style={styles.profileIdentity}>
                    <View style={styles.largeAvatar}>
                      <Text
                        style={styles.largeAvatarText}
                      >
                        {initials}
                      </Text>
                    </View>

                    <View style={styles.profileSummary}>
                      <View
                        style={styles.profileNameRow}
                      >
                        <Text
                          style={
                            styles.profileHeaderName
                          }
                        >
                          {fullName}
                        </Text>

                        <StatusBadge
                          status={profile.status}
                        />
                      </View>

                      <Text
                        style={
                          styles.profileHeaderEmail
                        }
                      >
                        {email}
                      </Text>

                      <Text
                        style={styles.profileHeaderMeta}
                      >
                        {role} · {branch}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.headerActions}>
                    {profile.status === "Pending" ? (
                      <Button
                        mode="outlined"
                        icon="email-send-outline"
                        textColor={colors.primary}
                        style={styles.headerButton}
                        onPress={
                          handleResendInvitation
                        }
                      >
                        Resend invitation
                      </Button>
                    ) : null}

                    {profile.status === "Active" ? (
                      <Button
                        mode="outlined"
                        icon="lock-reset"
                        textColor={colors.primary}
                        style={styles.headerButton}
                        onPress={handleResetPassword}
                      >
                        Reset password
                      </Button>
                    ) : null}

                    {profile.status === "Disabled" ? (
                      <Button
                        mode="contained"
                        icon="account-check-outline"
                        buttonColor={colors.success}
                        style={styles.headerButton}
                        onPress={handleReactivateUser}
                      >
                        Reactivate
                      </Button>
                    ) : (
                      <Button
                        mode="outlined"
                        icon="account-cancel-outline"
                        textColor={colors.error}
                        style={[
                          styles.headerButton,
                          styles.disableButton,
                        ]}
                        onPress={handleDisableUser}
                      >
                        Disable
                      </Button>
                    )}
                  </View>
                </View>

                <View style={styles.activitySummary}>
                  <SummaryItem
                    icon="identifier"
                    label="User ID"
                    value={profile.id}
                  />

                  <SummaryItem
                    icon="calendar-plus"
                    label="Invited"
                    value={profile.invitedDate}
                  />

                  <SummaryItem
                    icon="account-plus-outline"
                    label="Created by"
                    value={profile.createdBy}
                  />

                  <SummaryItem
                    icon="login"
                    label="Last login"
                    value={profile.lastLogin}
                  />
                </View>

                <View
                  style={[
                    styles.formLayout,
                    !isDesktop &&
                      styles.mobileFormLayout,
                  ]}
                >
                  <View style={styles.formColumn}>
                    <SectionCard
                      icon="account-edit-outline"
                      title="Personal and work information"
                      description="Update the employee's details and agency assignment."
                    >
                      <View
                        style={[
                          styles.inputRow,
                          !isTablet &&
                            styles.mobileInputRow,
                        ]}
                      >
                        <FormInput
                          label="First name"
                          value={firstName}
                          onChangeText={(value) => {
                            setFirstName(value);
                            clearError("firstName");
                          }}
                          icon="account-outline"
                          error={errors.firstName}
                        />

                        <FormInput
                          label="Last name"
                          value={lastName}
                          onChangeText={(value) => {
                            setLastName(value);
                            clearError("lastName");
                          }}
                          icon="account-outline"
                          error={errors.lastName}
                        />
                      </View>

                      <View
                        style={[
                          styles.inputRow,
                          !isTablet &&
                            styles.mobileInputRow,
                        ]}
                      >
                        <FormInput
                          label="Work email"
                          value={email}
                          onChangeText={(value) => {
                            setEmail(value);
                            clearError("email");
                          }}
                          icon="email-outline"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          error={errors.email}
                        />

                        <InternationalPhoneInput
                          label="Phone number"
                          value={phone}
                          onChangeText={(value) => {
                            setPhone(value);
                            clearError("phone");
                          }}
                          error={errors.phone}
                        />
                      </View>

                      <FormInput
                        label="Job title"
                        value={jobTitle}
                        onChangeText={(value) => {
                          setJobTitle(value);
                          clearError("jobTitle");
                        }}
                        icon="briefcase-outline"
                        error={errors.jobTitle}
                      />

                      <Text style={styles.fieldLabel}>
                        Branch
                      </Text>

                      <Menu
                        visible={branchMenuVisible}
                        onDismiss={() =>
                          setBranchMenuVisible(false)
                        }
                        anchor={
                          <Pressable
                            style={[
                              styles.selectButton,
                              errors.branch &&
                                styles.errorBorder,
                            ]}
                            onPress={() =>
                              setBranchMenuVisible(true)
                            }
                          >
                            <MaterialCommunityIcons
                              name="office-building-marker-outline"
                              size={21}
                              color={colors.primary}
                            />

                            <Text
                              style={styles.selectText}
                            >
                              {branch}
                            </Text>

                            <MaterialCommunityIcons
                              name="chevron-down"
                              size={20}
                              color={colors.textMuted}
                            />
                          </Pressable>
                        }
                      >
                        {branches.map((item) => (
                          <Menu.Item
                            key={item}
                            title={item}
                            leadingIcon={
                              item === branch
                                ? "check"
                                : "office-building-outline"
                            }
                            onPress={() => {
                              setBranch(item);
                              clearError("branch");
                              setBranchMenuVisible(
                                false
                              );
                            }}
                          />
                        ))}
                      </Menu>

                      <ErrorText
                        message={errors.branch}
                      />

                      <Text style={styles.fieldLabel}>
                        Role
                      </Text>

                      <Menu
                        visible={roleMenuVisible}
                        onDismiss={() =>
                          setRoleMenuVisible(false)
                        }
                        anchor={
                          <Pressable
                            style={[
                              styles.selectButton,
                              errors.role &&
                                styles.errorBorder,
                            ]}
                            onPress={() =>
                              setRoleMenuVisible(true)
                            }
                          >
                            <MaterialCommunityIcons
                              name="shield-account-outline"
                              size={21}
                              color={colors.primary}
                            />

                            <Text
                              style={styles.selectText}
                            >
                              {role}
                            </Text>

                            <MaterialCommunityIcons
                              name="chevron-down"
                              size={20}
                              color={colors.textMuted}
                            />
                          </Pressable>
                        }
                      >
                        {roles.map((item) => (
                          <Menu.Item
                            key={item}
                            title={item}
                            leadingIcon={
                              item === role
                                ? "check"
                                : "shield-account-outline"
                            }
                            onPress={() => {
                              applyRolePermissions(
                                item
                              );
                              setRoleMenuVisible(
                                false
                              );
                            }}
                          />
                        ))}
                      </Menu>

                      <ErrorText message={errors.role} />
                    </SectionCard>

                    <SectionCard
                      icon="shield-key-outline"
                      title="Access permissions"
                      description="Set read, write or no access for each portal module."
                    >
                      <View
                        style={styles.permissionHeader}
                      >
                        <Text
                          style={
                            styles.permissionHeaderName
                          }
                        >
                          Module
                        </Text>

                        <Text
                          style={
                            styles.permissionHeaderAccess
                          }
                        >
                          Access
                        </Text>
                      </View>

                      {permissionLabels.map(
                        (permission, index) => (
                          <View key={permission.key}>
                            <PermissionRow
                              icon={permission.icon}
                              label={permission.label}
                              description={
                                permission.description
                              }
                              value={
                                permissions[
                                  permission.key
                                ]
                              }
                              onChange={(access) =>
                                updatePermission(
                                  permission.key,
                                  access
                                )
                              }
                            />

                            {index <
                            permissionLabels.length -
                              1 ? (
                              <Divider
                                style={
                                  styles.permissionDivider
                                }
                              />
                            ) : null}
                          </View>
                        )
                      )}

                      <ErrorText
                        message={errors.permissions}
                      />
                    </SectionCard>

                    <View style={styles.formActions}>
                      <Button
                        mode="outlined"
                        textColor={colors.primary}
                        style={styles.cancelButton}
                        onPress={() =>
                          router.replace(
                            "/agent/users" as Href
                          )
                        }
                      >
                        Cancel
                      </Button>

                      <Button
                        mode="contained"
                        icon="content-save-outline"
                        loading={loading}
                        disabled={loading}
                        buttonColor={colors.primary}
                        style={styles.saveButton}
                        contentStyle={
                          styles.saveButtonContent
                        }
                        onPress={handleSaveChanges}
                      >
                        Save changes
                      </Button>
                    </View>
                  </View>

                  <View style={styles.sideColumn}>
                    <View style={styles.securityCard}>
                      <View
                        style={styles.securityCardHeader}
                      >
                        <View style={styles.securityIcon}>
                          <MaterialCommunityIcons
                            name="shield-check-outline"
                            size={24}
                            color={colors.success}
                          />
                        </View>

                        <View style={styles.securityText}>
                          <Text
                            style={styles.securityTitle}
                          >
                            Account security
                          </Text>

                          <Text
                            style={
                              styles.securityDescription
                            }
                          >
                            Manage account access and
                            invitation status.
                          </Text>
                        </View>
                      </View>

                      <SecurityItem
                        icon="email-check-outline"
                        label="Email status"
                        value={
                          profile.status === "Pending"
                            ? "Invitation pending"
                            : "Verified"
                        }
                      />

                      <SecurityItem
                        icon="two-factor-authentication"
                        label="Two-factor authentication"
                        value="Not configured"
                      />

                      <SecurityItem
                        icon="lock-outline"
                        label="Password"
                        value={
                          profile.status === "Pending"
                            ? "Not created"
                            : "Active"
                        }
                      />
                    </View>

                    <View style={styles.roleCard}>
                      <Text style={styles.roleCardTitle}>
                        Current role
                      </Text>

                      <View style={styles.roleIcon}>
                        <MaterialCommunityIcons
                          name="shield-account-outline"
                          size={30}
                          color={colors.primary}
                        />
                      </View>

                      <Text style={styles.roleName}>
                        {role}
                      </Text>

                      <Text
                        style={styles.roleDescription}
                      >
                        The role controls the user's
                        default access. Individual
                        permissions can be adjusted in
                        the permissions section.
                      </Text>

                      <Button
                        mode="outlined"
                        icon="shield-edit-outline"
                        textColor={colors.primary}
                        style={styles.roleButton}
                        onPress={() =>
                          router.push(
                            "/agent/roles-permissions" as Href
                          )
                        }
                      >
                        Manage roles
                      </Button>
                    </View>

                    <View style={styles.auditCard}>
                      <Text style={styles.auditTitle}>
                        Recent account activity
                      </Text>

                      <AuditItem
                        icon="account-edit-outline"
                        title="Profile reviewed"
                        description="Today, 9:10 AM"
                      />

                      <AuditItem
                        icon="login"
                        title="Successful login"
                        description={profile.lastLogin}
                      />

                      <AuditItem
                        icon="account-plus-outline"
                        title="Account created"
                        description={profile.invitedDate}
                      />
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>

        <Snackbar
          visible={Boolean(snackbarMessage)}
          onDismiss={() =>
            setSnackbarMessage("")
          }
          duration={2800}
        >
          {snackbarMessage}
        </Snackbar>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function NavigationButton({
  item,
  active,
  mobile = false,
  onPress,
}: {
  item: NavigationItem;
  active: boolean;
  mobile?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.navigationItem,
        mobile && styles.mobileNavigationItem,
        active && styles.activeNavigationItem,
      ]}
    >
      <MaterialCommunityIcons
        name={item.icon}
        size={20}
        color={
          active
            ? colors.white
            : mobile
              ? colors.textSecondary
              : "rgba(255,255,255,0.68)"
        }
      />

      <Text
        style={[
          styles.navigationText,
          mobile &&
            styles.mobileNavigationText,
          active &&
            styles.activeNavigationText,
        ]}
      >
        {item.label}
      </Text>

      {(item.label === "Messages" ||
        item.label === "Users") && (
        <View style={styles.messageBadge}>
          <Text style={styles.messageBadgeText}>
            {item.label === "Users" ? "12" : "4"}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function StatusBadge({
  status,
}: {
  status: UserStatus;
}) {
  const backgroundColor =
    status === "Active"
      ? colors.successLight
      : status === "Pending"
        ? colors.warningLight
        : colors.errorLight;

  const textColor =
    status === "Active"
      ? colors.success
      : status === "Pending"
        ? colors.warning
        : colors.error;

  return (
    <View
      style={[
        styles.statusBadge,
        { backgroundColor },
      ]}
    >
      <Text
        style={[
          styles.statusBadgeText,
          { color: textColor },
        ]}
      >
        {status}
      </Text>
    </View>
  );
}

function SummaryItem({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.summaryItem}>
      <View style={styles.summaryIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={colors.primary}
        />
      </View>

      <View style={styles.summaryText}>
        <Text style={styles.summaryLabel}>
          {label}
        </Text>

        <Text
          style={styles.summaryValue}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function SectionCard({
  icon,
  title,
  description,
  children,
}: {
  icon: IconName;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <MaterialCommunityIcons
            name={icon}
            size={23}
            color={colors.primary}
          />
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>
            {title}
          </Text>

          <Text
            style={styles.sectionDescription}
          >
            {description}
          </Text>
        </View>
      </View>

      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );
}

function FormInput({
  label,
  value,
  onChangeText,
  icon,
  error,
  keyboardType = "default",
  autoCapitalize = "sentences",
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  icon: IconName;
  error?: string;
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
    <View style={styles.inputContainer}>
      <Text style={styles.fieldLabel}>
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        mode="outlined"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        error={Boolean(error)}
        left={<TextInput.Icon icon={icon} />}
        outlineColor={colors.border}
        activeOutlineColor={colors.primary}
        style={styles.input}
      />

      <ErrorText message={error} />
    </View>
  );
}

function ErrorText({
  message,
}: {
  message?: string;
}) {
  return message ? (
    <Text style={styles.errorText}>
      {message}
    </Text>
  ) : null;
}

function PermissionRow({
  icon,
  label,
  description,
  value,
  onChange,
}: {
  icon: IconName;
  label: string;
  description: string;
  value: PermissionAccess;
  onChange: (value: PermissionAccess) => void;
}) {
  return (
    <View style={styles.permissionRow}>
      <View style={styles.permissionModule}>
        <View style={styles.permissionIcon}>
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={colors.primary}
          />
        </View>

        <View style={styles.permissionText}>
          <Text
            style={styles.permissionLabel}
          >
            {label}
          </Text>

          <Text
            style={
              styles.permissionDescription
            }
          >
            {description}
          </Text>
        </View>
      </View>

      <View style={styles.accessButtons}>
        <AccessButton
          label="None"
          selected={value === "none"}
          onPress={() => onChange("none")}
        />

        <AccessButton
          label="Read"
          selected={value === "read"}
          onPress={() => onChange("read")}
        />

        <AccessButton
          label="Write"
          selected={value === "write"}
          onPress={() => onChange("write")}
        />
      </View>
    </View>
  );
}

function AccessButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.accessButton,
        selected && styles.selectedAccessButton,
      ]}
    >
      <Text
        style={[
          styles.accessButtonText,
          selected &&
            styles.selectedAccessButtonText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SecurityItem({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.securityItem}>
      <MaterialCommunityIcons
        name={icon}
        size={19}
        color={colors.primary}
      />

      <View style={styles.securityItemText}>
        <Text style={styles.securityItemLabel}>
          {label}
        </Text>

        <Text style={styles.securityItemValue}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function AuditItem({
  icon,
  title,
  description,
}: {
  icon: IconName;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.auditItem}>
      <View style={styles.auditIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={colors.primary}
        />
      </View>

      <View style={styles.auditText}>
        <Text style={styles.auditItemTitle}>
          {title}
        </Text>

        <Text
          style={styles.auditDescription}
        >
          {description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  appShell: {
    flex: 1,
    flexDirection: "row",
  },

  sidebar: {
    width: 264,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    backgroundColor: colors.primaryDark,
  },

  agencyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: spacing.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  agencyIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  agencyDetails: {
    flex: 1,
  },

  agencyName: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "800",
  },

  agencyPlan: {
    marginTop: 2,
    color: "rgba(255,255,255,0.55)",
    fontSize: 9,
  },

  sidebarScroll: {
    flex: 1,
    marginTop: spacing.xl,
  },

  navigationLabel: {
    paddingHorizontal: spacing.md,
    color: "rgba(255,255,255,0.42)",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  navigationList: {
    gap: 3,
    marginTop: spacing.sm,
  },

  navigationItem: {
    minHeight: 45,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },

  mobileNavigationItem: {
    minHeight: 52,
  },

  activeNavigationItem: {
    backgroundColor: colors.primary,
  },

  navigationText: {
    flex: 1,
    color: "rgba(255,255,255,0.68)",
    fontSize: 12,
    fontWeight: "600",
  },

  mobileNavigationText: {
    color: colors.textSecondary,
    fontSize: 14,
  },

  activeNavigationText: {
    color: colors.white,
    fontWeight: "800",
  },

  messageBadge: {
    minWidth: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    borderRadius: 11,
    backgroundColor: colors.secondary,
  },

  messageBadgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: "900",
  },

  sidebarFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.10)",
  },

  sidebarAvatar: {
    backgroundColor: colors.secondary,
  },

  sidebarAvatarLabel: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "900",
  },

  sidebarUser: {
    flex: 1,
  },

  sidebarUserName: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
  },

  sidebarUserRole: {
    marginTop: 2,
    color: "rgba(255,255,255,0.50)",
    fontSize: 8,
  },

  mainArea: {
    flex: 1,
    minWidth: 0,
  },

  topBar: {
    minHeight: 74,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },

  topBarTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "900",
  },

  topBarSubtitle: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 9,
  },

  topBarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  headerIconButton: {
    position: "relative",
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.background,
  },

  notificationDot: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderWidth: 1,
    borderColor: colors.white,
    borderRadius: 4,
    backgroundColor: colors.error,
  },

  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  avatar: {
    backgroundColor: colors.primaryLight,
  },

  avatarLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
  },

  profileName: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "800",
  },

  profileRole: {
    color: colors.textMuted,
    fontSize: 8,
  },

  menuBackdrop: {
    position: "absolute",
    top: 74,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 19,
    backgroundColor: "rgba(16,43,58,0.35)",
  },

  mobileMenu: {
    position: "absolute",
    top: 74,
    bottom: 0,
    left: 0,
    zIndex: 20,
    width: 285,
    padding: spacing.md,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.white,
  },

  mobileSignOut: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  mobileSignOutText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: "700",
  },

  pageContent: {
    flexGrow: 1,
    padding: spacing.xl,
  },

  pageContainer: {
    width: "100%",
    maxWidth: 1480,
    alignSelf: "center",
  },

  backButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: spacing.lg,
  },

  backButtonText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
  },

  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  mobileProfileHeader: {
    alignItems: "flex-start",
    flexDirection: "column",
  },

  profileIdentity: {
    flex: 1,
    minWidth: 250,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },

  largeAvatar: {
    width: 74,
    height: 74,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 37,
    backgroundColor: colors.primary,
  },

  largeAvatarText: {
    color: colors.white,
    fontSize: 21,
    fontWeight: "900",
  },

  profileSummary: {
    flex: 1,
  },

  profileNameRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.sm,
  },

  profileHeaderName: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "900",
  },

  profileHeaderEmail: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 11,
  },

  profileHeaderMeta: {
    marginTop: 5,
    color: colors.textMuted,
    fontSize: 10,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  statusBadgeText: {
    fontSize: 8,
    fontWeight: "900",
  },

  headerActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  headerButton: {
    borderRadius: radius.md,
  },

  disableButton: {
    borderColor: colors.error,
  },

  activitySummary: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.lg,
  },

  summaryItem: {
    flex: 1,
    minWidth: 210,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
  },

  summaryIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
  },

  summaryText: {
    flex: 1,
  },

  summaryLabel: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "700",
  },

  summaryValue: {
    marginTop: 3,
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },

  formLayout: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xl,
    marginTop: spacing.lg,
  },

  mobileFormLayout: {
    flexDirection: "column",
  },

  formColumn: {
    flex: 1.65,
    minWidth: 0,
    gap: spacing.lg,
  },

  sideColumn: {
    flex: 0.75,
    minWidth: 280,
    gap: spacing.lg,
  },

  sectionCard: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },

  sectionIcon: {
    width: 45,
    height: 45,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
  },

  sectionHeading: {
    flex: 1,
  },

  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "900",
  },

  sectionDescription: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 14,
  },

  sectionContent: {
    padding: spacing.lg,
  },

  inputRow: {
    flexDirection: "row",
    gap: spacing.md,
  },

  mobileInputRow: {
    flexDirection: "column",
    gap: 0,
  },

  inputContainer: {
    flex: 1,
    minWidth: 0,
    marginBottom: spacing.md,
  },

  fieldLabel: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "800",
  },

  input: {
    backgroundColor: colors.white,
  },

  errorText: {
    marginTop: 5,
    color: colors.error,
    fontSize: 10,
  },

  selectButton: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
  },

  errorBorder: {
    borderColor: colors.error,
  },

  selectText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 12,
  },

  permissionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: spacing.sm,
  },

  permissionHeaderName: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: "900",
  },

  permissionHeaderAccess: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: "900",
  },

  permissionRow: {
    minHeight: 78,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },

  permissionModule: {
    flex: 1,
    minWidth: 210,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  permissionIcon: {
    width: 39,
    height: 39,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
  },

  permissionText: {
    flex: 1,
  },

  permissionLabel: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },

  permissionDescription: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 8,
  },

  accessButtons: {
    flexDirection: "row",
    gap: 5,
  },

  accessButton: {
    minWidth: 58,
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    backgroundColor: colors.white,
  },

  selectedAccessButton: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },

  accessButtonText: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: "800",
  },

  selectedAccessButtonText: {
    color: colors.white,
  },

  permissionDivider: {
    backgroundColor: colors.border,
  },

  formActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },

  cancelButton: {
    borderColor: colors.primary,
    borderRadius: radius.md,
  },

  saveButton: {
    borderRadius: radius.md,
  },

  saveButtonContent: {
    minHeight: 49,
    flexDirection: "row-reverse",
  },

  securityCard: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  securityCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },

  securityIcon: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: colors.successLight,
  },

  securityText: {
    flex: 1,
  },

  securityTitle: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "900",
  },

  securityDescription: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 8,
    lineHeight: 13,
  },

  securityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  securityItemText: {
    flex: 1,
  },

  securityItemLabel: {
    color: colors.textMuted,
    fontSize: 8,
  },

  securityItemValue: {
    marginTop: 3,
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "900",
  },

  roleCard: {
    alignItems: "center",
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  roleCardTitle: {
    alignSelf: "flex-start",
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "900",
  },

  roleIcon: {
    width: 66,
    height: 66,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
  },

  roleName: {
    marginTop: spacing.md,
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center",
  },

  roleDescription: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
    textAlign: "center",
  },

  roleButton: {
    marginTop: spacing.lg,
    borderColor: colors.primary,
  },

  auditCard: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  auditTitle: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "900",
  },

  auditItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  auditIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
  },

  auditText: {
    flex: 1,
  },

  auditItemTitle: {
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "900",
  },

  auditDescription: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 8,
  },
});
