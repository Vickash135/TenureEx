import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { ActivityIndicator, Button, Card, Divider, HelperText, TextInput } from "react-native-paper";

import InternationalPhoneInput from "@/src/components/InternationalPhoneInput";
import { api } from "../../../src/api/client";
import { colors, radius, spacing } from "../../../src/theme";

type UpdateForm = {
  phone: string;
  dateOfBirth: string;
  currentAddress: string;
  postcode: string;
  identificationType: string;
  identificationFileUrl: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  additionalNotes: string;
  responseNote: string;
};

const emptyForm: UpdateForm = {
  phone: "",
  dateOfBirth: "",
  currentAddress: "",
  postcode: "",
  identificationType: "",
  identificationFileUrl: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  additionalNotes: "",
  responseNote: "",
};

function dateOnly(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

export default function TenantApplicationUpdateScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const { width } = useWindowDimensions();
  const compact = width < 760;

  const [application, setApplication] = useState<any>(null);
  const [form, setForm] = useState<UpdateForm>(emptyForm);
  const [documentName, setDocumentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const setField = (field: keyof UpdateForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  useEffect(() => {
    if (!token) {
      setError("The secure application update token is missing.");
      setLoading(false);
      return;
    }
    api
      .get(`/property-workflows/tenant-application-update/${encodeURIComponent(token)}`)
      .then((response) => {
        const data = response.data;
        setApplication(data);
        const values = data.values || {};
        setForm({
          phone: values.phone || "",
          dateOfBirth: dateOnly(values.dateOfBirth),
          currentAddress: values.currentAddress || "",
          postcode: values.postcode || "",
          identificationType: values.identificationType || "",
          identificationFileUrl: values.identificationFileUrl || "",
          emergencyContactName: values.emergencyContactName || "",
          emergencyContactPhone: values.emergencyContactPhone || "",
          additionalNotes: values.additionalNotes || "",
          responseNote: "",
        });
        if (values.identificationFileUrl) setDocumentName("Current identification document");
      })
      .catch((requestError: any) => setError(requestError?.response?.data?.message || "Unable to load this tenant application update."))
      .finally(() => setLoading(false));
  }, [token]);

  const uploadIdentification = async () => {
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
          { uri: asset.uri, name: asset.name || "tenant-identification", type: asset.mimeType || "application/octet-stream" } as any,
        );
      }

      setUploading(true);
      const response = await api.post(
        `/property-workflows/tenant-application-update/${encodeURIComponent(token)}/identification`,
        data,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      setField("identificationFileUrl", response.data.identificationFileUrl);
      setDocumentName(response.data.fileName || asset.name || "Updated identification document");
      setMessage("Updated identification document uploaded.");
    } catch (uploadError: any) {
      setError(uploadError?.response?.data?.message || "Unable to upload the identification document.");
    } finally {
      setUploading(false);
    }
  };

  const resubmit = async () => {
    if (!token || !form.responseNote.trim()) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await api.patch(
        `/property-workflows/tenant-application-update/${encodeURIComponent(token)}`,
        { ...form, dateOfBirth: form.dateOfBirth || undefined },
      );
      setMessage(response.data?.message || "Information resubmitted for Estate Agent review.");
      setTimeout(() => router.replace("/auth/tenant/login" as never), 1400);
    } catch (requestError: any) {
      const backendMessage = requestError?.response?.data?.message;
      setError(Array.isArray(backendMessage) ? backendMessage.join("\n") : backendMessage || "Unable to resubmit your information.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingPage}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.muted}>Loading the Estate Agent request…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <View style={styles.shell}>
          <View style={styles.hero}>
            <View style={styles.heroIcon}><MaterialCommunityIcons name="file-document-edit-outline" size={34} color={colors.white} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>TENANT APPLICATION UPDATE</Text>
              <Text style={styles.heroTitle}>More information is required</Text>
              <Text style={styles.heroText}>Update the requested information below and send the application back to the Estate Agent for another review.</Text>
            </View>
          </View>

          {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}
          {message ? <View style={styles.successBox}><Text style={styles.successText}>{message}</Text></View> : null}

          {application ? (
            <>
              <Card style={styles.requestCard}>
                <Card.Content style={styles.content}>
                  <View style={styles.requestHeading}>
                    <MaterialCommunityIcons name="message-alert-outline" size={25} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sectionTitle}>Estate Agent request</Text>
                      <Text style={styles.propertyText}>{application.property?.addressLine1}, {application.property?.townCity}, {application.property?.postcode}</Text>
                    </View>
                  </View>
                  <Divider />
                  <Text style={styles.requestText}>{application.request || "Please review and update your application information."}</Text>
                </Card.Content>
              </Card>

              <Card style={styles.card}>
                <Card.Content style={styles.content}>
                  <Text style={styles.sectionTitle}>Review and update your details</Text>
                  <Text style={styles.muted}>Existing values are pre-filled. Change only what is required, but make sure all information remains accurate.</Text>
                  <View style={[styles.grid, compact && styles.gridCompact]}>
                    <InternationalPhoneInput label="Phone" value={form.phone} onChangeText={(v) => setField("phone", v)} style={styles.input} />
                    <TextInput mode="outlined" label="Date of birth (YYYY-MM-DD)" value={form.dateOfBirth} onChangeText={(v) => setField("dateOfBirth", v)} style={styles.input} />
                    <TextInput mode="outlined" label="Current address" value={form.currentAddress} onChangeText={(v) => setField("currentAddress", v)} style={styles.inputWide} />
                    <TextInput mode="outlined" label="Postcode" value={form.postcode} onChangeText={(v) => setField("postcode", v)} style={styles.input} />
                    <TextInput mode="outlined" label="Emergency contact name" value={form.emergencyContactName} onChangeText={(v) => setField("emergencyContactName", v)} style={styles.input} />
                    <InternationalPhoneInput label="Emergency contact phone" value={form.emergencyContactPhone} onChangeText={(v) => setField("emergencyContactPhone", v)} style={styles.input} />
                  </View>
                  <TextInput mode="outlined" label="Additional notes" value={form.additionalNotes} onChangeText={(v) => setField("additionalNotes", v)} multiline numberOfLines={4} />
                </Card.Content>
              </Card>

              <Card style={styles.card}>
                <Card.Content style={styles.content}>
                  <Text style={styles.sectionTitle}>Identification document</Text>
                  <TextInput mode="outlined" label="Identification type" value={form.identificationType} onChangeText={(v) => setField("identificationType", v)} />
                  <View style={styles.uploadBox}>
                    <MaterialCommunityIcons name={form.identificationFileUrl ? "file-check-outline" : "file-upload-outline"} size={30} color={form.identificationFileUrl ? colors.success : colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.uploadTitle}>{form.identificationFileUrl ? "Identification available" : "Upload identification"}</Text>
                      <Text style={styles.muted}>{documentName || "PDF, JPG or PNG · maximum 10 MB"}</Text>
                    </View>
                    <Button mode="outlined" loading={uploading} disabled={uploading} onPress={() => void uploadIdentification()}>
                      {form.identificationFileUrl ? "Replace" : "Choose file"}
                    </Button>
                  </View>
                  <HelperText type="info" visible>Replace the document only if the Estate Agent requested a clearer, newer or different identification document.</HelperText>
                </Card.Content>
              </Card>

              <Card style={styles.card}>
                <Card.Content style={styles.content}>
                  <Text style={styles.sectionTitle}>Your response to the Estate Agent</Text>
                  <TextInput
                    mode="outlined"
                    label="Explain what you updated / provide the requested information"
                    value={form.responseNote}
                    onChangeText={(v) => setField("responseNote", v)}
                    multiline
                    numberOfLines={5}
                  />
                  <Button mode="contained" icon="send-check-outline" loading={saving} disabled={saving || form.responseNote.trim().length < 2} onPress={() => void resubmit()} contentStyle={styles.submitButton}>
                    Resubmit to Estate Agent
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  page: { padding: spacing.lg, alignItems: "center" },
  shell: { width: "100%", maxWidth: 920, gap: spacing.lg },
  loadingPage: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", gap: spacing.md },
  hero: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: 24, flexDirection: "row", gap: spacing.lg, alignItems: "flex-start" },
  heroIcon: { width: 60, height: 60, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  eyebrow: { color: "rgba(255,255,255,0.74)", fontWeight: "900", fontSize: 11, letterSpacing: 1.3 },
  heroTitle: { color: colors.white, fontSize: 27, fontWeight: "900", marginTop: 4 },
  heroText: { color: "rgba(255,255,255,0.88)", lineHeight: 20, marginTop: 6 },
  card: { backgroundColor: colors.white, borderRadius: radius.lg },
  requestCard: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.primary },
  content: { gap: spacing.md },
  requestHeading: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  sectionTitle: { color: colors.textPrimary, fontSize: 19, fontWeight: "900" },
  propertyText: { color: colors.textSecondary, marginTop: 3 },
  requestText: { color: colors.textPrimary, fontWeight: "700", lineHeight: 21, backgroundColor: colors.primaryLight, padding: spacing.md, borderRadius: radius.md },
  muted: { color: colors.textSecondary, lineHeight: 19 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  gridCompact: { flexDirection: "column" },
  input: { flex: 1, minWidth: 280, backgroundColor: colors.white },
  inputWide: { flex: 2, minWidth: 320, backgroundColor: colors.white },
  uploadBox: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderWidth: 1, borderStyle: "dashed", borderColor: colors.border, borderRadius: radius.md, padding: spacing.md },
  uploadTitle: { color: colors.textPrimary, fontWeight: "900" },
  submitButton: { minHeight: 50 },
  errorBox: { backgroundColor: "#FDECEC", padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: "#F5C2C2" },
  errorText: { color: colors.error, fontWeight: "800" },
  successBox: { backgroundColor: "#EAF8EF", padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: "#BDE5C8" },
  successText: { color: colors.success, fontWeight: "800" },
});
