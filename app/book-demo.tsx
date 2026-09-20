import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";

import { api } from "../src/api/client";

const NAVY = "#082D36";
const TEAL = "#087C78";
const GOLD = "#D8A83E";
const TEXT = "#153B43";
const MUTED = "#647A80";

const roles = ["Estate Agent", "Tenant", "Landlord", "Maintenance Provider", "Council Inspector"] as const;
const times = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

function dateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function BookDemoPage() {
  const { width } = useWindowDimensions();
  const desktop = width >= 940;
  const compact = width < 620;
  const float = useRef(new Animated.Value(0)).current;
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof roles)[number] | "">("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [roleOpen, setRoleOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const dates = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return { value: dateKey(d), day: d.toLocaleDateString("en-GB", { weekday: "short" }), label: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) };
  }), []);

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: -10, duration: 2200, useNativeDriver: true }),
      Animated.timing(float, { toValue: 10, duration: 2200, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [float]);

  const submit = async () => {
    setError("");
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !role || !date || !time) {
      setError("Please complete all fields and choose a demo date and time.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    try {
      setSubmitting(true);
      await api.post("/demo-bookings", { firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim().toLowerCase(), role, demoDate: date, demoTime: time });
      setSuccess(true);
    } catch (e: any) {
      setError(e?.response?.data?.message || "We could not book your demo right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return <LinearGradient colors={["#F5FAFA", "#E9F5F4"]} style={styles.successPage}>
      <View style={styles.successCard}>
        <View style={styles.successIcon}><MaterialCommunityIcons name="calendar-check" size={38} color={TEAL} /></View>
        <Text style={styles.successTitle}>Your demo request is booked.</Text>
        <Text style={styles.successText}>Thank you, {firstName}. The TenureEx team has received your details for {date} at {time} and will contact you using {email}.</Text>
        <Pressable style={styles.submitBtn} onPress={() => router.replace("/")}><Text style={styles.submitText}>Back to TenureEx</Text></Pressable>
      </View>
    </LinearGradient>;
  }

  return <ScrollView style={styles.page} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
    <View style={[styles.shell, !desktop && styles.shellStack]}>
      <LinearGradient colors={["#062A33", "#07555A", "#087C78"]} style={[styles.story, !desktop && styles.storyMobile]}>
        <View style={styles.storyGrid} />
        <Pressable style={styles.back} onPress={() => router.back()}><MaterialCommunityIcons name="arrow-left" size={18} color="#fff" /><Text style={styles.backText}>Back to TenureEx</Text></Pressable>
        <View style={styles.storyContent}>
          <View style={styles.kicker}><View style={styles.kickerDot} /><Text style={styles.kickerText}>PERSONALISED TENUREEX DEMO</Text></View>
          <Text style={[styles.storyTitle, compact && styles.storyTitleSmall]}>See how every property workflow connects.</Text>
          <Text style={styles.storyText}>Book a guided session with the TenureEx team and explore the platform from the perspective that matters to you.</Text>
          <View style={styles.points}>
            {["Role-specific platform walkthrough", "Connected property and maintenance workflows", "Council inspection and compliance visibility"].map((x) => <View key={x} style={styles.point}><View style={styles.check}><MaterialCommunityIcons name="check" size={14} color="#fff" /></View><Text style={styles.pointText}>{x}</Text></View>)}
          </View>
          <View style={styles.visualStage}>
            <Animated.View style={[styles.orbitCard, styles.cardBack, { transform: [{ translateY: float }, { perspective: 800 }, { rotateY: "-12deg" }] }]}><MaterialCommunityIcons name="home-city-outline" size={28} color="#8ADBD6" /><Text style={styles.visualLabel}>Properties</Text></Animated.View>
            <Animated.View style={[styles.orbitCard, styles.cardMain, { transform: [{ translateY: Animated.multiply(float, -0.6) }, { perspective: 800 }, { rotateY: "7deg" }] }]}><View style={styles.visualLogo}><MaterialCommunityIcons name="view-dashboard-outline" size={24} color="#fff" /></View><Text style={styles.visualTitle}>One connected workspace</Text><View style={styles.visualBars}>{["76%", "92%", "58%"].map(v => <View key={v} style={styles.visualTrack}><View style={[styles.visualFill, { width: v as any }]} /></View>)}</View></Animated.View>
            <Animated.View style={[styles.orbitCard, styles.cardFront, { transform: [{ translateY: Animated.multiply(float, 0.7) }, { perspective: 800 }, { rotateY: "10deg" }] }]}><MaterialCommunityIcons name="shield-check-outline" size={28} color={GOLD} /><Text style={styles.visualLabel}>Compliance</Text></Animated.View>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.formSide}>
        <View style={styles.formWrap}>
          <Text style={styles.formEyebrow}>BOOK A DEMO</Text>
          <Text style={styles.formTitle}>Choose a time that works for you.</Text>
          <Text style={styles.formSub}>Tell us a little about yourself and select your preferred demo slot.</Text>

          <View style={[styles.row, compact && styles.rowStack]}>
            <View style={styles.fieldHalf}><Text style={styles.label}>First name</Text><TextInput value={firstName} onChangeText={setFirstName} placeholder="First name" placeholderTextColor="#94A5A9" style={styles.input} /></View>
            <View style={styles.fieldHalf}><Text style={styles.label}>Last name</Text><TextInput value={lastName} onChangeText={setLastName} placeholder="Last name" placeholderTextColor="#94A5A9" style={styles.input} /></View>
          </View>
          <Text style={styles.label}>Email address</Text>
          <TextInput value={email} onChangeText={setEmail} placeholder="you@company.co.uk" placeholderTextColor="#94A5A9" keyboardType="email-address" autoCapitalize="none" style={styles.input} />

          <Text style={styles.label}>You are a</Text>
          <Pressable style={styles.select} onPress={() => setRoleOpen(!roleOpen)}><Text style={[styles.selectText, !role && styles.placeholder]}>{role || "Select your role"}</Text><MaterialCommunityIcons name={roleOpen ? "chevron-up" : "chevron-down"} size={22} color={MUTED} /></Pressable>
          {roleOpen && <View style={styles.menu}>{roles.map(r => <Pressable key={r} style={styles.menuItem} onPress={() => { setRole(r); setRoleOpen(false); }}><Text style={styles.menuText}>{r}</Text>{role === r && <MaterialCommunityIcons name="check" size={18} color={TEAL} />}</Pressable>)}</View>}

          <Text style={styles.label}>Preferred date</Text>
          <Pressable style={styles.select} onPress={() => setDateOpen(!dateOpen)}><Text style={[styles.selectText, !date && styles.placeholder]}>{date ? new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "Choose a date"}</Text><MaterialCommunityIcons name="calendar-month-outline" size={21} color={TEAL} /></Pressable>
          {dateOpen && <View style={styles.dateGrid}>{dates.map(d => <Pressable key={d.value} style={[styles.dateChip, date === d.value && styles.chipSelected]} onPress={() => { setDate(d.value); setDateOpen(false); }}><Text style={[styles.dateDay, date === d.value && styles.chipTextSelected]}>{d.day}</Text><Text style={[styles.dateLabel, date === d.value && styles.chipTextSelected]}>{d.label}</Text></Pressable>)}</View>}

          <Text style={styles.label}>Preferred time</Text>
          <Pressable style={styles.select} onPress={() => setTimeOpen(!timeOpen)}><Text style={[styles.selectText, !time && styles.placeholder]}>{time || "Choose a time"}</Text><MaterialCommunityIcons name="clock-outline" size={21} color={TEAL} /></Pressable>
          {timeOpen && <View style={styles.timeGrid}>{times.map(t => <Pressable key={t} style={[styles.timeChip, time === t && styles.chipSelected]} onPress={() => { setTime(t); setTimeOpen(false); }}><Text style={[styles.timeText, time === t && styles.chipTextSelected]}>{t}</Text></Pressable>)}</View>}

          {error ? <View style={styles.errorBox}><MaterialCommunityIcons name="alert-circle-outline" size={18} color="#A43B3B" /><Text style={styles.errorText}>{error}</Text></View> : null}
          <Pressable disabled={submitting} style={[styles.submitBtn, submitting && { opacity: .65 }]} onPress={() => void submit()}>{submitting ? <ActivityIndicator color="#fff" /> : <><Text style={styles.submitText}>Book my demo</Text><MaterialCommunityIcons name="arrow-right" size={20} color="#fff" /></>}</Pressable>
          <Text style={styles.privacy}>Your details are used only to arrange and manage your TenureEx demo request.</Text>
        </View>
      </View>
    </View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F7FAFA" }, shell: { minHeight: Platform.OS === "web" ? "100vh" as any : 900, flexDirection: "row" }, shellStack: { flexDirection: "column" }, story: { width: "48%", minHeight: 760, padding: 42, overflow: "hidden" }, storyMobile: { width: "100%", minHeight: 650, padding: 24 }, storyGrid: { ...StyleSheet.absoluteFillObject, opacity: .12, borderWidth: 1, borderColor: "rgba(255,255,255,.18)" }, back: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", zIndex: 2 }, backText: { color: "#D8ECEC", fontSize: 13, fontWeight: "700" }, storyContent: { flex: 1, justifyContent: "center", maxWidth: 600, alignSelf: "center", width: "100%" }, kicker: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: "rgba(218,173,65,.55)", backgroundColor: "rgba(218,173,65,.08)" }, kickerDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: GOLD }, kickerText: { color: "#E7C56C", fontSize: 11, fontWeight: "900", letterSpacing: 1.1 }, storyTitle: { marginTop: 24, color: "#fff", fontSize: 50, lineHeight: 56, fontWeight: "900", letterSpacing: -1.6 }, storyTitleSmall: { fontSize: 39, lineHeight: 45 }, storyText: { marginTop: 18, color: "#C8DDDF", fontSize: 16, lineHeight: 26, maxWidth: 530 }, points: { marginTop: 25, gap: 11 }, point: { flexDirection: "row", alignItems: "center", gap: 10 }, check: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(31,155,150,.85)" }, pointText: { color: "#E7F2F2", fontSize: 13, fontWeight: "600" }, visualStage: { height: 245, marginTop: 34, position: "relative" }, orbitCard: { position: "absolute", borderRadius: 18, borderWidth: 1, borderColor: "rgba(255,255,255,.18)", backgroundColor: "rgba(255,255,255,.10)", shadowColor: "#000", shadowOpacity: .25, shadowRadius: 20, shadowOffset: { width: 0, height: 12 } }, cardBack: { width: 150, height: 110, left: 10, top: 36, padding: 18 }, cardMain: { width: 285, height: 190, left: "23%", top: 12, padding: 24, backgroundColor: "rgba(8,47,56,.88)" }, cardFront: { width: 145, height: 105, right: 4, bottom: 0, padding: 17 }, visualLabel: { color: "#fff", marginTop: 11, fontWeight: "800", fontSize: 13 }, visualLogo: { width: 45, height: 45, borderRadius: 13, backgroundColor: TEAL, alignItems: "center", justifyContent: "center" }, visualTitle: { color: "#fff", fontSize: 18, fontWeight: "900", marginTop: 14 }, visualBars: { gap: 9, marginTop: 17 }, visualTrack: { height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,.13)", overflow: "hidden" }, visualFill: { height: "100%", borderRadius: 4, backgroundColor: "#38B9B2" }, formSide: { width: "52%", paddingHorizontal: 34, paddingVertical: 46, justifyContent: "center", backgroundColor: "#F8FBFB" }, formWrap: { width: "100%", maxWidth: 620, alignSelf: "center", backgroundColor: "#fff", borderRadius: 24, padding: 34, borderWidth: 1, borderColor: "#E2ECEC", shadowColor: "#173D44", shadowOpacity: .08, shadowRadius: 24, shadowOffset: { width: 0, height: 10 } }, formEyebrow: { color: TEAL, fontSize: 12, fontWeight: "900", letterSpacing: 1.4 }, formTitle: { color: NAVY, fontSize: 31, lineHeight: 38, fontWeight: "900", marginTop: 8 }, formSub: { color: MUTED, fontSize: 14, lineHeight: 22, marginTop: 8, marginBottom: 20 }, row: { flexDirection: "row", gap: 12 }, rowStack: { flexDirection: "column", gap: 0 }, fieldHalf: { flex: 1 }, label: { color: TEXT, fontSize: 12, fontWeight: "800", marginTop: 13, marginBottom: 7 }, input: { minHeight: 50, borderWidth: 1, borderColor: "#D8E5E6", borderRadius: 12, paddingHorizontal: 14, color: TEXT, fontSize: 14, backgroundColor: "#FBFDFD", outlineStyle: Platform.OS === "web" ? "none" as any : undefined }, select: { minHeight: 50, borderWidth: 1, borderColor: "#D8E5E6", borderRadius: 12, paddingHorizontal: 14, backgroundColor: "#FBFDFD", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, selectText: { color: TEXT, fontSize: 14, fontWeight: "600" }, placeholder: { color: "#94A5A9", fontWeight: "400" }, menu: { borderWidth: 1, borderColor: "#D8E5E6", borderRadius: 12, marginTop: 6, overflow: "hidden", backgroundColor: "#fff" }, menuItem: { minHeight: 43, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#EEF3F3" }, menuText: { color: TEXT, fontSize: 13, fontWeight: "600" }, dateGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 8 }, dateChip: { width: 74, paddingVertical: 9, borderRadius: 10, borderWidth: 1, borderColor: "#D9E5E5", alignItems: "center", backgroundColor: "#fff" }, dateDay: { color: MUTED, fontSize: 10, fontWeight: "700" }, dateLabel: { color: TEXT, fontSize: 12, fontWeight: "800", marginTop: 2 }, chipSelected: { backgroundColor: TEAL, borderColor: TEAL }, chipTextSelected: { color: "#fff" }, timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 8 }, timeChip: { minWidth: 65, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: "#D9E5E5", alignItems: "center" }, timeText: { color: TEXT, fontSize: 12, fontWeight: "800" }, errorBox: { flexDirection: "row", gap: 8, alignItems: "center", backgroundColor: "#FFF2F2", borderRadius: 10, padding: 11, marginTop: 14 }, errorText: { flex: 1, color: "#8F3333", fontSize: 12, lineHeight: 18 }, submitBtn: { minHeight: 54, borderRadius: 13, backgroundColor: TEAL, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 20 }, submitText: { color: "#fff", fontSize: 14, fontWeight: "900" }, privacy: { textAlign: "center", color: "#819398", fontSize: 11, lineHeight: 17, marginTop: 12 }, successPage: { flex: 1, minHeight: Platform.OS === "web" ? "100vh" as any : 700, alignItems: "center", justifyContent: "center", padding: 22 }, successCard: { width: "100%", maxWidth: 520, backgroundColor: "#fff", borderRadius: 26, padding: 38, alignItems: "center", borderWidth: 1, borderColor: "#DDEAEA" }, successIcon: { width: 76, height: 76, borderRadius: 38, backgroundColor: "#E5F5F3", alignItems: "center", justifyContent: "center" }, successTitle: { color: NAVY, fontSize: 27, fontWeight: "900", textAlign: "center", marginTop: 20 }, successText: { color: MUTED, fontSize: 14, lineHeight: 23, textAlign: "center", marginTop: 10 },
});
