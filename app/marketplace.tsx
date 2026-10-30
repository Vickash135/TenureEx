import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView,
  StyleSheet, Text, TextInput, useWindowDimensions, View,
} from "react-native";
import { api } from "../src/api/client";
import TenureExLogo from "../src/components/Logo/TenureExLogo";
import { colors } from "../src/theme";

type Stage = "register" | "verify" | "login" | "list" | "my";
type Listing = {
  id: string; advertisingTitle?: string; title?: string; addressLine1?: string;
  townCity?: string; postcode?: string; propertyType?: string;
  monthlyRent?: number | string; bedrooms?: number; bathrooms?: number;
  description?: string; contactName?: string; contactEmail?: string;
  contactPhone?: string;
};
const propertyTypes = ["FLAT", "HOUSE", "STUDIO", "BUNGALOW", "MAISONETTE", "OTHER"];
const headings: Record<Stage, { eyebrow: string; title: string; subtitle: string }> = {
  register: { eyebrow: "PROPERTY OWNER PORTAL", title: "Create your account", subtitle: "Register to advertise and manage your rental properties." },
  verify: { eyebrow: "EMAIL VERIFICATION", title: "Verify your email", subtitle: "Enter the six-digit code sent to your email address." },
  login: { eyebrow: "PROPERTY OWNER PORTAL", title: "Welcome back", subtitle: "Sign in to manage your property listings." },
  list: { eyebrow: "PROPERTY OWNER PORTAL", title: "Property details", subtitle: "Add your property information and contact details." },
  my: { eyebrow: "MY PROPERTY PORTFOLIO", title: "My properties", subtitle: "Manage listings that tenants can discover in TenureEx." },
};

export default function MarketplaceScreen() {
  const { width, height } = useWindowDimensions();
  const desktop = width >= 960;
  const [stage, setStage] = useState<Stage>("register");
  const [data, setData] = useState<Record<string, string>>({});
  const [token, setToken] = useState("");
  const [my, setMy] = useState<Listing[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const put = (key: string, value: string) => setData(old => ({ ...old, [key]: value }));

  async function request(path: string, body: unknown, method = "post", auth = token) {
    const response = await api.request({
      url: `/marketplace/${path}`, method, data: body,
      headers: auth ? { Authorization: `Bearer ${auth}` } : {},
    });
    return response.data;
  }
  async function load(auth: string) {
    try {
      const response = await api.get<Listing[]>("/marketplace/my-properties", { headers: { Authorization: `Bearer ${auth}` } });
      setMy(response.data);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "Unable to load your properties.");
    }
  }
  function errorText(error: any) {
    const text = error?.response?.data?.message || error?.message || "Request failed";
    return Array.isArray(text) ? text.join(", ") : String(text);
  }
  async function submit() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      if (stage === "register") {
        if (data.password !== data.confirmPassword) throw new Error("Passwords do not match.");
        await request("register", { name: data.name, email: data.email, phone: data.phone, password: data.password, confirmPassword: data.confirmPassword });
        setStage("verify"); setMessage("Check your email for your six-digit verification code.");
      } else if (stage === "verify") {
        await request("verify-email", { email: data.email, code: data.code });
        setStage("login"); setMessage("Email verified. You can now sign in.");
      } else if (stage === "login") {
        const result = await request("login", { email: data.email, password: data.password });
        setToken(result.accessToken); setStage("my"); await load(result.accessToken);
      } else if (stage === "list") {
        const result = await request(editingId ? `properties/${editingId}` : "properties", {
          title: data.title, addressLine1: data.addressLine1,
          townCity: data.townCity, postcode: data.postcode,
          propertyType: data.propertyType || "FLAT", bedrooms: Number(data.bedrooms),
          bathrooms: Number(data.bathrooms), monthlyRent: Number(data.monthlyRent),
          description: data.description || "", contactName: data.contactName,
          contactEmail: data.contactEmail, contactPhone: data.contactPhone,
        }, editingId ? "patch" : "post");
        if (photos.length) {
          const form = new FormData();
          photos.forEach(photo => form.append("photos", photo));
          await api.post(`/marketplace/properties/${result.id || editingId}/photos`, form, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
        setStage("my"); setEditingId(null); setPhotos([]);
        await load(token);
        setMessage(editingId ? "Property updated successfully." : "Property published! Tenants can now find your listing.");
      }
    } catch (error: any) { setMessage(errorText(error)); }
    finally { setBusy(false); }
  }
  async function resend() {
    if (busy) return;
    setBusy(true); setMessage("");
    try { const result = await request("resend-code", { email: data.email }); setMessage(result.message || "Code sent."); }
    catch (error) { setMessage(errorText(error)); }
    finally { setBusy(false); }
  }
  async function remove(id: string) {
    if (busy) return;
    setBusy(true); setMessage("");
    try { await request(`properties/${id}`, {}, "delete"); await load(token); setMessage("Property deleted."); }
    catch (error) { setMessage(errorText(error)); }
    finally { setBusy(false); }
  }
  function startListing() {
    setEditingId(null); setPhotos([]); setMessage("");
    setData(old => ({ name: old.name || "", email: old.email || "", phone: old.phone || "", contactName: old.name || "", contactEmail: old.email || "", contactPhone: old.phone || "" }));
    setStage("list");
  }
  function editListing(item: Listing) {
    setEditingId(item.id); setPhotos([]); setMessage("");
    setData(old => ({ ...old, title: item.advertisingTitle || item.title || "",
      addressLine1: item.addressLine1 || "", townCity: item.townCity || "",
      postcode: item.postcode || "", propertyType: item.propertyType || "FLAT",
      monthlyRent: String(item.monthlyRent ?? ""), bedrooms: String(item.bedrooms ?? ""),
      bathrooms: String(item.bathrooms ?? ""), description: item.description || "",
      contactName: item.contactName || "", contactEmail: item.contactEmail || "",
      contactPhone: item.contactPhone || "",
    }));
    setStage("list");
  }
  function field(key: string, label: string, icon: keyof typeof MaterialCommunityIcons.glyphMap, options?: { secret?: boolean; multiline?: boolean; keyboard?: "default" | "email-address" | "phone-pad" | "numeric" }) {
    const secure = !!options?.secret && !showPassword;
    return <View key={key} style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, options?.multiline && styles.multilineWrap]}>
        <MaterialCommunityIcons name={icon} size={21} color="#718895" style={styles.fieldIcon} />
        <TextInput value={data[key] || ""} onChangeText={value => put(key, value)}
          secureTextEntry={secure} multiline={options?.multiline} keyboardType={options?.keyboard || "default"}
          autoCapitalize={key === "email" || key === "contactEmail" || options?.secret ? "none" : "sentences"}
          placeholder={`Enter ${label.toLowerCase()}`} placeholderTextColor="#82939C"
          style={[styles.input, options?.multiline && styles.multilineInput]} />
        {options?.secret && <Pressable onPress={() => setShowPassword(old => !old)} style={styles.eye}>
          <MaterialCommunityIcons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#718895" />
        </Pressable>}
      </View>
    </View>;
  }
  function button(label: string, action: () => void, secondary = false, icon?: keyof typeof MaterialCommunityIcons.glyphMap) {
    return <Pressable disabled={busy} onPress={action} style={[styles.button, secondary ? styles.secondaryButton : styles.primaryButton, busy && styles.disabled]}>
      <Text style={[styles.buttonText, secondary && styles.secondaryButtonText]}>{label}</Text>
      {icon && <MaterialCommunityIcons name={icon} size={19} color={secondary ? colors.primary : "white"} />}
    </Pressable>;
  }
  const heading = headings[stage];
  return <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <LinearGradient colors={["#eaf3f6", "#f6f8fa", "#ffffff"]} style={StyleSheet.absoluteFill} />
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.pageScroll}>
        <View style={[styles.shell, desktop && styles.shellDesktop, desktop && { minHeight: Math.max(680, height - 64) }]}>
          {desktop && <LinearGradient colors={[colors.primaryDark, colors.primary, "#18768a"]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.hero}>
            <TenureExLogo light />
            <View style={styles.heroIllustration}>
              <View style={styles.houseIcon}><MaterialCommunityIcons name="home-city-outline" size={76} color="white" /></View>
              <View style={styles.floatingPill}><MaterialCommunityIcons name="check-decagram" size={26} color="#0d8659" /><View><Text style={styles.pillTitle}>Easy listings</Text><Text style={styles.pillSub}>Publish instantly</Text></View></View>
            </View>
            <Text style={styles.heroEyebrow}>BUILT FOR INDEPENDENT PROPERTY OWNERS</Text>
            <Text style={styles.heroTitle}>Your property, your listing.</Text>
            <Text style={styles.heroDescription}>Advertise your rental property and connect with tenants through a simple, professional workspace.</Text>
            {["Create an account in a few simple steps", "Publish your rental listing instantly", "Reach tenants searching across the UK", "Edit and manage your own properties"].map(item => <View key={item} style={styles.benefit}><MaterialCommunityIcons name="check-circle" size={22} color="#b7e5d9" /><Text style={styles.benefitText}>{item}</Text></View>)}
            <View style={styles.heroFooter}><MaterialCommunityIcons name="shield-check-outline" size={17} color="#b3dce5" /><Text style={styles.heroFooterText}>Secure TenureEx property advertising</Text></View>
          </LinearGradient>}
          <View style={[styles.formPanel, !desktop && { paddingHorizontal: 22, paddingVertical: 25 }]}>
            <Pressable onPress={() => router.push("/rent" as never)} style={styles.backButton}><MaterialCommunityIcons name="arrow-left" size={20} color={colors.primary} /><Text style={styles.backText}>Back to main page</Text></Pressable>
            {!desktop && <View style={styles.mobileBrand}><TenureExLogo /></View>}
            <Text style={styles.eyebrow}>{heading.eyebrow}</Text>
            <Text style={styles.heading}>{heading.title}</Text>
            <Text style={styles.subtitle}>{heading.subtitle}</Text>
            {stage === "register" && <>
              {field("name", "Full name", "account-outline")}
              {field("email", "Email address", "email-outline", {keyboard:"email-address"})}
              {field("phone", "Phone number", "phone-outline", {keyboard:"phone-pad"})}
              {field("password", "Password", "lock-outline", {secret:true})}
              {field("confirmPassword", "Confirm password", "lock-check-outline", {secret:true})}
              {button(busy ? "Creating account…" : "Create account", submit, false, "arrow-right")}
              <Text style={styles.helper}>Already have a Property Owner account?</Text>
              {button("Sign in", () => {setMessage("");setStage("login");}, true, "login")}
            </>}
            {stage === "verify" && <>
              <View style={styles.infoBox}><MaterialCommunityIcons name="email-check-outline" size={23} color={colors.primary} /><Text style={styles.infoText}>A verification code has been sent to {data.email || "your email"}.</Text></View>
              {field("code", "Six-digit verification code", "numeric-6-box-outline", {keyboard:"numeric"})}
              {button(busy ? "Verifying…" : "Verify email", submit, false, "check")}
              {button("Resend verification code", resend, true, "email-sync-outline")}
            </>}
            {stage === "login" && <>
              {field("email", "Email address", "email-outline", {keyboard:"email-address"})}
              {field("password", "Password", "lock-outline", {secret:true})}
              {button(busy ? "Signing in…" : "Sign in", submit, false, "arrow-right")}
              <View style={styles.infoBox}><MaterialCommunityIcons name="shield-lock-outline" size={24} color={colors.primary} /><View style={{flex:1}}><Text style={styles.infoTitle}>Secure TenureEx login</Text><Text style={styles.infoText}>Your email must be verified before you can access your listings.</Text></View></View>
              <Text style={styles.helper}>Don't have a Property Owner account?</Text>
              {button("Register", () => {setMessage("");setStage("register");}, true, "account-plus-outline")}
            </>}
            {stage === "my" && <>
              {button("+ Add a property", startListing, false, "home-plus-outline")}
              <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Your published properties</Text><Text style={styles.counter}>{my.length} listing(s)</Text></View>
              {my.length === 0 && <View style={styles.emptyBox}><MaterialCommunityIcons name="home-search-outline" size={38} color={colors.primary} /><Text style={styles.emptyTitle}>No properties yet</Text><Text style={styles.infoText}>Add your first listing to make it visible to tenants.</Text></View>}
              {my.map(item => <View key={item.id} style={styles.listingCard}>
                <Text style={styles.listingTitle}>{item.advertisingTitle || item.title || "Untitled property"}</Text>
                <Text style={styles.listingMeta}>{item.townCity || "Location not set"} · £{Number(item.monthlyRent || 0).toLocaleString("en-GB")}/month</Text>
                <View style={styles.published}><MaterialCommunityIcons name="check-circle" size={16} color="#168056" /><Text style={styles.publishedText}>Published</Text></View>
                <View style={styles.cardActions}><Pressable onPress={() => editListing(item)} style={styles.miniButton}><MaterialCommunityIcons name="pencil-outline" size={17} color={colors.primary} /><Text style={styles.miniText}>Edit listing</Text></Pressable><Pressable disabled={busy} onPress={() => remove(item.id)} style={styles.miniButton}><MaterialCommunityIcons name="delete-outline" size={17} color="#b53434" /><Text style={[styles.miniText,{color:"#b53434"}]}>Delete</Text></Pressable></View>
              </View>)}
              {button("Refresh my properties", () => load(token), true, "refresh")}
            </>}
            {stage === "list" && <>
              {field("title", "Property title", "home-outline")}
              {field("addressLine1", "Street address", "map-marker-outline")}
              {field("townCity", "Town / City", "city-variant-outline")}
              {field("postcode", "Postcode", "map-marker-radius-outline")}
              <Text style={styles.label}>Property type</Text>
              <View style={styles.typeGrid}>{propertyTypes.map(type => <Pressable key={type} onPress={() => put("propertyType",type)} style={[styles.typeChip, (data.propertyType || "FLAT") === type && styles.typeChipActive]}><Text style={[styles.typeText, (data.propertyType || "FLAT") === type && styles.typeTextActive]}>{type.charAt(0)+type.slice(1).toLowerCase()}</Text></Pressable>)}</View>
              {field("monthlyRent", "Monthly rent (£)", "currency-gbp", {keyboard:"numeric"})}
              {field("bedrooms", "Bedrooms", "bed-king-outline", {keyboard:"numeric"})}
              {field("bathrooms", "Bathrooms", "shower", {keyboard:"numeric"})}
              {field("description", "Property description", "text-box-outline", {multiline:true})}
              <Text style={styles.sectionTitle}>Contact information</Text>
              {field("contactName", "Contact name", "account-outline")}
              {field("contactEmail", "Contact email", "email-outline", {keyboard:"email-address"})}
              {field("contactPhone", "Contact phone", "phone-outline", {keyboard:"phone-pad"})}
              <Text style={styles.label}>Property photos (up to 10)</Text>
              <View style={styles.photoBox}><MaterialCommunityIcons name="image-multiple-outline" size={31} color={colors.primary} /><Text style={styles.photoHelp}>Upload JPG, PNG or WebP images</Text>
                {Platform.OS === "web" ? React.createElement("input" as any, {type:"file", accept:"image/jpeg,image/png,image/webp", multiple:true, onChange:(event:any) => setPhotos(Array.from(event.target.files || []).slice(0,10) as File[]), style:{maxWidth:"100%"}}) : <Text style={styles.photoHelp}>Native photo picker is not yet supported.</Text>}
                {photos.length > 0 && <Text style={styles.photoHelp}>{photos.length} image(s) selected</Text>}
              </View>
              {button(busy ? "Saving…" : editingId ? "Save changes" : "Publish property", submit, false, "arrow-right")}
              {button("Back to my properties", () => {setStage("my");setMessage("");}, true, "arrow-left")}
            </>}
            {!!message && <View style={styles.messageBox}><MaterialCommunityIcons name="information-outline" color={colors.primary} size={20}/><Text style={styles.messageText}>{message}</Text></View>}
            <Text style={styles.footer}>© 2026 TenureEx. All rights reserved.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  </KeyboardAvoidingView>;
}
const styles = StyleSheet.create({
  root:{flex:1,backgroundColor:"#eef5f8"},pageScroll:{flexGrow:1,paddingHorizontal:18,paddingVertical:14,justifyContent:"center"},
  shell:{width:"100%",maxWidth:1380,alignSelf:"center",backgroundColor:"#fff",borderRadius:28,overflow:"hidden",shadowColor:"#163848",shadowOpacity:0.12,shadowRadius:24,elevation:5},
  shellDesktop:{flexDirection:"row"},hero:{flex:1.08,padding:38,justifyContent:"space-between",minHeight:0},
  heroIllustration:{height:205,justifyContent:"center",alignItems:"center"},houseIcon:{width:145,height:145,alignItems:"center",justifyContent:"center",borderWidth:1,borderColor:"#6895a5",backgroundColor:"#ffffff19",borderRadius:48},
  floatingPill:{position:"absolute",right:10,bottom:5,backgroundColor:"white",paddingHorizontal:12,paddingVertical:9,flexDirection:"row",alignItems:"center",gap:12,borderRadius:17},
  pillTitle:{fontSize:17,fontWeight:"800",color:"#173341"},pillSub:{color:"#687e89",fontSize:11},heroEyebrow:{fontSize:11,fontWeight:"800",letterSpacing:2,color:"#c1e3e9",marginTop:16},
  heroTitle:{color:"white",fontSize:38,fontWeight:"800",lineHeight:45,marginTop:12},heroDescription:{color:"#d0e5ec",fontSize:14,lineHeight:21,marginTop:12,marginBottom:25},
  benefit:{flexDirection:"row",alignItems:"center",gap:10,marginBottom:9},benefitText:{color:"#e7f4f8",fontWeight:"600",fontSize:14,flex:1},heroFooter:{flexDirection:"row",alignItems:"center",gap:9,marginTop:16},heroFooterText:{color:"#c8dfe6",fontSize:12},
  formPanel:{flex:0.92,paddingHorizontal:48,paddingVertical:27,backgroundColor:"#fff"},backButton:{flexDirection:"row",alignItems:"center",alignSelf:"flex-start",gap:9,borderWidth:1,borderColor:"#dce8ec",borderRadius:12,paddingHorizontal:14,paddingVertical:10,marginBottom:18},backText:{color:colors.primary,fontWeight:"700",fontSize:13},mobileBrand:{marginBottom:22},
  eyebrow:{fontSize:11,color:colors.primary,fontWeight:"800",letterSpacing:2},heading:{fontSize:27,color:"#142f3d",fontWeight:"800",marginTop:10},subtitle:{fontSize:15,color:"#708591",lineHeight:23,marginTop:9,marginBottom:18},
  fieldGroup:{marginBottom:11},label:{fontSize:13,fontWeight:"700",color:"#263f4e",marginBottom:9},inputWrap:{borderWidth:1,borderColor:"#d9e4e8",borderRadius:13,flexDirection:"row",alignItems:"center",backgroundColor:"#fff",minHeight:46},fieldIcon:{marginLeft:15,marginRight:7},input:{flex:1,paddingHorizontal:8,paddingVertical:9,color:"#213d49",fontSize:14,minWidth:0},eye:{paddingHorizontal:13,paddingVertical:10},multilineWrap:{alignItems:"flex-start"},multilineInput:{minHeight:100,textAlignVertical:"top"},
  button:{minHeight:46,borderRadius:12,alignItems:"center",justifyContent:"center",flexDirection:"row",gap:11,paddingHorizontal:18,paddingVertical:9,marginTop:8},primaryButton:{backgroundColor:colors.primary},secondaryButton:{borderWidth:1,borderColor:colors.primary,backgroundColor:"#fff"},buttonText:{color:"white",fontWeight:"800",fontSize:15},secondaryButtonText:{color:colors.primary},disabled:{opacity:0.6},
  helper:{textAlign:"center",marginTop:24,marginBottom:2,color:"#788d98",fontSize:12},infoBox:{backgroundColor:"#eaf5f8",borderWidth:1,borderColor:"#d0e8ee",borderRadius:15,padding:15,flexDirection:"row",gap:12,alignItems:"flex-start",marginTop:16},infoTitle:{fontWeight:"800",color:"#213d49",fontSize:13,marginBottom:4},infoText:{color:"#6c828d",fontSize:13,lineHeight:20,flexShrink:1},
  sectionHeader:{marginTop:28,marginBottom:9,flexDirection:"row",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8},sectionTitle:{fontWeight:"800",color:"#193744",fontSize:17,marginTop:18,marginBottom:14},counter:{fontSize:12,color:colors.primary,fontWeight:"700"},
  listingCard:{padding:18,backgroundColor:"#f7fafb",borderColor:"#dce8ec",borderWidth:1,borderRadius:15,marginBottom:12},listingTitle:{fontWeight:"800",fontSize:16,color:"#193744"},listingMeta:{color:"#6b808c",marginTop:6},published:{flexDirection:"row",alignItems:"center",gap:6,marginTop:12},publishedText:{color:"#168056",fontWeight:"700"},cardActions:{flexDirection:"row",gap:12,marginTop:16,flexWrap:"wrap"},miniButton:{flexDirection:"row",alignItems:"center",gap:6,borderWidth:1,borderColor:"#d7e5e9",backgroundColor:"white",padding:10,borderRadius:9},miniText:{fontWeight:"700",color:colors.primary,fontSize:12},emptyBox:{backgroundColor:"#f1f7f9",alignItems:"center",padding:25,borderRadius:16},emptyTitle:{fontWeight:"800",marginVertical:8,color:"#193744",fontSize:16},
  typeGrid:{flexDirection:"row",flexWrap:"wrap",gap:8,marginBottom:18},typeChip:{borderRadius:9,borderWidth:1,borderColor:"#dce8ec",paddingVertical:10,paddingHorizontal:13},typeChipActive:{backgroundColor:"#e5f4f8",borderColor:colors.primary},typeText:{fontSize:12,color:"#4c6470",fontWeight:"600"},typeTextActive:{color:colors.primary},photoBox:{borderWidth:1,borderColor:"#bcd6df",borderStyle:"dashed",borderRadius:13,padding:20,alignItems:"center",gap:11,marginBottom:16},photoHelp:{fontSize:12,color:"#748b97",textAlign:"center"},messageBox:{marginTop:19,backgroundColor:"#eaf5f8",padding:13,borderRadius:11,flexDirection:"row",gap:9,alignItems:"flex-start"},messageText:{flex:1,color:"#25546a",fontSize:13,lineHeight:20},footer:{textAlign:"center",color:"#9babb4",fontSize:11,marginTop:20},
});
