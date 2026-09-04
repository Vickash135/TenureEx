import { router } from "expo-router";
import { Button, View } from "react-native";
import CouncilInspectionHub from "../../src/components/CouncilInspectionHub";
import ScreenContainer from "../../src/components/ScreenContainer";
import { colors, spacing } from "../../src/theme";
export default function TenantCouncilInspections(){return <ScreenContainer scrollable contentStyle={{padding:spacing.xl}}><View style={{maxWidth:1200,width:"100%",alignSelf:"center",gap:16}}><Button title="← Tenant dashboard" color={colors.primary} onPress={()=>router.push("/tenant/dashboard" as never)}/><CouncilInspectionHub portal="tenant"/></View></ScreenContainer>}
