import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { ScrollView, StyleSheet, Text, Pressable, View } from "react-native";
import { colors } from "../theme";
const items=[
 {label:"Dashboard",icon:"view-dashboard-outline",path:"/maintenance/dashboard"},
 {label:"Available jobs",icon:"briefcase-search-outline",path:"/maintenance/available-jobs"},
 {label:"Assigned jobs",icon:"clipboard-text-clock-outline",path:"/maintenance/assigned-jobs"},
 {label:"Completed jobs",icon:"check-circle-outline",path:"/maintenance/completed-jobs"},
 {label:"Messages",icon:"message-text-outline",path:"/maintenance/messages"},
 {label:"Settings",icon:"cog-outline",path:"/maintenance/settings"},
] as const;
export default function MaintenancePortalNavigation(){const pathname=usePathname();return <View style={s.shell}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>{items.map((item)=>{const active=pathname===item.path || (item.label==="Assigned jobs"&&pathname==="/maintenance/job-details");return <Pressable key={item.label} style={[s.item,active&&s.active]} onPress={()=>router.push(item.path as never)}><MaterialCommunityIcons name={item.icon as any} size={18} color={active?colors.primary:colors.textSecondary}/><Text style={[s.label,active&&s.activeLabel]}>{item.label}</Text></Pressable>})}</ScrollView></View>}
const s=StyleSheet.create({shell:{width:"100%",borderWidth:1,borderColor:colors.border,borderRadius:14,backgroundColor:colors.white,marginBottom:18},row:{padding:7,gap:5},item:{minHeight:40,paddingHorizontal:13,borderRadius:10,flexDirection:"row",alignItems:"center",gap:7},active:{backgroundColor:colors.primaryLight},label:{fontSize:13,fontWeight:"700",color:colors.textSecondary},activeLabel:{color:colors.primary,fontWeight:"900"}});
