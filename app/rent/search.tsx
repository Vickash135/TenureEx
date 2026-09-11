import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { ActivityIndicator, Menu } from "react-native-paper";
import { api } from "../../src/api/client";
import PublicHeader from "../../src/components/PublicHeader";
import { colors } from "../../src/theme";

type Property = {
  id: string; title: string; addressLine1: string; addressLine2?: string | null; townCity: string; county?: string | null; postcode: string;
  propertyType: string; bedrooms: number; bathrooms: number; receptionRooms: number; monthlyRent: string | number; depositAmount?: string | number | null;
  furnishingStatus: string; availableFrom?: string | null; hasParking: boolean; hasGarden: boolean; petsAllowed: boolean; hasWheelchairAccess: boolean;
  photoUrls?: string[]; agency?: { name: string } | null;
};

const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL ??
  "http://localhost:3000/api/v1"
).replace(/\/+$/, "");

function getPropertyPhotoUrl(photoUrl: string): string {
  if (!photoUrl) {
    return "";
  }

  if (/^https?:\/\//i.test(photoUrl)) {
    return photoUrl;
  }

  let clean = photoUrl.trim().replace(/^\/+/, "");

  clean = clean
    .replace(/^api\/v1\/uploads\/properties\//, "")
    .replace(/^uploads\/properties\//, "")
    .replace(/^properties\//, "");

  return `${API_BASE_URL}/uploads/properties/${encodeURIComponent(clean)}`;
}

const types = ["Any", "House", "Flat", "Studio", "Bungalow", "Maisonette"];

export default function RentSearchPage() {
  const params = useLocalSearchParams<{ location?: string }>();
  const { width } = useWindowDimensions();
  const desktop = width >= 920;
  const [location, setLocation] = useState(typeof params.location === "string" ? params.location : "");
  const [minBedrooms, setMinBedrooms] = useState("0");
  const [maxRent, setMaxRent] = useState("");
  const [propertyType, setPropertyType] = useState("Any");
  const [typeMenu, setTypeMenu] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await api.get("/properties", { params: {
        location: location.trim() || undefined,
        minBedrooms: Number(minBedrooms) > 0 ? minBedrooms : undefined,
        maxRent: maxRent.trim() || undefined,
        propertyType: propertyType !== "Any" ? propertyType.toUpperCase() : undefined,
      }});
      setProperties(Array.isArray(response.data) ? response.data : []);
    } catch (e: any) {
      setProperties([]); setError(e?.response?.data?.message ?? "Could not load rental properties.");
    } finally { setLoading(false); }
  }, [location, minBedrooms, maxRent, propertyType]);

  useEffect(() => { void load(); }, []);

  const resultLabel = useMemo(() => `${properties.length} approved rental${properties.length === 1 ? "" : "s"}`, [properties.length]);

  return <View style={styles.screen}>
    <PublicHeader />
    <ScrollView>
      <View style={styles.searchHero}>
        <View style={styles.maxWidth}>
          <Text style={styles.kicker}>TENUREEX RENT</Text>
          <Text style={styles.title}>Homes to rent across the UK</Text>
          <Text style={styles.subtitle}>Only properties approved by the linked estate agent are included here.</Text>
          <View style={styles.searchBox}>
            <View style={styles.locationWrap}><MaterialCommunityIcons name="magnify" size={21} color={colors.textMuted}/><TextInput value={location} onChangeText={setLocation} placeholder="Postcode, town or city" placeholderTextColor={colors.textMuted} style={styles.input} /></View>
            <Pressable style={styles.searchButton} onPress={() => void load()}><Text style={styles.searchButtonText}>Search</Text></Pressable>
          </View>
        </View>
      </View>

      <View style={[styles.content, !desktop && styles.contentMobile]}>
        <View style={[styles.filters, !desktop && styles.filtersMobile]}>
          <Text style={styles.filterTitle}>Filter rentals</Text>
          <Text style={styles.label}>Maximum monthly rent</Text>
          <View style={styles.field}><Text style={styles.prefix}>£</Text><TextInput value={maxRent} onChangeText={setMaxRent} keyboardType="numeric" placeholder="No maximum" placeholderTextColor={colors.textMuted} style={styles.fieldInput}/></View>
          <Text style={styles.label}>Minimum bedrooms</Text>
          <View style={styles.bedRow}>{[0,1,2,3,4].map((n) => <Pressable key={n} style={[styles.choice, minBedrooms === String(n) && styles.choiceActive]} onPress={() => setMinBedrooms(String(n))}><Text style={[styles.choiceText, minBedrooms === String(n) && styles.choiceTextActive]}>{n === 0 ? "Any" : `${n}+`}</Text></Pressable>)}</View>
          <Text style={styles.label}>Property type</Text>
          <Menu visible={typeMenu} onDismiss={() => setTypeMenu(false)} anchor={<Pressable style={styles.select} onPress={() => setTypeMenu(true)}><Text style={styles.selectText}>{propertyType}</Text><MaterialCommunityIcons name="chevron-down" size={20} color={colors.textPrimary}/></Pressable>}>
            {types.map((type) => <Menu.Item key={type} title={type} onPress={() => { setPropertyType(type); setTypeMenu(false); }} />)}
          </Menu>
          <Pressable style={styles.apply} onPress={() => void load()}><Text style={styles.applyText}>Apply filters</Text></Pressable>
          <Pressable onPress={() => { setLocation(""); setMaxRent(""); setMinBedrooms("0"); setPropertyType("Any"); }}><Text style={styles.clear}>Clear filters</Text></Pressable>
        </View>

        <View style={styles.results}>
          <View style={styles.resultsHead}><View><Text style={styles.resultsTitle}>{location.trim() ? `Property to rent in ${location.trim()}` : "Property to rent"}</Text><Text style={styles.count}>{loading ? "Searching…" : resultLabel}</Text></View><Pressable style={styles.registerButton} onPress={() => router.push("/auth/tenant/register" as never)}><MaterialCommunityIcons name="account-plus-outline" size={18} color={colors.primary}/><Text style={styles.registerText}>Tenant registration</Text></Pressable></View>
          {loading ? <ActivityIndicator style={{ marginTop: 70 }} /> : error ? <Text style={styles.error}>{error}</Text> : properties.length === 0 ? <View style={styles.empty}><MaterialCommunityIcons name="home-search-outline" size={44} color={colors.primary}/><Text style={styles.emptyTitle}>No approved rentals match this search</Text><Text style={styles.emptyText}>Try a nearby town, a higher rent limit, or fewer bedrooms.</Text></View> : properties.map((p) => <RentalResult key={p.id} property={p} />)}
        </View>
      </View>
    </ScrollView>
  </View>;
}

function RentalResult({ property }: { property: Property }) {
  const photo = property.photoUrls?.[0];
  const uri = photo ? getPropertyPhotoUrl(photo) : null;

  return (
    <Pressable
      style={styles.resultCard}
      onPress={() =>
        router.push(`/rent/${property.id}` as never)
      }
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={styles.resultImage}
          resizeMode="cover"
          onError={(event) => {
            console.error(
              "RENT PROPERTY IMAGE ERROR:",
              uri,
              event.nativeEvent,
            );
          }}
        />
      ) : (
        <View style={styles.resultFallback}>
          <MaterialCommunityIcons
            name="home-outline"
            size={58}
            color={colors.primary}
          />
        </View>
      )}

      <View style={styles.resultBody}>
        <View style={styles.approved}>
          <MaterialCommunityIcons
            name="shield-check"
            size={15}
            color={colors.success}
          />
          <Text style={styles.approvedText}>
            Estate-agent approved
          </Text>
        </View>

        <Text style={styles.price}>
          £{Number(property.monthlyRent).toLocaleString()} pcm
        </Text>

        <Text style={styles.propertyTitle}>
          {property.title}
        </Text>

        <Text style={styles.address}>
          {[
            property.addressLine1,
            property.townCity,
            property.postcode,
          ].join(", ")}
        </Text>

        <View style={styles.meta}>
          <Meta
            icon="bed-outline"
            text={`${property.bedrooms} bed`}
          />
          <Meta
            icon="shower"
            text={`${property.bathrooms} bath`}
          />
          <Meta
            icon="home-outline"
            text={friendly(property.propertyType)}
          />
        </View>

        <View style={styles.tags}>
          {property.hasParking && <Tag text="Parking" />}
          {property.hasGarden && <Tag text="Garden" />}
          {property.petsAllowed && <Tag text="Pets considered" />}
          {property.hasWheelchairAccess && <Tag text="Accessible" />}
        </View>

        {property.agency?.name ? (
          <Text style={styles.agent}>
            Marketed through {property.agency.name}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
function Meta({ icon, text }: any) { return <View style={styles.metaItem}><MaterialCommunityIcons name={icon} size={18} color={colors.textPrimary}/><Text style={styles.metaText}>{text}</Text></View>; }
function Tag({ text }: { text: string }) { return <View style={styles.tag}><Text style={styles.tagText}>{text}</Text></View>; }
function friendly(v: string) { return v.toLowerCase().replace(/_/g," ").replace(/\b\w/g,(m)=>m.toUpperCase()); }

const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:colors.background}, searchHero:{backgroundColor:colors.primaryLight,paddingVertical:42,paddingHorizontal:24,borderBottomWidth:1,borderBottomColor:colors.border}, maxWidth:{maxWidth:1380,width:"100%",alignSelf:"center"}, kicker:{color:colors.primary,fontSize:12,fontWeight:"900",letterSpacing:1.3}, title:{fontSize:36,fontWeight:"900",color:colors.textPrimary,marginTop:5,letterSpacing:-1}, subtitle:{color:colors.textSecondary,marginTop:7,fontSize:15}, searchBox:{marginTop:22,maxWidth:760,backgroundColor:colors.white,padding:7,borderRadius:16,flexDirection:"row",gap:8,borderWidth:1,borderColor:colors.border}, locationWrap:{flex:1,flexDirection:"row",alignItems:"center",paddingHorizontal:12}, input:{flex:1,height:48,marginLeft:7,color:colors.textPrimary,fontSize:16,outlineStyle:"none"} as any, searchButton:{minWidth:120,borderRadius:12,backgroundColor:colors.primary,alignItems:"center",justifyContent:"center"}, searchButtonText:{color:colors.white,fontWeight:"900"},
  content:{maxWidth:1380,width:"100%",alignSelf:"center",padding:24,flexDirection:"row",gap:24,alignItems:"flex-start"}, contentMobile:{flexDirection:"column"}, filters:{width:300,backgroundColor:colors.white,borderRadius:18,padding:20,borderWidth:1,borderColor:colors.border}, filtersMobile:{width:"100%"}, filterTitle:{fontSize:19,fontWeight:"900",color:colors.textPrimary,marginBottom:18}, label:{fontSize:13,fontWeight:"800",color:colors.textPrimary,marginTop:15,marginBottom:7}, field:{height:48,borderWidth:1,borderColor:colors.border,borderRadius:12,flexDirection:"row",alignItems:"center",paddingHorizontal:12}, prefix:{fontWeight:"800",color:colors.textSecondary}, fieldInput:{flex:1,height:46,marginLeft:6,color:colors.textPrimary,outlineStyle:"none"} as any, bedRow:{flexDirection:"row",flexWrap:"wrap",gap:6}, choice:{minWidth:45,height:40,borderRadius:10,borderWidth:1,borderColor:colors.border,alignItems:"center",justifyContent:"center"}, choiceActive:{backgroundColor:colors.primary,borderColor:colors.primary}, choiceText:{fontWeight:"800",color:colors.textPrimary,fontSize:13}, choiceTextActive:{color:colors.white}, select:{height:48,borderWidth:1,borderColor:colors.border,borderRadius:12,paddingHorizontal:13,flexDirection:"row",alignItems:"center",justifyContent:"space-between"}, selectText:{fontWeight:"700",color:colors.textPrimary}, apply:{height:48,borderRadius:12,backgroundColor:colors.secondary,alignItems:"center",justifyContent:"center",marginTop:20}, applyText:{fontWeight:"900",color:colors.textPrimary}, clear:{textAlign:"center",marginTop:12,color:colors.primary,fontWeight:"800"},
  results:{flex:1,minWidth:0}, resultsHead:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",marginBottom:16}, resultsTitle:{fontSize:25,fontWeight:"900",color:colors.textPrimary}, count:{color:colors.textSecondary,marginTop:4}, registerButton:{flexDirection:"row",gap:6,alignItems:"center",paddingHorizontal:12,paddingVertical:9,borderRadius:11,borderWidth:1,borderColor:colors.primary}, registerText:{color:colors.primary,fontWeight:"800",fontSize:13}, resultCard:{backgroundColor:colors.white,borderRadius:18,overflow:"hidden",borderWidth:1,borderColor:colors.border,marginBottom:16,flexDirection:"row",minHeight:245}, resultImage:{width:330,minHeight:245}, resultFallback:{width:330,minHeight:245,alignItems:"center",justifyContent:"center",backgroundColor:colors.primaryLight}, resultBody:{flex:1,padding:22}, approved:{alignSelf:"flex-start",backgroundColor:colors.successLight,borderRadius:999,paddingHorizontal:9,paddingVertical:5,flexDirection:"row",gap:5,alignItems:"center"}, approvedText:{color:colors.success,fontSize:11,fontWeight:"900"}, price:{fontSize:25,fontWeight:"900",color:colors.textPrimary,marginTop:11}, propertyTitle:{fontSize:18,fontWeight:"800",color:colors.textPrimary,marginTop:4}, address:{color:colors.textSecondary,marginTop:5}, meta:{flexDirection:"row",gap:17,flexWrap:"wrap",marginTop:14}, metaItem:{flexDirection:"row",gap:5,alignItems:"center"}, metaText:{color:colors.textPrimary,fontWeight:"700",fontSize:13}, tags:{flexDirection:"row",flexWrap:"wrap",gap:6,marginTop:13}, tag:{backgroundColor:colors.surfaceSoft,borderRadius:999,paddingHorizontal:9,paddingVertical:5}, tagText:{fontSize:11,fontWeight:"700",color:colors.textSecondary}, agent:{marginTop:14,color:colors.textMuted,fontSize:12}, empty:{backgroundColor:colors.white,borderRadius:18,borderWidth:1,borderColor:colors.border,padding:50,alignItems:"center"}, emptyTitle:{fontSize:18,fontWeight:"900",color:colors.textPrimary,marginTop:10}, emptyText:{color:colors.textSecondary,marginTop:5,textAlign:"center"}, error:{color:colors.error,backgroundColor:colors.errorLight,padding:16,borderRadius:12},
});
