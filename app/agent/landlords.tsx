import InternationalPhoneInput from "@/src/components/InternationalPhoneInput";
import { useCallback, useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Button, Dialog, HelperText, Portal, Snackbar, Text, TextInput } from "react-native-paper";
import { api } from "../../src/api/client";
import { radius, spacing } from "../../src/theme";
import AgentModuleScreen from "./AgentModuleScreen";

type ActiveLandlord = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  status: string;
  propertyCount: number;
  joinedAt: string;
};

type Invitation = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  status: string;
  expiresAt: string;
  createdAt: string;
};

export default function LandlordsScreen() {
  const [landlords, setLandlords] = useState<ActiveLandlord[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/agency-landlords");
      setLandlords(response.data.landlords ?? []);
      setInvitations(response.data.invitations ?? []);
    } catch (error: any) {
      setMessage(error?.response?.data?.message ?? "Could not load landlords.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const reset = () => {
    setFirstName(""); setLastName(""); setEmail(""); setPhone(""); setSubmitted(false);
  };

  const invite = async () => {
    setSubmitted(true);
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!firstName.trim() || !lastName.trim() || !emailValid) return;
    try {
      setSending(true);
      const response = await api.post("/agency-landlords/invite", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
      });
      setMessage(response.data.message ?? "Invitation sent.");
      setDialogVisible(false);
      reset();
      await load();
    } catch (error: any) {
      setMessage(error?.response?.data?.message ?? "Could not send landlord invitation.");
    } finally {
      setSending(false);
    }
  };

  const records = [
    ...landlords.map((landlord) => ({
      id: `landlord-${landlord.id}`,
      title: `${landlord.firstName} ${landlord.lastName}`,
      subtitle: landlord.email,
      detail: `${landlord.phone ?? "No phone"} · ${landlord.propertyCount} properties`,
      status: "Active",
      statusType: "success" as const,
      icon: "account-tie-outline" as const,
    })),
    ...invitations.map((invitation) => ({
      id: `invite-${invitation.id}`,
      title: `${invitation.firstName} ${invitation.lastName}`,
      subtitle: invitation.email,
      detail: `Invitation expires ${new Date(invitation.expiresAt).toLocaleDateString()}`,
      status: "Invited",
      statusType: "warning" as const,
      icon: "email-outline" as const,
    })),
  ];

  return (
    <View style={{ flex: 1 }}>
      <AgentModuleScreen
        pageTitle="Landlords"
        pageSubtitle="Invite landlords by email and manage landlords linked to your agency."
        activePage="Landlords"
        primaryAction="Invite landlord"
        primaryActionIcon="account-plus-outline"
        searchPlaceholder="Search landlords..."
        filterOptions={["All", "Active", "Invited"]}
        onPrimaryAction={() => setDialogVisible(true)}
        emptyMessage={loading ? "Loading landlords..." : "No landlords found."}
        statistics={[
          { label: "Total landlords", value: String(landlords.length), icon: "account-tie-outline" },
          { label: "Active", value: String(landlords.length), icon: "account-check-outline" },
          { label: "Invitations pending", value: String(invitations.length), icon: "email-outline" },
          { label: "Properties managed", value: String(landlords.reduce((sum, x) => sum + x.propertyCount, 0)), icon: "office-building-outline" },
        ]}
        records={records}
      />

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)} style={styles.dialog}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <Dialog.Title>Invite landlord</Dialog.Title>
            <Dialog.ScrollArea style={{ maxHeight: 430 }}>
              <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
                <Text>TenureEx will email a secure invitation link. When the landlord completes registration through that link, they will be connected to your agency.</Text>
                <TextInput mode="outlined" label="First name" value={firstName} onChangeText={setFirstName} error={submitted && !firstName.trim()} />
                <HelperText type="error" visible={submitted && !firstName.trim()}>Enter the first name.</HelperText>
                <TextInput mode="outlined" label="Last name" value={lastName} onChangeText={setLastName} error={submitted && !lastName.trim()} />
                <HelperText type="error" visible={submitted && !lastName.trim()}>Enter the last name.</HelperText>
                <TextInput mode="outlined" label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" error={submitted && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())} />
                <HelperText type="error" visible={submitted && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())}>Enter a valid email.</HelperText>
                <InternationalPhoneInput label="Phone (optional)" value={phone} onChangeText={setPhone} />
              </ScrollView>
            </Dialog.ScrollArea>
            <Dialog.Actions>
              <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
              <Button mode="contained" loading={sending} disabled={sending} onPress={() => void invite()}>Send invitation</Button>
            </Dialog.Actions>
          </KeyboardAvoidingView>
        </Dialog>
      </Portal>
      <Snackbar visible={!!message} onDismiss={() => setMessage("")} duration={4500}>{message}</Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  dialog: { width: 540, maxWidth: "94%", alignSelf: "center", borderRadius: radius.xl },
  form: { padding: spacing.lg, gap: spacing.sm },
});
