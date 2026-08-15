import AsyncStorage from "@react-native-async-storage/async-storage";

const APPLICATION_ID_KEY =
  "tenureex_agent_application_id";

const USER_ID_KEY =
  "tenureex_agent_registration_user_id";

const ONBOARDING_TOKEN_KEY =
  "tenureex_agent_onboarding_token";

const EMAIL_KEY =
  "tenureex_agent_registration_email";

/* =========================================================
   SAVE COMPLETE / PARTIAL SESSION
========================================================= */

export async function saveAgentOnboardingSession(data: {
  applicationId?: string;
  userId?: string;
  onboardingToken?: string;
  email?: string;
}): Promise<void> {
  const values: [string, string][] = [];

  if (data.applicationId) {
    values.push([
      APPLICATION_ID_KEY,
      data.applicationId,
    ]);
  }

  if (data.userId) {
    values.push([
      USER_ID_KEY,
      data.userId,
    ]);
  }

  if (data.onboardingToken) {
    values.push([
      ONBOARDING_TOKEN_KEY,
      data.onboardingToken,
    ]);
  }

  if (data.email) {
    values.push([
      EMAIL_KEY,
      data.email.trim().toLowerCase(),
    ]);
  }

  if (values.length > 0) {
    await AsyncStorage.multiSet(values);
  }
}

/* =========================================================
   SAVE TOKEN
========================================================= */

export async function saveAgentOnboardingToken(
  token: string,
): Promise<void> {
  await AsyncStorage.setItem(
    ONBOARDING_TOKEN_KEY,
    token,
  );
}

/* =========================================================
   GET APPLICATION ID
========================================================= */

export async function getAgentApplicationId(): Promise<
  string | null
> {
  return AsyncStorage.getItem(
    APPLICATION_ID_KEY,
  );
}

/* =========================================================
   GET USER ID
========================================================= */

export async function getAgentRegistrationUserId(): Promise<
  string | null
> {
  return AsyncStorage.getItem(
    USER_ID_KEY,
  );
}

/* =========================================================
   GET TOKEN
========================================================= */

export async function getAgentOnboardingToken(): Promise<
  string | null
> {
  return AsyncStorage.getItem(
    ONBOARDING_TOKEN_KEY,
  );
}

/* =========================================================
   GET EMAIL
========================================================= */

export async function getAgentRegistrationEmail(): Promise<
  string | null
> {
  return AsyncStorage.getItem(
    EMAIL_KEY,
  );
}

/* =========================================================
   GET WHOLE SESSION
========================================================= */

export async function getAgentOnboardingSession() {
  const values =
    await AsyncStorage.multiGet([
      APPLICATION_ID_KEY,
      USER_ID_KEY,
      ONBOARDING_TOKEN_KEY,
      EMAIL_KEY,
    ]);

  const map = Object.fromEntries(values);

  return {
    applicationId:
      map[APPLICATION_ID_KEY] ?? null,

    userId:
      map[USER_ID_KEY] ?? null,

    onboardingToken:
      map[ONBOARDING_TOKEN_KEY] ?? null,

    email:
      map[EMAIL_KEY] ?? null,
  };
}

/* =========================================================
   CLEAR TOKEN ONLY
========================================================= */

export async function clearAgentOnboardingToken(): Promise<void> {
  await AsyncStorage.removeItem(
    ONBOARDING_TOKEN_KEY,
  );
}

/* =========================================================
   CLEAR WHOLE SESSION
========================================================= */

export async function clearAgentOnboardingSession(): Promise<void> {
  await AsyncStorage.multiRemove([
    APPLICATION_ID_KEY,
    USER_ID_KEY,
    ONBOARDING_TOKEN_KEY,
    EMAIL_KEY,
  ]);
}