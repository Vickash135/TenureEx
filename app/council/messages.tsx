import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import {
    Avatar,
    Badge,
    Button,
    Divider,
    IconButton,
    Menu,
    Searchbar,
    Snackbar,
    TextInput,
} from "react-native-paper";
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInLeft,
    FadeInRight,
    FadeInUp,
} from "react-native-reanimated";

import ScreenContainer from "../../src/components/ScreenContainer";
import {
    colors,
    radius,
    spacing,
    typography,
} from "../../src/theme";

type IconName =
  keyof typeof MaterialCommunityIcons.glyphMap;

type NavigationItem = {
  label: string;
  icon: IconName;
  route: string;
  badge?: number;
};

type ContactType =
  | "Tenant"
  | "Landlord"
  | "Inspector"
  | "Council Officer";

type ConversationStatus =
  | "Open"
  | "Awaiting Reply"
  | "Resolved";

type Message = {
  id: string;
  sender: "me" | "contact";
  body: string;
  time: string;
  read: boolean;
};

type Conversation = {
  id: string;
  contactName: string;
  initials: string;
  contactType: ContactType;
  property: string;
  inspectionId?: string;
  subject: string;
  preview: string;
  lastMessageTime: string;
  unreadCount: number;
  status: ConversationStatus;
  messages: Message[];
};

type ConversationFilter =
  | "All"
  | "Unread"
  | "Open"
  | "Resolved";

const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    icon: "view-dashboard-outline",
    route: "/council/dashboard",
  },
  {
    label: "Inspections",
    icon: "clipboard-search-outline",
    route: "/council/inspections",
    badge: 8,
  },
  {
    label: "Reports",
    icon: "file-document-outline",
    route: "/council/reports",
  },
  {
    label: "Messages",
    icon: "message-text-outline",
    route: "/council/messages",
    badge: 3,
  },
  {
    label: "Settings",
    icon: "cog-outline",
    route: "/council/settings",
  },
];

const initialConversations: Conversation[] = [
  {
    id: "conversation-1",
    contactName: "Emily Carter",
    initials: "EC",
    contactType: "Tenant",
    property: "14 Wellington Avenue",
    inspectionId: "INS-2026-1048",
    subject: "Damp and mould inspection",
    preview:
      "Thank you. I will make sure somebody is available to provide access.",
    lastMessageTime: "8:42 PM",
    unreadCount: 2,
    status: "Open",
    messages: [
      {
        id: "message-1",
        sender: "me",
        body:
          "Hello Emily, I am contacting you about the housing standards inspection at 14 Wellington Avenue.",
        time: "10:15 AM",
        read: true,
      },
      {
        id: "message-2",
        sender: "me",
        body:
          "The inspection is booked for Thursday, 30 July 2026 at 10:00 AM. Please confirm that access will be available.",
        time: "10:16 AM",
        read: true,
      },
      {
        id: "message-3",
        sender: "contact",
        body:
          "Hello Alex. Yes, I will be at the property that morning.",
        time: "7:58 PM",
        read: true,
      },
      {
        id: "message-4",
        sender: "contact",
        body:
          "Thank you. I will make sure somebody is available to provide access.",
        time: "8:42 PM",
        read: false,
      },
    ],
  },
  {
    id: "conversation-2",
    contactName: "Daniel Morgan",
    initials: "DM",
    contactType: "Landlord",
    property: "14 Wellington Avenue",
    inspectionId: "INS-2026-1048",
    subject: "Urgent remedial work",
    preview:
      "Please send me the report once it has been approved.",
    lastMessageTime: "6:18 PM",
    unreadCount: 1,
    status: "Awaiting Reply",
    messages: [
      {
        id: "message-5",
        sender: "me",
        body:
          "Hello Daniel. The inspection identified serious damp, mould and ventilation concerns.",
        time: "4:20 PM",
        read: true,
      },
      {
        id: "message-6",
        sender: "me",
        body:
          "You may be required to complete urgent remedial work. A formal report will follow.",
        time: "4:22 PM",
        read: true,
      },
      {
        id: "message-7",
        sender: "contact",
        body:
          "Please send me the report once it has been approved.",
        time: "6:18 PM",
        read: false,
      },
    ],
  },
  {
    id: "conversation-3",
    contactName: "Sophie Turner",
    initials: "ST",
    contactType: "Council Officer",
    property: "21 Headingley Mount",
    inspectionId: "INS-2026-1039",
    subject: "Report review request",
    preview:
      "I have added comments to the enforcement section.",
    lastMessageTime: "Yesterday",
    unreadCount: 0,
    status: "Open",
    messages: [
      {
        id: "message-8",
        sender: "contact",
        body:
          "Hi Alex, I have reviewed the draft inspection report.",
        time: "Yesterday, 2:10 PM",
        read: true,
      },
      {
        id: "message-9",
        sender: "contact",
        body:
          "I have added comments to the enforcement section.",
        time: "Yesterday, 2:12 PM",
        read: true,
      },
      {
        id: "message-10",
        sender: "me",
        body:
          "Thank you. I will review the comments and update the report.",
        time: "Yesterday, 2:35 PM",
        read: true,
      },
    ],
  },
  {
    id: "conversation-4",
    contactName: "Michael Adams",
    initials: "MA",
    contactType: "Tenant",
    property: "35 Cardigan Road",
    inspectionId: "INS-2026-1024",
    subject: "Inspection outcome",
    preview:
      "The case has now been resolved. Thank you for your cooperation.",
    lastMessageTime: "28 Jul",
    unreadCount: 0,
    status: "Resolved",
    messages: [
      {
        id: "message-11",
        sender: "me",
        body:
          "The property inspection has been completed and no immediate safety concerns were identified.",
        time: "28 Jul, 11:05 AM",
        read: true,
      },
      {
        id: "message-12",
        sender: "contact",
        body:
          "Thank you for letting me know.",
        time: "28 Jul, 11:22 AM",
        read: true,
      },
      {
        id: "message-13",
        sender: "me",
        body:
          "The case has now been resolved. Thank you for your cooperation.",
        time: "28 Jul, 11:25 AM",
        read: true,
      },
    ],
  },
  {
    id: "conversation-5",
    contactName: "Priya Shah",
    initials: "PS",
    contactType: "Inspector",
    property: "74 Roundhay Road",
    inspectionId: "INS-2026-1006",
    subject: "Follow-up inspection",
    preview:
      "I can attend the follow-up visit next Tuesday morning.",
    lastMessageTime: "24 Jul",
    unreadCount: 0,
    status: "Awaiting Reply",
    messages: [
      {
        id: "message-14",
        sender: "me",
        body:
          "Hi Priya, are you available to attend the follow-up visit at 74 Roundhay Road?",
        time: "24 Jul, 9:14 AM",
        read: true,
      },
      {
        id: "message-15",
        sender: "contact",
        body:
          "I can attend the follow-up visit next Tuesday morning.",
        time: "24 Jul, 10:05 AM",
        read: true,
      },
    ],
  },
];

const filters: ConversationFilter[] = [
  "All",
  "Unread",
  "Open",
  "Resolved",
];

export default function CouncilMessagesScreen() {
  const { width } = useWindowDimensions();

  const params = useLocalSearchParams<{
    contact?: string;
  }>();

  const isDesktop = width >= 1050;
  const isTablet = width >= 720;
  const isCompact = width < 560;

  const requestedContact =
    typeof params.contact === "string"
      ? params.contact
      : "";

  const initialSelectedConversation =
    initialConversations.find(
      (conversation) =>
        conversation.contactName === requestedContact
    ) ?? initialConversations[0];

  const [conversations, setConversations] =
    useState<Conversation[]>(
      initialConversations.map((conversation) =>
        conversation.id ===
        initialSelectedConversation.id
          ? {
              ...conversation,
              unreadCount: 0,
              messages: conversation.messages.map(
                (message) => ({
                  ...message,
                  read: true,
                })
              ),
            }
          : conversation
      )
    );

  const [selectedConversationId, setSelectedConversationId] =
    useState(initialSelectedConversation.id);

  const [searchQuery, setSearchQuery] =
    useState("");
  const [activeFilter, setActiveFilter] =
    useState<ConversationFilter>("All");
  const [messageText, setMessageText] =
    useState("");

  const [mobileMenuVisible, setMobileMenuVisible] =
    useState(false);
  const [profileMenuVisible, setProfileMenuVisible] =
    useState(false);
  const [conversationMenuVisible, setConversationMenuVisible] =
    useState(false);
  const [newMessageVisible, setNewMessageVisible] =
    useState(false);
  const [mobileConversationVisible, setMobileConversationVisible] =
    useState(Boolean(requestedContact));

  const [newContactName, setNewContactName] =
    useState("");
  const [newSubject, setNewSubject] =
    useState("");
  const [newMessageBody, setNewMessageBody] =
    useState("");

  const [snackbarVisible, setSnackbarVisible] =
    useState(false);
  const [snackbarMessage, setSnackbarMessage] =
    useState("");

  const selectedConversation =
    conversations.find(
      (conversation) =>
        conversation.id === selectedConversationId
    ) ?? conversations[0];

  const unreadTotal = useMemo(
    () =>
      conversations.reduce(
        (total, conversation) =>
          total + conversation.unreadCount,
        0
      ),
    [conversations]
  );

  const filteredConversations = useMemo(() => {
    const query = searchQuery
      .trim()
      .toLowerCase();

    return conversations.filter(
      (conversation) => {
        const matchesSearch =
          !query ||
          conversation.contactName
            .toLowerCase()
            .includes(query) ||
          conversation.property
            .toLowerCase()
            .includes(query) ||
          conversation.subject
            .toLowerCase()
            .includes(query) ||
          conversation.inspectionId
            ?.toLowerCase()
            .includes(query);

        const matchesFilter =
          activeFilter === "All" ||
          (activeFilter === "Unread" &&
            conversation.unreadCount > 0) ||
          (activeFilter === "Open" &&
            conversation.status !== "Resolved") ||
          (activeFilter === "Resolved" &&
            conversation.status === "Resolved");

        return matchesSearch && matchesFilter;
      }
    );
  }, [
    activeFilter,
    conversations,
    searchQuery,
  ]);

  const navigateTo = (route: string) => {
    setMobileMenuVisible(false);
    router.push(route as never);
  };

  const showMessage = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleLogout = () => {
    setProfileMenuVisible(false);

    router.replace(
      "/auth/council/login" as never
    );
  };

  const handleSelectConversation = (
    conversation: Conversation
  ) => {
    setSelectedConversationId(conversation.id);

    setConversations((current) =>
      current.map((item) =>
        item.id === conversation.id
          ? {
              ...item,
              unreadCount: 0,
              messages: item.messages.map(
                (message) => ({
                  ...message,
                  read: true,
                })
              ),
            }
          : item
      )
    );

    if (!isDesktop) {
      setMobileConversationVisible(true);
    }
  };

  const handleSendMessage = () => {
    const body = messageText.trim();

    if (!body || !selectedConversation) {
      return;
    }

    const newMessage: Message = {
      id: `message-${Date.now()}`,
      sender: "me",
      body,
      time: "Just now",
      read: true,
    };

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id ===
        selectedConversation.id
          ? {
              ...conversation,
              preview: body,
              lastMessageTime: "Just now",
              status:
                conversation.status === "Resolved"
                  ? "Open"
                  : conversation.status,
              messages: [
                ...conversation.messages,
                newMessage,
              ],
            }
          : conversation
      )
    );

    setMessageText("");
    showMessage("Message sent successfully.");
  };

  const handleCreateConversation = () => {
    if (!newContactName.trim()) {
      showMessage("Please enter a contact name.");
      return;
    }

    if (!newSubject.trim()) {
      showMessage("Please enter a subject.");
      return;
    }

    if (!newMessageBody.trim()) {
      showMessage("Please enter a message.");
      return;
    }

    const initials = newContactName
      .trim()
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const newConversation: Conversation = {
      id: `conversation-${Date.now()}`,
      contactName: newContactName.trim(),
      initials: initials || "NC",
      contactType: "Tenant",
      property: "Property not selected",
      subject: newSubject.trim(),
      preview: newMessageBody.trim(),
      lastMessageTime: "Just now",
      unreadCount: 0,
      status: "Open",
      messages: [
        {
          id: `message-${Date.now()}`,
          sender: "me",
          body: newMessageBody.trim(),
          time: "Just now",
          read: true,
        },
      ],
    };

    setConversations((current) => [
      newConversation,
      ...current,
    ]);

    setSelectedConversationId(
      newConversation.id
    );
    setNewMessageVisible(false);
    setNewContactName("");
    setNewSubject("");
    setNewMessageBody("");

    if (!isDesktop) {
      setMobileConversationVisible(true);
    }

    showMessage("New conversation created.");
  };

  const handleMarkResolved = () => {
    if (!selectedConversation) {
      return;
    }

    setConversationMenuVisible(false);

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id ===
        selectedConversation.id
          ? {
              ...conversation,
              status: "Resolved",
            }
          : conversation
      )
    );

    showMessage("Conversation marked as resolved.");
  };

  const handleReopenConversation = () => {
    if (!selectedConversation) {
      return;
    }

    setConversationMenuVisible(false);

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id ===
        selectedConversation.id
          ? {
              ...conversation,
              status: "Open",
            }
          : conversation
      )
    );

    showMessage("Conversation reopened.");
  };

  const handleDeleteConversation = () => {
    if (!selectedConversation) {
      return;
    }

    const remainingConversations =
      conversations.filter(
        (conversation) =>
          conversation.id !==
          selectedConversation.id
      );

    setConversations(remainingConversations);

    setSelectedConversationId(
      remainingConversations[0]?.id ?? ""
    );

    setConversationMenuVisible(false);
    setMobileConversationVisible(false);

    showMessage("Conversation removed.");
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <ScreenContainer
        scrollable
        contentStyle={styles.screenContent}
      >
        <View style={styles.page}>
          {!isDesktop ? (
            <Animated.View
              entering={FadeInUp.duration(400)}
              style={styles.mobileHeader}
            >
              <Pressable
                style={styles.mobileBrand}
                onPress={() =>
                  router.replace(
                    "/council/dashboard" as never
                  )
                }
              >
                <View
                  style={styles.mobileBrandLogo}
                >
                  <MaterialCommunityIcons
                    name="home-city-outline"
                    size={24}
                    color={colors.white}
                  />
                </View>

                <View>
                  <Text
                    style={styles.mobileBrandName}
                  >
                    TENUREEX
                  </Text>

                  <Text
                    style={
                      styles.mobileBrandSubtitle
                    }
                  >
                    Council Portal
                  </Text>
                </View>
              </Pressable>

              <View style={styles.mobileHeaderActions}>
                {unreadTotal > 0 ? (
                  <View
                    style={
                      styles.mobileUnreadBadge
                    }
                  >
                    <Text
                      style={
                        styles.mobileUnreadBadgeText
                      }
                    >
                      {unreadTotal}
                    </Text>
                  </View>
                ) : null}

                <IconButton
                  icon={
                    mobileMenuVisible
                      ? "close"
                      : "menu"
                  }
                  size={25}
                  iconColor={colors.primary}
                  onPress={() =>
                    setMobileMenuVisible(
                      !mobileMenuVisible
                    )
                  }
                />
              </View>
            </Animated.View>
          ) : null}

          {!isDesktop &&
          mobileMenuVisible ? (
            <Animated.View
              entering={FadeInDown.duration(250)}
              style={styles.mobileNavigation}
            >
              {navigationItems.map((item) => {
                const active =
                  item.route ===
                  "/council/messages";

                return (
                  <Pressable
                    key={item.label}
                    onPress={() =>
                      navigateTo(item.route)
                    }
                    style={({ pressed }) => [
                      styles.mobileNavigationItem,
                      active &&
                        styles.activeMobileNavigationItem,
                      pressed &&
                        styles.pressedNavigationItem,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={item.icon}
                      size={21}
                      color={
                        active
                          ? colors.primary
                          : colors.textSecondary
                      }
                    />

                    <Text
                      style={[
                        styles.mobileNavigationLabel,
                        active &&
                          styles.activeMobileNavigationLabel,
                      ]}
                    >
                      {item.label}
                    </Text>

                    {item.label ===
                      "Messages" &&
                    unreadTotal > 0 ? (
                      <View
                        style={
                          styles.navigationBadge
                        }
                      >
                        <Text
                          style={
                            styles.navigationBadgeText
                          }
                        >
                          {unreadTotal}
                        </Text>
                      </View>
                    ) : item.badge ? (
                      <View
                        style={
                          styles.navigationBadge
                        }
                      >
                        <Text
                          style={
                            styles.navigationBadgeText
                          }
                        >
                          {item.badge}
                        </Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}

              <Divider
                style={styles.mobileDivider}
              />

              <Pressable
                style={
                  styles.mobileLogoutButton
                }
                onPress={handleLogout}
              >
                <MaterialCommunityIcons
                  name="logout"
                  size={21}
                  color="#B42318"
                />

                <Text
                  style={styles.mobileLogoutText}
                >
                  Sign out
                </Text>
              </Pressable>
            </Animated.View>
          ) : null}

          <View
            style={[
              styles.layout,
              isDesktop &&
                styles.desktopLayout,
            ]}
          >
            {isDesktop ? (
              <Animated.View
                entering={FadeInLeft.duration(
                  450
                )}
                style={styles.sidebar}
              >
                <Pressable
                  style={styles.brandRow}
                  onPress={() =>
                    router.replace(
                      "/council/dashboard" as never
                    )
                  }
                >
                  <View
                    style={styles.brandLogo}
                  >
                    <MaterialCommunityIcons
                      name="home-city-outline"
                      size={29}
                      color={colors.white}
                    />
                  </View>

                  <View>
                    <Text
                      style={styles.brandName}
                    >
                      TENUREEX
                    </Text>

                    <Text
                      style={
                        styles.brandSubtitle
                      }
                    >
                      Council & Inspection Portal
                    </Text>
                  </View>
                </Pressable>

                <View
                  style={styles.profileCard}
                >
                  <Avatar.Text
                    size={48}
                    label="AM"
                    labelStyle={
                      styles.avatarLabel
                    }
                    style={styles.avatar}
                  />

                  <View
                    style={
                      styles.profileInformation
                    }
                  >
                    <Text
                      style={styles.profileName}
                    >
                      Alex Morgan
                    </Text>

                    <Text
                      style={styles.profileRole}
                    >
                      Housing Inspector
                    </Text>

                    <View
                      style={styles.verifiedRow}
                    >
                      <MaterialCommunityIcons
                        name="check-decagram"
                        size={14}
                        color="#277A46"
                      />

                      <Text
                        style={
                          styles.verifiedText
                        }
                      >
                        Verified council account
                      </Text>
                    </View>
                  </View>
                </View>

                <Text
                  style={styles.navigationTitle}
                >
                  MAIN MENU
                </Text>

                <View
                  style={styles.navigation}
                >
                  {navigationItems.map(
                    (item) => {
                      const active =
                        item.route ===
                        "/council/messages";

                      return (
                        <Pressable
                          key={item.label}
                          onPress={() =>
                            navigateTo(
                              item.route
                            )
                          }
                          style={({
                            pressed,
                          }) => [
                            styles.navigationItem,
                            active &&
                              styles.activeNavigationItem,
                            pressed &&
                              styles.pressedNavigationItem,
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={item.icon}
                            size={21}
                            color={
                              active
                                ? colors.primary
                                : colors.textSecondary
                            }
                          />

                          <Text
                            style={[
                              styles.navigationLabel,
                              active &&
                                styles.activeNavigationLabel,
                            ]}
                          >
                            {item.label}
                          </Text>

                          {item.label ===
                            "Messages" &&
                          unreadTotal > 0 ? (
                            <View
                              style={
                                styles.navigationBadge
                              }
                            >
                              <Text
                                style={
                                  styles.navigationBadgeText
                                }
                              >
                                {unreadTotal}
                              </Text>
                            </View>
                          ) : item.badge ? (
                            <View
                              style={
                                styles.navigationBadge
                              }
                            >
                              <Text
                                style={
                                  styles.navigationBadgeText
                                }
                              >
                                {item.badge}
                              </Text>
                            </View>
                          ) : null}
                        </Pressable>
                      );
                    }
                  )}
                </View>

                <View
                  style={styles.sidebarFooter}
                >
                  <View
                    style={
                      styles.councilInformation
                    }
                  >
                    <View
                      style={
                        styles.councilIcon
                      }
                    >
                      <MaterialCommunityIcons
                        name="office-building-outline"
                        size={22}
                        color={colors.primary}
                      />
                    </View>

                    <View
                      style={
                        styles.councilInformationText
                      }
                    >
                      <Text
                        style={
                          styles.councilName
                        }
                      >
                        Leeds City Council
                      </Text>

                      <Text
                        style={
                          styles.councilDepartment
                        }
                      >
                        Housing Standards
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={handleLogout}
                    style={({ pressed }) => [
                      styles.logoutButton,
                      pressed &&
                        styles.pressedNavigationItem,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="logout"
                      size={20}
                      color="#B42318"
                    />

                    <Text
                      style={styles.logoutText}
                    >
                      Sign out
                    </Text>
                  </Pressable>
                </View>
              </Animated.View>
            ) : null}

            <View
              style={styles.mainContent}
            >
              <Animated.View
                entering={FadeInRight.duration(
                  450
                )}
                style={styles.topBar}
              >
                <View
                  style={
                    styles.headingSection
                  }
                >
                  <View
                    style={
                      styles.breadcrumbRow
                    }
                  >
                    <Pressable
                      onPress={() =>
                        navigateTo(
                          "/council/dashboard"
                        )
                      }
                    >
                      <Text
                        style={
                          styles.breadcrumbLink
                        }
                      >
                        Dashboard
                      </Text>
                    </Pressable>

                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={15}
                      color={colors.textMuted}
                    />

                    <Text
                      style={
                        styles.breadcrumbCurrent
                      }
                    >
                      Messages
                    </Text>
                  </View>

                  <Text
                    style={styles.pageTitle}
                  >
                    Messages
                  </Text>

                  <Text
                    style={
                      styles.pageDescription
                    }
                  >
                    Communicate with tenants,
                    landlords and council team
                    members.
                  </Text>
                </View>

                <View
                  style={styles.topBarActions}
                >
                  <Button
                    mode="contained"
                    icon="message-plus-outline"
                    buttonColor={colors.primary}
                    style={styles.newMessageButton}
                    contentStyle={
                      styles.newMessageButtonContent
                    }
                    labelStyle={
                      styles.newMessageButtonLabel
                    }
                    onPress={() =>
                      setNewMessageVisible(
                        !newMessageVisible
                      )
                    }
                  >
                    {isCompact
                      ? "New"
                      : "New message"}
                  </Button>

                  {isDesktop ? (
                    <Menu
                      visible={
                        profileMenuVisible
                      }
                      onDismiss={() =>
                        setProfileMenuVisible(
                          false
                        )
                      }
                      anchor={
                        <Pressable
                          style={
                            styles.headerProfile
                          }
                          onPress={() =>
                            setProfileMenuVisible(
                              true
                            )
                          }
                        >
                          <Avatar.Text
                            size={38}
                            label="AM"
                            labelStyle={
                              styles.smallAvatarLabel
                            }
                            style={
                              styles.smallAvatar
                            }
                          />

                          <View>
                            <Text
                              style={
                                styles.headerProfileName
                              }
                            >
                              Alex Morgan
                            </Text>

                            <Text
                              style={
                                styles.headerProfileRole
                              }
                            >
                              Housing Inspector
                            </Text>
                          </View>

                          <MaterialCommunityIcons
                            name="chevron-down"
                            size={18}
                            color={
                              colors.textMuted
                            }
                          />
                        </Pressable>
                      }
                    >
                      <Menu.Item
                        leadingIcon="account-outline"
                        title="Account settings"
                        onPress={() => {
                          setProfileMenuVisible(
                            false
                          );

                          navigateTo(
                            "/council/settings"
                          );
                        }}
                      />

                      <Divider />

                      <Menu.Item
                        leadingIcon="logout"
                        title="Sign out"
                        onPress={handleLogout}
                      />
                    </Menu>
                  ) : null}
                </View>
              </Animated.View>

              {newMessageVisible ? (
                <Animated.View
                  entering={FadeInDown.duration(
                    380
                  )}
                  style={
                    styles.newMessageCard
                  }
                >
                  <View
                    style={
                      styles.newMessageHeader
                    }
                  >
                    <View
                      style={
                        styles.newMessageIcon
                      }
                    >
                      <MaterialCommunityIcons
                        name="message-plus-outline"
                        size={26}
                        color={colors.primary}
                      />
                    </View>

                    <View
                      style={
                        styles.newMessageHeading
                      }
                    >
                      <Text
                        style={
                          styles.newMessageTitle
                        }
                      >
                        Start a new conversation
                      </Text>

                      <Text
                        style={
                          styles.newMessageDescription
                        }
                      >
                        Send a secure message to a
                        tenant, landlord or colleague.
                      </Text>
                    </View>

                    <IconButton
                      icon="close"
                      size={20}
                      iconColor={
                        colors.textMuted
                      }
                      onPress={() =>
                        setNewMessageVisible(
                          false
                        )
                      }
                    />
                  </View>

                  <View
                    style={[
                      styles.newMessageFormRow,
                      !isTablet &&
                        styles.mobileFormRow,
                    ]}
                  >
                    <TextInput
                      mode="outlined"
                      label="Contact name"
                      value={newContactName}
                      onChangeText={
                        setNewContactName
                      }
                      left={
                        <TextInput.Icon icon="account-outline" />
                      }
                      outlineColor={
                        colors.border
                      }
                      activeOutlineColor={
                        colors.primary
                      }
                      style={
                        styles.newMessageInput
                      }
                    />

                    <TextInput
                      mode="outlined"
                      label="Subject"
                      value={newSubject}
                      onChangeText={setNewSubject}
                      left={
                        <TextInput.Icon icon="format-title" />
                      }
                      outlineColor={
                        colors.border
                      }
                      activeOutlineColor={
                        colors.primary
                      }
                      style={
                        styles.newMessageInput
                      }
                    />
                  </View>

                  <TextInput
                    mode="outlined"
                    label="Message"
                    value={newMessageBody}
                    onChangeText={
                      setNewMessageBody
                    }
                    multiline
                    numberOfLines={5}
                    outlineColor={colors.border}
                    activeOutlineColor={
                      colors.primary
                    }
                    style={
                      styles.newMessageBodyInput
                    }
                  />

                  <View
                    style={
                      styles.newMessageActions
                    }
                  >
                    <Button
                      mode="outlined"
                      textColor={colors.primary}
                      style={styles.cancelButton}
                      onPress={() =>
                        setNewMessageVisible(
                          false
                        )
                      }
                    >
                      Cancel
                    </Button>

                    <Button
                      mode="contained"
                      icon="send-outline"
                      buttonColor={colors.primary}
                      contentStyle={
                        styles.sendNewMessageContent
                      }
                      style={
                        styles.sendNewMessageButton
                      }
                      onPress={
                        handleCreateConversation
                      }
                    >
                      Send message
                    </Button>
                  </View>
                </Animated.View>
              ) : null}

              <Animated.View
                entering={FadeInDown.delay(
                  100
                ).duration(430)}
                style={styles.messagingLayout}
              >
                {(!mobileConversationVisible ||
                  isDesktop) && (
                  <View
                    style={
                      styles.conversationPanel
                    }
                  >
                    <View
                      style={
                        styles.conversationPanelHeader
                      }
                    >
                      <View>
                        <Text
                          style={
                            styles.conversationPanelTitle
                          }
                        >
                          Conversations
                        </Text>

                        <Text
                          style={
                            styles.conversationPanelDescription
                          }
                        >
                          {unreadTotal} unread
                          message
                          {unreadTotal === 1
                            ? ""
                            : "s"}
                        </Text>
                      </View>

                      <IconButton
                        icon="refresh"
                        size={19}
                        iconColor={
                          colors.primary
                        }
                        style={
                          styles.refreshButton
                        }
                        onPress={() =>
                          showMessage(
                            "Messages refreshed."
                          )
                        }
                      />
                    </View>

                    <Searchbar
                      placeholder="Search conversations"
                      value={searchQuery}
                      onChangeText={
                        setSearchQuery
                      }
                      style={styles.searchbar}
                      inputStyle={
                        styles.searchInput
                      }
                    />

                    <View
                      style={styles.filterRow}
                    >
                      {filters.map((filter) => {
                        const selected =
                          activeFilter === filter;

                        return (
                          <Pressable
                            key={filter}
                            onPress={() =>
                              setActiveFilter(
                                filter
                              )
                            }
                            style={({
                              pressed,
                            }) => [
                              styles.filterButton,
                              selected &&
                                styles.selectedFilterButton,
                              pressed &&
                                styles.pressedItem,
                            ]}
                          >
                            <Text
                              style={[
                                styles.filterButtonText,
                                selected &&
                                  styles.selectedFilterButtonText,
                              ]}
                            >
                              {filter}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    <Divider
                      style={
                        styles.conversationDivider
                      }
                    />

                    {filteredConversations.length >
                    0 ? (
                      <View
                        style={
                          styles.conversationList
                        }
                      >
                        {filteredConversations.map(
                          (
                            conversation,
                            index
                          ) => {
                            const selected =
                              conversation.id ===
                              selectedConversationId;

                            return (
                              <Animated.View
                                key={
                                  conversation.id
                                }
                                entering={FadeIn.delay(
                                  index * 45
                                ).duration(260)}
                              >
                                <Pressable
                                  onPress={() =>
                                    handleSelectConversation(
                                      conversation
                                    )
                                  }
                                  style={({
                                    pressed,
                                  }) => [
                                    styles.conversationItem,
                                    selected &&
                                      styles.selectedConversationItem,
                                    conversation.unreadCount >
                                      0 &&
                                      styles.unreadConversationItem,
                                    pressed &&
                                      styles.pressedItem,
                                  ]}
                                >
                                  <View
                                    style={
                                      styles.conversationAvatarWrapper
                                    }
                                  >
                                    <Avatar.Text
                                      size={46}
                                      label={
                                        conversation.initials
                                      }
                                      labelStyle={
                                        styles.contactAvatarLabel
                                      }
                                      style={
                                        styles.contactAvatar
                                      }
                                    />

                                    {conversation.unreadCount >
                                    0 ? (
                                      <View
                                        style={
                                          styles.onlineIndicator
                                        }
                                      />
                                    ) : null}
                                  </View>

                                  <View
                                    style={
                                      styles.conversationInformation
                                    }
                                  >
                                    <View
                                      style={
                                        styles.conversationNameRow
                                      }
                                    >
                                      <Text
                                        numberOfLines={
                                          1
                                        }
                                        style={[
                                          styles.conversationName,
                                          conversation.unreadCount >
                                            0 &&
                                            styles.unreadConversationText,
                                        ]}
                                      >
                                        {
                                          conversation.contactName
                                        }
                                      </Text>

                                      <Text
                                        style={[
                                          styles.conversationTime,
                                          conversation.unreadCount >
                                            0 &&
                                            styles.unreadConversationTime,
                                        ]}
                                      >
                                        {
                                          conversation.lastMessageTime
                                        }
                                      </Text>
                                    </View>

                                    <Text
                                      numberOfLines={
                                        1
                                      }
                                      style={
                                        styles.conversationSubject
                                      }
                                    >
                                      {
                                        conversation.subject
                                      }
                                    </Text>

                                    <Text
                                      numberOfLines={
                                        2
                                      }
                                      style={[
                                        styles.conversationPreview,
                                        conversation.unreadCount >
                                          0 &&
                                          styles.unreadConversationText,
                                      ]}
                                    >
                                      {
                                        conversation.preview
                                      }
                                    </Text>

                                    <View
                                      style={
                                        styles.conversationMetadata
                                      }
                                    >
                                      <Text
                                        style={
                                          styles.contactTypeText
                                        }
                                      >
                                        {
                                          conversation.contactType
                                        }
                                      </Text>

                                      <View
                                        style={
                                          styles.metadataDot
                                        }
                                      />

                                      <Text
                                        numberOfLines={
                                          1
                                        }
                                        style={
                                          styles.propertyMetadataText
                                        }
                                      >
                                        {
                                          conversation.property
                                        }
                                      </Text>

                                      {conversation.unreadCount >
                                      0 ? (
                                        <Badge
                                          size={22}
                                          style={
                                            styles.unreadBadge
                                          }
                                        >
                                          {
                                            conversation.unreadCount
                                          }
                                        </Badge>
                                      ) : null}
                                    </View>
                                  </View>
                                </Pressable>
                              </Animated.View>
                            );
                          }
                        )}
                      </View>
                    ) : (
                      <View
                        style={
                          styles.emptyConversationState
                        }
                      >
                        <View
                          style={
                            styles.emptyConversationIcon
                          }
                        >
                          <MaterialCommunityIcons
                            name="message-outline"
                            size={34}
                            color={
                              colors.primary
                            }
                          />
                        </View>

                        <Text
                          style={
                            styles.emptyConversationTitle
                          }
                        >
                          No conversations found
                        </Text>

                        <Text
                          style={
                            styles.emptyConversationDescription
                          }
                        >
                          Change the search or
                          selected filter.
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {(mobileConversationVisible ||
                  isDesktop) &&
                selectedConversation ? (
                  <View
                    style={styles.chatPanel}
                  >
                    <View
                      style={styles.chatHeader}
                    >
                      {!isDesktop ? (
                        <IconButton
                          icon="arrow-left"
                          size={21}
                          iconColor={
                            colors.primary
                          }
                          style={
                            styles.mobileBackButton
                          }
                          onPress={() =>
                            setMobileConversationVisible(
                              false
                            )
                          }
                        />
                      ) : null}

                      <Avatar.Text
                        size={48}
                        label={
                          selectedConversation.initials
                        }
                        labelStyle={
                          styles.chatAvatarLabel
                        }
                        style={styles.chatAvatar}
                      />

                      <View
                        style={
                          styles.chatContactInformation
                        }
                      >
                        <Text
                          style={
                            styles.chatContactName
                          }
                        >
                          {
                            selectedConversation.contactName
                          }
                        </Text>

                        <View
                          style={
                            styles.chatContactMetadata
                          }
                        >
                          <Text
                            style={
                              styles.chatContactType
                            }
                          >
                            {
                              selectedConversation.contactType
                            }
                          </Text>

                          <View
                            style={
                              styles.metadataDot
                            }
                          />

                          <Text
                            numberOfLines={1}
                            style={
                              styles.chatProperty
                            }
                          >
                            {
                              selectedConversation.property
                            }
                          </Text>
                        </View>
                      </View>

                      <View
                        style={
                          styles.chatHeaderActions
                        }
                      >
                        {isTablet ? (
                          <IconButton
                            icon="phone-outline"
                            size={20}
                            iconColor={
                              colors.primary
                            }
                            style={
                              styles.chatActionButton
                            }
                            onPress={() =>
                              showMessage(
                                `Calling ${selectedConversation.contactName}.`
                              )
                            }
                          />
                        ) : null}

                        <Menu
                          visible={
                            conversationMenuVisible
                          }
                          onDismiss={() =>
                            setConversationMenuVisible(
                              false
                            )
                          }
                          anchor={
                            <IconButton
                              icon="dots-vertical"
                              size={21}
                              iconColor={
                                colors.primary
                              }
                              style={
                                styles.chatActionButton
                              }
                              onPress={() =>
                                setConversationMenuVisible(
                                  true
                                )
                              }
                            />
                          }
                        >
                          {selectedConversation.status ===
                          "Resolved" ? (
                            <Menu.Item
                              leadingIcon="folder-open-outline"
                              title="Reopen conversation"
                              onPress={
                                handleReopenConversation
                              }
                            />
                          ) : (
                            <Menu.Item
                              leadingIcon="check-circle-outline"
                              title="Mark as resolved"
                              onPress={
                                handleMarkResolved
                              }
                            />
                          )}

                          <Menu.Item
                            leadingIcon="bell-off-outline"
                            title="Mute notifications"
                            onPress={() => {
                              setConversationMenuVisible(
                                false
                              );
                              showMessage(
                                "Conversation notifications muted."
                              );
                            }}
                          />

                          <Divider />

                          <Menu.Item
                            leadingIcon="delete-outline"
                            title="Delete conversation"
                            onPress={
                              handleDeleteConversation
                            }
                          />
                        </Menu>
                      </View>
                    </View>

                    <View
                      style={
                        styles.caseInformationBar
                      }
                    >
                      <View
                        style={
                          styles.caseInformationText
                        }
                      >
                        <Text
                          style={
                            styles.caseSubject
                          }
                        >
                          {
                            selectedConversation.subject
                          }
                        </Text>

                        {selectedConversation.inspectionId ? (
                          <Pressable
                            onPress={() =>
                              router.push({
                                pathname:
                                  "/council/inspection-details" as never,
                                params: {
                                  inspectionId:
                                    selectedConversation.inspectionId,
                                },
                              })
                            }
                            style={
                              styles.inspectionLink
                            }
                          >
                            <MaterialCommunityIcons
                              name="clipboard-search-outline"
                              size={14}
                              color={
                                colors.primary
                              }
                            />

                            <Text
                              style={
                                styles.inspectionLinkText
                              }
                            >
                              {
                                selectedConversation.inspectionId
                              }
                            </Text>
                          </Pressable>
                        ) : null}
                      </View>

                      <ConversationStatusBadge
                        status={
                          selectedConversation.status
                        }
                      />
                    </View>

                    <View
                      style={styles.messagesArea}
                    >
                      <View
                        style={
                          styles.dateSeparator
                        }
                      >
                        <View
                          style={
                            styles.dateSeparatorLine
                          }
                        />

                        <Text
                          style={
                            styles.dateSeparatorText
                          }
                        >
                          Recent messages
                        </Text>

                        <View
                          style={
                            styles.dateSeparatorLine
                          }
                        />
                      </View>

                      <View
                        style={
                          styles.messageList
                        }
                      >
                        {selectedConversation.messages.map(
                          (message, index) => {
                            const isOwnMessage =
                              message.sender ===
                              "me";

                            return (
                              <Animated.View
                                key={message.id}
                                entering={FadeInUp.delay(
                                  index * 50
                                ).duration(280)}
                                style={[
                                  styles.messageRow,
                                  isOwnMessage
                                    ? styles.ownMessageRow
                                    : styles.contactMessageRow,
                                ]}
                              >
                                {!isOwnMessage ? (
                                  <Avatar.Text
                                    size={32}
                                    label={
                                      selectedConversation.initials
                                    }
                                    labelStyle={
                                      styles.messageAvatarLabel
                                    }
                                    style={
                                      styles.messageAvatar
                                    }
                                  />
                                ) : null}

                                <View
                                  style={[
                                    styles.messageBubble,
                                    isOwnMessage
                                      ? styles.ownMessageBubble
                                      : styles.contactMessageBubble,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.messageBody,
                                      isOwnMessage &&
                                        styles.ownMessageBody,
                                    ]}
                                  >
                                    {message.body}
                                  </Text>

                                  <View
                                    style={
                                      styles.messageTimeRow
                                    }
                                  >
                                    <Text
                                      style={[
                                        styles.messageTime,
                                        isOwnMessage &&
                                          styles.ownMessageTime,
                                      ]}
                                    >
                                      {
                                        message.time
                                      }
                                    </Text>

                                    {isOwnMessage ? (
                                      <MaterialCommunityIcons
                                        name={
                                          message.read
                                            ? "check-all"
                                            : "check"
                                        }
                                        size={14}
                                        color="rgba(255,255,255,0.82)"
                                      />
                                    ) : null}
                                  </View>
                                </View>
                              </Animated.View>
                            );
                          }
                        )}
                      </View>
                    </View>

                    {selectedConversation.status ===
                    "Resolved" ? (
                      <View
                        style={
                          styles.resolvedNotice
                        }
                      >
                        <MaterialCommunityIcons
                          name="check-circle-outline"
                          size={21}
                          color="#277A46"
                        />

                        <View
                          style={
                            styles.resolvedNoticeText
                          }
                        >
                          <Text
                            style={
                              styles.resolvedNoticeTitle
                            }
                          >
                            Conversation resolved
                          </Text>

                          <Text
                            style={
                              styles.resolvedNoticeDescription
                            }
                          >
                            Reopen the conversation
                            before sending another
                            message.
                          </Text>
                        </View>

                        <Button
                          mode="text"
                          textColor="#277A46"
                          onPress={
                            handleReopenConversation
                          }
                        >
                          Reopen
                        </Button>
                      </View>
                    ) : (
                      <View
                        style={
                          styles.composerContainer
                        }
                      >
                        <View
                          style={
                            styles.composerActions
                          }
                        >
                          <IconButton
                            icon="paperclip"
                            size={20}
                            iconColor={
                              colors.primary
                            }
                            style={
                              styles.composerIconButton
                            }
                            onPress={() =>
                              showMessage(
                                "Attachment picker opened."
                              )
                            }
                          />

                          <IconButton
                            icon="image-outline"
                            size={20}
                            iconColor={
                              colors.primary
                            }
                            style={
                              styles.composerIconButton
                            }
                            onPress={() =>
                              showMessage(
                                "Image picker opened."
                              )
                            }
                          />
                        </View>

                        <TextInput
                          mode="outlined"
                          placeholder="Write a message"
                          value={messageText}
                          onChangeText={
                            setMessageText
                          }
                          multiline
                          outlineColor={
                            colors.border
                          }
                          activeOutlineColor={
                            colors.primary
                          }
                          style={
                            styles.messageInput
                          }
                          onSubmitEditing={
                            handleSendMessage
                          }
                        />

                        <IconButton
                          icon="send"
                          size={23}
                          iconColor={colors.white}
                          style={
                            styles.sendButton
                          }
                          disabled={
                            !messageText.trim()
                          }
                          onPress={
                            handleSendMessage
                          }
                        />
                      </View>
                    )}
                  </View>
                ) : null}
              </Animated.View>
            </View>
          </View>
        </View>

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() =>
            setSnackbarVisible(false)
          }
          duration={3000}
          action={{
            label: "Close",
            onPress: () =>
              setSnackbarVisible(false),
          }}
        >
          {snackbarMessage}
        </Snackbar>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

function ConversationStatusBadge({
  status,
}: {
  status: ConversationStatus;
}) {
  const statusStyle =
    getConversationStatusStyle(status);

  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor:
            statusStyle.background,
        },
      ]}
    >
      <MaterialCommunityIcons
        name={statusStyle.icon}
        size={14}
        color={statusStyle.text}
      />

      <Text
        style={[
          styles.statusBadgeText,
          {
            color: statusStyle.text,
          },
        ]}
      >
        {status}
      </Text>
    </View>
  );
}

function getConversationStatusStyle(
  status: ConversationStatus
): {
  background: string;
  text: string;
  icon: IconName;
} {
  switch (status) {
    case "Open":
      return {
        background: colors.primaryLight,
        text: colors.primary,
        icon: "message-text-outline",
      };

    case "Awaiting Reply":
      return {
        background: "#FFF4E5",
        text: "#B56400",
        icon: "clock-outline",
      };

    default:
      return {
        background: "#E8F7EE",
        text: "#277A46",
        icon: "check-circle-outline",
      };
  }
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },

  screenContent: {
    flexGrow: 1,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },

  page: {
    flex: 1,
    width: "100%",
    backgroundColor: colors.background,
  },

  mobileHeader: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },

  mobileBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  mobileBrandLogo: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.primary,
  },

  mobileBrandName: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.8,
  },

  mobileBrandSubtitle: {
    marginTop: 1,
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "700",
  },

  mobileHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  mobileUnreadBadge: {
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },

  mobileUnreadBadgeText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: "900",
  },

  mobileNavigation: {
    margin: spacing.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    elevation: 3,
  },

  mobileNavigationItem: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },

  activeMobileNavigationItem: {
    backgroundColor: colors.primaryLight,
  },

  mobileNavigationLabel: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "800",
  },

  activeMobileNavigationLabel: {
    color: colors.primary,
    fontWeight: "900",
  },

  mobileDivider: {
    marginVertical: spacing.sm,
  },

  mobileLogoutButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },

  mobileLogoutText: {
    color: "#B42318",
    fontSize: 10,
    fontWeight: "900",
  },

  layout: {
    width: "100%",
    maxWidth: 1600,
    alignSelf: "center",
  },

  desktopLayout: {
    minHeight: 950,
    flexDirection: "row",
  },

  sidebar: {
    width: 280,
    minHeight: 950,
    padding: spacing.lg,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.surface,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },

  brandLogo: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: colors.primary,
  },

  brandName: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2.3,
  },

  brandSubtitle: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "700",
  },

  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },

  avatar: {
    backgroundColor: colors.primary,
  },

  avatarLabel: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "900",
  },

  profileInformation: {
    flex: 1,
  },

  profileName: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "900",
  },

  profileRole: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: "700",
  },

  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 5,
  },

  verifiedText: {
    color: "#277A46",
    fontSize: 7,
    fontWeight: "700",
  },

  navigationTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    color: colors.textMuted,
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  navigation: {
    gap: 5,
  },

  navigationItem: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },

  activeNavigationItem: {
    backgroundColor: colors.primaryLight,
  },

  pressedNavigationItem: {
    opacity: 0.68,
  },

  navigationLabel: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "800",
  },

  activeNavigationLabel: {
    color: colors.primary,
    fontWeight: "900",
  },

  navigationBadge: {
    minWidth: 23,
    height: 23,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },

  navigationBadgeText: {
    color: colors.white,
    fontSize: 7,
    fontWeight: "900",
  },

  sidebarFooter: {
    marginTop: "auto",
    paddingTop: spacing.xl,
  },

  councilInformation: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },

  councilIcon: {
    width: 39,
    height: 39,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
  },

  councilInformationText: {
    flex: 1,
  },

  councilName: {
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "900",
  },

  councilDepartment: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 7,
  },

  logoutButton: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },

  logoutText: {
    color: "#B42318",
    fontSize: 9,
    fontWeight: "900",
  },

  mainContent: {
    flex: 1,
    minWidth: 0,
    padding: spacing.lg,
  },

  topBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },

  headingSection: {
    flex: 1,
    minWidth: 240,
  },

  breadcrumbRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: spacing.sm,
  },

  breadcrumbLink: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: "800",
  },

  breadcrumbCurrent: {
    color: colors.textMuted,
    fontSize: 8,
  },

  pageTitle: {
    ...typography.headingLarge,
    color: colors.textPrimary,
  },

  pageDescription: {
    ...typography.bodyMedium,
    maxWidth: 620,
    marginTop: 5,
    color: colors.textSecondary,
  },

  topBarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  newMessageButton: {
    borderRadius: radius.md,
  },

  newMessageButtonContent: {
    minHeight: 48,
    flexDirection: "row-reverse",
  },

  newMessageButtonLabel: {
    fontSize: 9,
    fontWeight: "900",
  },

  headerProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    paddingRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },

  smallAvatar: {
    backgroundColor: colors.primary,
  },

  smallAvatarLabel: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "900",
  },

  headerProfileName: {
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "900",
  },

  headerProfileRole: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 7,
  },

  newMessageCard: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },

  newMessageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },

  newMessageIcon: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
  },

  newMessageHeading: {
    flex: 1,
  },

  newMessageTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "900",
  },

  newMessageDescription: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 8,
    lineHeight: 15,
  },

  newMessageFormRow: {
    flexDirection: "row",
    gap: spacing.md,
  },

  mobileFormRow: {
    flexDirection: "column",
  },

  newMessageInput: {
    flex: 1,
    minWidth: 0,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },

  newMessageBodyInput: {
    backgroundColor: colors.white,
  },

  newMessageActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  cancelButton: {
    borderColor: colors.primary,
  },

  sendNewMessageButton: {
    borderRadius: radius.md,
  },

  sendNewMessageContent: {
    minHeight: 46,
    flexDirection: "row-reverse",
  },

  messagingLayout: {
    minHeight: 720,
    flexDirection: "row",
    alignItems: "stretch",
    marginBottom: spacing.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },

  conversationPanel: {
    width: 380,
    maxWidth: "100%",
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.surface,
  },

  conversationPanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
  },

  conversationPanelTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "900",
  },

  conversationPanelDescription: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 8,
  },

  refreshButton: {
    borderWidth: 1,
    borderColor: colors.border,
  },

  searchbar: {
    minHeight: 48,
    marginHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    elevation: 0,
  },

  searchInput: {
    fontSize: 9,
  },

  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },

  filterButton: {
    minHeight: 32,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    backgroundColor: colors.white,
  },

  selectedFilterButton: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },

  filterButtonText: {
    color: colors.textSecondary,
    fontSize: 7,
    fontWeight: "800",
  },

  selectedFilterButtonText: {
    color: colors.primary,
    fontWeight: "900",
  },

  conversationDivider: {
    backgroundColor: colors.border,
  },

  conversationList: {
    paddingVertical: spacing.sm,
  },

  conversationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: "transparent",
  },

  selectedConversationItem: {
    borderLeftColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },

  unreadConversationItem: {
    backgroundColor: "#F8FAFF",
  },

  pressedItem: {
    opacity: 0.7,
  },

  conversationAvatarWrapper: {
    position: "relative",
  },

  contactAvatar: {
    backgroundColor: colors.primary,
  },

  contactAvatarLabel: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "900",
  },

  onlineIndicator: {
    position: "absolute",
    right: 1,
    bottom: 1,
    width: 11,
    height: 11,
    borderWidth: 2,
    borderColor: colors.white,
    borderRadius: 6,
    backgroundColor: "#277A46",
  },

  conversationInformation: {
    flex: 1,
    minWidth: 0,
  },

  conversationNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },

  conversationName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "800",
  },

  conversationTime: {
    color: colors.textMuted,
    fontSize: 7,
  },

  unreadConversationTime: {
    color: colors.primary,
    fontWeight: "900",
  },

  conversationSubject: {
    marginTop: 3,
    color: colors.primary,
    fontSize: 7,
    fontWeight: "800",
  },

  conversationPreview: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 8,
    lineHeight: 14,
  },

  unreadConversationText: {
    color: colors.textPrimary,
    fontWeight: "900",
  },

  conversationMetadata: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 7,
  },

  contactTypeText: {
    color: colors.textMuted,
    fontSize: 6,
    fontWeight: "800",
  },

  metadataDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
  },

  propertyMetadataText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 6,
  },

  unreadBadge: {
    backgroundColor: colors.primary,
  },

  emptyConversationState: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: 60,
  },

  emptyConversationIcon: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
  },

  emptyConversationTitle: {
    marginTop: spacing.md,
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
  },

  emptyConversationDescription: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 8,
    textAlign: "center",
  },

  chatPanel: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.background,
  },

  chatHeader: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },

  mobileBackButton: {
    marginLeft: -8,
  },

  chatAvatar: {
    backgroundColor: colors.primary,
  },

  chatAvatarLabel: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "900",
  },

  chatContactInformation: {
    flex: 1,
    minWidth: 0,
  },

  chatContactName: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "900",
  },

  chatContactMetadata: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },

  chatContactType: {
    color: colors.primary,
    fontSize: 7,
    fontWeight: "800",
  },

  chatProperty: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 7,
  },

  chatHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  chatActionButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },

  caseInformationBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },

  caseInformationText: {
    flex: 1,
    minWidth: 190,
  },

  caseSubject: {
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "900",
  },

  inspectionLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 5,
  },

  inspectionLinkText: {
    color: colors.primary,
    fontSize: 7,
    fontWeight: "900",
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
  },

  statusBadgeText: {
    fontSize: 7,
    fontWeight: "900",
  },

  messagesArea: {
    minHeight: 470,
    padding: spacing.lg,
  },

  dateSeparator: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },

  dateSeparatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },

  dateSeparatorText: {
    color: colors.textMuted,
    fontSize: 7,
    fontWeight: "700",
  },

  messageList: {
    gap: spacing.md,
  },

  messageRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
  },

  ownMessageRow: {
    justifyContent: "flex-end",
  },

  contactMessageRow: {
    justifyContent: "flex-start",
  },

  messageAvatar: {
    backgroundColor: colors.primary,
  },

  messageAvatarLabel: {
    color: colors.white,
    fontSize: 8,
    fontWeight: "900",
  },

  messageBubble: {
    maxWidth: "78%",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
  },

  ownMessageBubble: {
    borderBottomRightRadius: 4,
    backgroundColor: colors.primary,
  },

  contactMessageBubble: {
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
    backgroundColor: colors.surface,
  },

  messageBody: {
    color: colors.textPrimary,
    fontSize: 9,
    lineHeight: 17,
  },

  ownMessageBody: {
    color: colors.white,
  },

  messageTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: 5,
  },

  messageTime: {
    color: colors.textMuted,
    fontSize: 6,
  },

  ownMessageTime: {
    color: "rgba(255,255,255,0.78)",
  },

  composerContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },

  composerActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  composerIconButton: {
    borderWidth: 1,
    borderColor: colors.border,
  },

  messageInput: {
    flex: 1,
    maxHeight: 130,
    backgroundColor: colors.white,
  },

  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primary,
  },

  resolvedNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#B8DFCA",
    backgroundColor: "#F1FBF5",
  },

  resolvedNoticeText: {
    flex: 1,
  },

  resolvedNoticeTitle: {
    color: "#277A46",
    fontSize: 9,
    fontWeight: "900",
  },

  resolvedNoticeDescription: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 7,
  },
});