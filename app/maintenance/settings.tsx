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
  Snackbar,
  Switch,
  TextInput,
} from "react-native-paper";
import Animated, {
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";

import InternationalPhoneInput from "@/src/components/InternationalPhoneInput";
import ScreenContainer from "../../src/components/ScreenContainer";
import {
  colors,
  radius,
  spacing,
  typography,
} from "../../src/theme";

type IconName =
  keyof typeof MaterialCommunityIcons.glyphMap;

type SettingsSection =
  | "Profile"
  | "Business"
  | "Notifications"
  | "Security";

const sections: {
  id: SettingsSection;
  label: string;
  description: string;
  icon: IconName;
}[] = [
  {
    id: "Profile",
    label: "Profile",
    description: "Personal and contact details",
    icon: "account-outline",
  },
  {
    id: "Business",
    label: "Business",
    description: "Provider company information",
    icon: "office-building-outline",
  },
  {
    id: "Notifications",
    label: "Notifications",
    description: "Message and job alerts",
    icon: "bell-outline",
  },
  {
    id: "Security",
    label: "Security",
    description: "Password and account access",
    icon: "shield-lock-outline",
  },
];

export default function MaintenanceSettingsScreen() {
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1000;
  const isTablet = width >= 700;
  const isSmallPhone = width < 390;

  const [selectedSection, setSelectedSection] =
    useState<SettingsSection>("Profile");

  const [fullName, setFullName] =
    useState("Martin Cooper");
  const [email, setEmail] =
    useState("martin@martinplumbing.co.uk");
  const [phone, setPhone] =
    useState("07123 456789");
  const [address, setAddress] =
    useState("15 Riverside Road, Leeds");
  const [postcode, setPostcode] =
    useState("LS10 3AB");

  const [companyName, setCompanyName] =
    useState("Martin Plumbing");
  const [registrationNumber, setRegistrationNumber] =
    useState("MP-458921");
  const [speciality, setSpeciality] =
    useState("Plumbing and Heating");
  const [serviceArea, setServiceArea] =
    useState("Leeds, Bradford and Wakefield");
  const [yearsExperience, setYearsExperience] =
    useState("12");

  const [jobAlerts, setJobAlerts] = useState(true);
  const [messageAlerts, setMessageAlerts] =
    useState(true);
  const [appointmentAlerts, setAppointmentAlerts] =
    useState(true);
  const [emailUpdates, setEmailUpdates] =
    useState(false);
  const [smsUpdates, setSmsUpdates] = useState(true);

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

  const [saving, setSaving] = useState(false);
  const [snackbarVisible, setSnackbarVisible] =
    useState(false);
  const [snackbarMessage, setSnackbarMessage] =
    useState("");

  const showMessage = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleSaveProfile = () => {
    if (!fullName.trim()) {
      showMessage("Please enter your full name.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      showMessage("Please enter a valid email address.");
      return;
    }

    if (!phone.trim()) {
      showMessage("Please enter your phone number.");
      return;
    }

    setSaving(true);

    setTimeout(() => {
      setSaving(false);
      showMessage("Profile details saved successfully.");
    }, 700);
  };

  const handleSaveBusiness = () => {
    if (!companyName.trim()) {
      showMessage("Please enter the company name.");
      return;
    }

    if (!speciality.trim()) {
      showMessage("Please enter your speciality.");
      return;
    }

    setSaving(true);

    setTimeout(() => {
      setSaving(false);
      showMessage("Business information saved successfully.");
    }, 700);
  };

  const handleSaveNotifications = () => {
    setSaving(true);

    setTimeout(() => {
      setSaving(false);
      showMessage(
        "Notification preferences saved successfully."
      );
    }, 600);
  };

  const handleChangePassword = () => {
    if (!currentPassword) {
      showMessage("Please enter your current password.");
      return;
    }

    if (newPassword.length < 8) {
      showMessage(
        "The new password must contain at least 8 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage("The new passwords do not match.");
      return;
    }

    setSaving(true);

    setTimeout(() => {
      setSaving(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showMessage("Password changed successfully.");
    }, 700);
  };

  const handleLogout = () => {
    router.replace(
      "/auth/maintenance/login" as never
    );
  };

  return (
    <ScreenContainer
      scrollable
      contentStyle={styles.screenContent}
    >
      <View style={styles.page}>
        <Animated.View
          entering={FadeInUp.duration(450)}
          style={styles.header}
        >
          <Pressable
            style={styles.brandRow}
            onPress={() =>
              router.replace(
                "/maintenance/dashboard" as never
              )
            }
          >
            <View style={styles.brandLogo}>
              <MaterialCommunityIcons
                name="home-city-outline"
                size={27}
                color={colors.white}
              />
            </View>

            <View>
              <Text style={styles.brandName}>
                TENUREEX
              </Text>

              <Text style={styles.brandSubtitle}>
                Maintenance Provider
              </Text>
            </View>
          </Pressable>

          <View style={styles.headerActions}>
            <Pressable
              style={styles.headerButton}
              onPress={() =>
                router.push(
                  "/maintenance/messages" as never
                )
              }
            >
              <MaterialCommunityIcons
                name="message-text-outline"
                size={20}
                color={colors.textPrimary}
              />

              {isTablet ? (
                <Text style={styles.headerButtonText}>
                  Messages
                </Text>
              ) : null}
            </Pressable>

            <Pressable
              style={styles.headerButton}
              onPress={() =>
                router.replace(
                  "/maintenance/dashboard" as never
                )
              }
            >
              <MaterialCommunityIcons
                name="view-dashboard-outline"
                size={20}
                color={colors.textPrimary}
              />

              {isTablet ? (
                <Text style={styles.headerButtonText}>
                  Dashboard
                </Text>
              ) : null}
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(80).duration(450)}
          style={styles.backRow}
        >
          <Pressable
            style={styles.backButton}
            onPress={() =>
              router.replace(
                "/maintenance/dashboard" as never
              )
            }
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={18}
              color={colors.primary}
            />

            <Text style={styles.backText}>
              Dashboard
            </Text>
          </Pressable>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(120).duration(450)}
          style={styles.pageHeading}
        >
          <View style={styles.headingText}>
            <Text style={styles.eyebrow}>
              ACCOUNT MANAGEMENT
            </Text>

            <Text
              style={[
                styles.pageTitle,
                isSmallPhone && styles.smallPageTitle,
              ]}
            >
              Settings
            </Text>

            <Text style={styles.pageDescription}>
              Manage your provider profile, business
              information, notifications and account
              security.
            </Text>
          </View>

          <View style={styles.verificationBadge}>
            <MaterialCommunityIcons
              name="check-decagram"
              size={21}
              color="#277A46"
            />

            <View>
              <Text style={styles.verificationTitle}>
                Verified provider
              </Text>

              <Text style={styles.verificationText}>
                Account verification complete
              </Text>
            </View>
          </View>
        </Animated.View>

        <View
          style={[
            styles.settingsLayout,
            isDesktop && styles.desktopSettingsLayout,
          ]}
        >
          <Animated.View
            entering={FadeInDown.delay(160).duration(450)}
            style={[
              styles.sidebar,
              !isDesktop && styles.mobileSidebar,
            ]}
          >
            <View style={styles.profileSummary}>
              <Avatar.Text
                size={64}
                label="MP"
                style={styles.profileAvatar}
                labelStyle={styles.profileAvatarLabel}
              />

              <View style={styles.profileSummaryText}>
                <Text style={styles.profileName}>
                  Martin Plumbing
                </Text>

                <Text style={styles.profileRole}>
                  Maintenance Provider
                </Text>

                <View style={styles.verifiedRow}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={14}
                    color="#277A46"
                  />

                  <Text style={styles.verifiedText}>
                    Verified
                  </Text>
                </View>
              </View>
            </View>

            <Divider style={styles.sidebarDivider} />

            <View style={styles.navigationList}>
              {sections.map((section) => (
                <Pressable
                  key={section.id}
                  onPress={() =>
                    setSelectedSection(section.id)
                  }
                  style={({ pressed }) => [
                    styles.navigationItem,
                    selectedSection === section.id &&
                      styles.activeNavigationItem,
                    pressed &&
                      styles.pressedNavigationItem,
                  ]}
                >
                  <View
                    style={[
                      styles.navigationIcon,
                      selectedSection === section.id &&
                        styles.activeNavigationIcon,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={section.icon}
                      size={21}
                      color={
                        selectedSection === section.id
                          ? colors.white
                          : colors.primary
                      }
                    />
                  </View>

                  <View style={styles.navigationText}>
                    <Text
                      style={[
                        styles.navigationLabel,
                        selectedSection === section.id &&
                          styles.activeNavigationLabel,
                      ]}
                    >
                      {section.label}
                    </Text>

                    <Text
                      style={
                        styles.navigationDescription
                      }
                    >
                      {section.description}
                    </Text>
                  </View>

                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={19}
                    color={colors.textMuted}
                  />
                </Pressable>
              ))}
            </View>

            <Divider style={styles.sidebarDivider} />

            <Pressable
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <MaterialCommunityIcons
                name="logout"
                size={20}
                color="#B42318"
              />

              <Text style={styles.logoutText}>
                Sign out
              </Text>
            </Pressable>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(220).duration(450)}
            style={styles.contentCard}
          >
            {selectedSection === "Profile" ? (
              <ProfileSettings
                fullName={fullName}
                setFullName={setFullName}
                email={email}
                setEmail={setEmail}
                phone={phone}
                setPhone={setPhone}
                address={address}
                setAddress={setAddress}
                postcode={postcode}
                setPostcode={setPostcode}
                saving={saving}
                onSave={handleSaveProfile}
                isTablet={isTablet}
              />
            ) : null}

            {selectedSection === "Business" ? (
              <BusinessSettings
                companyName={companyName}
                setCompanyName={setCompanyName}
                registrationNumber={
                  registrationNumber
                }
                setRegistrationNumber={
                  setRegistrationNumber
                }
                speciality={speciality}
                setSpeciality={setSpeciality}
                serviceArea={serviceArea}
                setServiceArea={setServiceArea}
                yearsExperience={yearsExperience}
                setYearsExperience={
                  setYearsExperience
                }
                saving={saving}
                onSave={handleSaveBusiness}
                isTablet={isTablet}
              />
            ) : null}

            {selectedSection === "Notifications" ? (
              <NotificationSettings
                jobAlerts={jobAlerts}
                setJobAlerts={setJobAlerts}
                messageAlerts={messageAlerts}
                setMessageAlerts={
                  setMessageAlerts
                }
                appointmentAlerts={
                  appointmentAlerts
                }
                setAppointmentAlerts={
                  setAppointmentAlerts
                }
                emailUpdates={emailUpdates}
                setEmailUpdates={setEmailUpdates}
                smsUpdates={smsUpdates}
                setSmsUpdates={setSmsUpdates}
                saving={saving}
                onSave={
                  handleSaveNotifications
                }
              />
            ) : null}

            {selectedSection === "Security" ? (
              <SecuritySettings
                currentPassword={currentPassword}
                setCurrentPassword={
                  setCurrentPassword
                }
                newPassword={newPassword}
                setNewPassword={setNewPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={
                  setConfirmPassword
                }
                showCurrentPassword={
                  showCurrentPassword
                }
                setShowCurrentPassword={
                  setShowCurrentPassword
                }
                showNewPassword={
                  showNewPassword
                }
                setShowNewPassword={
                  setShowNewPassword
                }
                showConfirmPassword={
                  showConfirmPassword
                }
                setShowConfirmPassword={
                  setShowConfirmPassword
                }
                saving={saving}
                onSave={handleChangePassword}
                onLogout={handleLogout}
              />
            ) : null}
          </Animated.View>
        </View>
      </View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() =>
          setSnackbarVisible(false)
        }
        duration={3200}
        action={{
          label: "Close",
          onPress: () =>
            setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </ScreenContainer>
  );
}

function ProfileSettings({
  fullName,
  setFullName,
  email,
  setEmail,
  phone,
  setPhone,
  address,
  setAddress,
  postcode,
  setPostcode,
  saving,
  onSave,
  isTablet,
}: {
  fullName: string;
  setFullName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
  address: string;
  setAddress: (value: string) => void;
  postcode: string;
  setPostcode: (value: string) => void;
  saving: boolean;
  onSave: () => void;
  isTablet: boolean;
}) {
  return (
    <>
      <SectionHeader
        icon="account-outline"
        title="Personal profile"
        description="Update your personal and contact details."
      />

      <Divider style={styles.contentDivider} />

      <View style={styles.photoSection}>
        <Avatar.Text
          size={78}
          label="MC"
          style={styles.largeAvatar}
          labelStyle={styles.largeAvatarLabel}
        />

        <View style={styles.photoText}>
          <Text style={styles.photoTitle}>
            Profile photograph
          </Text>

          <Text style={styles.photoDescription}>
            Upload a clear photograph for landlords and
            tenants to recognise you.
          </Text>

          <View style={styles.photoActions}>
            <Button
              mode="outlined"
              icon="camera-outline"
              onPress={() => {}}
              textColor={colors.primary}
              style={styles.secondaryButton}
            >
              Change photo
            </Button>

            <Button
              mode="text"
              onPress={() => {}}
              textColor="#B42318"
            >
              Remove
            </Button>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.formRow,
          !isTablet && styles.mobileFormRow,
        ]}
      >
        <TextInput
          mode="outlined"
          label="Full name"
          value={fullName}
          onChangeText={setFullName}
          left={
            <TextInput.Icon icon="account-outline" />
          }
          outlineColor={colors.border}
          activeOutlineColor={colors.primary}
          style={[styles.input, styles.rowInput]}
        />

        <TextInput
          mode="outlined"
          label="Email address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          left={
            <TextInput.Icon icon="email-outline" />
          }
          outlineColor={colors.border}
          activeOutlineColor={colors.primary}
          style={[styles.input, styles.rowInput]}
        />
      </View>

      <View
        style={[
          styles.formRow,
          !isTablet && styles.mobileFormRow,
        ]}
      >
        <InternationalPhoneInput
          label="Phone number"
          value={phone}
          onChangeText={setPhone}
          style={styles.rowInput}
        />

        <TextInput
          mode="outlined"
          label="Postcode"
          value={postcode}
          onChangeText={setPostcode}
          autoCapitalize="characters"
          left={
            <TextInput.Icon
              icon="map-marker-outline"
            />
          }
          outlineColor={colors.border}
          activeOutlineColor={colors.primary}
          style={[styles.input, styles.rowInput]}
        />
      </View>

      <TextInput
        mode="outlined"
        label="Address"
        value={address}
        onChangeText={setAddress}
        multiline
        numberOfLines={3}
        left={
          <TextInput.Icon icon="home-outline" />
        }
        outlineColor={colors.border}
        activeOutlineColor={colors.primary}
        style={styles.input}
      />

      <View style={styles.saveRow}>
        <Button
          mode="contained"
          icon="content-save-outline"
          loading={saving}
          disabled={saving}
          onPress={onSave}
          buttonColor={colors.primary}
          style={styles.primaryButton}
        >
          Save profile
        </Button>
      </View>
    </>
  );
}

function BusinessSettings({
  companyName,
  setCompanyName,
  registrationNumber,
  setRegistrationNumber,
  speciality,
  setSpeciality,
  serviceArea,
  setServiceArea,
  yearsExperience,
  setYearsExperience,
  saving,
  onSave,
  isTablet,
}: {
  companyName: string;
  setCompanyName: (value: string) => void;
  registrationNumber: string;
  setRegistrationNumber: (value: string) => void;
  speciality: string;
  setSpeciality: (value: string) => void;
  serviceArea: string;
  setServiceArea: (value: string) => void;
  yearsExperience: string;
  setYearsExperience: (value: string) => void;
  saving: boolean;
  onSave: () => void;
  isTablet: boolean;
}) {
  return (
    <>
      <SectionHeader
        icon="office-building-outline"
        title="Business information"
        description="Manage your provider company details and service coverage."
      />

      <Divider style={styles.contentDivider} />

      <View style={styles.businessNotice}>
        <MaterialCommunityIcons
          name="check-decagram"
          size={24}
          color="#277A46"
        />

        <View style={styles.flex}>
          <Text style={styles.businessNoticeTitle}>
            Verified business
          </Text>

          <Text
            style={styles.businessNoticeDescription}
          >
            Your maintenance provider business has been
            verified by TenureEx.
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.formRow,
          !isTablet && styles.mobileFormRow,
        ]}
      >
        <TextInput
          mode="outlined"
          label="Company name"
          value={companyName}
          onChangeText={setCompanyName}
          left={
            <TextInput.Icon
              icon="office-building-outline"
            />
          }
          outlineColor={colors.border}
          activeOutlineColor={colors.primary}
          style={[styles.input, styles.rowInput]}
        />

        <TextInput
          mode="outlined"
          label="Registration number"
          value={registrationNumber}
          onChangeText={setRegistrationNumber}
          left={
            <TextInput.Icon
              icon="card-account-details-outline"
            />
          }
          outlineColor={colors.border}
          activeOutlineColor={colors.primary}
          style={[styles.input, styles.rowInput]}
        />
      </View>

      <View
        style={[
          styles.formRow,
          !isTablet && styles.mobileFormRow,
        ]}
      >
        <TextInput
          mode="outlined"
          label="Speciality"
          value={speciality}
          onChangeText={setSpeciality}
          left={
            <TextInput.Icon icon="tools" />
          }
          outlineColor={colors.border}
          activeOutlineColor={colors.primary}
          style={[styles.input, styles.rowInput]}
        />

        <TextInput
          mode="outlined"
          label="Years of experience"
          value={yearsExperience}
          onChangeText={setYearsExperience}
          keyboardType="number-pad"
          left={
            <TextInput.Icon
              icon="calendar-star"
            />
          }
          outlineColor={colors.border}
          activeOutlineColor={colors.primary}
          style={[styles.input, styles.rowInput]}
        />
      </View>

      <TextInput
        mode="outlined"
        label="Service area"
        value={serviceArea}
        onChangeText={setServiceArea}
        multiline
        numberOfLines={3}
        left={
          <TextInput.Icon
            icon="map-marker-radius-outline"
          />
        }
        outlineColor={colors.border}
        activeOutlineColor={colors.primary}
        style={styles.input}
      />

      <View style={styles.documentsCard}>
        <View style={styles.documentsHeader}>
          <View style={styles.documentIcon}>
            <MaterialCommunityIcons
              name="file-certificate-outline"
              size={23}
              color={colors.primary}
            />
          </View>

          <View style={styles.flex}>
            <Text style={styles.documentsTitle}>
              Verification documents
            </Text>

            <Text
              style={styles.documentsDescription}
            >
              Insurance and certification records
            </Text>
          </View>
        </View>

        <DocumentRow
          title="Public liability insurance"
          status="Verified"
          date="Expires 18 March 2027"
        />

        <DocumentRow
          title="Gas Safe registration"
          status="Verified"
          date="Expires 8 November 2026"
        />

        <Button
          mode="outlined"
          icon="upload-outline"
          onPress={() => {}}
          textColor={colors.primary}
          style={styles.uploadButton}
        >
          Upload document
        </Button>
      </View>

      <View style={styles.saveRow}>
        <Button
          mode="contained"
          icon="content-save-outline"
          loading={saving}
          disabled={saving}
          onPress={onSave}
          buttonColor={colors.primary}
          style={styles.primaryButton}
        >
          Save business details
        </Button>
      </View>
    </>
  );
}

function NotificationSettings({
  jobAlerts,
  setJobAlerts,
  messageAlerts,
  setMessageAlerts,
  appointmentAlerts,
  setAppointmentAlerts,
  emailUpdates,
  setEmailUpdates,
  smsUpdates,
  setSmsUpdates,
  saving,
  onSave,
}: {
  jobAlerts: boolean;
  setJobAlerts: (value: boolean) => void;
  messageAlerts: boolean;
  setMessageAlerts: (value: boolean) => void;
  appointmentAlerts: boolean;
  setAppointmentAlerts: (value: boolean) => void;
  emailUpdates: boolean;
  setEmailUpdates: (value: boolean) => void;
  smsUpdates: boolean;
  setSmsUpdates: (value: boolean) => void;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <>
      <SectionHeader
        icon="bell-outline"
        title="Notification preferences"
        description="Choose how you receive maintenance and account updates."
      />

      <Divider style={styles.contentDivider} />

      <Text style={styles.groupTitle}>
        APP NOTIFICATIONS
      </Text>

      <View style={styles.preferenceList}>
        <PreferenceRow
          icon="clipboard-alert-outline"
          title="New job alerts"
          description="Receive a notification when a new maintenance job is assigned."
          value={jobAlerts}
          onValueChange={setJobAlerts}
        />

        <PreferenceRow
          icon="message-text-outline"
          title="Message notifications"
          description="Receive alerts for new tenant, landlord and support messages."
          value={messageAlerts}
          onValueChange={setMessageAlerts}
        />

        <PreferenceRow
          icon="calendar-clock-outline"
          title="Appointment reminders"
          description="Receive reminders before scheduled property visits."
          value={appointmentAlerts}
          onValueChange={setAppointmentAlerts}
        />
      </View>

      <Text style={styles.groupTitle}>
        ADDITIONAL COMMUNICATION
      </Text>

      <View style={styles.preferenceList}>
        <PreferenceRow
          icon="email-outline"
          title="Email updates"
          description="Receive job summaries and account updates by email."
          value={emailUpdates}
          onValueChange={setEmailUpdates}
        />

        <PreferenceRow
          icon="message-processing-outline"
          title="SMS notifications"
          description="Receive urgent job and appointment notifications by SMS."
          value={smsUpdates}
          onValueChange={setSmsUpdates}
        />
      </View>

      <View style={styles.notificationNotice}>
        <MaterialCommunityIcons
          name="information-outline"
          size={21}
          color={colors.primary}
        />

        <Text style={styles.notificationNoticeText}>
          Important safety, legal and account security
          notifications cannot be disabled.
        </Text>
      </View>

      <View style={styles.saveRow}>
        <Button
          mode="contained"
          icon="content-save-outline"
          loading={saving}
          disabled={saving}
          onPress={onSave}
          buttonColor={colors.primary}
          style={styles.primaryButton}
        >
          Save preferences
        </Button>
      </View>
    </>
  );
}

function SecuritySettings({
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  showCurrentPassword,
  setShowCurrentPassword,
  showNewPassword,
  setShowNewPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  saving,
  onSave,
  onLogout,
}: {
  currentPassword: string;
  setCurrentPassword: (value: string) => void;
  newPassword: string;
  setNewPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  showCurrentPassword: boolean;
  setShowCurrentPassword: (value: boolean) => void;
  showNewPassword: boolean;
  setShowNewPassword: (value: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (value: boolean) => void;
  saving: boolean;
  onSave: () => void;
  onLogout: () => void;
}) {
  return (
    <>
      <SectionHeader
        icon="shield-lock-outline"
        title="Account security"
        description="Update your password and review account access."
      />

      <Divider style={styles.contentDivider} />

      <View style={styles.securityNotice}>
        <View style={styles.securityNoticeIcon}>
          <MaterialCommunityIcons
            name="shield-check-outline"
            size={24}
            color={colors.primary}
          />
        </View>

        <View style={styles.flex}>
          <Text style={styles.securityNoticeTitle}>
            Your account is protected
          </Text>

          <Text
            style={styles.securityNoticeDescription}
          >
            Your latest successful login was today at
            8:42 AM.
          </Text>
        </View>
      </View>

      <Text style={styles.groupTitle}>
        CHANGE PASSWORD
      </Text>

      <TextInput
        mode="outlined"
        label="Current password"
        value={currentPassword}
        onChangeText={setCurrentPassword}
        secureTextEntry={!showCurrentPassword}
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
        style={styles.input}
      />

      <TextInput
        mode="outlined"
        label="New password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry={!showNewPassword}
        left={
          <TextInput.Icon
            icon="lock-reset"
          />
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
        style={styles.input}
      />

      <TextInput
        mode="outlined"
        label="Confirm new password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry={!showConfirmPassword}
        left={
          <TextInput.Icon
            icon="lock-check-outline"
          />
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
        style={styles.input}
      />

      <View style={styles.passwordRules}>
        <PasswordRule
          text="At least 8 characters"
          valid={newPassword.length >= 8}
        />

        <PasswordRule
          text="Contains an uppercase letter"
          valid={/[A-Z]/.test(newPassword)}
        />

        <PasswordRule
          text="Contains a number"
          valid={/[0-9]/.test(newPassword)}
        />

        <PasswordRule
          text="Passwords match"
          valid={
            newPassword.length > 0 &&
            newPassword === confirmPassword
          }
        />
      </View>

      <View style={styles.saveRow}>
        <Button
          mode="contained"
          icon="shield-check-outline"
          loading={saving}
          disabled={saving}
          onPress={onSave}
          buttonColor={colors.primary}
          style={styles.primaryButton}
        >
          Change password
        </Button>
      </View>

      <Divider style={styles.contentDivider} />

      <Text style={styles.groupTitle}>
        ACCOUNT ACCESS
      </Text>

      <View style={styles.sessionCard}>
        <View style={styles.sessionIcon}>
          <MaterialCommunityIcons
            name="cellphone"
            size={23}
            color={colors.primary}
          />
        </View>

        <View style={styles.flex}>
          <Text style={styles.sessionTitle}>
            Current device
          </Text>

          <Text style={styles.sessionDescription}>
            Active now · United Kingdom
          </Text>
        </View>

        <View style={styles.activeSessionBadge}>
          <Text style={styles.activeSessionText}>
            Active
          </Text>
        </View>
      </View>

      <View style={styles.dangerZone}>
        <View style={styles.dangerHeader}>
          <MaterialCommunityIcons
            name="alert-outline"
            size={22}
            color="#B42318"
          />

          <View style={styles.flex}>
            <Text style={styles.dangerTitle}>
              Sign out of your account
            </Text>

            <Text style={styles.dangerDescription}>
              You will need your email and password to
              access the provider portal again.
            </Text>
          </View>
        </View>

        <Button
          mode="outlined"
          icon="logout"
          onPress={onLogout}
          textColor="#B42318"
          style={styles.dangerButton}
        >
          Sign out
        </Button>
      </View>
    </>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: IconName;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={24}
          color={colors.primary}
        />
      </View>

      <View style={styles.flex}>
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

function DocumentRow({
  title,
  status,
  date,
}: {
  title: string;
  status: string;
  date: string;
}) {
  return (
    <View style={styles.documentRow}>
      <View style={styles.documentStatusIcon}>
        <MaterialCommunityIcons
          name="check"
          size={15}
          color="#277A46"
        />
      </View>

      <View style={styles.flex}>
        <Text style={styles.documentTitle}>
          {title}
        </Text>

        <Text style={styles.documentDate}>
          {date}
        </Text>
      </View>

      <View style={styles.documentStatusBadge}>
        <Text
          style={styles.documentStatusText}
        >
          {status}
        </Text>
      </View>
    </View>
  );
}

function PreferenceRow({
  icon,
  title,
  description,
  value,
  onValueChange,
}: {
  icon: IconName;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.preferenceRow}>
      <View style={styles.preferenceIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={colors.primary}
        />
      </View>

      <View style={styles.preferenceText}>
        <Text style={styles.preferenceTitle}>
          {title}
        </Text>

        <Text
          style={styles.preferenceDescription}
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

function PasswordRule({
  text,
  valid,
}: {
  text: string;
  valid: boolean;
}) {
  return (
    <View style={styles.passwordRule}>
      <MaterialCommunityIcons
        name={
          valid
            ? "check-circle"
            : "circle-outline"
        }
        size={17}
        color={
          valid ? "#277A46" : colors.textMuted
        }
      />

      <Text
        style={[
          styles.passwordRuleText,
          valid && styles.validPasswordRuleText,
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flexGrow: 1,
  },

  flex: {
    flex: 1,
  },

  page: {
    width: "100%",
    maxWidth: 1440,
    alignSelf: "center",
    paddingVertical: spacing.md,
  },

  header: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  brandLogo: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
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
    fontSize: 9,
    fontWeight: "700",
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  headerButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },

  headerButtonText: {
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "800",
  },

  backRow: {
    marginTop: spacing.lg,
  },

  backButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },

  backText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "900",
  },

  pageHeading: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },

  headingText: {
    flex: 1,
    minWidth: 240,
  },

  eyebrow: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  pageTitle: {
    ...typography.headingMedium,
    marginTop: spacing.sm,
    color: colors.textPrimary,
  },

  smallPageTitle: {
    fontSize: 26,
    lineHeight: 32,
  },

  pageDescription: {
    ...typography.bodyMedium,
    maxWidth: 720,
    marginTop: spacing.sm,
    color: colors.textSecondary,
    lineHeight: 21,
  },

  verificationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: "#E8F7EE",
  },

  verificationTitle: {
    color: "#277A46",
    fontSize: 9,
    fontWeight: "900",
  },

  verificationText: {
    marginTop: 2,
    color: "#437854",
    fontSize: 8,
  },

  settingsLayout: {
    gap: spacing.xl,
  },

  desktopSettingsLayout: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  sidebar: {
    width: 320,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,

    shadowColor: colors.shadow,
    shadowOpacity: 0.6,
    shadowRadius: 13,
    shadowOffset: {
      width: 0,
      height: 6,
    },

    elevation: 2,
  },

  mobileSidebar: {
    width: "100%",
  },

  profileSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  profileAvatar: {
    backgroundColor: colors.primaryLight,
  },

  profileAvatarLabel: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "900",
  },

  profileSummaryText: {
    flex: 1,
  },

  profileName: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "900",
  },

  profileRole: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 8,
  },

  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },

  verifiedText: {
    color: "#277A46",
    fontSize: 8,
    fontWeight: "800",
  },

  sidebarDivider: {
    marginVertical: spacing.lg,
    backgroundColor: colors.border,
  },

  navigationList: {
    gap: spacing.sm,
  },

  navigationItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
  },

  activeNavigationItem: {
    backgroundColor: colors.primaryLight,
  },

  pressedNavigationItem: {
    opacity: 0.75,
  },

  navigationIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
  },

  activeNavigationIcon: {
    backgroundColor: colors.primary,
  },

  navigationText: {
    flex: 1,
  },

  navigationLabel: {
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "900",
  },

  activeNavigationLabel: {
    color: colors.primary,
  },

  navigationDescription: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 7,
  },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: "#FDECEC",
  },

  logoutText: {
    color: "#B42318",
    fontSize: 9,
    fontWeight: "900",
  },

  contentCard: {
    flex: 1,
    minWidth: 0,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,

    shadowColor: colors.shadow,
    shadowOpacity: 0.65,
    shadowRadius: 15,
    shadowOffset: {
      width: 0,
      height: 7,
    },

    elevation: 2,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },

  sectionIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
  },

  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "900",
  },

  sectionDescription: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 16,
  },

  contentDivider: {
    marginVertical: spacing.xl,
    backgroundColor: colors.border,
  },

  photoSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },

  largeAvatar: {
    backgroundColor: colors.primaryLight,
  },

  largeAvatarLabel: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: "900",
  },

  photoText: {
    flex: 1,
    minWidth: 220,
  },

  photoTitle: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "900",
  },

  photoDescription: {
    maxWidth: 600,
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 16,
  },

  photoActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  formRow: {
    flexDirection: "row",
    gap: spacing.md,
  },

  mobileFormRow: {
    flexDirection: "column",
  },

  input: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },

  rowInput: {
    flex: 1,
  },

  saveRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: spacing.md,
  },

  primaryButton: {
    borderRadius: radius.md,
  },

  secondaryButton: {
    borderColor: colors.primary,
    borderRadius: radius.md,
  },

  businessNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: "#E8F7EE",
  },

  businessNoticeTitle: {
    color: "#277A46",
    fontSize: 10,
    fontWeight: "900",
  },

  businessNoticeDescription: {
    marginTop: 4,
    color: "#437854",
    fontSize: 9,
    lineHeight: 15,
  },

  documentsCard: {
    marginTop: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },

  documentsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },

  documentIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: colors.primaryLight,
  },

  documentsTitle: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "900",
  },

  documentsDescription: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 8,
  },

  documentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },

  documentStatusIcon: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#E8F7EE",
  },

  documentTitle: {
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "900",
  },

  documentDate: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 7,
  },

  documentStatusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#E8F7EE",
  },

  documentStatusText: {
    color: "#277A46",
    fontSize: 7,
    fontWeight: "900",
  },

  uploadButton: {
    alignSelf: "flex-start",
    marginTop: spacing.md,
    borderColor: colors.primary,
    borderRadius: radius.md,
  },

  groupTitle: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    color: colors.primary,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  preferenceList: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },

  preferenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },

  preferenceIcon: {
    width: 43,
    height: 43,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
  },

  preferenceText: {
    flex: 1,
  },

  preferenceTitle: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },

  preferenceDescription: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 8,
    lineHeight: 14,
  },

  notificationNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },

  notificationNoticeText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 16,
  },

  securityNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },

  securityNoticeIcon: {
    width: 45,
    height: 45,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: colors.white,
  },

  securityNoticeTitle: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },

  securityNoticeDescription: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 8,
  },

  passwordRules: {
    gap: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },

  passwordRule: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  passwordRuleText: {
    color: colors.textMuted,
    fontSize: 8,
  },

  validPasswordRuleText: {
    color: "#277A46",
    fontWeight: "700",
  },

  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },

  sessionIcon: {
    width: 45,
    height: 45,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: colors.primaryLight,
  },

  sessionTitle: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },

  sessionDescription: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 8,
  },

  activeSessionBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#E8F7EE",
  },

  activeSessionText: {
    color: "#277A46",
    fontSize: 7,
    fontWeight: "900",
  },

  dangerZone: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "#F5C2C0",
    borderRadius: radius.lg,
    backgroundColor: "#FFF7F6",
  },

  dangerHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },

  dangerTitle: {
    color: "#B42318",
    fontSize: 10,
    fontWeight: "900",
  },

  dangerDescription: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 8,
    lineHeight: 15,
  },

  dangerButton: {
    alignSelf: "flex-start",
    marginTop: spacing.md,
    borderColor: "#B42318",
    borderRadius: radius.md,
  },
});