import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { useMemo, useState } from "react";
import {
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
    Snackbar,
    Switch,
    TextInput,
} from "react-native-paper";

import TenureExLogo from "../../src/components/Logo/TenureExLogo";
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
  route: Href;
};

type PermissionAccess = "none" | "read" | "write";

type PermissionKey =
  | "properties"
  | "landlords"
  | "applicants"
  | "tenants"
  | "maintenance"
  | "compliance"
  | "reports"
  | "messages"
  | "users"
  | "settings";

type PermissionSettings = Record<
  PermissionKey,
  PermissionAccess
>;

type AgencyRole = {
  id: string;
  name: string;
  description: string;
  icon: IconName;
  userCount: number;
  isSystemRole: boolean;
  enabled: boolean;
  permissions: PermissionSettings;
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

const permissionModules: {
  key: PermissionKey;
  label: string;
  description: string;
  icon: IconName;
}[] = [
  {
    key: "properties",
    label: "Properties",
    description: "Property listings and records",
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
    description: "Tenant details and tenancies",
    icon: "account-group-outline",
  },
  {
    key: "maintenance",
    label: "Maintenance",
    description: "Requests, jobs and contractors",
    icon: "tools",
  },
  {
    key: "compliance",
    label: "Compliance",
    description: "Certificates and legal records",
    icon: "shield-check-outline",
  },
  {
    key: "reports",
    label: "Reports",
    description: "Reports and analytics",
    icon: "chart-box-outline",
  },
  {
    key: "messages",
    label: "Messages",
    description: "Portal communications",
    icon: "message-text-outline",
  },
  {
    key: "users",
    label: "Users",
    description: "Agency staff and invitations",
    icon: "account-multiple-outline",
  },
  {
    key: "settings",
    label: "Settings",
    description: "Agency account configuration",
    icon: "cog-outline",
  },
];

const initialRoles: AgencyRole[] = [
  {
    id: "ROLE-001",
    name: "Agency Administrator",
    description:
      "Full control of the agency account, users, settings and all operational modules.",
    icon: "shield-crown-outline",
    userCount: 3,
    isSystemRole: true,
    enabled: true,
    permissions: {
      properties: "write",
      landlords: "write",
      applicants: "write",
      tenants: "write",
      maintenance: "write",
      compliance: "write",
      reports: "write",
      messages: "write",
      users: "write",
      settings: "write",
    },
  },
  {
    id: "ROLE-002",
    name: "Branch Manager",
    description:
      "Manages branch operations, staff activity and property-related work.",
    icon: "account-supervisor-outline",
    userCount: 2,
    isSystemRole: true,
    enabled: true,
    permissions: {
      properties: "write",
      landlords: "write",
      applicants: "write",
      tenants: "write",
      maintenance: "write",
      compliance: "read",
      reports: "read",
      messages: "write",
      users: "read",
      settings: "none",
    },
  },
  {
    id: "ROLE-003",
    name: "Property Manager",
    description:
      "Manages properties, tenants, applicants, maintenance and compliance.",
    icon: "home-account",
    userCount: 4,
    isSystemRole: true,
    enabled: true,
    permissions: {
      properties: "write",
      landlords: "read",
      applicants: "write",
      tenants: "write",
      maintenance: "write",
      compliance: "write",
      reports: "read",
      messages: "write",
      users: "none",
      settings: "none",
    },
  },
  {
    id: "ROLE-004",
    name: "Lettings Agent",
    description:
      "Supports applicants, tenants, listings and landlord communication.",
    icon: "account-key-outline",
    userCount: 5,
    isSystemRole: true,
    enabled: true,
    permissions: {
      properties: "read",
      landlords: "read",
      applicants: "write",
      tenants: "write",
      maintenance: "read",
      compliance: "read",
      reports: "read",
      messages: "write",
      users: "none",
      settings: "none",
    },
  },
  {
    id: "ROLE-005",
    name: "Maintenance Coordinator",
    description:
      "Coordinates repairs, contractors and property maintenance activity.",
    icon: "account-hard-hat-outline",
    userCount: 2,
    isSystemRole: true,
    enabled: true,
    permissions: {
      properties: "read",
      landlords: "read",
      applicants: "none",
      tenants: "read",
      maintenance: "write",
      compliance: "read",
      reports: "read",
      messages: "write",
      users: "none",
      settings: "none",
    },
  },
  {
    id: "ROLE-006",
    name: "Read-only User",
    description:
      "Can view approved information but cannot create, edit or delete records.",
    icon: "eye-outline",
    userCount: 1,
    isSystemRole: true,
    enabled: true,
    permissions: {
      properties: "read",
      landlords: "read",
      applicants: "read",
      tenants: "read",
      maintenance: "read",
      compliance: "read",
      reports: "read",
      messages: "read",
      users: "none",
      settings: "none",
    },
  },
];

export default function RolesPermissionsScreen() {
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1050;
  const isTablet = width >= 720;

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);
  const [roles, setRoles] =
    useState<AgencyRole[]>(initialRoles);
  const [selectedRoleId, setSelectedRoleId] =
    useState(initialRoles[0].id);
  const [search, setSearch] = useState("");
  const [snackbarMessage, setSnackbarMessage] =
    useState("");

  const selectedRole =
    roles.find((role) => role.id === selectedRoleId) ??
    roles[0];

  const filteredRoles = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return roles;

    return roles.filter((role) =>
      `${role.name} ${role.description}`
        .toLowerCase()
        .includes(query)
    );
  }, [roles, search]);

  const totalUsers = useMemo(
    () =>
      roles.reduce(
        (total, role) => total + role.userCount,
        0
      ),
    [roles]
  );

  const navigateTo = (route: Href) => {
    setMobileMenuOpen(false);
    router.push(route);
  };

  const handleSignOut = () => {
    router.replace("/auth/agent/login" as Href);
  };

  const updatePermission = (
    permission: PermissionKey,
    access: PermissionAccess
  ) => {
    if (
      selectedRole.name === "Agency Administrator" &&
      access !== "write"
    ) {
      setSnackbarMessage(
        "The Agency Administrator must keep full write access."
      );
      return;
    }

    setRoles((current) =>
      current.map((role) =>
        role.id === selectedRole.id
          ? {
              ...role,
              permissions: {
                ...role.permissions,
                [permission]: access,
              },
            }
          : role
      )
    );
  };

  const toggleRoleEnabled = () => {
    if (selectedRole.name === "Agency Administrator") {
      setSnackbarMessage(
        "The Agency Administrator role cannot be disabled."
      );
      return;
    }

    setRoles((current) =>
      current.map((role) =>
        role.id === selectedRole.id
          ? {
              ...role,
              enabled: !role.enabled,
            }
          : role
      )
    );

    setSnackbarMessage(
      selectedRole.enabled
        ? `${selectedRole.name} has been disabled.`
        : `${selectedRole.name} has been enabled.`
    );
  };

  const handleSave = () => {
    setSnackbarMessage(
      `${selectedRole.name} permissions saved successfully.`
    );
  };

  return (
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
                    active={
                      item.label === "Roles & Permissions"
                    }
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
                labelStyle={styles.sidebarAvatarLabel}
              />

              <View style={styles.sidebarUser}>
                <Text style={styles.sidebarUserName}>
                  Vickash Sivakumar
                </Text>

                <Text style={styles.sidebarUserRole}>
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
                    mobileMenuOpen ? "close" : "menu"
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
                  Roles & Permissions
                </Text>

                <Text style={styles.topBarSubtitle}>
                  Estate Agent Workspace
                </Text>
              </View>
            )}

            <View style={styles.topBarActions}>
              <Pressable style={styles.headerIconButton}>
                <MaterialCommunityIcons
                  name="bell-outline"
                  size={22}
                  color={colors.textSecondary}
                />

                <View style={styles.notificationDot} />
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
                    <Text style={styles.profileName}>
                      Vickash
                    </Text>

                    <Text style={styles.profileRole}>
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
                  showsVerticalScrollIndicator={false}
                >
                  {navigationItems.map((item) => (
                    <NavigationButton
                      key={item.label}
                      item={item}
                      active={
                        item.label ===
                        "Roles & Permissions"
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
                      style={styles.mobileSignOutText}
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
            contentContainerStyle={styles.pageContent}
          >
            <View style={styles.pageContainer}>
              <View style={styles.pageHeader}>
                <View style={styles.pageHeading}>
                  <Text style={styles.eyebrow}>
                    ACCESS CONTROL
                  </Text>

                  <Text style={styles.pageTitle}>
                    Roles & permissions
                  </Text>

                  <Text style={styles.pageSubtitle}>
                    Control what each agency role can view,
                    create and update within the Estate Agent
                    portal.
                  </Text>
                </View>

                <Button
                  mode="contained"
                  icon="content-save-outline"
                  buttonColor={colors.primary}
                  style={styles.saveButton}
                  contentStyle={styles.saveButtonContent}
                  onPress={handleSave}
                >
                  Save permissions
                </Button>
              </View>

              <View style={styles.statisticsGrid}>
                <StatisticCard
                  icon="shield-account-outline"
                  value={String(roles.length)}
                  label="Agency roles"
                  helper="Available access profiles"
                />

                <StatisticCard
                  icon="account-multiple-outline"
                  value={String(totalUsers)}
                  label="Assigned users"
                  helper="Across all active roles"
                />

                <StatisticCard
                  icon="shield-check-outline"
                  value={String(
                    roles.filter((role) => role.enabled)
                      .length
                  )}
                  label="Enabled roles"
                  helper="Currently available"
                />

                <StatisticCard
                  icon="lock-check-outline"
                  value="10"
                  label="Permission modules"
                  helper="Read and write controls"
                />
              </View>

              <View
                style={[
                  styles.mainGrid,
                  !isDesktop && styles.mobileMainGrid,
                ]}
              >
                <View style={styles.rolesPanel}>
                  <View style={styles.panelHeader}>
                    <View>
                      <Text style={styles.panelTitle}>
                        Agency roles
                      </Text>

                      <Text
                        style={styles.panelDescription}
                      >
                        Select a role to review its access.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.searchBox}>
                    <MaterialCommunityIcons
                      name="magnify"
                      size={20}
                      color={colors.textMuted}
                    />

                    <TextInput
                      mode="flat"
                      value={search}
                      onChangeText={setSearch}
                      placeholder="Search roles..."
                      underlineColor="transparent"
                      activeUnderlineColor="transparent"
                      style={styles.searchInput}
                      contentStyle={styles.searchInputContent}
                    />
                  </View>

                  <View style={styles.roleList}>
                    {filteredRoles.map((role) => (
                      <Pressable
                        key={role.id}
                        onPress={() =>
                          setSelectedRoleId(role.id)
                        }
                        style={[
                          styles.roleListItem,
                          role.id === selectedRole.id &&
                            styles.selectedRoleListItem,
                        ]}
                      >
                        <View
                          style={[
                            styles.roleListIcon,
                            role.id === selectedRole.id &&
                              styles.selectedRoleListIcon,
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={role.icon}
                            size={22}
                            color={colors.primary}
                          />
                        </View>

                        <View style={styles.roleListText}>
                          <View
                            style={styles.roleListTitleRow}
                          >
                            <Text
                              style={[
                                styles.roleListTitle,
                                role.id === selectedRole.id &&
                                  styles.selectedRoleListTitle,
                              ]}
                            >
                              {role.name}
                            </Text>

                            {!role.enabled ? (
                              <View
                                style={
                                  styles.disabledBadge
                                }
                              >
                                <Text
                                  style={
                                    styles.disabledBadgeText
                                  }
                                >
                                  Disabled
                                </Text>
                              </View>
                            ) : null}
                          </View>

                          <Text
                            style={styles.roleListUsers}
                          >
                            {role.userCount} assigned user
                            {role.userCount === 1 ? "" : "s"}
                          </Text>
                        </View>

                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={20}
                          color={colors.textMuted}
                        />
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.permissionsPanel}>
                  <View style={styles.roleHeaderCard}>
                    <View style={styles.roleHeaderMain}>
                      <View style={styles.largeRoleIcon}>
                        <MaterialCommunityIcons
                          name={selectedRole.icon}
                          size={30}
                          color={colors.primary}
                        />
                      </View>

                      <View style={styles.roleHeaderText}>
                        <View
                          style={styles.roleHeaderTitleRow}
                        >
                          <Text style={styles.roleHeaderTitle}>
                            {selectedRole.name}
                          </Text>

                          {selectedRole.isSystemRole ? (
                            <View style={styles.systemBadge}>
                              <Text
                                style={
                                  styles.systemBadgeText
                                }
                              >
                                System role
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        <Text
                          style={styles.roleHeaderDescription}
                        >
                          {selectedRole.description}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.roleToggleRow}>
                      <View>
                        <Text style={styles.roleToggleTitle}>
                          Role enabled
                        </Text>

                        <Text
                          style={styles.roleToggleDescription}
                        >
                          Disabled roles cannot be assigned to
                          new users.
                        </Text>
                      </View>

                      <Switch
                        value={selectedRole.enabled}
                        onValueChange={toggleRoleEnabled}
                        color={colors.primary}
                      />
                    </View>
                  </View>

                  <View style={styles.permissionsCard}>
                    <View style={styles.permissionsHeader}>
                      <View>
                        <Text
                          style={styles.permissionsTitle}
                        >
                          Module permissions
                        </Text>

                        <Text
                          style={
                            styles.permissionsDescription
                          }
                        >
                          Choose no access, read access or write
                          access for each module.
                        </Text>
                      </View>
                    </View>

                    <View style={styles.tableHeader}>
                      <Text style={styles.tableHeaderModule}>
                        Module
                      </Text>

                      <Text style={styles.tableHeaderAccess}>
                        Access level
                      </Text>
                    </View>

                    {permissionModules.map(
                      (permission, index) => (
                        <View key={permission.key}>
                          <PermissionRow
                            module={permission}
                            value={
                              selectedRole.permissions[
                                permission.key
                              ]
                            }
                            locked={
                              selectedRole.name ===
                              "Agency Administrator"
                            }
                            onChange={(access) =>
                              updatePermission(
                                permission.key,
                                access
                              )
                            }
                          />

                          {index <
                          permissionModules.length - 1 ? (
                            <Divider
                              style={
                                styles.permissionDivider
                              }
                            />
                          ) : null}
                        </View>
                      )
                    )}
                  </View>

                  <View style={styles.permissionLegend}>
                    <LegendItem
                      label="No access"
                      description="Module is hidden from the user."
                      icon="close-circle-outline"
                    />

                    <LegendItem
                      label="Read"
                      description="User can view records only."
                      icon="eye-outline"
                    />

                    <LegendItem
                      label="Write"
                      description="User can create and update records."
                      icon="pencil-outline"
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
        onDismiss={() => setSnackbarMessage("")}
        duration={2800}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
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
          mobile && styles.mobileNavigationText,
          active && styles.activeNavigationText,
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

function StatisticCard({
  icon,
  value,
  label,
  helper,
}: {
  icon: IconName;
  value: string;
  label: string;
  helper: string;
}) {
  return (
    <View style={styles.statisticCard}>
      <View style={styles.statisticIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={23}
          color={colors.primary}
        />
      </View>

      <Text style={styles.statisticValue}>
        {value}
      </Text>

      <Text style={styles.statisticLabel}>
        {label}
      </Text>

      <Text style={styles.statisticHelper}>
        {helper}
      </Text>
    </View>
  );
}

function PermissionRow({
  module,
  value,
  locked,
  onChange,
}: {
  module: {
    key: PermissionKey;
    label: string;
    description: string;
    icon: IconName;
  };
  value: PermissionAccess;
  locked: boolean;
  onChange: (access: PermissionAccess) => void;
}) {
  return (
    <View style={styles.permissionRow}>
      <View style={styles.permissionModule}>
        <View style={styles.permissionIcon}>
          <MaterialCommunityIcons
            name={module.icon}
            size={20}
            color={colors.primary}
          />
        </View>

        <View style={styles.permissionText}>
          <Text style={styles.permissionLabel}>
            {module.label}
          </Text>

          <Text
            style={styles.permissionDescription}
          >
            {module.description}
          </Text>
        </View>
      </View>

      <View style={styles.accessButtons}>
        <AccessButton
          label="None"
          selected={value === "none"}
          disabled={locked}
          onPress={() => onChange("none")}
        />

        <AccessButton
          label="Read"
          selected={value === "read"}
          disabled={locked}
          onPress={() => onChange("read")}
        />

        <AccessButton
          label="Write"
          selected={value === "write"}
          disabled={locked}
          onPress={() => onChange("write")}
        />
      </View>
    </View>
  );
}

function AccessButton({
  label,
  selected,
  disabled,
  onPress,
}: {
  label: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.accessButton,
        selected && styles.selectedAccessButton,
        disabled && styles.disabledAccessButton,
      ]}
    >
      <Text
        style={[
          styles.accessButtonText,
          selected &&
            styles.selectedAccessButtonText,
          disabled &&
            !selected &&
            styles.disabledAccessButtonText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function LegendItem({
  label,
  description,
  icon,
}: {
  label: string;
  description: string;
  icon: IconName;
}) {
  return (
    <View style={styles.legendItem}>
      <View style={styles.legendIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={19}
          color={colors.primary}
        />
      </View>

      <View style={styles.legendText}>
        <Text style={styles.legendLabel}>
          {label}
        </Text>

        <Text style={styles.legendDescription}>
          {description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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

  pageHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.lg,
  },

  pageHeading: {
    flex: 1,
    minWidth: 260,
  },

  eyebrow: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.6,
  },

  pageTitle: {
    ...typography.displayMedium,
    marginTop: spacing.sm,
    color: colors.textPrimary,
  },

  pageSubtitle: {
    ...typography.bodyMedium,
    maxWidth: 720,
    marginTop: spacing.sm,
    color: colors.textSecondary,
  },

  saveButton: {
    borderRadius: radius.md,
  },

  saveButtonContent: {
    minHeight: 48,
    flexDirection: "row-reverse",
  },

  statisticsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg,
    marginTop: spacing.xxl,
  },

  statisticCard: {
    flex: 1,
    minWidth: 180,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  statisticIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
  },

  statisticValue: {
    marginTop: spacing.lg,
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: "900",
  },

  statisticLabel: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
  },

  statisticHelper: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: 9,
  },

  mainGrid: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xl,
    marginTop: spacing.xl,
  },

  mobileMainGrid: {
    flexDirection: "column",
  },

  rolesPanel: {
    width: 335,
    maxWidth: "100%",
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  permissionsPanel: {
    flex: 1,
    minWidth: 0,
    gap: spacing.lg,
  },

  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  panelTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "900",
  },

  panelDescription: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 9,
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 48,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },

  searchInput: {
    flex: 1,
    height: 45,
    backgroundColor: "transparent",
  },

  searchInputContent: {
    paddingHorizontal: 0,
    fontSize: 11,
  },

  roleList: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },

  roleListItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: radius.md,
  },

  selectedRoleListItem: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },

  roleListIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.background,
  },

  selectedRoleListIcon: {
    backgroundColor: colors.white,
  },

  roleListText: {
    flex: 1,
  },

  roleListTitleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 5,
  },

  roleListTitle: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "800",
  },

  selectedRoleListTitle: {
    color: colors.primary,
    fontWeight: "900",
  },

  roleListUsers: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 8,
  },

  disabledBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: colors.errorLight,
  },

  disabledBadgeText: {
    color: colors.error,
    fontSize: 6,
    fontWeight: "900",
  },

  roleHeaderCard: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  roleHeaderMain: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },

  largeRoleIcon: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
  },

  roleHeaderText: {
    flex: 1,
  },

  roleHeaderTitleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.sm,
  },

  roleHeaderTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "900",
  },

  systemBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.primaryLight,
  },

  systemBadgeText: {
    color: colors.primary,
    fontSize: 7,
    fontWeight: "900",
  },

  roleHeaderDescription: {
    marginTop: 5,
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 16,
  },

  roleToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  roleToggleTitle: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },

  roleToggleDescription: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 8,
  },

  permissionsCard: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  permissionsHeader: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },

  permissionsTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "900",
  },

  permissionsDescription: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 14,
  },

  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },

  tableHeaderModule: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "900",
  },

  tableHeaderAccess: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "900",
  },

  permissionRow: {
    minHeight: 78,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },

  permissionModule: {
    flex: 1,
    minWidth: 220,
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

  disabledAccessButton: {
    opacity: 0.75,
  },

  accessButtonText: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: "800",
  },

  selectedAccessButtonText: {
    color: colors.white,
  },

  disabledAccessButtonText: {
    color: colors.textMuted,
  },

  permissionDivider: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.border,
  },

  permissionLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  legendItem: {
    flex: 1,
    minWidth: 190,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  legendIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
  },

  legendText: {
    flex: 1,
  },

  legendLabel: {
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "900",
  },

  legendDescription: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 8,
    lineHeight: 13,
  },
});
