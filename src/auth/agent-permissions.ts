import { MaterialCommunityIcons } from "@expo/vector-icons";
import { type Href } from "expo-router";

export type AgentAccessLevel = "NONE" | "READ" | "WRITE" | "MANAGE";

export type AgentPermission = {
  id: string;
  code: string;
  module: string;
  description: string | null;
  accessLevel: AgentAccessLevel;
};

export type AgentRole = {
  id: string;
  code: string;
  name: string;
  description: string | null;
};

export type AgentCurrentUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  userType: string;
  status: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  lastLoginAt: string | null;
  agency: { id: string; name: string; active: boolean } | null;
  branch: { id: string; name: string } | null;
  jobTitle: string | null;
  isPrimaryAgencyUser: boolean;
  roles: AgentRole[];
  permissions: AgentPermission[];
};

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export type AgentNavigationItem = {
  label: string;
  icon: IconName;
  route: Href;
  permission: string;
};

export const AGENT_NAVIGATION_ITEMS: AgentNavigationItem[] = [
  { label: "Dashboard", icon: "view-dashboard-outline", route: "/agent/dashboard" as Href, permission: "DASHBOARD_VIEW" },
  { label: "Properties", icon: "office-building-outline", route: "/agent/properties" as Href, permission: "PROPERTIES_VIEW" },
  { label: "Landlords", icon: "account-tie-outline", route: "/agent/landlords" as Href, permission: "LANDLORDS_VIEW" },
  { label: "Applicants", icon: "account-search-outline", route: "/agent/applicants" as Href, permission: "APPLICANTS_VIEW" },
  { label: "Tenants", icon: "account-group-outline", route: "/agent/tenants" as Href, permission: "TENANTS_VIEW" },
  { label: "Maintenance", icon: "tools", route: "/agent/maintenance" as Href, permission: "MAINTENANCE_VIEW" },
  { label: "Contractors", icon: "hard-hat", route: "/agent/contractors" as Href, permission: "CONTRACTORS_VIEW" },
  { label: "Compliance", icon: "shield-check-outline", route: "/agent/compliance" as Href, permission: "COMPLIANCE_VIEW" },
  { label: "Council & Inspections", icon: "clipboard-search-outline", route: "/agent/council-inspections" as Href, permission: "COMPLIANCE_VIEW" },
  { label: "Reports", icon: "chart-box-outline", route: "/agent/reports" as Href, permission: "REPORTS_VIEW" },
  { label: "Messages", icon: "message-text-outline", route: "/agent/messages" as Href, permission: "MESSAGES_VIEW" },
  { label: "Users", icon: "account-multiple-outline", route: "/agent/users" as Href, permission: "USERS_VIEW" },
  { label: "Roles & Permissions", icon: "shield-account-outline", route: "/agent/roles-permissions" as Href, permission: "ROLES_VIEW" },
  { label: "Settings", icon: "cog-outline", route: "/agent/settings" as Href, permission: "SETTINGS_VIEW" },
];

export function hasAgentPermission(
  user: AgentCurrentUser | null | undefined,
  permissionCode: string,
): boolean {
  return Boolean(
    user?.permissions?.some(
      (permission) =>
        permission.code === permissionCode &&
        permission.accessLevel !== "NONE",
    ),
  );
}

export function getAllowedAgentNavigation(
  user: AgentCurrentUser | null | undefined,
): AgentNavigationItem[] {
  return AGENT_NAVIGATION_ITEMS.filter((item) =>
    hasAgentPermission(user, item.permission),
  );
}

export function getPageViewPermission(page: string): string | null {
  return AGENT_NAVIGATION_ITEMS.find((item) => item.label === page)?.permission ?? null;
}

export function getPageManagePermission(page: string): string | null {
  const map: Record<string, string> = {
    Properties: "PROPERTIES_MANAGE",
    Landlords: "LANDLORDS_MANAGE",
    Applicants: "APPLICANTS_MANAGE",
    Tenants: "TENANTS_MANAGE",
    Maintenance: "MAINTENANCE_MANAGE",
    Contractors: "CONTRACTORS_MANAGE",
    Compliance: "COMPLIANCE_MANAGE",
    "Council & Inspections": "COMPLIANCE_MANAGE",
    Reports: "REPORTS_MANAGE",
    Messages: "MESSAGES_SEND",
    Users: "USERS_MANAGE",
    "Roles & Permissions": "ROLES_MANAGE",
    Settings: "SETTINGS_MANAGE",
  };
  return map[page] ?? null;
}

export function getPageCreatePermission(page: string): string | null {
  const map: Record<string, string> = {
    Properties: "PROPERTIES_CREATE",
    Users: "USERS_CREATE",
    Landlords: "LANDLORDS_MANAGE",
    Applicants: "APPLICANTS_MANAGE",
    Tenants: "TENANTS_MANAGE",
    Maintenance: "MAINTENANCE_MANAGE",
    Contractors: "CONTRACTORS_MANAGE",
    Compliance: "COMPLIANCE_MANAGE",
    "Council & Inspections": "COMPLIANCE_MANAGE",
    Reports: "REPORTS_MANAGE",
    Messages: "MESSAGES_SEND",
    "Roles & Permissions": "ROLES_MANAGE",
    Settings: "SETTINGS_MANAGE",
  };
  return map[page] ?? null;
}

export function getUserDisplayName(user: AgentCurrentUser | null | undefined): string {
  return user ? `${user.firstName} ${user.lastName}`.trim() : "";
}

export function getUserInitials(user: AgentCurrentUser | null | undefined): string {
  if (!user) return "TX";
  return `${user.firstName?.charAt(0) ?? ""}${user.lastName?.charAt(0) ?? ""}`.toUpperCase() || "TX";
}

export function getPrimaryRoleName(user: AgentCurrentUser | null | undefined): string {
  return user?.roles?.[0]?.name || user?.jobTitle || "Agency User";
}
