import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
    router,
    useLocalSearchParams,
} from "expo-router";
import { useMemo, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import {
    Button,
    Checkbox,
    HelperText,
    Menu,
    Snackbar,
    Switch,
    TextInput,
} from "react-native-paper";

import { colors, radius, spacing } from "../../src/theme";

type IconName =
  keyof typeof MaterialCommunityIcons.glyphMap;

type EmploymentStatus =
  | "Employed full-time"
  | "Employed part-time"
  | "Self-employed"
  | "Student"
  | "Retired"
  | "Unemployed"
  | "Other";

type YesNo = "Yes" | "No";

type ApplicationForm = {
  employmentStatus: EmploymentStatus;
  employerName: string;
  jobTitle: string;
  employmentStartDate: string;
  annualIncome: string;
  monthlyTakeHomePay: string;
  hasOtherIncome: boolean;
  otherIncomeAmount: string;
  otherIncomeSource: string;

  currentLandlordName: string;
  currentLandlordPhone: string;
  currentLandlordEmail: string;
  currentMonthlyRent: string;
  currentAddressDuration: string;
  reasonForMoving: string;

  hasRentArrears: YesNo;
  rentArrearsDetails: string;
  hasTenancyDisputes: YesNo;
  tenancyDisputeDetails: string;

  additionalOccupants: string;
  hasPets: YesNo;
  petDetails: string;
  smoker: YesNo;

  needsGuarantor: YesNo;
  guarantorName: string;
  guarantorRelationship: string;
  guarantorEmail: string;
  guarantorPhone: string;
  guarantorAnnualIncome: string;

  hasCCJ: YesNo;
  ccjDetails: string;
  hasBankruptcy: YesNo;
  bankruptcyDetails: string;

  canPayDeposit: boolean;
  canPayFirstMonthRent: boolean;

  preferredMoveInDate: string;
  preferredTenancyLength: string;
  reasonForChoosingProperty: string;
  specialRequirements: string;
  additionalNotes: string;

  consentToReferenceChecks: boolean;
  consentToAffordabilityChecks: boolean;
  confirmInformationCorrect: boolean;
};

type FormErrors = Partial<
  Record<keyof ApplicationForm, string>
>;

type PropertySummary = {
  id: string;
  title: string;
  address: string;
  monthlyRent: number;
  deposit: number;
  bedrooms: number;
  bathrooms: number;
};

const properties: PropertySummary[] = [
  {
    id: "PROP-001",
    title: "Modern Two-Bedroom City Apartment",
    address: "42 King Street, Leeds, LS1 2HQ",
    monthlyRent: 1325,
    deposit: 1528,
    bedrooms: 2,
    bathrooms: 2,
  },
  {
    id: "PROP-002",
    title: "Three-Bedroom Family Home",
    address: "18 Victoria Road, Manchester, M14 6BT",
    monthlyRent: 1450,
    deposit: 1673,
    bedrooms: 3,
    bathrooms: 2,
  },
  {
    id: "PROP-003",
    title: "City Centre One-Bedroom Flat",
    address: "91 High Street, Birmingham, B4 7SL",
    monthlyRent: 1100,
    deposit: 1269,
    bedrooms: 1,
    bathrooms: 1,
  },
  {
    id: "PROP-004",
    title: "Accessible Two-Bedroom Bungalow",
    address: "7 Meadow Close, Sheffield, S11 8RT",
    monthlyRent: 1250,
    deposit: 1442,
    bedrooms: 2,
    bathrooms: 1,
  },
];

const employmentOptions: EmploymentStatus[] = [
  "Employed full-time",
  "Employed part-time",
  "Self-employed",
  "Student",
  "Retired",
  "Unemployed",
  "Other",
];

const initialForm: ApplicationForm = {
  employmentStatus: "Employed full-time",
  employerName: "",
  jobTitle: "",
  employmentStartDate: "",
  annualIncome: "",
  monthlyTakeHomePay: "",
  hasOtherIncome: false,
  otherIncomeAmount: "",
  otherIncomeSource: "",

  currentLandlordName: "",
  currentLandlordPhone: "",
  currentLandlordEmail: "",
  currentMonthlyRent: "",
  currentAddressDuration: "",
  reasonForMoving: "",

  hasRentArrears: "No",
  rentArrearsDetails: "",
  hasTenancyDisputes: "No",
  tenancyDisputeDetails: "",

  additionalOccupants: "",
  hasPets: "No",
  petDetails: "",
  smoker: "No",

  needsGuarantor: "No",
  guarantorName: "",
  guarantorRelationship: "",
  guarantorEmail: "",
  guarantorPhone: "",
  guarantorAnnualIncome: "",

  hasCCJ: "No",
  ccjDetails: "",
  hasBankruptcy: "No",
  bankruptcyDetails: "",

  canPayDeposit: false,
  canPayFirstMonthRent: false,

  preferredMoveInDate: "",
  preferredTenancyLength: "12 months",
  reasonForChoosingProperty: "",
  specialRequirements: "",
  additionalNotes: "",

  consentToReferenceChecks: false,
  consentToAffordabilityChecks: false,
  confirmInformationCorrect: false,
};

export default function TenantApplicationsScreen() {
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1050;
  const isTablet = width >= 700;

  const params = useLocalSearchParams<{
    propertyId?: string | string[];
    action?: string | string[];
  }>();

  const propertyId = Array.isArray(params.propertyId)
    ? params.propertyId[0]
    : params.propertyId;

  const selectedProperty = useMemo(() => {
    return (
      properties.find(
        (property) => property.id === propertyId,
      ) ?? properties[0]
    );
  }, [propertyId]);

  const [form, setForm] =
    useState<ApplicationForm>(initialForm);

  const [errors, setErrors] =
    useState<FormErrors>({});

  const [employmentMenuVisible, setEmploymentMenuVisible] =
    useState(false);

  const [reviewMode, setReviewMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const updateField = <
    K extends keyof ApplicationForm,
  >(
    field: K,
    value: ApplicationForm[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    const employmentDetailsRequired =
      form.employmentStatus ===
        "Employed full-time" ||
      form.employmentStatus ===
        "Employed part-time" ||
      form.employmentStatus === "Self-employed";

    if (
      employmentDetailsRequired &&
      !form.employerName.trim()
    ) {
      nextErrors.employerName =
        "Employer or business name is required.";
    }

    if (
      employmentDetailsRequired &&
      !form.jobTitle.trim()
    ) {
      nextErrors.jobTitle =
        "Job title is required.";
    }

    if (!form.annualIncome.trim()) {
      nextErrors.annualIncome =
        "Annual income is required.";
    } else if (
      Number(form.annualIncome) < 0
    ) {
      nextErrors.annualIncome =
        "Enter a valid annual income.";
    }

    if (!form.monthlyTakeHomePay.trim()) {
      nextErrors.monthlyTakeHomePay =
        "Monthly take-home pay is required.";
    }

    if (
      form.hasOtherIncome &&
      !form.otherIncomeAmount.trim()
    ) {
      nextErrors.otherIncomeAmount =
        "Enter the other income amount.";
    }

    if (
      form.hasOtherIncome &&
      !form.otherIncomeSource.trim()
    ) {
      nextErrors.otherIncomeSource =
        "Enter the source of the other income.";
    }

    if (!form.currentAddressDuration.trim()) {
      nextErrors.currentAddressDuration =
        "Enter how long you have lived at your current address.";
    }

    if (!form.reasonForMoving.trim()) {
      nextErrors.reasonForMoving =
        "Enter your reason for moving.";
    }

    if (
      form.currentLandlordEmail &&
      !isValidEmail(form.currentLandlordEmail)
    ) {
      nextErrors.currentLandlordEmail =
        "Enter a valid email address.";
    }

    if (
      form.hasRentArrears === "Yes" &&
      !form.rentArrearsDetails.trim()
    ) {
      nextErrors.rentArrearsDetails =
        "Provide details about the rent arrears.";
    }

    if (
      form.hasTenancyDisputes === "Yes" &&
      !form.tenancyDisputeDetails.trim()
    ) {
      nextErrors.tenancyDisputeDetails =
        "Provide details about the tenancy dispute.";
    }

    if (
      form.hasPets === "Yes" &&
      !form.petDetails.trim()
    ) {
      nextErrors.petDetails =
        "Describe your pet or pets.";
    }

    if (form.needsGuarantor === "Yes") {
      if (!form.guarantorName.trim()) {
        nextErrors.guarantorName =
          "Guarantor name is required.";
      }

      if (!form.guarantorRelationship.trim()) {
        nextErrors.guarantorRelationship =
          "Enter your relationship to the guarantor.";
      }

      if (!form.guarantorEmail.trim()) {
        nextErrors.guarantorEmail =
          "Guarantor email is required.";
      } else if (
        !isValidEmail(form.guarantorEmail)
      ) {
        nextErrors.guarantorEmail =
          "Enter a valid guarantor email.";
      }

      if (!form.guarantorPhone.trim()) {
        nextErrors.guarantorPhone =
          "Guarantor phone number is required.";
      }

      if (!form.guarantorAnnualIncome.trim()) {
        nextErrors.guarantorAnnualIncome =
          "Guarantor annual income is required.";
      }
    }

    if (
      form.hasCCJ === "Yes" &&
      !form.ccjDetails.trim()
    ) {
      nextErrors.ccjDetails =
        "Provide details about the County Court Judgment.";
    }

    if (
      form.hasBankruptcy === "Yes" &&
      !form.bankruptcyDetails.trim()
    ) {
      nextErrors.bankruptcyDetails =
        "Provide details about the bankruptcy.";
    }

    if (!form.canPayDeposit) {
      nextErrors.canPayDeposit =
        "Confirm whether you can pay the deposit.";
    }

    if (!form.canPayFirstMonthRent) {
      nextErrors.canPayFirstMonthRent =
        "Confirm whether you can pay the first month's rent.";
    }

    if (!form.preferredMoveInDate.trim()) {
      nextErrors.preferredMoveInDate =
        "Preferred move-in date is required.";
    }

    if (!form.reasonForChoosingProperty.trim()) {
      nextErrors.reasonForChoosingProperty =
        "Explain why you are applying for this property.";
    }

    if (!form.consentToReferenceChecks) {
      nextErrors.consentToReferenceChecks =
        "Consent to reference checks is required.";
    }

    if (!form.consentToAffordabilityChecks) {
      nextErrors.consentToAffordabilityChecks =
        "Consent to affordability checks is required.";
    }

    if (!form.confirmInformationCorrect) {
      nextErrors.confirmInformationCorrect =
        "Confirm that the information is correct.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleReview = () => {
    if (!validateForm()) {
      setMessage(
        "Please complete the required application questions.",
      );
      return;
    }

    setReviewMode(true);
  };

  const handleSubmitApplication = async () => {
    if (!validateForm()) {
      setReviewMode(false);
      setMessage(
        "Please complete the required application questions.",
      );
      return;
    }

    setLoading(true);

    try {
      await new Promise((resolve) =>
        setTimeout(resolve, 1000),
      );

      const applicationId = `APP-${Date.now()}`;

      console.log("Application submitted:", {
        applicationId,
        propertyId: selectedProperty.id,
        application: form,
      });

      setMessage(
        "Application details saved. Continue to upload your documents.",
      );

      setTimeout(() => {
        router.replace({
          pathname: "/tenant/documents" as never,
          params: {
            propertyId: selectedProperty.id,
            applicationId,
          },
        });
      }, 700);
    } catch {
      setMessage(
        "Unable to save the application. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable
            style={styles.brand}
            onPress={() =>
              router.push(
                "/tenant/properties" as never,
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
                Tenant property application
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

        <View style={styles.progressSteps}>
          <ProgressStep
            number="1"
            title="Preferences"
            complete
          />

          <ProgressLine complete />

          <ProgressStep
            number="2"
            title="Property"
            complete
          />

          <ProgressLine complete />

          <ProgressStep
            number="3"
            title="Application"
            active
          />

          <ProgressLine />

          <ProgressStep
            number="4"
            title="Documents"
          />
        </View>

        <View
          style={[
            styles.layout,
            !isDesktop && styles.layoutStacked,
          ]}
        >
          <View style={styles.mainColumn}>
            <View style={styles.hero}>
              <View style={styles.heroIcon}>
                <MaterialCommunityIcons
                  name="clipboard-text-outline"
                  size={37}
                  color={colors.primary}
                />
              </View>

              <View style={styles.heroContent}>
                <Text style={styles.heroLabel}>
                  PROPERTY APPLICATION
                </Text>

                <Text style={styles.heroTitle}>
                  Complete your application questions
                </Text>

                <Text style={styles.heroDescription}>
                  Provide accurate employment,
                  tenancy, financial and household
                  information. Your answers will be
                  reviewed by the estate agent and
                  landlord.
                </Text>
              </View>
            </View>

            {!reviewMode ? (
              <>
                <QuestionSection
                  number="1"
                  icon="briefcase-outline"
                  title="Employment and income"
                  description="Tell us about your employment and income."
                >
                  <View style={styles.menuField}>
                    <Text style={styles.fieldLabel}>
                      Employment status
                    </Text>

                    <Menu
                      visible={employmentMenuVisible}
                      onDismiss={() =>
                        setEmploymentMenuVisible(
                          false,
                        )
                      }
                      anchor={
                        <Button
                          mode="outlined"
                          icon="briefcase-outline"
                          style={styles.menuButton}
                          contentStyle={
                            styles.menuButtonContent
                          }
                          onPress={() =>
                            setEmploymentMenuVisible(
                              true,
                            )
                          }
                        >
                          {form.employmentStatus}
                        </Button>
                      }
                    >
                      {employmentOptions.map(
                        (option) => (
                          <Menu.Item
                            key={option}
                            title={option}
                            onPress={() => {
                              updateField(
                                "employmentStatus",
                                option,
                              );
                              setEmploymentMenuVisible(
                                false,
                              );
                            }}
                          />
                        ),
                      )}
                    </Menu>
                  </View>

                  <View style={styles.fields}>
                    <FormInput
                      label="Employer or business name"
                      value={form.employerName}
                      errorMessage={
                        errors.employerName
                      }
                      onChangeText={(value) =>
                        updateField(
                          "employerName",
                          value,
                        )
                      }
                    />

                    <FormInput
                      label="Job title"
                      value={form.jobTitle}
                      errorMessage={errors.jobTitle}
                      onChangeText={(value) =>
                        updateField(
                          "jobTitle",
                          value,
                        )
                      }
                    />

                    <FormInput
                      label="Employment start date"
                      placeholder="DD/MM/YYYY"
                      value={
                        form.employmentStartDate
                      }
                      onChangeText={(value) =>
                        updateField(
                          "employmentStartDate",
                          value,
                        )
                      }
                    />

                    <FormInput
                      label="Annual income *"
                      placeholder="Example: 32000"
                      value={form.annualIncome}
                      keyboardType="numeric"
                      errorMessage={
                        errors.annualIncome
                      }
                      left={
                        <TextInput.Icon icon="currency-gbp" />
                      }
                      onChangeText={(value) =>
                        updateField(
                          "annualIncome",
                          numbersOnly(value),
                        )
                      }
                    />

                    <FormInput
                      label="Monthly take-home pay *"
                      placeholder="Example: 2200"
                      value={
                        form.monthlyTakeHomePay
                      }
                      keyboardType="numeric"
                      errorMessage={
                        errors.monthlyTakeHomePay
                      }
                      left={
                        <TextInput.Icon icon="currency-gbp" />
                      }
                      onChangeText={(value) =>
                        updateField(
                          "monthlyTakeHomePay",
                          numbersOnly(value),
                        )
                      }
                    />
                  </View>

                  <SwitchRow
                    icon="cash-plus"
                    title="I receive other income"
                    description="Benefits, pension, maintenance payments or another regular income."
                    value={form.hasOtherIncome}
                    onValueChange={(value) => {
                      updateField(
                        "hasOtherIncome",
                        value,
                      );

                      if (!value) {
                        updateField(
                          "otherIncomeAmount",
                          "",
                        );
                        updateField(
                          "otherIncomeSource",
                          "",
                        );
                      }
                    }}
                  />

                  {form.hasOtherIncome ? (
                    <View style={styles.fields}>
                      <FormInput
                        label="Other monthly income *"
                        value={
                          form.otherIncomeAmount
                        }
                        keyboardType="numeric"
                        errorMessage={
                          errors.otherIncomeAmount
                        }
                        left={
                          <TextInput.Icon icon="currency-gbp" />
                        }
                        onChangeText={(value) =>
                          updateField(
                            "otherIncomeAmount",
                            numbersOnly(value),
                          )
                        }
                      />

                      <FormInput
                        label="Other income source *"
                        value={
                          form.otherIncomeSource
                        }
                        errorMessage={
                          errors.otherIncomeSource
                        }
                        onChangeText={(value) =>
                          updateField(
                            "otherIncomeSource",
                            value,
                          )
                        }
                      />
                    </View>
                  ) : null}
                </QuestionSection>

                <QuestionSection
                  number="2"
                  icon="home-account"
                  title="Current tenancy"
                  description="Provide details about your current address and landlord."
                >
                  <View style={styles.fields}>
                    <FormInput
                      label="Current landlord or agent"
                      value={
                        form.currentLandlordName
                      }
                      onChangeText={(value) =>
                        updateField(
                          "currentLandlordName",
                          value,
                        )
                      }
                    />

                    <FormInput
                      label="Landlord phone number"
                      value={
                        form.currentLandlordPhone
                      }
                      keyboardType="phone-pad"
                      onChangeText={(value) =>
                        updateField(
                          "currentLandlordPhone",
                          value,
                        )
                      }
                    />

                    <FormInput
                      label="Landlord email"
                      value={
                        form.currentLandlordEmail
                      }
                      keyboardType="email-address"
                      autoCapitalize="none"
                      errorMessage={
                        errors.currentLandlordEmail
                      }
                      onChangeText={(value) =>
                        updateField(
                          "currentLandlordEmail",
                          value,
                        )
                      }
                    />

                    <FormInput
                      label="Current monthly rent"
                      value={
                        form.currentMonthlyRent
                      }
                      keyboardType="numeric"
                      left={
                        <TextInput.Icon icon="currency-gbp" />
                      }
                      onChangeText={(value) =>
                        updateField(
                          "currentMonthlyRent",
                          numbersOnly(value),
                        )
                      }
                    />

                    <FormInput
                      label="Time at current address *"
                      placeholder="Example: 2 years"
                      value={
                        form.currentAddressDuration
                      }
                      errorMessage={
                        errors.currentAddressDuration
                      }
                      onChangeText={(value) =>
                        updateField(
                          "currentAddressDuration",
                          value,
                        )
                      }
                    />
                  </View>

                  <FormTextArea
                    label="Reason for moving *"
                    value={form.reasonForMoving}
                    errorMessage={
                      errors.reasonForMoving
                    }
                    onChangeText={(value) =>
                      updateField(
                        "reasonForMoving",
                        value,
                      )
                    }
                  />

                  <YesNoQuestion
                    title="Do you have any rent arrears?"
                    value={form.hasRentArrears}
                    onChange={(value) =>
                      updateField(
                        "hasRentArrears",
                        value,
                      )
                    }
                  />

                  {form.hasRentArrears ===
                  "Yes" ? (
                    <FormTextArea
                      label="Rent arrears details *"
                      value={
                        form.rentArrearsDetails
                      }
                      errorMessage={
                        errors.rentArrearsDetails
                      }
                      onChangeText={(value) =>
                        updateField(
                          "rentArrearsDetails",
                          value,
                        )
                      }
                    />
                  ) : null}

                  <YesNoQuestion
                    title="Have you had any tenancy disputes?"
                    value={
                      form.hasTenancyDisputes
                    }
                    onChange={(value) =>
                      updateField(
                        "hasTenancyDisputes",
                        value,
                      )
                    }
                  />

                  {form.hasTenancyDisputes ===
                  "Yes" ? (
                    <FormTextArea
                      label="Tenancy dispute details *"
                      value={
                        form.tenancyDisputeDetails
                      }
                      errorMessage={
                        errors.tenancyDisputeDetails
                      }
                      onChangeText={(value) =>
                        updateField(
                          "tenancyDisputeDetails",
                          value,
                        )
                      }
                    />
                  ) : null}
                </QuestionSection>

                <QuestionSection
                  number="3"
                  icon="account-group-outline"
                  title="Household information"
                  description="Tell us who will live at the property."
                >
                  <FormTextArea
                    label="Other occupants"
                    placeholder="Enter names, ages and relationship to you"
                    value={
                      form.additionalOccupants
                    }
                    onChangeText={(value) =>
                      updateField(
                        "additionalOccupants",
                        value,
                      )
                    }
                  />

                  <YesNoQuestion
                    title="Will any pets live at the property?"
                    value={form.hasPets}
                    onChange={(value) =>
                      updateField(
                        "hasPets",
                        value,
                      )
                    }
                  />

                  {form.hasPets === "Yes" ? (
                    <FormTextArea
                      label="Pet details *"
                      placeholder="Type, breed, age and number of pets"
                      value={form.petDetails}
                      errorMessage={
                        errors.petDetails
                      }
                      onChangeText={(value) =>
                        updateField(
                          "petDetails",
                          value,
                        )
                      }
                    />
                  ) : null}

                  <YesNoQuestion
                    title="Will anyone smoke inside the property?"
                    value={form.smoker}
                    onChange={(value) =>
                      updateField(
                        "smoker",
                        value,
                      )
                    }
                  />
                </QuestionSection>

                <QuestionSection
                  number="4"
                  icon="account-cash-outline"
                  title="Guarantor"
                  description="Add guarantor details when one is required."
                >
                  <YesNoQuestion
                    title="Will you use a guarantor?"
                    value={form.needsGuarantor}
                    onChange={(value) =>
                      updateField(
                        "needsGuarantor",
                        value,
                      )
                    }
                  />

                  {form.needsGuarantor ===
                  "Yes" ? (
                    <View style={styles.fields}>
                      <FormInput
                        label="Guarantor full name *"
                        value={form.guarantorName}
                        errorMessage={
                          errors.guarantorName
                        }
                        onChangeText={(value) =>
                          updateField(
                            "guarantorName",
                            value,
                          )
                        }
                      />

                      <FormInput
                        label="Relationship *"
                        value={
                          form.guarantorRelationship
                        }
                        errorMessage={
                          errors.guarantorRelationship
                        }
                        onChangeText={(value) =>
                          updateField(
                            "guarantorRelationship",
                            value,
                          )
                        }
                      />

                      <FormInput
                        label="Guarantor email *"
                        value={
                          form.guarantorEmail
                        }
                        keyboardType="email-address"
                        autoCapitalize="none"
                        errorMessage={
                          errors.guarantorEmail
                        }
                        onChangeText={(value) =>
                          updateField(
                            "guarantorEmail",
                            value,
                          )
                        }
                      />

                      <FormInput
                        label="Guarantor phone *"
                        value={
                          form.guarantorPhone
                        }
                        keyboardType="phone-pad"
                        errorMessage={
                          errors.guarantorPhone
                        }
                        onChangeText={(value) =>
                          updateField(
                            "guarantorPhone",
                            value,
                          )
                        }
                      />

                      <FormInput
                        label="Guarantor annual income *"
                        value={
                          form.guarantorAnnualIncome
                        }
                        keyboardType="numeric"
                        errorMessage={
                          errors.guarantorAnnualIncome
                        }
                        left={
                          <TextInput.Icon icon="currency-gbp" />
                        }
                        onChangeText={(value) =>
                          updateField(
                            "guarantorAnnualIncome",
                            numbersOnly(value),
                          )
                        }
                      />
                    </View>
                  ) : null}
                </QuestionSection>

                <QuestionSection
                  number="5"
                  icon="bank-outline"
                  title="Financial declarations"
                  description="Answer the financial suitability questions."
                >
                  <YesNoQuestion
                    title="Do you have any County Court Judgments?"
                    value={form.hasCCJ}
                    onChange={(value) =>
                      updateField(
                        "hasCCJ",
                        value,
                      )
                    }
                  />

                  {form.hasCCJ === "Yes" ? (
                    <FormTextArea
                      label="County Court Judgment details *"
                      value={form.ccjDetails}
                      errorMessage={
                        errors.ccjDetails
                      }
                      onChangeText={(value) =>
                        updateField(
                          "ccjDetails",
                          value,
                        )
                      }
                    />
                  ) : null}

                  <YesNoQuestion
                    title="Have you ever been declared bankrupt?"
                    value={form.hasBankruptcy}
                    onChange={(value) =>
                      updateField(
                        "hasBankruptcy",
                        value,
                      )
                    }
                  />

                  {form.hasBankruptcy ===
                  "Yes" ? (
                    <FormTextArea
                      label="Bankruptcy details *"
                      value={
                        form.bankruptcyDetails
                      }
                      errorMessage={
                        errors.bankruptcyDetails
                      }
                      onChangeText={(value) =>
                        updateField(
                          "bankruptcyDetails",
                          value,
                        )
                      }
                    />
                  ) : null}

                  <ConsentRow
                    title="Deposit payment"
                    description={`I can pay the ${formatCurrency(
                      selectedProperty.deposit,
                    )} security deposit if the application is approved.`}
                    checked={form.canPayDeposit}
                    error={errors.canPayDeposit}
                    onPress={() =>
                      updateField(
                        "canPayDeposit",
                        !form.canPayDeposit,
                      )
                    }
                  />

                  <ConsentRow
                    title="First month’s rent"
                    description={`I can pay the first month’s rent of ${formatCurrency(
                      selectedProperty.monthlyRent,
                    )}.`}
                    checked={
                      form.canPayFirstMonthRent
                    }
                    error={
                      errors.canPayFirstMonthRent
                    }
                    onPress={() =>
                      updateField(
                        "canPayFirstMonthRent",
                        !form.canPayFirstMonthRent,
                      )
                    }
                  />
                </QuestionSection>

                <QuestionSection
                  number="6"
                  icon="calendar-check-outline"
                  title="Move-in details"
                  description="Tell us about your planned tenancy."
                >
                  <View style={styles.fields}>
                    <FormInput
                      label="Preferred move-in date *"
                      placeholder="DD/MM/YYYY"
                      value={
                        form.preferredMoveInDate
                      }
                      errorMessage={
                        errors.preferredMoveInDate
                      }
                      onChangeText={(value) =>
                        updateField(
                          "preferredMoveInDate",
                          value,
                        )
                      }
                    />

                    <FormInput
                      label="Preferred tenancy length"
                      placeholder="Example: 12 months"
                      value={
                        form.preferredTenancyLength
                      }
                      onChangeText={(value) =>
                        updateField(
                          "preferredTenancyLength",
                          value,
                        )
                      }
                    />
                  </View>

                  <FormTextArea
                    label="Why have you chosen this property? *"
                    value={
                      form.reasonForChoosingProperty
                    }
                    errorMessage={
                      errors.reasonForChoosingProperty
                    }
                    onChangeText={(value) =>
                      updateField(
                        "reasonForChoosingProperty",
                        value,
                      )
                    }
                  />

                  <FormTextArea
                    label="Accessibility or special requirements"
                    value={
                      form.specialRequirements
                    }
                    onChangeText={(value) =>
                      updateField(
                        "specialRequirements",
                        value,
                      )
                    }
                  />

                  <FormTextArea
                    label="Additional notes"
                    value={form.additionalNotes}
                    onChangeText={(value) =>
                      updateField(
                        "additionalNotes",
                        value,
                      )
                    }
                  />
                </QuestionSection>

                <QuestionSection
                  number="7"
                  icon="file-check-outline"
                  title="Consent and declaration"
                  description="Confirm the required application permissions."
                >
                  <ConsentRow
                    title="Reference checks"
                    description="I consent to TenureEx contacting my employer, landlord, guarantor or other references."
                    checked={
                      form.consentToReferenceChecks
                    }
                    error={
                      errors.consentToReferenceChecks
                    }
                    onPress={() =>
                      updateField(
                        "consentToReferenceChecks",
                        !form.consentToReferenceChecks,
                      )
                    }
                  />

                  <ConsentRow
                    title="Affordability checks"
                    description="I consent to appropriate affordability and financial checks for this tenancy application."
                    checked={
                      form.consentToAffordabilityChecks
                    }
                    error={
                      errors.consentToAffordabilityChecks
                    }
                    onPress={() =>
                      updateField(
                        "consentToAffordabilityChecks",
                        !form.consentToAffordabilityChecks,
                      )
                    }
                  />

                  <ConsentRow
                    title="Information declaration"
                    description="I confirm that the information supplied in this application is complete and accurate."
                    checked={
                      form.confirmInformationCorrect
                    }
                    error={
                      errors.confirmInformationCorrect
                    }
                    onPress={() =>
                      updateField(
                        "confirmInformationCorrect",
                        !form.confirmInformationCorrect,
                      )
                    }
                  />
                </QuestionSection>

                <View style={styles.formActions}>
                  <Button
                    mode="outlined"
                    icon="arrow-left"
                    onPress={() => router.back()}
                  >
                    Back to property
                  </Button>

                  <Button
                    mode="contained"
                    icon="clipboard-check-outline"
                    onPress={handleReview}
                  >
                    Review application
                  </Button>
                </View>
              </>
            ) : (
              <ApplicationReview
                form={form}
                property={selectedProperty}
                loading={loading}
                onEdit={() => setReviewMode(false)}
                onSubmit={
                  handleSubmitApplication
                }
              />
            )}
          </View>

          {isTablet ? (
            <View style={styles.sideColumn}>
              <View style={styles.propertyCard}>
                <View style={styles.propertyCardIcon}>
                  <MaterialCommunityIcons
                    name="home-outline"
                    size={29}
                    color={colors.primary}
                  />
                </View>

                <Text style={styles.propertyCardLabel}>
                  APPLYING FOR
                </Text>

                <Text style={styles.propertyCardTitle}>
                  {selectedProperty.title}
                </Text>

                <Text
                  style={styles.propertyCardAddress}
                >
                  {selectedProperty.address}
                </Text>

                <View style={styles.propertyFacts}>
                  <PropertyFact
                    icon="bed-outline"
                    value={`${selectedProperty.bedrooms} bedrooms`}
                  />

                  <PropertyFact
                    icon="shower"
                    value={`${selectedProperty.bathrooms} bathrooms`}
                  />

                  <PropertyFact
                    icon="cash"
                    value={`${formatCurrency(
                      selectedProperty.monthlyRent,
                    )} per month`}
                  />

                  <PropertyFact
                    icon="bank-transfer"
                    value={`${formatCurrency(
                      selectedProperty.deposit,
                    )} deposit`}
                  />
                </View>

                <Button
                  mode="outlined"
                  icon="eye-outline"
                  onPress={() =>
                    router.push({
                      pathname:
                        "/tenant/property-details" as never,
                      params: {
                        propertyId:
                          selectedProperty.id,
                      },
                    })
                  }
                >
                  View property
                </Button>
              </View>

              <View style={styles.helpCard}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={25}
                  color={colors.primary}
                />

                <View style={styles.helpContent}>
                  <Text style={styles.helpTitle}>
                    What happens next?
                  </Text>

                  <Text
                    style={styles.helpDescription}
                  >
                    After reviewing these answers, you
                    will upload the required supporting
                    documents. The application will then
                    be submitted for review.
                  </Text>
                </View>
              </View>

              <View style={styles.securityCard}>
                <MaterialCommunityIcons
                  name="shield-lock-outline"
                  size={25}
                  color={colors.success}
                />

                <View style={styles.helpContent}>
                  <Text style={styles.helpTitle}>
                    Protect your information
                  </Text>

                  <Text
                    style={styles.helpDescription}
                  >
                    Financial and reference information
                    should be stored securely and only
                    shared with authorised application
                    reviewers.
                  </Text>
                </View>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <Snackbar
        visible={Boolean(message)}
        onDismiss={() => setMessage("")}
        duration={3000}
        action={{
          label: "Close",
          onPress: () => setMessage(""),
        }}
      >
        {message}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

function ApplicationReview({
  form,
  property,
  loading,
  onEdit,
  onSubmit,
}: {
  form: ApplicationForm;
  property: PropertySummary;
  loading: boolean;
  onEdit: () => void;
  onSubmit: () => void;
}) {
  return (
    <View style={styles.reviewPage}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewHeaderIcon}>
          <MaterialCommunityIcons
            name="clipboard-check-outline"
            size={31}
            color={colors.primary}
          />
        </View>

        <View style={styles.reviewHeaderContent}>
          <Text style={styles.reviewTitle}>
            Review your application
          </Text>

          <Text style={styles.reviewDescription}>
            Check your answers before continuing to the
            document upload stage.
          </Text>
        </View>
      </View>

      <ReviewSection title="Selected property">
        <ReviewRow
          label="Property"
          value={property.title}
        />
        <ReviewRow
          label="Address"
          value={property.address}
        />
        <ReviewRow
          label="Monthly rent"
          value={formatCurrency(
            property.monthlyRent,
          )}
        />
        <ReviewRow
          label="Deposit"
          value={formatCurrency(property.deposit)}
        />
      </ReviewSection>

      <ReviewSection title="Employment and income">
        <ReviewRow
          label="Employment status"
          value={form.employmentStatus}
        />
        <ReviewRow
          label="Employer"
          value={form.employerName || "Not provided"}
        />
        <ReviewRow
          label="Job title"
          value={form.jobTitle || "Not provided"}
        />
        <ReviewRow
          label="Annual income"
          value={
            form.annualIncome
              ? formatCurrency(
                  Number(form.annualIncome),
                )
              : "Not provided"
          }
        />
        <ReviewRow
          label="Monthly take-home pay"
          value={
            form.monthlyTakeHomePay
              ? formatCurrency(
                  Number(
                    form.monthlyTakeHomePay,
                  ),
                )
              : "Not provided"
          }
        />
      </ReviewSection>

      <ReviewSection title="Current tenancy">
        <ReviewRow
          label="Current landlord"
          value={
            form.currentLandlordName ||
            "Not provided"
          }
        />
        <ReviewRow
          label="Time at address"
          value={form.currentAddressDuration}
        />
        <ReviewRow
          label="Reason for moving"
          value={form.reasonForMoving}
        />
        <ReviewRow
          label="Rent arrears"
          value={form.hasRentArrears}
        />
        <ReviewRow
          label="Tenancy disputes"
          value={form.hasTenancyDisputes}
        />
      </ReviewSection>

      <ReviewSection title="Household and guarantor">
        <ReviewRow
          label="Other occupants"
          value={
            form.additionalOccupants ||
            "None provided"
          }
        />
        <ReviewRow
          label="Pets"
          value={
            form.hasPets === "Yes"
              ? form.petDetails
              : "No"
          }
        />
        <ReviewRow
          label="Smoking"
          value={form.smoker}
        />
        <ReviewRow
          label="Guarantor"
          value={
            form.needsGuarantor === "Yes"
              ? form.guarantorName
              : "Not required"
          }
        />
      </ReviewSection>

      <ReviewSection title="Move-in information">
        <ReviewRow
          label="Move-in date"
          value={form.preferredMoveInDate}
        />
        <ReviewRow
          label="Tenancy length"
          value={form.preferredTenancyLength}
        />
        <ReviewRow
          label="Reason for applying"
          value={
            form.reasonForChoosingProperty
          }
        />
      </ReviewSection>

      <View style={styles.reviewNotice}>
        <MaterialCommunityIcons
          name="file-upload-outline"
          size={24}
          color={colors.primary}
        />

        <Text style={styles.reviewNoticeText}>
          The next page will ask you to upload proof of
          identity, Right to Rent evidence, proof of
          income and other supporting documents.
        </Text>
      </View>

      <View style={styles.reviewActions}>
        <Button
          mode="outlined"
          icon="pencil-outline"
          onPress={onEdit}
          disabled={loading}
        >
          Edit answers
        </Button>

        <Button
          mode="contained"
          icon="arrow-right"
          loading={loading}
          disabled={loading}
          onPress={onSubmit}
        >
          Continue to documents
        </Button>
      </View>
    </View>
  );
}

function QuestionSection({
  number,
  icon,
  title,
  description,
  children,
}: {
  number: string;
  icon: IconName;
  title: string;
  description: string;
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

        <View style={styles.sectionHeaderContent}>
          <Text style={styles.sectionTitle}>
            {title}
          </Text>

          <Text style={styles.sectionDescription}>
            {description}
          </Text>
        </View>
      </View>

      <View style={styles.sectionBody}>
        {children}
      </View>
    </View>
  );
}

function FormInput({
  errorMessage,
  ...props
}: React.ComponentProps<typeof TextInput> & {
  errorMessage?: string;
}) {
  return (
    <View style={styles.field}>
      <TextInput
        mode="outlined"
        error={Boolean(errorMessage)}
        {...props}
      />

      <HelperText
        type="error"
        visible={Boolean(errorMessage)}
      >
        {errorMessage}
      </HelperText>
    </View>
  );
}

function FormTextArea({
  errorMessage,
  ...props
}: React.ComponentProps<typeof TextInput> & {
  errorMessage?: string;
}) {
  return (
    <View style={styles.fullWidthField}>
      <TextInput
        mode="outlined"
        multiline
        numberOfLines={4}
        error={Boolean(errorMessage)}
        {...props}
      />

      <HelperText
        type="error"
        visible={Boolean(errorMessage)}
      >
        {errorMessage}
      </HelperText>
    </View>
  );
}

function YesNoQuestion({
  title,
  value,
  onChange,
}: {
  title: string;
  value: YesNo;
  onChange: (value: YesNo) => void;
}) {
  return (
    <View style={styles.yesNoContainer}>
      <Text style={styles.yesNoTitle}>
        {title}
      </Text>

      <View style={styles.yesNoOptions}>
        {(["Yes", "No"] as YesNo[]).map(
          (option) => {
            const selected = value === option;

            return (
              <Pressable
                key={option}
                style={[
                  styles.yesNoButton,
                  selected &&
                    styles.yesNoButtonSelected,
                ]}
                onPress={() => onChange(option)}
              >
                <MaterialCommunityIcons
                  name={
                    selected
                      ? "radiobox-marked"
                      : "radiobox-blank"
                  }
                  size={19}
                  color={
                    selected
                      ? colors.primary
                      : colors.textMuted
                  }
                />

                <Text
                  style={[
                    styles.yesNoButtonText,
                    selected &&
                      styles.yesNoButtonTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            );
          },
        )}
      </View>
    </View>
  );
}

function SwitchRow({
  icon,
  title,
  description,
  value,
  onValueChange,
}: {
  icon: IconName;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <Pressable
      style={[
        styles.switchRow,
        value && styles.switchRowSelected,
      ]}
      onPress={() => onValueChange(!value)}
    >
      <View style={styles.switchIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={colors.primary}
        />
      </View>

      <View style={styles.switchContent}>
        <Text style={styles.switchTitle}>
          {title}
        </Text>

        <Text style={styles.switchDescription}>
          {description}
        </Text>
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
      />
    </Pressable>
  );
}

function ConsentRow({
  title,
  description,
  checked,
  error,
  onPress,
}: {
  title: string;
  description: string;
  checked: boolean;
  error?: string;
  onPress: () => void;
}) {
  return (
    <View>
      <Pressable
        style={[
          styles.consentRow,
          Boolean(error) &&
            styles.consentRowError,
        ]}
        onPress={onPress}
      >
        <Checkbox
          status={
            checked ? "checked" : "unchecked"
          }
          onPress={onPress}
        />

        <View style={styles.consentContent}>
          <Text style={styles.consentTitle}>
            {title}
          </Text>

          <Text
            style={styles.consentDescription}
          >
            {description}
          </Text>
        </View>
      </Pressable>

      <HelperText
        type="error"
        visible={Boolean(error)}
      >
        {error}
      </HelperText>
    </View>
  );
}

function ProgressStep({
  number,
  title,
  active = false,
  complete = false,
}: {
  number: string;
  title: string;
  active?: boolean;
  complete?: boolean;
}) {
  return (
    <View style={styles.progressStep}>
      <View
        style={[
          styles.progressCircle,
          active && styles.progressCircleActive,
          complete &&
            styles.progressCircleComplete,
        ]}
      >
        <MaterialCommunityIcons
          name={
            complete
              ? "check"
              : (`numeric-${number}` as IconName)
          }
          size={17}
          color={
            active || complete
              ? colors.white
              : colors.textMuted
          }
        />
      </View>

      <Text
        style={[
          styles.progressTitle,
          (active || complete) &&
            styles.progressTitleActive,
        ]}
      >
        {title}
      </Text>
    </View>
  );
}

function ProgressLine({
  complete = false,
}: {
  complete?: boolean;
}) {
  return (
    <View
      style={[
        styles.progressLine,
        complete && styles.progressLineComplete,
      ]}
    />
  );
}

function PropertyFact({
  icon,
  value,
}: {
  icon: IconName;
  value: string;
}) {
  return (
    <View style={styles.propertyFact}>
      <MaterialCommunityIcons
        name={icon}
        size={19}
        color={colors.primary}
      />

      <Text style={styles.propertyFactText}>
        {value}
      </Text>
    </View>
  );
}

function ReviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.reviewSection}>
      <Text style={styles.reviewSectionTitle}>
        {title}
      </Text>

      <View style={styles.reviewSectionBody}>
        {children}
      </View>
    </View>
  );
}

function ReviewRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewRowLabel}>
        {label}
      </Text>

      <Text style={styles.reviewRowValue}>
        {value}
      </Text>
    </View>
  );
}

function numbersOnly(value: string) {
  return value.replace(/[^0-9]/g, "");
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email.trim(),
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
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  page: {
    width: "100%",
    maxWidth: 1500,
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

  progressSteps: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  progressStep: {
    width: 95,
    alignItems: "center",
  },

  progressCircle: {
    width: 37,
    height: 37,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 19,
    backgroundColor: colors.background,
  },

  progressCircleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },

  progressCircleComplete: {
    borderColor: colors.success,
    backgroundColor: colors.success,
  },

  progressTitle: {
    marginTop: 6,
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "800",
    textAlign: "center",
  },

  progressTitleActive: {
    color: colors.textPrimary,
  },

  progressLine: {
    width: 55,
    height: 2,
    marginTop: 18,
    backgroundColor: colors.border,
  },

  progressLineComplete: {
    backgroundColor: colors.success,
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
    width: 66,
    height: 66,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: colors.primaryLight,
  },

  heroContent: {
    flex: 1,
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
    maxWidth: 760,
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 17,
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

  sectionHeaderContent: {
    flex: 1,
  },

  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "900",
  },

  sectionDescription: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 15,
  },

  sectionBody: {
    gap: spacing.md,
    padding: spacing.lg,
  },

  fields: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },

  field: {
    flexGrow: 1,
    flexBasis: 280,
    minWidth: 240,
  },

  fullWidthField: {
    width: "100%",
  },

  menuField: {
    maxWidth: 500,
  },

  fieldLabel: {
    marginBottom: spacing.sm,
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "800",
  },

  menuButton: {
    width: "100%",
  },

  menuButtonContent: {
    minHeight: 49,
    justifyContent: "flex-start",
  },

  yesNoContainer: {
    gap: spacing.sm,
  },

  yesNoTitle: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "800",
  },

  yesNoOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  yesNoButton: {
    minWidth: 105,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
  },

  yesNoButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },

  yesNoButtonText: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: "800",
  },

  yesNoButtonTextSelected: {
    color: colors.primary,
  },

  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
  },

  switchRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },

  switchIcon: {
    width: 43,
    height: 43,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.white,
  },

  switchContent: {
    flex: 1,
  },

  switchTitle: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },

  switchDescription: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 8,
    lineHeight: 14,
  },

  consentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
  },

  consentRowError: {
    borderColor: colors.error,
  },

  consentContent: {
    flex: 1,
    paddingTop: 7,
  },

  consentTitle: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },

  consentDescription: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 15,
  },

  formActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  propertyCard: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  propertyCardIcon: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
  },

  propertyCardLabel: {
    marginTop: spacing.md,
    color: colors.primary,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  propertyCardTitle: {
    marginTop: 5,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 22,
  },

  propertyCardAddress: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 15,
  },

  propertyFacts: {
    gap: spacing.md,
    marginVertical: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },

  propertyFact: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  propertyFactText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: "700",
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

  securityCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: radius.xl,
    backgroundColor: colors.successLight,
  },

  helpContent: {
    flex: 1,
  },

  helpTitle: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "900",
  },

  helpDescription: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
  },

  reviewPage: {
    gap: spacing.lg,
  },

  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.xl,
    backgroundColor: colors.primaryLight,
  },

  reviewHeaderIcon: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: colors.white,
  },

  reviewHeaderContent: {
    flex: 1,
  },

  reviewTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "900",
  },

  reviewDescription: {
    marginTop: 5,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
  },

  reviewSection: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  reviewSectionTitle: {
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "900",
    backgroundColor: colors.background,
  },

  reviewSectionBody: {
    paddingHorizontal: spacing.lg,
  },

  reviewRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  reviewRowLabel: {
    width: "35%",
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: "800",
  },

  reviewRowValue: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "800",
    lineHeight: 15,
    textAlign: "right",
  },

  reviewNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.primaryLight,
  },

  reviewNoticeText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
  },

  reviewActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },
});