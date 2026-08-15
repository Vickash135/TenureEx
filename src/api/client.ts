import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Platform } from "react-native";

/*
|--------------------------------------------------------------------------
| TenureEx Backend URL
|--------------------------------------------------------------------------
|
| WEB:
| http://localhost:3000
|
| iOS Simulator:
| http://localhost:3000
|
| Android Emulator:
| http://10.0.2.2:3000
|
| IMPORTANT:
| When using a REAL iPhone/Android device later, localhost will NOT point
| to your Mac. We will replace it with your Mac's local IP or production
| API URL.
|
*/

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

export const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000,

  headers: {
    "Content-Type": "application/json",
  },
});

/*
|--------------------------------------------------------------------------
| Add JWT automatically
|--------------------------------------------------------------------------
*/

api.interceptors.request.use(
  async (config) => {
    const accessToken =
      await AsyncStorage.getItem(
        "tenureex_access_token",
      );

    if (accessToken) {
      config.headers.Authorization =
        `Bearer ${accessToken}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  },
);

/*
|--------------------------------------------------------------------------
| Authentication Storage
|--------------------------------------------------------------------------
*/

export async function saveAuthTokens(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  await AsyncStorage.multiSet([
    [
      "tenureex_access_token",
      accessToken,
    ],

    [
      "tenureex_refresh_token",
      refreshToken,
    ],
  ]);
}

export async function getAccessToken(): Promise<
  string | null
> {
  return AsyncStorage.getItem(
    "tenureex_access_token",
  );
}

export async function getRefreshToken(): Promise<
  string | null
> {
  return AsyncStorage.getItem(
    "tenureex_refresh_token",
  );
}

export async function clearAuthTokens(): Promise<void> {
  await AsyncStorage.multiRemove([
    "tenureex_access_token",
    "tenureex_refresh_token",
  ]);
}

/*
|--------------------------------------------------------------------------
| User Storage
|--------------------------------------------------------------------------
*/

export async function saveCurrentUser(
  user: unknown,
): Promise<void> {
  await AsyncStorage.setItem(
    "tenureex_current_user",
    JSON.stringify(user),
  );
}

export async function getStoredUser<T = unknown>(): Promise<
  T | null
> {
  const stored =
    await AsyncStorage.getItem(
      "tenureex_current_user",
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

export async function clearAuthSession(): Promise<void> {
  await AsyncStorage.multiRemove([
    "tenureex_access_token",
    "tenureex_refresh_token",
    "tenureex_current_user",
  ]);
}