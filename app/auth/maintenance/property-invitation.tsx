import InternationalPhoneInput from "@/src/components/InternationalPhoneInput";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Button, Chip, SegmentedButtons, Snackbar, TextInput } from "react-native-paper";
import { api } from "../../../src/api/client";
import { colors, radius, spacing } from "../../../src/theme";

type ProviderType = "INDIVIDUAL" | "BUSINESS";
type PickedFile = DocumentPicker.DocumentPickerAsset;

async function appendFile(form: FormData, field: string, file: PickedFile) {
  if (Platform.OS === "web") {
    const response = await fetch(file.uri);
    const blob = await response.blob();
    form.append(field, blob, file.name);
  } else {
    form.append(field, { uri: file.uri, name: file.name, type: file.mimeType || "application/octet-stream" } as any);
  }
}

export default function MaintenancePropertyInvitationScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [invite, setInvite] = useState<any>(null);
  const [providerType, setProviderType] = useState<ProviderType>("INDIVIDUAL");
  const [form, setForm] = useState({ firstName: "", lastName: "", password: "", phone: "", businessName: "", companyNumber: "", tradeType: "", serviceArea: "", businessAddress: "", registrationNumber: "", insuranceExpiry: "" });
  const [idDocument, setIdDocument] = useState<PickedFile | null>(null);
  const [certificates, setCertificates] = useState<PickedFile[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState(false);
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const show = (value: string) => { setMessage(value); setSnack(true); };

  useEffect(() => {
    if (!token) { show("This invitation link is missing its secure token."); return; }
    api.get(`/property-workflows/maintenance-invitations/${token}`).then((response) => {
      setInvite(response.data);
      setForm((current) => ({ ...current, firstName: response.data.firstName || "", lastName: response.data.lastName || "", tradeType: response.data.tradeType || "" }));
    }).catch((error) => show(error?.response?.data?.message || "Invitation could not be loaded."));
  }, [token]);

  const propertyLabel = useMemo(() => invite?.property ? `${invite.property.addressLine1}, ${invite.property.townCity} ${invite.property.postcode}` : "", [invite]);

  const pickId = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "image/jpeg", "image/png"], multiple: false, copyToCacheDirectory: true });
    if (!result.canceled) setIdDocument(result.assets[0]);
  };
  const pickCertificates = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "image/jpeg", "image/png"], multiple: true, copyToCacheDirectory: true });
    if (!result.canceled) setCertificates(result.assets.slice(0, 8));
  };

  const submit = async () => {
    if (!token || !invite) return;
    if (!form.firstName.trim() || !form.lastName.trim()) return show("Enter your first and last name.");
    if (!form.phone.trim()) return show("Enter your phone number.");
    if (!form.tradeType.trim()) return show("Enter your trade or maintenance speciality.");
    if (!form.serviceArea.trim()) return show("Enter the area you provide services in.");
    if (providerType === "BUSINESS" && !form.businessName.trim()) return show("Enter the business name.");
    if (!idDocument) return show("Upload an ID / verification document.");
    if (form.password.length < 8) return show("Password must contain at least 8 characters.");
    setLoading(true);
    try {
      const data = new FormData();
      await appendFile(data, "identificationFile", idDocument);
      for (const certificate of certificates) await appendFile(data, "certificates", certificate);
      const uploaded = await api.post(`/property-workflows/maintenance-invitations/${token}/documents`, data);
      const response = await api.post("/property-workflows/maintenance-invitations/complete", {
        token, providerType, ...form,
        businessName: providerType === "BUSINESS" ? form.businessName : undefined,
        companyNumber: providerType === "BUSINESS" ? form.companyNumber : undefined,
        insuranceExpiry: form.insuranceExpiry || undefined,
        ...uploaded.data,
      });
      show(response.data.message || "Registration submitted for review.");
      setTimeout(() => router.replace("/auth/maintenance/login" as never), 1200);
    } catch (error: any) {
      show(error?.response?.data?.message || "Registration could not be completed.");
    } finally { setLoading(false); }
  };

  return <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={[styles.layout, isDesktop && styles.layoutDesktop]}>
      <View style={[styles.hero, isDesktop && styles.heroDesktop]}>
        <Pressable style={styles.brand} onPress={() => router.replace("/" as never)}>
          <View style={styles.logo}><MaterialCommunityIcons name="tools" size={28} color={colors.white} /></View>
          <View><Text style={styles.brandName}>TENUREEX</Text><Text style={styles.brandSub}>Maintenance Provider</Text></View>
        </Pressable>
        <Text style={styles.heroTitle}>Complete your provider verification</Text>
        <Text style={styles.heroText}>Tell us whether you work individually or as a business, verify your identity and add any professional certificates. TenureEx Admin reviews provider verification before the account becomes active.</Text>
        {propertyLabel ? <View style={styles.inviteBox}><MaterialCommunityIcons name="home-map-marker" size={22} color={colors.primary}/><View style={{flex:1}}><Text style={styles.inviteTitle}>Property invitation</Text><Text style={styles.inviteText}>{propertyLabel}</Text></View></View> : null}
        <View style={styles.securityRow}><MaterialCommunityIcons name="shield-check-outline" size={20} color={colors.primary}/><Text style={styles.securityText}>ID documents are required. Certificates are optional and can support your provider profile.</Text></View>
      </View>

      <View style={[styles.card, isDesktop && styles.cardDesktop]}>
        <Text style={styles.title}>Maintenance provider registration</Text>
        <Text style={styles.subtitle}>All required fields must be completed before submission.</Text>

        <Text style={styles.sectionLabel}>Provider type</Text>
        <SegmentedButtons value={providerType} onValueChange={(value) => setProviderType(value as ProviderType)} buttons={[{ value:"INDIVIDUAL", label:"Individual", icon:"account-outline" }, { value:"BUSINESS", label:"Business", icon:"domain" }]} />

        <View style={styles.twoCol}>
          <TextInput mode="outlined" label="First name *" value={form.firstName} onChangeText={(v)=>set("firstName",v)} style={styles.field}/>
          <TextInput mode="outlined" label="Last name *" value={form.lastName} onChangeText={(v)=>set("lastName",v)} style={styles.field}/>
        </View>
        <InternationalPhoneInput label="Phone number *" value={form.phone} onChangeText={(v)=>set("phone",v)} style={styles.input}/>
        <View style={styles.twoCol}>
          <TextInput mode="outlined" label="Trade / speciality *" value={form.tradeType} onChangeText={(v)=>set("tradeType",v)} style={styles.field}/>
          <TextInput mode="outlined" label="Service area *" placeholder="e.g. East London" value={form.serviceArea} onChangeText={(v)=>set("serviceArea",v)} style={styles.field}/>
        </View>

        {providerType === "BUSINESS" ? <>
          <Text style={styles.sectionLabel}>Business details</Text>
          <TextInput mode="outlined" label="Business name *" value={form.businessName} onChangeText={(v)=>set("businessName",v)} style={styles.input}/>
          <View style={styles.twoCol}>
            <TextInput mode="outlined" label="Company number (if applicable)" value={form.companyNumber} onChangeText={(v)=>set("companyNumber",v)} style={styles.field}/>
            <TextInput mode="outlined" label="Trade registration number" value={form.registrationNumber} onChangeText={(v)=>set("registrationNumber",v)} style={styles.field}/>
          </View>
          <TextInput mode="outlined" label="Business address" value={form.businessAddress} onChangeText={(v)=>set("businessAddress",v)} style={styles.input}/>
        </> : <TextInput mode="outlined" label="Trade registration number (if applicable)" value={form.registrationNumber} onChangeText={(v)=>set("registrationNumber",v)} style={styles.input}/>}
        <TextInput mode="outlined" label="Insurance expiry (YYYY-MM-DD, optional)" value={form.insuranceExpiry} onChangeText={(v)=>set("insuranceExpiry",v)} style={styles.input}/>

        <Text style={styles.sectionLabel}>Verification documents</Text>
        <Pressable style={styles.uploadBox} onPress={pickId}><MaterialCommunityIcons name="card-account-details-outline" size={28} color={colors.primary}/><View style={{flex:1}}><Text style={styles.uploadTitle}>{idDocument ? idDocument.name : "Upload ID / verification document *"}</Text><Text style={styles.uploadHint}>PDF, JPG or PNG · maximum 10 MB</Text></View><MaterialCommunityIcons name="upload" size={22} color={colors.primary}/></Pressable>
        <Pressable style={styles.uploadBox} onPress={pickCertificates}><MaterialCommunityIcons name="certificate-outline" size={28} color={colors.primary}/><View style={{flex:1}}><Text style={styles.uploadTitle}>Professional certificates (optional)</Text><Text style={styles.uploadHint}>Upload up to 8 PDF/JPG/PNG certificates</Text></View><MaterialCommunityIcons name="upload-multiple" size={22} color={colors.primary}/></Pressable>
        {certificates.length ? <View style={styles.chips}>{certificates.map((file)=><Chip key={file.uri} onClose={()=>setCertificates((c)=>c.filter((x)=>x.uri!==file.uri))}>{file.name}</Chip>)}</View> : null}

        <TextInput mode="outlined" label="Password / existing TenureEx password *" value={form.password} onChangeText={(v)=>set("password",v)} secureTextEntry style={styles.input}/>
        <Button mode="contained" icon="shield-check" loading={loading} disabled={loading || !invite} onPress={submit} contentStyle={{height:52}}>Submit for verification</Button>
        <Text style={styles.note}>Your provider account remains pending until TenureEx Admin completes verification.</Text>
      </View>
    </View>
    <Snackbar visible={snack} onDismiss={()=>setSnack(false)} duration={4500}>{message}</Snackbar>
  </ScrollView>;
}

const styles=StyleSheet.create({
  page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.lg,alignItems:"center"},layout:{width:"100%",maxWidth:1180,gap:20},layoutDesktop:{flexDirection:"row",alignItems:"flex-start"},hero:{backgroundColor:colors.white,borderRadius:radius.lg,padding:24,borderWidth:1,borderColor:colors.border},heroDesktop:{width:390,position:"sticky" as any,top:20},brand:{flexDirection:"row",alignItems:"center",gap:12,marginBottom:34},logo:{width:48,height:48,borderRadius:14,backgroundColor:colors.primary,alignItems:"center",justifyContent:"center"},brandName:{fontSize:20,fontWeight:"900",color:colors.textPrimary,letterSpacing:1},brandSub:{color:colors.textSecondary,fontSize:12},heroTitle:{fontSize:30,fontWeight:"900",color:colors.textPrimary,lineHeight:36},heroText:{fontSize:15,lineHeight:23,color:colors.textSecondary,marginTop:14},inviteBox:{flexDirection:"row",gap:12,marginTop:24,padding:16,borderRadius:14,backgroundColor:colors.background},inviteTitle:{fontWeight:"800",color:colors.textPrimary},inviteText:{color:colors.textSecondary,marginTop:3},securityRow:{flexDirection:"row",gap:10,marginTop:18,alignItems:"flex-start"},securityText:{flex:1,color:colors.textSecondary,lineHeight:20},card:{backgroundColor:colors.white,borderRadius:radius.lg,padding:22,borderWidth:1,borderColor:colors.border,gap:14},cardDesktop:{flex:1,padding:30},title:{fontSize:26,fontWeight:"900",color:colors.textPrimary},subtitle:{color:colors.textSecondary,marginBottom:4},sectionLabel:{fontSize:15,fontWeight:"800",color:colors.textPrimary,marginTop:8},twoCol:{flexDirection:"row",flexWrap:"wrap",gap:12},field:{flex:1,minWidth:220,backgroundColor:colors.white},input:{backgroundColor:colors.white},uploadBox:{minHeight:78,borderWidth:1,borderStyle:"dashed",borderColor:colors.primary,borderRadius:14,padding:16,flexDirection:"row",alignItems:"center",gap:14,backgroundColor:colors.background},uploadTitle:{fontWeight:"800",color:colors.textPrimary},uploadHint:{fontSize:12,color:colors.textSecondary,marginTop:3},chips:{flexDirection:"row",flexWrap:"wrap",gap:8},note:{fontSize:12,color:colors.textSecondary,textAlign:"center"}
});
