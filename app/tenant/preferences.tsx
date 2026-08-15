import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
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

type PropertyType =
  | "Any property type"
  | "House"
  | "Flat"
  | "Studio"
  | "Bungalow"
  | "Shared property";

type FurnishingPreference =
  | "Any furnishing"
  | "Furnished"
  | "Part-furnished"
  | "Unfurnished";

type TenancyLength =
  | "6 months"
  | "12 months"
  | "18 months"
  | "24 months or more";

type PetType =
  | "Dog"
  | "Cat"
  | "Bird"
  | "Small animal"
  | "Other";

type PreferenceForm = {
  preferredLocation: string;
  preferredPostcode: string;
  maximumMonthlyRent: string;
  propertyType: PropertyType;
  minimumBedrooms: number;
  minimumBathrooms: number;
  furnishing: FurnishingPreference;
  moveInDate: string;
  tenancyLength: TenancyLength;

  adults: number;
  children: number;

  hasPets: boolean;
  petTypes: PetType[];
  numberOfPets: number;

  parkingRequired: boolean;
  gardenRequired: boolean;
  accessibilityRequired: boolean;
  publicTransportImportant: boolean;
  billsIncludedPreferred: boolean;

  accessibilityDetails: string;
  additionalRequirements: string;

  consentToMatching: boolean;
};

type FormErrors = Partial<
  Record<keyof PreferenceForm, string>
>;

type SampleProperty = {
  id: string;
  title: string;
  address: string;
  postcode: string;
  city: string;
  monthlyRent: number;
  propertyType: Exclude<
    PropertyType,
    "Any property type"
  >;
  bedrooms: number;
  bathrooms: number;
  furnishing: Exclude<
    FurnishingPreference,
    "Any furnishing"
  >;
  maximumOccupancy: number;
  petsAllowed: boolean;
  parking: boolean;
  garden: boolean;
  accessible: boolean;
  nearPublicTransport: boolean;
  billsIncluded: boolean;
};

type PropertyMatch = SampleProperty & {
  matchScore: number;
  matchedRequirements: string[];
  unmatchedRequirements: string[];
};

const propertyTypes: PropertyType[] = [
  "Any property type",
  "House",
  "Flat",
  "Studio",
  "Bungalow",
  "Shared property",
];

const furnishingOptions: FurnishingPreference[] = [
  "Any furnishing",
  "Furnished",
  "Part-furnished",
  "Unfurnished",
];

const tenancyLengths: TenancyLength[] = [
  "6 months",
  "12 months",
  "18 months",
  "24 months or more",
];

const petTypes: PetType[] = [
  "Dog",
  "Cat",
  "Bird",
  "Small animal",
  "Other",
];

const sampleProperties: SampleProperty[] = [
  {
    id: "PROPERTY-001",
    title: "Modern Two-Bedroom Apartment",
    address: "42 King Street, Leeds",
    postcode: "LS1 2HQ",
    city: "Leeds",
    monthlyRent: 1325,
    propertyType: "Flat",
    bedrooms: 2,
    bathrooms: 2,
    furnishing: "Furnished",
    maximumOccupancy: 4,
    petsAllowed: true,
    parking: true,
    garden: false,
    accessible: true,
    nearPublicTransport: true,
    billsIncluded: false,
  },
  {
    id: "PROPERTY-002",
    title: "Three-Bedroom Family Home",
    address: "18 Victoria Road, Manchester",
    postcode: "M14 6BT",
    city: "Manchester",
    monthlyRent: 1450,
    propertyType: "House",
    bedrooms: 3,
    bathrooms: 2,
    furnishing: "Part-furnished",
    maximumOccupancy: 5,
    petsAllowed: true,
    parking: true,
    garden: true,
    accessible: false,
    nearPublicTransport: true,
    billsIncluded: false,
  },
  {
    id: "PROPERTY-003",
    title: "City Centre One-Bedroom Flat",
    address: "91 High Street, Birmingham",
    postcode: "B4 7SL",
    city: "Birmingham",
    monthlyRent: 1100,
    propertyType: "Flat",
    bedrooms: 1,
    bathrooms: 1,
    furnishing: "Furnished",
    maximumOccupancy: 2,
    petsAllowed: false,
    parking: false,
    garden: false,
    accessible: true,
    nearPublicTransport: true,
    billsIncluded: true,
  },
  {
    id: "PROPERTY-004",
    title: "Two-Bedroom Bungalow",
    address: "7 Meadow Close, Sheffield",
    postcode: "S11 8RT",
    city: "Sheffield",
    monthlyRent: 1250,
    propertyType: "Bungalow",
    bedrooms: 2,
    bathrooms: 1,
    furnishing: "Unfurnished",
    maximumOccupancy: 4,
    petsAllowed: true,
    parking: true,
    garden: true,
    accessible: true,
    nearPublicTransport: false,
    billsIncluded: false,
  },
];

const initialForm: PreferenceForm = {
  preferredLocation: "",
  preferredPostcode: "",
  maximumMonthlyRent: "",
  propertyType: "Any property type",
  minimumBedrooms: 1,
  minimumBathrooms: 1,
  furnishing: "Any furnishing",
  moveInDate: "",
  tenancyLength: "12 months",

  adults: 1,
  children: 0,

  hasPets: false,
  petTypes: [],
  numberOfPets: 0,

  parkingRequired: false,
  gardenRequired: false,
  accessibilityRequired: false,
  publicTransportImportant: false,
  billsIncludedPreferred: false,

  accessibilityDetails: "",
  additionalRequirements: "",

  consentToMatching: false,
};

export default function TenantPreferencesScreen() {
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1050;
  const isTablet = width >= 700;

  const [form, setForm] =
    useState<PreferenceForm>(initialForm);

  const [errors, setErrors] =
    useState<FormErrors>({});

  const [propertyTypeMenuOpen, setPropertyTypeMenuOpen] =
    useState(false);

  const [furnishingMenuOpen, setFurnishingMenuOpen] =
    useState(false);

  const [tenancyMenuOpen, setTenancyMenuOpen] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const totalHouseholdMembers =
    form.adults + form.children;

  const previewMatches = useMemo(
    () => calculatePropertyMatches(form),
    [form],
  );

  const bestPreviewMatch = previewMatches[0];

  const updateField = <K extends keyof PreferenceForm>(
    field: K,
    value: PreferenceForm[K],
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

  const togglePetType = (petType: PetType) => {
    setForm((current) => {
      const selected =
        current.petTypes.includes(petType);

      return {
        ...current,
        petTypes: selected
          ? current.petTypes.filter(
              (item) => item !== petType,
            )
          : [...current.petTypes, petType],
      };
    });

    setErrors((current) => ({
      ...current,
      petTypes: undefined,
    }));
  };

  const handlePetToggle = (value: boolean) => {
    setForm((current) => ({
      ...current,
      hasPets: value,
      numberOfPets: value
        ? Math.max(current.numberOfPets, 1)
        : 0,
      petTypes: value ? current.petTypes : [],
    }));
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!form.preferredLocation.trim()) {
      nextErrors.preferredLocation =
        "Enter a preferred city, town or area.";
    }

    if (!form.maximumMonthlyRent.trim()) {
      nextErrors.maximumMonthlyRent =
        "Enter your maximum monthly rent.";
    } else {
      const rent = Number(
        form.maximumMonthlyRent,
      );

      if (
        Number.isNaN(rent) ||
        rent < 100
      ) {
        nextErrors.maximumMonthlyRent =
          "Enter a valid monthly rent.";
      }
    }

    if (!form.moveInDate.trim()) {
      nextErrors.moveInDate =
        "Enter your preferred move-in date.";
    }

    if (form.adults < 1) {
      nextErrors.adults =
        "At least one adult is required.";
    }

    if (
      form.hasPets &&
      form.petTypes.length === 0
    ) {
      nextErrors.petTypes =
        "Select at least one pet type.";
    }

    if (
      form.hasPets &&
      form.numberOfPets < 1
    ) {
      nextErrors.numberOfPets =
        "Enter the number of pets.";
    }

    if (
      form.accessibilityRequired &&
      !form.accessibilityDetails.trim()
    ) {
      nextErrors.accessibilityDetails =
        "Describe the accessibility features required.";
    }

    if (!form.consentToMatching) {
      nextErrors.consentToMatching =
        "You must agree before property matching can continue.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSavePreferences = async () => {
    if (!validateForm()) {
      setMessage(
        "Please complete the required questions.",
      );
      return;
    }

    setLoading(true);

    try {
      await new Promise((resolve) =>
        setTimeout(resolve, 900),
      );

      const matches =
        calculatePropertyMatches(form);

      /*
       * Later, replace this sample section with:
       *
       * 1. Save preferences to the backend.
       * 2. Load approved landlord properties.
       * 3. Calculate matching scores on the server.
       * 4. Return the sorted property results.
       *
       * Example backend data:
       *
       * POST /api/tenants/preferences
       *
       * {
       *   tenantId,
       *   preferences: form
       * }
       */

      console.log(
        "Tenant preferences:",
        form,
      );

      console.log(
        "Matched properties:",
        matches,
      );

      setMessage(
        `${matches.length} property matches found.`,
      );

      setTimeout(() => {
        router.push(
          "/tenant/properties" as never,
        );
      }, 500);
    } catch {
      setMessage(
        "Unable to save preferences. Please try again.",
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
            style={styles.brandArea}
            onPress={() =>
              router.push(
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
                Tenant property preferences
              </Text>
            </View>
          </Pressable>

          <Button
            mode="text"
            icon="view-dashboard-outline"
            onPress={() =>
              router.push(
                "/tenant/dashboard" as never,
              )
            }
          >
            Dashboard
          </Button>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons
              name="home-search-outline"
              size={39}
              color={colors.primary}
            />
          </View>

          <View style={styles.heroContent}>
            <Text style={styles.heroLabel}>
              PROPERTY MATCHING
            </Text>

            <Text style={styles.heroTitle}>
              Tell us what you need in a property
            </Text>

            <Text style={styles.heroDescription}>
              Your answers will be compared with
              approved landlord properties. The
              system will show the most suitable
              properties first.
            </Text>
          </View>
        </View>

        <View style={styles.progressSteps}>
          <ProgressStep
            number="1"
            title="Account"
            complete
          />

          <ProgressLine complete />

          <ProgressStep
            number="2"
            title="Preferences"
            active
          />

          <ProgressLine />

          <ProgressStep
            number="3"
            title="Property matches"
          />

          <ProgressLine />

          <ProgressStep
            number="4"
            title="Application"
          />
        </View>

        <View
          style={[
            styles.layout,
            !isDesktop && styles.layoutStacked,
          ]}
        >
          <View style={styles.formColumn}>
            <QuestionSection
              number="1"
              icon="map-marker-outline"
              title="Location and budget"
              description="Tell us where you want to live and your maximum monthly rent."
            >
              <View style={styles.fields}>
                <FormInput
                  label="Preferred city, town or area *"
                  placeholder="Example: Leeds"
                  value={form.preferredLocation}
                  errorMessage={
                    errors.preferredLocation
                  }
                  left={
                    <TextInput.Icon icon="city-variant-outline" />
                  }
                  onChangeText={(value) =>
                    updateField(
                      "preferredLocation",
                      value,
                    )
                  }
                />

                <FormInput
                  label="Preferred postcode"
                  placeholder="Example: LS1"
                  value={form.preferredPostcode}
                  autoCapitalize="characters"
                  left={
                    <TextInput.Icon icon="map-marker-radius-outline" />
                  }
                  onChangeText={(value) =>
                    updateField(
                      "preferredPostcode",
                      value.toUpperCase(),
                    )
                  }
                />

                <FormInput
                  label="Maximum monthly rent *"
                  placeholder="Example: 1400"
                  value={
                    form.maximumMonthlyRent
                  }
                  keyboardType="numeric"
                  errorMessage={
                    errors.maximumMonthlyRent
                  }
                  left={
                    <TextInput.Icon icon="currency-gbp" />
                  }
                  onChangeText={(value) =>
                    updateField(
                      "maximumMonthlyRent",
                      numbersOnly(value),
                    )
                  }
                />

                <FormInput
                  label="Preferred move-in date *"
                  placeholder="DD/MM/YYYY"
                  value={form.moveInDate}
                  errorMessage={
                    errors.moveInDate
                  }
                  left={
                    <TextInput.Icon icon="calendar-outline" />
                  }
                  onChangeText={(value) =>
                    updateField(
                      "moveInDate",
                      value,
                    )
                  }
                />
              </View>
            </QuestionSection>

            <QuestionSection
              number="2"
              icon="home-outline"
              title="Property requirements"
              description="Choose the minimum property features you require."
            >
              <View style={styles.menuGrid}>
                <View style={styles.menuField}>
                  <Text style={styles.fieldLabel}>
                    Property type
                  </Text>

                  <Menu
                    visible={
                      propertyTypeMenuOpen
                    }
                    onDismiss={() =>
                      setPropertyTypeMenuOpen(
                        false,
                      )
                    }
                    anchor={
                      <Button
                        mode="outlined"
                        icon="home-variant-outline"
                        contentStyle={
                          styles.menuButtonContent
                        }
                        style={styles.menuButton}
                        onPress={() =>
                          setPropertyTypeMenuOpen(
                            true,
                          )
                        }
                      >
                        {form.propertyType}
                      </Button>
                    }
                  >
                    {propertyTypes.map(
                      (propertyType) => (
                        <Menu.Item
                          key={propertyType}
                          title={propertyType}
                          onPress={() => {
                            updateField(
                              "propertyType",
                              propertyType,
                            );

                            setPropertyTypeMenuOpen(
                              false,
                            );
                          }}
                        />
                      ),
                    )}
                  </Menu>
                </View>

                <View style={styles.menuField}>
                  <Text style={styles.fieldLabel}>
                    Furnishing
                  </Text>

                  <Menu
                    visible={
                      furnishingMenuOpen
                    }
                    onDismiss={() =>
                      setFurnishingMenuOpen(
                        false,
                      )
                    }
                    anchor={
                      <Button
                        mode="outlined"
                        icon="sofa-outline"
                        contentStyle={
                          styles.menuButtonContent
                        }
                        style={styles.menuButton}
                        onPress={() =>
                          setFurnishingMenuOpen(
                            true,
                          )
                        }
                      >
                        {form.furnishing}
                      </Button>
                    }
                  >
                    {furnishingOptions.map(
                      (option) => (
                        <Menu.Item
                          key={option}
                          title={option}
                          onPress={() => {
                            updateField(
                              "furnishing",
                              option,
                            );

                            setFurnishingMenuOpen(
                              false,
                            );
                          }}
                        />
                      ),
                    )}
                  </Menu>
                </View>

                <View style={styles.menuField}>
                  <Text style={styles.fieldLabel}>
                    Tenancy length
                  </Text>

                  <Menu
                    visible={tenancyMenuOpen}
                    onDismiss={() =>
                      setTenancyMenuOpen(false)
                    }
                    anchor={
                      <Button
                        mode="outlined"
                        icon="calendar-range"
                        contentStyle={
                          styles.menuButtonContent
                        }
                        style={styles.menuButton}
                        onPress={() =>
                          setTenancyMenuOpen(true)
                        }
                      >
                        {form.tenancyLength}
                      </Button>
                    }
                  >
                    {tenancyLengths.map(
                      (length) => (
                        <Menu.Item
                          key={length}
                          title={length}
                          onPress={() => {
                            updateField(
                              "tenancyLength",
                              length,
                            );

                            setTenancyMenuOpen(
                              false,
                            );
                          }}
                        />
                      ),
                    )}
                  </Menu>
                </View>
              </View>

              <View style={styles.counterGrid}>
                <CounterQuestion
                  icon="bed-outline"
                  title="Minimum bedrooms"
                  value={form.minimumBedrooms}
                  minimum={0}
                  maximum={10}
                  onDecrease={() =>
                    updateField(
                      "minimumBedrooms",
                      Math.max(
                        0,
                        form.minimumBedrooms - 1,
                      ),
                    )
                  }
                  onIncrease={() =>
                    updateField(
                      "minimumBedrooms",
                      Math.min(
                        10,
                        form.minimumBedrooms + 1,
                      ),
                    )
                  }
                />

                <CounterQuestion
                  icon="shower"
                  title="Minimum bathrooms"
                  value={form.minimumBathrooms}
                  minimum={1}
                  maximum={10}
                  onDecrease={() =>
                    updateField(
                      "minimumBathrooms",
                      Math.max(
                        1,
                        form.minimumBathrooms - 1,
                      ),
                    )
                  }
                  onIncrease={() =>
                    updateField(
                      "minimumBathrooms",
                      Math.min(
                        10,
                        form.minimumBathrooms + 1,
                      ),
                    )
                  }
                />
              </View>
            </QuestionSection>

            <QuestionSection
              number="3"
              icon="account-group-outline"
              title="Household information"
              description="Household numbers help the system check occupancy suitability."
            >
              <View style={styles.counterGrid}>
                <CounterQuestion
                  icon="account-outline"
                  title="Number of adults"
                  value={form.adults}
                  minimum={1}
                  maximum={15}
                  errorMessage={
                    errors.adults
                  }
                  onDecrease={() =>
                    updateField(
                      "adults",
                      Math.max(
                        1,
                        form.adults - 1,
                      ),
                    )
                  }
                  onIncrease={() =>
                    updateField(
                      "adults",
                      Math.min(
                        15,
                        form.adults + 1,
                      ),
                    )
                  }
                />

                <CounterQuestion
                  icon="account-child-outline"
                  title="Number of children"
                  value={form.children}
                  minimum={0}
                  maximum={15}
                  onDecrease={() =>
                    updateField(
                      "children",
                      Math.max(
                        0,
                        form.children - 1,
                      ),
                    )
                  }
                  onIncrease={() =>
                    updateField(
                      "children",
                      Math.min(
                        15,
                        form.children + 1,
                      ),
                    )
                  }
                />
              </View>

              <View style={styles.householdSummary}>
                <MaterialCommunityIcons
                  name="home-account"
                  size={24}
                  color={colors.primary}
                />

                <View style={styles.summaryContent}>
                  <Text style={styles.summaryTitle}>
                    Total household members
                  </Text>

                  <Text
                    style={styles.summaryDescription}
                  >
                    {totalHouseholdMembers}{" "}
                    {totalHouseholdMembers === 1
                      ? "person"
                      : "people"}
                  </Text>
                </View>
              </View>

              <View style={styles.privacyNotice}>
                <MaterialCommunityIcons
                  name="shield-account-outline"
                  size={22}
                  color={colors.primary}
                />

                <Text style={styles.privacyNoticeText}>
                  These questions are used only to
                  identify suitable property size and
                  occupancy. Property matching should
                  not use protected characteristics.
                </Text>
              </View>
            </QuestionSection>

            <QuestionSection
              number="4"
              icon="paw-outline"
              title="Pets"
              description="Tell us whether you need a property that accepts pets."
            >
              <SwitchQuestion
                icon="paw-outline"
                title="I have pets"
                description="Only properties that allow pets will receive a full pet suitability score."
                value={form.hasPets}
                onValueChange={handlePetToggle}
              />

              {form.hasPets ? (
                <View style={styles.conditionalBox}>
                  <Text style={styles.fieldLabel}>
                    Select pet type *
                  </Text>

                  <View style={styles.choiceGroup}>
                    {petTypes.map((petType) => (
                      <ChoiceButton
                        key={petType}
                        label={petType}
                        selected={form.petTypes.includes(
                          petType,
                        )}
                        onPress={() =>
                          togglePetType(petType)
                        }
                      />
                    ))}
                  </View>

                  <HelperText
                    type="error"
                    visible={Boolean(
                      errors.petTypes,
                    )}
                  >
                    {errors.petTypes}
                  </HelperText>

                  <CounterQuestion
                    icon="counter"
                    title="Number of pets"
                    value={form.numberOfPets}
                    minimum={1}
                    maximum={10}
                    errorMessage={
                      errors.numberOfPets
                    }
                    onDecrease={() =>
                      updateField(
                        "numberOfPets",
                        Math.max(
                          1,
                          form.numberOfPets - 1,
                        ),
                      )
                    }
                    onIncrease={() =>
                      updateField(
                        "numberOfPets",
                        Math.min(
                          10,
                          form.numberOfPets + 1,
                        ),
                      )
                    }
                  />
                </View>
              ) : null}
            </QuestionSection>

            <QuestionSection
              number="5"
              icon="star-outline"
              title="Additional property features"
              description="Select the property features that are important to you."
            >
              <View style={styles.switchGrid}>
                <SwitchQuestion
                  icon="car-outline"
                  title="Parking required"
                  description="I need private or allocated parking."
                  value={form.parkingRequired}
                  onValueChange={(value) =>
                    updateField(
                      "parkingRequired",
                      value,
                    )
                  }
                />

                <SwitchQuestion
                  icon="flower-outline"
                  title="Garden required"
                  description="I need a private or shared garden."
                  value={form.gardenRequired}
                  onValueChange={(value) =>
                    updateField(
                      "gardenRequired",
                      value,
                    )
                  }
                />

                <SwitchQuestion
                  icon="wheelchair-accessibility"
                  title="Accessibility required"
                  description="I need accessibility features."
                  value={
                    form.accessibilityRequired
                  }
                  onValueChange={(value) =>
                    updateField(
                      "accessibilityRequired",
                      value,
                    )
                  }
                />

                <SwitchQuestion
                  icon="bus"
                  title="Public transport important"
                  description="The property should be close to public transport."
                  value={
                    form.publicTransportImportant
                  }
                  onValueChange={(value) =>
                    updateField(
                      "publicTransportImportant",
                      value,
                    )
                  }
                />

                <SwitchQuestion
                  icon="receipt-text-outline"
                  title="Bills included preferred"
                  description="I prefer a property with some or all bills included."
                  value={
                    form.billsIncludedPreferred
                  }
                  onValueChange={(value) =>
                    updateField(
                      "billsIncludedPreferred",
                      value,
                    )
                  }
                />
              </View>

              {form.accessibilityRequired ? (
                <View>
                  <TextInput
                    mode="outlined"
                    label="Accessibility requirements *"
                    placeholder="Example: step-free entrance, lift access or accessible bathroom"
                    value={
                      form.accessibilityDetails
                    }
                    multiline
                    numberOfLines={3}
                    error={Boolean(
                      errors.accessibilityDetails,
                    )}
                    onChangeText={(value) =>
                      updateField(
                        "accessibilityDetails",
                        value,
                      )
                    }
                  />

                  <HelperText
                    type="error"
                    visible={Boolean(
                      errors.accessibilityDetails,
                    )}
                  >
                    {errors.accessibilityDetails}
                  </HelperText>
                </View>
              ) : null}
            </QuestionSection>

            <QuestionSection
              number="6"
              icon="text-box-outline"
              title="Additional requirements"
              description="Add other property needs that are important to you."
            >
              <TextInput
                mode="outlined"
                label="Additional notes"
                placeholder="Example: quiet area, home office space or nearby school"
                value={
                  form.additionalRequirements
                }
                multiline
                numberOfLines={5}
                onChangeText={(value) =>
                  updateField(
                    "additionalRequirements",
                    value,
                  )
                }
              />
            </QuestionSection>

            <QuestionSection
              number="7"
              icon="shield-check-outline"
              title="Property matching consent"
              description="Confirm that your answers can be used to recommend suitable properties."
            >
              <Pressable
                style={[
                  styles.consentCard,
                  Boolean(
                    errors.consentToMatching,
                  ) &&
                    styles.consentCardError,
                ]}
                onPress={() =>
                  updateField(
                    "consentToMatching",
                    !form.consentToMatching,
                  )
                }
              >
                <Checkbox
                  status={
                    form.consentToMatching
                      ? "checked"
                      : "unchecked"
                  }
                  onPress={() =>
                    updateField(
                      "consentToMatching",
                      !form.consentToMatching,
                    )
                  }
                />

                <View style={styles.consentContent}>
                  <Text style={styles.consentTitle}>
                    I agree to property matching
                  </Text>

                  <Text
                    style={
                      styles.consentDescription
                    }
                  >
                    I agree that my property
                    requirements may be compared with
                    approved property information to
                    provide suitable recommendations.
                  </Text>
                </View>
              </Pressable>

              <HelperText
                type="error"
                visible={Boolean(
                  errors.consentToMatching,
                )}
              >
                {errors.consentToMatching}
              </HelperText>
            </QuestionSection>

            <View style={styles.formActions}>
              <Button
                mode="outlined"
                icon="arrow-left"
                onPress={() =>
                  router.push(
                    "/tenant/dashboard" as never,
                  )
                }
              >
                Back to dashboard
              </Button>

              <Button
                mode="contained"
                icon="home-search-outline"
                loading={loading}
                disabled={loading}
                contentStyle={styles.submitButton}
                onPress={handleSavePreferences}
              >
                Save and find properties
              </Button>
            </View>
          </View>

          <View
            style={[
              styles.summaryColumn,
              !isDesktop &&
                styles.summaryColumnStacked,
            ]}
          >
            <View style={styles.stickyArea}>
              <View style={styles.preferenceSummaryCard}>
                <View
                  style={
                    styles.preferenceSummaryHeader
                  }
                >
                  <View
                    style={
                      styles.preferenceSummaryIcon
                    }
                  >
                    <MaterialCommunityIcons
                      name="clipboard-list-outline"
                      size={25}
                      color={colors.primary}
                    />
                  </View>

                  <View>
                    <Text
                      style={
                        styles.preferenceSummaryTitle
                      }
                    >
                      Preference summary
                    </Text>

                    <Text
                      style={
                        styles.preferenceSummarySubtitle
                      }
                    >
                      Your current requirements
                    </Text>
                  </View>
                </View>

                <SummaryRow
                  icon="map-marker-outline"
                  label="Location"
                  value={
                    form.preferredLocation ||
                    "Not entered"
                  }
                />

                <SummaryRow
                  icon="currency-gbp"
                  label="Maximum rent"
                  value={
                    form.maximumMonthlyRent
                      ? `${formatCurrency(
                          Number(
                            form.maximumMonthlyRent,
                          ),
                        )} per month`
                      : "Not entered"
                  }
                />

                <SummaryRow
                  icon="home-outline"
                  label="Property"
                  value={form.propertyType}
                />

                <SummaryRow
                  icon="bed-outline"
                  label="Minimum rooms"
                  value={`${form.minimumBedrooms} bedroom(s), ${form.minimumBathrooms} bathroom(s)`}
                />

                <SummaryRow
                  icon="account-group-outline"
                  label="Household"
                  value={`${form.adults} adult(s), ${form.children} child(ren)`}
                />

                <SummaryRow
                  icon="paw-outline"
                  label="Pets"
                  value={
                    form.hasPets
                      ? `${form.numberOfPets} pet(s)`
                      : "No pets"
                  }
                />
              </View>

              <View style={styles.matchPreviewCard}>
                <View style={styles.matchPreviewTop}>
                  <View>
                    <Text
                      style={styles.matchPreviewLabel}
                    >
                      LIVE MATCH PREVIEW
                    </Text>

                    <Text
                      style={styles.matchPreviewTitle}
                    >
                      {previewMatches.length} sample
                      properties found
                    </Text>
                  </View>

                  <MaterialCommunityIcons
                    name="auto-fix"
                    size={29}
                    color={colors.primary}
                  />
                </View>

                {bestPreviewMatch ? (
                  <View style={styles.bestMatchBox}>
                    <View
                      style={styles.bestMatchHeader}
                    >
                      <View style={styles.matchCircle}>
                        <Text
                          style={styles.matchCircleText}
                        >
                          {
                            bestPreviewMatch.matchScore
                          }
                          %
                        </Text>
                      </View>

                      <View
                        style={styles.bestMatchContent}
                      >
                        <Text
                          style={
                            styles.bestMatchLabel
                          }
                        >
                          CURRENT BEST MATCH
                        </Text>

                        <Text
                          style={
                            styles.bestMatchTitle
                          }
                          numberOfLines={2}
                        >
                          {bestPreviewMatch.title}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={
                        styles.bestMatchAddress
                      }
                    >
                      {bestPreviewMatch.address},{" "}
                      {bestPreviewMatch.postcode}
                    </Text>

                    <Text
                      style={styles.bestMatchRent}
                    >
                      {formatCurrency(
                        bestPreviewMatch.monthlyRent,
                      )}{" "}
                      per month
                    </Text>
                  </View>
                ) : (
                  <Text
                    style={
                      styles.noPreviewDescription
                    }
                  >
                    Complete your location and budget
                    to preview suitable properties.
                  </Text>
                )}

                <Text
                  style={styles.previewDisclaimer}
                >
                  This is a sample frontend preview.
                  Final results will use approved
                  landlord property data from the
                  database.
                </Text>
              </View>

              <View style={styles.matchingExplanation}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={23}
                  color={colors.primary}
                />

                <View style={styles.explanationContent}>
                  <Text
                    style={styles.explanationTitle}
                  >
                    How matching works
                  </Text>

                  <Text
                    style={
                      styles.explanationDescription
                    }
                  >
                    Properties receive points for
                    matching your location, budget,
                    rooms, occupancy, pet needs,
                    furnishing and additional
                    features. The highest scores are
                    displayed first.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <Snackbar
        visible={Boolean(message)}
        onDismiss={() => setMessage("")}
        duration={2800}
      >
        {message}
      </Snackbar>
    </KeyboardAvoidingView>
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

function CounterQuestion({
  icon,
  title,
  value,
  minimum,
  maximum,
  errorMessage,
  onDecrease,
  onIncrease,
}: {
  icon: IconName;
  title: string;
  value: number;
  minimum: number;
  maximum: number;
  errorMessage?: string;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <View style={styles.counterCard}>
      <View style={styles.counterInformation}>
        <View style={styles.counterIcon}>
          <MaterialCommunityIcons
            name={icon}
            size={22}
            color={colors.primary}
          />
        </View>

        <View>
          <Text style={styles.counterTitle}>
            {title}
          </Text>

          <Text style={styles.counterHelper}>
            Minimum {minimum}, maximum {maximum}
          </Text>
        </View>
      </View>

      <View style={styles.counterControls}>
        <Pressable
          style={[
            styles.counterButton,
            value <= minimum &&
              styles.counterButtonDisabled,
          ]}
          disabled={value <= minimum}
          onPress={onDecrease}
        >
          <MaterialCommunityIcons
            name="minus"
            size={20}
            color={
              value <= minimum
                ? colors.textMuted
                : colors.primary
            }
          />
        </Pressable>

        <Text style={styles.counterValue}>
          {value}
        </Text>

        <Pressable
          style={[
            styles.counterButton,
            value >= maximum &&
              styles.counterButtonDisabled,
          ]}
          disabled={value >= maximum}
          onPress={onIncrease}
        >
          <MaterialCommunityIcons
            name="plus"
            size={20}
            color={
              value >= maximum
                ? colors.textMuted
                : colors.primary
            }
          />
        </Pressable>
      </View>

      {errorMessage ? (
        <Text style={styles.counterError}>
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}

function SwitchQuestion({
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
        styles.switchCard,
        value && styles.switchCardSelected,
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

function ChoiceButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.choiceButton,
        selected && styles.choiceButtonSelected,
      ]}
      onPress={onPress}
    >
      <MaterialCommunityIcons
        name={
          selected
            ? "checkbox-marked-circle"
            : "checkbox-blank-circle-outline"
        }
        size={18}
        color={
          selected
            ? colors.primary
            : colors.textMuted
        }
      />

      <Text
        style={[
          styles.choiceButtonText,
          selected &&
            styles.choiceButtonTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
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
              : active
                ? "circle-slice-8"
                : "circle-outline"
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
          active && styles.progressTitleActive,
        ]}
      >
        {number}. {title}
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

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.summaryRow}>
      <MaterialCommunityIcons
        name={icon}
        size={19}
        color={colors.primary}
      />

      <View style={styles.summaryRowContent}>
        <Text style={styles.summaryRowLabel}>
          {label}
        </Text>

        <Text style={styles.summaryRowValue}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function calculatePropertyMatches(
  preferences: PreferenceForm,
): PropertyMatch[] {
  const maximumRent = Number(
    preferences.maximumMonthlyRent,
  );

  const householdSize =
    preferences.adults + preferences.children;

  return sampleProperties
    .map((property) => {
      let score = 0;

      const matchedRequirements: string[] = [];
      const unmatchedRequirements: string[] = [];

      const locationQuery =
        preferences.preferredLocation
          .trim()
          .toLowerCase();

      const postcodeQuery =
        preferences.preferredPostcode
          .trim()
          .toLowerCase();

      const locationMatches =
        !locationQuery ||
        property.city
          .toLowerCase()
          .includes(locationQuery) ||
        property.address
          .toLowerCase()
          .includes(locationQuery) ||
        Boolean(
          postcodeQuery &&
            property.postcode
              .toLowerCase()
              .startsWith(postcodeQuery),
        );

      if (locationMatches) {
        score += 20;
        matchedRequirements.push(
          "Preferred location",
        );
      } else {
        unmatchedRequirements.push(
          "Preferred location",
        );
      }

      if (
        !maximumRent ||
        property.monthlyRent <= maximumRent
      ) {
        score += 20;
        matchedRequirements.push(
          "Within monthly budget",
        );
      } else {
        unmatchedRequirements.push(
          "Above monthly budget",
        );
      }

      if (
        property.bedrooms >=
        preferences.minimumBedrooms
      ) {
        score += 15;
        matchedRequirements.push(
          "Bedroom requirement",
        );
      } else {
        unmatchedRequirements.push(
          "Not enough bedrooms",
        );
      }

      if (
        property.bathrooms >=
        preferences.minimumBathrooms
      ) {
        score += 10;
        matchedRequirements.push(
          "Bathroom requirement",
        );
      } else {
        unmatchedRequirements.push(
          "Not enough bathrooms",
        );
      }

      if (
        preferences.propertyType ===
          "Any property type" ||
        property.propertyType ===
          preferences.propertyType
      ) {
        score += 10;
        matchedRequirements.push(
          "Property type",
        );
      } else {
        unmatchedRequirements.push(
          "Different property type",
        );
      }

      if (
        property.maximumOccupancy >=
        householdSize
      ) {
        score += 10;
        matchedRequirements.push(
          "Household occupancy",
        );
      } else {
        unmatchedRequirements.push(
          "Household exceeds occupancy",
        );
      }

      if (
        !preferences.hasPets ||
        property.petsAllowed
      ) {
        score += 5;
        matchedRequirements.push(
          "Pet requirement",
        );
      } else {
        unmatchedRequirements.push(
          "Pets not allowed",
        );
      }

      if (
        preferences.furnishing ===
          "Any furnishing" ||
        property.furnishing ===
          preferences.furnishing
      ) {
        score += 5;
        matchedRequirements.push(
          "Furnishing preference",
        );
      } else {
        unmatchedRequirements.push(
          "Different furnishing",
        );
      }

      let additionalFeatureScore = 0;
      let requestedFeatures = 0;

      const featureChecks = [
        {
          requested:
            preferences.parkingRequired,
          available: property.parking,
          label: "Parking",
        },
        {
          requested:
            preferences.gardenRequired,
          available: property.garden,
          label: "Garden",
        },
        {
          requested:
            preferences.accessibilityRequired,
          available: property.accessible,
          label: "Accessibility",
        },
        {
          requested:
            preferences.publicTransportImportant,
          available:
            property.nearPublicTransport,
          label: "Public transport",
        },
        {
          requested:
            preferences.billsIncludedPreferred,
          available: property.billsIncluded,
          label: "Bills included",
        },
      ];

      featureChecks.forEach((feature) => {
        if (!feature.requested) {
          return;
        }

        requestedFeatures += 1;

        if (feature.available) {
          matchedRequirements.push(feature.label);
        } else {
          unmatchedRequirements.push(feature.label);
        }
      });

      if (requestedFeatures === 0) {
        additionalFeatureScore = 5;
      } else {
        const matchedFeatureCount =
          featureChecks.filter(
            (feature) =>
              feature.requested &&
              feature.available,
          ).length;

        additionalFeatureScore =
          (matchedFeatureCount /
            requestedFeatures) *
          5;
      }

      score += additionalFeatureScore;

      return {
        ...property,
        matchScore: Math.round(score),
        matchedRequirements,
        unmatchedRequirements,
      };
    })
    .sort(
      (first, second) =>
        second.matchScore -
        first.matchScore,
    );
}

function numbersOnly(value: string) {
  return value.replace(/[^0-9]/g, "");
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value || 0);
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
    padding: spacing.lg,
    paddingBottom: 70,
    gap: spacing.xl,
  },

  topBar: {
    minHeight: 68,
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

  brandArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  logo: {
    width: 47,
    height: 47,
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
    width: 72,
    height: 72,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
  },

  heroContent: {
    flex: 1,
  },

  heroLabel: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  heroTitle: {
    marginTop: 6,
    color: colors.textPrimary,
    fontSize: 25,
    fontWeight: "900",
    lineHeight: 32,
  },

  heroDescription: {
    marginTop: spacing.sm,
    maxWidth: 850,
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 18,
  },

  progressSteps: {
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  progressStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  progressCircle: {
    width: 31,
    height: 31,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: colors.background,
  },

  progressCircleActive: {
    backgroundColor: colors.primary,
  },

  progressCircleComplete: {
    backgroundColor: colors.success,
  },

  progressTitle: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: "800",
  },

  progressTitleActive: {
    color: colors.primary,
  },

  progressLine: {
    flex: 1,
    minWidth: 18,
    height: 2,
    marginHorizontal: spacing.sm,
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

  formColumn: {
    flex: 1,
    minWidth: 0,
    width: "100%",
    gap: spacing.lg,
  },

  summaryColumn: {
    width: 350,
  },

  summaryColumnStacked: {
    width: "100%",
  },

  stickyArea: {
    gap: spacing.lg,
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
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },

  sectionNumber: {
    width: 34,
    height: 34,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: colors.primary,
  },

  sectionNumberText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "900",
  },

  sectionIcon: {
    width: 42,
    height: 42,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
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
    padding: spacing.lg,
    gap: spacing.lg,
  },

  fields: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },

  field: {
    flexGrow: 1,
    flexBasis: 290,
    minWidth: 240,
  },

  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },

  menuField: {
    flexGrow: 1,
    flexBasis: 250,
    minWidth: 220,
    gap: spacing.sm,
  },

  fieldLabel: {
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

  counterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },

  counterCard: {
    flexGrow: 1,
    flexBasis: 280,
    minWidth: 250,
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },

  counterInformation: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  counterIcon: {
    width: 43,
    height: 43,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
  },

  counterTitle: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },

  counterHelper: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 8,
  },

  counterControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },

  counterButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 13,
    backgroundColor: colors.white,
  },

  counterButtonDisabled: {
    borderColor: colors.border,
    backgroundColor: colors.background,
  },

  counterValue: {
    minWidth: 45,
    color: colors.textPrimary,
    fontSize: 23,
    fontWeight: "900",
    textAlign: "center",
  },

  counterError: {
    color: colors.error,
    fontSize: 9,
  },

  householdSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
  },

  summaryContent: {
    flex: 1,
  },

  summaryTitle: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },

  summaryDescription: {
    marginTop: 3,
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
  },

  privacyNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
  },

  privacyNoticeText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
  },

  conditionalBox: {
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },

  choiceGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  choiceButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    backgroundColor: colors.white,
  },

  choiceButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },

  choiceButtonText: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: "700",
  },

  choiceButtonTextSelected: {
    color: colors.primary,
  },

  switchGrid: {
    gap: spacing.md,
  },

  switchCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
  },

  switchCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },

  switchIcon: {
    width: 43,
    height: 43,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
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
    lineHeight: 13,
  },

  consentCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
  },

  consentCardError: {
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
    justifyContent: "flex-end",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  submitButton: {
    minHeight: 48,
  },

  preferenceSummaryCard: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  preferenceSummaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },

  preferenceSummaryIcon: {
    width: 49,
    height: 49,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: colors.primaryLight,
  },

  preferenceSummaryTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "900",
  },

  preferenceSummarySubtitle: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 8,
  },

  summaryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  summaryRowContent: {
    flex: 1,
  },

  summaryRowLabel: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  summaryRowValue: {
    marginTop: 3,
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 15,
  },

  matchPreviewCard: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
  },

  matchPreviewTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },

  matchPreviewLabel: {
    color: colors.white,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.1,
    opacity: 0.8,
  },

  matchPreviewTitle: {
    marginTop: 5,
    color: colors.white,
    fontSize: 14,
    fontWeight: "900",
  },

  bestMatchBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,0.12)",
  },

  bestMatchHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  matchCircle: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 29,
    backgroundColor: colors.white,
  },

  matchCircleText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "900",
  },

  bestMatchContent: {
    flex: 1,
  },

  bestMatchLabel: {
    color: colors.white,
    fontSize: 7,
    fontWeight: "900",
    opacity: 0.75,
  },

  bestMatchTitle: {
    marginTop: 4,
    color: colors.white,
    fontSize: 11,
    fontWeight: "900",
    lineHeight: 16,
  },

  bestMatchAddress: {
    marginTop: spacing.md,
    color: colors.white,
    fontSize: 9,
    lineHeight: 15,
    opacity: 0.85,
  },

  bestMatchRent: {
    marginTop: spacing.sm,
    color: colors.white,
    fontSize: 12,
    fontWeight: "900",
  },

  noPreviewDescription: {
    marginTop: spacing.lg,
    color: colors.white,
    fontSize: 10,
    lineHeight: 16,
  },

  previewDisclaimer: {
    marginTop: spacing.md,
    color: colors.white,
    fontSize: 8,
    lineHeight: 13,
    opacity: 0.7,
  },

  matchingExplanation: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.primaryLight,
  },

  explanationContent: {
    flex: 1,
  },

  explanationTitle: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },

  explanationDescription: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 15,
  },
});