import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    useWindowDimensions,
    View
} from "react-native";
import {
    Button,
    Checkbox,
    Chip,
    Divider,
    Snackbar,
    TextInput,
} from "react-native-paper";

import ScreenContainer from "../../src/components/ScreenContainer";
import { colors, radius, spacing } from "../../src/theme";

type IconName =
  keyof typeof MaterialCommunityIcons.glyphMap;

type AgreementStatus =
  | "Ready to sign"
  | "Signed"
  | "Pending landlord";

type PropertyDetails = {
  id: string;
  title: string;
  address: string;
  monthlyRent: number;
  deposit: number;
  tenancyStart: string;
  tenancyEnd: string;
  tenancyLength: string;
  paymentDate: string;
  landlordName: string;
  agentName: string;
};

const properties: PropertyDetails[] = [
  {
    id: "PROP-001",
    title: "Modern Two-Bedroom City Apartment",
    address: "42 King Street, Leeds, LS1 2HQ",
    monthlyRent: 1325,
    deposit: 1528,
    tenancyStart: "01 September 2026",
    tenancyEnd: "31 August 2027",
    tenancyLength: "12 months",
    paymentDate: "1st day of each month",
    landlordName: "David Thompson",
    agentName: "TenureEx Leeds",
  },
  {
    id: "PROP-002",
    title: "Three-Bedroom Family Home",
    address: "18 Victoria Road, Manchester, M14 6BT",
    monthlyRent: 1450,
    deposit: 1673,
    tenancyStart: "15 September 2026",
    tenancyEnd: "14 September 2027",
    tenancyLength: "12 months",
    paymentDate: "15th day of each month",
    landlordName: "Sarah Williams",
    agentName: "TenureEx Manchester",
  },
  {
    id: "PROP-003",
    title: "City Centre One-Bedroom Flat",
    address: "91 High Street, Birmingham, B4 7SL",
    monthlyRent: 1100,
    deposit: 1269,
    tenancyStart: "01 October 2026",
    tenancyEnd: "30 September 2027",
    tenancyLength: "12 months",
    paymentDate: "1st day of each month",
    landlordName: "Michael Brown",
    agentName: "TenureEx Birmingham",
  },
  {
    id: "PROP-004",
    title: "Accessible Two-Bedroom Bungalow",
    address: "7 Meadow Close, Sheffield, S11 8RT",
    monthlyRent: 1250,
    deposit: 1442,
    tenancyStart: "20 September 2026",
    tenancyEnd: "19 September 2027",
    tenancyLength: "12 months",
    paymentDate: "20th day of each month",
    landlordName: "Emma Johnson",
    agentName: "TenureEx Sheffield",
  },
];

export default function TenantAgreementScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1000;

  const params = useLocalSearchParams<{
    propertyId?: string | string[];
    applicationId?: string | string[];
  }>();

  const propertyId = Array.isArray(params.propertyId)
    ? params.propertyId[0]
    : params.propertyId;

  const applicationId = Array.isArray(params.applicationId)
    ? params.applicationId[0]
    : params.applicationId;

  const property = useMemo(() => {
    return (
      properties.find((item) => item.id === propertyId) ??
      properties[0]
    );
  }, [propertyId]);

  const [agreementStatus, setAgreementStatus] =
    useState<AgreementStatus>("Ready to sign");

  const [fullName, setFullName] = useState("");
  const [signature, setSignature] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [confirmedDetails, setConfirmedDetails] =
    useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const canSign =
    fullName.trim().length > 2 &&
    signature.trim().length > 2 &&
    acceptedTerms &&
    confirmedDetails;

  const handleSignAgreement = async () => {
  if (!fullName.trim()) {
    setMessage("Enter your full legal name.");
    return;
  }

  if (!signature.trim()) {
    setMessage("Enter your electronic signature.");
    return;
  }

  if (!acceptedTerms || !confirmedDetails) {
    setMessage("Tick both confirmation boxes.");
    return;
  }

  setLoading(true);

  try {
    await new Promise((resolve) =>
      setTimeout(resolve, 1000),
    );

    console.log("Agreement signed:", {
      propertyId: property.id,
      applicationId,
      fullName,
      signature,
      signedAt: new Date().toISOString(),
    });

    setAgreementStatus("Signed");
    setMessage(
      "Tenancy agreement signed successfully.",
    );
  } catch (error) {
    console.error(error);

    setMessage(
      "The agreement could not be signed. Please try again.",
    );
  } finally {
    setLoading(false);
  }
};



  const handleContinue = () => {
    router.replace({
      pathname: "/tenant/my-property" as never,
      params: {
        propertyId: property.id,
        applicationId:
          applicationId ?? `APP-${Date.now()}`,
      },
    });
  };

  return (
    <ScreenContainer
      scrollable
      contentStyle={styles.screenContent}
    >
      <View style={styles.page}>
        <View style={styles.topBar}>
          <Pressable
            style={styles.brand}
            onPress={() =>
              router.replace(
                "/tenant/dashboard" as never,
              )
            }
          >
            <View style={styles.logo}>
              <MaterialCommunityIcons
                name="home-city-outline"
                size={27}
                color={colors.white}
              />
            </View>

            <View>
              <Text style={styles.brandName}>
                TenureEx
              </Text>

              <Text style={styles.brandSubtitle}>
                Tenancy agreement
              </Text>
            </View>
          </Pressable>

          <Button
            mode="text"
            icon="view-dashboard-outline"
            onPress={() =>
              router.replace(
                "/tenant/dashboard" as never,
              )
            }
          >
            Dashboard
          </Button>
        </View>

        <View
          style={[
            styles.layout,
            !isDesktop && styles.layoutStacked,
          ]}
        >
          <View style={styles.mainColumn}>
            <View style={styles.heroCard}>
              <View style={styles.heroIcon}>
                <MaterialCommunityIcons
                  name={
                    agreementStatus === "Signed"
                      ? "file-check-outline"
                      : "file-sign"
                  }
                  size={38}
                  color={
                    agreementStatus === "Signed"
                      ? colors.success
                      : colors.primary
                  }
                />
              </View>

              <View style={styles.heroContent}>
                <Text style={styles.heroLabel}>
                  TENANCY AGREEMENT
                </Text>

                <Text style={styles.heroTitle}>
                  {agreementStatus === "Signed"
                    ? "Your agreement has been signed"
                    : "Review and sign your tenancy agreement"}
                </Text>

                <Text style={styles.heroDescription}>
                  Read the agreement carefully before
                  adding your electronic signature.
                </Text>
              </View>

              <Chip
                icon={
                  agreementStatus === "Signed"
                    ? "check-circle"
                    : "clock-outline"
                }
                style={
                  agreementStatus === "Signed"
                    ? styles.signedChip
                    : styles.readyChip
                }
              >
                {agreementStatus}
              </Chip>
            </View>

            <AgreementSection
              number="1"
              icon="home-outline"
              title="Property information"
            >
              <AgreementRow
                label="Property"
                value={property.title}
              />

              <AgreementRow
                label="Address"
                value={property.address}
              />

              <AgreementRow
                label="Landlord"
                value={property.landlordName}
              />

              <AgreementRow
                label="Managing agent"
                value={property.agentName}
              />
            </AgreementSection>

            <AgreementSection
              number="2"
              icon="calendar-range"
              title="Tenancy period"
            >
              <AgreementRow
                label="Tenancy start"
                value={property.tenancyStart}
              />

              <AgreementRow
                label="Tenancy end"
                value={property.tenancyEnd}
              />

              <AgreementRow
                label="Agreement length"
                value={property.tenancyLength}
              />
            </AgreementSection>

            <AgreementSection
              number="3"
              icon="cash-multiple"
              title="Rent and deposit"
            >
              <AgreementRow
                label="Monthly rent"
                value={formatCurrency(
                  property.monthlyRent,
                )}
              />

              <AgreementRow
                label="Security deposit"
                value={formatCurrency(property.deposit)}
              />

              <AgreementRow
                label="Rent payment date"
                value={property.paymentDate}
              />

              <View style={styles.informationBox}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={22}
                  color={colors.primary}
                />

                <Text style={styles.informationText}>
                  The deposit will be protected using an
                  approved tenancy deposit protection
                  scheme.
                </Text>
              </View>
            </AgreementSection>

            <AgreementSection
              number="4"
              icon="clipboard-text-outline"
              title="Important tenancy terms"
            >
              <TermRow text="The tenant must pay the rent in full by the agreed payment date." />

              <TermRow text="The tenant must keep the property reasonably clean and report damage or maintenance problems." />

              <TermRow text="The property must not be sublet without written permission from the landlord." />

              <TermRow text="The tenant must not cause excessive noise, nuisance or antisocial behaviour." />

              <TermRow text="Pets are only allowed when written permission has been provided." />

              <TermRow text="The landlord or agent must provide appropriate notice before entering the property, except during an emergency." />

              <TermRow text="The tenant must return the property in an appropriate condition at the end of the tenancy." />
            </AgreementSection>

            {agreementStatus !== "Signed" ? (
              <AgreementSection
                number="5"
                icon="draw"
                title="Electronic signature"
              >
                <Text style={styles.signatureDescription}>
                  Enter your legal name and electronic
                  signature exactly as you want them to
                  appear on the agreement.
                </Text>

                <View style={styles.fields}>
                  <TextInput
                    mode="outlined"
                    label="Full legal name"
                    value={fullName}
                    onChangeText={setFullName}
                    style={styles.field}
                    left={
                      <TextInput.Icon icon="account-outline" />
                    }
                  />

                  <TextInput
                    mode="outlined"
                    label="Electronic signature"
                    placeholder="Type your full name"
                    value={signature}
                    onChangeText={setSignature}
                    style={styles.field}
                    left={
                      <TextInput.Icon icon="draw" />
                    }
                  />
                </View>

                <ConfirmationRow
                  title="Agreement acceptance"
                  description="I have read and accept the terms of this tenancy agreement."
                  checked={acceptedTerms}
                  onPress={() =>
                    setAcceptedTerms(
                      (current) => !current,
                    )
                  }
                />

                <ConfirmationRow
                  title="Information confirmation"
                  description="I confirm that my personal and tenancy information is correct."
                  checked={confirmedDetails}
                  onPress={() =>
                    setConfirmedDetails(
                      (current) => !current,
                    )
                  }
                />

                <View style={styles.signActions}>
                  <Button
                    mode="outlined"
                    icon="arrow-left"
                    disabled={loading}
                    onPress={() => router.back()}
                  >
                    Back
                  </Button>

                  <Button
                    mode="contained"
                    icon="file-sign"
                    loading={loading}
                    disabled={loading || !canSign}
                    onPress={handleSignAgreement}
                  >
                    Sign agreement
                  </Button>
                </View>
              </AgreementSection>
            ) : (
              <View style={styles.signedCard}>
                <View style={styles.signedIcon}>
                  <MaterialCommunityIcons
                    name="check-decagram"
                    size={38}
                    color={colors.success}
                  />
                </View>

                <View style={styles.signedContent}>
                  <Text style={styles.signedTitle}>
                    Agreement completed
                  </Text>

                  <Text style={styles.signedDescription}>
                    Your electronic signature has been
                    recorded. You can now access your
                    property management page.
                  </Text>

                  <View style={styles.signedDetails}>
                    <Text style={styles.signedName}>
                      Signed by: {fullName}
                    </Text>

                    <Text style={styles.signedDate}>
                      Signed on{" "}
                      {new Date().toLocaleDateString(
                        "en-GB",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        },
                      )}
                    </Text>
                  </View>
                </View>

                <Button
                  mode="contained"
                  icon="home-key-outline"
                  onPress={handleContinue}
                >
                  Open My Property
                </Button>
              </View>
            )}
          </View>

          <View style={styles.sideColumn}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <MaterialCommunityIcons
                  name="file-document-check-outline"
                  size={30}
                  color={colors.primary}
                />
              </View>

              <Text style={styles.summaryLabel}>
                AGREEMENT SUMMARY
              </Text>

              <Text style={styles.summaryTitle}>
                {property.title}
              </Text>

              <Text style={styles.summaryAddress}>
                {property.address}
              </Text>

              <Divider style={styles.divider} />

              <SummaryRow
                label="Application ID"
                value={
                  applicationId ?? "Not provided"
                }
              />

              <SummaryRow
                label="Property ID"
                value={property.id}
              />

              <SummaryRow
                label="Agreement status"
                value={agreementStatus}
              />

              <SummaryRow
                label="Start date"
                value={property.tenancyStart}
              />

              <SummaryRow
                label="Monthly rent"
                value={formatCurrency(
                  property.monthlyRent,
                )}
              />

              <SummaryRow
                label="Deposit"
                value={formatCurrency(property.deposit)}
              />
            </View>

            <View style={styles.downloadCard}>
              <MaterialCommunityIcons
                name="file-download-outline"
                size={27}
                color={colors.primary}
              />

              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>
                  Agreement document
                </Text>

                <Text style={styles.cardDescription}>
                  The final signed PDF will be available
                  after both tenant and landlord
                  signatures are completed.
                </Text>

                <Button
                  mode="outlined"
                  icon="download-outline"
                  disabled={agreementStatus !== "Signed"}
                  onPress={() =>
                    setMessage(
                      "The signed agreement download will be connected to the backend later.",
                    )
                  }
                >
                  Download agreement
                </Button>
              </View>
            </View>

            <View style={styles.helpCard}>
              <MaterialCommunityIcons
                name="help-circle-outline"
                size={27}
                color={colors.primary}
              />

              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>
                  Need help?
                </Text>

                <Text style={styles.cardDescription}>
                  Contact the agent before signing when
                  you do not understand any part of the
                  agreement.
                </Text>

                <Button
                  mode="text"
                  icon="message-text-outline"
                  onPress={() =>
                    router.push(
                      "/tenant/messages" as never,
                    )
                  }
                >
                  Contact agent
                </Button>
              </View>
            </View>
          </View>
        </View>
      </View>

      <Snackbar
        visible={Boolean(message)}
        duration={3000}
        onDismiss={() => setMessage("")}
        action={{
          label: "Close",
          onPress: () => setMessage(""),
        }}
      >
        {message}
      </Snackbar>
    </ScreenContainer>
  );
}

function AgreementSection({
  number,
  icon,
  title,
  children,
}: {
  number: string;
  icon: IconName;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionNumber}>
          <Text style={styles.sectionNumberText}>
            {number}
          </Text>
        </View>

        <View style={styles.sectionIcon}>
          <MaterialCommunityIcons
            name={icon}
            size={23}
            color={colors.primary}
          />
        </View>

        <Text style={styles.sectionTitle}>
          {title}
        </Text>
      </View>

      <View style={styles.sectionBody}>
        {children}
      </View>
    </View>
  );
}

function AgreementRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.agreementRow}>
      <Text style={styles.agreementRowLabel}>
        {label}
      </Text>

      <Text style={styles.agreementRowValue}>
        {value}
      </Text>
    </View>
  );
}

function TermRow({ text }: { text: string }) {
  return (
    <View style={styles.termRow}>
      <MaterialCommunityIcons
        name="check-circle-outline"
        size={20}
        color={colors.success}
      />

      <Text style={styles.termText}>
        {text}
      </Text>
    </View>
  );
}

function ConfirmationRow({
  title,
  description,
  checked,
  onPress,
}: {
  title: string;
  description: string;
  checked: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.confirmationRow,
        checked && styles.confirmationRowSelected,
      ]}
      onPress={onPress}
    >
      <Checkbox
        status={checked ? "checked" : "unchecked"}
        onPress={onPress}
      />

      <View style={styles.confirmationContent}>
        <Text style={styles.confirmationTitle}>
          {title}
        </Text>

        <Text style={styles.confirmationDescription}>
          {description}
        </Text>
      </View>
    </Pressable>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryRowLabel}>
        {label}
      </Text>

      <Text style={styles.summaryRowValue}>
        {value}
      </Text>
    </View>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

const styles = StyleSheet.create({
  screenContent: {
    padding: 0,
  },

  page: {
    width: "100%",
    maxWidth: 1450,
    alignSelf: "center",
    gap: spacing.xl,
    padding: spacing.lg,
    paddingBottom: 70,
  },

  topBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  logo: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: colors.primary,
  },

  brandName: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "900",
  },

  brandSubtitle: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 9,
  },

  layout: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xl,
  },

  layoutStacked: {
    flexDirection: "column",
  },

  mainColumn: {
    flex: 1,
    minWidth: 0,
    gap: spacing.lg,
  },

  sideColumn: {
    width: 350,
    gap: spacing.lg,
  },

  heroCard: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  heroIcon: {
    width: 67,
    height: 67,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: colors.primaryLight,
  },

  heroContent: {
    flex: 1,
    minWidth: 240,
  },

  heroLabel: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.3,
  },

  heroTitle: {
    marginTop: 6,
    color: colors.textPrimary,
    fontSize: 23,
    fontWeight: "900",
    lineHeight: 30,
  },

  heroDescription: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 17,
  },

  readyChip: {
    backgroundColor: colors.primaryLight,
  },

  signedChip: {
    backgroundColor: colors.successLight,
  },

  section: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },

  sectionNumber: {
    width: 35,
    height: 35,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: colors.primary,
  },

  sectionNumberText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "900",
  },

  sectionIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
  },

  sectionTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "900",
  },

  sectionBody: {
    gap: spacing.md,
    padding: spacing.lg,
  },

  agreementRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  agreementRowLabel: {
    width: "38%",
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: "700",
  },

  agreementRowValue: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "900",
    textAlign: "right",
  },

  informationBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
  },

  informationText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
  },

  termRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },

  termText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 16,
  },

  signatureDescription: {
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 15,
  },

  fields: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },

  field: {
    flexGrow: 1,
    flexBasis: 280,
    minWidth: 230,
  },

  confirmationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
  },

  confirmationRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },

  confirmationContent: {
    flex: 1,
    paddingTop: 7,
  },

  confirmationTitle: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },

  confirmationDescription: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 15,
  },

  signActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.md,
    marginTop: spacing.md,
  },

  signedCard: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: radius.xl,
    backgroundColor: colors.successLight,
  },

  signedIcon: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: colors.white,
  },

  signedContent: {
    flex: 1,
    minWidth: 230,
  },

  signedTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "900",
  },

  signedDescription: {
    marginTop: 5,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
  },

  signedDetails: {
    marginTop: spacing.md,
  },

  signedName: {
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "900",
  },

  signedDate: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 8,
  },

  summaryCard: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  summaryIcon: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
  },

  summaryLabel: {
    marginTop: spacing.md,
    color: colors.primary,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  summaryTitle: {
    marginTop: 5,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 22,
  },

  summaryAddress: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 15,
  },

  divider: {
    marginVertical: spacing.lg,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },

  summaryRowLabel: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "700",
  },

  summaryRowValue: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 8,
    fontWeight: "900",
    textAlign: "right",
  },

  downloadCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  helpCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.primaryLight,
  },

  cardContent: {
    flex: 1,
  },

  cardTitle: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "900",
  },

  cardDescription: {
    marginTop: 4,
    marginBottom: spacing.sm,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
  },
});