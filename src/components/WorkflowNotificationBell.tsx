import NotificationCenterBell from "./NotificationCenterBell";

type Props = {
  role: "tenant" | "landlord" | "maintenance";
};

export default function WorkflowNotificationBell({ role }: Props) {
  return <NotificationCenterBell role={role} />;
}
