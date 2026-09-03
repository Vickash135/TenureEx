import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Checkbox,
  Chip,
  Divider,
  HelperText,
  TextInput,
} from "react-native-paper";

import InternationalPhoneInput from "@/src/components/InternationalPhoneInput";
import { api } from "../../../src/api/client";
import { colors, radius, spacing } from "../../../src/theme";

type Agreement = {
  title: string;
  version: string;
  propertyAddress: string;
  monthlyRent: string;
  depositAmount?: string | null;
  terms: string[];
  propertyRules?: {
    petsAllowed?: boolean;
    smokingAllowed?: boolean;
    childrenAllowed?: boolean;
    furnishingStatus?: string | null;
  };
};

type Invitation = {
  invitationId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  property: {
    id: string;
    addressLine1: string;
    addressLine2?: string | null;
    townCity: string;
    county?: string | null;
    postcode: string;
    monthlyRent?: string | number | null;
    depositAmount?: string | number | null;
  };
  agency?: { name?: string | null } | null;
  agreement: Agreement;
};

type FormState = {
  firstName: string;
  lastName: string;
  password: string;
  phone: string;
  dateOfBirth: string;
  currentAddress: string;
  postcode: string;
  identificationType: string;
  identificationFileUrl: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  additionalNotes: string;
  signatureName: string;
};

const emptyForm: FormState = {
  firstName: "",
  lastName: "",
  password: "",
  phone: "",
  dateOfBirth: "",
  currentAddress: "",
  postcode: "",
  identificationType: "",
  identificationFileUrl: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  additionalNotes: "",
  signatureName: "",
};

export default function TenantPropertyInvitationScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const { width } = useWindowDimensions();
  const compact = width < 760;

  const [invite, setInvite] = useState<Invitation | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [documentName, setDocumentName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const setField = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  useEffect(() => {
    if (!token) {
      setError("The tenant invitation link is missing its secure token.");
      setLoadingInvite(false);
      return;
    }

    api
      .get(`/property-workflows/tenant-invitations/${encodeURIComponent(token)}`)
      .then((response) => {
        const data = response.data as Invitation;
        setInvite(data);
        setForm((current) => ({
          ...current,
          firstName: data.firstName || "",
          lastName: data.lastName || "",
        }));
      })
      .catch((requestError: any) => {
        setError(requestError?.response?.data?.message || "Invitation could not be loaded.");
      })
      .finally(() => setLoadingInvite(false));
  }, [token]);

  const propertyAddress = useMemo(() => {
    if (!invite) return "";
    return [
      invite.property.addressLine1,
      invite.property.addressLine2,
      invite.property.townCity,
      invite.property.county,
      invite.property.postcode,
    ]
      .filter(Boolean)
      .join(", ");
  }, [invite]);

  const selectIdentificationDocument = async () => {
    if (!token) return;
    setError("");
    setMessage("");

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/jpeg", "image/png"],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      if (typeof asset.size === "number" && asset.size > 10 * 1024 * 1024) {
        setError("The identification document must be 10 MB or smaller.");
        return;
      }

      const data = new FormData();
      if (Platform.OS === "web" && asset.file) {
        data.append("identificationFile", asset.file);
      } else {
        data.append(
          "identificationFile",
          {
            uri: asset.uri,
            name: asset.name || "tenant-identification",
            type: asset.mimeType || "application/octet-stream",
          } as any,
        );
      }

      setUploadingDocument(true);
      const response = await api.post(
        `/property-workflows/tenant-invitations/${encodeURIComponent(token)}/identification`,
        data,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      setField("identificationFileUrl", response.data.identificationFileUrl);
      setDocumentName(response.data.fileName || asset.name || "Identification document");
      setMessage("Identification document uploaded successfully.");
    } catch (uploadError: any) {
      setError(uploadError?.response?.data?.message || "Unable to upload the identification document.");
    } finally {
      setUploadingDocument(false);
    }
  };

  const submit = async () => {
    if (!token || !invite || !accepted) return;
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await api.post("/property-workflows/tenant-invitations/complete", {
        token,
        ...form,
        acceptedAgreement: true,
        dateOfBirth: form.dateOfBirth || undefined,
        identificationFileUrl: form.identificationFileUrl || undefined,
      });
      setMessage(response.data?.message || "Tenant application submitted for Estate Agent review.");
      setTimeout(() => router.replace("/auth/tenant/login" as never), 1200);
    } catch (submitError: any) {
      const backendMessage = submitError?.response?.data?.message;
      setError(Array.isArray(backendMessage) ? backendMessage.join("\n") : backendMessage || "Unable to submit tenant application.");
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = Boolean(
    invite &&
      accepted &&
      form.firstName.trim() &&
      form.lastName.trim() &&
      form.password.length >= 8 &&
      form.signatureName.trim() &&
      form.identificationType.trim() &&
      form.identificationFileUrl,
  );

  if (loadingInvite) {
    return (
      <View style={styles.loadingPage}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your secure tenant invitation…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <View style={styles.shell}>
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <MaterialCommunityIcons name="home-account" size={34} color={colors.white} />
            </View>
            <View style={styles.heroTextWrap}>
              <Text style={styles.heroEyebrow}>TENANT ONBOARDING</Text>
              <Text style={styles.heroTitle}>Complete your tenancy application</Text>
              <Text style={styles.heroText}>
                Review the property and agreement, upload your identification, sign electronically and send everything to the Estate Agent for approval.
              </Text>
            </View>
          </View>

          {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}
          {message ? <View style={styles.successBox}><Text style={styles.successText}>{message}</Text></View> : null}

          {invite ? (
            <>
              <Card style={styles.card}>
                <Card.Content style={styles.cardContent}>
                  <View style={styles.sectionHeading}>
                    <MaterialCommunityIcons name="home-city-outline" size={24} color={colors.primary} />
                    <View style={styles.sectionHeadingText}>
                      <Text style={styles.sectionTitle}>Property and invitation</Text>
                      <Text style={styles.sectionSubtitle}>This application is linked only to this property.</Text>
                    </View>
                  </View>
                  <Divider />
                  <InfoRow label="Property" value={propertyAddress} />
                  <InfoRow label="Estate Agent" value={invite.agency?.name || "Estate Agent"} />
                  <InfoRow label="Invitation email" value={invite.email} />
                  <View style={styles.moneyRow}>
                    <View style={styles.moneyCard}>
                      <Text style={styles.moneyLabel}>Monthly rent</Text>
                      <Text style={styles.moneyValue}>£{String(invite.property.monthlyRent ?? "—")}</Text>
                    </View>
                    <View style={styles.moneyCard}>
                      <Text style={styles.moneyLabel}>Deposit</Text>
                      <Text style={styles.moneyValue}>{invite.property.depositAmount ? `£${String(invite.property.depositAmount)}` : "Not recorded"}</Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>

              <Card style={styles.card}>
                <Card.Content style={styles.cardContent}>
                  <SectionHeader icon="account-details-outline" title="Your details" subtitle="Complete the information the Estate Agent needs to review." />
                  <View style={[styles.grid, compact && styles.gridCompact]}>
                    <TextInput mode="outlined" label="First name" value={form.firstName} onChangeText={(v) => setField("firstName", v)} style={styles.input} />
                    <TextInput mode="outlined" label="Last name" value={form.lastName} onChangeText={(v) => setField("lastName", v)} style={styles.input} />
                    <InternationalPhoneInput label="Phone" value={form.phone} onChangeText={(v) => setField("phone", v)} style={styles.input} />
                    <TextInput mode="outlined" label="Date of birth (YYYY-MM-DD)" value={form.dateOfBirth} onChangeText={(v) => setField("dateOfBirth", v)} style={styles.input} />
                    <TextInput mode="outlined" label="Current address" value={form.currentAddress} onChangeText={(v) => setField("currentAddress", v)} style={styles.inputWide} />
                    <TextInput mode="outlined" label="Current postcode" value={form.postcode} onChangeText={(v) => setField("postcode", v)} autoCapitalize="characters" style={styles.input} />
                  </View>
                </Card.Content>
              </Card>

              <Card style={styles.card}>
                <Card.Content style={styles.cardContent}>
                  <SectionHeader icon="card-account-details-outline" title="Identification" subtitle="Upload a PDF, JPG or PNG up to 10 MB. A typed URL is no longer required." />
                  <TextInput mode="outlined" label="Identification type" placeholder="Passport, driving licence, residence permit…" value={form.identificationType} onChangeText={(v) => setField("identificationType", v)} />
                  <View style={styles.uploadBox}>
                    <MaterialCommunityIcons name={form.identificationFileUrl ? "file-check-outline" : "file-upload-outline"} size={30} color={form.identificationFileUrl ? colors.success : colors.primary} />
                    <View style={styles.uploadTextWrap}>
                      <Text style={styles.uploadTitle}>{form.identificationFileUrl ? "Identification uploaded" : "Upload identification document"}</Text>
                      <Text style={styles.uploadText}>{documentName || "Accepted: PDF, JPG, JPEG, PNG · Maximum 10 MB"}</Text>
                    </View>
                    <Button mode="outlined" loading={uploadingDocument} disabled={uploadingDocument} onPress={() => void selectIdentificationDocument()}>
                      {form.identificationFileUrl ? "Replace" : "Choose file"}
                    </Button>
                  </View>
                  <HelperText type={form.identificationFileUrl ? "info" : "error"} visible>
                    {form.identificationFileUrl ? "Your uploaded document will be available to the Estate Agent during application review." : "An identification document is required before submission."}
                  </HelperText>
                </Card.Content>
              </Card>

              <Card style={styles.card}>
                <Card.Content style={styles.cardContent}>
                  <SectionHeader icon="account-alert-outline" title="Emergency contact and notes" subtitle="Provide someone we can record as your emergency contact." />
                  <View style={[styles.grid, compact && styles.gridCompact]}>
                    <TextInput mode="outlined" label="Emergency contact name" value={form.emergencyContactName} onChangeText={(v) => setField("emergencyContactName", v)} style={styles.input} />
                    <InternationalPhoneInput label="Emergency contact phone" value={form.emergencyContactPhone} onChangeText={(v) => setField("emergencyContactPhone", v)} style={styles.input} />
                  </View>
                  <TextInput mode="outlined" label="Additional notes (optional)" value={form.additionalNotes} onChangeText={(v) => setField("additionalNotes", v)} multiline numberOfLines={4} />
                </Card.Content>
              </Card>

              <Card style={styles.agreementCard}>
                <Card.Content style={styles.cardContent}>
                  <SectionHeader icon="file-sign" title={invite.agreement.title} subtitle={`Agreement version ${invite.agreement.version} · Review all terms before signing.`} />
                  <View style={styles.agreementSummary}>
                    <InfoRow label="Premises" value={invite.agreement.propertyAddress} />
                    <InfoRow label="Monthly rent" value={`£${invite.agreement.monthlyRent}`} />
                    <InfoRow label="Deposit" value={invite.agreement.depositAmount ? `£${invite.agreement.depositAmount}` : "Not recorded"} />
                  </View>

                  <Text style={styles.termsHeading}>Terms you are accepting</Text>
                  {invite.agreement.terms.map((term, index) => (
                    <View key={`${index}-${term.slice(0, 12)}`} style={styles.termRow}>
                      <View style={styles.termNumber}><Text style={styles.termNumberText}>{index + 1}</Text></View>
                      <Text style={styles.termText}>{term}</Text>
                    </View>
                  ))}

                  <Text style={styles.termsHeading}>Recorded property rules</Text>
                  <View style={styles.chipRow}>
                    <RuleChip label="Pets" allowed={invite.agreement.propertyRules?.petsAllowed} />
                    <RuleChip label="Smoking" allowed={invite.agreement.propertyRules?.smokingAllowed} />
                    <RuleChip label="Children" allowed={invite.agreement.propertyRules?.childrenAllowed} />
                    {invite.agreement.propertyRules?.furnishingStatus ? <Chip icon="sofa-outline">{invite.agreement.propertyRules.furnishingStatus.replaceAll("_", " ")}</Chip> : null}
                  </View>

                  <Divider />
                  <TextInput mode="outlined" label="Electronic signature – full name" value={form.signatureName} onChangeText={(v) => setField("signatureName", v)} />
                  <TextInput mode="outlined" label="Password / existing TenureEx password" value={form.password} onChangeText={(v) => setField("password", v)} secureTextEntry />
                  <HelperText type="info" visible>
                    If this email already has another TenureEx role, enter that existing account password. We will add the Tenant role to the same account.
                  </HelperText>

                  <View style={styles.acceptRow}>
                    <Checkbox status={accepted ? "checked" : "unchecked"} onPress={() => setAccepted((value) => !value)} />
                    <Text style={styles.acceptText} onPress={() => setAccepted((value) => !value)}>
                      I have read the complete tenancy terms displayed above, confirm my information is accurate, and agree to sign this agreement electronically.
                    </Text>
                  </View>

                  <Button mode="contained" icon="send-check-outline" loading={loading} disabled={loading || !canSubmit} onPress={() => void submit()} contentStyle={styles.submitButton}>
                    Sign agreement & submit for Estate Agent approval
                  </Button>
                </Card.Content>
              </Card>
            </>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SectionHeader({ icon, title, subtitle }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; title: string; subtitle: string }) {
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.sectionIcon}><MaterialCommunityIcons name={icon} size={23} color={colors.primary} /></View>
      <View style={styles.sectionHeadingText}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "—"}</Text>
    </View>
  );
}

function RuleChip({ label, allowed }: { label: string; allowed?: boolean }) {
  return <Chip icon={allowed ? "check-circle-outline" : "close-circle-outline"}>{label}: {allowed ? "Allowed" : "Not allowed"}</Chip>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  page: { padding: spacing.lg, alignItems: "center" },
  shell: { width: "100%", maxWidth: 980, gap: spacing.lg },
  loadingPage: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md, backgroundColor: colors.background },
  loadingText: { color: colors.textSecondary, fontWeight: "700" },
  hero: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: 24, flexDirection: "row", alignItems: "flex-start", gap: spacing.lg },
  heroIcon: { width: 62, height: 62, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center" },
  heroTextWrap: { flex: 1 },
  heroEyebrow: { color: "rgba(255,255,255,0.75)", fontWeight: "900", fontSize: 11, letterSpacing: 1.4 },
  heroTitle: { color: colors.white, fontWeight: "900", fontSize: 28, marginTop: 5 },
  heroText: { color: "rgba(255,255,255,0.88)", lineHeight: 21, marginTop: 7, maxWidth: 760 },
  card: { backgroundColor: colors.white, borderRadius: radius.lg },
  agreementCard: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.primary },
  cardContent: { gap: spacing.md },
  sectionHeading: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  sectionIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" },
  sectionHeadingText: { flex: 1 },
  sectionTitle: { color: colors.textPrimary, fontSize: 19, fontWeight: "900" },
  sectionSubtitle: { color: colors.textSecondary, marginTop: 3, lineHeight: 19 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  gridCompact: { flexDirection: "column" },
  input: { flex: 1, minWidth: 280, backgroundColor: colors.white },
  inputWide: { flex: 2, minWidth: 320, backgroundColor: colors.white },
  infoRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.md },
  infoLabel: { color: colors.textMuted, fontWeight: "800", minWidth: 120 },
  infoValue: { color: colors.textPrimary, fontWeight: "700", flex: 1, textAlign: "right" },
  moneyRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  moneyCard: { flex: 1, minWidth: 180, backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: spacing.md },
  moneyLabel: { color: colors.textSecondary, fontWeight: "700", fontSize: 12 },
  moneyValue: { color: colors.primary, fontWeight: "900", fontSize: 22, marginTop: 4 },
  uploadBox: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderWidth: 1, borderStyle: "dashed", borderColor: colors.border, borderRadius: radius.md, padding: spacing.md },
  uploadTextWrap: { flex: 1 },
  uploadTitle: { color: colors.textPrimary, fontWeight: "900" },
  uploadText: { color: colors.textSecondary, marginTop: 3, fontSize: 12 },
  agreementSummary: { backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: spacing.md, gap: 10 },
  termsHeading: { color: colors.textPrimary, fontWeight: "900", fontSize: 16, marginTop: spacing.xs },
  termRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  termNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center", marginTop: 1 },
  termNumberText: { color: colors.primary, fontWeight: "900", fontSize: 12 },
  termText: { flex: 1, color: colors.textSecondary, lineHeight: 20 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  acceptRow: { flexDirection: "row", alignItems: "flex-start", backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: spacing.sm },
  acceptText: { flex: 1, color: colors.textPrimary, lineHeight: 20, paddingTop: 7, fontWeight: "700" },
  submitButton: { minHeight: 50 },
  errorBox: { backgroundColor: "#FDECEC", borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: "#F5C2C2" },
  errorText: { color: colors.error, fontWeight: "800" },
  successBox: { backgroundColor: "#EAF8EF", borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: "#BDE5C8" },
  successText: { color: colors.success, fontWeight: "800" },
});
