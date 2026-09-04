import CouncilInspectionHub from "../../src/components/CouncilInspectionHub";
import ScreenContainer from "../../src/components/ScreenContainer";
import { spacing } from "../../src/theme";

export default function TenantCouncilInspections() {
  return (
    <ScreenContainer
      scrollable
      contentStyle={{
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.lg,
        paddingBottom: 48,
      }}
    >
      <CouncilInspectionHub portal="tenant" />
    </ScreenContainer>
  );
}