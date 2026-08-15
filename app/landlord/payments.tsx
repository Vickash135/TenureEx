import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import {
    Button,
    Dialog,
    Menu,
    Portal,
    Searchbar,
    TextInput,
} from "react-native-paper";

import { colors, radius, spacing } from "../../src/theme";
import LandlordModuleScreen from "./LandlordModuleScreen";

type PaymentStatus =
  | "Paid"
  | "Pending"
  | "Overdue"
  | "Part-paid";

type PaymentType =
  | "Rent"
  | "Deposit"
  | "Maintenance"
  | "Refund"
  | "Other";

type Payment = {
  id: string;
  propertyId: string;
  propertyAddress: string;
  tenantName: string;
  paymentType: PaymentType;
  amount: string;
  amountPaid: string;
  dueDate: string;
  paidDate: string;
  status: PaymentStatus;
  paymentMethod: string;
  reference: string;
  notes: string;
};

const emptyPayment: Payment = {
  id: "",
  propertyId: "",
  propertyAddress: "",
  tenantName: "",
  paymentType: "Rent",
  amount: "",
  amountPaid: "",
  dueDate: "",
  paidDate: "",
  status: "Pending",
  paymentMethod: "",
  reference: "",
  notes: "",
};

const initialPayments: Payment[] = [
  {
    id: "PAY001",
    propertyId: "P001",
    propertyAddress:
      "18 Victoria Road, Manchester, M14 6BT",
    tenantName: "Olivia Harris",
    paymentType: "Rent",
    amount: "1450",
    amountPaid: "1450",
    dueDate: "01 July 2026",
    paidDate: "01 July 2026",
    status: "Paid",
    paymentMethod: "Bank transfer",
    reference: "JUL26-P001",
    notes: "July rent received in full.",
  },
  {
    id: "PAY002",
    propertyId: "P002",
    propertyAddress:
      "Apartment 7, 42 King Street, Leeds, LS1 2HQ",
    tenantName: "James Wilson",
    paymentType: "Rent",
    amount: "1325",
    amountPaid: "900",
    dueDate: "01 July 2026",
    paidDate: "03 July 2026",
    status: "Part-paid",
    paymentMethod: "Bank transfer",
    reference: "JUL26-P002",
    notes: "Remaining balance is £425.",
  },
  {
    id: "PAY003",
    propertyId: "P001",
    propertyAddress:
      "18 Victoria Road, Manchester, M14 6BT",
    tenantName: "Olivia Harris",
    paymentType: "Maintenance",
    amount: "180",
    amountPaid: "0",
    dueDate: "30 July 2026",
    paidDate: "",
    status: "Pending",
    paymentMethod: "",
    reference: "BOILER-2026",
    notes: "Boiler repair invoice.",
  },
];

const paymentTypes: PaymentType[] = [
  "Rent",
  "Deposit",
  "Maintenance",
  "Refund",
  "Other",
];

const paymentStatuses: PaymentStatus[] = [
  "Paid",
  "Pending",
  "Overdue",
  "Part-paid",
];

export default function LandlordPaymentsScreen() {
  const [payments, setPayments] =
    useState<Payment[]>(initialPayments);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"All" | PaymentStatus>("All");

  const [statusMenuOpen, setStatusMenuOpen] =
    useState(false);

  const [formVisible, setFormVisible] =
    useState(false);

  const [deleteVisible, setDeleteVisible] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [selectedPayment, setSelectedPayment] =
    useState<Payment | null>(null);

  const [form, setForm] =
    useState<Payment>(emptyPayment);

  const filteredPayments = useMemo(() => {
    const value = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const searchable = [
        payment.id,
        payment.propertyAddress,
        payment.propertyId,
        payment.tenantName,
        payment.reference,
        payment.paymentType,
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!value || searchable.includes(value)) &&
        (statusFilter === "All" ||
          payment.status === statusFilter)
      );
    });
  }, [payments, search, statusFilter]);

  const totalExpected = useMemo(
    () =>
      payments.reduce(
        (total, payment) =>
          total + Number(payment.amount || 0),
        0,
      ),
    [payments],
  );

  const totalReceived = useMemo(
    () =>
      payments.reduce(
        (total, payment) =>
          total +
          Number(payment.amountPaid || 0),
        0,
      ),
    [payments],
  );

  const overdueCount = useMemo(
    () =>
      payments.filter(
        (payment) =>
          payment.status === "Overdue",
      ).length,
    [payments],
  );

  const pendingCount = useMemo(
    () =>
      payments.filter(
        (payment) =>
          payment.status === "Pending" ||
          payment.status === "Part-paid",
      ).length,
    [payments],
  );

  const updateForm = <K extends keyof Payment>(
    field: K,
    value: Payment[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const openAddPayment = () => {
    setEditingId(null);

    setForm({
      ...emptyPayment,
      id: createPaymentId(payments),
    });

    setFormVisible(true);
  };

  const openEditPayment = (payment: Payment) => {
    setEditingId(payment.id);
    setForm({ ...payment });
    setFormVisible(true);
  };

  const savePayment = () => {
    if (
      !form.propertyAddress.trim() ||
      !form.tenantName.trim() ||
      !form.amount.trim() ||
      !form.dueDate.trim()
    ) {
      return;
    }

    const amount = Number(form.amount || 0);
    const amountPaid = Number(
      form.amountPaid || 0,
    );

    let calculatedStatus = form.status;

    if (amountPaid >= amount && amount > 0) {
      calculatedStatus = "Paid";
    } else if (amountPaid > 0) {
      calculatedStatus = "Part-paid";
    }

    const preparedPayment = {
      ...form,
      status: calculatedStatus,
    };

    if (editingId) {
      setPayments((current) =>
        current.map((payment) =>
          payment.id === editingId
            ? preparedPayment
            : payment,
        ),
      );
    } else {
      setPayments((current) => [
        preparedPayment,
        ...current,
      ]);
    }

    setFormVisible(false);
    setEditingId(null);
  };

  const markAsPaid = (payment: Payment) => {
    setPayments((current) =>
      current.map((item) =>
        item.id === payment.id
          ? {
              ...item,
              amountPaid: item.amount,
              status: "Paid",
              paidDate: getToday(),
            }
          : item,
      ),
    );
  };

  const requestDelete = (payment: Payment) => {
    setSelectedPayment(payment);
    setDeleteVisible(true);
  };

  const deletePayment = () => {
    if (!selectedPayment) return;

    setPayments((current) =>
      current.filter(
        (payment) =>
          payment.id !== selectedPayment.id,
      ),
    );

    setDeleteVisible(false);
    setSelectedPayment(null);
  };

  return (
    <>
      <LandlordModuleScreen
        pageTitle="Payments"
        pageSubtitle="Track rent, deposits, maintenance costs and payment balances."
        activePage="Payments"
        primaryAction="Add payment"
        primaryActionIcon="cash-plus"
        onPrimaryAction={openAddPayment}
        statistics={[
          {
            label: "Expected",
            value: formatCurrency(totalExpected),
            icon: "cash-clock",
            helper: "Total payment value",
          },
          {
            label: "Received",
            value: formatCurrency(totalReceived),
            icon: "cash-check",
            helper: "Payments received",
          },
          {
            label: "Pending",
            value: String(pendingCount),
            icon: "clock-outline",
            helper: "Pending or part-paid",
          },
          {
            label: "Overdue",
            value: String(overdueCount),
            icon: "alert-circle-outline",
            helper: "Requires follow-up",
          },
        ]}
      >
        <View style={styles.page}>
          <View style={styles.filters}>
            <Searchbar
              placeholder="Search payments"
              value={search}
              onChangeText={setSearch}
              style={styles.search}
            />

            <Menu
              visible={statusMenuOpen}
              onDismiss={() =>
                setStatusMenuOpen(false)
              }
              anchor={
                <Button
                  mode="outlined"
                  icon="filter-outline"
                  onPress={() =>
                    setStatusMenuOpen(true)
                  }
                >
                  {statusFilter === "All"
                    ? "All statuses"
                    : statusFilter}
                </Button>
              }
            >
              <Menu.Item
                title="All statuses"
                onPress={() => {
                  setStatusFilter("All");
                  setStatusMenuOpen(false);
                }}
              />

              {paymentStatuses.map((status) => (
                <Menu.Item
                  key={status}
                  title={status}
                  onPress={() => {
                    setStatusFilter(status);
                    setStatusMenuOpen(false);
                  }}
                />
              ))}
            </Menu>
          </View>

          <View style={styles.grid}>
            {filteredPayments.map((payment) => (
              <PaymentCard
                key={payment.id}
                payment={payment}
                onEdit={() =>
                  openEditPayment(payment)
                }
                onDelete={() =>
                  requestDelete(payment)
                }
                onMarkPaid={() =>
                  markAsPaid(payment)
                }
              />
            ))}
          </View>
        </View>
      </LandlordModuleScreen>

      <Portal>
        <Dialog
          visible={formVisible}
          onDismiss={() =>
            setFormVisible(false)
          }
          style={styles.dialog}
        >
          <Dialog.Title>
            {editingId
              ? "Edit payment"
              : "Add payment"}
          </Dialog.Title>

          <Dialog.ScrollArea>
            <ScrollView
              contentContainerStyle={
                styles.form
              }
            >
              <TextInput
                mode="outlined"
                label="Property ID"
                value={form.propertyId}
                onChangeText={(value) =>
                  updateForm(
                    "propertyId",
                    value.toUpperCase(),
                  )
                }
              />

              <TextInput
                mode="outlined"
                label="Property address *"
                value={form.propertyAddress}
                onChangeText={(value) =>
                  updateForm(
                    "propertyAddress",
                    value,
                  )
                }
              />

              <TextInput
                mode="outlined"
                label="Tenant name *"
                value={form.tenantName}
                onChangeText={(value) =>
                  updateForm(
                    "tenantName",
                    value,
                  )
                }
              />

              <ChoiceGroup
                label="Payment type"
                value={form.paymentType}
                options={paymentTypes}
                onChange={(value) =>
                  updateForm(
                    "paymentType",
                    value,
                  )
                }
              />

              <TextInput
                mode="outlined"
                label="Amount due (£) *"
                value={form.amount}
                keyboardType="decimal-pad"
                onChangeText={(value) =>
                  updateForm(
                    "amount",
                    decimalOnly(value),
                  )
                }
              />

              <TextInput
                mode="outlined"
                label="Amount paid (£)"
                value={form.amountPaid}
                keyboardType="decimal-pad"
                onChangeText={(value) =>
                  updateForm(
                    "amountPaid",
                    decimalOnly(value),
                  )
                }
              />

              <TextInput
                mode="outlined"
                label="Due date *"
                value={form.dueDate}
                placeholder="DD Month YYYY"
                onChangeText={(value) =>
                  updateForm("dueDate", value)
                }
              />

              <TextInput
                mode="outlined"
                label="Paid date"
                value={form.paidDate}
                placeholder="DD Month YYYY"
                onChangeText={(value) =>
                  updateForm("paidDate", value)
                }
              />

              <ChoiceGroup
                label="Status"
                value={form.status}
                options={paymentStatuses}
                onChange={(value) =>
                  updateForm("status", value)
                }
              />

              <TextInput
                mode="outlined"
                label="Payment method"
                value={form.paymentMethod}
                onChangeText={(value) =>
                  updateForm(
                    "paymentMethod",
                    value,
                  )
                }
              />

              <TextInput
                mode="outlined"
                label="Reference"
                value={form.reference}
                onChangeText={(value) =>
                  updateForm("reference", value)
                }
              />

              <TextInput
                mode="outlined"
                label="Notes"
                value={form.notes}
                multiline
                numberOfLines={4}
                onChangeText={(value) =>
                  updateForm("notes", value)
                }
              />
            </ScrollView>
          </Dialog.ScrollArea>

          <Dialog.Actions>
            <Button
              onPress={() =>
                setFormVisible(false)
              }
            >
              Cancel
            </Button>

            <Button
              mode="contained"
              onPress={savePayment}
            >
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={deleteVisible}
          onDismiss={() =>
            setDeleteVisible(false)
          }
        >
          <Dialog.Title>
            Delete payment?
          </Dialog.Title>

          <Dialog.Content>
            <Text>
              This payment record will be
              removed.
            </Text>
          </Dialog.Content>

          <Dialog.Actions>
            <Button
              onPress={() =>
                setDeleteVisible(false)
              }
            >
              Cancel
            </Button>

            <Button
              mode="contained"
              buttonColor={colors.error}
              onPress={deletePayment}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

function PaymentCard({
  payment,
  onEdit,
  onDelete,
  onMarkPaid,
}: {
  payment: Payment;
  onEdit: () => void;
  onDelete: () => void;
  onMarkPaid: () => void;
}) {
  const balance =
    Number(payment.amount || 0) -
    Number(payment.amountPaid || 0);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.icon}>
          <MaterialCommunityIcons
            name="cash-multiple"
            size={27}
            color={colors.primary}
          />
        </View>

        <View style={styles.titleArea}>
          <Text style={styles.title}>
            {payment.paymentType}
          </Text>

          <Text style={styles.subtitle}>
            {payment.id} · {payment.propertyId}
          </Text>
        </View>

        <StatusBadge
          status={payment.status}
        />
      </View>

      <Text style={styles.address}>
        {payment.propertyAddress}
      </Text>

      <Text style={styles.tenant}>
        {payment.tenantName}
      </Text>

      <View style={styles.amountRow}>
        <Amount
          label="Due"
          value={formatCurrency(
            Number(payment.amount),
          )}
        />

        <Amount
          label="Paid"
          value={formatCurrency(
            Number(payment.amountPaid),
          )}
        />

        <Amount
          label="Balance"
          value={formatCurrency(balance)}
        />
      </View>

      <Text style={styles.date}>
        Due: {payment.dueDate}
      </Text>

      <View style={styles.actions}>
        {payment.status !== "Paid" ? (
          <Button
            compact
            icon="cash-check"
            onPress={onMarkPaid}
          >
            Mark paid
          </Button>
        ) : null}

        <Button
          compact
          icon="pencil-outline"
          onPress={onEdit}
        >
          Edit
        </Button>

        <Button
          compact
          icon="delete-outline"
          textColor={colors.error}
          onPress={onDelete}
        >
          Delete
        </Button>
      </View>
    </View>
  );
}

function Amount({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.amountBox}>
      <Text style={styles.amountLabel}>
        {label}
      </Text>

      <Text style={styles.amountValue}>
        {value}
      </Text>
    </View>
  );
}

function StatusBadge({
  status,
}: {
  status: PaymentStatus;
}) {
  return (
    <View
      style={[
        styles.badge,
        status === "Paid" &&
          styles.successBadge,
        status === "Pending" &&
          styles.warningBadge,
        status === "Part-paid" &&
          styles.primaryBadge,
        status === "Overdue" &&
          styles.errorBadge,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          status === "Paid" &&
            styles.successText,
          status === "Pending" &&
            styles.warningText,
          status === "Part-paid" &&
            styles.primaryText,
          status === "Overdue" &&
            styles.errorText,
        ]}
      >
        {status}
      </Text>
    </View>
  );
}

function ChoiceGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <View>
      <Text style={styles.choiceLabel}>
        {label}
      </Text>

      <View style={styles.choices}>
        {options.map((option) => (
          <Pressable
            key={option}
            style={[
              styles.choice,
              option === value &&
                styles.choiceSelected,
            ]}
            onPress={() => onChange(option)}
          >
            <Text
              style={[
                styles.choiceText,
                option === value &&
                  styles.choiceTextSelected,
              ]}
            >
              {option}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function createPaymentId(payments: Payment[]) {
  return `PAY${String(
    payments.length + 1,
  ).padStart(3, "0")}`;
}

function decimalOnly(value: string) {
  return value.replace(/[^0-9.]/g, "");
}

function getToday() {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(value || 0);
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.lg,
  },

  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  search: {
    flex: 1,
    minWidth: 250,
    backgroundColor: colors.background,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg,
  },

  card: {
    flexGrow: 1,
    flexBasis: 330,
    maxWidth: 520,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  icon: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },

  titleArea: {
    flex: 1,
  },

  title: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "900",
  },

  subtitle: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 9,
  },

  address: {
    marginTop: spacing.md,
    color: colors.textPrimary,
    fontWeight: "700",
  },

  tenant: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 10,
  },

  amountRow: {
    marginTop: spacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  amountBox: {
    flex: 1,
    minWidth: 90,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },

  amountLabel: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "800",
  },

  amountValue: {
    marginTop: 4,
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "900",
  },

  date: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: 10,
  },

  actions: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  badge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
  },

  badgeText: {
    fontSize: 8,
    fontWeight: "900",
  },

  successBadge: {
    backgroundColor: colors.successLight,
  },

  successText: {
    color: colors.success,
  },

  warningBadge: {
    backgroundColor: colors.warningLight,
  },

  warningText: {
    color: colors.warning,
  },

  primaryBadge: {
    backgroundColor: colors.primaryLight,
  },

  primaryText: {
    color: colors.primary,
  },

  errorBadge: {
    backgroundColor: colors.errorLight,
  },

  errorText: {
    color: colors.error,
  },

  dialog: {
    width: "94%",
    maxWidth: 700,
    maxHeight: "92%",
    alignSelf: "center",
  },

  form: {
    padding: spacing.lg,
    gap: spacing.md,
  },

  choiceLabel: {
    marginBottom: spacing.sm,
    color: colors.textPrimary,
    fontWeight: "800",
  },

  choices: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  choice: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
  },

  choiceSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },

  choiceText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
  },

  choiceTextSelected: {
    color: colors.primary,
  },
});