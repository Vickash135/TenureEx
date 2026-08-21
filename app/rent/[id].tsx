import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { api, getStoredUser } from "../../src/api/client";
import PublicHeader from "../../src/components/PublicHeader";
import { colors } from "../../src/theme";

type Property = any;
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/api/v1").replace(/\/+$/, "");
const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1$/, "");

export default function PublicPropertyDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const desktop = width >= 920;
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    api.get(`/properties/${id}`).then((r) => setProperty(r.data)).catch((e) => setError(e?.response?.data?.message ?? "Property could not be loaded.")).finally(() => setLoading(false));
  }, [id]);

  const enquire = async () => {
    const user = await getStoredUser<any>();
    if (user?.userType === "TENANT") router.push("/tenant/dashboard" as never);
    else router.push(`/auth/tenant/register?returnTo=${encodeURIComponent(`/rent/${id}`)}` as never);
  };

  if (loading) return <View style={styles.screen}><PublicHeader/><ActivityIndicator style={{marginTop:100}}/></View>;
  if (!property || error) return <View style={styles.screen}><PublicHeader/><View style={styles.errorBox}><Text style={styles.errorTitle}>Property unavailable</Text><Text style={styles.errorText}>{error || "This rental is no longer available."}</Text><Pressable onPress={() => router.push("/rent" as never)}><Text style={styles.back}>Back to rental search</Text></Pressable></View></View>;

  const photos = (property.photoUrls ?? []).map((url: string) => url.startsWith("http") ? url : `${API_ORIGIN}${url}`);
  return <View style={styles.screen}><PublicHeader/><ScrollView>
    <View style={styles.max}>
      <Pressable style={styles.backRow} onPress={() => router.back()}><MaterialCommunityIcons name="arrow-left" size={18} color={colors.primary}/><Text style={styles.back}>Back to rentals</Text></Pressable>
      <View style={[styles.gallery, !desktop && styles.galleryMobile]}>
        {photos[0] ? <Image source={{uri:photos[0]}} style={styles.mainPhoto}/> : <View style={styles.mainFallback}><MaterialCommunityIcons name="home-outline" size={70} color={colors.primary}/></View>}
        {desktop ? <View style={styles.sidePhotos}>{photos.slice(1,3).map((p:string)=><Image key={p} source={{uri:p}} style={styles.sidePhoto}/>)}{photos.length < 2 ? <View style={styles.sideFallback}/>:null}</View> : null}
      </View>
      <View style={[styles.layout, !desktop && styles.layoutMobile]}>
        <View style={styles.main}>
          <View style={styles.approved}><MaterialCommunityIcons name="shield-check" size={16} color={colors.success}/><Text style={styles.approvedText}>Approved by estate agent</Text></View>
          <Text style={styles.price}>£{Number(property.monthlyRent).toLocaleString()} pcm</Text>
          <Text style={styles.title}>{property.title}</Text>
          <Text style={styles.address}>{[property.addressLine1,property.addressLine2,property.townCity,property.county,property.postcode].filter(Boolean).join(", ")}</Text>
          <View style={styles.summary}><Summary icon="bed-outline" text={`${property.bedrooms} bedrooms`}/><Summary icon="shower" text={`${property.bathrooms} bathrooms`}/><Summary icon="sofa-outline" text={`${property.receptionRooms} reception`}/><Summary icon="home-outline" text={friendly(property.propertyType)}/></View>
          <Section title="Property description"><Text style={styles.bodyText}>{property.description || "The landlord has not added a description yet."}</Text></Section>
          <Section title="Key information"><View style={styles.infoGrid}><Info label="Deposit" value={property.depositAmount ? `£${Number(property.depositAmount).toLocaleString()}` : "Ask agent"}/><Info label="Furnishing" value={friendly(property.furnishingStatus)}/><Info label="Available from" value={property.availableFrom ? new Date(property.availableFrom).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}) : "Ask agent"}/><Info label="Council tax band" value={property.councilTaxBand || "Ask agent"}/></View></Section>
          <Section title="Features"><View style={styles.featureGrid}>{property.hasParking && <Feature icon="car-outline" text="Parking"/>}{property.hasGarden && <Feature icon="flower-outline" text="Garden"/>}{property.petsAllowed && <Feature icon="paw-outline" text="Pets considered"/>}{property.hasLift && <Feature icon="elevator" text="Lift"/>}{property.hasWheelchairAccess && <Feature icon="wheelchair-accessibility" text="Wheelchair access"/>}{property.childrenAllowed && <Feature icon="human-male-child" text="Children considered"/>}</View></Section>
        </View>
        <View style={styles.enquiryCard}><Text style={styles.enquiryKicker}>INTERESTED IN THIS HOME?</Text><Text style={styles.enquiryTitle}>Continue with TenureEx</Text><Text style={styles.enquiryText}>Create a simple tenant account to personalise your rental journey and continue to enquiries and applications.</Text><Pressable style={styles.enquireButton} onPress={() => void enquire()}><Text style={styles.enquireButtonText}>Register / continue as tenant</Text></Pressable><Pressable onPress={() => router.push("/auth/tenant/login" as never)}><Text style={styles.signin}>Already registered? Sign in</Text></Pressable>{property.agency?.name ? <View style={styles.agentBox}><Text style={styles.agentLabel}>MARKETED THROUGH</Text><Text style={styles.agentName}>{property.agency.name}</Text></View> : null}</View>
      </View>
    </View>
  </ScrollView></View>;
}
function Section({title,children}:any){return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>}
function Summary({icon,text}:any){return <View style={styles.summaryItem}><MaterialCommunityIcons name={icon} size={21} color={colors.primary}/><Text style={styles.summaryText}>{text}</Text></View>}
function Info({label,value}:any){return <View style={styles.info}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>}
function Feature({icon,text}:any){return <View style={styles.feature}><MaterialCommunityIcons name={icon} size={20} color={colors.primary}/><Text style={styles.featureText}>{text}</Text></View>}
function friendly(v:string){return String(v||"").toLowerCase().replace(/_/g," ").replace(/\b\w/g,(m)=>m.toUpperCase())}
const styles=StyleSheet.create({screen:{flex:1,backgroundColor:colors.background},max:{maxWidth:1380,width:"100%",alignSelf:"center",padding:24},backRow:{flexDirection:"row",gap:6,alignItems:"center",marginBottom:16},back:{color:colors.primary,fontWeight:"800"},gallery:{height:480,flexDirection:"row",gap:10,borderRadius:22,overflow:"hidden"},galleryMobile:{height:300},mainPhoto:{flex:2,height:"100%"},mainFallback:{flex:2,height:"100%",alignItems:"center",justifyContent:"center",backgroundColor:colors.primaryLight},sidePhotos:{flex:1,gap:10},sidePhoto:{flex:1,width:"100%"},sideFallback:{flex:1,backgroundColor:colors.surfaceSoft},layout:{flexDirection:"row",gap:28,alignItems:"flex-start",marginTop:28},layoutMobile:{flexDirection:"column"},main:{flex:1,minWidth:0},approved:{alignSelf:"flex-start",flexDirection:"row",gap:6,alignItems:"center",backgroundColor:colors.successLight,borderRadius:999,paddingHorizontal:10,paddingVertical:6},approvedText:{color:colors.success,fontWeight:"900",fontSize:12},price:{fontSize:32,fontWeight:"900",color:colors.textPrimary,marginTop:15},title:{fontSize:25,fontWeight:"900",color:colors.textPrimary,marginTop:4},address:{fontSize:15,color:colors.textSecondary,marginTop:7},summary:{flexDirection:"row",flexWrap:"wrap",gap:18,marginTop:20,paddingVertical:18,borderTopWidth:1,borderBottomWidth:1,borderColor:colors.border},summaryItem:{flexDirection:"row",gap:7,alignItems:"center"},summaryText:{fontWeight:"800",color:colors.textPrimary},section:{paddingVertical:24,borderBottomWidth:1,borderBottomColor:colors.border},sectionTitle:{fontSize:20,fontWeight:"900",color:colors.textPrimary,marginBottom:12},bodyText:{color:colors.textSecondary,fontSize:15,lineHeight:25},infoGrid:{flexDirection:"row",flexWrap:"wrap",gap:12},info:{minWidth:190,flexGrow:1,backgroundColor:colors.white,borderWidth:1,borderColor:colors.border,borderRadius:14,padding:15},infoLabel:{fontSize:12,fontWeight:"800",color:colors.textMuted},infoValue:{fontSize:15,fontWeight:"800",color:colors.textPrimary,marginTop:4},featureGrid:{flexDirection:"row",flexWrap:"wrap",gap:10},feature:{minWidth:180,flexDirection:"row",gap:8,alignItems:"center",backgroundColor:colors.primaryLight,borderRadius:12,padding:12},featureText:{fontWeight:"700",color:colors.textPrimary},enquiryCard:{width:340,backgroundColor:colors.white,borderRadius:20,borderWidth:1,borderColor:colors.border,padding:22},enquiryKicker:{fontSize:11,fontWeight:"900",letterSpacing:1.1,color:colors.primary},enquiryTitle:{fontSize:22,fontWeight:"900",color:colors.textPrimary,marginTop:6},enquiryText:{color:colors.textSecondary,lineHeight:21,marginTop:8},enquireButton:{height:50,borderRadius:12,backgroundColor:colors.secondary,alignItems:"center",justifyContent:"center",marginTop:18},enquireButtonText:{fontWeight:"900",color:colors.textPrimary},signin:{color:colors.primary,fontWeight:"800",textAlign:"center",marginTop:13},agentBox:{marginTop:22,paddingTop:18,borderTopWidth:1,borderTopColor:colors.border},agentLabel:{fontSize:10,fontWeight:"900",letterSpacing:1,color:colors.textMuted},agentName:{fontWeight:"900",color:colors.textPrimary,marginTop:5},errorBox:{margin:40,alignItems:"center"},errorTitle:{fontSize:24,fontWeight:"900",color:colors.textPrimary},errorText:{color:colors.textSecondary,marginVertical:10}})
