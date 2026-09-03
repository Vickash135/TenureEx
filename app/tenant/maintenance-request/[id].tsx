import { useLocalSearchParams } from "expo-router";
import MaintenanceRequestDetails from "../../../src/components/MaintenanceRequestDetails";

export default function TenantMaintenanceRequestDetails() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  return <MaintenanceRequestDetails requestId={id || ""} portalRole="tenant" />;
}
