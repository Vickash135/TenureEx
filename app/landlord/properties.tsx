import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useState } from "react";
import {
  Image,
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
  Dialog,
  Divider,
  Menu,
  Portal,
  RadioButton,
  Searchbar,
  Switch,
  TextInput,
} from "react-native-paper";

import LandlordModuleScreen from "./LandlordModuleScreen";

import { api } from "../../src/api/client";

import {
  colors,
  radius,
  spacing,
} from "../../src/theme";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

type PropertyStatus =
  | "Occupied"
  | "Vacant"
  | "Pending approval";

type ApprovalStatus =
  | "Approved"
  | "Pending"
  | "Rejected";

type PropertyType =
  | "House"
  | "Flat"
  | "Studio"
  | "Bungalow"
  | "Maisonette"
  | "Other";

type FurnishingStatus =
  | "Furnished"
  | "Part-furnished"
  | "Unfurnished";

type MaintenanceRoute =
  | "Contact landlord first"
  | "Agent can arrange"
  | "Use preferred contractor";

type Property = {
  id: string;

  addressLine1: string;
  addressLine2: string;
  townCity: string;
  county: string;
  postcode: string;

  propertyType: PropertyType;
  bedrooms: string;
  bathrooms: string;
  receptionRooms: string;

  monthlyRent: string;
  depositAmount: string;
  councilTaxBand: string;

  furnishingStatus: FurnishingStatus;
  propertyStatus: PropertyStatus;
  approvalStatus: ApprovalStatus;

  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;

  availableFrom: string;

  petsAllowed: boolean;
  smokingAllowed: boolean;
  childrenAllowed: boolean;

  hasParking: boolean;
  hasGarden: boolean;
  hasLift: boolean;
  hasWheelchairAccess: boolean;

  description: string;
  specialNotes: string;

  gasSupplier: string;
  electricitySupplier: string;
  waterSupplier: string;
  councilName: string;

  gasSafetyExpiry: string;
  epcExpiry: string;
  eicrExpiry: string;

  maintenanceRoute: MaintenanceRoute;
  preferredContractor: string;
  emergencyRepairPermission: boolean;
  emergencySpendingLimit: string;

  advertisingAllowed: boolean;
  advertisingTitle: string;

  photoNames: string[];
};

type PropertyFormErrors = Partial<
  Record<keyof Property, string>
>;

type SelectedPropertyPhoto = {
  uri: string;
  name: string;
  mimeType: string;
  file?: File;
};

const API_ORIGIN = (
  process.env.EXPO_PUBLIC_API_URL ??
  "http://localhost:3000/api/v1"
).replace(/\/+$/, "")

function getPropertyPhotoUrl(photoName: string): string {
  if (/^https?:\/\//i.test(photoName)) {
    return photoName;
  }

  return `${API_ORIGIN}/uploads/properties/${encodeURIComponent(photoName)}`;
}

const emptyProperty: Property = {
  id: "",

  addressLine1: "",
  addressLine2: "",
  townCity: "",
  county: "",
  postcode: "",

  propertyType: "House",
  bedrooms: "",
  bathrooms: "",
  receptionRooms: "",

  monthlyRent: "",
  depositAmount: "",
  councilTaxBand: "",

  furnishingStatus: "Unfurnished",
  propertyStatus: "Vacant",
  approvalStatus: "Pending",

  tenantName: "",
  tenantEmail: "",
  tenantPhone: "",

  availableFrom: "",

  petsAllowed: false,
  smokingAllowed: false,
  childrenAllowed: true,

  hasParking: false,
  hasGarden: false,
  hasLift: false,
  hasWheelchairAccess: false,

  description: "",
  specialNotes: "",

  gasSupplier: "",
  electricitySupplier: "",
  waterSupplier: "",
  councilName: "",

  gasSafetyExpiry: "",
  epcExpiry: "",
  eicrExpiry: "",

  maintenanceRoute: "Contact landlord first",
  preferredContractor: "",
  emergencyRepairPermission: false,
  emergencySpendingLimit: "",

  advertisingAllowed: false,
  advertisingTitle: "",

  photoNames: [],
};

const propertyTypes: PropertyType[] = [
  "House",
  "Flat",
  "Studio",
  "Bungalow",
  "Maisonette",
  "Other",
];

const furnishingOptions: FurnishingStatus[] = [
  "Furnished",
  "Part-furnished",
  "Unfurnished",
];

const propertyStatusOptions: PropertyStatus[] = [
  "Occupied",
  "Vacant",
  "Pending approval",
];

const approvalOptions: ApprovalStatus[] = [
  "Approved",
  "Pending",
  "Rejected",
];

const maintenanceRouteOptions: MaintenanceRoute[] = [
  "Contact landlord first",
  "Agent can arrange",
  "Use preferred contractor",
];


type BackendProperty = {
  id: string;
  addressLine1: string;
  addressLine2: string | null;
  townCity: string;
  county: string | null;
  postcode: string;
  propertyType:
    | "HOUSE"
    | "FLAT"
    | "STUDIO"
    | "BUNGALOW"
    | "MAISONETTE"
    | "OTHER";
  bedrooms: number;
  bathrooms: number;
  receptionRooms: number;
  monthlyRent: string | number;
  depositAmount: string | number | null;
  councilTaxBand: string | null;
  furnishingStatus:
    | "FURNISHED"
    | "PART_FURNISHED"
    | "UNFURNISHED";
  propertyStatus:
    | "OCCUPIED"
    | "VACANT"
    | "PENDING_APPROVAL";
  approvalStatus:
    | "APPROVED"
    | "PENDING"
    | "REJECTED";
  tenantName: string | null;
  tenantEmail: string | null;
  tenantPhone: string | null;
  availableFrom: string | null;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  childrenAllowed: boolean;
  hasParking: boolean;
  hasGarden: boolean;
  hasLift: boolean;
  hasWheelchairAccess: boolean;
  description: string | null;
  specialNotes: string | null;
  gasSupplier: string | null;
  electricitySupplier: string | null;
  waterSupplier: string | null;
  councilName: string | null;
  gasSafetyExpiry: string | null;
  epcExpiry: string | null;
  eicrExpiry: string | null;
  maintenanceRoute:
    | "CONTACT_LANDLORD_FIRST"
    | "AGENT_CAN_ARRANGE"
    | "USE_PREFERRED_CONTRACTOR";
  preferredContractor: string | null;
  emergencyRepairPermission: boolean;
  emergencySpendingLimit: string | number | null;
  advertisingAllowed: boolean;
  advertisingTitle: string | null;
  photoNames: string[];
};

type AddressLookupItem = {
  id: string;
  displayAddress: string;
  line1?: string;
  line2?: string;
  line3?: string;
  town?: string;
  county?: string;
  postcode: string;
};

type AddressLookupResponse = {
  postcode: string;
  count: number;
  addresses: AddressLookupItem[];
};

const propertyTypeToApi: Record<PropertyType, BackendProperty["propertyType"]> = {
  House: "HOUSE",
  Flat: "FLAT",
  Studio: "STUDIO",
  Bungalow: "BUNGALOW",
  Maisonette: "MAISONETTE",
  Other: "OTHER",
};

const propertyTypeFromApi: Record<BackendProperty["propertyType"], PropertyType> = {
  HOUSE: "House",
  FLAT: "Flat",
  STUDIO: "Studio",
  BUNGALOW: "Bungalow",
  MAISONETTE: "Maisonette",
  OTHER: "Other",
};

const furnishingToApi: Record<
  FurnishingStatus,
  BackendProperty["furnishingStatus"]
> = {
  Furnished: "FURNISHED",
  "Part-furnished": "PART_FURNISHED",
  Unfurnished: "UNFURNISHED",
};

const furnishingFromApi: Record<
  BackendProperty["furnishingStatus"],
  FurnishingStatus
> = {
  FURNISHED: "Furnished",
  PART_FURNISHED: "Part-furnished",
  UNFURNISHED: "Unfurnished",
};

const propertyStatusToApi: Record<
  PropertyStatus,
  BackendProperty["propertyStatus"]
> = {
  Occupied: "OCCUPIED",
  Vacant: "VACANT",
  "Pending approval": "PENDING_APPROVAL",
};

const propertyStatusFromApi: Record<
  BackendProperty["propertyStatus"],
  PropertyStatus
> = {
  OCCUPIED: "Occupied",
  VACANT: "Vacant",
  PENDING_APPROVAL: "Pending approval",
};

const approvalFromApi: Record<
  BackendProperty["approvalStatus"],
  ApprovalStatus
> = {
  APPROVED: "Approved",
  PENDING: "Pending",
  REJECTED: "Rejected",
};

const maintenanceToApi: Record<
  MaintenanceRoute,
  BackendProperty["maintenanceRoute"]
> = {
  "Contact landlord first": "CONTACT_LANDLORD_FIRST",
  "Agent can arrange": "AGENT_CAN_ARRANGE",
  "Use preferred contractor": "USE_PREFERRED_CONTRACTOR",
};

const maintenanceFromApi: Record<
  BackendProperty["maintenanceRoute"],
  MaintenanceRoute
> = {
  CONTACT_LANDLORD_FIRST: "Contact landlord first",
  AGENT_CAN_ARRANGE: "Agent can arrange",
  USE_PREFERRED_CONTRACTOR: "Use preferred contractor",
};

function formatApiDate(value: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function toApiDate(value: string): string | undefined {
  if (!value.trim()) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.trim();
  }

  return date.toISOString();
}

function mapBackendProperty(property: BackendProperty): Property {
  return {
    id: property.id,
    addressLine1: property.addressLine1,
    addressLine2: property.addressLine2 ?? "",
    townCity: property.townCity,
    county: property.county ?? "",
    postcode: property.postcode,
    propertyType: propertyTypeFromApi[property.propertyType],
    bedrooms: String(property.bedrooms),
    bathrooms: String(property.bathrooms),
    receptionRooms: String(property.receptionRooms),
    monthlyRent: String(property.monthlyRent),
    depositAmount:
      property.depositAmount === null
        ? ""
        : String(property.depositAmount),
    councilTaxBand: property.councilTaxBand ?? "",
    furnishingStatus:
      furnishingFromApi[property.furnishingStatus],
    propertyStatus:
      propertyStatusFromApi[property.propertyStatus],
    approvalStatus:
      approvalFromApi[property.approvalStatus],
    tenantName: property.tenantName ?? "",
    tenantEmail: property.tenantEmail ?? "",
    tenantPhone: property.tenantPhone ?? "",
    availableFrom: formatApiDate(property.availableFrom),
    petsAllowed: property.petsAllowed,
    smokingAllowed: property.smokingAllowed,
    childrenAllowed: property.childrenAllowed,
    hasParking: property.hasParking,
    hasGarden: property.hasGarden,
    hasLift: property.hasLift,
    hasWheelchairAccess: property.hasWheelchairAccess,
    description: property.description ?? "",
    specialNotes: property.specialNotes ?? "",
    gasSupplier: property.gasSupplier ?? "",
    electricitySupplier: property.electricitySupplier ?? "",
    waterSupplier: property.waterSupplier ?? "",
    councilName: property.councilName ?? "",
    gasSafetyExpiry: formatApiDate(property.gasSafetyExpiry),
    epcExpiry: formatApiDate(property.epcExpiry),
    eicrExpiry: formatApiDate(property.eicrExpiry),
    maintenanceRoute:
      maintenanceFromApi[property.maintenanceRoute],
    preferredContractor:
      property.preferredContractor ?? "",
    emergencyRepairPermission:
      property.emergencyRepairPermission,
    emergencySpendingLimit:
      property.emergencySpendingLimit === null
        ? ""
        : String(property.emergencySpendingLimit),
    advertisingAllowed: property.advertisingAllowed,
    advertisingTitle: property.advertisingTitle ?? "",
    photoNames: property.photoNames ?? [],
  };
}

function propertyToPayload(property: Property) {
  return {
    addressLine1: property.addressLine1.trim(),
    addressLine2:
      property.addressLine2.trim() || undefined,
    townCity: property.townCity.trim(),
    county: property.county.trim() || undefined,
    postcode: property.postcode.trim().toUpperCase(),
    propertyType:
      propertyTypeToApi[property.propertyType],
    bedrooms: Number(property.bedrooms),
    bathrooms: Number(property.bathrooms),
    receptionRooms:
      Number(property.receptionRooms) || 0,
    monthlyRent: Number(property.monthlyRent),
    depositAmount:
      property.depositAmount.trim()
        ? Number(property.depositAmount)
        : undefined,
    councilTaxBand:
      property.councilTaxBand.trim() || undefined,
    furnishingStatus:
      furnishingToApi[property.furnishingStatus],
    propertyStatus:
      propertyStatusToApi[property.propertyStatus],
    tenantName:
      property.tenantName.trim() || undefined,
    tenantEmail:
      property.tenantEmail.trim().toLowerCase() ||
      undefined,
    tenantPhone:
      property.tenantPhone.trim() || undefined,
    availableFrom:
      toApiDate(property.availableFrom),
    petsAllowed: property.petsAllowed,
    smokingAllowed: property.smokingAllowed,
    childrenAllowed: property.childrenAllowed,
    hasParking: property.hasParking,
    hasGarden: property.hasGarden,
    hasLift: property.hasLift,
    hasWheelchairAccess:
      property.hasWheelchairAccess,
    description:
      property.description.trim() || undefined,
    specialNotes:
      property.specialNotes.trim() || undefined,
    gasSupplier:
      property.gasSupplier.trim() || undefined,
    electricitySupplier:
      property.electricitySupplier.trim() ||
      undefined,
    waterSupplier:
      property.waterSupplier.trim() || undefined,
    councilName:
      property.councilName.trim() || undefined,
    gasSafetyExpiry:
      toApiDate(property.gasSafetyExpiry),
    epcExpiry:
      toApiDate(property.epcExpiry),
    eicrExpiry:
      toApiDate(property.eicrExpiry),
    maintenanceRoute:
      maintenanceToApi[property.maintenanceRoute],
    preferredContractor:
      property.preferredContractor.trim() ||
      undefined,
    emergencyRepairPermission:
      property.emergencyRepairPermission,
    emergencySpendingLimit:
      property.emergencyRepairPermission &&
      property.emergencySpendingLimit.trim()
        ? Number(property.emergencySpendingLimit)
        : undefined,
    advertisingAllowed:
      property.advertisingAllowed,
    advertisingTitle:
      property.advertisingTitle.trim() ||
      undefined,
    photoNames: property.photoNames,
  };
}

function getApiErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string | string[];
          };
        };
      }
    ).response;

    const message = response?.data?.message;

    if (Array.isArray(message)) {
      return message.join("\n");
    }

    if (typeof message === "string") {
      return message;
    }
  }

  return "Unable to complete the property request. Please try again.";
}

export default function LandlordPropertiesScreen() {
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1050;
  const isTablet = width >= 720;

  const [properties, setProperties] =
    useState<Property[]>([]);

  const [searchText, setSearchText] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<"All" | PropertyStatus>("All");

  const [approvalFilter, setApprovalFilter] =
    useState<"All" | ApprovalStatus>("All");

  const [showStatusMenu, setShowStatusMenu] =
    useState(false);

  const [
    showApprovalMenu,
    setShowApprovalMenu,
  ] = useState(false);

  const [showPropertyDialog, setShowPropertyDialog] =
    useState(false);

  const [showDetailsDialog, setShowDetailsDialog] =
    useState(false);

  const [showDeleteDialog, setShowDeleteDialog] =
    useState(false);

  const [editingPropertyId, setEditingPropertyId] =
    useState<string | null>(null);

  const [selectedProperty, setSelectedProperty] =
    useState<Property | null>(null);

  const [propertyForm, setPropertyForm] =
    useState<Property>(emptyProperty);

  const [formErrors, setFormErrors] =
    useState<PropertyFormErrors>({});

  const [
    showAvailableDateDialog,
    setShowAvailableDateDialog,
  ] = useState(false);

  const [
    availableCalendarMonth,
    setAvailableCalendarMonth,
  ] = useState<Date>(
    startOfMonth(new Date()),
  );

  const [propertiesLoading, setPropertiesLoading] =
    useState(true);

  const [saveLoading, setSaveLoading] =
    useState(false);

  const [deleteLoading, setDeleteLoading] =
    useState(false);

  const [apiError, setApiError] =
    useState("");

  const [apiMessage, setApiMessage] =
    useState("");

  const [addressResults, setAddressResults] =
    useState<AddressLookupItem[]>([]);

  const [addressLoading, setAddressLoading] =
    useState(false);

  const [addressError, setAddressError] =
    useState("");

  const [selectedPhotos, setSelectedPhotos] =
    useState<SelectedPropertyPhoto[]>([]);

  const [photoUploadLoading, setPhotoUploadLoading] =
    useState(false);

  const loadProperties = async () => {
    setPropertiesLoading(true);
    setApiError("");

    try {
      const response =
        await api.get<BackendProperty[]>(
          "/landlord-properties",
        );

      setProperties(
        response.data.map(
          mapBackendProperty,
        ),
      );
    } catch (error: unknown) {
      setApiError(
        getApiErrorMessage(error),
      );
    } finally {
      setPropertiesLoading(false);
    }
  };

  useEffect(() => {
    void loadProperties();
  }, []);

  const filteredProperties = useMemo(() => {
    const normalisedSearch =
      searchText.trim().toLowerCase();

    return properties.filter((property) => {
      const searchableText = [
        property.id,
        property.addressLine1,
        property.addressLine2,
        property.townCity,
        property.county,
        property.postcode,
        property.tenantName,
        property.propertyType,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalisedSearch.length === 0 ||
        searchableText.includes(normalisedSearch);

      const matchesStatus =
        statusFilter === "All" ||
        property.propertyStatus === statusFilter;

      const matchesApproval =
        approvalFilter === "All" ||
        property.approvalStatus === approvalFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesApproval
      );
    });
  }, [
    properties,
    searchText,
    statusFilter,
    approvalFilter,
  ]);

  const occupiedCount = useMemo(
    () =>
      properties.filter(
        (property) =>
          property.propertyStatus === "Occupied",
      ).length,
    [properties],
  );

  const vacantCount = useMemo(
    () =>
      properties.filter(
        (property) =>
          property.propertyStatus === "Vacant",
      ).length,
    [properties],
  );

  const pendingCount = useMemo(
    () =>
      properties.filter(
        (property) =>
          property.approvalStatus === "Pending",
      ).length,
    [properties],
  );

  const monthlyIncome = useMemo(
    () =>
      properties
        .filter(
          (property) =>
            property.propertyStatus === "Occupied",
        )
        .reduce(
          (total, property) =>
            total +
            (Number(property.monthlyRent) || 0),
          0,
        ),
    [properties],
  );

  const updateForm = <K extends keyof Property>(
    field: K,
    value: Property[K],
  ) => {
    setPropertyForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (formErrors[field]) {
      setFormErrors((current) => ({
        ...current,
        [field]: undefined,
      }));
    }
  };

  const openAvailableDatePicker = () => {
    const selectedDate =
      parseDisplayDate(
        propertyForm.availableFrom,
      );

    setAvailableCalendarMonth(
      startOfMonth(
        selectedDate ?? new Date(),
      ),
    );

    setShowAvailableDateDialog(true);
  };

  const selectAvailableDate = (
    selectedDate: Date,
  ) => {
    updateForm(
      "availableFrom",
      formatDisplayDate(
        selectedDate,
      ),
    );

    setShowAvailableDateDialog(false);
  };

  const openAddProperty = () => {
    setEditingPropertyId(null);
    setPropertyForm({
      ...emptyProperty,
    });
    setFormErrors({});
    setAddressResults([]);
    setAddressError("");
    setSelectedPhotos([]);
    setApiError("");
    setApiMessage("");
    setShowPropertyDialog(true);
  };

  const openEditProperty = (
    property: Property,
  ) => {
    setEditingPropertyId(property.id);
    setPropertyForm({
      ...property,
      photoNames: [...property.photoNames],
    });
    setFormErrors({});
    setAddressResults([]);
    setAddressError("");
    setSelectedPhotos([]);
    setApiError("");
    setApiMessage("");
    setShowDetailsDialog(false);
    setShowPropertyDialog(true);
  };

  const openPropertyDetails = (
    property: Property,
  ) => {
    setSelectedProperty(property);
    setShowDetailsDialog(true);
  };

  const requestDeleteProperty = (
    property: Property,
  ) => {
    setSelectedProperty(property);
    setShowDetailsDialog(false);
    setShowDeleteDialog(true);
  };

  const findPropertyAddresses = async () => {
    const postcode =
      propertyForm.postcode
        .trim()
        .toUpperCase();

    if (!postcode) {
      setFormErrors((current) => ({
        ...current,
        postcode: "Postcode is required.",
      }));

      return;
    }

    setAddressLoading(true);
    setAddressError("");
    setAddressResults([]);

    try {
      const response =
        await api.get<AddressLookupResponse>(
          `/address-lookup/postcode/${encodeURIComponent(
            postcode,
          )}`,
        );

      setAddressResults(
        response.data.addresses ?? [],
      );

      if (
        !response.data.addresses?.length
      ) {
        setAddressError(
          "No addresses were found. You can enter the address manually.",
        );
      }
    } catch (error: unknown) {
      setAddressError(
        getApiErrorMessage(error),
      );
    } finally {
      setAddressLoading(false);
    }
  };

  const selectPropertyAddress = (
    address: AddressLookupItem,
  ) => {
    setPropertyForm((current) => ({
      ...current,
      addressLine1:
        address.line1?.trim() ||
        address.displayAddress,
      addressLine2:
        [address.line2, address.line3]
          .filter(Boolean)
          .join(", "),
      townCity:
        address.town?.trim() ||
        current.townCity,
      county:
        address.county?.trim() ||
        current.county,
      postcode:
        address.postcode
          .trim()
          .toUpperCase(),
    }));

    setFormErrors((current) => ({
      ...current,
      addressLine1: undefined,
      townCity: undefined,
      postcode: undefined,
    }));

    setAddressResults([]);
    setAddressError("");
  };

  const choosePropertyPhotos = async () => {
    setApiError("");

    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setApiError(
        "Photo-library permission is required to choose property photos.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.85,
      selectionLimit: 10,
    });

    if (result.canceled) {
      return;
    }

    const picked = result.assets.map((asset, index) => ({
      uri: asset.uri,
      name:
        asset.fileName ??
        `property-photo-${Date.now()}-${index + 1}.jpg`,
      mimeType: asset.mimeType ?? "image/jpeg",
      file: asset.file,
    }));

    setSelectedPhotos((current) => {
      const combined = [...current, ...picked];
      return combined.slice(0, 10);
    });
  };

  const uploadPropertyPhotos = async (
    propertyId: string,
  ): Promise<BackendProperty | null> => {
    if (selectedPhotos.length === 0) {
      return null;
    }

    setPhotoUploadLoading(true);

    try {
      const formData = new FormData();

      selectedPhotos.forEach((photo) => {
        if (photo.file) {
          formData.append("photos", photo.file);
          return;
        }

        formData.append(
          "photos",
          {
            uri: photo.uri,
            name: photo.name,
            type: photo.mimeType,
          } as unknown as Blob,
        );
      });

      const response = await api.post<BackendProperty>(
        `/landlord-properties/${propertyId}/photos`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      return response.data;
    } finally {
      setPhotoUploadLoading(false);
    }
  };

  const validatePropertyForm = () => {
    const errors: PropertyFormErrors = {};

    if (!propertyForm.addressLine1.trim()) {
      errors.addressLine1 =
        "Address line 1 is required.";
    }

    if (!propertyForm.townCity.trim()) {
      errors.townCity =
        "Town or city is required.";
    }

    if (!propertyForm.postcode.trim()) {
      errors.postcode =
        "Postcode is required.";
    }

    if (!propertyForm.bedrooms.trim()) {
      errors.bedrooms =
        "Number of bedrooms is required.";
    }

    if (!propertyForm.bathrooms.trim()) {
      errors.bathrooms =
        "Number of bathrooms is required.";
    }

    if (
      !propertyForm.monthlyRent.trim() ||
      Number(propertyForm.monthlyRent) <= 0
    ) {
      errors.monthlyRent =
        "Enter a valid monthly rent.";
    }

    if (
      propertyForm.depositAmount.trim() &&
      Number(propertyForm.depositAmount) < 0
    ) {
      errors.depositAmount =
        "Deposit cannot be negative.";
    }

    if (
      propertyForm.propertyStatus === "Occupied" &&
      !propertyForm.tenantName.trim()
    ) {
      errors.tenantName =
        "Tenant name is required for an occupied property.";
    }

    if (
      propertyForm.emergencyRepairPermission &&
      (!propertyForm.emergencySpendingLimit.trim() ||
        Number(
          propertyForm.emergencySpendingLimit,
        ) <= 0)
    ) {
      errors.emergencySpendingLimit =
        "Enter the emergency repair spending limit.";
    }

    if (
      propertyForm.advertisingAllowed &&
      !propertyForm.advertisingTitle.trim()
    ) {
      errors.advertisingTitle =
        "Advertising title is required.";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const saveProperty = async () => {
    if (!validatePropertyForm()) {
      return;
    }

    setSaveLoading(true);
    setApiError("");
    setApiMessage("");

    try {
      const payload =
        propertyToPayload(
          propertyForm,
        );

      let response;

      if (editingPropertyId) {
        response =
          await api.patch<BackendProperty>(
            `/landlord-properties/${editingPropertyId}`,
            payload,
          );
      } else {
        response =
          await api.post<BackendProperty>(
            "/landlord-properties",
            payload,
          );
      }

      let savedProperty =
        mapBackendProperty(
          response.data,
        );

      if (selectedPhotos.length > 0) {
        const uploadedProperty =
          await uploadPropertyPhotos(
            savedProperty.id,
          );

        if (uploadedProperty) {
          savedProperty =
            mapBackendProperty(
              uploadedProperty,
            );
        }
      }

      setProperties((current) => {
        if (editingPropertyId) {
          return current.map(
            (property) =>
              property.id ===
              editingPropertyId
                ? savedProperty
                : property,
          );
        }

        return [
          savedProperty,
          ...current,
        ];
      });

      setSelectedProperty(
        savedProperty,
      );

      setShowPropertyDialog(false);
      setEditingPropertyId(null);
      setPropertyForm({
        ...emptyProperty,
      });
      setFormErrors({});
      setAddressResults([]);
      setSelectedPhotos([]);

      setApiMessage(
        editingPropertyId
          ? "Property updated successfully and returned for approval."
          : "Property added successfully and submitted for approval.",
      );
    } catch (error: unknown) {
      setApiError(
        getApiErrorMessage(error),
      );
    } finally {
      setSaveLoading(false);
    }
  };

  const deleteSelectedProperty = async () => {
    if (!selectedProperty) {
      return;
    }

    setDeleteLoading(true);
    setApiError("");
    setApiMessage("");

    try {
      await api.delete(
        `/landlord-properties/${selectedProperty.id}`,
      );

      setProperties((current) =>
        current.filter(
          (property) =>
            property.id !==
            selectedProperty.id,
        ),
      );

      setApiMessage(
        "Property deleted successfully.",
      );

      setSelectedProperty(null);
      setShowDeleteDialog(false);
    } catch (error: unknown) {
      setApiError(
        getApiErrorMessage(error),
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchText("");
    setStatusFilter("All");
    setApprovalFilter("All");
  };

  return (
    <>
      <LandlordModuleScreen
        pageTitle="Properties"
        pageSubtitle="Add properties, manage tenancy details, maintenance preferences, compliance and advertising."
        activePage="Properties"
        primaryAction="Add property"
        primaryActionIcon="home-plus-outline"
        onPrimaryAction={openAddProperty}
        statistics={[
          {
            label: "Total properties",
            value: String(properties.length),
            icon: "office-building-outline",
            helper: `${occupiedCount} occupied`,
          },
          {
            label: "Monthly rent",
            value: formatCurrency(monthlyIncome),
            icon: "cash-multiple",
            helper: "Expected from occupied properties",
          },
          {
            label: "Vacant properties",
            value: String(vacantCount),
            icon: "home-search-outline",
            helper: "Available for tenancy",
          },
          {
            label: "Pending approval",
            value: String(pendingCount),
            icon: "clock-check-outline",
            helper: "Awaiting agent action",
          },
        ]}
      >
        <View style={styles.pageContent}>
          <View style={styles.filterCard}>
            <View
              style={[
                styles.filterRow,
                !isTablet &&
                  styles.filterRowMobile,
              ]}
            >
              <Searchbar
                placeholder="Search by address, postcode, tenant or property ID"
                value={searchText}
                onChangeText={setSearchText}
                style={styles.searchbar}
                inputStyle={styles.searchbarInput}
              />

              <View
                style={[
                  styles.filterButtons,
                  !isTablet &&
                    styles.filterButtonsMobile,
                ]}
              >
                <Menu
                  visible={showStatusMenu}
                  onDismiss={() =>
                    setShowStatusMenu(false)
                  }
                  anchor={
                    <Button
                      mode="outlined"
                      icon="home-search-outline"
                      onPress={() =>
                        setShowStatusMenu(true)
                      }
                      style={styles.filterButton}
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
                      setShowStatusMenu(false);
                    }}
                  />

                  {propertyStatusOptions.map(
                    (status) => (
                      <Menu.Item
                        key={status}
                        title={status}
                        onPress={() => {
                          setStatusFilter(status);
                          setShowStatusMenu(false);
                        }}
                      />
                    ),
                  )}
                </Menu>

                <Menu
                  visible={showApprovalMenu}
                  onDismiss={() =>
                    setShowApprovalMenu(false)
                  }
                  anchor={
                    <Button
                      mode="outlined"
                      icon="check-decagram-outline"
                      onPress={() =>
                        setShowApprovalMenu(true)
                      }
                      style={styles.filterButton}
                    >
                      {approvalFilter === "All"
                        ? "All approvals"
                        : approvalFilter}
                    </Button>
                  }
                >
                  <Menu.Item
                    title="All approvals"
                    onPress={() => {
                      setApprovalFilter("All");
                      setShowApprovalMenu(false);
                    }}
                  />

                  {approvalOptions.map(
                    (approval) => (
                      <Menu.Item
                        key={approval}
                        title={approval}
                        onPress={() => {
                          setApprovalFilter(
                            approval,
                          );
                          setShowApprovalMenu(
                            false,
                          );
                        }}
                      />
                    ),
                  )}
                </Menu>

                <Button
                  mode="text"
                  icon="filter-remove-outline"
                  onPress={clearFilters}
                >
                  Clear
                </Button>
              </View>
            </View>

            <Text style={styles.resultText}>
              Showing {filteredProperties.length} of{" "}
              {properties.length} properties
            </Text>
          </View>

          {apiError ? (
            <View style={styles.apiErrorCard}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={20}
                color={colors.error}
              />
              <Text style={styles.apiErrorText}>
                {apiError}
              </Text>
            </View>
          ) : null}

          {apiMessage ? (
            <View style={styles.apiSuccessCard}>
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={20}
                color={colors.success}
              />
              <Text style={styles.apiSuccessText}>
                {apiMessage}
              </Text>
            </View>
          ) : null}

          {propertiesLoading ? (
            <View style={styles.loadingCard}>
              <Text style={styles.loadingText}>
                Loading your properties...
              </Text>
            </View>
          ) : filteredProperties.length === 0 ? (
            <EmptyProperties
              onAddProperty={openAddProperty}
              onClearFilters={clearFilters}
            />
          ) : (
            <View
              style={[
                styles.propertyGrid,
                isDesktop
                  ? styles.propertyGridDesktop
                  : isTablet
                    ? styles.propertyGridTablet
                    : styles.propertyGridMobile,
              ]}
            >
              {filteredProperties.map(
                (property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    onView={() =>
                      openPropertyDetails(property)
                    }
                    onEdit={() =>
                      openEditProperty(property)
                    }
                    onDelete={() =>
                      requestDeleteProperty(
                        property,
                      )
                    }
                  />
                ),
              )}
            </View>
          )}
        </View>
      </LandlordModuleScreen>

      <Portal>
        <Dialog
          visible={showPropertyDialog}
          onDismiss={() =>
            setShowPropertyDialog(false)
          }
          style={styles.formDialog}
        >
          <Dialog.Title>
            {editingPropertyId
              ? "Edit property"
              : "Add property"}
          </Dialog.Title>

          <Dialog.ScrollArea
            style={styles.dialogScrollArea}
          >
            <ScrollView
              contentContainerStyle={
                styles.formContent
              }
              keyboardShouldPersistTaps="handled"
            >
              <FormSection
                icon="map-marker-outline"
                title="Property address"
                subtitle="Enter the complete UK property address."
              >
                <ResponsiveFields>
                  <FormTextInput
                    label="Address line 1 *"
                    value={
                      propertyForm.addressLine1
                    }
                    onChangeText={(value) =>
                      updateForm(
                        "addressLine1",
                        value,
                      )
                    }
                    error={
                      formErrors.addressLine1
                    }
                    icon="home-outline"
                  />

                  <FormTextInput
                    label="Address line 2"
                    value={
                      propertyForm.addressLine2
                    }
                    onChangeText={(value) =>
                      updateForm(
                        "addressLine2",
                        value,
                      )
                    }
                    icon="home-city-outline"
                  />

                  <FormTextInput
                    label="Town or city *"
                    value={propertyForm.townCity}
                    onChangeText={(value) =>
                      updateForm(
                        "townCity",
                        value,
                      )
                    }
                    error={formErrors.townCity}
                    icon="city-variant-outline"
                  />

                  <FormTextInput
                    label="County"
                    value={propertyForm.county}
                    onChangeText={(value) =>
                      updateForm(
                        "county",
                        value,
                      )
                    }
                    icon="map-outline"
                  />

                  <FormTextInput
                    label="Postcode *"
                    value={propertyForm.postcode}
                    onChangeText={(value) =>
                      updateForm(
                        "postcode",
                        value.toUpperCase(),
                      )
                    }
                    error={formErrors.postcode}
                    icon="mailbox-outline"
                    autoCapitalize="characters"
                  />
                </ResponsiveFields>

                <View style={styles.addressLookupActions}>
                  <Button
                    mode="outlined"
                    icon="home-search-outline"
                    loading={addressLoading}
                    disabled={
                      addressLoading ||
                      !propertyForm.postcode.trim()
                    }
                    onPress={findPropertyAddresses}
                  >
                    Find address from postcode
                  </Button>

                  {addressError ? (
                    <Text style={styles.addressLookupError}>
                      {addressError}
                    </Text>
                  ) : null}
                </View>

                {addressResults.length > 0 ? (
                  <View style={styles.addressResultsBox}>
                    <Text style={styles.addressResultsTitle}>
                      Select the property address
                    </Text>

                    <ScrollView
                      nestedScrollEnabled
                      style={styles.addressResultsList}
                      keyboardShouldPersistTaps="handled"
                    >
                      {addressResults.map(
                        (address, index) => (
                          <Pressable
                            key={`${address.id}-${index}`}
                            style={({ pressed }) => [
                              styles.addressResultRow,
                              pressed &&
                                styles.addressResultRowPressed,
                            ]}
                            onPress={() =>
                              selectPropertyAddress(
                                address,
                              )
                            }
                          >
                            <MaterialCommunityIcons
                              name="map-marker-outline"
                              size={20}
                              color={colors.primary}
                            />

                            <Text
                              style={styles.addressResultText}
                            >
                              {address.displayAddress}
                            </Text>

                            <MaterialCommunityIcons
                              name="chevron-right"
                              size={20}
                              color={colors.textMuted}
                            />
                          </Pressable>
                        ),
                      )}
                    </ScrollView>
                  </View>
                ) : null}
              </FormSection>

              <FormSection
                icon="home-city-outline"
                title="Property information"
                subtitle="Set the property type, rooms, furnishing and availability."
              >
                <SelectionGroup
                  label="Property type"
                  value={propertyForm.propertyType}
                  options={propertyTypes}
                  onSelect={(value) =>
                    updateForm(
                      "propertyType",
                      value,
                    )
                  }
                />

                <ResponsiveFields>
                  <FormTextInput
                    label="Bedrooms *"
                    value={propertyForm.bedrooms}
                    onChangeText={(value) =>
                      updateForm(
                        "bedrooms",
                        numbersOnly(value),
                      )
                    }
                    error={formErrors.bedrooms}
                    keyboardType="number-pad"
                    icon="bed-outline"
                  />

                  <FormTextInput
                    label="Bathrooms *"
                    value={propertyForm.bathrooms}
                    onChangeText={(value) =>
                      updateForm(
                        "bathrooms",
                        numbersOnly(value),
                      )
                    }
                    error={formErrors.bathrooms}
                    keyboardType="number-pad"
                    icon="shower"
                  />

                  <FormTextInput
                    label="Reception rooms"
                    value={
                      propertyForm.receptionRooms
                    }
                    onChangeText={(value) =>
                      updateForm(
                        "receptionRooms",
                        numbersOnly(value),
                      )
                    }
                    keyboardType="number-pad"
                    icon="sofa-outline"
                  />

                  <DateSelectField
                    label="Available from"
                    value={
                      propertyForm.availableFrom
                    }
                    placeholder="Select a date"
                    onPress={
                      openAvailableDatePicker
                    }
                  />
                </ResponsiveFields>

                <SelectionGroup
                  label="Furnishing"
                  value={
                    propertyForm.furnishingStatus
                  }
                  options={furnishingOptions}
                  onSelect={(value) =>
                    updateForm(
                      "furnishingStatus",
                      value,
                    )
                  }
                />

                <SelectionGroup
                  label="Property status"
                  value={
                    propertyForm.propertyStatus
                  }
                  options={propertyStatusOptions}
                  onSelect={(value) =>
                    updateForm(
                      "propertyStatus",
                      value,
                    )
                  }
                />

                <View style={styles.approvalInfoCard}>
                  <MaterialCommunityIcons
                    name="clock-check-outline"
                    size={22}
                    color={colors.primary}
                  />

                  <View style={styles.approvalInfoText}>
                    <Text style={styles.approvalInfoTitle}>
                      Agent approval
                    </Text>
                    <Text style={styles.approvalInfoDescription}>
                      {editingPropertyId
                        ? "Saving changes will return this property to Pending approval."
                        : "New properties are automatically submitted as Pending approval."}
                    </Text>
                  </View>
                </View>
              </FormSection>

              <FormSection
                icon="cash-multiple"
                title="Rent and deposit"
                subtitle="Enter all financial information in pounds sterling."
              >
                <ResponsiveFields>
                  <FormTextInput
                    label="Monthly rent (£) *"
                    value={
                      propertyForm.monthlyRent
                    }
                    onChangeText={(value) =>
                      updateForm(
                        "monthlyRent",
                        decimalOnly(value),
                      )
                    }
                    error={
                      formErrors.monthlyRent
                    }
                    keyboardType="decimal-pad"
                    icon="currency-gbp"
                  />

                  <FormTextInput
                    label="Deposit amount (£)"
                    value={
                      propertyForm.depositAmount
                    }
                    onChangeText={(value) =>
                      updateForm(
                        "depositAmount",
                        decimalOnly(value),
                      )
                    }
                    error={
                      formErrors.depositAmount
                    }
                    keyboardType="decimal-pad"
                    icon="safe"
                  />

                  <FormTextInput
                    label="Council tax band"
                    value={
                      propertyForm.councilTaxBand
                    }
                    onChangeText={(value) =>
                      updateForm(
                        "councilTaxBand",
                        value.toUpperCase(),
                      )
                    }
                    placeholder="For example, C"
                    icon="bank-outline"
                    autoCapitalize="characters"
                  />
                </ResponsiveFields>
              </FormSection>

              {propertyForm.propertyStatus ===
              "Occupied" ? (
                <FormSection
                  icon="account-key-outline"
                  title="Current tenant"
                  subtitle="Tenant information is required for occupied properties."
                >
                  <ResponsiveFields>
                    <FormTextInput
                      label="Tenant name *"
                      value={
                        propertyForm.tenantName
                      }
                      onChangeText={(value) =>
                        updateForm(
                          "tenantName",
                          value,
                        )
                      }
                      error={
                        formErrors.tenantName
                      }
                      icon="account-outline"
                    />

                    <FormTextInput
                      label="Tenant email"
                      value={
                        propertyForm.tenantEmail
                      }
                      onChangeText={(value) =>
                        updateForm(
                          "tenantEmail",
                          value,
                        )
                      }
                      keyboardType="email-address"
                      autoCapitalize="none"
                      icon="email-outline"
                    />

                    <FormTextInput
                      label="Tenant phone"
                      value={
                        propertyForm.tenantPhone
                      }
                      onChangeText={(value) =>
                        updateForm(
                          "tenantPhone",
                          value,
                        )
                      }
                      keyboardType="phone-pad"
                      icon="phone-outline"
                    />
                  </ResponsiveFields>
                </FormSection>
              ) : null}

              <FormSection
                icon="home-heart"
                title="Household and property rules"
                subtitle="Set the rules applicants and tenants must follow."
              >
                <ToggleRow
                  icon="paw-outline"
                  title="Pets allowed"
                  description="Applicants may apply with pets."
                  value={
                    propertyForm.petsAllowed
                  }
                  onValueChange={(value) =>
                    updateForm(
                      "petsAllowed",
                      value,
                    )
                  }
                />

                <ToggleRow
                  icon="smoking-off"
                  title="Smoking allowed"
                  description="Smoking is permitted inside the property."
                  value={
                    propertyForm.smokingAllowed
                  }
                  onValueChange={(value) =>
                    updateForm(
                      "smokingAllowed",
                      value,
                    )
                  }
                />

                <ToggleRow
                  icon="human-male-child"
                  title="Children allowed"
                  description="Households with children may apply."
                  value={
                    propertyForm.childrenAllowed
                  }
                  onValueChange={(value) =>
                    updateForm(
                      "childrenAllowed",
                      value,
                    )
                  }
                />
              </FormSection>

              <FormSection
                icon="home-plus-outline"
                title="Property features"
                subtitle="Select the facilities available at the property."
              >
                <CheckboxGrid>
                  <CheckboxOption
                    label="Parking"
                    icon="car-outline"
                    checked={
                      propertyForm.hasParking
                    }
                    onPress={() =>
                      updateForm(
                        "hasParking",
                        !propertyForm.hasParking,
                      )
                    }
                  />

                  <CheckboxOption
                    label="Garden"
                    icon="flower-outline"
                    checked={
                      propertyForm.hasGarden
                    }
                    onPress={() =>
                      updateForm(
                        "hasGarden",
                        !propertyForm.hasGarden,
                      )
                    }
                  />

                  <CheckboxOption
                    label="Lift"
                    icon="elevator"
                    checked={
                      propertyForm.hasLift
                    }
                    onPress={() =>
                      updateForm(
                        "hasLift",
                        !propertyForm.hasLift,
                      )
                    }
                  />

                  <CheckboxOption
                    label="Wheelchair access"
                    icon="wheelchair-accessibility"
                    checked={
                      propertyForm.hasWheelchairAccess
                    }
                    onPress={() =>
                      updateForm(
                        "hasWheelchairAccess",
                        !propertyForm.hasWheelchairAccess,
                      )
                    }
                  />
                </CheckboxGrid>
              </FormSection>

              <FormSection
                icon="text-box-outline"
                title="Description and notes"
                subtitle="Add information that agents, applicants and tenants should know."
              >
                <FormTextInput
                  label="Property description"
                  value={
                    propertyForm.description
                  }
                  onChangeText={(value) =>
                    updateForm(
                      "description",
                      value,
                    )
                  }
                  multiline
                  numberOfLines={5}
                  icon="text-long"
                />

                <FormTextInput
                  label="Special instructions or notes"
                  value={
                    propertyForm.specialNotes
                  }
                  onChangeText={(value) =>
                    updateForm(
                      "specialNotes",
                      value,
                    )
                  }
                  multiline
                  numberOfLines={4}
                  icon="note-text-outline"
                />
              </FormSection>

              <FormSection
                icon="flash-outline"
                title="Utilities and council"
                subtitle="Record supplier and local council information."
              >
                <ResponsiveFields>
                  <FormTextInput
                    label="Gas supplier"
                    value={
                      propertyForm.gasSupplier
                    }
                    onChangeText={(value) =>
                      updateForm(
                        "gasSupplier",
                        value,
                      )
                    }
                    icon="fire"
                  />

                  <FormTextInput
                    label="Electricity supplier"
                    value={
                      propertyForm.electricitySupplier
                    }
                    onChangeText={(value) =>
                      updateForm(
                        "electricitySupplier",
                        value,
                      )
                    }
                    icon="flash-outline"
                  />

                  <FormTextInput
                    label="Water supplier"
                    value={
                      propertyForm.waterSupplier
                    }
                    onChangeText={(value) =>
                      updateForm(
                        "waterSupplier",
                        value,
                      )
                    }
                    icon="water-outline"
                  />

                  <FormTextInput
                    label="Local council"
                    value={
                      propertyForm.councilName
                    }
                    onChangeText={(value) =>
                      updateForm(
                        "councilName",
                        value,
                      )
                    }
                    icon="office-building-outline"
                  />
                </ResponsiveFields>
              </FormSection>

              <FormSection
                icon="shield-check-outline"
                title="Compliance certificates"
                subtitle="Enter the certificate expiry dates."
              >
                <ResponsiveFields>
                  <FormTextInput
                    label="Gas Safety expiry"
                    value={
                      propertyForm.gasSafetyExpiry
                    }
                    onChangeText={(value) =>
                      updateForm(
                        "gasSafetyExpiry",
                        value,
                      )
                    }
                    placeholder="DD Month YYYY"
                    icon="fire-alert"
                  />

                  <FormTextInput
                    label="EPC expiry"
                    value={
                      propertyForm.epcExpiry
                    }
                    onChangeText={(value) =>
                      updateForm(
                        "epcExpiry",
                        value,
                      )
                    }
                    placeholder="DD Month YYYY"
                    icon="home-lightning-bolt-outline"
                  />

                  <FormTextInput
                    label="EICR expiry"
                    value={
                      propertyForm.eicrExpiry
                    }
                    onChangeText={(value) =>
                      updateForm(
                        "eicrExpiry",
                        value,
                      )
                    }
                    placeholder="DD Month YYYY"
                    icon="lightning-bolt-outline"
                  />
                </ResponsiveFields>
              </FormSection>

              <FormSection
                icon="tools"
                title="Maintenance preferences"
                subtitle="Choose how maintenance requests should be handled."
              >
                <SelectionGroup
                  label="Maintenance request route"
                  value={
                    propertyForm.maintenanceRoute
                  }
                  options={
                    maintenanceRouteOptions
                  }
                  onSelect={(value) =>
                    updateForm(
                      "maintenanceRoute",
                      value,
                    )
                  }
                />

                <FormTextInput
                  label="Preferred contractor"
                  value={
                    propertyForm.preferredContractor
                  }
                  onChangeText={(value) =>
                    updateForm(
                      "preferredContractor",
                      value,
                    )
                  }
                  placeholder="Contractor or company name"
                  icon="account-hard-hat-outline"
                />

                <ToggleRow
                  icon="alert-decagram-outline"
                  title="Allow emergency repairs"
                  description="The agent may arrange urgent repairs without waiting for approval."
                  value={
                    propertyForm.emergencyRepairPermission
                  }
                  onValueChange={(value) =>
                    updateForm(
                      "emergencyRepairPermission",
                      value,
                    )
                  }
                />

                {propertyForm.emergencyRepairPermission ? (
                  <FormTextInput
                    label="Emergency spending limit (£) *"
                    value={
                      propertyForm.emergencySpendingLimit
                    }
                    onChangeText={(value) =>
                      updateForm(
                        "emergencySpendingLimit",
                        decimalOnly(value),
                      )
                    }
                    error={
                      formErrors.emergencySpendingLimit
                    }
                    keyboardType="decimal-pad"
                    icon="currency-gbp"
                  />
                ) : null}
              </FormSection>

              <FormSection
                icon="bullhorn-outline"
                title="Advertising"
                subtitle="Allow the agent to advertise the property after approval."
              >
                <ToggleRow
                  icon="advertisements"
                  title="Allow advertising"
                  description="The property may be published after the agent approves it."
                  value={
                    propertyForm.advertisingAllowed
                  }
                  onValueChange={(value) =>
                    updateForm(
                      "advertisingAllowed",
                      value,
                    )
                  }
                />

                {propertyForm.advertisingAllowed ? (
                  <FormTextInput
                    label="Advertising title *"
                    value={
                      propertyForm.advertisingTitle
                    }
                    onChangeText={(value) =>
                      updateForm(
                        "advertisingTitle",
                        value,
                      )
                    }
                    error={
                      formErrors.advertisingTitle
                    }
                    icon="format-title"
                  />
                ) : null}
              </FormSection>

              <FormSection
                icon="image-multiple-outline"
                title="Property photos"
                subtitle="Choose real JPG, PNG or WEBP property photos. Up to 10 images can be uploaded."
              >
                <View style={styles.photoUploadBox}>
                  <MaterialCommunityIcons
                    name="cloud-upload-outline"
                    size={38}
                    color={colors.primary}
                  />

                  <Text style={styles.photoUploadTitle}>
                    Choose property photos
                  </Text>

                  <Text style={styles.photoUploadText}>
                    Photos are uploaded after the property record is saved.
                  </Text>

                  <Button
                    mode="outlined"
                    icon="image-plus"
                    onPress={() => void choosePropertyPhotos()}
                    disabled={saveLoading || photoUploadLoading}
                  >
                    Choose photos
                  </Button>
                </View>

                {selectedPhotos.length > 0 ? (
                  <View style={styles.photoList}>
                    {selectedPhotos.map((photo, index) => (
                      <View
                        key={`${photo.uri}-${index}`}
                        style={styles.photoItem}
                      >
                        <Image
                          source={{ uri: photo.uri }}
                          style={styles.photoThumbnail}
                        />

                        <Text
                          style={styles.photoName}
                          numberOfLines={1}
                        >
                          {photo.name}
                        </Text>

                        <Pressable
                          onPress={() =>
                            setSelectedPhotos((current) =>
                              current.filter(
                                (_, photoIndex) =>
                                  photoIndex !== index,
                              ),
                            )
                          }
                          style={styles.removePhotoButton}
                        >
                          <MaterialCommunityIcons
                            name="close"
                            size={18}
                            color={colors.error}
                          />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                ) : null}

                {propertyForm.photoNames.length > 0 ? (
                  <View style={styles.existingPhotoGrid}>
                    {propertyForm.photoNames.map(
                      (photoName, index) => (
                        <Image
                          key={`${photoName}-${index}`}
                          source={{
                            uri: getPropertyPhotoUrl(photoName),
                          }}
                          style={styles.existingPhoto}
                        />
                      ),
                    )}
                  </View>
                ) : null}
              </FormSection>
            </ScrollView>
          </Dialog.ScrollArea>

          <Dialog.Actions>
            <Button
              onPress={() =>
                setShowPropertyDialog(false)
              }
            >
              Cancel
            </Button>

            <Button
              mode="contained"
              icon="content-save-outline"
              loading={saveLoading}
              disabled={saveLoading || photoUploadLoading}
              onPress={saveProperty}
            >
              {editingPropertyId
                ? "Save changes"
                : "Add property"}
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={showDetailsDialog}
          onDismiss={() =>
            setShowDetailsDialog(false)
          }
          style={styles.detailsDialog}
        >
          {selectedProperty ? (
            <>
              <Dialog.Title>
                Property details
              </Dialog.Title>

              <Dialog.ScrollArea
                style={styles.dialogScrollArea}
              >
                <ScrollView
                  contentContainerStyle={
                    styles.detailsContent
                  }
                >
                  <PropertyDetails
                    property={selectedProperty}
                  />
                </ScrollView>
              </Dialog.ScrollArea>

              <Dialog.Actions>
                <Button
                  textColor={colors.error}
                  icon="delete-outline"
                  onPress={() =>
                    requestDeleteProperty(
                      selectedProperty,
                    )
                  }
                >
                  Delete
                </Button>

                <Button
                  icon="pencil-outline"
                  onPress={() =>
                    openEditProperty(
                      selectedProperty,
                    )
                  }
                >
                  Edit
                </Button>

                <Button
                  mode="contained"
                  onPress={() =>
                    setShowDetailsDialog(false)
                  }
                >
                  Close
                </Button>
              </Dialog.Actions>
            </>
          ) : null}
        </Dialog>

        <Dialog
          visible={showAvailableDateDialog}
          onDismiss={() =>
            setShowAvailableDateDialog(false)
          }
          style={styles.calendarDialog}
        >
          <Dialog.Title>
            Select available date
          </Dialog.Title>

          <Dialog.Content>
            <CalendarPicker
              month={availableCalendarMonth}
              selectedDate={
                parseDisplayDate(
                  propertyForm.availableFrom,
                )
              }
              onPreviousMonth={() =>
                setAvailableCalendarMonth(
                  addMonths(
                    availableCalendarMonth,
                    -1,
                  ),
                )
              }
              onNextMonth={() =>
                setAvailableCalendarMonth(
                  addMonths(
                    availableCalendarMonth,
                    1,
                  ),
                )
              }
              onSelectDate={
                selectAvailableDate
              }
            />
          </Dialog.Content>

          <Dialog.Actions>
            <Button
              onPress={() => {
                updateForm(
                  "availableFrom",
                  "",
                );

                setShowAvailableDateDialog(
                  false,
                );
              }}
            >
              Clear
            </Button>

            <Button
              onPress={() =>
                setShowAvailableDateDialog(false)
              }
            >
              Cancel
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={showDeleteDialog}
          onDismiss={() =>
            setShowDeleteDialog(false)
          }
        >
          <Dialog.Icon icon="alert-outline" />

          <Dialog.Title>
            Delete property?
          </Dialog.Title>

          <Dialog.Content>
            <Text style={styles.deleteText}>
              {selectedProperty
                ? `Are you sure you want to delete ${selectedProperty.addressLine1}, ${selectedProperty.townCity}?`
                : "Are you sure you want to delete this property?"}
            </Text>

            <Text
              style={styles.deleteWarning}
            >
              This action cannot be undone.
            </Text>
          </Dialog.Content>

          <Dialog.Actions>
            <Button
              onPress={() =>
                setShowDeleteDialog(false)
              }
            >
              Cancel
            </Button>

            <Button
              mode="contained"
              buttonColor={colors.error}
              icon="delete-outline"
              loading={deleteLoading}
              disabled={deleteLoading}
              onPress={deleteSelectedProperty}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

function PropertyCard({
  property,
  onView,
  onEdit,
  onDelete,
}: {
  property: Property;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.propertyCard,
        pressed &&
          styles.propertyCardPressed,
      ]}
      onPress={onView}
      accessibilityRole="button"
      accessibilityLabel={`View ${property.addressLine1}`}
    >
      <View style={styles.propertyImage}>
        {property.photoNames.length > 0 ? (
          <Image
            source={{
              uri: getPropertyPhotoUrl(
                property.photoNames[0],
              ),
            }}
            style={styles.propertyImagePhoto}
          />
        ) : (
          <MaterialCommunityIcons
            name="home-city-outline"
            size={42}
            color={colors.primary}
          />
        )}

        <View
          style={styles.propertyIdBadge}
        >
          <Text
            style={styles.propertyIdText}
          >
            {property.id}
          </Text>
        </View>
      </View>

      <View style={styles.propertyCardContent}>
        <View style={styles.propertyTitleRow}>
          <View style={styles.propertyTitleArea}>
            <Text
              style={styles.propertyAddress}
              numberOfLines={1}
            >
              {property.addressLine1}
            </Text>

            <Text
              style={styles.propertyLocation}
              numberOfLines={1}
            >
              {property.townCity},{" "}
              {property.postcode}
            </Text>
          </View>

          <PropertyStatusBadge
            text={property.propertyStatus}
            type={
              property.propertyStatus ===
              "Occupied"
                ? "success"
                : property.propertyStatus ===
                    "Vacant"
                  ? "warning"
                  : "primary"
            }
          />
        </View>

        <View style={styles.propertyFacts}>
          <PropertyFact
            icon="home-outline"
            text={property.propertyType}
          />

          <PropertyFact
            icon="bed-outline"
            text={`${property.bedrooms || "0"} beds`}
          />

          <PropertyFact
            icon="shower"
            text={`${property.bathrooms || "0"} baths`}
          />
        </View>

        <Divider style={styles.cardDivider} />

        <View style={styles.propertyRentRow}>
          <View>
            <Text
              style={styles.propertyRentValue}
            >
              {formatCurrency(
                Number(property.monthlyRent) ||
                  0,
              )}
            </Text>

            <Text
              style={styles.propertyRentLabel}
            >
              per month
            </Text>
          </View>

          <PropertyStatusBadge
            text={property.approvalStatus}
            type={
              property.approvalStatus ===
              "Approved"
                ? "success"
                : property.approvalStatus ===
                    "Rejected"
                  ? "error"
                  : "warning"
            }
          />
        </View>

        <View style={styles.tenantBox}>
          <MaterialCommunityIcons
            name={
              property.propertyStatus ===
              "Occupied"
                ? "account-key-outline"
                : "account-off-outline"
            }
            size={20}
            color={colors.primary}
          />

          <View style={styles.tenantContent}>
            <Text
              style={styles.tenantLabel}
            >
              {property.propertyStatus ===
              "Occupied"
                ? "Current tenant"
                : "Availability"}
            </Text>

            <Text
              style={styles.tenantName}
              numberOfLines={1}
            >
              {property.propertyStatus ===
              "Occupied"
                ? property.tenantName ||
                  "Tenant not entered"
                : property.availableFrom ||
                  "Available now"}
            </Text>
          </View>
        </View>

        <View
          style={styles.propertyFeatureRow}
        >
          <SmallFeature
            icon="paw-outline"
            label={
              property.petsAllowed
                ? "Pets allowed"
                : "No pets"
            }
          />

          <SmallFeature
            icon="tools"
            label={property.maintenanceRoute}
          />
        </View>

        <View style={styles.cardActions}>
          <Button
            mode="text"
            icon="eye-outline"
            onPress={onView}
            compact
          >
            View
          </Button>

          <Button
            mode="text"
            icon="pencil-outline"
            onPress={onEdit}
            compact
          >
            Edit
          </Button>

          <Button
            mode="text"
            icon="delete-outline"
            textColor={colors.error}
            onPress={onDelete}
            compact
          >
            Delete
          </Button>
        </View>
      </View>
    </Pressable>
  );
}

function PropertyDetails({
  property,
}: {
  property: Property;
}) {
  return (
    <View style={styles.detailsWrapper}>
      <View style={styles.detailsHero}>
        <View style={styles.detailsHeroIcon}>
          <MaterialCommunityIcons
            name="home-city-outline"
            size={38}
            color={colors.primary}
          />
        </View>

        <View style={styles.detailsHeroText}>
          <Text style={styles.detailsAddress}>
            {property.addressLine1}
          </Text>

          {property.addressLine2 ? (
            <Text style={styles.detailsLocation}>
              {property.addressLine2}
            </Text>
          ) : null}

          <Text style={styles.detailsLocation}>
            {property.townCity},{" "}
            {property.county},{" "}
            {property.postcode}
          </Text>

          <View style={styles.detailsBadges}>
            <PropertyStatusBadge
              text={property.propertyStatus}
              type={
                property.propertyStatus ===
                "Occupied"
                  ? "success"
                  : property.propertyStatus ===
                      "Vacant"
                    ? "warning"
                    : "primary"
              }
            />

            <PropertyStatusBadge
              text={property.approvalStatus}
              type={
                property.approvalStatus ===
                "Approved"
                  ? "success"
                  : property.approvalStatus ===
                      "Rejected"
                    ? "error"
                    : "warning"
              }
            />
          </View>
        </View>
      </View>

      <DetailsSection
        icon="home-outline"
        title="Property"
      >
        <DetailsGrid>
          <DetailItem
            label="Property ID"
            value={property.id}
          />

          <DetailItem
            label="Type"
            value={property.propertyType}
          />

          <DetailItem
            label="Bedrooms"
            value={property.bedrooms || "—"}
          />

          <DetailItem
            label="Bathrooms"
            value={property.bathrooms || "—"}
          />

          <DetailItem
            label="Reception rooms"
            value={
              property.receptionRooms || "—"
            }
          />

          <DetailItem
            label="Furnishing"
            value={
              property.furnishingStatus
            }
          />

          <DetailItem
            label="Monthly rent"
            value={formatCurrency(
              Number(property.monthlyRent) ||
                0,
            )}
          />

          <DetailItem
            label="Deposit"
            value={
              property.depositAmount
                ? formatCurrency(
                    Number(
                      property.depositAmount,
                    ),
                  )
                : "—"
            }
          />

          <DetailItem
            label="Council tax band"
            value={
              property.councilTaxBand || "—"
            }
          />

          <DetailItem
            label="Available from"
            value={
              property.availableFrom ||
              "Not specified"
            }
          />
        </DetailsGrid>
      </DetailsSection>

      <DetailsSection
        icon="account-key-outline"
        title="Tenant"
      >
        <DetailsGrid>
          <DetailItem
            label="Tenant name"
            value={
              property.tenantName ||
              "No active tenant"
            }
          />

          <DetailItem
            label="Email"
            value={
              property.tenantEmail || "—"
            }
          />

          <DetailItem
            label="Phone"
            value={
              property.tenantPhone || "—"
            }
          />
        </DetailsGrid>
      </DetailsSection>

      <DetailsSection
        icon="home-heart"
        title="Rules and features"
      >
        <View style={styles.detailsChips}>
          <DetailChip
            icon="paw-outline"
            text={
              property.petsAllowed
                ? "Pets allowed"
                : "Pets not allowed"
            }
            active={
              property.petsAllowed
            }
          />

          <DetailChip
            icon="smoking-off"
            text={
              property.smokingAllowed
                ? "Smoking allowed"
                : "No smoking"
            }
            active={
              property.smokingAllowed
            }
          />

          <DetailChip
            icon="human-male-child"
            text={
              property.childrenAllowed
                ? "Children allowed"
                : "No children"
            }
            active={
              property.childrenAllowed
            }
          />

          <DetailChip
            icon="car-outline"
            text="Parking"
            active={property.hasParking}
          />

          <DetailChip
            icon="flower-outline"
            text="Garden"
            active={property.hasGarden}
          />

          <DetailChip
            icon="elevator"
            text="Lift"
            active={property.hasLift}
          />

          <DetailChip
            icon="wheelchair-accessibility"
            text="Wheelchair access"
            active={
              property.hasWheelchairAccess
            }
          />
        </View>
      </DetailsSection>

      <DetailsSection
        icon="tools"
        title="Maintenance"
      >
        <DetailsGrid>
          <DetailItem
            label="Request route"
            value={
              property.maintenanceRoute
            }
          />

          <DetailItem
            label="Preferred contractor"
            value={
              property.preferredContractor ||
              "Not specified"
            }
          />

          <DetailItem
            label="Emergency repairs"
            value={
              property.emergencyRepairPermission
                ? "Allowed"
                : "Approval required"
            }
          />

          <DetailItem
            label="Emergency limit"
            value={
              property.emergencySpendingLimit
                ? formatCurrency(
                    Number(
                      property.emergencySpendingLimit,
                    ),
                  )
                : "Not set"
            }
          />
        </DetailsGrid>
      </DetailsSection>

      <DetailsSection
        icon="shield-check-outline"
        title="Compliance"
      >
        <DetailsGrid>
          <DetailItem
            label="Gas Safety expiry"
            value={
              property.gasSafetyExpiry ||
              "Not entered"
            }
          />

          <DetailItem
            label="EPC expiry"
            value={
              property.epcExpiry ||
              "Not entered"
            }
          />

          <DetailItem
            label="EICR expiry"
            value={
              property.eicrExpiry ||
              "Not entered"
            }
          />
        </DetailsGrid>
      </DetailsSection>

      <DetailsSection
        icon="flash-outline"
        title="Utilities and council"
      >
        <DetailsGrid>
          <DetailItem
            label="Gas"
            value={
              property.gasSupplier ||
              "Not entered"
            }
          />

          <DetailItem
            label="Electricity"
            value={
              property.electricitySupplier ||
              "Not entered"
            }
          />

          <DetailItem
            label="Water"
            value={
              property.waterSupplier ||
              "Not entered"
            }
          />

          <DetailItem
            label="Council"
            value={
              property.councilName ||
              "Not entered"
            }
          />
        </DetailsGrid>
      </DetailsSection>

      <DetailsSection
        icon="bullhorn-outline"
        title="Advertising"
      >
        <DetailsGrid>
          <DetailItem
            label="Advertising allowed"
            value={
              property.advertisingAllowed
                ? "Yes"
                : "No"
            }
          />

          <DetailItem
            label="Advertising title"
            value={
              property.advertisingTitle ||
              "Not entered"
            }
          />
        </DetailsGrid>
      </DetailsSection>

      <DetailsSection
        icon="text-box-outline"
        title="Description and notes"
      >
        <Text style={styles.detailsParagraph}>
          {property.description ||
            "No description entered."}
        </Text>

        <Text
          style={styles.detailsNotesHeading}
        >
          Special notes
        </Text>

        <Text style={styles.detailsParagraph}>
          {property.specialNotes ||
            "No special notes entered."}
        </Text>
      </DetailsSection>

      <DetailsSection
        icon="image-multiple-outline"
        title="Photos"
      >
        {property.photoNames.length > 0 ? (
          <View style={styles.detailsPhotoGrid}>
            {property.photoNames.map(
              (photoName, index) => (
                <Image
                  key={`${photoName}-${index}`}
                  source={{
                    uri: getPropertyPhotoUrl(photoName),
                  }}
                  style={styles.detailsPhoto}
                />
              ),
            )}
          </View>
        ) : (
          <Text style={styles.emptyDetailsText}>
            No photos added.
          </Text>
        )}
      </DetailsSection>
    </View>
  );
}

function EmptyProperties({
  onAddProperty,
  onClearFilters,
}: {
  onAddProperty: () => void;
  onClearFilters: () => void;
}) {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIcon}>
        <MaterialCommunityIcons
          name="home-search-outline"
          size={42}
          color={colors.primary}
        />
      </View>

      <Text style={styles.emptyTitle}>
        No properties found
      </Text>

      <Text style={styles.emptyText}>
        Change your search or filters, or add a
        new property.
      </Text>

      <View style={styles.emptyActions}>
        <Button
          mode="outlined"
          icon="filter-remove-outline"
          onPress={onClearFilters}
        >
          Clear filters
        </Button>

        <Button
          mode="contained"
          icon="home-plus-outline"
          onPress={onAddProperty}
        >
          Add property
        </Button>
      </View>
    </View>
  );
}

function FormSection({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.formSection}>
      <View style={styles.formSectionHeader}>
        <View style={styles.formSectionIcon}>
          <MaterialCommunityIcons
            name={icon}
            size={21}
            color={colors.primary}
          />
        </View>

        <View style={styles.formSectionHeading}>
          <Text style={styles.formSectionTitle}>
            {title}
          </Text>

          <Text
            style={styles.formSectionSubtitle}
          >
            {subtitle}
          </Text>
        </View>
      </View>

      <View style={styles.formSectionBody}>
        {children}
      </View>
    </View>
  );
}

function startOfMonth(
  date: Date,
) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1,
  );
}

function addMonths(
  date: Date,
  amount: number,
) {
  return new Date(
    date.getFullYear(),
    date.getMonth() + amount,
    1,
  );
}

function formatDisplayDate(
  date: Date,
) {
  return date.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
  );
}

function parseDisplayDate(
  value: string,
): Date | null {
  if (!value.trim()) {
    return null;
  }

  const parsed =
    new Date(value);

  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    return null;
  }

  return new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate(),
  );
}

function sameCalendarDay(
  first: Date,
  second: Date,
) {
  return (
    first.getFullYear() ===
      second.getFullYear() &&
    first.getMonth() ===
      second.getMonth() &&
    first.getDate() ===
      second.getDate()
  );
}

function getCalendarDays(
  month: Date,
) {
  const firstDay =
    startOfMonth(month);

  const mondayBasedIndex =
    (firstDay.getDay() + 6) %
    7;

  const gridStart =
    new Date(
      firstDay.getFullYear(),
      firstDay.getMonth(),
      firstDay.getDate() -
        mondayBasedIndex,
    );

  return Array.from(
    {
      length: 42,
    },
    (_, index) =>
      new Date(
        gridStart.getFullYear(),
        gridStart.getMonth(),
        gridStart.getDate() +
          index,
      ),
  );
}

function ResponsiveFields({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <View style={styles.responsiveFields}>
      {children}
    </View>
  );
}

function DateSelectField({
  label,
  value,
  placeholder,
  onPress,
}: {
  label: string;
  value: string;
  placeholder: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.inputWrapper}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${label}. ${
          value || placeholder
        }`}
        style={({ pressed }) => [
          styles.dateSelectField,
          pressed &&
            styles.dateSelectFieldPressed,
        ]}
      >
        <MaterialCommunityIcons
          name="calendar-month-outline"
          size={22}
          color={colors.primary}
        />

        <View style={styles.dateSelectTextArea}>
          <Text style={styles.dateSelectLabel}>
            {label}
          </Text>

          <Text
            style={[
              styles.dateSelectValue,
              !value &&
                styles.dateSelectPlaceholder,
            ]}
          >
            {value || placeholder}
          </Text>
        </View>

        <MaterialCommunityIcons
          name="chevron-down"
          size={22}
          color={colors.textMuted}
        />
      </Pressable>
    </View>
  );
}

function CalendarPicker({
  month,
  selectedDate,
  onPreviousMonth,
  onNextMonth,
  onSelectDate,
}: {
  month: Date;
  selectedDate: Date | null;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (date: Date) => void;
}) {
  const days = getCalendarDays(month);

  const weekDayNames = [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
  ];

  return (
    <View style={styles.calendarPicker}>
      <View style={styles.calendarHeader}>
        <Pressable
          onPress={onPreviousMonth}
          style={styles.calendarNavButton}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={24}
            color={colors.primary}
          />
        </Pressable>

        <Text style={styles.calendarMonthTitle}>
          {month.toLocaleDateString(
            "en-GB",
            {
              month: "long",
              year: "numeric",
            },
          )}
        </Text>

        <Pressable
          onPress={onNextMonth}
          style={styles.calendarNavButton}
          accessibilityRole="button"
          accessibilityLabel="Next month"
        >
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={colors.primary}
          />
        </Pressable>
      </View>

      <View style={styles.calendarWeekHeader}>
        {weekDayNames.map((day) => (
          <Text
            key={day}
            style={styles.calendarWeekDay}
          >
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {days.map((date) => {
          const inCurrentMonth =
            date.getMonth() ===
            month.getMonth();

          const selected =
            Boolean(
              selectedDate &&
                sameCalendarDay(
                  date,
                  selectedDate,
                ),
            );

          const today =
            sameCalendarDay(
              date,
              new Date(),
            );

          return (
            <Pressable
              key={date.toISOString()}
              onPress={() =>
                onSelectDate(date)
              }
              style={({ pressed }) => [
                styles.calendarDay,
                selected &&
                  styles.calendarDaySelected,
                today &&
                  !selected &&
                  styles.calendarDayToday,
                pressed &&
                  styles.calendarDayPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={date.toLocaleDateString(
                "en-GB",
                {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                },
              )}
            >
              <Text
                style={[
                  styles.calendarDayText,
                  !inCurrentMonth &&
                    styles.calendarDayTextMuted,
                  selected &&
                    styles.calendarDayTextSelected,
                ]}
              >
                {date.getDate()}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function FormTextInput({
  label,
  value,
  onChangeText,
  error,
  icon,
  ...inputProps
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  icon?: IconName;
} & Omit<
  React.ComponentProps<typeof TextInput>,
  "label" | "value" | "onChangeText" | "error"
>) {
  return (
    <View style={styles.inputWrapper}>
      <TextInput
        mode="outlined"
        label={label}
        value={value}
        onChangeText={onChangeText}
        error={Boolean(error)}
        left={
          icon ? (
            <TextInput.Icon icon={icon} />
          ) : undefined
        }
        style={styles.formInput}
        {...inputProps}
      />

      {error ? (
        <Text style={styles.inputError}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function SelectionGroup<T extends string>({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onSelect: (value: T) => void;
}) {
  return (
    <View style={styles.selectionGroup}>
      <Text style={styles.selectionLabel}>
        {label}
      </Text>

      <RadioButton.Group
        value={value}
        onValueChange={(newValue) =>
          onSelect(newValue as T)
        }
      >
        <View style={styles.radioOptions}>
          {options.map((option) => (
            <Pressable
              key={option}
              style={[
                styles.radioOption,
                value === option &&
                  styles.radioOptionSelected,
              ]}
              onPress={() => onSelect(option)}
            >
              <RadioButton
                value={option}
                color={colors.primary}
              />

              <Text
                style={[
                  styles.radioOptionText,
                  value === option &&
                    styles.radioOptionTextSelected,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          ))}
        </View>
      </RadioButton.Group>
    </View>
  );
}

function ToggleRow({
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
    <View style={styles.toggleRow}>
      <View style={styles.toggleIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={21}
          color={colors.primary}
        />
      </View>

      <View style={styles.toggleTextArea}>
        <Text style={styles.toggleTitle}>
          {title}
        </Text>

        <Text
          style={styles.toggleDescription}
        >
          {description}
        </Text>
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        color={colors.primary}
      />
    </View>
  );
}

function CheckboxGrid({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <View style={styles.checkboxGrid}>
      {children}
    </View>
  );
}

function CheckboxOption({
  label,
  icon,
  checked,
  onPress,
}: {
  label: string;
  icon: IconName;
  checked: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.checkboxOption,
        checked &&
          styles.checkboxOptionChecked,
      ]}
      onPress={onPress}
    >
      <Checkbox
        status={
          checked ? "checked" : "unchecked"
        }
        color={colors.primary}
      />

      <MaterialCommunityIcons
        name={icon}
        size={20}
        color={
          checked
            ? colors.primary
            : colors.textMuted
        }
      />

      <Text
        style={[
          styles.checkboxOptionText,
          checked &&
            styles.checkboxOptionTextChecked,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function PropertyFact({
  icon,
  text,
}: {
  icon: IconName;
  text: string;
}) {
  return (
    <View style={styles.propertyFact}>
      <MaterialCommunityIcons
        name={icon}
        size={16}
        color={colors.textMuted}
      />

      <Text style={styles.propertyFactText}>
        {text}
      </Text>
    </View>
  );
}

function SmallFeature({
  icon,
  label,
}: {
  icon: IconName;
  label: string;
}) {
  return (
    <View style={styles.smallFeature}>
      <MaterialCommunityIcons
        name={icon}
        size={15}
        color={colors.primary}
      />

      <Text
        style={styles.smallFeatureText}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

function PropertyStatusBadge({
  text,
  type,
}: {
  text: string;
  type:
    | "success"
    | "warning"
    | "error"
    | "primary";
}) {
  return (
    <View
      style={[
        styles.statusBadge,
        type === "success" &&
          styles.successBadge,
        type === "warning" &&
          styles.warningBadge,
        type === "error" &&
          styles.errorBadge,
        type === "primary" &&
          styles.primaryBadge,
      ]}
    >
      <Text
        style={[
          styles.statusBadgeText,
          type === "success" &&
            styles.successBadgeText,
          type === "warning" &&
            styles.warningBadgeText,
          type === "error" &&
            styles.errorBadgeText,
          type === "primary" &&
            styles.primaryBadgeText,
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

function DetailsSection({
  icon,
  title,
  children,
}: {
  icon: IconName;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.detailsSection}>
      <View style={styles.detailsSectionHeader}>
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={colors.primary}
        />

        <Text
          style={styles.detailsSectionTitle}
        >
          {title}
        </Text>
      </View>

      <View style={styles.detailsSectionBody}>
        {children}
      </View>
    </View>
  );
}

function DetailsGrid({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <View style={styles.detailsGrid}>
      {children}
    </View>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>
        {label}
      </Text>

      <Text style={styles.detailValue}>
        {value}
      </Text>
    </View>
  );
}

function DetailChip({
  icon,
  text,
  active,
}: {
  icon: IconName;
  text: string;
  active: boolean;
}) {
  return (
    <View
      style={[
        styles.detailChip,
        active && styles.detailChipActive,
      ]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={17}
        color={
          active
            ? colors.primary
            : colors.textMuted
        }
      />

      <Text
        style={[
          styles.detailChipText,
          active &&
            styles.detailChipTextActive,
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

function createPropertyId(
  properties: Property[],
) {
  const highestNumber = properties.reduce(
    (highest, property) => {
      const number =
        Number(
          property.id.replace(/\D/g, ""),
        ) || 0;

      return Math.max(highest, number);
    },
    0,
  );

  return `P${String(
    highestNumber + 1,
  ).padStart(3, "0")}`;
}

function numbersOnly(value: string) {
  return value.replace(/[^0-9]/g, "");
}

function decimalOnly(value: string) {
  const cleaned = value.replace(
    /[^0-9.]/g,
    "",
  );

  const parts = cleaned.split(".");

  if (parts.length <= 1) {
    return cleaned;
  }

  return `${parts[0]}.${parts
    .slice(1)
    .join("")}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

const styles = StyleSheet.create({
  pageContent: {
    width: "100%",
    gap: spacing.xl,
  },

  filterCard: {
    width: "100%",
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  filterRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  filterRowMobile: {
    flexDirection: "column",
    alignItems: "stretch",
  },

  searchbar: {
    flex: 1,
    minWidth: 250,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },

  searchbarInput: {
    fontSize: 13,
  },

  filterButtons: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  filterButtonsMobile: {
    width: "100%",
    alignItems: "stretch",
  },

  filterButton: {
    borderColor: colors.border,
  },

  resultText: {
    marginTop: spacing.md,
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },

  propertyGrid: {
    width: "100%",
    gap: spacing.lg,
  },

  propertyGridDesktop: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  propertyGridTablet: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  propertyGridMobile: {
    flexDirection: "column",
  },

  propertyCard: {
    flexGrow: 1,
    flexBasis: 330,
    maxWidth: 520,
    minWidth: 0,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  propertyCardPressed: {
    opacity: 0.88,
  },

  propertyImage: {
    height: 135,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
  },

  propertyImagePhoto: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  propertyIdBadge: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.white,
  },

  propertyIdText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: "900",
  },

  propertyCardContent: {
    padding: spacing.lg,
  },

  propertyTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },

  propertyTitleArea: {
    flex: 1,
    minWidth: 0,
  },

  propertyAddress: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "900",
  },

  propertyLocation: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 11,
  },

  propertyFacts: {
    marginTop: spacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },

  propertyFact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  propertyFactText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "600",
  },

  cardDivider: {
    marginVertical: spacing.md,
    backgroundColor: colors.border,
  },

  propertyRentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },

  propertyRentValue: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "900",
  },

  propertyRentLabel: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 9,
  },

  tenantBox: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },

  tenantContent: {
    flex: 1,
    minWidth: 0,
  },

  tenantLabel: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  tenantName: {
    marginTop: 3,
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "800",
  },

  propertyFeatureRow: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },

  smallFeature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  smallFeatureText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 9,
  },

  cardActions: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 2,
  },

  statusBadge: {
    flexShrink: 0,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
  },

  statusBadgeText: {
    fontSize: 8,
    fontWeight: "900",
  },

  successBadge: {
    backgroundColor: colors.successLight,
  },

  successBadgeText: {
    color: colors.success,
  },

  warningBadge: {
    backgroundColor: colors.warningLight,
  },

  warningBadgeText: {
    color: colors.warning,
  },

  errorBadge: {
    backgroundColor: colors.errorLight,
  },

  errorBadgeText: {
    color: colors.error,
  },

  primaryBadge: {
    backgroundColor: colors.primaryLight,
  },

  primaryBadgeText: {
    color: colors.primary,
  },

  emptyCard: {
    width: "100%",
    alignItems: "center",
    padding: spacing.xl * 2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  emptyIcon: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
  },

  emptyTitle: {
    marginTop: spacing.lg,
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "900",
  },

  emptyText: {
    marginTop: spacing.sm,
    maxWidth: 420,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
  },

  emptyActions: {
    marginTop: spacing.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.sm,
  },

  formDialog: {
    width: "94%",
    maxWidth: 1000,
    maxHeight: "94%",
    alignSelf: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.white,
  },

  detailsDialog: {
    width: "94%",
    maxWidth: 850,
    maxHeight: "92%",
    alignSelf: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.white,
  },

  calendarDialog: {
    width: "92%",
    maxWidth: 430,
    alignSelf: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.white,
  },

  dialogScrollArea: {
    paddingHorizontal: 0,
  },

  formContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },

  formSection: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.white,
  },

  formSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },

  formSectionIcon: {
    width: 42,
    height: 42,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
  },

  formSectionHeading: {
    flex: 1,
  },

  formSectionTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "900",
  },

  formSectionSubtitle: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 15,
  },

  formSectionBody: {
    padding: spacing.lg,
    gap: spacing.md,
  },

  responsiveFields: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },

  inputWrapper: {
    flexGrow: 1,
    flexBasis: 260,
    minWidth: 220,
  },

  dateSelectField: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    backgroundColor: colors.white,
  },

  dateSelectFieldPressed: {
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },

  dateSelectTextArea: {
    flex: 1,
    minWidth: 0,
  },

  dateSelectLabel: {
    marginBottom: 3,
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },

  dateSelectValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },

  dateSelectPlaceholder: {
    color: colors.textMuted,
    fontWeight: "400",
  },

  calendarPicker: {
    width: "100%",
  },

  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },

  calendarNavButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    backgroundColor: colors.white,
  },

  calendarMonthTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "800",
  },

  calendarWeekHeader: {
    flexDirection: "row",
    marginBottom: 6,
  },

  calendarWeekDay: {
    width: "14.2857%",
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },

  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  calendarDay: {
    width: "14.2857%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },

  calendarDaySelected: {
    backgroundColor: colors.primary,
  },

  calendarDayToday: {
    borderWidth: 1,
    borderColor: colors.primary,
  },

  calendarDayPressed: {
    backgroundColor: colors.primaryLight,
  },

  calendarDayText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "600",
  },

  calendarDayTextMuted: {
    color: colors.textMuted,
    opacity: 0.5,
  },

  calendarDayTextSelected: {
    color: colors.white,
    fontWeight: "800",
  },

  formInput: {
    backgroundColor: colors.white,
  },

  inputError: {
    marginTop: 4,
    marginLeft: 4,
    color: colors.error,
    fontSize: 9,
    fontWeight: "600",
  },

  selectionGroup: {
    gap: spacing.sm,
  },

  selectionLabel: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "800",
  },

  radioOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },

  radioOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },

  radioOptionText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
  },

  radioOptionTextSelected: {
    color: colors.primary,
  },

  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },

  toggleIcon: {
    width: 40,
    height: 40,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
  },

  toggleTextArea: {
    flex: 1,
    minWidth: 0,
  },

  toggleTitle: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "800",
  },

  toggleDescription: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 14,
  },

  checkboxGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  checkboxOption: {
    flexGrow: 1,
    flexBasis: 210,
    minWidth: 190,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },

  checkboxOptionChecked: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },

  checkboxOptionText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
  },

  checkboxOptionTextChecked: {
    color: colors.primary,
  },

  photoUploadBox: {
    alignItems: "center",
    padding: spacing.xl,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.primary,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
  },

  photoUploadTitle: {
    marginTop: spacing.sm,
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "900",
  },

  photoUploadText: {
    marginTop: 4,
    marginBottom: spacing.md,
    maxWidth: 420,
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
  },

  photoList: {
    gap: spacing.sm,
  },

  photoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },

  photoThumbnail: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
    resizeMode: "cover",
  },

  photoName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "700",
  },

  existingPhotoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  existingPhoto: {
    width: 96,
    height: 76,
    borderRadius: radius.md,
    resizeMode: "cover",
  },

  detailsPhotoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  detailsPhoto: {
    width: 150,
    height: 110,
    borderRadius: radius.md,
    resizeMode: "cover",
  },

  removePhotoButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: colors.errorLight,
  },

  detailsContent: {
    padding: spacing.lg,
  },

  detailsWrapper: {
    gap: spacing.lg,
  },

  detailsHero: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
  },

  detailsHeroIcon: {
    width: 72,
    height: 72,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: colors.white,
  },

  detailsHeroText: {
    flex: 1,
    minWidth: 0,
  },

  detailsAddress: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "900",
  },

  detailsLocation: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 11,
  },

  detailsBadges: {
    marginTop: spacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  detailsSection: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
  },

  detailsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },

  detailsSectionTitle: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "900",
  },

  detailsSectionBody: {
    padding: spacing.md,
  },

  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },

  detailItem: {
    flexGrow: 1,
    flexBasis: 200,
    minWidth: 150,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },

  detailLabel: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  detailValue: {
    marginTop: 5,
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "700",
  },

  detailsChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  detailChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.background,
  },

  detailChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },

  detailChipText: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: "700",
  },

  detailChipTextActive: {
    color: colors.primary,
  },

  detailsParagraph: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 18,
  },

  detailsNotesHeading: {
    marginTop: spacing.md,
    marginBottom: 4,
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },

  emptyDetailsText: {
    color: colors.textMuted,
    fontSize: 10,
  },

  deleteText: {
    color: colors.textPrimary,
    fontSize: 12,
    lineHeight: 19,
  },

  deleteWarning: {
    marginTop: spacing.sm,
    color: colors.error,
    fontSize: 10,
    fontWeight: "800",
  },

  apiErrorCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(211,47,47,0.22)",
    borderRadius: radius.md,
    backgroundColor: "rgba(211,47,47,0.05)",
  },

  apiErrorText: {
    flex: 1,
    color: colors.error,
    fontSize: 11,
    lineHeight: 18,
  },

  apiSuccessCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(46,125,50,0.20)",
    borderRadius: radius.md,
    backgroundColor: "rgba(46,125,50,0.05)",
  },

  apiSuccessText: {
    flex: 1,
    color: colors.success,
    fontSize: 11,
    lineHeight: 18,
    fontWeight: "700",
  },

  loadingCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },

  loadingText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },

  addressLookupActions: {
    gap: spacing.sm,
  },

  addressLookupError: {
    color: colors.error,
    fontSize: 10,
    lineHeight: 17,
  },

  addressResultsBox: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },

  addressResultsTitle: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "900",
  },

  addressResultsList: {
    maxHeight: 260,
  },

  addressResultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  addressResultRowPressed: {
    backgroundColor: colors.background,
  },

  addressResultText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 10,
    lineHeight: 17,
  },

  approvalInfoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },

  approvalInfoText: {
    flex: 1,
  },

  approvalInfoTitle: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "900",
  },

  approvalInfoDescription: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 17,
  },
});