import CouncilInspectionHub from "../../src/components/CouncilInspectionHub";
import AgentModuleScreen from "./AgentModuleScreen";
export default function AgentCouncilInspections(){ return <AgentModuleScreen pageTitle="Council & Inspections" pageSubtitle="Manage property inspection cases and council-required actions." activePage="Council & Inspections" primaryAction="Refresh" statistics={[]} records={[]} hideRecords customContent={<CouncilInspectionHub portal="agent"/>} />; }
