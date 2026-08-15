import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
    FlatList,
    KeyboardAvoidingView,
    TextInput as NativeTextInput,
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
    Divider,
    Searchbar,
    Snackbar
} from "react-native-paper";
import Animated, {
    FadeInDown,
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

type ContactType = "Tenant" | "Landlord" | "Support";

type Message = {
  id: string;
  text: string;
  time: string;
  sender: "provider" | "contact";
};

type Conversation = {
  id: string;
  name: string;
  initials: string;
  role: ContactType;
  jobId?: string;
  jobTitle?: string;
  property?: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  online: boolean;
  messages: Message[];
};

const initialConversations: Conversation[] = [
  {
    id: "CONV-001",
    name: "Olivia Bennett",
    initials: "OB",
    role: "Tenant",
    jobId: "JOB-1048",
    jobTitle: "Kitchen sink leaking",
    property: "18 Meadow Lane, Leeds",
    lastMessage:
      "Yes, I will be at home for the appointment.",
    lastMessageTime: "10:12 AM",
    unread: 2,
    online: true,
    messages: [
      {
        id: "M-001",
        text:
          "Hello Olivia, this is Martin Plumbing. We have received the maintenance job for your kitchen sink.",
        time: "9:42 AM",
        sender: "provider",
      },
      {
        id: "M-002",
        text:
          "Hello, thank you. The water is still leaking underneath the sink.",
        time: "9:48 AM",
        sender: "contact",
      },
      {
        id: "M-003",
        text:
          "I can attend today at 10:30 AM. Will you be available to provide access?",
        time: "9:55 AM",
        sender: "provider",
      },
      {
        id: "M-004",
        text:
          "Yes, I will be at home for the appointment.",
        time: "10:12 AM",
        sender: "contact",
      },
    ],
  },
  {
    id: "CONV-002",
    name: "Daniel Hughes",
    initials: "DH",
    role: "Tenant",
    jobId: "JOB-1045",
    jobTitle: "Boiler pressure issue",
    property: "42 Green Road, Leeds",
    lastMessage:
      "The boiler is in the kitchen utility cupboard.",
    lastMessageTime: "Yesterday",
    unread: 1,
    online: false,
    messages: [
      {
        id: "M-005",
        text:
          "Hello Daniel, I am confirming your boiler appointment for tomorrow at 2:00 PM.",
        time: "Yesterday, 2:15 PM",
        sender: "provider",
      },
      {
        id: "M-006",
        text:
          "Thank you. The boiler is in the kitchen utility cupboard.",
        time: "Yesterday, 2:28 PM",
        sender: "contact",
      },
    ],
  },
  {
    id: "CONV-003",
    name: "Sarah Thompson",
    initials: "ST",
    role: "Landlord",
    jobId: "JOB-1048",
    jobTitle: "Kitchen sink leaking",
    property: "18 Meadow Lane, Leeds",
    lastMessage:
      "Please let me know whether any replacement parts are needed.",
    lastMessageTime: "Yesterday",
    unread: 0,
    online: false,
    messages: [
      {
        id: "M-007",
        text:
          "The kitchen sink request has been assigned to you.",
        time: "Yesterday, 11:05 AM",
        sender: "contact",
      },
      {
        id: "M-008",
        text:
          "Thank you. I will inspect the leak during today's visit.",
        time: "Yesterday, 11:16 AM",
        sender: "provider",
      },
      {
        id: "M-009",
        text:
          "Please let me know whether any replacement parts are needed.",
        time: "Yesterday, 11:22 AM",
        sender: "contact",
      },
    ],
  },
  {
    id: "CONV-004",
    name: "TenureEx Support",
    initials: "TS",
    role: "Support",
    lastMessage:
      "Your provider profile has been successfully verified.",
    lastMessageTime: "28 Jul",
    unread: 0,
    online: true,
    messages: [
      {
        id: "M-010",
        text:
          "Your provider profile has been successfully verified. You can now receive maintenance assignments.",
        time: "28 Jul, 9:00 AM",
        sender: "contact",
      },
    ],
  },
];

export default function MaintenanceMessagesScreen() {
  const { width } = useWindowDimensions();
  const messageListRef = useRef<FlatList<Message>>(null);

  const isDesktop = width >= 950;
  const isTablet = width >= 700;
  const isSmallPhone = width < 390;

  const [conversations, setConversations] =
    useState<Conversation[]>(initialConversations);

  const [selectedConversationId, setSelectedConversationId] =
    useState(initialConversations[0].id);

  const [searchQuery, setSearchQuery] = useState("");
  const [messageText, setMessageText] = useState("");

  const [snackbarVisible, setSnackbarVisible] =
    useState(false);
  const [snackbarMessage, setSnackbarMessage] =
    useState("");

  const selectedConversation =
    conversations.find(
      (conversation) =>
        conversation.id === selectedConversationId
    ) ?? conversations[0];

  const filteredConversations = useMemo(() => {
    const cleanSearch = searchQuery.trim().toLowerCase();

    if (!cleanSearch) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      return (
        conversation.name
          .toLowerCase()
          .includes(cleanSearch) ||
        conversation.lastMessage
          .toLowerCase()
          .includes(cleanSearch) ||
        conversation.jobId
          ?.toLowerCase()
          .includes(cleanSearch) ||
        conversation.jobTitle
          ?.toLowerCase()
          .includes(cleanSearch) ||
        conversation.property
          ?.toLowerCase()
          .includes(cleanSearch)
      );
    });
  }, [conversations, searchQuery]);

  const unreadCount = conversations.reduce(
    (total, conversation) =>
      total + conversation.unread,
    0
  );

  const showMessage = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleSelectConversation = (
    conversationId: string
  ) => {
    setSelectedConversationId(conversationId);

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              unread: 0,
            }
          : conversation
      )
    );
  };

  const handleSendMessage = () => {
    const cleanMessage = messageText.trim();

    if (!cleanMessage) {
      showMessage("Please enter a message.");
      return;
    }

    const newMessage: Message = {
      id: `M-${Date.now()}`,
      text: cleanMessage,
      time: "Just now",
      sender: "provider",
    };

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === selectedConversationId
          ? {
              ...conversation,
              lastMessage: cleanMessage,
              lastMessageTime: "Just now",
              messages: [
                ...conversation.messages,
                newMessage,
              ],
            }
          : conversation
      )
    );

    setMessageText("");

    setTimeout(() => {
      messageListRef.current?.scrollToEnd({
        animated: true,
      });
    }, 100);
  };

  const handleOpenJob = () => {
    if (!selectedConversation.jobId) {
      showMessage(
        "This conversation is not connected to a maintenance job."
      );
      return;
    }

    router.push({
      pathname: "/maintenance/job-details" as never,
      params: {
        jobId: selectedConversation.jobId,
      },
    });
  };

  return (
    <ScreenContainer
      scrollable={false}
      contentStyle={styles.screenContent}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={
          Platform.OS === "ios" ? "padding" : undefined
        }
      >
        <View style={styles.page}>
          <Animated.View
            entering={FadeInUp.duration(450)}
            style={styles.header}
          >
            <Pressable
              style={styles.brandRow}
              onPress={() =>
                router.replace(
                  "/maintenance/dashboard" as never
                )
              }
            >
              <View style={styles.brandLogo}>
                <MaterialCommunityIcons
                  name="home-city-outline"
                  size={27}
                  color={colors.white}
                />
              </View>

              <View>
                <Text style={styles.brandName}>
                  TENUREEX
                </Text>

                <Text style={styles.brandSubtitle}>
                  Maintenance Provider
                </Text>
              </View>
            </Pressable>

            <View style={styles.headerActions}>
              <Pressable
                style={styles.headerButton}
                onPress={() =>
                  router.replace(
                    "/maintenance/dashboard" as never
                  )
                }
              >
                <MaterialCommunityIcons
                  name="view-dashboard-outline"
                  size={20}
                  color={colors.textPrimary}
                />

                {isTablet ? (
                  <Text style={styles.headerButtonText}>
                    Dashboard
                  </Text>
                ) : null}
              </Pressable>

              <Pressable
                style={styles.profileButton}
                onPress={() =>
                  router.push(
                    "/maintenance/settings" as never
                  )
                }
              >
                <Avatar.Text
                  size={38}
                  label="MP"
                  style={styles.avatar}
                  labelStyle={styles.avatarLabel}
                />

                {isTablet ? (
                  <View>
                    <Text style={styles.profileName}>
                      Martin Plumbing
                    </Text>

                    <Text style={styles.profileRole}>
                      Provider account
                    </Text>
                  </View>
                ) : null}

                <MaterialCommunityIcons
                  name="chevron-right"
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(80).duration(450)}
            style={styles.pageHeading}
          >
            <View style={styles.headingText}>
              <Text style={styles.eyebrow}>
                COMMUNICATION
              </Text>

              <Text
                style={[
                  styles.pageTitle,
                  isSmallPhone &&
                    styles.smallPageTitle,
                ]}
              >
                Messages
              </Text>

              <Text style={styles.pageDescription}>
                Communicate with tenants, landlords and
                TenureEx support about maintenance work.
              </Text>
            </View>

            <View style={styles.unreadSummary}>
              <View style={styles.unreadIcon}>
                <MaterialCommunityIcons
                  name="message-badge-outline"
                  size={21}
                  color={colors.primary}
                />
              </View>

              <View>
                <Text style={styles.unreadValue}>
                  {unreadCount}
                </Text>

                <Text style={styles.unreadLabel}>
                  Unread messages
                </Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(150).duration(450)}
            style={[
              styles.messagesLayout,
              isDesktop && styles.desktopMessagesLayout,
            ]}
          >
            <View
              style={[
                styles.conversationPanel,
                !isDesktop &&
                  styles.mobileConversationPanel,
              ]}
            >
              <View style={styles.panelHeader}>
                <View>
                  <Text style={styles.panelTitle}>
                    Conversations
                  </Text>

                  <Text style={styles.panelDescription}>
                    {conversations.length} active chats
                  </Text>
                </View>

                <View style={styles.panelIcon}>
                  <MaterialCommunityIcons
                    name="message-text-outline"
                    size={21}
                    color={colors.primary}
                  />
                </View>
              </View>

              <Searchbar
                placeholder="Search messages"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchbar}
                inputStyle={styles.searchInput}
              />

              <Divider style={styles.divider} />

              <FlatList
                data={filteredConversations}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={
                  styles.conversationList
                }
                renderItem={({ item }) => (
                  <ConversationItem
                    conversation={item}
                    selected={
                      item.id === selectedConversationId
                    }
                    onPress={() =>
                      handleSelectConversation(item.id)
                    }
                  />
                )}
                ListEmptyComponent={
                  <View style={styles.emptyConversations}>
                    <MaterialCommunityIcons
                      name="message-outline"
                      size={36}
                      color={colors.textMuted}
                    />

                    <Text
                      style={
                        styles.emptyConversationsTitle
                      }
                    >
                      No conversations found
                    </Text>

                    <Text
                      style={
                        styles.emptyConversationsText
                      }
                    >
                      Try another search phrase.
                    </Text>
                  </View>
                }
              />
            </View>

            <View style={styles.chatPanel}>
              <View style={styles.chatHeader}>
                <View style={styles.chatContact}>
                  <View style={styles.contactAvatarWrapper}>
                    <Avatar.Text
                      size={46}
                      label={selectedConversation.initials}
                      style={styles.contactAvatar}
                      labelStyle={
                        styles.contactAvatarLabel
                      }
                    />

                    {selectedConversation.online ? (
                      <View style={styles.onlineIndicator} />
                    ) : null}
                  </View>

                  <View style={styles.chatHeaderText}>
                    <Text style={styles.contactName}>
                      {selectedConversation.name}
                    </Text>

                    <View style={styles.contactMeta}>
                      <Text style={styles.contactRole}>
                        {selectedConversation.role}
                      </Text>

                      <View style={styles.metaDot} />

                      <Text style={styles.onlineText}>
                        {selectedConversation.online
                          ? "Online"
                          : "Offline"}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.chatHeaderActions}>
                  {selectedConversation.jobId ? (
                    <Pressable
                      style={styles.chatActionButton}
                      onPress={handleOpenJob}
                    >
                      <MaterialCommunityIcons
                        name="clipboard-text-outline"
                        size={19}
                        color={colors.primary}
                      />

                      {isTablet ? (
                        <Text
                          style={
                            styles.chatActionButtonText
                          }
                        >
                          View job
                        </Text>
                      ) : null}
                    </Pressable>
                  ) : null}

                  <Pressable
                    style={styles.squareActionButton}
                    onPress={() =>
                      showMessage(
                        "Voice calling will be connected later."
                      )
                    }
                  >
                    <MaterialCommunityIcons
                      name="phone-outline"
                      size={20}
                      color={colors.textPrimary}
                    />
                  </Pressable>
                </View>
              </View>

              {selectedConversation.jobId ? (
                <Pressable
                  style={styles.jobBanner}
                  onPress={handleOpenJob}
                >
                  <View style={styles.jobBannerIcon}>
                    <MaterialCommunityIcons
                      name="tools"
                      size={20}
                      color={colors.primary}
                    />
                  </View>

                  <View style={styles.jobBannerText}>
                    <Text style={styles.jobBannerLabel}>
                      {selectedConversation.jobId}
                    </Text>

                    <Text style={styles.jobBannerTitle}>
                      {selectedConversation.jobTitle}
                    </Text>

                    <Text
                      style={styles.jobBannerProperty}
                      numberOfLines={1}
                    >
                      {selectedConversation.property}
                    </Text>
                  </View>

                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color={colors.primary}
                  />
                </Pressable>
              ) : null}

              <FlatList
                ref={messageListRef}
                data={selectedConversation.messages}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.messageList}
                onContentSizeChange={() =>
                  messageListRef.current?.scrollToEnd({
                    animated: false,
                  })
                }
                renderItem={({ item }) => (
                  <MessageBubble message={item} />
                )}
              />

              <View style={styles.composerContainer}>
                <Pressable
                  style={styles.attachmentButton}
                  onPress={() =>
                    showMessage(
                      "Attachment upload will be connected when storage is added."
                    )
                  }
                >
                  <MaterialCommunityIcons
                    name="paperclip"
                    size={22}
                    color={colors.textSecondary}
                  />
                </Pressable>

                <NativeTextInput
                  value={messageText}
                  onChangeText={setMessageText}
                  placeholder="Write a message..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  style={styles.messageInput}
                  onSubmitEditing={handleSendMessage}
                />

                <Pressable
                  style={[
                    styles.sendButton,
                    !messageText.trim() &&
                      styles.disabledSendButton,
                  ]}
                  onPress={handleSendMessage}
                  disabled={!messageText.trim()}
                >
                  <MaterialCommunityIcons
                    name="send"
                    size={20}
                    color={colors.white}
                  />
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </View>

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          action={{
            label: "Close",
            onPress: () => setSnackbarVisible(false),
          }}
        >
          {snackbarMessage}
        </Snackbar>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function ConversationItem({
  conversation,
  selected,
  onPress,
}: {
  conversation: Conversation;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.conversationItem,
        selected && styles.selectedConversationItem,
        pressed && styles.pressedConversationItem,
      ]}
    >
      <View style={styles.contactAvatarWrapper}>
        <Avatar.Text
          size={44}
          label={conversation.initials}
          style={[
            styles.listAvatar,
            selected && styles.selectedListAvatar,
          ]}
          labelStyle={[
            styles.listAvatarLabel,
            selected && styles.selectedListAvatarLabel,
          ]}
        />

        {conversation.online ? (
          <View style={styles.listOnlineIndicator} />
        ) : null}
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.conversationTopRow}>
          <Text
            style={[
              styles.conversationName,
              conversation.unread > 0 &&
                styles.unreadConversationName,
            ]}
            numberOfLines={1}
          >
            {conversation.name}
          </Text>

          <Text style={styles.conversationTime}>
            {conversation.lastMessageTime}
          </Text>
        </View>

        <View style={styles.conversationMetaRow}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>
              {conversation.role}
            </Text>
          </View>

          {conversation.jobId ? (
            <Text style={styles.conversationJobId}>
              {conversation.jobId}
            </Text>
          ) : null}
        </View>

        <View style={styles.lastMessageRow}>
          <Text
            style={[
              styles.lastMessage,
              conversation.unread > 0 &&
                styles.unreadLastMessage,
            ]}
            numberOfLines={1}
          >
            {conversation.lastMessage}
          </Text>

          {conversation.unread > 0 ? (
            <Badge style={styles.unreadBadge}>
              {conversation.unread}
            </Badge>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function MessageBubble({
  message,
}: {
  message: Message;
}) {
  const isProvider = message.sender === "provider";

  return (
    <View
      style={[
        styles.messageRow,
        isProvider
          ? styles.providerMessageRow
          : styles.contactMessageRow,
      ]}
    >
      {!isProvider ? (
        <View style={styles.smallContactAvatar}>
          <MaterialCommunityIcons
            name="account-outline"
            size={17}
            color={colors.primary}
          />
        </View>
      ) : null}

      <View
        style={[
          styles.messageBubble,
          isProvider
            ? styles.providerMessageBubble
            : styles.contactMessageBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            isProvider && styles.providerMessageText,
          ]}
        >
          {message.text}
        </Text>

        <View style={styles.messageTimeRow}>
          <Text
            style={[
              styles.messageTime,
              isProvider &&
                styles.providerMessageTime,
            ]}
          >
            {message.time}
          </Text>

          {isProvider ? (
            <MaterialCommunityIcons
              name="check-all"
              size={14}
              color="#DCE6FF"
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
    flexGrow: 1,
  },

  keyboardView: {
    flex: 1,
  },

  page: {
    flex: 1,
    width: "100%",
    maxWidth: 1440,
    alignSelf: "center",
    paddingVertical: spacing.md,
  },

  header: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  brandLogo: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
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
    fontSize: 9,
    fontWeight: "700",
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  headerButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },

  headerButtonText: {
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "800",
  },

  profileButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    backgroundColor: colors.surface,
  },

  avatar: {
    backgroundColor: colors.primaryLight,
  },

  avatarLabel: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "900",
  },

  profileName: {
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "900",
  },

  profileRole: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 7,
  },

  pageHeading: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },

  headingText: {
    flex: 1,
  },

  eyebrow: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  pageTitle: {
    ...typography.headingMedium,
    marginTop: spacing.sm,
    color: colors.textPrimary,
  },

  smallPageTitle: {
    fontSize: 26,
    lineHeight: 32,
  },

  pageDescription: {
    ...typography.bodyMedium,
    maxWidth: 700,
    marginTop: spacing.sm,
    color: colors.textSecondary,
    lineHeight: 21,
  },

  unreadSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },

  unreadIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
  },

  unreadValue: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "900",
  },

  unreadLabel: {
    marginTop: 2,
    color: colors.textSecondary,
    fontSize: 8,
  },

  messagesLayout: {
    flex: 1,
    minHeight: 620,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,

    shadowColor: colors.shadow,
    shadowOpacity: 0.7,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 7,
    },

    elevation: 3,
  },

  desktopMessagesLayout: {
    flexDirection: "row",
  },

  conversationPanel: {
    width: 360,
    padding: spacing.lg,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.surface,
  },

  mobileConversationPanel: {
    width: "100%",
    maxHeight: 330,
    borderRightWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },

  panelTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "900",
  },

  panelDescription: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 8,
  },

  panelIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
  },

  searchbar: {
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    elevation: 0,
  },

  searchInput: {
    fontSize: 10,
  },

  divider: {
    marginTop: spacing.md,
    backgroundColor: colors.border,
  },

  conversationList: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },

  conversationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
  },

  selectedConversationItem: {
    backgroundColor: colors.primaryLight,
  },

  pressedConversationItem: {
    opacity: 0.75,
  },

  contactAvatarWrapper: {
    position: "relative",
  },

  listAvatar: {
    backgroundColor: colors.background,
  },

  selectedListAvatar: {
    backgroundColor: colors.white,
  },

  listAvatarLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "900",
  },

  selectedListAvatarLabel: {
    color: colors.primary,
  },

  listOnlineIndicator: {
    position: "absolute",
    right: 0,
    bottom: 1,
    width: 11,
    height: 11,
    borderWidth: 2,
    borderColor: colors.white,
    borderRadius: 6,
    backgroundColor: "#32A852",
  },

  conversationContent: {
    flex: 1,
    minWidth: 0,
  },

  conversationTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },

  conversationName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "800",
  },

  unreadConversationName: {
    fontWeight: "900",
  },

  conversationTime: {
    color: colors.textMuted,
    fontSize: 7,
  },

  conversationMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: 5,
  },

  roleBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: colors.background,
  },

  roleBadgeText: {
    color: colors.textSecondary,
    fontSize: 6,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  conversationJobId: {
    color: colors.primary,
    fontSize: 7,
    fontWeight: "800",
  },

  lastMessageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: 7,
  },

  lastMessage: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 8,
  },

  unreadLastMessage: {
    color: colors.textSecondary,
    fontWeight: "700",
  },

  unreadBadge: {
    backgroundColor: colors.primary,
  },

  emptyConversations: {
    alignItems: "center",
    paddingVertical: 40,
  },

  emptyConversationsTitle: {
    marginTop: spacing.md,
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },

  emptyConversationsText: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 8,
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
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },

  chatContact: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  contactAvatar: {
    backgroundColor: colors.primaryLight,
  },

  contactAvatarLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
  },

  onlineIndicator: {
    position: "absolute",
    right: 1,
    bottom: 1,
    width: 12,
    height: 12,
    borderWidth: 2,
    borderColor: colors.white,
    borderRadius: 6,
    backgroundColor: "#32A852",
  },

  chatHeaderText: {
    flex: 1,
    minWidth: 0,
  },

  contactName: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "900",
  },

  contactMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },

  contactRole: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: "700",
  },

  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
  },

  onlineText: {
    color: colors.textMuted,
    fontSize: 8,
  },

  chatHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  chatActionButton: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 13,
    backgroundColor: colors.white,
  },

  chatActionButtonText: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: "900",
  },

  squareActionButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    backgroundColor: colors.white,
  },

  jobBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    margin: spacing.lg,
    marginBottom: 0,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },

  jobBannerIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.white,
  },

  jobBannerText: {
    flex: 1,
    minWidth: 0,
  },

  jobBannerLabel: {
    color: colors.primary,
    fontSize: 7,
    fontWeight: "900",
  },

  jobBannerTitle: {
    marginTop: 3,
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "900",
  },

  jobBannerProperty: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 8,
  },

  messageList: {
    flexGrow: 1,
    justifyContent: "flex-end",
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },

  messageRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },

  providerMessageRow: {
    justifyContent: "flex-end",
  },

  contactMessageRow: {
    justifyContent: "flex-start",
  },

  smallContactAvatar: {
    width: 31,
    height: 31,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: colors.primaryLight,
  },

  messageBubble: {
    maxWidth: "76%",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },

  providerMessageBubble: {
    borderBottomRightRadius: 5,
    backgroundColor: colors.primary,
  },

  contactMessageBubble: {
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 5,
    backgroundColor: colors.white,
  },

  messageText: {
    color: colors.textPrimary,
    fontSize: 9,
    lineHeight: 17,
  },

  providerMessageText: {
    color: colors.white,
  },

  messageTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: 6,
  },

  messageTime: {
    color: colors.textMuted,
    fontSize: 7,
  },

  providerMessageTime: {
    color: "#DCE6FF",
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

  attachmentButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.white,
  },

  messageInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    backgroundColor: colors.white,
    color: colors.textPrimary,
    fontSize: 10,
  },

  sendButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.primary,
  },

  disabledSendButton: {
    opacity: 0.45,
  },
});