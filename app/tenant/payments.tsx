import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import {
    Button,
    Chip,
    Divider,
    Snackbar,
} from "react-native-paper";

import ScreenContainer from "../../src/components/ScreenContainer";
import { colors, radius, spacing } from "../../src/theme";

type PaymentStatus =
  | "Paid"
  | "Due"
  | "Overdue"
  | "Pending";

type Payment = {
  id: string;
  title: string;
  dueDate: string;
  paidDate?: string;
  amount: number;
  status: PaymentStatus;
  method?: string;
};

const initialPayments: Payment[] = [
  {
    id: "PAY-1004",
    title: "August 2026 rent",
    dueDate: "01 August 2026",
    amount: 1325,
    status: "Due",
  },
  {
    id: "PAY-1003",
    title: "July 2026 rent",
    dueDate: "01 July 2026",
    paidDate: "01 July 2026",
    amount: 1325,
    status: "Paid",
    method: "Bank card",
  },
  {
    id: "PAY-1002",
    title: "June 2026 rent",
    dueDate: "01 June 2026",
    paidDate: "31 May 2026",
    amount: 1325,
    status: "Paid",
    method: "Bank transfer",
  },
  {
    id: "PAY-1001",
    title: "Security deposit",
    dueDate: "20 May 2026",
    paidDate: "20 May 2026",
    amount: 1528,
    status: "Paid",
    method: "Bank transfer",
  },
];

export default function PaymentsScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 950;

  const params = useLocalSearchParams<{
    propertyId?: string | string[];
  }>();

  const propertyId = Array.isArray(params.propertyId)
    ? params.propertyId[0]
    : params.propertyId;

  const [payments, setPayments] =
    useState<Payment[]>(initialPayments);
  const [processing, setProcessing] =
    useState(false);
  const [message, setMessage] = useState("");

  const duePayment = useMemo(
    () =>
      payments.find(
        (payment) =>
          payment.status === "Due" ||
          payment.status === "Overdue",
      ),
    [payments],
  );

  const totalPaid = useMemo(
    () =>
      payments
        .filter(
          (payment) => payment.status === "Paid",
        )
        .reduce(
          (total, payment) =>
            total + payment.amount,
          0,
        ),
    [payments],
  );

  const handlePayment = async () => {
    if (!duePayment) {
      setMessage("There is no payment currently due.");
      return;
    }

    setProcessing(true);

    try {
      await new Promise((resolve) =>
        setTimeout(resolve, 900),
      );

      setPayments((current) =>
        current.map((payment) =>
          payment.id === duePayment.id
            ? {
                ...payment,
                status: "Paid",
                paidDate:
                  new Date().toLocaleDateString(
                    "en-GB",
                    {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    },
                  ),
                method: "Bank card",
              }
            : payment,
        ),
      );

      setMessage("Payment completed successfully.");
    } finally {
      setProcessing(false);
    }
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
                "/tenant/my-property" as never,
              )
            }
          >
            <View style={styles.logo}>
              <MaterialCommunityIcons
                name="credit-card-outline"
                size={27}
                color={colors.white}
              />
            </View>

            <View>
              <Text style={styles.brandName}>
                Payments
              </Text>

              <Text style={styles.brandSubtitle}>
                Property {propertyId ?? "PROP-001"}
              </Text>
            </View>
          </Pressable>

          <Button
            mode="text"
            icon="arrow-left"
            onPress={() => router.back()}
          >
            Back
          </Button>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons
              name="cash-multiple"
              size={38}
              color={colors.primary}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.heroLabel}>
              RENT AND PAYMENTS
            </Text>

            <Text style={styles.heroTitle}>
              Manage your property payments
            </Text>

            <Text style={styles.heroDescription}>
              View upcoming rent, completed payments and
              payment references.
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.layout,
            !isDesktop && styles.layoutStacked,
          ]}
        >
          <View style={styles.mainColumn}>
            {duePayment ? (
              <View style={styles.dueCard}>
                <View style={styles.dueHeader}>
                  <View>
                    <Text style={styles.dueLabel}>
                      PAYMENT DUE
                    </Text>

                    <Text style={styles.dueTitle}>
                      {duePayment.title}
                    </Text>
                  </View>

                  <Chip icon="clock-outline">
                    {duePayment.status}
                  </Chip>
                </View>

                <Text style={styles.dueAmount}>
                  {formatCurrency(duePayment.amount)}
                </Text>

                <Text style={styles.dueDate}>
                  Due on {duePayment.dueDate}
                </Text>

                <Divider style={styles.divider} />

                <Button
                  mode="contained"
                  icon="credit-card-check-outline"
                  loading={processing}
                  disabled={processing}
                  onPress={handlePayment}
                >
                  Pay now
                </Button>
              </View>
            ) : (
              <View style={styles.completeCard}>
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={38}
                  color={colors.success}
                />

                <View style={{ flex: 1 }}>
                  <Text style={styles.completeTitle}>
                    Payments are up to date
                  </Text>

                  <Text style={styles.completeText}>
                    There are no outstanding property
                    payments.
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  Payment history
                </Text>

                <Text style={styles.sectionDescription}>
                  Your completed and upcoming payments.
                </Text>
              </View>

              <Chip icon="receipt-text-outline">
                {payments.length}
              </Chip>
            </View>

            <View style={styles.paymentList}>
              {payments.map((payment) => (
                <PaymentCard
                  key={payment.id}
                  payment={payment}
                />
              ))}
            </View>
          </View>

          <View style={styles.sideColumn}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <MaterialCommunityIcons
                  name="chart-box-outline"
                  size={29}
                  color={colors.primary}
                />
              </View>

              <Text style={styles.summaryLabel}>
                PAYMENT SUMMARY
              </Text>

              <Divider style={styles.divider} />

              <SummaryRow
                label="Total paid"
                value={formatCurrency(totalPaid)}
              />

              <SummaryRow
                label="Payments recorded"
                value={`${payments.length}`}
              />

              <SummaryRow
                label="Outstanding"
                value={
                  duePayment
                    ? formatCurrency(
                        duePayment.amount,
                      )
                    : formatCurrency(0)
                }
              />

              <SummaryRow
                label="Payment status"
                value={
                  duePayment ? "Payment due" : "Up to date"
                }
              />
            </View>

            <View style={styles.methodCard}>
              <MaterialCommunityIcons
                name="shield-lock-outline"
                size={27}
                color={colors.primary}
              />

              <View style={{ flex: 1 }}>
                <Text style={styles.methodTitle}>
                  Secure payments
                </Text>

                <Text style={styles.methodText}>
                  A secure payment provider can be
                  connected when the backend is ready.
                </Text>
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

function PaymentCard({
  payment,
}: {
  payment: Payment;
}) {
  const icon =
    payment.status === "Paid"
      ? "check-circle-outline"
      : payment.status === "Overdue"
        ? "alert-circle-outline"
        : "clock-outline";

  return (
    <View style={styles.paymentCard}>
      <View style={styles.paymentIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={27}
          color={
            payment.status === "Paid"
              ? colors.success
              : payment.status === "Overdue"
                ? colors.error
                : colors.primary
          }
        />
      </View>

      <View style={styles.paymentContent}>
        <View style={styles.paymentTitleRow}>
          <Text style={styles.paymentTitle}>
            {payment.title}
          </Text>

          <Chip compact>{payment.status}</Chip>
        </View>

        <Text style={styles.paymentReference}>
          {payment.id}
        </Text>

        <View style={styles.paymentDetails}>
          <Text style={styles.paymentDetailText}>
            Due: {payment.dueDate}
          </Text>

          {payment.paidDate ? (
            <Text style={styles.paymentDetailText}>
              Paid: {payment.paidDate}
            </Text>
          ) : null}

          {payment.method ? (
            <Text style={styles.paymentDetailText}>
              Method: {payment.method}
            </Text>
          ) : null}
        </View>
      </View>

      <Text style={styles.paymentAmount}>
        {formatCurrency(payment.amount)}
      </Text>
    </View>
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
  screenContent: { padding: 0 },

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

  hero: {
    flexDirection: "row",
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

  heroLabel: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  heroTitle: {
    marginTop: 5,
    color: colors.textPrimary,
    fontSize: 23,
    fontWeight: "900",
  },

  heroDescription: {
    marginTop: 6,
    color: colors.textMuted,
    fontSize: 10,
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
    width: 330,
    gap: spacing.lg,
  },

  dueCard: {
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  dueHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },

  dueLabel: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  dueTitle: {
    marginTop: 5,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "900",
  },

  dueAmount: {
    marginTop: spacing.xl,
    color: colors.textPrimary,
    fontSize: 34,
    fontWeight: "900",
  },

  dueDate: {
    marginTop: 5,
    color: colors.textMuted,
    fontSize: 9,
  },

  divider: {
    marginVertical: spacing.lg,
  },

  completeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: radius.xl,
    backgroundColor: colors.successLight,
  },

  completeTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "900",
  },

  completeText: {
    marginTop: 5,
    color: colors.textSecondary,
    fontSize: 9,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },

  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "900",
  },

  sectionDescription: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 9,
  },

  paymentList: {
    gap: spacing.md,
  },

  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  paymentIcon: {
    width: 53,
    height: 53,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
  },

  paymentContent: {
    flex: 1,
    minWidth: 0,
  },

  paymentTitleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.sm,
  },

  paymentTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "900",
  },

  paymentReference: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 8,
  },

  paymentDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.sm,
  },

  paymentDetailText: {
    color: colors.textMuted,
    fontSize: 8,
  },

  paymentAmount: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "900",
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

  methodCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.primaryLight,
  },

  methodTitle: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "900",
  },

  methodText: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
  },
});