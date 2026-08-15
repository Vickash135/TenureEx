import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
    TextInput as NativeTextInput,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import { Button, Searchbar } from "react-native-paper";

import { colors, radius, spacing } from "../../src/theme";
import LandlordModuleScreen from "./LandlordModuleScreen";

type Message = {
  id: string;
  sender: "Landlord" | "Other";
  text: string;
  time: string;
};

type Conversation = {
  id: string;
  personName: string;
  role: string;
  property: string;
  unread: number;
  messages: Message[];
};

const initialConversations: Conversation[] = [
  {
    id: "C001",
    personName: "Olivia Harris",
    role: "Tenant",
    property: "18 Victoria Road",
    unread: 2,
    messages: [
      {
        id: "M1",
        sender: "Other",
        text: "The boiler is still not producing hot water.",
        time: "10:15 AM",
      },
      {
        id: "M2",
        sender: "Landlord",
        text: "I have approved the repair and assigned the heating contractor.",
        time: "10:28 AM",
      },
      {
        id: "M3",
        sender: "Other",
        text: "Thank you. Please ask them to visit after 5:30 PM.",
        time: "10:32 AM",
      },
    ],
  },
  {
    id: "C002",
    personName: "NorthWest Heating Ltd",
    role: "Maintenance Provider",
    property: "18 Victoria Road",
    unread: 0,
    messages: [
      {
        id: "M1",
        sender: "Other",
        text: "We can attend on Monday at 5:45 PM.",
        time: "Yesterday",
      },
      {
        id: "M2",
        sender: "Landlord",
        text: "The appointment is approved.",
        time: "Yesterday",
      },
    ],
  },
  {
    id: "C003",
    personName: "Sarah Mitchell",
    role: "Estate Agent",
    property: "91 High Street",
    unread: 1,
    messages: [
      {
        id: "M1",
        sender: "Other",
        text: "The property documents are currently under review.",
        time: "Monday",
      },
    ],
  },
];

export default function LandlordMessagesScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 850;

  const [conversations, setConversations] =
    useState(initialConversations);

  const [selectedId, setSelectedId] =
    useState(initialConversations[0].id);

  const [search, setSearch] = useState("");
  const [messageText, setMessageText] =
    useState("");

  const selectedConversation =
    conversations.find(
      (conversation) =>
        conversation.id === selectedId,
    ) || conversations[0];

  const filteredConversations = useMemo(() => {
    const value = search.trim().toLowerCase();

    return conversations.filter(
      (conversation) =>
        !value ||
        [
          conversation.personName,
          conversation.role,
          conversation.property,
        ]
          .join(" ")
          .toLowerCase()
          .includes(value),
    );
  }, [conversations, search]);

  const unreadTotal = conversations.reduce(
    (total, conversation) =>
      total + conversation.unread,
    0,
  );

  const selectConversation = (id: string) => {
    setSelectedId(id);

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === id
          ? {
              ...conversation,
              unread: 0,
            }
          : conversation,
      ),
    );
  };

  const sendMessage = () => {
    const text = messageText.trim();

    if (!text) return;

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === selectedId
          ? {
              ...conversation,
              messages: [
                ...conversation.messages,
                {
                  id: `M${Date.now()}`,
                  sender: "Landlord",
                  text,
                  time: getTime(),
                },
              ],
            }
          : conversation,
      ),
    );

    setMessageText("");
  };

  return (
    <LandlordModuleScreen
      pageTitle="Messages"
      pageSubtitle="Communicate with tenants, agents and maintenance providers."
      activePage="Messages"
      statistics={[
        {
          label: "Conversations",
          value: String(conversations.length),
          icon: "message-text-outline",
          helper: "Active conversations",
        },
        {
          label: "Unread",
          value: String(unreadTotal),
          icon: "email-alert-outline",
          helper: "Messages requiring attention",
        },
        {
          label: "Tenants",
          value: String(
            conversations.filter(
              (item) => item.role === "Tenant",
            ).length,
          ),
          icon: "account-key-outline",
          helper: "Tenant conversations",
        },
        {
          label: "Providers",
          value: String(
            conversations.filter(
              (item) =>
                item.role ===
                "Maintenance Provider",
            ).length,
          ),
          icon: "account-hard-hat-outline",
          helper: "Contractor conversations",
        },
      ]}
    >
      <View
        style={[
          styles.layout,
          !isDesktop && styles.mobileLayout,
        ]}
      >
        <View
          style={[
            styles.sidebar,
            !isDesktop && styles.mobileSidebar,
          ]}
        >
          <Searchbar
            placeholder="Search messages"
            value={search}
            onChangeText={setSearch}
            style={styles.search}
          />

          <ScrollView
            style={styles.conversationList}
          >
            {filteredConversations.map(
              (conversation) => (
                <Pressable
                  key={conversation.id}
                  style={[
                    styles.conversation,
                    selectedId ===
                      conversation.id &&
                      styles.selectedConversation,
                  ]}
                  onPress={() =>
                    selectConversation(
                      conversation.id,
                    )
                  }
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {conversation.personName
                        .charAt(0)
                        .toUpperCase()}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.conversationText
                    }
                  >
                    <Text
                      style={styles.personName}
                      numberOfLines={1}
                    >
                      {conversation.personName}
                    </Text>

                    <Text
                      style={styles.role}
                      numberOfLines={1}
                    >
                      {conversation.role}
                    </Text>

                    <Text
                      style={styles.property}
                      numberOfLines={1}
                    >
                      {conversation.property}
                    </Text>
                  </View>

                  {conversation.unread > 0 ? (
                    <View
                      style={styles.unreadBadge}
                    >
                      <Text
                        style={
                          styles.unreadText
                        }
                      >
                        {conversation.unread}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              ),
            )}
          </ScrollView>
        </View>

        <View style={styles.chat}>
          <View style={styles.chatHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {selectedConversation.personName
                  .charAt(0)
                  .toUpperCase()}
              </Text>
            </View>

            <View>
              <Text style={styles.chatName}>
                {selectedConversation.personName}
              </Text>

              <Text style={styles.chatRole}>
                {selectedConversation.role} ·{" "}
                {selectedConversation.property}
              </Text>
            </View>
          </View>

          <ScrollView
            style={styles.messages}
            contentContainerStyle={
              styles.messageContent
            }
          >
            {selectedConversation.messages.map(
              (message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageRow,
                    message.sender ===
                      "Landlord" &&
                      styles.myMessageRow,
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      message.sender ===
                        "Landlord"
                        ? styles.myMessage
                        : styles.otherMessage,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        message.sender ===
                          "Landlord" &&
                          styles.myMessageText,
                      ]}
                    >
                      {message.text}
                    </Text>

                    <Text
                      style={[
                        styles.messageTime,
                        message.sender ===
                          "Landlord" &&
                          styles.myMessageTime,
                      ]}
                    >
                      {message.time}
                    </Text>
                  </View>
                </View>
              ),
            )}
          </ScrollView>

          <View style={styles.composer}>
            <Button
              icon="paperclip"
              compact
              onPress={() => {}}
            >
              Attach
            </Button>

            <NativeTextInput
              placeholder="Write a message..."
              value={messageText}
              onChangeText={setMessageText}
              multiline
              style={styles.messageInput}
            />

            <Pressable
              style={styles.sendButton}
              onPress={sendMessage}
            >
              <MaterialCommunityIcons
                name="send"
                size={20}
                color={colors.white}
              />
            </Pressable>
          </View>
        </View>
      </View>
    </LandlordModuleScreen>
  );
}

function getTime() {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

const styles = StyleSheet.create({
  layout: {
    minHeight: 650,
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
  },

  mobileLayout: {
    minHeight: 900,
    flexDirection: "column",
  },

  sidebar: {
    width: 330,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },

  mobileSidebar: {
    width: "100%",
    maxHeight: 320,
    borderRightWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  search: {
    margin: spacing.md,
    backgroundColor: colors.background,
  },

  conversationList: {
    flex: 1,
  },

  conversation: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  selectedConversation: {
    backgroundColor: colors.primaryLight,
  },

  avatar: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: colors.primary,
  },

  avatarText: {
    color: colors.white,
    fontWeight: "900",
  },

  conversationText: {
    flex: 1,
    minWidth: 0,
  },

  personName: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "900",
  },

  role: {
    marginTop: 2,
    color: colors.primary,
    fontSize: 9,
    fontWeight: "700",
  },

  property: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 9,
  },

  unreadBadge: {
    minWidth: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: colors.error,
  },

  unreadText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: "900",
  },

  chat: {
    flex: 1,
    minWidth: 0,
  },

  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  chatName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "900",
  },

  chatRole: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 9,
  },

  messages: {
    flex: 1,
    backgroundColor: colors.background,
  },

  messageContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },

  messageRow: {
    alignItems: "flex-start",
  },

  myMessageRow: {
    alignItems: "flex-end",
  },

  messageBubble: {
    maxWidth: "78%",
    padding: spacing.md,
    borderRadius: radius.lg,
  },

  otherMessage: {
    backgroundColor: colors.white,
  },

  myMessage: {
    backgroundColor: colors.primary,
  },

  messageText: {
    color: colors.textPrimary,
    fontSize: 11,
    lineHeight: 18,
  },

  myMessageText: {
    color: colors.white,
  },

  messageTime: {
    marginTop: 6,
    color: colors.textMuted,
    fontSize: 8,
  },

  myMessageTime: {
    color: colors.white,
    opacity: 0.8,
  },

  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  messageInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    color: colors.textPrimary,
  },

  sendButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: colors.primary,
  },
});