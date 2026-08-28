import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { Platform } from "react-native";

/*
|--------------------------------------------------------------------------
| TenureEx API client
|--------------------------------------------------------------------------
|
| Each TenureEx portal has its OWN browser/native session:
|
| - Admin
| - Estate Agent
| - Landlord
| - Tenant
| - Maintenance
| - Council / Inspector
|
| This allows multiple roles to remain signed in at the same time in the
| same Chrome profile without one login overwriting another login.
|
| Access tokens are automatically refreshed when they expire.
|
*/

export type SessionRole =
  | "admin"
  | "agent"
  | "landlord"
  | "tenant"
  | "maintenance"
  | "council";

type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  expiresIn?: number;
};

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _tenureExRetry?: boolean;
  _tenureExRole?: SessionRole;
};

const getBaseURL = (): string => {
  const configuredUrl =
    process.env.EXPO_PUBLIC_API_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, "");
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:3000/api/v1";
  }

  return "http://localhost:3000/api/v1";
};

const API_BASE_URL = getBaseURL();

/*
|--------------------------------------------------------------------------
| Role detection
|--------------------------------------------------------------------------
*/

function roleFromUserType(
  userType?: string | null,
): SessionRole | null {
  switch (userType) {
    case "TENUREEX_ADMIN":
    case "TENUREEX_STAFF":
      return "admin";

    case "ESTATE_AGENT":
      return "agent";

    case "LANDLORD":
      return "landlord";

    case "TENANT":
      return "tenant";

    case "MAINTENANCE_PROVIDER":
    case "MAINTENANCE":
      return "maintenance";

    case "COUNCIL_INSPECTOR":
    case "COUNCIL":
      return "council";

    default:
      return null;
  }
}

function roleFromPathname(
  pathname?: string | null,
): SessionRole | null {
  if (!pathname) {
    return null;
  }

  const path = pathname.toLowerCase();

  if (
    path.startsWith("/admin") ||
    path.startsWith("/auth/admin")
  ) {
    return "admin";
  }

  if (
    path.startsWith("/agent") ||
    path.startsWith("/auth/agent")
  ) {
    return "agent";
  }

  if (
    path.startsWith("/landlord") ||
    path.startsWith("/auth/landlord")
  ) {
    return "landlord";
  }

  if (
    path.startsWith("/tenant") ||
    path.startsWith("/auth/tenant")
  ) {
    return "tenant";
  }

  if (
    path.startsWith("/maintenance") ||
    path.startsWith("/auth/maintenance")
  ) {
    return "maintenance";
  }

  if (
    path.startsWith("/council") ||
    path.startsWith("/auth/council")
  ) {
    return "council";
  }

  return null;
}

function getBrowserPathname(): string | null {
  if (
    Platform.OS === "web" &&
    typeof window !== "undefined"
  ) {
    return window.location.pathname;
  }

  return null;
}

async function getLastSessionRole(): Promise<SessionRole | null> {
  const role = await AsyncStorage.getItem(
    "tenureex_last_session_role",
  );

  if (
    role === "admin" ||
    role === "agent" ||
    role === "landlord" ||
    role === "tenant" ||
    role === "maintenance" ||
    role === "council"
  ) {
    return role;
  }

  return null;
}

async function resolveSessionRole(
  explicitRole?: SessionRole | null,
): Promise<SessionRole | null> {
  if (explicitRole) {
    return explicitRole;
  }

  const pathRole = roleFromPathname(
    getBrowserPathname(),
  );

  if (pathRole) {
    return pathRole;
  }

  return getLastSessionRole();
}

/*
|--------------------------------------------------------------------------
| Role-specific storage keys
|--------------------------------------------------------------------------
*/

function accessTokenKey(role: SessionRole): string {
  return `tenureex_${role}_access_token`;
}

function refreshTokenKey(role: SessionRole): string {
  return `tenureex_${role}_refresh_token`;
}

function currentUserKey(role: SessionRole): string {
  return `tenureex_${role}_current_user`;
}

/*
|--------------------------------------------------------------------------
| Axios client
|--------------------------------------------------------------------------
*/

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

/*
|--------------------------------------------------------------------------
| Save / read role-specific auth tokens
|--------------------------------------------------------------------------
*/

export async function saveAuthTokens(
  accessToken: string,
  refreshToken: string,
  role?: SessionRole,
): Promise<void> {
  const resolvedRole =
    await resolveSessionRole(role);

  if (!resolvedRole) {
    throw new Error(
      "Could not determine which TenureEx portal should store this session.",
    );
  }

  await AsyncStorage.multiSet([
    [accessTokenKey(resolvedRole), accessToken],
    [refreshTokenKey(resolvedRole), refreshToken],
    ["tenureex_last_session_role", resolvedRole],
  ]);
}

export async function getAccessToken(
  role?: SessionRole,
): Promise<string | null> {
  const resolvedRole =
    await resolveSessionRole(role);

  if (!resolvedRole) {
    return null;
  }

  return AsyncStorage.getItem(
    accessTokenKey(resolvedRole),
  );
}

export async function getRefreshToken(
  role?: SessionRole,
): Promise<string | null> {
  const resolvedRole =
    await resolveSessionRole(role);

  if (!resolvedRole) {
    return null;
  }

  return AsyncStorage.getItem(
    refreshTokenKey(resolvedRole),
  );
}

export async function clearAuthTokens(
  role?: SessionRole,
): Promise<void> {
  const resolvedRole =
    await resolveSessionRole(role);

  if (!resolvedRole) {
    return;
  }

  await AsyncStorage.multiRemove([
    accessTokenKey(resolvedRole),
    refreshTokenKey(resolvedRole),
  ]);
}

/*
|--------------------------------------------------------------------------
| Save / read role-specific current user
|--------------------------------------------------------------------------
*/

export async function saveCurrentUser(
  user: unknown,
  role?: SessionRole,
): Promise<void> {
  const userType =
    typeof user === "object" &&
    user !== null &&
    "userType" in user
      ? String(
          (user as { userType?: unknown })
            .userType ?? "",
        )
      : null;

  const resolvedRole =
    role ??
    roleFromUserType(userType) ??
    (await resolveSessionRole());

  if (!resolvedRole) {
    throw new Error(
      "Could not determine which TenureEx portal should store this user.",
    );
  }

  await AsyncStorage.multiSet([
    [
      currentUserKey(resolvedRole),
      JSON.stringify(user),
    ],
    ["tenureex_last_session_role", resolvedRole],
  ]);
}

export async function getStoredUser<T = unknown>(
  role?: SessionRole,
): Promise<T | null> {
  const resolvedRole =
    await resolveSessionRole(role);

  if (!resolvedRole) {
    return null;
  }

  const stored = await AsyncStorage.getItem(
    currentUserKey(resolvedRole),
  );

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as T;
  } catch {
    return null;
  }
}

/*
|--------------------------------------------------------------------------
| Clear ONLY the current portal session
|--------------------------------------------------------------------------
|
| IMPORTANT:
| Signing out of Landlord does NOT sign out Admin or Estate Agent.
|
*/

export async function clearAuthSession(
  role?: SessionRole,
): Promise<void> {
  const resolvedRole =
    await resolveSessionRole(role);

  if (!resolvedRole) {
    return;
  }

  await AsyncStorage.multiRemove([
    accessTokenKey(resolvedRole),
    refreshTokenKey(resolvedRole),
    currentUserKey(resolvedRole),
  ]);
}

/*
|--------------------------------------------------------------------------
| Clear every TenureEx session
|--------------------------------------------------------------------------
|
| Use this only if you deliberately want to sign out every role.
|
*/

export async function clearAllAuthSessions(): Promise<void> {
  const roles: SessionRole[] = [
    "admin",
    "agent",
    "landlord",
    "tenant",
    "maintenance",
    "council",
  ];

  await AsyncStorage.multiRemove([
    ...roles.flatMap((role) => [
      accessTokenKey(role),
      refreshTokenKey(role),
      currentUserKey(role),
    ]),
    "tenureex_last_session_role",

    // Remove the OLD shared keys as part of migration.
    "tenureex_access_token",
    "tenureex_refresh_token",
    "tenureex_current_user",
  ]);
}

/*
|--------------------------------------------------------------------------
| Automatic Authorization header
|--------------------------------------------------------------------------
*/

api.interceptors.request.use(
  async (
    config: RetryableRequestConfig,
  ) => {
    /*
    |--------------------------------------------------------------------------
    | FormData / multipart handling
    |--------------------------------------------------------------------------
    |
    | The Axios instance normally defaults to application/json.
    | For FormData, remove Content-Type so the browser/native adapter can
    | generate the correct multipart boundary automatically. If the boundary
    | is missing, Nest/Multer receives zero files even when the UI shows a
    | selected image.
    |
    */
    if (
      typeof FormData !== "undefined" &&
      config.data instanceof FormData
    ) {
      const headers = config.headers as any;

      if (typeof headers?.delete === "function") {
        headers.delete("Content-Type");
        headers.delete("content-type");
      } else if (headers) {
        delete headers["Content-Type"];
        delete headers["content-type"];
      }
    }

    const role =
      config._tenureExRole ??
      (await resolveSessionRole());

    if (role) {
      config._tenureExRole = role;

      const accessToken =
        await AsyncStorage.getItem(
          accessTokenKey(role),
        );

      if (accessToken) {
        config.headers.Authorization =
          `Bearer ${accessToken}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

/*
|--------------------------------------------------------------------------
| Automatic access-token refresh
|--------------------------------------------------------------------------
|
| Your backend access token expires after 15 minutes.
| Your backend already supports POST /auth/refresh and rotates refresh
| tokens. When an API call receives 401, this interceptor silently:
|
| 1. reads the refresh token for THIS portal
| 2. requests a new access + refresh token
| 3. stores the new pair
| 4. retries the failed API request once
|
*/

const refreshPromises = new Map<
  SessionRole,
  Promise<string>
>();

async function refreshAccessToken(
  role: SessionRole,
): Promise<string> {
  const existingPromise =
    refreshPromises.get(role);

  if (existingPromise) {
    return existingPromise;
  }

  const refreshPromise = (async () => {
    const refreshToken =
      await AsyncStorage.getItem(
        refreshTokenKey(role),
      );

    if (!refreshToken) {
      throw new Error(
        "No refresh token is available for this portal.",
      );
    }

    const response =
      await axios.post<RefreshResponse>(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken },
        {
          timeout: 15000,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

    await AsyncStorage.multiSet([
      [
        accessTokenKey(role),
        response.data.accessToken,
      ],
      [
        refreshTokenKey(role),
        response.data.refreshToken,
      ],
      ["tenureex_last_session_role", role],
    ]);

    return response.data.accessToken;
  })();

  refreshPromises.set(
    role,
    refreshPromise,
  );

  try {
    return await refreshPromise;
  } finally {
    refreshPromises.delete(role);
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest =
      error.config as
        | RetryableRequestConfig
        | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._tenureExRetry
    ) {
      return Promise.reject(error);
    }

    const requestUrl =
      originalRequest.url ?? "";

    // Never try to refresh login/refresh calls themselves.
    if (
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/admin/login") ||
      requestUrl.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    const role =
      originalRequest._tenureExRole ??
      (await resolveSessionRole());

    if (!role) {
      return Promise.reject(error);
    }

    originalRequest._tenureExRetry = true;
    originalRequest._tenureExRole = role;

    try {
      const newAccessToken =
        await refreshAccessToken(role);

      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;

      return api(originalRequest);
    } catch {
      // Refresh token is missing, revoked or expired.
      // Only this portal is signed out.
      await clearAuthSession(role);

      return Promise.reject(error);
    }
  },
);
