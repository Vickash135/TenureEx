import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Badge, Divider, Menu } from "react-native-paper";
import { api } from "../api/client";
import { colors } from "../theme";

type NotificationRow={id:string;title?:string;message?:string;readAt?:string|null;entityType?:string|null;entityId?:string|null;createdAt?:string};
export default function MaintenanceNotificationBell(){
 const [visible,setVisible]=useState(false); const [rows,setRows]=useState<NotificationRow[]>([]);
 const load=useCallback(async()=>{try{const r=await api.get("/property-workflows/notifications");setRows(Array.isArray(r.data)?r.data:[])}catch{}},[]);
 useEffect(()=>{void load()},[load]);
 const unread=useMemo(()=>rows.filter(x=>!x.readAt).length,[rows]);
 const open=async(row:NotificationRow)=>{if(!row.readAt){try{await api.patch(`/property-workflows/notifications/${row.id}/read`,{});setRows(c=>c.map(x=>x.id===row.id?{...x,readAt:new Date().toISOString()}:x))}catch{}}setVisible(false);if(row.entityType==="MaintenanceRequest"&&row.entityId)router.push({pathname:"/maintenance/job-details" as never,params:{jobId:row.entityId}})};
 return <Menu visible={visible} onDismiss={()=>setVisible(false)} anchor={<Pressable accessibilityLabel="Maintenance notifications" style={s.button} onPress={()=>{setVisible(true);void load()}}><MaterialCommunityIcons name="bell-outline" size={22} color={colors.textPrimary}/>{unread>0?<Badge style={s.badge}>{unread>99?"99+":unread}</Badge>:null}</Pressable>} contentStyle={s.menu}>
   <View style={s.head}><Text style={s.title}>Notifications</Text><Text style={s.count}>{unread} unread</Text></View><Divider/>
   {rows.slice(0,10).map(row=><Menu.Item key={row.id} leadingIcon={row.readAt?"bell-outline":"bell-badge-outline"} title={row.title||"Maintenance update"} titleStyle={!row.readAt?s.unread:undefined} onPress={()=>void open(row)}/>) }
   {!rows.length?<Menu.Item title="No notifications yet" disabled/>:null}
 </Menu>
}
const s=StyleSheet.create({button:{width:42,height:42,borderRadius:12,borderWidth:1,borderColor:colors.border,backgroundColor:colors.white,alignItems:"center",justifyContent:"center"},badge:{position:"absolute",top:-6,right:-6},menu:{width:330,maxWidth:"92vw" as any},head:{paddingHorizontal:16,paddingVertical:10,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},title:{fontWeight:"900",color:colors.textPrimary,fontSize:16},count:{fontSize:12,color:colors.textSecondary},unread:{fontWeight:"900"}});
