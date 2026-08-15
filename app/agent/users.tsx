import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import { router, type Href } from "expo-router";
import {
  useCallback,
  useMemo,
  useState,
} from "react";
import { Alert } from "react-native";

import { api } from "../../src/api/client";

import AgentModuleScreen, {
  type AgentRecord,
  type AgentStatistic,
} from "./AgentModuleScreen";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

type AgencyUserStatus =
  | "Active"
  | "Pending"
  | "Suspended"
  | "Disabled";

type ApiUser = {
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
  createdAt: string;
};

type ApiBranch = {
  id: string;
  name: string;
};

type ApiRole = {
  id: string;
  name: string;
  code: string;
};

type ApiAgencyUserRole = {
  agencyUserId: string;
  roleId: string;
  role: ApiRole;
};

type ApiAgencyUser = {
  id: string;
  agencyId: string;
  userId: string;
  branchId: string | null;
  jobTitle: string | null;
  isPrimary: boolean;
  invitedAt: string | null;
  joinedAt: string | null;
  createdAt: string;
  updatedAt: string;

  user: ApiUser;
  branch: ApiBranch | null;
  roles: ApiAgencyUserRole[];
};

type AgencyUser = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  branch: string;
  role: string;
  status: AgencyUserStatus;
  lastLogin: string;
  isPrimary: boolean;
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function mapStatus(
  status: string,
): AgencyUserStatus {
  switch (status) {
    case "ACTIVE":
      return "Active";

    case "SUSPENDED":
      return "Suspended";

    case "DISABLED":
      return "Disabled";

    default:
      return "Pending";
  }
}

function formatLastLogin(
  value: string | null,
): string {
  if (!value) {
    return "Never signed in";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString();
}

function mapAgencyUser(
  agencyUser: ApiAgencyUser,
): AgencyUser {
  return {
    id: agencyUser.id,
    userId: agencyUser.userId,

    firstName:
      agencyUser.user.firstName,

    lastName:
      agencyUser.user.lastName,

    email:
      agencyUser.user.email,

    phone:
      agencyUser.user.phone ||
      "No phone number",

    jobTitle:
      agencyUser.jobTitle ||
      "Agency staff",

    branch:
      agencyUser.branch?.name ||
      "No branch assigned",

    role:
      agencyUser.roles[0]?.role.name ||
      "No role assigned",

    status:
      mapStatus(
        agencyUser.user.status,
      ),

    lastLogin:
      formatLastLogin(
        agencyUser.user.lastLoginAt,
      ),

    isPrimary:
      agencyUser.isPrimary,
  };
}

function getApiErrorMessage(
  error: unknown,
): string {
  if (axios.isAxiosError(error)) {
    const message =
      error.response?.data?.message;

    if (Array.isArray(message)) {
      return message.join("\n");
    }

    if (
      typeof message === "string"
    ) {
      return message;
    }

    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}

/*
|--------------------------------------------------------------------------
| Screen
|--------------------------------------------------------------------------
*/

export default function UsersScreen() {
  const [users, setUsers] =
    useState<AgencyUser[]>([]);

  const [loading, setLoading] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | Load real agency users
  |--------------------------------------------------------------------------
  */

  const loadUsers =
    useCallback(async () => {
      try {
        setLoading(true);

        const response =
          await api.get<ApiAgencyUser[]>(
            "/agency-users",
          );

        const mappedUsers =
          response.data.map(
            mapAgencyUser,
          );

        setUsers(mappedUsers);
      } catch (error) {
        console.error(
          "Failed to load agency users:",
          error,
        );

        Alert.alert(
          "Unable to load users",
          getApiErrorMessage(error),
        );
      } finally {
        setLoading(false);
      }
    }, []);

  /*
  |--------------------------------------------------------------------------
  | Reload whenever this screen becomes active
  |--------------------------------------------------------------------------
  |
  | This is important because after Add User returns here,
  | the newly-created user will automatically appear.
  |
  */

  useFocusEffect(
    useCallback(() => {
      void loadUsers();
    }, [loadUsers]),
  );

  /*
  |--------------------------------------------------------------------------
  | Statistics
  |--------------------------------------------------------------------------
  */

  const statistics =
    useMemo<AgentStatistic[]>(() => {
      const activeUsers =
        users.filter(
          (user) =>
            user.status ===
            "Active",
        ).length;

      const pendingUsers =
        users.filter(
          (user) =>
            user.status ===
            "Pending",
        ).length;

      const disabledUsers =
        users.filter(
          (user) =>
            user.status ===
              "Disabled" ||
            user.status ===
              "Suspended",
        ).length;

      const administrators =
        users.filter(
          (user) =>
            user.role ===
            "Agency Administrator",
        ).length;

      return [
        {
          label: "Total users",
          value: loading
            ? "..."
            : String(users.length),
          icon:
            "account-multiple-outline",
          helper:
            "All agency staff accounts",
        },
        {
          label: "Active users",
          value: loading
            ? "..."
            : String(activeUsers),
          icon:
            "account-check-outline",
          helper:
            "Users who can access the portal",
        },
        {
          label:
            "Pending invitations",
          value: loading
            ? "..."
            : String(pendingUsers),
          icon:
            "email-alert-outline",
          helper:
            "Waiting for account activation",
        },
        {
          label: "Administrators",
          value: loading
            ? "..."
            : String(
                administrators,
              ),
          icon:
            "shield-account-outline",
          helper:
            `${disabledUsers} disabled or suspended account${
              disabledUsers === 1
                ? ""
                : "s"
            }`,
        },
      ];
    }, [users, loading]);

  /*
  |--------------------------------------------------------------------------
  | Open user
  |--------------------------------------------------------------------------
  */

  const handleOpenUser = (
    userId: string,
  ) => {
    router.push({
      pathname:
        "/agent/user-details",

      params: {
        userId,
      },
    } as never);
  };

  /*
  |--------------------------------------------------------------------------
  | Change status
  |--------------------------------------------------------------------------
  */

  const changeUserStatus =
    async (
      user: AgencyUser,
      status:
        | "ACTIVE"
        | "SUSPENDED"
        | "DISABLED",
    ) => {
      try {
        await api.patch(
          `/agency-users/${user.id}/status`,
          {
            status,
          },
        );

        await loadUsers();

        if (status === "ACTIVE") {
          Alert.alert(
            "User activated",
            `${user.firstName} ${user.lastName} can now access the Estate Agent portal.`,
          );
        }

        if (
          status === "SUSPENDED"
        ) {
          Alert.alert(
            "User suspended",
            `${user.firstName} ${user.lastName}'s access has been suspended.`,
          );
        }

        if (
          status === "DISABLED"
        ) {
          Alert.alert(
            "User disabled",
            `${user.firstName} ${user.lastName}'s account has been disabled.`,
          );
        }
      } catch (error) {
        console.error(
          "Failed to change user status:",
          error,
        );

        Alert.alert(
          "Unable to update user",
          getApiErrorMessage(error),
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Disable user
  |--------------------------------------------------------------------------
  */

  const handleDisableUser = (
    user: AgencyUser,
  ) => {
    /*
     * Primary agency account must not
     * be disabled from this screen.
     */

    if (user.isPrimary) {
      Alert.alert(
        "Primary administrator",
        "The primary Agency Administrator account cannot be disabled from this page.",
      );

      return;
    }

    Alert.alert(
      "Disable user",
      `Are you sure you want to disable ${user.firstName} ${user.lastName}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Disable",
          style: "destructive",
          onPress: () => {
            void changeUserStatus(
              user,
              "DISABLED",
            );
          },
        },
      ],
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Reactivate user
  |--------------------------------------------------------------------------
  */

  const handleActivateUser = (
    user: AgencyUser,
  ) => {
    Alert.alert(
      "Activate user",
      `Restore access for ${user.firstName} ${user.lastName}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Activate",
          onPress: () => {
            void changeUserStatus(
              user,
              "ACTIVE",
            );
          },
        },
      ],
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Pending account
  |--------------------------------------------------------------------------
  */

  const handlePendingUser = (
    user: AgencyUser,
  ) => {
    Alert.alert(
      "Pending account",
      `${user.firstName} ${user.lastName}'s account is still waiting for activation or verification.`,
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Records for AgentModuleScreen
  |--------------------------------------------------------------------------
  */

  const records =
    useMemo<AgentRecord[]>(() => {
      return users.map((user) => {
        const fullName =
          `${user.firstName} ${user.lastName}`;

        let statusType:
          | "success"
          | "warning"
          | "error"
          | "neutral"
          | "primary";

        switch (user.status) {
          case "Active":
            statusType =
              "success";
            break;

          case "Pending":
            statusType =
              "warning";
            break;

          case "Suspended":
            statusType =
              "warning";
            break;

          case "Disabled":
            statusType =
              "error";
            break;

          default:
            statusType =
              "neutral";
        }

        let icon:
          | "shield-account-outline"
          | "account-supervisor-outline"
          | "account-cash-outline"
          | "home-city-outline"
          | "account-outline";

        switch (user.role) {
          case "Agency Administrator":
            icon =
              "shield-account-outline";
            break;

          case "Property Manager":
          case "Lettings Manager":
            icon =
              "account-supervisor-outline";
            break;

          case "Finance Manager":
            icon =
              "account-cash-outline";
            break;

          case "Agency Staff":
            icon =
              "home-city-outline";
            break;

          default:
            icon =
              "account-outline";
        }

        return {
          id: user.id,

          title: fullName,

          subtitle:
            `${user.role} · ${user.branch}`,

          detail:
            `${user.email} · ${user.phone} · Last login: ${user.lastLogin}`,

          status:
            user.status,

          statusType,

          icon,

          onEdit: () =>
            handleOpenUser(
              user.id,
            ),

          onDelete:
            user.status ===
            "Active"
              ? () =>
                  handleDisableUser(
                    user,
                  )
              : user.status ===
                  "Pending"
                ? () =>
                    handlePendingUser(
                      user,
                    )
                : undefined,

          onActivate:
            user.status ===
              "Disabled" ||
            user.status ===
              "Suspended"
              ? () =>
                  handleActivateUser(
                    user,
                  )
              : undefined,
        };
      });
    }, [users]);

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <AgentModuleScreen
      pageTitle="Users"
      pageSubtitle="Manage agency employees, account access, branches and assigned roles."
      activePage="Users"
      primaryAction="Add user"
      primaryActionIcon="account-plus-outline"
      searchPlaceholder="Search by name, email, role or branch..."
      filterOptions={[
        "All",
        "Active",
        "Pending",
        "Suspended",
        "Disabled",
      ]}
      emptyMessage={
        loading
          ? "Loading agency users..."
          : "No agency users match your search."
      }
      statistics={statistics}
      records={records}
      onPrimaryAction={() =>
        router.push(
          "/agent/add-user" as Href,
        )
      }
    />
  );
}