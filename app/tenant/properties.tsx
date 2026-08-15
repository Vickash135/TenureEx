import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
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
    Checkbox,
    Chip,
    Divider,
    Menu,
    Modal,
    Portal,
    Searchbar,
    Snackbar,
    Switch
} from "react-native-paper";

import ScreenContainer from "../../src/components/ScreenContainer";
import {
    colors,
    radius,
    spacing,
} from "../../src/theme";

type IconName =
    keyof typeof MaterialCommunityIcons.glyphMap;

type ViewMode = "grid" | "list";

type SortOption =
    | "Best match"
    | "Lowest rent"
    | "Highest rent"
    | "Most bedrooms"
    | "Available soonest";

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

    propertyType: PropertyType;
    furnishing: FurnishingType;

    bedrooms: number;
    bathrooms: number;
    kitchens: number;
    receptionRooms: number;

    availableDate: string;
    availableTimestamp: number;

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
    image: string;
    agentName: string;
    verified: boolean;
};

type FilterState = {
    minimumRent: number;
    maximumRent: number;

    propertyTypes: PropertyType[];

    minimumBedrooms: number;
    minimumBathrooms: number;

    furnishingTypes: FurnishingType[];

    petsAllowedOnly: boolean;
    parkingRequired: boolean;
    gardenRequired: boolean;
    billsIncludedOnly: boolean;
    accessibleOnly: boolean;
};

const initialFilters: FilterState = {
    minimumRent: 0,
    maximumRent: 3000,

    propertyTypes: [],

    minimumBedrooms: 0,
    minimumBathrooms: 0,

    furnishingTypes: [],

    petsAllowedOnly: false,
    parkingRequired: false,
    gardenRequired: false,
    billsIncludedOnly: false,
    accessibleOnly: false,
};

const propertyTypeOptions: PropertyType[] = [
    "House",
    "Flat",
    "Studio",
    "Bungalow",
];

const furnishingOptions: FurnishingType[] = [
    "Furnished",
    "Part-furnished",
    "Unfurnished",
];

const sortOptions: SortOption[] = [
    "Best match",
    "Lowest rent",
    "Highest rent",
    "Most bedrooms",
    "Available soonest",
];

const properties: Property[] = [
    {
        id: "PROP-001",
        title: "Modern Two-Bedroom City Apartment",
        address: "42 King Street",
        city: "Leeds",
        postcode: "LS1 2HQ",

        monthlyRent: 1325,
        deposit: 1528,

        propertyType: "Flat",
        furnishing: "Furnished",

        bedrooms: 2,
        bathrooms: 2,
        kitchens: 1,
        receptionRooms: 1,

        availableDate: "15 August 2026",
        availableTimestamp: new Date(
            "2026-08-15",
        ).getTime(),

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
            "Within your monthly budget",
            "Preferred location",
            "Correct number of bedrooms",
            "Correct number of bathrooms",
            "Pets are accepted",
            "Parking is available",
            "Close to public transport",
            "Accessibility features available",
        ],

        unmatchedRequirements: [
            "No private garden",
            "Bills are not included",
        ],

        description:
            "A bright and modern city apartment with two spacious bedrooms, two bathrooms, secure parking and excellent access to public transport.",

        image:
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",

        agentName: "TenureEx Leeds",
        verified: true,
    },

    {
        id: "PROP-002",
        title: "Three-Bedroom Family Home",
        address: "18 Victoria Road",
        city: "Manchester",
        postcode: "M14 6BT",

        monthlyRent: 1450,
        deposit: 1673,

        propertyType: "House",
        furnishing: "Part-furnished",

        bedrooms: 3,
        bathrooms: 2,
        kitchens: 1,
        receptionRooms: 2,

        availableDate: "1 September 2026",
        availableTimestamp: new Date(
            "2026-09-01",
        ).getTime(),

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
            "Within your monthly budget",
            "Suitable household occupancy",
            "More than the required bedrooms",
            "Correct number of bathrooms",
            "Pets are accepted",
            "Private parking",
            "Private garden",
            "Close to public transport",
        ],

        unmatchedRequirements: [
            "Limited accessibility features",
            "Bills are not included",
        ],

        description:
            "A spacious family property with three bedrooms, two reception rooms, private garden and off-street parking.",

        image:
            "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80",

        agentName: "TenureEx Manchester",
        verified: true,
    },

    {
        id: "PROP-003",
        title: "City Centre One-Bedroom Flat",
        address: "91 High Street",
        city: "Birmingham",
        postcode: "B4 7SL",

        monthlyRent: 1100,
        deposit: 1269,

        propertyType: "Flat",
        furnishing: "Furnished",

        bedrooms: 1,
        bathrooms: 1,
        kitchens: 1,
        receptionRooms: 1,

        availableDate: "5 August 2026",
        availableTimestamp: new Date(
            "2026-08-05",
        ).getTime(),

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
            "Below your maximum monthly rent",
            "Furnished",
            "Bills are included",
            "Accessible entrance",
            "Close to public transport",
            "Available soon",
        ],

        unmatchedRequirements: [
            "Pets are not accepted",
            "No allocated parking",
            "No private garden",
        ],

        description:
            "A furnished city-centre flat with an open-plan living area, excellent transport connections and selected bills included.",

        image:
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",

        agentName: "TenureEx Birmingham",
        verified: true,
    },

    {
        id: "PROP-004",
        title: "Accessible Two-Bedroom Bungalow",
        address: "7 Meadow Close",
        city: "Sheffield",
        postcode: "S11 8RT",

        monthlyRent: 1250,
        deposit: 1442,

        propertyType: "Bungalow",
        furnishing: "Unfurnished",

        bedrooms: 2,
        bathrooms: 1,
        kitchens: 1,
        receptionRooms: 1,

        availableDate: "20 August 2026",
        availableTimestamp: new Date(
            "2026-08-20",
        ).getTime(),

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
            "Within your monthly budget",
            "Correct number of bedrooms",
            "Pets are accepted",
            "Private parking",
            "Private garden",
            "Step-free access",
            "Accessible bathroom",
        ],

        unmatchedRequirements: [
            "Not close to the preferred area",
            "Limited public transport nearby",
            "Bills are not included",
        ],

        description:
            "A well-presented accessible bungalow with step-free access, a private garden, parking and a modern accessible bathroom.",

        image:
            "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80",

        agentName: "TenureEx Sheffield",
        verified: true,
    },

    {
        id: "PROP-005",
        title: "Luxury Riverside Apartment",
        address: "12 Riverside Walk",
        city: "Leeds",
        postcode: "LS10 1PL",

        monthlyRent: 1750,
        deposit: 2019,

        propertyType: "Flat",
        furnishing: "Furnished",

        bedrooms: 2,
        bathrooms: 2,
        kitchens: 1,
        receptionRooms: 1,

        availableDate: "10 September 2026",
        availableTimestamp: new Date(
            "2026-09-10",
        ).getTime(),

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
            "Preferred city",
            "Correct number of bedrooms",
            "Correct number of bathrooms",
            "Allocated parking",
            "Bills are included",
            "Close to public transport",
            "Excellent EPC rating",
        ],

        unmatchedRequirements: [
            "Above your preferred monthly budget",
            "Pets are not accepted",
            "No private garden",
        ],

        description:
            "A premium riverside apartment with concierge service, secure allocated parking, modern furnishings and excellent energy efficiency.",

        image:
            "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80",

        agentName: "TenureEx Leeds",
        verified: true,
    },

    {
        id: "PROP-006",
        title: "Affordable Furnished Studio",
        address: "25 New Market Lane",
        city: "Leeds",
        postcode: "LS2 7HH",

        monthlyRent: 850,
        deposit: 980,

        propertyType: "Studio",
        furnishing: "Furnished",

        bedrooms: 0,
        bathrooms: 1,
        kitchens: 1,
        receptionRooms: 0,

        availableDate: "30 July 2026",
        availableTimestamp: new Date(
            "2026-07-30",
        ).getTime(),

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
            "Well below your monthly budget",
            "Preferred city",
            "Furnished",
            "Bills are included",
            "Close to public transport",
            "Available immediately",
        ],

        unmatchedRequirements: [
            "Does not meet bedroom preference",
            "Pets are not accepted",
            "No parking",
            "No garden",
        ],

        description:
            "A compact furnished studio suitable for one person, located close to the city centre and major transport links.",

        image:
            "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=1200&q=80",

        agentName: "TenureEx Leeds",
        verified: true,
    },
];

export default function TenantPropertiesScreen() {
    const { width } = useWindowDimensions();

    const isDesktop = width >= 1100;
    const isTablet = width >= 720;
    const isSmallPhone = width < 390;

    const [searchQuery, setSearchQuery] =
        useState("");

    const [viewMode, setViewMode] =
        useState<ViewMode>("grid");

    const [sortOption, setSortOption] =
        useState<SortOption>("Best match");

    const [sortMenuVisible, setSortMenuVisible] =
        useState(false);

    const [filters, setFilters] =
        useState<FilterState>(initialFilters);

    const [filterModalVisible, setFilterModalVisible] =
        useState(false);

    const [savedPropertyIds, setSavedPropertyIds] =
        useState<string[]>([]);

    const [comparisonIds, setComparisonIds] =
        useState<string[]>([]);

    const [
        comparisonModalVisible,
        setComparisonModalVisible,
    ] = useState(false);

    const [selectedProperty, setSelectedProperty] =
        useState<Property | null>(null);

    const [
        detailsModalVisible,
        setDetailsModalVisible,
    ] = useState(false);

    const [snackbarMessage, setSnackbarMessage] =
        useState("");

    const filteredProperties = useMemo(() => {
        const normalisedSearch =
            searchQuery.trim().toLowerCase();

        const result = properties.filter(
            (property) => {
                const matchesSearch =
                    !normalisedSearch ||
                    property.title
                        .toLowerCase()
                        .includes(normalisedSearch) ||
                    property.address
                        .toLowerCase()
                        .includes(normalisedSearch) ||
                    property.city
                        .toLowerCase()
                        .includes(normalisedSearch) ||
                    property.postcode
                        .toLowerCase()
                        .includes(normalisedSearch);

                const matchesRent =
                    property.monthlyRent >=
                    filters.minimumRent &&
                    property.monthlyRent <=
                    filters.maximumRent;

                const matchesPropertyType =
                    filters.propertyTypes.length === 0 ||
                    filters.propertyTypes.includes(
                        property.propertyType,
                    );

                const matchesBedrooms =
                    property.bedrooms >=
                    filters.minimumBedrooms;

                const matchesBathrooms =
                    property.bathrooms >=
                    filters.minimumBathrooms;

                const matchesFurnishing =
                    filters.furnishingTypes.length === 0 ||
                    filters.furnishingTypes.includes(
                        property.furnishing,
                    );

                const matchesPets =
                    !filters.petsAllowedOnly ||
                    property.petsAllowed;

                const matchesParking =
                    !filters.parkingRequired ||
                    property.parking;

                const matchesGarden =
                    !filters.gardenRequired ||
                    property.garden;

                const matchesBills =
                    !filters.billsIncludedOnly ||
                    property.billsIncluded;

                const matchesAccessibility =
                    !filters.accessibleOnly ||
                    property.accessible;

                return (
                    matchesSearch &&
                    matchesRent &&
                    matchesPropertyType &&
                    matchesBedrooms &&
                    matchesBathrooms &&
                    matchesFurnishing &&
                    matchesPets &&
                    matchesParking &&
                    matchesGarden &&
                    matchesBills &&
                    matchesAccessibility
                );
            },
        );

        return [...result].sort((first, second) => {
            switch (sortOption) {
                case "Lowest rent":
                    return (
                        first.monthlyRent -
                        second.monthlyRent
                    );

                case "Highest rent":
                    return (
                        second.monthlyRent -
                        first.monthlyRent
                    );

                case "Most bedrooms":
                    return (
                        second.bedrooms -
                        first.bedrooms
                    );

                case "Available soonest":
                    return (
                        first.availableTimestamp -
                        second.availableTimestamp
                    );

                case "Best match":
                default:
                    return (
                        second.matchScore -
                        first.matchScore
                    );
            }
        });
    }, [filters, searchQuery, sortOption]);

    const activeFilterCount = useMemo(() => {
        let count = 0;

        if (filters.minimumRent > 0) {
            count += 1;
        }

        if (filters.maximumRent < 3000) {
            count += 1;
        }

        if (filters.propertyTypes.length > 0) {
            count += 1;
        }

        if (filters.minimumBedrooms > 0) {
            count += 1;
        }

        if (filters.minimumBathrooms > 0) {
            count += 1;
        }

        if (filters.furnishingTypes.length > 0) {
            count += 1;
        }

        if (filters.petsAllowedOnly) {
            count += 1;
        }

        if (filters.parkingRequired) {
            count += 1;
        }

        if (filters.gardenRequired) {
            count += 1;
        }

        if (filters.billsIncludedOnly) {
            count += 1;
        }

        if (filters.accessibleOnly) {
            count += 1;
        }

        return count;
    }, [filters]);

    const recommendedProperty =
        filteredProperties[0];

    const toggleSavedProperty = (
        propertyId: string,
    ) => {
        setSavedPropertyIds((current) => {
            const isSaved =
                current.includes(propertyId);

            setSnackbarMessage(
                isSaved
                    ? "Property removed from saved properties."
                    : "Property saved successfully.",
            );

            if (isSaved) {
                return current.filter(
                    (id) => id !== propertyId,
                );
            }

            return [...current, propertyId];
        });
    };

    const toggleComparisonProperty = (
        propertyId: string,
    ) => {
        setComparisonIds((current) => {
            if (current.includes(propertyId)) {
                return current.filter(
                    (id) => id !== propertyId,
                );
            }

            if (current.length >= 3) {
                setSnackbarMessage(
                    "You can compare a maximum of three properties.",
                );

                return current;
            }

            return [...current, propertyId];
        });
    };

    const openPropertyDetails = (
        property: Property,
    ) => {
        setSelectedProperty(property);
        setDetailsModalVisible(true);
    };

    const handleFullDetails = (
        propertyId: string,
    ) => {
        setDetailsModalVisible(false);

        router.push({
            pathname: "/tenant/property-details" as never,
            params: {
                propertyId,
            },
        });
    };

    const handleApply = (
        propertyId: string,
    ) => {
        setDetailsModalVisible(false);

        router.push({
            pathname: "/tenant/applications" as never,
            params: {
                propertyId,
                action: "new",
            },
        });
    };

    const handleShareProperty = async (
        property: Property,
    ) => {
        try {
            await Share.share({
                title: property.title,
                message:
                    `${property.title}\n` +
                    `${property.address}, ${property.city}, ${property.postcode}\n` +
                    `${formatCurrency(property.monthlyRent)} per month\n` +
                    `${property.bedrooms} bedroom(s), ${property.bathrooms} bathroom(s)\n` +
                    `${property.matchScore}% property match`,
            });
        } catch {
            setSnackbarMessage(
                "Unable to share this property.",
            );
        }
    };

    const updateFilter = <
        K extends keyof FilterState,
    >(
        key: K,
        value: FilterState[K],
    ) => {
        setFilters((current) => ({
            ...current,
            [key]: value,
        }));
    };

    const togglePropertyType = (
        type: PropertyType,
    ) => {
        setFilters((current) => {
            const selected =
                current.propertyTypes.includes(type);

            return {
                ...current,
                propertyTypes: selected
                    ? current.propertyTypes.filter(
                        (item) => item !== type,
                    )
                    : [...current.propertyTypes, type],
            };
        });
    };

    const toggleFurnishingType = (
        type: FurnishingType,
    ) => {
        setFilters((current) => {
            const selected =
                current.furnishingTypes.includes(type);

            return {
                ...current,
                furnishingTypes: selected
                    ? current.furnishingTypes.filter(
                        (item) => item !== type,
                    )
                    : [...current.furnishingTypes, type],
            };
        });
    };

    const resetFilters = () => {
        setFilters(initialFilters);
    };

    const comparisonProperties =
        properties.filter((property) =>
            comparisonIds.includes(property.id),
        );

    return (
        <ScreenContainer
            scrollable
            contentStyle={styles.screenContent}
        >
            <View style={styles.page}>
                <View style={styles.topBar}>
                    <Pressable
                        style={styles.brandContainer}
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
                                Tenant property matching
                            </Text>
                        </View>
                    </Pressable>

                    <View style={styles.headerActions}>
                        <Button
                            mode="text"
                            icon="heart-outline"
                            onPress={() =>
                                setSnackbarMessage(
                                    `${savedPropertyIds.length} saved properties.`,
                                )
                            }
                        >
                            Saved ({savedPropertyIds.length})
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

                <View style={styles.hero}>
                    <View style={styles.heroInformation}>
                        <Text style={styles.heroLabel}>
                            PERSONALISED PROPERTY MATCHING
                        </Text>

                        <Text
                            style={[
                                styles.heroTitle,
                                isSmallPhone &&
                                styles.heroTitleSmall,
                            ]}
                        >
                            Properties selected for you
                        </Text>

                        <Text style={styles.heroDescription}>
                            These properties have been compared
                            with your location, budget, household
                            and property preferences. The strongest
                            matches appear first.
                        </Text>

                        <View style={styles.heroStatistics}>
                            <Statistic
                                icon="home-search-outline"
                                value={String(
                                    filteredProperties.length,
                                )}
                                label="Matches found"
                            />

                            <Statistic
                                icon="star-circle-outline"
                                value={
                                    recommendedProperty
                                        ? `${recommendedProperty.matchScore}%`
                                        : "0%"
                                }
                                label="Best match"
                            />

                            <Statistic
                                icon="heart-outline"
                                value={String(
                                    savedPropertyIds.length,
                                )}
                                label="Saved properties"
                            />
                        </View>
                    </View>

                    <View style={styles.heroIcon}>
                        <MaterialCommunityIcons
                            name="home-search-outline"
                            size={50}
                            color={colors.primary}
                        />
                    </View>
                </View>

                {recommendedProperty ? (
                    <View style={styles.recommendedSection}>
                        <View style={styles.recommendedHeader}>
                            <View
                                style={styles.recommendedHeaderIcon}
                            >
                                <MaterialCommunityIcons
                                    name="auto-fix"
                                    size={25}
                                    color={colors.primary}
                                />
                            </View>

                            <View style={styles.recommendedHeaderText}>
                                <Text
                                    style={styles.recommendedLabel}
                                >
                                    RECOMMENDED FOR YOU
                                </Text>

                                <Text
                                    style={styles.recommendedTitle}
                                >
                                    Your strongest property match
                                </Text>
                            </View>

                            <View style={styles.matchBadgeLarge}>
                                <Text
                                    style={styles.matchBadgeLargeValue}
                                >
                                    {recommendedProperty.matchScore}%
                                </Text>

                                <Text
                                    style={styles.matchBadgeLargeLabel}
                                >
                                    match
                                </Text>
                            </View>
                        </View>

                        <View
                            style={[
                                styles.recommendedBody,
                                !isTablet &&
                                styles.recommendedBodyStacked,
                            ]}
                        >
                            <Image
                                source={{
                                    uri: recommendedProperty.image,
                                }}
                                style={[
                                    styles.recommendedImage,
                                    !isTablet &&
                                    styles.recommendedImageMobile,
                                ]}
                                resizeMode="cover"
                            />

                            <View
                                style={styles.recommendedInformation}
                            >
                                <Text
                                    style={styles.recommendedPropertyType}
                                >
                                    {recommendedProperty.propertyType} •{" "}
                                    {recommendedProperty.furnishing}
                                </Text>

                                <Text
                                    style={styles.recommendedPropertyTitle}
                                >
                                    {recommendedProperty.title}
                                </Text>

                                <View
                                    style={styles.locationInformation}
                                >
                                    <MaterialCommunityIcons
                                        name="map-marker-outline"
                                        size={18}
                                        color={colors.textMuted}
                                    />

                                    <Text
                                        style={styles.locationText}
                                    >
                                        {recommendedProperty.address},{" "}
                                        {recommendedProperty.city},{" "}
                                        {recommendedProperty.postcode}
                                    </Text>
                                </View>

                                <View
                                    style={styles.recommendedFeatures}
                                >
                                    <PropertyFeature
                                        icon="bed-outline"
                                        text={`${recommendedProperty.bedrooms} bedroom(s)`}
                                    />

                                    <PropertyFeature
                                        icon="shower"
                                        text={`${recommendedProperty.bathrooms} bathroom(s)`}
                                    />

                                    <PropertyFeature
                                        icon="car-outline"
                                        text={
                                            recommendedProperty.parking
                                                ? "Parking"
                                                : "No parking"
                                        }
                                    />

                                    <PropertyFeature
                                        icon="paw-outline"
                                        text={
                                            recommendedProperty.petsAllowed
                                                ? "Pets allowed"
                                                : "No pets"
                                        }
                                    />
                                </View>

                                <View
                                    style={
                                        styles.recommendedMatchReasons
                                    }
                                >
                                    {recommendedProperty.matchedRequirements
                                        .slice(0, 4)
                                        .map((reason) => (
                                            <MatchReason
                                                key={reason}
                                                text={reason}
                                                matched
                                            />
                                        ))}
                                </View>

                                <View
                                    style={styles.recommendedBottomRow}
                                >
                                    <View>
                                        <Text
                                            style={
                                                styles.recommendedRentLabel
                                            }
                                        >
                                            MONTHLY RENT
                                        </Text>

                                        <Text
                                            style={styles.recommendedRent}
                                        >
                                            {formatCurrency(
                                                recommendedProperty.monthlyRent,
                                            )}
                                        </Text>
                                    </View>

                                    <View
                                        style={
                                            styles.recommendedButtons
                                        }
                                    >
                                        <Button
                                            mode="outlined"
                                            icon="eye-outline"
                                            onPress={() =>
                                                openPropertyDetails(
                                                    recommendedProperty,
                                                )
                                            }
                                        >
                                            View details
                                        </Button>

                                        <Button
                                            mode="contained"
                                            icon="file-document-edit-outline"
                                            onPress={() =>
                                                handleApply(
                                                    recommendedProperty.id,
                                                )
                                            }
                                        >
                                            Apply
                                        </Button>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                ) : null}

                <View style={styles.searchSection}>
                    <Searchbar
                        placeholder="Search by city, postcode, address or property name"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={styles.searchbar}
                        inputStyle={styles.searchInput}
                    />

                    <View style={styles.searchActions}>
                        <Button
                            mode="outlined"
                            icon="filter-variant"
                            onPress={() =>
                                setFilterModalVisible(true)
                            }
                        >
                            Filters
                            {activeFilterCount > 0
                                ? ` (${activeFilterCount})`
                                : ""}
                        </Button>

                        <Menu
                            visible={sortMenuVisible}
                            onDismiss={() =>
                                setSortMenuVisible(false)
                            }
                            anchor={
                                <Button
                                    mode="outlined"
                                    icon="sort"
                                    onPress={() =>
                                        setSortMenuVisible(true)
                                    }
                                >
                                    {sortOption}
                                </Button>
                            }
                        >
                            {sortOptions.map((option) => (
                                <Menu.Item
                                    key={option}
                                    title={option}
                                    leadingIcon={
                                        option === sortOption
                                            ? "check"
                                            : undefined
                                    }
                                    onPress={() => {
                                        setSortOption(option);
                                        setSortMenuVisible(false);
                                    }}
                                />
                            ))}
                        </Menu>

                        <View style={styles.viewButtons}>
                            <Pressable
                                style={[
                                    styles.viewButton,
                                    viewMode === "grid" &&
                                    styles.viewButtonSelected,
                                ]}
                                onPress={() =>
                                    setViewMode("grid")
                                }
                            >
                                <MaterialCommunityIcons
                                    name="view-grid-outline"
                                    size={22}
                                    color={
                                        viewMode === "grid"
                                            ? colors.white
                                            : colors.primary
                                    }
                                />
                            </Pressable>

                            <Pressable
                                style={[
                                    styles.viewButton,
                                    viewMode === "list" &&
                                    styles.viewButtonSelected,
                                ]}
                                onPress={() =>
                                    setViewMode("list")
                                }
                            >
                                <MaterialCommunityIcons
                                    name="format-list-bulleted"
                                    size={22}
                                    color={
                                        viewMode === "list"
                                            ? colors.white
                                            : colors.primary
                                    }
                                />
                            </Pressable>
                        </View>
                    </View>
                </View>

                <View style={styles.resultsHeader}>
                    <View>
                        <Text style={styles.resultsTitle}>
                            Matched properties
                        </Text>

                        <Text style={styles.resultsDescription}>
                            Showing {filteredProperties.length} of{" "}
                            {properties.length} approved properties
                        </Text>
                    </View>

                    {activeFilterCount > 0 ? (
                        <Button
                            mode="text"
                            icon="filter-remove-outline"
                            onPress={resetFilters}
                        >
                            Clear filters
                        </Button>
                    ) : null}
                </View>

                {filteredProperties.length > 0 ? (
                    <View
                        style={[
                            styles.propertyContainer,

                            viewMode === "grid"
                                ? styles.propertyGrid
                                : styles.propertyList,
                        ]}
                    >
                        {filteredProperties.map(
                            (property) => (
                                <PropertyCard
                                    key={property.id}
                                    property={property}
                                    viewMode={viewMode}
                                    desktop={isDesktop}
                                    saved={savedPropertyIds.includes(
                                        property.id,
                                    )}
                                    selectedForComparison={comparisonIds.includes(
                                        property.id,
                                    )}
                                    onSave={() =>
                                        toggleSavedProperty(property.id)
                                    }
                                    onCompare={() =>
                                        toggleComparisonProperty(
                                            property.id,
                                        )
                                    }
                                    onShare={() =>
                                        handleShareProperty(property)
                                    }
                                    onViewDetails={() =>
                                        openPropertyDetails(property)
                                    }
                                    onApply={() =>
                                        handleApply(property.id)
                                    }
                                />
                            ),
                        )}
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyStateIcon}>
                            <MaterialCommunityIcons
                                name="home-search-outline"
                                size={46}
                                color={colors.primary}
                            />
                        </View>

                        <Text style={styles.emptyStateTitle}>
                            No matching properties found
                        </Text>

                        <Text
                            style={styles.emptyStateDescription}
                        >
                            Try changing your search or removing
                            some filters to see more properties.
                        </Text>

                        <Button
                            mode="contained"
                            icon="filter-remove-outline"
                            onPress={() => {
                                setSearchQuery("");
                                resetFilters();
                            }}
                        >
                            Reset search and filters
                        </Button>
                    </View>
                )}

                {comparisonIds.length > 0 ? (
                    <View style={styles.comparisonBar}>
                        <View style={styles.comparisonInformation}>
                            <View
                                style={styles.comparisonBarIcon}
                            >
                                <MaterialCommunityIcons
                                    name="compare-horizontal"
                                    size={25}
                                    color={colors.white}
                                />
                            </View>

                            <View>
                                <Text
                                    style={styles.comparisonBarTitle}
                                >
                                    Compare properties
                                </Text>

                                <Text
                                    style={
                                        styles.comparisonBarDescription
                                    }
                                >
                                    {comparisonIds.length} of 3
                                    properties selected
                                </Text>
                            </View>
                        </View>

                        <View style={styles.comparisonBarActions}>
                            <Button
                                mode="text"
                                textColor={colors.white}
                                onPress={() =>
                                    setComparisonIds([])
                                }
                            >
                                Clear
                            </Button>

                            <Button
                                mode="contained"
                                buttonColor={colors.white}
                                textColor={colors.primary}
                                disabled={
                                    comparisonIds.length < 2
                                }
                                onPress={() =>
                                    setComparisonModalVisible(true)
                                }
                            >
                                Compare selected
                            </Button>
                        </View>
                    </View>
                ) : null}
            </View>

            <FilterModal
                visible={filterModalVisible}
                filters={filters}
                onDismiss={() =>
                    setFilterModalVisible(false)
                }
                onReset={resetFilters}
                onApply={() =>
                    setFilterModalVisible(false)
                }
                onUpdateFilter={updateFilter}
                onTogglePropertyType={
                    togglePropertyType
                }
                onToggleFurnishingType={
                    toggleFurnishingType
                }
            />

            <PropertyDetailsModal
                visible={detailsModalVisible}
                property={selectedProperty}
                saved={
                    selectedProperty
                        ? savedPropertyIds.includes(
                            selectedProperty.id,
                        )
                        : false
                }
                onDismiss={() =>
                    setDetailsModalVisible(false)
                }
                onSave={() => {
                    if (selectedProperty) {
                        toggleSavedProperty(
                            selectedProperty.id,
                        );
                    }
                }}
                onShare={() => {
                    if (selectedProperty) {
                        handleShareProperty(
                            selectedProperty,
                        );
                    }
                }}
                onFullDetails={() => {
                    if (selectedProperty) {
                        handleFullDetails(
                            selectedProperty.id,
                        );
                    }
                }}
                onApply={() => {
                    if (selectedProperty) {
                        handleApply(selectedProperty.id);
                    }
                }}
            />

            <ComparisonModal
                visible={comparisonModalVisible}
                properties={comparisonProperties}
                onDismiss={() =>
                    setComparisonModalVisible(false)
                }
                onApply={handleApply}
            />

            <Snackbar
                visible={Boolean(snackbarMessage)}
                onDismiss={() =>
                    setSnackbarMessage("")
                }
                duration={2500}
                action={{
                    label: "Close",
                    onPress: () =>
                        setSnackbarMessage(""),
                }}
            >
                {snackbarMessage}
            </Snackbar>
        </ScreenContainer>
    );
}

function PropertyCard({
    property,
    viewMode,
    desktop,
    saved,
    selectedForComparison,
    onSave,
    onCompare,
    onShare,
    onViewDetails,
    onApply,
}: {
    property: Property;
    viewMode: ViewMode;
    desktop: boolean;
    saved: boolean;
    selectedForComparison: boolean;
    onSave: () => void;
    onCompare: () => void;
    onShare: () => void;
    onViewDetails: () => void;
    onApply: () => void;
}) {
    const displayAsList =
        viewMode === "list" && desktop;

    return (
        <View
            style={[
                styles.propertyCard,
                displayAsList &&
                styles.propertyCardList,
            ]}
        >
            <View
                style={[
                    styles.propertyImageContainer,
                    displayAsList &&
                    styles.propertyImageContainerList,
                ]}
            >
                <Image
                    source={{
                        uri: property.image,
                    }}
                    style={styles.propertyImage}
                    resizeMode="cover"
                />

                <View style={styles.propertyImageTop}>
                    <View style={styles.matchBadge}>
                        <MaterialCommunityIcons
                            name="star-circle-outline"
                            size={16}
                            color={colors.white}
                        />

                        <Text
                            style={styles.matchBadgeText}
                        >
                            {property.matchScore}% match
                        </Text>
                    </View>

                    <Pressable
                        style={styles.imageActionButton}
                        onPress={onSave}
                    >
                        <MaterialCommunityIcons
                            name={
                                saved
                                    ? "heart"
                                    : "heart-outline"
                            }
                            size={22}
                            color={
                                saved
                                    ? colors.error
                                    : colors.white
                            }
                        />
                    </Pressable>
                </View>

                <View style={styles.propertyImageBottom}>
                    {property.verified ? (
                        <View style={styles.verifiedBadge}>
                            <MaterialCommunityIcons
                                name="shield-check-outline"
                                size={14}
                                color={colors.success}
                            />

                            <Text
                                style={styles.verifiedBadgeText}
                            >
                                Approved property
                            </Text>
                        </View>
                    ) : null}
                </View>
            </View>

            <View style={styles.propertyCardContent}>
                <View style={styles.propertyCardHeader}>
                    <View style={styles.propertyCardTitleArea}>
                        <Text
                            style={styles.propertyCategory}
                        >
                            {property.propertyType} •{" "}
                            {property.furnishing}
                        </Text>

                        <Text
                            style={styles.propertyTitle}
                            numberOfLines={2}
                        >
                            {property.title}
                        </Text>
                    </View>

                    <Pressable
                        style={styles.shareButton}
                        onPress={onShare}
                    >
                        <MaterialCommunityIcons
                            name="share-variant-outline"
                            size={21}
                            color={colors.primary}
                        />
                    </Pressable>
                </View>

                <View style={styles.propertyLocation}>
                    <MaterialCommunityIcons
                        name="map-marker-outline"
                        size={17}
                        color={colors.textMuted}
                    />

                    <Text
                        style={styles.propertyLocationText}
                        numberOfLines={2}
                    >
                        {property.address}, {property.city},{" "}
                        {property.postcode}
                    </Text>
                </View>

                <View style={styles.propertyFeatureGrid}>
                    <PropertyFeature
                        icon="bed-outline"
                        text={`${property.bedrooms} bed`}
                    />

                    <PropertyFeature
                        icon="shower"
                        text={`${property.bathrooms} bath`}
                    />

                    <PropertyFeature
                        icon="sofa-outline"
                        text={`${property.receptionRooms} reception`}
                    />

                    <PropertyFeature
                        icon="silverware-fork-knife"
                        text={`${property.kitchens} kitchen`}
                    />
                </View>

                <View style={styles.propertyExtraFeatures}>
                    {property.parking ? (
                        <FeatureChip
                            icon="car-outline"
                            label="Parking"
                        />
                    ) : null}

                    {property.garden ? (
                        <FeatureChip
                            icon="flower-outline"
                            label="Garden"
                        />
                    ) : null}

                    {property.petsAllowed ? (
                        <FeatureChip
                            icon="paw-outline"
                            label="Pets allowed"
                        />
                    ) : null}

                    {property.billsIncluded ? (
                        <FeatureChip
                            icon="receipt-text-outline"
                            label="Bills included"
                        />
                    ) : null}

                    {property.accessible ? (
                        <FeatureChip
                            icon="wheelchair-accessibility"
                            label="Accessible"
                        />
                    ) : null}
                </View>

                <View style={styles.matchAnalysis}>
                    <Text style={styles.matchAnalysisTitle}>
                        Why this property matches
                    </Text>

                    {property.matchedRequirements
                        .slice(0, 3)
                        .map((reason) => (
                            <MatchReason
                                key={reason}
                                text={reason}
                                matched
                            />
                        ))}

                    {property.unmatchedRequirements
                        .slice(0, 1)
                        .map((reason) => (
                            <MatchReason
                                key={reason}
                                text={reason}
                                matched={false}
                            />
                        ))}
                </View>

                <Divider />

                <View style={styles.propertyRentalDetails}>
                    <View>
                        <Text style={styles.rentLabel}>
                            MONTHLY RENT
                        </Text>

                        <Text style={styles.rentValue}>
                            {formatCurrency(
                                property.monthlyRent,
                            )}
                        </Text>

                        <Text style={styles.depositText}>
                            Deposit:{" "}
                            {formatCurrency(property.deposit)}
                        </Text>
                    </View>

                    <View style={styles.availableArea}>
                        <Text style={styles.availableLabel}>
                            AVAILABLE
                        </Text>

                        <Text style={styles.availableValue}>
                            {property.availableDate}
                        </Text>
                    </View>
                </View>

                <Pressable
                    style={styles.compareSelector}
                    onPress={onCompare}
                >
                    <Checkbox
                        status={
                            selectedForComparison
                                ? "checked"
                                : "unchecked"
                        }
                        onPress={onCompare}
                    />

                    <Text style={styles.compareSelectorText}>
                        Add to property comparison
                    </Text>
                </Pressable>

                <View style={styles.propertyCardActions}>
                    <Button
                        mode="outlined"
                        icon="eye-outline"
                        onPress={onViewDetails}
                        style={styles.propertyActionButton}
                    >
                        View details
                    </Button>

                    <Button
                        mode="contained"
                        icon="file-document-edit-outline"
                        onPress={onApply}
                        style={styles.propertyActionButton}
                    >
                        Apply
                    </Button>
                </View>
            </View>
        </View>
    );
}

function FilterModal({
    visible,
    filters,
    onDismiss,
    onReset,
    onApply,
    onUpdateFilter,
    onTogglePropertyType,
    onToggleFurnishingType,
}: {
    visible: boolean;
    filters: FilterState;
    onDismiss: () => void;
    onReset: () => void;
    onApply: () => void;

    onUpdateFilter: <
        K extends keyof FilterState,
    >(
        key: K,
        value: FilterState[K],
    ) => void;

    onTogglePropertyType: (
        type: PropertyType,
    ) => void;

    onToggleFurnishingType: (
        type: FurnishingType,
    ) => void;
}) {
    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onDismiss}
                contentContainerStyle={
                    styles.modalContainer
                }
            >
                <View style={styles.modalHeader}>
                    <View>
                        <Text style={styles.modalTitle}>
                            Property filters
                        </Text>

                        <Text style={styles.modalSubtitle}>
                            Refine the property recommendations
                        </Text>
                    </View>

                    <Pressable
                        style={styles.closeButton}
                        onPress={onDismiss}
                    >
                        <MaterialCommunityIcons
                            name="close"
                            size={23}
                            color={colors.textPrimary}
                        />
                    </Pressable>
                </View>

                <ScrollView
                    style={styles.modalScroll}
                    contentContainerStyle={
                        styles.modalScrollContent
                    }
                    showsVerticalScrollIndicator={false}
                >
                    <FilterSection
                        icon="currency-gbp"
                        title="Monthly rent"
                    >
                        <Text style={styles.filterDescription}>
                            Minimum monthly rent
                        </Text>

                        <CounterFilter
                            value={filters.minimumRent}
                            minimum={0}
                            maximum={3000}
                            step={100}
                            currency
                            onChange={(value) =>
                                onUpdateFilter(
                                    "minimumRent",
                                    Math.min(
                                        value,
                                        filters.maximumRent,
                                    ),
                                )
                            }
                        />

                        <Text style={styles.filterDescription}>
                            Maximum monthly rent
                        </Text>

                        <CounterFilter
                            value={filters.maximumRent}
                            minimum={500}
                            maximum={5000}
                            step={100}
                            currency
                            onChange={(value) =>
                                onUpdateFilter(
                                    "maximumRent",
                                    Math.max(
                                        value,
                                        filters.minimumRent,
                                    ),
                                )
                            }
                        />
                    </FilterSection>

                    <FilterSection
                        icon="home-outline"
                        title="Property type"
                    >
                        <View style={styles.filterOptions}>
                            {propertyTypeOptions.map(
                                (type) => (
                                    <SelectionChip
                                        key={type}
                                        label={type}
                                        selected={filters.propertyTypes.includes(
                                            type,
                                        )}
                                        onPress={() =>
                                            onTogglePropertyType(type)
                                        }
                                    />
                                ),
                            )}
                        </View>
                    </FilterSection>

                    <FilterSection
                        icon="bed-outline"
                        title="Rooms"
                    >
                        <Text style={styles.filterDescription}>
                            Minimum bedrooms
                        </Text>

                        <CounterFilter
                            value={filters.minimumBedrooms}
                            minimum={0}
                            maximum={10}
                            step={1}
                            onChange={(value) =>
                                onUpdateFilter(
                                    "minimumBedrooms",
                                    value,
                                )
                            }
                        />

                        <Text style={styles.filterDescription}>
                            Minimum bathrooms
                        </Text>

                        <CounterFilter
                            value={filters.minimumBathrooms}
                            minimum={0}
                            maximum={10}
                            step={1}
                            onChange={(value) =>
                                onUpdateFilter(
                                    "minimumBathrooms",
                                    value,
                                )
                            }
                        />
                    </FilterSection>

                    <FilterSection
                        icon="sofa-outline"
                        title="Furnishing"
                    >
                        <View style={styles.filterOptions}>
                            {furnishingOptions.map(
                                (type) => (
                                    <SelectionChip
                                        key={type}
                                        label={type}
                                        selected={filters.furnishingTypes.includes(
                                            type,
                                        )}
                                        onPress={() =>
                                            onToggleFurnishingType(type)
                                        }
                                    />
                                ),
                            )}
                        </View>
                    </FilterSection>

                    <FilterSection
                        icon="star-outline"
                        title="Additional features"
                    >
                        <FilterSwitch
                            icon="paw-outline"
                            title="Pets allowed"
                            value={filters.petsAllowedOnly}
                            onValueChange={(value) =>
                                onUpdateFilter(
                                    "petsAllowedOnly",
                                    value,
                                )
                            }
                        />

                        <FilterSwitch
                            icon="car-outline"
                            title="Parking required"
                            value={filters.parkingRequired}
                            onValueChange={(value) =>
                                onUpdateFilter(
                                    "parkingRequired",
                                    value,
                                )
                            }
                        />

                        <FilterSwitch
                            icon="flower-outline"
                            title="Garden required"
                            value={filters.gardenRequired}
                            onValueChange={(value) =>
                                onUpdateFilter(
                                    "gardenRequired",
                                    value,
                                )
                            }
                        />

                        <FilterSwitch
                            icon="receipt-text-outline"
                            title="Bills included"
                            value={
                                filters.billsIncludedOnly
                            }
                            onValueChange={(value) =>
                                onUpdateFilter(
                                    "billsIncludedOnly",
                                    value,
                                )
                            }
                        />

                        <FilterSwitch
                            icon="wheelchair-accessibility"
                            title="Accessible property"
                            value={filters.accessibleOnly}
                            onValueChange={(value) =>
                                onUpdateFilter(
                                    "accessibleOnly",
                                    value,
                                )
                            }
                        />
                    </FilterSection>
                </ScrollView>

                <View style={styles.modalActions}>
                    <Button
                        mode="outlined"
                        onPress={onReset}
                    >
                        Reset filters
                    </Button>

                    <Button
                        mode="contained"
                        icon="check"
                        onPress={onApply}
                    >
                        Apply filters
                    </Button>
                </View>
            </Modal>
        </Portal>
    );
}

function PropertyDetailsModal({
    visible,
    property,
    saved,
    onDismiss,
    onSave,
    onShare,
    onFullDetails,
    onApply,
}: {
    visible: boolean;
    property: Property | null;
    saved: boolean;
    onDismiss: () => void;
    onSave: () => void;
    onShare: () => void;
    onFullDetails: () => void;
    onApply: () => void;
}) {
    if (!property) {
        return null;
    }

    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onDismiss}
                contentContainerStyle={[
                    styles.modalContainer,
                    styles.propertyDetailsModal,
                ]}
            >
                <View style={styles.detailsImageContainer}>
                    <Image
                        source={{
                            uri: property.image,
                        }}
                        style={styles.detailsImage}
                        resizeMode="cover"
                    />

                    <View style={styles.detailsImageOverlay}>
                        <View style={styles.matchBadge}>
                            <Text
                                style={styles.matchBadgeText}
                            >
                                {property.matchScore}% match
                            </Text>
                        </View>

                        <Pressable
                            style={styles.closeButtonLight}
                            onPress={onDismiss}
                        >
                            <MaterialCommunityIcons
                                name="close"
                                size={23}
                                color={colors.white}
                            />
                        </Pressable>
                    </View>
                </View>

                <ScrollView
                    style={styles.modalScroll}
                    contentContainerStyle={
                        styles.detailsScrollContent
                    }
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.detailsCategory}>
                        {property.propertyType} •{" "}
                        {property.furnishing}
                    </Text>

                    <Text style={styles.detailsTitle}>
                        {property.title}
                    </Text>

                    <View style={styles.propertyLocation}>
                        <MaterialCommunityIcons
                            name="map-marker-outline"
                            size={18}
                            color={colors.textMuted}
                        />

                        <Text
                            style={styles.propertyLocationText}
                        >
                            {property.address}, {property.city},{" "}
                            {property.postcode}
                        </Text>
                    </View>

                    <View style={styles.detailsPriceCard}>
                        <View>
                            <Text style={styles.rentLabel}>
                                MONTHLY RENT
                            </Text>

                            <Text style={styles.detailsRent}>
                                {formatCurrency(
                                    property.monthlyRent,
                                )}
                            </Text>
                        </View>

                        <View>
                            <Text style={styles.rentLabel}>
                                DEPOSIT
                            </Text>

                            <Text
                                style={styles.detailsDeposit}
                            >
                                {formatCurrency(property.deposit)}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.detailsSectionTitle}>
                        Property description
                    </Text>

                    <Text
                        style={styles.detailsDescription}
                    >
                        {property.description}
                    </Text>

                    <Text style={styles.detailsSectionTitle}>
                        Property information
                    </Text>

                    <View style={styles.detailsFeatureGrid}>
                        <DetailItem
                            icon="bed-outline"
                            label="Bedrooms"
                            value={String(property.bedrooms)}
                        />

                        <DetailItem
                            icon="shower"
                            label="Bathrooms"
                            value={String(property.bathrooms)}
                        />

                        <DetailItem
                            icon="sofa-outline"
                            label="Reception rooms"
                            value={String(
                                property.receptionRooms,
                            )}
                        />

                        <DetailItem
                            icon="silverware-fork-knife"
                            label="Kitchens"
                            value={String(property.kitchens)}
                        />

                        <DetailItem
                            icon="lightning-bolt-outline"
                            label="EPC rating"
                            value={property.epcRating}
                        />

                        <DetailItem
                            icon="office-building-outline"
                            label="Council tax"
                            value={`Band ${property.councilTaxBand}`}
                        />

                        <DetailItem
                            icon="calendar-outline"
                            label="Available"
                            value={property.availableDate}
                        />

                        <DetailItem
                            icon="account-tie-outline"
                            label="Estate agent"
                            value={property.agentName}
                        />
                    </View>

                    <Text style={styles.detailsSectionTitle}>
                        Match analysis
                    </Text>

                    <View style={styles.fullMatchAnalysis}>
                        <Text style={styles.matchedHeading}>
                            Matched requirements
                        </Text>

                        {property.matchedRequirements.map(
                            (reason) => (
                                <MatchReason
                                    key={reason}
                                    text={reason}
                                    matched
                                />
                            ),
                        )}

                        {property.unmatchedRequirements.length >
                            0 ? (
                            <>
                                <Text
                                    style={styles.unmatchedHeading}
                                >
                                    Requirements not matched
                                </Text>

                                {property.unmatchedRequirements.map(
                                    (reason) => (
                                        <MatchReason
                                            key={reason}
                                            text={reason}
                                            matched={false}
                                        />
                                    ),
                                )}
                            </>
                        ) : null}
                    </View>
                </ScrollView>

                <View style={styles.detailsActions}>
                    <Pressable
                        style={styles.detailsIconButton}
                        onPress={onSave}
                    >
                        <MaterialCommunityIcons
                            name={
                                saved
                                    ? "heart"
                                    : "heart-outline"
                            }
                            size={23}
                            color={
                                saved
                                    ? colors.error
                                    : colors.primary
                            }
                        />

                        <Text
                            style={styles.detailsIconButtonText}
                        >
                            {saved ? "Saved" : "Save"}
                        </Text>
                    </Pressable>

                    <Pressable
                        style={styles.detailsIconButton}
                        onPress={onShare}
                    >
                        <MaterialCommunityIcons
                            name="share-variant-outline"
                            size={23}
                            color={colors.primary}
                        />

                        <Text
                            style={styles.detailsIconButtonText}
                        >
                            Share
                        </Text>
                    </Pressable>

                    <Button
                        mode="outlined"
                        onPress={onFullDetails}
                    >
                        Full details
                    </Button>

                    <Button
                        mode="contained"
                        icon="file-document-edit-outline"
                        onPress={onApply}
                    >
                        Apply
                    </Button>
                </View>
            </Modal>
        </Portal>
    );
}

function ComparisonModal({
    visible,
    properties,
    onDismiss,
    onApply,
}: {
    visible: boolean;
    properties: Property[];
    onDismiss: () => void;
    onApply: (propertyId: string) => void;
}) {
    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onDismiss}
                contentContainerStyle={[
                    styles.modalContainer,
                    styles.comparisonModal,
                ]}
            >
                <View style={styles.modalHeader}>
                    <View>
                        <Text style={styles.modalTitle}>
                            Property comparison
                        </Text>

                        <Text style={styles.modalSubtitle}>
                            Compare your selected properties
                        </Text>
                    </View>

                    <Pressable
                        style={styles.closeButton}
                        onPress={onDismiss}
                    >
                        <MaterialCommunityIcons
                            name="close"
                            size={23}
                            color={colors.textPrimary}
                        />
                    </Pressable>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator
                    contentContainerStyle={
                        styles.comparisonContent
                    }
                >
                    {properties.map((property) => (
                        <View
                            key={property.id}
                            style={styles.comparisonProperty}
                        >
                            <Image
                                source={{
                                    uri: property.image,
                                }}
                                style={styles.comparisonImage}
                            />

                            <Text
                                style={styles.comparisonMatch}
                            >
                                {property.matchScore}% match
                            </Text>

                            <Text
                                style={styles.comparisonTitle}
                                numberOfLines={2}
                            >
                                {property.title}
                            </Text>

                            <Text
                                style={styles.comparisonAddress}
                                numberOfLines={2}
                            >
                                {property.city},{" "}
                                {property.postcode}
                            </Text>

                            <ComparisonRow
                                label="Rent"
                                value={`${formatCurrency(
                                    property.monthlyRent,
                                )}/month`}
                            />

                            <ComparisonRow
                                label="Deposit"
                                value={formatCurrency(
                                    property.deposit,
                                )}
                            />

                            <ComparisonRow
                                label="Type"
                                value={property.propertyType}
                            />

                            <ComparisonRow
                                label="Bedrooms"
                                value={String(
                                    property.bedrooms,
                                )}
                            />

                            <ComparisonRow
                                label="Bathrooms"
                                value={String(
                                    property.bathrooms,
                                )}
                            />

                            <ComparisonRow
                                label="Furnishing"
                                value={property.furnishing}
                            />

                            <ComparisonBooleanRow
                                label="Pets"
                                value={property.petsAllowed}
                            />

                            <ComparisonBooleanRow
                                label="Parking"
                                value={property.parking}
                            />

                            <ComparisonBooleanRow
                                label="Garden"
                                value={property.garden}
                            />

                            <ComparisonBooleanRow
                                label="Bills included"
                                value={property.billsIncluded}
                            />

                            <ComparisonBooleanRow
                                label="Accessible"
                                value={property.accessible}
                            />

                            <Button
                                mode="contained"
                                style={styles.comparisonApplyButton}
                                onPress={() => {
                                    onDismiss();
                                    onApply(property.id);
                                }}
                            >
                                Apply
                            </Button>
                        </View>
                    ))}
                </ScrollView>
            </Modal>
        </Portal>
    );
}

function Statistic({
    icon,
    value,
    label,
}: {
    icon: IconName;
    value: string;
    label: string;
}) {
    return (
        <View style={styles.statistic}>
            <View style={styles.statisticIcon}>
                <MaterialCommunityIcons
                    name={icon}
                    size={21}
                    color={colors.primary}
                />
            </View>

            <View>
                <Text style={styles.statisticValue}>
                    {value}
                </Text>

                <Text style={styles.statisticLabel}>
                    {label}
                </Text>
            </View>
        </View>
    );
}

function PropertyFeature({
    icon,
    text,
}: {
    icon: IconName;
    text: string;
}) {
    return (
        <View style={styles.propertyFeature}>
            <MaterialCommunityIcons
                name={icon}
                size={18}
                color={colors.primary}
            />

            <Text style={styles.propertyFeatureText}>
                {text}
            </Text>
        </View>
    );
}

function FeatureChip({
    icon,
    label,
}: {
    icon: IconName;
    label: string;
}) {
    return (
        <View style={styles.featureChip}>
            <MaterialCommunityIcons
                name={icon}
                size={15}
                color={colors.primary}
            />

            <Text style={styles.featureChipText}>
                {label}
            </Text>
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
                size={17}
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

function FilterSection({
    icon,
    title,
    children,
}: {
    icon: IconName;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <View style={styles.filterSection}>
            <View style={styles.filterSectionHeader}>
                <View style={styles.filterSectionIcon}>
                    <MaterialCommunityIcons
                        name={icon}
                        size={21}
                        color={colors.primary}
                    />
                </View>

                <Text style={styles.filterSectionTitle}>
                    {title}
                </Text>
            </View>

            <View style={styles.filterSectionBody}>
                {children}
            </View>
        </View>
    );
}

function SelectionChip({
    label,
    selected,
    onPress,
}: {
    label: string;
    selected: boolean;
    onPress: () => void;
}) {
    return (
        <Chip
            selected={selected}
            showSelectedCheck
            mode={selected ? "flat" : "outlined"}
            onPress={onPress}
        >
            {label}
        </Chip>
    );
}

function CounterFilter({
    value,
    minimum,
    maximum,
    step,
    currency = false,
    onChange,
}: {
    value: number;
    minimum: number;
    maximum: number;
    step: number;
    currency?: boolean;
    onChange: (value: number) => void;
}) {
    return (
        <View style={styles.counterFilter}>
            <Pressable
                style={[
                    styles.counterFilterButton,
                    value <= minimum &&
                    styles.counterFilterButtonDisabled,
                ]}
                disabled={value <= minimum}
                onPress={() =>
                    onChange(
                        Math.max(minimum, value - step),
                    )
                }
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

            <Text style={styles.counterFilterValue}>
                {currency
                    ? formatCurrency(value)
                    : value}
            </Text>

            <Pressable
                style={[
                    styles.counterFilterButton,
                    value >= maximum &&
                    styles.counterFilterButtonDisabled,
                ]}
                disabled={value >= maximum}
                onPress={() =>
                    onChange(
                        Math.min(maximum, value + step),
                    )
                }
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
    );
}

function FilterSwitch({
    icon,
    title,
    value,
    onValueChange,
}: {
    icon: IconName;
    title: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
}) {
    return (
        <Pressable
            style={[
                styles.filterSwitch,
                value && styles.filterSwitchSelected,
            ]}
            onPress={() => onValueChange(!value)}
        >
            <MaterialCommunityIcons
                name={icon}
                size={21}
                color={colors.primary}
            />

            <Text style={styles.filterSwitchTitle}>
                {title}
            </Text>

            <Switch
                value={value}
                onValueChange={onValueChange}
            />
        </Pressable>
    );
}

function DetailItem({
    icon,
    label,
    value,
}: {
    icon: IconName;
    label: string;
    value: string;
}) {
    return (
        <View style={styles.detailItem}>
            <View style={styles.detailItemIcon}>
                <MaterialCommunityIcons
                    name={icon}
                    size={21}
                    color={colors.primary}
                />
            </View>

            <View style={styles.detailItemContent}>
                <Text style={styles.detailItemLabel}>
                    {label}
                </Text>

                <Text style={styles.detailItemValue}>
                    {value}
                </Text>
            </View>
        </View>
    );
}

function ComparisonRow({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <View style={styles.comparisonRow}>
            <Text style={styles.comparisonRowLabel}>
                {label}
            </Text>

            <Text style={styles.comparisonRowValue}>
                {value}
            </Text>
        </View>
    );
}

function ComparisonBooleanRow({
    label,
    value,
}: {
    label: string;
    value: boolean;
}) {
    return (
        <View style={styles.comparisonRow}>
            <Text style={styles.comparisonRowLabel}>
                {label}
            </Text>

            <MaterialCommunityIcons
                name={
                    value
                        ? "check-circle-outline"
                        : "close-circle-outline"
                }
                size={19}
                color={
                    value
                        ? colors.success
                        : colors.error
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
        paddingBottom: 120,
    },

    topBar: {
        minHeight: 70,
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

    brandContainer: {
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
        marginTop: 3,
        color: colors.textMuted,
        fontSize: 9,
    },

    headerActions: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: spacing.sm,
    },

    hero: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xl,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.xl,
        backgroundColor: colors.white,
    },

    heroInformation: {
        flex: 1,
    },

    heroLabel: {
        color: colors.primary,
        fontSize: 9,
        fontWeight: "900",
        letterSpacing: 1.5,
    },

    heroTitle: {
        marginTop: 7,
        color: colors.textPrimary,
        fontSize: 30,
        fontWeight: "900",
        lineHeight: 38,
    },

    heroTitleSmall: {
        fontSize: 25,
        lineHeight: 32,
    },

    heroDescription: {
        maxWidth: 850,
        marginTop: spacing.sm,
        color: colors.textMuted,
        fontSize: 11,
        lineHeight: 18,
    },

    heroStatistics: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.lg,
        marginTop: spacing.xl,
    },

    statistic: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },

    statisticIcon: {
        width: 42,
        height: 42,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 13,
        backgroundColor: colors.primaryLight,
    },

    statisticValue: {
        color: colors.textPrimary,
        fontSize: 15,
        fontWeight: "900",
    },

    statisticLabel: {
        marginTop: 2,
        color: colors.textMuted,
        fontSize: 8,
    },

    heroIcon: {
        width: 96,
        height: 96,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 30,
        backgroundColor: colors.primaryLight,
    },

    recommendedSection: {
        overflow: "hidden",
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: radius.xl,
        backgroundColor: colors.white,
    },

    recommendedHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        padding: spacing.lg,
        backgroundColor: colors.primaryLight,
    },

    recommendedHeaderIcon: {
        width: 47,
        height: 47,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 15,
        backgroundColor: colors.white,
    },

    recommendedHeaderText: {
        flex: 1,
    },

    recommendedLabel: {
        color: colors.primary,
        fontSize: 8,
        fontWeight: "900",
        letterSpacing: 1.3,
    },

    recommendedTitle: {
        marginTop: 4,
        color: colors.textPrimary,
        fontSize: 14,
        fontWeight: "900",
    },

    matchBadgeLarge: {
        minWidth: 73,
        alignItems: "center",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 20,
        backgroundColor: colors.primary,
    },

    matchBadgeLargeValue: {
        color: colors.white,
        fontSize: 18,
        fontWeight: "900",
    },

    matchBadgeLargeLabel: {
        color: colors.white,
        fontSize: 8,
        fontWeight: "700",
    },

    recommendedBody: {
        flexDirection: "row",
    },

    recommendedBodyStacked: {
        flexDirection: "column",
    },

    recommendedImage: {
        width: "40%",
        minHeight: 360,
    },

    recommendedImageMobile: {
        width: "100%",
        height: 250,
        minHeight: 250,
    },

    recommendedInformation: {
        flex: 1,
        padding: spacing.xl,
    },

    recommendedPropertyType: {
        color: colors.primary,
        fontSize: 9,
        fontWeight: "900",
        textTransform: "uppercase",
    },

    recommendedPropertyTitle: {
        marginTop: spacing.sm,
        color: colors.textPrimary,
        fontSize: 22,
        fontWeight: "900",
        lineHeight: 29,
    },

    locationInformation: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: spacing.sm,
        marginTop: spacing.sm,
    },

    locationText: {
        flex: 1,
        color: colors.textMuted,
        fontSize: 10,
        lineHeight: 16,
    },

    recommendedFeatures: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.md,
        marginTop: spacing.lg,
    },

    recommendedMatchReasons: {
        gap: spacing.sm,
        marginTop: spacing.lg,
        padding: spacing.md,
        borderRadius: radius.lg,
        backgroundColor: colors.background,
    },

    recommendedBottomRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: spacing.md,
        marginTop: spacing.xl,
    },

    recommendedRentLabel: {
        color: colors.textMuted,
        fontSize: 8,
        fontWeight: "900",
        letterSpacing: 1,
    },

    recommendedRent: {
        marginTop: 4,
        color: colors.primary,
        fontSize: 24,
        fontWeight: "900",
    },

    recommendedButtons: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
    },

    searchSection: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: spacing.md,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.xl,
        backgroundColor: colors.white,
    },

    searchbar: {
        flex: 1,
        minWidth: 260,
        backgroundColor: colors.background,
    },

    searchInput: {
        fontSize: 11,
    },

    searchActions: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: spacing.sm,
    },

    viewButtons: {
        flexDirection: "row",
        overflow: "hidden",
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: radius.md,
    },

    viewButton: {
        width: 43,
        height: 43,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.white,
    },

    viewButtonSelected: {
        backgroundColor: colors.primary,
    },

    resultsHeader: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.md,
    },

    resultsTitle: {
        color: colors.textPrimary,
        fontSize: 18,
        fontWeight: "900",
    },

    resultsDescription: {
        marginTop: 4,
        color: colors.textMuted,
        fontSize: 9,
    },

    propertyContainer: {
        width: "100%",
    },

    propertyGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "stretch",
        gap: spacing.lg,
    },

    propertyList: {
        gap: spacing.lg,
    },

    propertyCard: {
        flexGrow: 1,
        flexBasis: 390,
        maxWidth: 700,
        minWidth: 290,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.xl,
        backgroundColor: colors.white,
    },

    propertyCardList: {
        maxWidth: "100%",
        flexDirection: "row",
    },

    propertyImageContainer: {
        position: "relative",
        width: "100%",
        height: 235,
        backgroundColor: colors.background,
    },

    propertyImageContainerList: {
        width: 390,
        height: "auto",
        minHeight: 550,
    },

    propertyImage: {
        width: "100%",
        height: "100%",
    },

    propertyImageTop: {
        position: "absolute",
        top: spacing.md,
        left: spacing.md,
        right: spacing.md,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    propertyImageBottom: {
        position: "absolute",
        left: spacing.md,
        bottom: spacing.md,
    },

    matchBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 20,
        backgroundColor: colors.primary,
    },

    matchBadgeText: {
        color: colors.white,
        fontSize: 9,
        fontWeight: "900",
    },

    imageActionButton: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 20,
        backgroundColor: "rgba(0,0,0,0.45)",
    },

    verifiedBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: spacing.sm,
        paddingVertical: 6,
        borderRadius: 18,
        backgroundColor: colors.white,
    },

    verifiedBadgeText: {
        color: colors.success,
        fontSize: 8,
        fontWeight: "900",
    },

    propertyCardContent: {
        flex: 1,
        padding: spacing.lg,
    },

    propertyCardHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: spacing.md,
    },

    propertyCardTitleArea: {
        flex: 1,
    },

    propertyCategory: {
        color: colors.primary,
        fontSize: 8,
        fontWeight: "900",
        textTransform: "uppercase",
    },

    propertyTitle: {
        marginTop: 5,
        color: colors.textPrimary,
        fontSize: 15,
        fontWeight: "900",
        lineHeight: 21,
    },

    shareButton: {
        width: 39,
        height: 39,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 13,
        backgroundColor: colors.primaryLight,
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
        fontSize: 9,
        lineHeight: 15,
    },

    propertyFeatureGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.md,
        marginTop: spacing.lg,
    },

    propertyFeature: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },

    propertyFeatureText: {
        color: colors.textSecondary,
        fontSize: 9,
        fontWeight: "700",
    },

    propertyExtraFeatures: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
        marginTop: spacing.md,
    },

    featureChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: spacing.sm,
        paddingVertical: 6,
        borderRadius: 18,
        backgroundColor: colors.primaryLight,
    },

    featureChipText: {
        color: colors.primary,
        fontSize: 8,
        fontWeight: "800",
    },

    matchAnalysis: {
        gap: spacing.sm,
        marginVertical: spacing.lg,
        padding: spacing.md,
        borderRadius: radius.lg,
        backgroundColor: colors.background,
    },

    matchAnalysisTitle: {
        marginBottom: 2,
        color: colors.textPrimary,
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
        fontSize: 8,
        lineHeight: 14,
    },

    matchReasonTextUnmatched: {
        color: colors.textMuted,
    },

    propertyRentalDetails: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: spacing.md,
        marginTop: spacing.lg,
    },

    rentLabel: {
        color: colors.textMuted,
        fontSize: 7,
        fontWeight: "900",
        letterSpacing: 1,
    },

    rentValue: {
        marginTop: 3,
        color: colors.primary,
        fontSize: 21,
        fontWeight: "900",
    },

    depositText: {
        marginTop: 3,
        color: colors.textMuted,
        fontSize: 8,
    },

    availableArea: {
        alignItems: "flex-end",
    },

    availableLabel: {
        color: colors.textMuted,
        fontSize: 7,
        fontWeight: "900",
    },

    availableValue: {
        marginTop: 4,
        color: colors.textPrimary,
        fontSize: 9,
        fontWeight: "800",
    },

    compareSelector: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: spacing.md,
    },

    compareSelectorText: {
        color: colors.textSecondary,
        fontSize: 9,
        fontWeight: "700",
    },

    propertyCardActions: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
        marginTop: spacing.md,
    },

    propertyActionButton: {
        flexGrow: 1,
    },

    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.md,
        minHeight: 350,
        padding: spacing.xxl,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.xl,
        backgroundColor: colors.white,
    },

    emptyStateIcon: {
        width: 86,
        height: 86,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 28,
        backgroundColor: colors.primaryLight,
    },

    emptyStateTitle: {
        color: colors.textPrimary,
        fontSize: 17,
        fontWeight: "900",
        textAlign: "center",
    },

    emptyStateDescription: {
        maxWidth: 450,
        color: colors.textMuted,
        fontSize: 10,
        lineHeight: 17,
        textAlign: "center",
    },

    comparisonBar: {
        position: "absolute",
        left: spacing.lg,
        right: spacing.lg,
        bottom: spacing.lg,
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: radius.xl,
        backgroundColor: colors.primary,
    },

    comparisonInformation: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
    },

    comparisonBarIcon: {
        width: 46,
        height: 46,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 15,
        backgroundColor: "rgba(255,255,255,0.15)",
    },

    comparisonBarTitle: {
        color: colors.white,
        fontSize: 11,
        fontWeight: "900",
    },

    comparisonBarDescription: {
        marginTop: 3,
        color: colors.white,
        fontSize: 8,
        opacity: 0.8,
    },

    comparisonBarActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },

    modalContainer: {
        width: "94%",
        maxWidth: 750,
        maxHeight: "92%",
        alignSelf: "center",
        overflow: "hidden",
        borderRadius: radius.xl,
        backgroundColor: colors.white,
    },

    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.md,
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },

    modalTitle: {
        color: colors.textPrimary,
        fontSize: 16,
        fontWeight: "900",
    },

    modalSubtitle: {
        marginTop: 3,
        color: colors.textMuted,
        fontSize: 9,
    },

    closeButton: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 13,
        backgroundColor: colors.background,
    },

    closeButtonLight: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 20,
        backgroundColor: "rgba(0,0,0,0.45)",
    },

    modalScroll: {
        flexGrow: 0,
    },

    modalScrollContent: {
        gap: spacing.lg,
        padding: spacing.lg,
    },

    modalActions: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "flex-end",
        gap: spacing.sm,
        padding: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },

    filterSection: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.lg,
    },

    filterSectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.background,
    },

    filterSectionIcon: {
        width: 39,
        height: 39,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
        backgroundColor: colors.primaryLight,
    },

    filterSectionTitle: {
        color: colors.textPrimary,
        fontSize: 11,
        fontWeight: "900",
    },

    filterSectionBody: {
        gap: spacing.md,
        padding: spacing.md,
    },

    filterDescription: {
        color: colors.textSecondary,
        fontSize: 9,
        fontWeight: "700",
    },

    filterOptions: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
    },

    counterFilter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.md,
        padding: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        backgroundColor: colors.background,
    },

    counterFilterButton: {
        width: 39,
        height: 39,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: 12,
        backgroundColor: colors.white,
    },

    counterFilterButtonDisabled: {
        borderColor: colors.border,
        backgroundColor: colors.background,
    },

    counterFilterValue: {
        color: colors.textPrimary,
        fontSize: 13,
        fontWeight: "900",
    },

    filterSwitch: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
    },

    filterSwitchSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryLight,
    },

    filterSwitchTitle: {
        flex: 1,
        color: colors.textPrimary,
        fontSize: 9,
        fontWeight: "800",
    },

    propertyDetailsModal: {
        maxWidth: 900,
    },

    detailsImageContainer: {
        position: "relative",
        height: 260,
    },

    detailsImage: {
        width: "100%",
        height: "100%",
    },

    detailsImageOverlay: {
        position: "absolute",
        top: spacing.md,
        left: spacing.md,
        right: spacing.md,
        flexDirection: "row",
        justifyContent: "space-between",
    },

    detailsScrollContent: {
        padding: spacing.xl,
    },

    detailsCategory: {
        color: colors.primary,
        fontSize: 9,
        fontWeight: "900",
        textTransform: "uppercase",
    },

    detailsTitle: {
        marginTop: 6,
        color: colors.textPrimary,
        fontSize: 22,
        fontWeight: "900",
        lineHeight: 29,
    },

    detailsPriceCard: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        gap: spacing.lg,
        marginTop: spacing.lg,
        padding: spacing.lg,
        borderRadius: radius.lg,
        backgroundColor: colors.primaryLight,
    },

    detailsRent: {
        marginTop: 4,
        color: colors.primary,
        fontSize: 24,
        fontWeight: "900",
    },

    detailsDeposit: {
        marginTop: 4,
        color: colors.textPrimary,
        fontSize: 16,
        fontWeight: "900",
    },

    detailsSectionTitle: {
        marginTop: spacing.xl,
        marginBottom: spacing.md,
        color: colors.textPrimary,
        fontSize: 13,
        fontWeight: "900",
    },

    detailsDescription: {
        color: colors.textSecondary,
        fontSize: 10,
        lineHeight: 18,
    },

    detailsFeatureGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.md,
    },

    detailItem: {
        flexGrow: 1,
        flexBasis: 190,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.lg,
    },

    detailItemIcon: {
        width: 42,
        height: 42,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 13,
        backgroundColor: colors.primaryLight,
    },

    detailItemContent: {
        flex: 1,
    },

    detailItemLabel: {
        color: colors.textMuted,
        fontSize: 8,
        fontWeight: "800",
    },

    detailItemValue: {
        marginTop: 3,
        color: colors.textPrimary,
        fontSize: 9,
        fontWeight: "900",
    },

    fullMatchAnalysis: {
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.lg,
        backgroundColor: colors.background,
    },

    matchedHeading: {
        color: colors.success,
        fontSize: 10,
        fontWeight: "900",
    },

    unmatchedHeading: {
        marginTop: spacing.md,
        color: colors.error,
        fontSize: 10,
        fontWeight: "900",
    },

    detailsActions: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: spacing.sm,
        padding: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },

    detailsIconButton: {
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: spacing.sm,
    },

    detailsIconButtonText: {
        marginTop: 2,
        color: colors.primary,
        fontSize: 7,
        fontWeight: "800",
    },

    comparisonModal: {
        maxWidth: 1100,
    },

    comparisonContent: {
        gap: spacing.md,
        padding: spacing.lg,
    },

    comparisonProperty: {
        width: 280,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.lg,
        backgroundColor: colors.white,
    },

    comparisonImage: {
        width: "100%",
        height: 150,
    },

    comparisonMatch: {
        alignSelf: "flex-start",
        marginTop: spacing.md,
        marginHorizontal: spacing.md,
        paddingHorizontal: spacing.sm,
        paddingVertical: 5,
        borderRadius: 15,
        color: colors.white,
        backgroundColor: colors.primary,
        fontSize: 8,
        fontWeight: "900",
    },

    comparisonTitle: {
        marginTop: spacing.sm,
        marginHorizontal: spacing.md,
        color: colors.textPrimary,
        fontSize: 12,
        fontWeight: "900",
        lineHeight: 17,
    },

    comparisonAddress: {
        marginTop: 4,
        marginHorizontal: spacing.md,
        marginBottom: spacing.md,
        color: colors.textMuted,
        fontSize: 8,
        lineHeight: 13,
    },

    comparisonRow: {
        minHeight: 45,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.md,
        paddingHorizontal: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },

    comparisonRowLabel: {
        color: colors.textMuted,
        fontSize: 8,
        fontWeight: "800",
    },

    comparisonRowValue: {
        flex: 1,
        color: colors.textPrimary,
        fontSize: 8,
        fontWeight: "900",
        textAlign: "right",
    },

    comparisonApplyButton: {
        margin: spacing.md,
    },
});