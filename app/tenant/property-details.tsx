import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
    router,
    useLocalSearchParams,
} from "expo-router";
import { useMemo, useState } from "react";
import {
    Image,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import {
    Button,
    Divider,
    Snackbar
} from "react-native-paper";

import ScreenContainer from "../../src/components/ScreenContainer";
import {
    colors,
    radius,
    spacing,
} from "../../src/theme";

type IconName =
  keyof typeof MaterialCommunityIcons.glyphMap;

type PropertyType =
  | "House"
  | "Flat"
  | "Studio"
  | "Bungalow";

type FurnishingType =
  | "Furnished"
  | "Part-furnished"
  | "Unfurnished";

type Property = {
  id: string;

  title: string;
  address: string;
  city: string;
  postcode: string;

  monthlyRent: number;
  deposit: number;
  holdingDeposit: number;

  propertyType: PropertyType;
  furnishing: FurnishingType;

  bedrooms: number;
  bathrooms: number;
  kitchens: number;
  receptionRooms: number;

  availableDate: string;
  minimumTenancy: string;
  maximumOccupancy: number;

  petsAllowed: boolean;
  parking: boolean;
  garden: boolean;
  billsIncluded: boolean;
  accessible: boolean;
  nearPublicTransport: boolean;

  epcRating: string;
  councilTaxBand: string;

  matchScore: number;
  matchedRequirements: string[];
  unmatchedRequirements: string[];

  description: string;

  images: string[];

  features: {
    icon: IconName;
    label: string;
  }[];

  agent: {
    name: string;
    company: string;
    phone: string;
    email: string;
    verified: boolean;
  };

  landlordApproved: boolean;
  propertyApproved: boolean;
};

const properties: Property[] = [
  {
    id: "PROP-001",

    title: "Modern Two-Bedroom City Apartment",
    address: "42 King Street",
    city: "Leeds",
    postcode: "LS1 2HQ",

    monthlyRent: 1325,
    deposit: 1528,
    holdingDeposit: 305,

    propertyType: "Flat",
    furnishing: "Furnished",

    bedrooms: 2,
    bathrooms: 2,
    kitchens: 1,
    receptionRooms: 1,

    availableDate: "15 August 2026",
    minimumTenancy: "12 months",
    maximumOccupancy: 4,

    petsAllowed: true,
    parking: true,
    garden: false,
    billsIncluded: false,
    accessible: true,
    nearPublicTransport: true,

    epcRating: "B",
    councilTaxBand: "C",

    matchScore: 97,

    matchedRequirements: [
      "The property is within your monthly budget.",
      "The property is in your preferred location.",
      "The property meets your bedroom requirement.",
      "The property meets your bathroom requirement.",
      "Pets are accepted at this property.",
      "Allocated parking is available.",
      "The property is close to public transport.",
      "Accessibility features are available.",
    ],

    unmatchedRequirements: [
      "The property does not have a private garden.",
      "Monthly bills are not included in the rent.",
    ],

    description:
      "A bright and modern two-bedroom apartment situated in central Leeds. The property includes two spacious bedrooms, two modern bathrooms, an open-plan kitchen and living area, secure allocated parking and excellent access to public transport. The apartment is furnished and suitable for professionals, couples or a small family.",

    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80",
    ],

    features: [
      {
        icon: "bed-outline",
        label: "Two spacious bedrooms",
      },
      {
        icon: "shower",
        label: "Two modern bathrooms",
      },
      {
        icon: "car-outline",
        label: "Allocated parking",
      },
      {
        icon: "paw-outline",
        label: "Pets considered",
      },
      {
        icon: "wheelchair-accessibility",
        label: "Accessible entrance",
      },
      {
        icon: "bus",
        label: "Close to public transport",
      },
      {
        icon: "sofa-outline",
        label: "Fully furnished",
      },
      {
        icon: "shield-lock-outline",
        label: "Secure building access",
      },
    ],

    agent: {
      name: "Sarah Wilson",
      company: "TenureEx Leeds",
      phone: "0113 555 0198",
      email: "sarah.wilson@tenureex.co.uk",
      verified: true,
    },

    landlordApproved: true,
    propertyApproved: true,
  },

  {
    id: "PROP-002",

    title: "Three-Bedroom Family Home",
    address: "18 Victoria Road",
    city: "Manchester",
    postcode: "M14 6BT",

    monthlyRent: 1450,
    deposit: 1673,
    holdingDeposit: 334,

    propertyType: "House",
    furnishing: "Part-furnished",

    bedrooms: 3,
    bathrooms: 2,
    kitchens: 1,
    receptionRooms: 2,

    availableDate: "1 September 2026",
    minimumTenancy: "12 months",
    maximumOccupancy: 5,

    petsAllowed: true,
    parking: true,
    garden: true,
    billsIncluded: false,
    accessible: false,
    nearPublicTransport: true,

    epcRating: "C",
    councilTaxBand: "D",

    matchScore: 93,

    matchedRequirements: [
      "The property is within your monthly budget.",
      "The property is suitable for your household size.",
      "The property has more than your required bedrooms.",
      "The property meets your bathroom requirement.",
      "Pets are accepted.",
      "Private parking is available.",
      "A private garden is included.",
      "Public transport is available nearby.",
    ],

    unmatchedRequirements: [
      "The property has limited accessibility features.",
      "Monthly bills are not included.",
    ],

    description:
      "A spacious three-bedroom family home located in a popular residential area of Manchester. The property has two reception rooms, a modern kitchen, two bathrooms, a private rear garden and off-street parking.",

    images: [
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=80",
    ],

    features: [
      {
        icon: "bed-outline",
        label: "Three bedrooms",
      },
      {
        icon: "shower",
        label: "Two bathrooms",
      },
      {
        icon: "sofa-outline",
        label: "Two reception rooms",
      },
      {
        icon: "flower-outline",
        label: "Private rear garden",
      },
      {
        icon: "car-outline",
        label: "Off-street parking",
      },
      {
        icon: "paw-outline",
        label: "Pets considered",
      },
      {
        icon: "bus",
        label: "Nearby transport links",
      },
      {
        icon: "school-outline",
        label: "Close to local schools",
      },
    ],

    agent: {
      name: "James Cooper",
      company: "TenureEx Manchester",
      phone: "0161 555 0183",
      email: "james.cooper@tenureex.co.uk",
      verified: true,
    },

    landlordApproved: true,
    propertyApproved: true,
  },

  {
    id: "PROP-003",

    title: "City Centre One-Bedroom Flat",
    address: "91 High Street",
    city: "Birmingham",
    postcode: "B4 7SL",

    monthlyRent: 1100,
    deposit: 1269,
    holdingDeposit: 253,

    propertyType: "Flat",
    furnishing: "Furnished",

    bedrooms: 1,
    bathrooms: 1,
    kitchens: 1,
    receptionRooms: 1,

    availableDate: "5 August 2026",
    minimumTenancy: "6 months",
    maximumOccupancy: 2,

    petsAllowed: false,
    parking: false,
    garden: false,
    billsIncluded: true,
    accessible: true,
    nearPublicTransport: true,

    epcRating: "B",
    councilTaxBand: "B",

    matchScore: 86,

    matchedRequirements: [
      "The rent is below your maximum monthly budget.",
      "The property is fully furnished.",
      "Selected bills are included.",
      "The property has an accessible entrance.",
      "Public transport is available nearby.",
      "The property is available soon.",
    ],

    unmatchedRequirements: [
      "Pets are not accepted.",
      "No allocated parking is provided.",
      "The property does not have a private garden.",
    ],

    description:
      "A modern furnished one-bedroom flat in Birmingham city centre. The flat includes an open-plan kitchen and living room, a spacious bedroom, a modern bathroom and selected bills included in the monthly rent.",

    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1560448071-3d0cc904c1cd?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1560448205-4d9b3e6bb6db?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?auto=format&fit=crop&w=1400&q=80",
    ],

    features: [
      {
        icon: "bed-outline",
        label: "One bedroom",
      },
      {
        icon: "shower",
        label: "Modern bathroom",
      },
      {
        icon: "sofa-outline",
        label: "Fully furnished",
      },
      {
        icon: "receipt-text-outline",
        label: "Selected bills included",
      },
      {
        icon: "wheelchair-accessibility",
        label: "Accessible entrance",
      },
      {
        icon: "train",
        label: "Near railway station",
      },
      {
        icon: "shopping-outline",
        label: "Close to shops",
      },
      {
        icon: "shield-lock-outline",
        label: "Secure entrance",
      },
    ],

    agent: {
      name: "Emily Roberts",
      company: "TenureEx Birmingham",
      phone: "0121 555 0176",
      email: "emily.roberts@tenureex.co.uk",
      verified: true,
    },

    landlordApproved: true,
    propertyApproved: true,
  },

  {
    id: "PROP-004",

    title: "Accessible Two-Bedroom Bungalow",
    address: "7 Meadow Close",
    city: "Sheffield",
    postcode: "S11 8RT",

    monthlyRent: 1250,
    deposit: 1442,
    holdingDeposit: 288,

    propertyType: "Bungalow",
    furnishing: "Unfurnished",

    bedrooms: 2,
    bathrooms: 1,
    kitchens: 1,
    receptionRooms: 1,

    availableDate: "20 August 2026",
    minimumTenancy: "12 months",
    maximumOccupancy: 4,

    petsAllowed: true,
    parking: true,
    garden: true,
    billsIncluded: false,
    accessible: true,
    nearPublicTransport: false,

    epcRating: "C",
    councilTaxBand: "C",

    matchScore: 91,

    matchedRequirements: [
      "The property is within your monthly budget.",
      "The property meets your bedroom requirement.",
      "Pets are accepted.",
      "Private parking is available.",
      "A private garden is included.",
      "The property has step-free access.",
      "The bathroom includes accessibility features.",
    ],

    unmatchedRequirements: [
      "The property is outside your preferred location.",
      "Public transport options are limited.",
      "Bills are not included.",
    ],

    description:
      "A well-presented two-bedroom bungalow with step-free access, accessible bathroom facilities, a private garden and driveway parking. The property is suitable for tenants who require improved accessibility.",

    images: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1400&q=80",
    ],

    features: [
      {
        icon: "bed-outline",
        label: "Two bedrooms",
      },
      {
        icon: "wheelchair-accessibility",
        label: "Step-free access",
      },
      {
        icon: "shower",
        label: "Accessible bathroom",
      },
      {
        icon: "car-outline",
        label: "Driveway parking",
      },
      {
        icon: "flower-outline",
        label: "Private garden",
      },
      {
        icon: "paw-outline",
        label: "Pets considered",
      },
      {
        icon: "home-floor-0",
        label: "Single-level property",
      },
      {
        icon: "door-open",
        label: "Wide entrance doors",
      },
    ],

    agent: {
      name: "Daniel Walker",
      company: "TenureEx Sheffield",
      phone: "0114 555 0151",
      email: "daniel.walker@tenureex.co.uk",
      verified: true,
    },

    landlordApproved: true,
    propertyApproved: true,
  },

  {
    id: "PROP-005",

    title: "Luxury Riverside Apartment",
    address: "12 Riverside Walk",
    city: "Leeds",
    postcode: "LS10 1PL",

    monthlyRent: 1750,
    deposit: 2019,
    holdingDeposit: 403,

    propertyType: "Flat",
    furnishing: "Furnished",

    bedrooms: 2,
    bathrooms: 2,
    kitchens: 1,
    receptionRooms: 1,

    availableDate: "10 September 2026",
    minimumTenancy: "12 months",
    maximumOccupancy: 4,

    petsAllowed: false,
    parking: true,
    garden: false,
    billsIncluded: true,
    accessible: true,
    nearPublicTransport: true,

    epcRating: "A",
    councilTaxBand: "E",

    matchScore: 82,

    matchedRequirements: [
      "The property is in your preferred city.",
      "The property meets your bedroom requirement.",
      "The property meets your bathroom requirement.",
      "Allocated parking is provided.",
      "Selected bills are included.",
      "The property is close to public transport.",
      "The property has an excellent EPC rating.",
    ],

    unmatchedRequirements: [
      "The rent is above your preferred monthly budget.",
      "Pets are not accepted.",
      "The property does not have a private garden.",
    ],

    description:
      "A luxury riverside apartment with modern furnishings, concierge service, secure allocated parking and excellent energy efficiency. The apartment offers impressive river views and easy access to Leeds city centre.",

    images: [
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=80",
    ],

    features: [
      {
        icon: "bed-outline",
        label: "Two bedrooms",
      },
      {
        icon: "shower",
        label: "Two bathrooms",
      },
      {
        icon: "account-tie-outline",
        label: "Concierge service",
      },
      {
        icon: "car-outline",
        label: "Secure parking",
      },
      {
        icon: "receipt-text-outline",
        label: "Selected bills included",
      },
      {
        icon: "wheelchair-accessibility",
        label: "Lift access",
      },
      {
        icon: "water-outline",
        label: "Riverside location",
      },
      {
        icon: "lightning-bolt-outline",
        label: "EPC rating A",
      },
    ],

    agent: {
      name: "Sarah Wilson",
      company: "TenureEx Leeds",
      phone: "0113 555 0198",
      email: "sarah.wilson@tenureex.co.uk",
      verified: true,
    },

    landlordApproved: true,
    propertyApproved: true,
  },

  {
    id: "PROP-006",

    title: "Affordable Furnished Studio",
    address: "25 New Market Lane",
    city: "Leeds",
    postcode: "LS2 7HH",

    monthlyRent: 850,
    deposit: 980,
    holdingDeposit: 196,

    propertyType: "Studio",
    furnishing: "Furnished",

    bedrooms: 0,
    bathrooms: 1,
    kitchens: 1,
    receptionRooms: 0,

    availableDate: "30 July 2026",
    minimumTenancy: "6 months",
    maximumOccupancy: 1,

    petsAllowed: false,
    parking: false,
    garden: false,
    billsIncluded: true,
    accessible: false,
    nearPublicTransport: true,

    epcRating: "C",
    councilTaxBand: "A",

    matchScore: 74,

    matchedRequirements: [
      "The property is well below your monthly budget.",
      "The property is in your preferred city.",
      "The property is furnished.",
      "Selected bills are included.",
      "The property is close to public transport.",
      "The property is available immediately.",
    ],

    unmatchedRequirements: [
      "The property does not meet your bedroom preference.",
      "Pets are not accepted.",
      "Parking is not available.",
      "The property does not have a garden.",
    ],

    description:
      "A compact furnished studio suitable for one person. The property is located close to Leeds city centre and includes an open-plan sleeping, living and kitchen area with a separate bathroom.",

    images: [
      "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1560185008-b033106af5c3?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1560448071-3d0cc904c1cd?auto=format&fit=crop&w=1400&q=80",
    ],

    features: [
      {
        icon: "home-outline",
        label: "Open-plan studio",
      },
      {
        icon: "shower",
        label: "Private bathroom",
      },
      {
        icon: "sofa-outline",
        label: "Fully furnished",
      },
      {
        icon: "receipt-text-outline",
        label: "Selected bills included",
      },
      {
        icon: "bus",
        label: "Near public transport",
      },
      {
        icon: "shopping-outline",
        label: "Close to local shops",
      },
      {
        icon: "shield-lock-outline",
        label: "Secure entry",
      },
      {
        icon: "calendar-check-outline",
        label: "Available immediately",
      },
    ],

    agent: {
      name: "Sarah Wilson",
      company: "TenureEx Leeds",
      phone: "0113 555 0198",
      email: "sarah.wilson@tenureex.co.uk",
      verified: true,
    },

    landlordApproved: true,
    propertyApproved: true,
  },
];

export default function TenantPropertyDetailsScreen() {
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1050;
  const isTablet = width >= 700;
  const isSmallPhone = width < 390;

  const params = useLocalSearchParams<{
    propertyId?: string | string[];
  }>();

  const propertyId = Array.isArray(
    params.propertyId,
  )
    ? params.propertyId[0]
    : params.propertyId;

  const property = useMemo(() => {
    if (propertyId) {
      return properties.find(
        (item) => item.id === propertyId,
      );
    }

    return properties[0];
  }, [propertyId]);

  const [selectedImageIndex, setSelectedImageIndex] =
    useState(0);

  const [saved, setSaved] = useState(false);

  const [message, setMessage] = useState("");

  const handleShare = async () => {
    if (!property) {
      return;
    }

    try {
      await Share.share({
        title: property.title,
        message:
          `${property.title}\n` +
          `${property.address}, ${property.city}, ${property.postcode}\n` +
          `${formatCurrency(property.monthlyRent)} per month\n` +
          `${property.bedrooms} bedroom(s), ${property.bathrooms} bathroom(s)\n` +
          `${property.matchScore}% match`,
      });
    } catch {
      setMessage(
        "Unable to share this property.",
      );
    }
  };

  const handleSave = () => {
    setSaved((current) => !current);

    setMessage(
      saved
        ? "Property removed from saved properties."
        : "Property saved successfully.",
    );
  };

  const handleApply = () => {
    if (!property) {
      return;
    }

    router.push({
      pathname: "/tenant/applications" as never,
      params: {
        propertyId: property.id,
        action: "new",
      },
    });
  };

  if (!property) {
    return (
      <ScreenContainer
        scrollable
        contentStyle={styles.screenContent}
      >
        <View style={styles.notFoundPage}>
          <View style={styles.notFoundIcon}>
            <MaterialCommunityIcons
              name="home-alert-outline"
              size={52}
              color={colors.primary}
            />
          </View>

          <Text style={styles.notFoundTitle}>
            Property not found
          </Text>

          <Text
            style={styles.notFoundDescription}
          >
            The selected property is unavailable or
            may have been removed.
          </Text>

          <Button
            mode="contained"
            icon="arrow-left"
            onPress={() =>
              router.replace(
                "/tenant/properties" as never,
              )
            }
          >
            Return to properties
          </Button>
        </View>
      </ScreenContainer>
    );
  }

  const selectedImage =
    property.images[selectedImageIndex];

  return (
    <ScreenContainer
      scrollable
      contentStyle={styles.screenContent}
    >
      <View style={styles.page}>
        <View style={styles.topBar}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={22}
              color={colors.primary}
            />

            <Text style={styles.backButtonText}>
              Back to properties
            </Text>
          </Pressable>

          <View style={styles.headerActions}>
            <Button
              mode="outlined"
              icon={
                saved
                  ? "heart"
                  : "heart-outline"
              }
              textColor={
                saved
                  ? colors.error
                  : colors.primary
              }
              onPress={handleSave}
            >
              {saved ? "Saved" : "Save"}
            </Button>

            <Button
              mode="outlined"
              icon="share-variant-outline"
              onPress={handleShare}
            >
              Share
            </Button>

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
        </View>

        <View style={styles.approvalBanner}>
          <View style={styles.approvalIcon}>
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={25}
              color={colors.success}
            />
          </View>

          <View style={styles.approvalContent}>
            <Text style={styles.approvalTitle}>
              Approved and verified property
            </Text>

            <Text
              style={styles.approvalDescription}
            >
              The landlord and property have been
              reviewed and approved by the estate
              agent.
            </Text>
          </View>

          <View style={styles.approvalBadges}>
            {property.landlordApproved ? (
              <StatusBadge
                icon="account-check-outline"
                label="Landlord approved"
              />
            ) : null}

            {property.propertyApproved ? (
              <StatusBadge
                icon="home-outline"
                label="Property approved"
              />
            ) : null}
          </View>
        </View>

        <View
          style={[
            styles.gallery,
            !isTablet && styles.galleryStacked,
          ]}
        >
          <View style={styles.mainImageContainer}>
            <Image
              source={{
                uri: selectedImage,
              }}
              style={styles.mainImage}
              resizeMode="cover"
            />

            <View style={styles.mainImageOverlay}>
              <View style={styles.matchBadge}>
                <MaterialCommunityIcons
                  name="star-circle-outline"
                  size={18}
                  color={colors.white}
                />

                <Text style={styles.matchBadgeText}>
                  {property.matchScore}% match
                </Text>
              </View>

              <View style={styles.imageCounter}>
                <MaterialCommunityIcons
                  name="image-multiple-outline"
                  size={16}
                  color={colors.white}
                />

                <Text style={styles.imageCounterText}>
                  {selectedImageIndex + 1} of{" "}
                  {property.images.length}
                </Text>
              </View>
            </View>
          </View>

          <ScrollView
            horizontal={!isTablet}
            showsHorizontalScrollIndicator={false}
            style={[
              styles.thumbnailScroll,
              isTablet &&
                styles.thumbnailScrollDesktop,
            ]}
            contentContainerStyle={[
              styles.thumbnailContainer,
              isTablet &&
                styles.thumbnailContainerDesktop,
            ]}
          >
            {property.images.map(
              (image, index) => (
                <Pressable
                  key={`${image}-${index}`}
                  style={[
                    styles.thumbnailButton,
                    isTablet &&
                      styles.thumbnailButtonDesktop,
                    selectedImageIndex === index &&
                      styles.thumbnailButtonSelected,
                  ]}
                  onPress={() =>
                    setSelectedImageIndex(index)
                  }
                >
                  <Image
                    source={{
                      uri: image,
                    }}
                    style={styles.thumbnailImage}
                    resizeMode="cover"
                  />

                  {selectedImageIndex === index ? (
                    <View
                      style={
                        styles.thumbnailSelectedOverlay
                      }
                    >
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={25}
                        color={colors.white}
                      />
                    </View>
                  ) : null}
                </Pressable>
              ),
            )}
          </ScrollView>
        </View>

        <View
          style={[
            styles.contentLayout,
            !isDesktop &&
              styles.contentLayoutStacked,
          ]}
        >
          <View style={styles.mainColumn}>
            <View style={styles.propertyHeaderCard}>
              <View style={styles.propertyHeadingRow}>
                <View style={styles.propertyHeading}>
                  <Text
                    style={styles.propertyCategory}
                  >
                    {property.propertyType} •{" "}
                    {property.furnishing}
                  </Text>

                  <Text
                    style={[
                      styles.propertyTitle,
                      isSmallPhone &&
                        styles.propertyTitleSmall,
                    ]}
                  >
                    {property.title}
                  </Text>

                  <View
                    style={styles.propertyLocation}
                  >
                    <MaterialCommunityIcons
                      name="map-marker-outline"
                      size={19}
                      color={colors.textMuted}
                    />

                    <Text
                      style={
                        styles.propertyLocationText
                      }
                    >
                      {property.address},{" "}
                      {property.city},{" "}
                      {property.postcode}
                    </Text>
                  </View>
                </View>

                <View style={styles.matchCircle}>
                  <Text
                    style={styles.matchCircleValue}
                  >
                    {property.matchScore}%
                  </Text>

                  <Text
                    style={styles.matchCircleLabel}
                  >
                    match
                  </Text>
                </View>
              </View>

              <View style={styles.mainFeatures}>
                <MainFeature
                  icon="bed-outline"
                  value={String(
                    property.bedrooms,
                  )}
                  label="Bedrooms"
                />

                <MainFeature
                  icon="shower"
                  value={String(
                    property.bathrooms,
                  )}
                  label="Bathrooms"
                />

                <MainFeature
                  icon="sofa-outline"
                  value={String(
                    property.receptionRooms,
                  )}
                  label="Reception"
                />

                <MainFeature
                  icon="silverware-fork-knife"
                  value={String(
                    property.kitchens,
                  )}
                  label="Kitchen"
                />
              </View>
            </View>

            <SectionCard
              icon="text-box-outline"
              title="Property description"
              description="Full information about this property"
            >
              <Text style={styles.descriptionText}>
                {property.description}
              </Text>
            </SectionCard>

            <SectionCard
              icon="star-outline"
              title="Property features"
              description="Features and facilities included with the property"
            >
              <View style={styles.featuresGrid}>
                {property.features.map(
                  (feature) => (
                    <FeatureItem
                      key={feature.label}
                      icon={feature.icon}
                      label={feature.label}
                    />
                  ),
                )}
              </View>
            </SectionCard>

            <SectionCard
              icon="clipboard-check-outline"
              title="Property information"
              description="Important tenancy and property information"
            >
              <View
                style={styles.informationGrid}
              >
                <InformationItem
                  icon="home-outline"
                  label="Property type"
                  value={property.propertyType}
                />

                <InformationItem
                  icon="sofa-outline"
                  label="Furnishing"
                  value={property.furnishing}
                />

                <InformationItem
                  icon="calendar-outline"
                  label="Available date"
                  value={property.availableDate}
                />

                <InformationItem
                  icon="calendar-range"
                  label="Minimum tenancy"
                  value={property.minimumTenancy}
                />

                <InformationItem
                  icon="account-group-outline"
                  label="Maximum occupancy"
                  value={`${property.maximumOccupancy} people`}
                />

                <InformationItem
                  icon="lightning-bolt-outline"
                  label="EPC rating"
                  value={property.epcRating}
                />

                <InformationItem
                  icon="office-building-outline"
                  label="Council tax"
                  value={`Band ${property.councilTaxBand}`}
                />

                <InformationItem
                  icon="paw-outline"
                  label="Pets"
                  value={
                    property.petsAllowed
                      ? "Pets considered"
                      : "Pets not accepted"
                  }
                />
              </View>
            </SectionCard>

            <SectionCard
              icon="auto-fix"
              title="Property match analysis"
              description="See how this property compares with your preferences"
            >
              <View style={styles.matchScoreSummary}>
                <View
                  style={
                    styles.matchScoreSummaryCircle
                  }
                >
                  <Text
                    style={
                      styles.matchScoreSummaryValue
                    }
                  >
                    {property.matchScore}%
                  </Text>
                </View>

                <View
                  style={
                    styles.matchScoreSummaryContent
                  }
                >
                  <Text
                    style={
                      styles.matchScoreSummaryTitle
                    }
                  >
                    Strong property match
                  </Text>

                  <Text
                    style={
                      styles.matchScoreSummaryDescription
                    }
                  >
                    This score is based on your
                    location, budget, rooms,
                    household, pets and selected
                    property features.
                  </Text>
                </View>
              </View>

              <View style={styles.matchColumns}>
                <View style={styles.matchColumn}>
                  <Text
                    style={styles.matchedHeading}
                  >
                    Matched requirements
                  </Text>

                  {property.matchedRequirements.map(
                    (requirement) => (
                      <MatchReason
                        key={requirement}
                        text={requirement}
                        matched
                      />
                    ),
                  )}
                </View>

                <View style={styles.matchColumn}>
                  <Text
                    style={styles.unmatchedHeading}
                  >
                    Not matched
                  </Text>

                  {property.unmatchedRequirements
                    .length > 0 ? (
                    property.unmatchedRequirements.map(
                      (requirement) => (
                        <MatchReason
                          key={requirement}
                          text={requirement}
                          matched={false}
                        />
                      ),
                    )
                  ) : (
                    <Text
                      style={
                        styles.noUnmatchedText
                      }
                    >
                      All requested requirements were
                      matched.
                    </Text>
                  )}
                </View>
              </View>
            </SectionCard>

            <SectionCard
              icon="map-marker-radius-outline"
              title="Location and nearby facilities"
              description="General information about the surrounding area"
            >
              <View style={styles.locationPlaceholder}>
                <View
                  style={
                    styles.locationPlaceholderIcon
                  }
                >
                  <MaterialCommunityIcons
                    name="map-outline"
                    size={50}
                    color={colors.primary}
                  />
                </View>

                <Text
                  style={
                    styles.locationPlaceholderTitle
                  }
                >
                  {property.city},{" "}
                  {property.postcode}
                </Text>

                <Text
                  style={
                    styles.locationPlaceholderDescription
                  }
                >
                  The interactive map will be connected
                  later using the property latitude and
                  longitude from the backend.
                </Text>

                <View style={styles.nearbyFeatures}>
                  <NearbyItem
                    icon="bus"
                    label={
                      property.nearPublicTransport
                        ? "Public transport nearby"
                        : "Limited public transport"
                    }
                    available={
                      property.nearPublicTransport
                    }
                  />

                  <NearbyItem
                    icon="shopping-outline"
                    label="Local shops nearby"
                    available
                  />

                  <NearbyItem
                    icon="hospital-building"
                    label="Healthcare facilities"
                    available
                  />

                  <NearbyItem
                    icon="school-outline"
                    label="Schools in the area"
                    available
                  />
                </View>
              </View>
            </SectionCard>
          </View>

          <View style={styles.sideColumn}>
            <View style={styles.stickyArea}>
              <View style={styles.priceCard}>
                <Text style={styles.priceLabel}>
                  MONTHLY RENT
                </Text>

                <Text style={styles.priceValue}>
                  {formatCurrency(
                    property.monthlyRent,
                  )}
                </Text>

                <Text style={styles.priceFrequency}>
                  per calendar month
                </Text>

                <Divider
                  style={styles.priceDivider}
                />

                <PriceRow
                  label="Security deposit"
                  value={formatCurrency(
                    property.deposit,
                  )}
                />

                <PriceRow
                  label="Holding deposit"
                  value={formatCurrency(
                    property.holdingDeposit,
                  )}
                />

                <PriceRow
                  label="Council tax"
                  value={`Band ${property.councilTaxBand}`}
                />

                <PriceRow
                  label="Bills included"
                  value={
                    property.billsIncluded
                      ? "Selected bills"
                      : "Not included"
                  }
                />

                <View style={styles.availableCard}>
                  <MaterialCommunityIcons
                    name="calendar-check-outline"
                    size={23}
                    color={colors.success}
                  />

                  <View
                    style={
                      styles.availableCardContent
                    }
                  >
                    <Text
                      style={styles.availableCardLabel}
                    >
                      Available from
                    </Text>

                    <Text
                      style={styles.availableCardValue}
                    >
                      {property.availableDate}
                    </Text>
                  </View>
                </View>

                <Button
                  mode="contained"
                  icon="file-document-edit-outline"
                  contentStyle={
                    styles.applyButtonContent
                  }
                  style={styles.applyButton}
                  onPress={handleApply}
                >
                  Apply for this property
                </Button>

                <Button
                  mode="outlined"
                  icon={
                    saved
                      ? "heart"
                      : "heart-outline"
                  }
                  onPress={handleSave}
                >
                  {saved
                    ? "Remove from saved"
                    : "Save property"}
                </Button>

                <Text style={styles.applicationNote}>
                  Your profile, documents and Right to
                  Rent status may be checked before the
                  application is submitted.
                </Text>
              </View>

              <View style={styles.agentCard}>
                <View style={styles.agentHeader}>
                  <View style={styles.agentAvatar}>
                    <MaterialCommunityIcons
                      name="account-tie-outline"
                      size={29}
                      color={colors.primary}
                    />
                  </View>

                  <View style={styles.agentHeaderContent}>
                    <Text
                      style={styles.agentCardLabel}
                    >
                      MANAGED BY
                    </Text>

                    <Text
                      style={styles.agentName}
                    >
                      {property.agent.name}
                    </Text>

                    <Text
                      style={styles.agentCompany}
                    >
                      {property.agent.company}
                    </Text>
                  </View>

                  {property.agent.verified ? (
                    <MaterialCommunityIcons
                      name="check-decagram"
                      size={22}
                      color={colors.success}
                    />
                  ) : null}
                </View>

                <Divider
                  style={styles.agentDivider}
                />

                <AgentContactRow
                  icon="phone-outline"
                  label="Telephone"
                  value={property.agent.phone}
                />

                <AgentContactRow
                  icon="email-outline"
                  label="Email"
                  value={property.agent.email}
                />

                <View style={styles.agentActions}>
                  <Button
                    mode="outlined"
                    icon="phone-outline"
                    onPress={() =>
                      setMessage(
                        `Call ${property.agent.phone}`,
                      )
                    }
                  >
                    Call
                  </Button>

                  <Button
                    mode="outlined"
                    icon="message-text-outline"
                    onPress={() =>
                      router.push({
                        pathname:
                          "/tenant/messages" as never,
                        params: {
                          agentName:
                            property.agent.name,
                          propertyId: property.id,
                        },
                      })
                    }
                  >
                    Message
                  </Button>
                </View>
              </View>

              <View style={styles.safetyCard}>
                <MaterialCommunityIcons
                  name="shield-check-outline"
                  size={26}
                  color={colors.success}
                />

                <View style={styles.safetyContent}>
                  <Text style={styles.safetyTitle}>
                    TenureEx safety notice
                  </Text>

                  <Text
                    style={styles.safetyDescription}
                  >
                    Do not transfer money outside the
                    TenureEx approved payment process.
                    Confirm all payments and agreements
                    through the platform.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bottomActions}>
          <Button
            mode="outlined"
            icon="arrow-left"
            onPress={() =>
              router.push(
                "/tenant/properties" as never,
              )
            }
          >
            Back to properties
          </Button>

          <View
            style={styles.bottomActionButtons}
          >
            <Button
              mode="outlined"
              icon="share-variant-outline"
              onPress={handleShare}
            >
              Share
            </Button>

            <Button
              mode="contained"
              icon="file-document-edit-outline"
              onPress={handleApply}
            >
              Apply for property
            </Button>
          </View>
        </View>
      </View>

      <Snackbar
        visible={Boolean(message)}
        onDismiss={() => setMessage("")}
        duration={2800}
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

function SectionCard({
  icon,
  title,
  description,
  children,
}: {
  icon: IconName;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
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

function MainFeature({
  icon,
  value,
  label,
}: {
  icon: IconName;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.mainFeature}>
      <View style={styles.mainFeatureIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={24}
          color={colors.primary}
        />
      </View>

      <View>
        <Text style={styles.mainFeatureValue}>
          {value}
        </Text>

        <Text style={styles.mainFeatureLabel}>
          {label}
        </Text>
      </View>
    </View>
  );
}

function FeatureItem({
  icon,
  label,
}: {
  icon: IconName;
  label: string;
}) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureItemIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={21}
          color={colors.primary}
        />
      </View>

      <Text style={styles.featureItemText}>
        {label}
      </Text>
    </View>
  );
}

function InformationItem({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.informationItem}>
      <View style={styles.informationIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={21}
          color={colors.primary}
        />
      </View>

      <View style={styles.informationContent}>
        <Text style={styles.informationLabel}>
          {label}
        </Text>

        <Text style={styles.informationValue}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function MatchReason({
  text,
  matched,
}: {
  text: string;
  matched: boolean;
}) {
  return (
    <View style={styles.matchReason}>
      <MaterialCommunityIcons
        name={
          matched
            ? "check-circle-outline"
            : "close-circle-outline"
        }
        size={18}
        color={
          matched
            ? colors.success
            : colors.error
        }
      />

      <Text
        style={[
          styles.matchReasonText,
          !matched &&
            styles.matchReasonTextUnmatched,
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

function PriceRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.priceRow}>
      <Text style={styles.priceRowLabel}>
        {label}
      </Text>

      <Text style={styles.priceRowValue}>
        {value}
      </Text>
    </View>
  );
}

function AgentContactRow({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.agentContactRow}>
      <View style={styles.agentContactIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={19}
          color={colors.primary}
        />
      </View>

      <View style={styles.agentContactContent}>
        <Text style={styles.agentContactLabel}>
          {label}
        </Text>

        <Text style={styles.agentContactValue}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function StatusBadge({
  icon,
  label,
}: {
  icon: IconName;
  label: string;
}) {
  return (
    <View style={styles.statusBadge}>
      <MaterialCommunityIcons
        name={icon}
        size={15}
        color={colors.success}
      />

      <Text style={styles.statusBadgeText}>
        {label}
      </Text>
    </View>
  );
}

function NearbyItem({
  icon,
  label,
  available,
}: {
  icon: IconName;
  label: string;
  available: boolean;
}) {
  return (
    <View style={styles.nearbyItem}>
      <View style={styles.nearbyItemIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={
            available
              ? colors.primary
              : colors.textMuted
          }
        />
      </View>

      <Text style={styles.nearbyItemText}>
        {label}
      </Text>

      <MaterialCommunityIcons
        name={
          available
            ? "check-circle-outline"
            : "information-outline"
        }
        size={18}
        color={
          available
            ? colors.success
            : colors.warning
        }
      />
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
    flexGrow: 1,
  },

  page: {
    width: "100%",
    maxWidth: 1500,
    alignSelf: "center",
    gap: spacing.xl,
    paddingBottom: 80,
  },

  topBar: {
    minHeight: 68,
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

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },

  backButtonText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "900",
  },

  headerActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.sm,
  },

  approvalBanner: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: radius.xl,
    backgroundColor: colors.successLight,
  },

  approvalIcon: {
    width: 45,
    height: 45,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.white,
  },

  approvalContent: {
    flex: 1,
    minWidth: 220,
  },

  approvalTitle: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "900",
  },

  approvalDescription: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 8,
    lineHeight: 14,
  },

  approvalBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: colors.white,
  },

  statusBadgeText: {
    color: colors.success,
    fontSize: 8,
    fontWeight: "900",
  },

  gallery: {
    flexDirection: "row",
    gap: spacing.md,
    height: 520,
  },

  galleryStacked: {
    height: "auto",
    flexDirection: "column",
  },

  mainImageContainer: {
    position: "relative",
    flex: 1,
    overflow: "hidden",
    minHeight: 330,
    borderRadius: radius.xl,
    backgroundColor: colors.background,
  },

  mainImage: {
    width: "100%",
    height: "100%",
  },

  mainImageOverlay: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  matchBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.primary,
  },

  matchBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "900",
  },

  imageCounter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.55)",
  },

  imageCounterText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: "800",
  },

  thumbnailScroll: {
    flexGrow: 0,
  },

  thumbnailScrollDesktop: {
    width: 210,
  },

  thumbnailContainer: {
    gap: spacing.sm,
  },

  thumbnailContainerDesktop: {
    flexDirection: "column",
  },

  thumbnailButton: {
    position: "relative",
    width: 145,
    height: 105,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
    borderRadius: radius.lg,
  },

  thumbnailButtonDesktop: {
    width: 210,
    flex: 1,
    minHeight: 110,
  },

  thumbnailButtonSelected: {
    borderColor: colors.primary,
  },

  thumbnailImage: {
    width: "100%",
    height: "100%",
  },

  thumbnailSelectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
  },

  contentLayout: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xl,
  },

  contentLayoutStacked: {
    flexDirection: "column",
  },

  mainColumn: {
    flex: 1,
    width: "100%",
    minWidth: 0,
    gap: spacing.lg,
  },

  sideColumn: {
    width: 360,
  },

  stickyArea: {
    gap: spacing.lg,
  },

  propertyHeaderCard: {
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  propertyHeadingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.lg,
  },

  propertyHeading: {
    flex: 1,
  },

  propertyCategory: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  propertyTitle: {
    marginTop: spacing.sm,
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 36,
  },

  propertyTitleSmall: {
    fontSize: 23,
    lineHeight: 30,
  },

  propertyLocation: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },

  propertyLocationText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 16,
  },

  matchCircle: {
    width: 78,
    height: 78,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 39,
    backgroundColor: colors.primary,
  },

  matchCircleValue: {
    color: colors.white,
    fontSize: 19,
    fontWeight: "900",
  },

  matchCircleLabel: {
    color: colors.white,
    fontSize: 8,
    fontWeight: "700",
  },

  mainFeatures: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.xl,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  mainFeature: {
    flexGrow: 1,
    flexBasis: 145,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },

  mainFeatureIcon: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
  },

  mainFeatureValue: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "900",
  },

  mainFeatureLabel: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 8,
  },

  sectionCard: {
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

  sectionIcon: {
    width: 45,
    height: 45,
    flexShrink: 0,
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
    fontSize: 13,
    fontWeight: "900",
  },

  sectionDescription: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 8,
  },

  sectionBody: {
    padding: spacing.lg,
  },

  descriptionText: {
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 19,
  },

  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },

  featureItem: {
    flexGrow: 1,
    flexBasis: 230,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },

  featureItemIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
  },

  featureItemText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "800",
    lineHeight: 14,
  },

  informationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },

  informationItem: {
    flexGrow: 1,
    flexBasis: 230,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
  },

  informationIcon: {
    width: 43,
    height: 43,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
  },

  informationContent: {
    flex: 1,
  },

  informationLabel: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  informationValue: {
    marginTop: 4,
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },

  matchScoreSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
  },

  matchScoreSummaryCircle: {
    width: 78,
    height: 78,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 39,
    backgroundColor: colors.primary,
  },

  matchScoreSummaryValue: {
    color: colors.white,
    fontSize: 19,
    fontWeight: "900",
  },

  matchScoreSummaryContent: {
    flex: 1,
  },

  matchScoreSummaryTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "900",
  },

  matchScoreSummaryDescription: {
    marginTop: 5,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
  },

  matchColumns: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg,
    marginTop: spacing.lg,
  },

  matchColumn: {
    flexGrow: 1,
    flexBasis: 280,
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
  },

  matchedHeading: {
    marginBottom: spacing.sm,
    color: colors.success,
    fontSize: 10,
    fontWeight: "900",
  },

  unmatchedHeading: {
    marginBottom: spacing.sm,
    color: colors.error,
    fontSize: 10,
    fontWeight: "900",
  },

  matchReason: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },

  matchReasonText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 15,
  },

  matchReasonTextUnmatched: {
    color: colors.textMuted,
  },

  noUnmatchedText: {
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 15,
  },

  locationPlaceholder: {
    alignItems: "center",
    padding: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },

  locationPlaceholderIcon: {
    width: 90,
    height: 90,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30,
    backgroundColor: colors.primaryLight,
  },

  locationPlaceholderTitle: {
    marginTop: spacing.md,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "900",
  },

  locationPlaceholderDescription: {
    maxWidth: 550,
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 15,
    textAlign: "center",
  },

  nearbyFeatures: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.xl,
  },

  nearbyItem: {
    flexGrow: 1,
    flexBasis: 220,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
  },

  nearbyItemIcon: {
    width: 39,
    height: 39,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
  },

  nearbyItemText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "800",
  },

  priceCard: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  priceLabel: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  priceValue: {
    marginTop: 5,
    color: colors.primary,
    fontSize: 31,
    fontWeight: "900",
  },

  priceFrequency: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 9,
  },

  priceDivider: {
    marginVertical: spacing.lg,
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.md,
  },

  priceRowLabel: {
    color: colors.textMuted,
    fontSize: 9,
  },

  priceRowValue: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "900",
    textAlign: "right",
  },

  availableCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.successLight,
  },

  availableCardContent: {
    flex: 1,
  },

  availableCardLabel: {
    color: colors.textMuted,
    fontSize: 8,
  },

  availableCardValue: {
    marginTop: 3,
    color: colors.success,
    fontSize: 10,
    fontWeight: "900",
  },

  applyButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },

  applyButtonContent: {
    minHeight: 51,
  },

  applicationNote: {
    marginTop: spacing.md,
    color: colors.textMuted,
    fontSize: 8,
    lineHeight: 14,
    textAlign: "center",
  },

  agentCard: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  agentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  agentAvatar: {
    width: 55,
    height: 55,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
  },

  agentHeaderContent: {
    flex: 1,
  },

  agentCardLabel: {
    color: colors.textMuted,
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 1,
  },

  agentName: {
    marginTop: 3,
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "900",
  },

  agentCompany: {
    marginTop: 2,
    color: colors.primary,
    fontSize: 9,
    fontWeight: "700",
  },

  agentDivider: {
    marginVertical: spacing.lg,
  },

  agentContactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },

  agentContactIcon: {
    width: 39,
    height: 39,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
  },

  agentContactContent: {
    flex: 1,
  },

  agentContactLabel: {
    color: colors.textMuted,
    fontSize: 8,
  },

  agentContactValue: {
    marginTop: 3,
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "800",
  },

  agentActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },

  safetyCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: radius.xl,
    backgroundColor: colors.successLight,
  },

  safetyContent: {
    flex: 1,
  },

  safetyTitle: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },

  safetyDescription: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 8,
    lineHeight: 14,
  },

  bottomActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  bottomActionButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  notFoundPage: {
    flex: 1,
    minHeight: 600,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },

  notFoundIcon: {
    width: 95,
    height: 95,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
  },

  notFoundTitle: {
    color: colors.textPrimary,
    fontSize: 21,
    fontWeight: "900",
  },

  notFoundDescription: {
    maxWidth: 420,
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 17,
    textAlign: "center",
  },
});