import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
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
    TextInput,
} from "react-native-paper";

import ScreenContainer from "../../src/components/ScreenContainer";
import { colors, radius, spacing } from "../../src/theme";

type Conversation = {
  id: string;
  name: string;
  role: string;
  preview: string;
  time: string;
  unread: number;
};

type Message = {
  id: string;
  sender: "tenant" | "agent";
  text: string;
  time: string;
};

const conversations: Conversation[] = [
  {
    id: "CONV-001",
    name: "Emma Wilson",
    role: "Property manager",
    preview:
      "Thank you. We have received your maintenance request.",
    time: "10:42",
    unread: 1,
  },
  {
    id: "CONV-002",
    name: "TenureEx Support",
    role: "Support team",
    preview:
      "Your tenancy agreement has been completed.",
    time: "Yesterday",
    unread: 0,
  },
];

const initialMessages: Record<string, Message[]> = {
  "CONV-001": [
    {
      id: "MSG-001",
      sender: "agent",
      text: "Hello Vickash. How can I help with your property?",
      time: "10:20",
    },
    {
      id: "MSG-002",
      sender: "tenant",
      text: "The kitchen tap has started leaking.",
      time: "10:31",
    },
    {
      id: "MSG-003",
      sender: "agent",
      text: "Thank you. We have received your maintenance request.",
      time: "10:42",
    },
  ],

  "CONV-002": [
    {
      id: "MSG-004",
      sender: "agent",
      text: "Your tenancy agreement has been completed and saved.",
      time: "Yesterday",
    },
  ],
};

export default function MessagesScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const [selectedConversationId, setSelectedConversationId] =
    useState("CONV-001");

  const [messages, setMessages] =
    useState<Record<string, Message[]>>(
      initialMessages,
    );

  const [newMessage, setNewMessage] = useState("");

  const selectedConversation = useMemo(
    () =>
      conversations.find(
        (conversation) =>
          conversation.id === selectedConversationId,
      ) ?? conversations[0],
    [selectedConversationId],
  );

  const selectedMessages =
    messages[selectedConversationId] ?? [];

  const handleSend = () => {
    const cleanMessage = newMessage.trim();

    if (!cleanMessage) {
      return;
    }

    const message: Message = {
      id: `MSG-${Date.now()}`,
      sender: "tenant",
      text: cleanMessage,
      time: new Date().toLocaleTimeString(
        "en-GB",
        {
          hour: "2-digit",
          minute: "2-digit",
        },
      ),
    };

    setMessages((current) => ({
      ...current,
      [selectedConversationId]: [
        ...(current[selectedConversationId] ?? []),
        message,
      ],
    }));

    setNewMessage("");
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
                name="message-text-outline"
                size={27}
                color={colors.white}
              />
            </View>

            <View>
              <Text style={styles.brandName}>
                Messages
              </Text>

              <Text style={styles.brandSubtitle}>
                Tenant communication
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

        <View
          style={[
            styles.messagingLayout,
            !isDesktop &&
              styles.messagingLayoutStacked,
          ]}
        >
          <View
            style={[
              styles.conversationPanel,
              !isDesktop &&
                styles.conversationPanelMobile,
            ]}
          >
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>
                Conversations
              </Text>

              <Chip compact>
                {conversations.length}
              </Chip>
            </View>

            <Divider />

            <View style={styles.conversationList}>
              {conversations.map((conversation) => {
                const selected =
                  selectedConversationId ===
                  conversation.id;

                return (
                  <Pressable
                    key={conversation.id}
                    style={[
                      styles.conversationItem,
                      selected &&
                        styles.conversationItemSelected,
                    ]}
                    onPress={() =>
                      setSelectedConversationId(
                        conversation.id,
                      )
                    }
                  >
                    <View style={styles.avatar}>
                      <MaterialCommunityIcons
                        name="account-outline"
                        size={25}
                        color={colors.primary}
                      />
                    </View>

                    <View style={styles.conversationContent}>
                      <View
                        style={styles.conversationTop}
                      >
                        <Text
                          style={
                            styles.conversationName
                          }
                        >
                          {conversation.name}
                        </Text>

                        <Text
                          style={
                            styles.conversationTime
                          }
                        >
                          {conversation.time}
                        </Text>
                      </View>

                      <Text
                        style={styles.conversationRole}
                      >
                        {conversation.role}
                      </Text>

                      <Text
                        style={
                          styles.conversationPreview
                        }
                        numberOfLines={1}
                      >
                        {conversation.preview}
                      </Text>
                    </View>

                    {conversation.unread > 0 ? (
                      <View style={styles.unreadBadge}>
                        <Text
                          style={styles.unreadText}
                        >
                          {conversation.unread}
                        </Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.chatPanel}>
            <View style={styles.chatHeader}>
              <View style={styles.avatar}>
                <MaterialCommunityIcons
                  name="account-tie-outline"
                  size={25}
                  color={colors.primary}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.chatName}>
                  {selectedConversation.name}
                </Text>

                <Text style={styles.chatRole}>
                  {selectedConversation.role}
                </Text>
              </View>

              <Button
                mode="text"
                icon="information-outline"
              >
                Details
              </Button>
            </View>

            <Divider />

            <View style={styles.messageArea}>
              {selectedMessages.map((message) => {
                const tenant =
                  message.sender === "tenant";

                return (
                  <View
                    key={message.id}
                    style={[
                      styles.messageRow,
                      tenant &&
                        styles.messageRowTenant,
                    ]}
                  >
                    <View
                      style={[
                        styles.messageBubble,
                        tenant &&
                          styles.messageBubbleTenant,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          tenant &&
                            styles.messageTextTenant,
                        ]}
                      >
                        {message.text}
                      </Text>

                      <Text
                        style={[
                          styles.messageTime,
                          tenant &&
                            styles.messageTimeTenant,
                        ]}
                      >
                        {message.time}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            <Divider />

            <View style={styles.messageComposer}>
              <TextInput
                mode="outlined"
                placeholder="Type your message"
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
                style={styles.messageInput}
                left={
                  <TextInput.Icon icon="message-outline" />
                }
              />

              <Button
                mode="contained"
                icon="send"
                disabled={!newMessage.trim()}
                onPress={handleSend}
              >
                Send
              </Button>
            </View>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
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

  messagingLayout: {
    minHeight: 680,
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  messagingLayoutStacked: {
    flexDirection: "column",
  },

  conversationPanel: {
    width: 340,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },

  conversationPanelMobile: {
    width: "100%",
    borderRightWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
  },

  panelTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "900",
  },

  conversationList: {
    padding: spacing.sm,
    gap: spacing.sm,
  },

  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
  },

  conversationItemSelected: {
    backgroundColor: colors.primaryLight,
  },

  avatar: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
  },

  conversationContent: {
    flex: 1,
    minWidth: 0,
  },

  conversationTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },

  conversationName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: "900",
  },

  conversationTime: {
    color: colors.textMuted,
    fontSize: 7,
  },

  conversationRole: {
    marginTop: 3,
    color: colors.primary,
    fontSize: 8,
    fontWeight: "700",
  },

  conversationPreview: {
    marginTop: 5,
    color: colors.textMuted,
    fontSize: 8,
  },

  unreadBadge: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: colors.primary,
  },

  unreadText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: "900",
  },

  chatPanel: {
    flex: 1,
    minWidth: 0,
  },

  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },

  chatName: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "900",
  },

  chatRole: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 8,
  },

  messageArea: {
    minHeight: 460,
    gap: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.background,
  },

  messageRow: {
    alignItems: "flex-start",
  },

  messageRowTenant: {
    alignItems: "flex-end",
  },

  messageBubble: {
    maxWidth: "75%",
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
  },

  messageBubbleTenant: {
    backgroundColor: colors.primary,
  },

  messageText: {
    color: colors.textPrimary,
    fontSize: 9,
    lineHeight: 16,
  },

  messageTextTenant: {
    color: colors.white,
  },

  messageTime: {
    marginTop: 6,
    color: colors.textMuted,
    fontSize: 7,
    textAlign: "right",
  },

  messageTimeTenant: {
    color: colors.white,
  },

  messageComposer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },

  messageInput: {
    flex: 1,
  },
});