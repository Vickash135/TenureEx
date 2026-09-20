import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { api } from "../src/api/client";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

type Portal = {
  icon: IconName;
  title: string;
  tag: string;
  description: string;
  features: string[];
};

const NAVY = "#0A2F38";
const NAVY_2 = "#08272F";
const TEAL = "#087C78";
const TEAL_2 = "#1F9B96";
const GOLD = "#C89B3C";
const ICE = "#F3F8F8";
const TEXT = "#123A42";
const MUTED = "#61777D";

const portals: Portal[] = [
  {
    icon: "office-building-cog-outline",
    title: "Estate Agent Portal",
    tag: "Your command centre",
    description: "Manage properties, tenancies, landlords, applicants and operational workflows from one connected workspace.",
    features: ["Portfolio management", "Tenancy lifecycle", "Applications & enquiries", "Compliance visibility"],
  },
  {
    icon: "home-account",
    title: "Landlord Portal",
    tag: "Portfolio visibility",
    description: "Give landlords a clear self-service view of their properties, maintenance, documents and tenancy activity.",
    features: ["Property overview", "Maintenance visibility", "Document access", "Council inspection updates"],
  },
  {
    icon: "account-outline",
    title: "Tenant Portal",
    tag: "Simple tenant experience",
    description: "Tenants can manage their home, maintenance availability, documents, applications and inspection activity.",
    features: ["My Home workspace", "Maintenance requests", "Documents", "Council inspections"],
  },
  {
    icon: "tools",
    title: "Maintenance Portal",
    tag: "Job management",
    description: "Approved providers can discover jobs, choose tenant-approved slots, document work and complete jobs digitally.",
    features: ["Available jobs", "Assigned work", "Photo evidence", "Completed jobs"],
  },
  {
    icon: "clipboard-check-outline",
    title: "Council / Inspector Portal",
    tag: "Inspection workflow",
    description: "A dedicated inspection workflow for authorised inspectors, required actions, evidence and case closure.",
    features: ["Inspection requests", "Scheduling", "Findings & actions", "Verification & closure"],
  },
  {
    icon: "home-search-outline",
    title: "Property Marketplace",
    tag: "Rental discovery",
    description: "Approved rental properties can be discovered by prospective tenants through the TenureEx property experience.",
    features: ["Property search", "Listing details", "Tenant enquiries", "Connected applications"],
  },
];

const featureCards = [
  ["shield-check-outline", "Compliance workflows", "Keep property and tenancy activity connected to the records and workflows your team needs."],
  ["bell-badge-outline", "Real-time notifications", "Role-specific notifications keep agents, landlords, tenants and providers aligned."],
  ["wrench-clock-outline", "Maintenance coordination", "Move from tenant availability to provider selection, job progress and completion evidence."],
  ["account-group-outline", "Connected stakeholders", "Different portals, one shared operational system with permission-aware access."],
  ["file-document-check-outline", "Digital records", "Keep important workflow evidence and documents attached to the right property and user."],
  ["chart-timeline-variant-shimmer", "Built to evolve", "TenureEx continues to evolve with new automation and intelligence features."],
] as const;


function SectionHeading({ eyebrow, title, subtitle, light = false }: { eyebrow: string; title: string; subtitle: string; light?: boolean }) {
  return (
    <View style={styles.headingWrap}>
      <Text style={[styles.eyebrow, light && styles.eyebrowLight]}>{eyebrow}</Text>
      <Text style={[styles.sectionTitle, light && styles.lightText]}>{title}</Text>
      <Text style={[styles.sectionSubtitle, light && styles.lightMuted]}>{subtitle}</Text>
    </View>
  );
}

export default function LandingPage() {
  const { width } = useWindowDimensions();
  const desktop = width >= 980;
  const tablet = width >= 720;
  const compact = width < 720;

  const [demoOpen, setDemoOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const floatA = useRef(new Animated.Value(0)).current;
  const floatB = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(floatA, { toValue: 1, duration: 2800, useNativeDriver: true }),
        Animated.timing(floatA, { toValue: 0, duration: 2800, useNativeDriver: true }),
      ]),
    );
    const b = Animated.loop(
      Animated.sequence([
        Animated.timing(floatB, { toValue: 1, duration: 3500, useNativeDriver: true }),
        Animated.timing(floatB, { toValue: 0, duration: 3500, useNativeDriver: true }),
      ]),
    );
    a.start();
    b.start();
    return () => {
      a.stop();
      b.stop();
    };
  }, [floatA, floatB]);

  const heroShiftA = floatA.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });
  const heroShiftB = floatB.interpolate({ inputRange: [0, 1], outputRange: [0, 18] });

  const scrollToSection = (id: string) => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;

    const target =
      document.getElementById(id) ||
      document.querySelector(`[data-testid="${id}"]`) ||
      document.querySelector(`[nativeid="${id}"]`);

    if (!target) return;

    const top = target.getBoundingClientRect().top + window.scrollY - 76;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  };

  const openDemo = () => {
    setError("");
    setSuccess(false);
    setDemoOpen(true);
  };

  const submitDemo = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await api.post("/demo-requests", { email: cleanEmail });
      setSuccess(true);
      setEmail("");
    } catch (requestError: any) {
      const message = requestError?.response?.data?.message;
      setError(Array.isArray(message) ? message.join("\n") : typeof message === "string" ? message : "We could not send your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const stats = useMemo(() => [
    ["6", "Connected experiences"],
    ["1", "Shared platform"],
    ["24/7", "Digital access"],
    ["UK", "Built for property teams"],
  ], []);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.page} stickyHeaderIndices={[0]} showsVerticalScrollIndicator={false}>
        <View style={styles.navWrap}>
          <View style={[styles.nav, !desktop && styles.navCompact]}>
            <Pressable style={styles.brand} onPress={() => Platform.OS === "web" && typeof window !== "undefined" ? window.scrollTo({ top: 0, behavior: "smooth" }) : null}>
              <View style={styles.brandMark}><MaterialCommunityIcons name="home-city-outline" size={25} color="#fff" /></View>
              <View>
                <Text style={styles.brandName}>TENUREEX</Text>
                <Text style={styles.brandSub}>PROPERTY PLATFORM</Text>
              </View>
            </Pressable>

            {desktop ? (
              <View style={styles.navLinks}>
                <Pressable onPress={() => scrollToSection("platform")}><Text style={styles.navLink}>Platform</Text></Pressable>
                <Pressable onPress={() => scrollToSection("why-tenureex")}><Text style={styles.navLink}>Why TenureEx</Text></Pressable>
                <Pressable onPress={() => scrollToSection("intelligence")}><Text style={styles.navLink}>AI Roadmap</Text></Pressable>
                <Pressable onPress={() => scrollToSection("compliance")}><Text style={styles.navLink}>Compliance</Text></Pressable>
                <Pressable onPress={() => scrollToSection("pricing")}><Text style={styles.navLink}>Pricing</Text></Pressable>
              </View>
            ) : null}

            <View style={styles.navActions}>
              <Pressable style={styles.demoNavBtn} onPress={() => router.push("/book-demo" as Href)}>
                <Text style={styles.demoNavText}>{compact ? "Demo" : "Book a Demo"}</Text>
                <MaterialCommunityIcons name="calendar-outline" size={17} color="#fff" />
              </Pressable>
              <Pressable style={styles.accessNavBtn} onPress={openDemo}>
                <Text style={styles.accessNavText}>{compact ? "Access" : "Sign Up / Login"}</Text>
                <MaterialCommunityIcons name="login" size={17} color={NAVY} />
              </Pressable>
            </View>
          </View>
        </View>

        <LinearGradient colors={[NAVY_2, NAVY, "#0A5D61"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroGrid} pointerEvents="none" />
          <View style={[styles.heroInner, !desktop && styles.heroInnerStack]}>
            <View style={styles.heroCopy}>
              <View style={styles.testBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.testBadgeText}>TENUREEX PROPERTY PLATFORM</Text>
              </View>
              <Text style={[styles.heroTitle, compact && styles.heroTitleCompact]}>
                Property management, connected from <Text style={styles.heroGold}>one place.</Text>
              </Text>
              <Text style={styles.heroSub}>
                TenureEx brings estate agents, landlords, tenants, maintenance providers and council inspectors into one connected property workflow — designed for clearer communication, fewer handoffs and better visibility.
              </Text>
              <View style={styles.heroActions}>
                <Pressable style={styles.primaryHeroBtn} onPress={openDemo}>
                  <Text style={styles.primaryHeroText}>Sign Up / Login</Text>
                  <MaterialCommunityIcons name="arrow-right" size={20} color={NAVY} />
                </Pressable>
                <Pressable style={styles.secondaryHeroBtn} onPress={() => router.push("/rent" as Href)}>
                  <MaterialCommunityIcons name="home-search-outline" size={20} color="#fff" />
                  <Text style={styles.secondaryHeroText}>Explore Rentals</Text>
                </Pressable>
              </View>
              <View style={styles.heroTrustRow}>
                <View style={styles.heroTrust}><MaterialCommunityIcons name="shield-lock-outline" size={18} color="#8BD9D5" /><Text style={styles.heroTrustText}>Role-based access</Text></View>
                <View style={styles.heroTrust}><MaterialCommunityIcons name="database-outline" size={18} color="#8BD9D5" /><Text style={styles.heroTrustText}>Connected records</Text></View>
                <View style={styles.heroTrust}><MaterialCommunityIcons name="map-marker-outline" size={18} color="#8BD9D5" /><Text style={styles.heroTrustText}>Built for UK workflows</Text></View>
              </View>
            </View>

            <View style={[styles.heroVisual, !desktop && styles.heroVisualMobile]}>
              <Animated.View style={[styles.glowOrb, { transform: [{ translateY: heroShiftB }] }]} />
              <Animated.View style={[styles.dashboardMock, { transform: [{ translateY: heroShiftA }, { perspective: 900 }, { rotateY: desktop ? "-5deg" : "0deg" }, { rotateX: desktop ? "2deg" : "0deg" }] }]}>
                <View style={styles.mockTopbar}>
                  <View style={styles.mockLogoRow}><View style={styles.mockLogoDot} /><Text style={styles.mockBrand}>TENUREEX</Text></View>
                  <View style={styles.mockAvatar}><Text style={styles.mockAvatarText}>TX</Text></View>
                </View>
                <View style={styles.mockBody}>
                  <View style={styles.mockSidebar}>
                    {["view-dashboard-outline", "home-outline", "account-group-outline", "tools", "clipboard-check-outline"].map((icon, i) => (
                      <View key={icon} style={[styles.mockSideItem, i === 0 && styles.mockSideActive]}><MaterialCommunityIcons name={icon as IconName} size={16} color={i === 0 ? "#fff" : "#7CA0A6"} /></View>
                    ))}
                  </View>
                  <View style={styles.mockContent}>
                    <Text style={styles.mockEyebrow}>PROPERTY OPERATIONS</Text>
                    <Text style={styles.mockTitle}>Everything moving together.</Text>
                    <View style={styles.mockStats}>
                      {["Properties", "Tenancies", "Maintenance"].map((label, i) => (
                        <View key={label} style={styles.mockStatCard}><Text style={styles.mockStatValue}>{[24, 18, 5][i]}</Text><Text style={styles.mockStatLabel}>{label}</Text></View>
                      ))}
                    </View>
                    <View style={styles.mockChartCard}>
                      <View style={styles.mockChartHead}><Text style={styles.mockChartTitle}>Live workflow</Text><View style={styles.mockPill}><Text style={styles.mockPillText}>Connected</Text></View></View>
                      {[82, 62, 92, 48].map((v, i) => <View key={i} style={styles.mockBarRow}><View style={styles.mockBarLabel} /><View style={styles.mockBarTrack}><View style={[styles.mockBarFill, { width: `${v}%` }]} /></View></View>)}
                    </View>
                  </View>
                </View>
              </Animated.View>
              <Animated.View style={[styles.floatingCard, styles.floatingCardA, { transform: [{ translateY: heroShiftB }] }]}>
                <View style={styles.floatIcon}><MaterialCommunityIcons name="bell-check-outline" size={19} color={TEAL} /></View>
                <View><Text style={styles.floatTitle}>Workflow updated</Text><Text style={styles.floatSub}>Everyone stays informed</Text></View>
              </Animated.View>
              <Animated.View style={[styles.floatingCard, styles.floatingCardB, { transform: [{ translateY: heroShiftA }] }]}>
                <View style={styles.floatIconGold}><MaterialCommunityIcons name="shield-check-outline" size={19} color={GOLD} /></View>
                <View><Text style={styles.floatTitle}>Compliance visible</Text><Text style={styles.floatSub}>Records in one place</Text></View>
              </Animated.View>
            </View>
          </View>

          <View style={styles.statsBar}>
            {stats.map(([value, label]) => <View key={label} style={styles.stat}><Text style={styles.statValueHero}>{value}</Text><Text style={styles.statLabelHero}>{label}</Text></View>)}
          </View>
        </LinearGradient>

        <View nativeID="platform" testID="platform" style={styles.section}>
          <SectionHeading eyebrow="THE PLATFORM" title="Six connected experiences. One TenureEx ecosystem." subtitle="Each stakeholder gets a focused workspace, while the underlying property workflow stays connected across the platform." />
          <View style={styles.cardGrid}>
            {portals.map((portal, index) => (
              <View key={portal.title} style={[styles.portalCard, { width: desktop ? "31.8%" : tablet ? "48%" : "100%" }]}>
                <View style={[styles.portalIcon, index === 4 && styles.portalIconGold]}><MaterialCommunityIcons name={portal.icon} size={25} color={index === 4 ? GOLD : TEAL} /></View>
                <Text style={styles.portalTag}>{portal.tag.toUpperCase()}</Text>
                <Text style={styles.portalTitle}>{portal.title}</Text>
                <Text style={styles.portalDescription}>{portal.description}</Text>
                <View style={styles.featureList}>
                  {portal.features.map((feature) => <View key={feature} style={styles.featureRow}><MaterialCommunityIcons name="check-circle" size={16} color={TEAL_2} /><Text style={styles.featureText}>{feature}</Text></View>)}
                </View>
              </View>
            ))}
          </View>
        </View>

        <View nativeID="why-tenureex" testID="why-tenureex" style={styles.whySection}>
          <View style={styles.sectionNarrow}>
            <SectionHeading eyebrow="WHY TENUREEX" title="Replace scattered handoffs with a shared workflow." subtitle="Instead of relying on separate emails, calls, spreadsheets and disconnected records, TenureEx gives each role a clear place to act." />
            <View style={styles.featureGrid}>
              {featureCards.map(([icon, title, description]) => (
                <View key={title} style={[styles.featureCard, { width: desktop ? "31.8%" : tablet ? "48%" : "100%" }]}>
                  <View style={styles.featureIcon}><MaterialCommunityIcons name={icon as IconName} size={24} color={TEAL} /></View>
                  <Text style={styles.featureCardTitle}>{title}</Text>
                  <Text style={styles.featureCardText}>{description}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <LinearGradient nativeID="intelligence" testID="intelligence" colors={[NAVY_2, NAVY]} style={styles.intelligenceSection}>
          <View style={styles.sectionNarrow}>
            <SectionHeading light eyebrow="AUTOMATION & INTELLIGENCE" title="A platform designed to become smarter as the workflow grows." subtitle="The TenureEx roadmap includes AI-assisted screening, compliance intelligence, predictive maintenance, remote inspection support and sustainability insights — with human review remaining central to important decisions." />
            <View style={styles.darkGrid}>
              {[
                ["target-account", "Viewing intelligence", "Support faster applicant review and better-informed shortlisting workflows."],
                ["shield-search", "Compliance intelligence", "Surface deadlines, missing evidence and workflow risks more clearly."],
                ["wrench-cog-outline", "Predictive maintenance", "Use property history and patterns to support proactive maintenance planning."],
                ["video-outline", "Remote inspections", "Support digital inspection workflows and structured property evidence."],
                ["leaf", "Carbon insights", "Help teams understand the operational impact of reduced travel and digital processes."],
                ["account-check-outline", "Human decision control", "Automation supports the team; tenancy and approval decisions stay with authorised people."],
              ].map(([icon, title, description]) => (
                <View key={title} style={[styles.darkCard, { width: desktop ? "31.8%" : tablet ? "48%" : "100%" }]}>
                  <MaterialCommunityIcons name={icon as IconName} size={26} color={GOLD} />
                  <Text style={styles.darkCardTitle}>{title}</Text>
                  <Text style={styles.darkCardText}>{description}</Text>
                </View>
              ))}
            </View>
          </View>
        </LinearGradient>

        <View style={styles.funnelSection}>
          <View style={styles.sectionNarrow}>
            <SectionHeading eyebrow="VIEWING INTELLIGENCE" title="Screen earlier. Spend viewing time on stronger applicants." subtitle="The original TenureEx concept is designed around reducing wasted viewing activity by bringing applicant information into the workflow before agents spend time travelling and scheduling." />
            <View style={[styles.twoCol, !desktop && styles.twoColStack]}>
              <View style={styles.funnelPanel}>
                <Text style={styles.miniEyebrow}>ILLUSTRATIVE VIEWING FUNNEL</Text>
                <Text style={styles.panelHeading}>From enquiry to tenancy</Text>
                {[
                  ["25", "Enquiries received", 100],
                  ["15", "Viewing requests", 78],
                  ["12", "Traditional viewings", 62],
                  ["3–5", "Qualified shortlist", 34],
                  ["1", "Tenancy", 16],
                ].map(([value, label, bar]) => (
                  <View key={String(label)} style={styles.funnelRow}>
                    <View style={styles.funnelValue}><Text style={styles.funnelValueText}>{String(value)}</Text></View>
                    <View style={styles.funnelTrack}><View style={[styles.funnelFill, { width: `${Number(bar)}%` as `${number}%` }]} /></View>
                    <Text style={styles.funnelLabel}>{String(label)}</Text>
                  </View>
                ))}
                <Text style={styles.sourceNote}>Illustrative funnel retained from the original TenureEx landing-page concept.</Text>
              </View>
              <View style={styles.benefitStack}>
                {[
                  ["lightning-bolt-outline", "Screen at enquiry", "Bring applicant information into the process before viewings are booked."],
                  ["format-list-numbered", "Ranked review", "Support agents with a clearer shortlist and structured information."],
                  ["account-check-outline", "Agent decides", "Automation supports the process; the authorised agent makes the decision."],
                  ["car-clock", "Reduce wasted journeys", "Use better information to make viewing schedules more focused."],
                ].map(([icon, title, copy]) => (
                  <View key={String(title)} style={styles.benefitCard}>
                    <View style={styles.benefitIcon}><MaterialCommunityIcons name={icon as IconName} size={21} color={TEAL} /></View>
                    <View style={{ flex: 1 }}><Text style={styles.benefitTitle}>{title}</Text><Text style={styles.benefitText}>{copy}</Text></View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.carbonSection}>
          <View style={styles.sectionNarrow}>
            <SectionHeading eyebrow="ESG & CARBON" title="Digital property operations can reduce unnecessary travel." subtitle="The original TenureEx proposal also explores carbon tracking as an ESG feature, including estimated savings from fewer property-viewing journeys." />
            <View style={[styles.twoCol, !desktop && styles.twoColStack]}>
              <LinearGradient colors={[NAVY, "#0B5F63"]} style={styles.carbonFeature}>
                <Text style={styles.carbonKicker}>ILLUSTRATIVE 150-PROPERTY AGENCY</Text>
                <Text style={styles.carbonBig}>≈ 4.1 tonnes</Text>
                <Text style={styles.carbonBigSub}>combined CO₂ reduction / year</Text>
                <View style={styles.carbonDivider} />
                <View style={styles.carbonMetric}><Text style={styles.carbonMetricLabel}>Agent viewing trips reduced</Text><Text style={styles.carbonMetricValue}>1,200</Text></View>
                <View style={styles.carbonMetric}><Text style={styles.carbonMetricLabel}>Tenant viewing trips reduced</Text><Text style={styles.carbonMetricValue}>1,200</Text></View>
                <Text style={styles.carbonDisclaimer}>Illustrative figures from the original concept; actual savings depend on portfolio and travel patterns.</Text>
              </LinearGradient>
              <View style={styles.esgPanel}>
                <Text style={styles.miniEyebrow}>LANDLORD ENERGY IMPROVEMENT CONTEXT</Text>
                <Text style={styles.panelHeading}>Keep sustainability information alongside property workflows.</Text>
                {[
                  "Boiler Upgrade Scheme",
                  "Great British Insulation Scheme",
                  "ECO / local energy-efficiency support",
                  "EPC improvement planning",
                ].map((item) => <View key={item} style={styles.esgRow}><MaterialCommunityIcons name="leaf-circle-outline" size={20} color={TEAL} /><Text style={styles.esgText}>{item}</Text></View>)}
                <Text style={styles.sourceNote}>Scheme availability, eligibility and values can change and should be verified before being presented as current guidance.</Text>
              </View>
            </View>
          </View>
        </View>

        <View nativeID="compliance" testID="compliance" style={styles.complianceSection}>
          <View style={styles.sectionNarrow}>
            <SectionHeading eyebrow="COMPLIANCE & PROPERTY RECORDS" title="Keep the important property information visible." subtitle="TenureEx is designed around the day-to-day records and checks that matter across UK rental property workflows." />
            <View style={styles.complianceGrid}>
              {[
                ["fire", "Gas safety"],
                ["flash-outline", "Electrical / EICR"],
                ["home-lightning-bolt-outline", "EPC tracking"],
                ["shield-home-outline", "Deposit records"],
                ["card-account-details-outline", "Right to Rent"],
                ["file-sign", "Digital documents"],
              ].map(([icon, title]) => <View key={title} style={styles.complianceItem}><View style={styles.complianceIcon}><MaterialCommunityIcons name={icon as IconName} size={23} color={TEAL} /></View><Text style={styles.complianceTitle}>{title}</Text></View>)}
            </View>
          </View>
        </View>

        <View nativeID="pricing" testID="pricing" style={styles.pricingSection}>
          <View style={styles.sectionNarrow}>
            <SectionHeading eyebrow="PRICING CONCEPT" title="Simple property-based pricing." subtitle="Choose the TenureEx option that fits your property workflow, from property listing to the connected full-platform experience." />
            <View style={styles.pricingGrid}>
              <View style={[styles.priceCard, { width: desktop ? "31.8%" : tablet ? "48%" : "100%" }]}>
                <Text style={styles.priceTagGreen}>FREE LISTING</Text>
                <Text style={styles.priceName}>Marketplace</Text>
                <View style={styles.priceRow}><Text style={styles.priceAmountGreen}>£0</Text><Text style={styles.pricePeriod}> / listing</Text></View>
                <Text style={styles.priceDescription}>Property listing and rental discovery concept with no listing charge.</Text>
                {["List approved properties", "Receive tenant enquiries", "Move into TenureEx workflows"].map((x) => <View key={x} style={styles.priceFeature}><MaterialCommunityIcons name="check" size={17} color="#198754" /><Text style={styles.priceFeatureText}>{x}</Text></View>)}
                <Pressable style={styles.priceOutlineBtn} onPress={openDemo}><Text style={styles.priceOutlineText}>Sign Up / Login</Text></Pressable>
              </View>
              <View style={[styles.priceCard, styles.priceFeatured, { width: desktop ? "31.8%" : tablet ? "48%" : "100%" }]}>
                <Text style={styles.priceTagGold}>FULL PLATFORM</Text>
                <Text style={styles.priceNameLight}>Estate Agent</Text>
                <View style={styles.priceRow}><Text style={styles.priceAmountGold}>£10</Text><Text style={styles.pricePeriodLight}> / property / month</Text></View>
                <Text style={styles.priceDescriptionLight}>Connected portals, property workflows, maintenance and operational visibility.</Text>
                {["Estate Agent workspace", "Landlord & Tenant portals", "Maintenance workflow", "Council / inspection workflow"].map((x) => <View key={x} style={styles.priceFeature}><MaterialCommunityIcons name="check" size={17} color="#E0B958" /><Text style={styles.priceFeatureTextLight}>{x}</Text></View>)}
                <Pressable style={styles.priceGoldBtn} onPress={() => router.push("/book-demo" as Href)}><Text style={styles.priceGoldText}>Book a Demo</Text></Pressable>
                <Pressable style={styles.priceOutlineLightBtn} onPress={openDemo}><Text style={styles.priceOutlineLightText}>Sign Up / Login</Text></Pressable>
              </View>
              <View style={[styles.priceCard, { width: desktop ? "31.8%" : tablet ? "48%" : "100%" }]}>
                <Text style={styles.priceTag}>AI ROADMAP</Text>
                <Text style={styles.priceName}>TenureEx + Intelligence</Text>
                <Text style={styles.roadmapLabel}>COMING THROUGH THE ROADMAP</Text>
                <Text style={styles.priceDescription}>AI-assisted screening, predictive maintenance, inspection support and carbon insights as the platform develops.</Text>
                {["Viewing intelligence", "Predictive maintenance", "Remote inspection support", "Carbon insights"].map((x) => <View key={x} style={styles.priceFeature}><MaterialCommunityIcons name="check" size={17} color={TEAL} /><Text style={styles.priceFeatureText}>{x}</Text></View>)}
                <Pressable style={styles.priceOutlineBtn} onPress={openDemo}><Text style={styles.priceOutlineText}>Sign Up / Login</Text></Pressable>
              </View>
            </View>
          </View>
        </View>

        <LinearGradient colors={["#0A5D61", NAVY]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ctaSection}>
          <View style={styles.ctaGlow} />
          <View style={styles.ctaContent}>
            <View style={styles.testBadge}><View style={styles.liveDot} /><Text style={styles.testBadgeText}>TENUREEX ACCESS</Text></View>
            <Text style={styles.ctaTitle}>Want to see TenureEx before public launch?</Text>
            <Text style={styles.ctaText}>Request access to TenureEx. Leave your email and the TenureEx team will review your request.</Text>
            <View style={styles.ctaActions}><Pressable style={styles.primaryHeroBtn} onPress={() => router.push("/book-demo" as Href)}><Text style={styles.primaryHeroText}>Book a Demo</Text><MaterialCommunityIcons name="calendar-outline" size={20} color={NAVY} /></Pressable><Pressable style={styles.ctaAccessBtn} onPress={openDemo}><Text style={styles.ctaAccessText}>Sign Up / Login</Text><MaterialCommunityIcons name="login" size={20} color="#fff" /></Pressable></View>
          </View>
        </LinearGradient>

        <View style={styles.footer}>
          <View style={styles.footerTop}>
            <View style={styles.footerBrandCol}>
              <View style={styles.brand}><View style={styles.brandMark}><MaterialCommunityIcons name="home-city-outline" size={25} color="#fff" /></View><View><Text style={styles.brandName}>TENUREEX</Text><Text style={styles.brandSub}>PROPERTY PLATFORM</Text></View></View>
              <Text style={styles.footerText}>A connected property-management platform for UK estate agents, landlords, tenants, maintenance providers and inspectors.</Text>
            </View>
            <View><Text style={styles.footerHeading}>Platform</Text><Text style={styles.footerLink}>Estate Agent</Text><Text style={styles.footerLink}>Landlord</Text><Text style={styles.footerLink}>Tenant</Text><Text style={styles.footerLink}>Maintenance</Text></View>
            <View><Text style={styles.footerHeading}>Access</Text><Pressable onPress={() => router.push("/book-demo" as Href)}><Text style={styles.footerLink}>Book a Demo</Text></Pressable><Pressable onPress={openDemo}><Text style={styles.footerLink}>Sign Up / Login</Text></Pressable><Pressable onPress={() => router.push("/rent" as Href)}><Text style={styles.footerLink}>Find a Home</Text></Pressable><Text style={styles.footerLink}>TenureEx access</Text></View>
          </View>
          <View style={styles.footerBottom}><Text style={styles.footerLegal}>© 2026 TenureEx. All rights reserved.</Text><Text style={styles.footerLegal}>United Kingdom</Text></View>
        </View>
      </ScrollView>

      <Modal visible={demoOpen} transparent animationType="fade" onRequestClose={() => setDemoOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setDemoOpen(false)}>
          <Pressable style={[styles.demoModal, compact && styles.demoModalCompact]} onPress={(event) => event.stopPropagation()}>
            <View style={styles.modalAccent} />
            <Pressable style={styles.modalClose} onPress={() => setDemoOpen(false)}><MaterialCommunityIcons name="close" size={22} color="#60777C" /></Pressable>
            {success ? (
              <View style={styles.successWrap}>
                <View style={styles.successIcon}><MaterialCommunityIcons name="check" size={34} color="#fff" /></View>
                <Text style={styles.modalEyebrow}>REQUEST RECEIVED</Text>
                <Text style={styles.modalTitle}>Your access request has been received.</Text>
                <Text style={styles.modalText}>Your email has been sent to the TenureEx Admin team. Access requests are reviewed by the team. If approved, you will receive the Sign Up / Login access link by email.</Text>
                <Pressable style={styles.modalDoneBtn} onPress={() => setDemoOpen(false)}><Text style={styles.modalDoneText}>Done</Text></Pressable>
              </View>
            ) : (
              <>
                <View style={styles.modalIcon}><MaterialCommunityIcons name="rocket-launch-outline" size={27} color={TEAL} /></View>
                <Text style={styles.modalEyebrow}>TENUREEX SIGN UP / LOGIN</Text>
                <Text style={styles.modalTitle}>Request Sign Up / Login access.</Text>
                <Text style={styles.modalText}>Enter your email address and our Admin team will review your Sign Up / Login access request.</Text>
                <View style={styles.testingNotice}><MaterialCommunityIcons name="shield-check-outline" size={20} color={TEAL} /><Text style={styles.testingNoticeText}>Access requests are reviewed by the TenureEx Admin team.</Text></View>
                <Text style={styles.inputLabel}>Email address</Text>
                <View style={[styles.emailInputWrap, !!error && styles.emailInputError]}>
                  <MaterialCommunityIcons name="email-outline" size={20} color="#789095" />
                  <TextInput value={email} onChangeText={(v) => { setEmail(v); setError(""); }} placeholder="you@company.co.uk" placeholderTextColor="#95A7AB" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} style={styles.emailInput} onSubmitEditing={() => void submitDemo()} />
                </View>
                {error ? <Text style={styles.formError}>{error}</Text> : null}
                <Pressable disabled={submitting} style={[styles.submitDemoBtn, submitting && styles.submitDisabled]} onPress={() => void submitDemo()}>
                  {submitting ? <ActivityIndicator color="#fff" /> : <><Text style={styles.submitDemoText}>Request Sign Up / Login Access</Text><MaterialCommunityIcons name="arrow-right" size={20} color="#fff" /></>}
                </Pressable>
                <Text style={styles.privacyNote}>We only use this email to review and respond to your TenureEx access request.</Text>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  page: { backgroundColor: "#fff" },
  navWrap: { backgroundColor: "rgba(255,255,255,0.98)", borderBottomWidth: 1, borderBottomColor: "#E2EBEC", zIndex: 100 },
  nav: { minHeight: 76, width: "100%", maxWidth: 1240, alignSelf: "center", paddingHorizontal: 28, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 24 },
  navCompact: { paddingHorizontal: 16, minHeight: 70 },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandMark: { width: 40, height: 40, borderRadius: 12, backgroundColor: TEAL, alignItems: "center", justifyContent: "center" },
  brandName: { color: NAVY, fontSize: 18, fontWeight: "900", letterSpacing: 1.5 },
  brandSub: { marginTop: 1, color: "#759095", fontSize: 8, fontWeight: "800", letterSpacing: 1.5 },
  navLinks: { flexDirection: "row", alignItems: "center", gap: 18 },
  navLink: { color: "#4D686E", fontSize: 12, fontWeight: "700" },
  navActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  demoNavBtn: { minHeight: 43, paddingHorizontal: 17, borderRadius: 11, backgroundColor: TEAL, flexDirection: "row", alignItems: "center", gap: 7 },
  demoNavText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  accessNavBtn: { minHeight: 43, paddingHorizontal: 17, borderRadius: 11, borderWidth: 1.5, borderColor: NAVY, backgroundColor: "#fff", flexDirection: "row", alignItems: "center", gap: 7 },
  accessNavText: { color: NAVY, fontWeight: "800", fontSize: 13 },
  hero: { paddingTop: 76, paddingBottom: 0, overflow: "hidden" },
  heroGrid: { ...StyleSheet.absoluteFillObject, opacity: 0.08, backgroundColor: "transparent", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  heroInner: { width: "100%", maxWidth: 1240, alignSelf: "center", minHeight: 600, paddingHorizontal: 28, paddingBottom: 56, flexDirection: "row", alignItems: "center", gap: 48 },
  heroInnerStack: { flexDirection: "column", alignItems: "stretch", paddingHorizontal: 20, paddingTop: 24 },
  heroCopy: { flex: 1.02, zIndex: 3 },
  testBadge: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: "rgba(200,155,60,0.46)", backgroundColor: "rgba(200,155,60,0.12)", flexDirection: "row", alignItems: "center", gap: 7 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: GOLD },
  testBadgeText: { color: "#E8C16C", fontSize: 10, fontWeight: "900", letterSpacing: 1.1 },
  heroTitle: { marginTop: 24, color: "#fff", fontSize: 56, lineHeight: 62, fontWeight: "900", letterSpacing: -1.8, maxWidth: 680 },
  heroTitleCompact: { fontSize: 38, lineHeight: 44, letterSpacing: -1 },
  heroGold: { color: "#E1B958" },
  heroSub: { marginTop: 22, maxWidth: 650, color: "#C7D8DA", fontSize: 17, lineHeight: 28 },
  heroActions: { marginTop: 30, flexDirection: "row", flexWrap: "wrap", gap: 12 },
  primaryHeroBtn: { minHeight: 52, paddingHorizontal: 21, borderRadius: 13, backgroundColor: "#D7AE50", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  primaryHeroText: { color: NAVY, fontSize: 14, fontWeight: "900" },
  secondaryHeroBtn: { minHeight: 52, paddingHorizontal: 20, borderRadius: 13, borderWidth: 1, borderColor: "rgba(255,255,255,0.24)", backgroundColor: "rgba(255,255,255,0.07)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  secondaryHeroText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  heroTrustRow: { marginTop: 27, flexDirection: "row", flexWrap: "wrap", gap: 18 },
  heroTrust: { flexDirection: "row", alignItems: "center", gap: 6 },
  heroTrustText: { color: "#AFC6C9", fontSize: 11, fontWeight: "600" },
  heroVisual: { flex: 0.98, minHeight: 500, alignItems: "center", justifyContent: "center", position: "relative" },
  heroVisualMobile: { width: "100%", minHeight: 410 },
  glowOrb: { position: "absolute", width: 330, height: 330, borderRadius: 180, backgroundColor: "rgba(57,201,195,0.14)" },
  dashboardMock: { width: "92%", maxWidth: 520, minHeight: 350, borderRadius: 23, backgroundColor: "#F8FBFB", shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 32, shadowOffset: { width: 0, height: 18 }, elevation: 16, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.5)" },
  mockTopbar: { height: 55, paddingHorizontal: 17, backgroundColor: "#fff", flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#E5ECEC" },
  mockLogoRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  mockLogoDot: { width: 19, height: 19, borderRadius: 6, backgroundColor: TEAL },
  mockBrand: { color: NAVY, fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },
  mockAvatar: { width: 29, height: 29, borderRadius: 9, backgroundColor: NAVY, alignItems: "center", justifyContent: "center" },
  mockAvatarText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  mockBody: { flex: 1, flexDirection: "row" },
  mockSidebar: { width: 54, backgroundColor: NAVY, alignItems: "center", paddingTop: 16, gap: 11 },
  mockSideItem: { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  mockSideActive: { backgroundColor: TEAL },
  mockContent: { flex: 1, padding: 20 },
  mockEyebrow: { color: TEAL, fontSize: 8, fontWeight: "900", letterSpacing: 1.1 },
  mockTitle: { marginTop: 5, color: NAVY, fontSize: 19, fontWeight: "900" },
  mockStats: { marginTop: 16, flexDirection: "row", gap: 8 },
  mockStatCard: { flex: 1, padding: 11, borderRadius: 11, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E0EAEA" },
  mockStatValue: { color: NAVY, fontSize: 19, fontWeight: "900" },
  mockStatLabel: { marginTop: 2, color: "#7D9296", fontSize: 7, fontWeight: "700" },
  mockChartCard: { marginTop: 12, padding: 13, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E0EAEA" },
  mockChartHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  mockChartTitle: { color: TEXT, fontSize: 9, fontWeight: "800" },
  mockPill: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999, backgroundColor: "#E7F5F3" },
  mockPillText: { color: TEAL, fontSize: 6, fontWeight: "900" },
  mockBarRow: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 5 },
  mockBarLabel: { width: 34, height: 6, borderRadius: 4, backgroundColor: "#DCE6E7" },
  mockBarTrack: { flex: 1, height: 7, borderRadius: 5, backgroundColor: "#EDF2F2", overflow: "hidden" },
  mockBarFill: { height: "100%", borderRadius: 5, backgroundColor: TEAL_2 },
  floatingCard: { position: "absolute", minWidth: 190, padding: 11, borderRadius: 14, backgroundColor: "#fff", flexDirection: "row", alignItems: "center", gap: 9, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  floatingCardA: { top: 56, right: 0 },
  floatingCardB: { bottom: 46, left: 0 },
  floatIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: "#E7F5F3", alignItems: "center", justifyContent: "center" },
  floatIconGold: { width: 34, height: 34, borderRadius: 10, backgroundColor: "#FFF7E6", alignItems: "center", justifyContent: "center" },
  floatTitle: { color: TEXT, fontSize: 10, fontWeight: "900" },
  floatSub: { marginTop: 2, color: "#809296", fontSize: 7 },
  statsBar: { width: "100%", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(0,0,0,0.08)", paddingVertical: 20, paddingHorizontal: 20, flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  stat: { minWidth: 180, paddingHorizontal: 28, paddingVertical: 8, alignItems: "center", borderRightWidth: 1, borderRightColor: "rgba(255,255,255,0.10)" },
  statValueHero: { color: "#E2B958", fontSize: 25, fontWeight: "900" },
  statLabelHero: { marginTop: 3, color: "#B7CBCE", fontSize: 10, fontWeight: "700" },
  section: { paddingVertical: 88, paddingHorizontal: 20, backgroundColor: "#fff" },
  sectionNarrow: { width: "100%", maxWidth: 1200, alignSelf: "center" },
  headingWrap: { width: "100%", maxWidth: 760, alignSelf: "center", alignItems: "center", marginBottom: 44 },
  eyebrow: { color: TEAL, fontSize: 11, fontWeight: "900", letterSpacing: 1.8, textAlign: "center" },
  eyebrowLight: { color: "#E2B958" },
  sectionTitle: { marginTop: 10, color: NAVY, fontSize: 36, lineHeight: 43, fontWeight: "900", letterSpacing: -0.8, textAlign: "center" },
  sectionSubtitle: { marginTop: 13, color: MUTED, fontSize: 15, lineHeight: 25, textAlign: "center", maxWidth: 720 },
  lightText: { color: "#fff" },
  lightMuted: { color: "#BFD0D3" },
  cardGrid: { width: "100%", maxWidth: 1200, alignSelf: "center", flexDirection: "row", flexWrap: "wrap", gap: 18 },
  portalCard: { padding: 22, borderRadius: 18, backgroundColor: "#fff", borderWidth: 1, borderColor: "#DCE8E9", shadowColor: "#0D333A", shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 7 }, elevation: 2 },
  portalIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: "#E7F5F3", alignItems: "center", justifyContent: "center" },
  portalIconGold: { backgroundColor: "#FFF7E6" },
  portalTag: { marginTop: 17, color: TEAL, fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  portalTitle: { marginTop: 7, color: TEXT, fontSize: 19, fontWeight: "900" },
  portalDescription: { marginTop: 10, color: MUTED, fontSize: 13, lineHeight: 21 },
  featureList: { marginTop: 16, gap: 8 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  featureText: { color: "#405B61", fontSize: 12, fontWeight: "600" },
  whySection: { paddingVertical: 88, paddingHorizontal: 20, backgroundColor: ICE },
  featureGrid: { flexDirection: "row", flexWrap: "wrap", gap: 18 },
  featureCard: { padding: 22, borderRadius: 18, backgroundColor: "#fff", borderWidth: 1, borderColor: "#DCE8E9" },
  featureIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: "#E8F5F4", alignItems: "center", justifyContent: "center" },
  featureCardTitle: { marginTop: 15, color: TEXT, fontSize: 17, fontWeight: "900" },
  featureCardText: { marginTop: 8, color: MUTED, fontSize: 13, lineHeight: 21 },
  intelligenceSection: { paddingVertical: 88, paddingHorizontal: 20 },
  darkGrid: { flexDirection: "row", flexWrap: "wrap", gap: 18 },
  darkCard: { padding: 22, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.10)" },
  darkCardTitle: { marginTop: 14, color: "#fff", fontSize: 17, fontWeight: "900" },
  darkCardText: { marginTop: 8, color: "#B9CCCF", fontSize: 13, lineHeight: 21 },
  funnelSection: { paddingVertical: 88, paddingHorizontal: 20, backgroundColor: "#fff" },
  twoCol: { flexDirection: "row", gap: 22, alignItems: "stretch" },
  twoColStack: { flexDirection: "column" },
  funnelPanel: { flex: 1, padding: 24, borderRadius: 19, backgroundColor: ICE, borderWidth: 1, borderColor: "#DCE8E9" },
  miniEyebrow: { color: TEAL, fontSize: 9, fontWeight: "900", letterSpacing: 1.3 },
  panelHeading: { marginTop: 7, marginBottom: 18, color: TEXT, fontSize: 20, lineHeight: 26, fontWeight: "900" },
  funnelRow: { minHeight: 40, flexDirection: "row", alignItems: "center", gap: 9 },
  funnelValue: { width: 42 },
  funnelValueText: { color: NAVY, fontSize: 14, fontWeight: "900" },
  funnelTrack: { width: "36%", maxWidth: 180, height: 9, borderRadius: 999, backgroundColor: "#DCE8E8", overflow: "hidden" },
  funnelFill: { height: "100%", borderRadius: 999, backgroundColor: TEAL_2 },
  funnelLabel: { flex: 1, color: "#60777C", fontSize: 11, fontWeight: "600" },
  sourceNote: { marginTop: 16, color: "#8A9CA0", fontSize: 9, lineHeight: 15, fontStyle: "italic" },
  benefitStack: { flex: 1, gap: 10 },
  benefitCard: { flex: 1, minHeight: 90, padding: 16, borderRadius: 16, backgroundColor: "#fff", borderWidth: 1, borderColor: "#DDE9EA", flexDirection: "row", gap: 12, alignItems: "flex-start" },
  benefitIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#E8F5F4", alignItems: "center", justifyContent: "center" },
  benefitTitle: { color: TEXT, fontSize: 14, fontWeight: "900" },
  benefitText: { marginTop: 4, color: MUTED, fontSize: 11, lineHeight: 18 },
  carbonSection: { paddingVertical: 88, paddingHorizontal: 20, backgroundColor: ICE },
  carbonFeature: { flex: 1, borderRadius: 20, padding: 25, overflow: "hidden" },
  carbonKicker: { color: "#8BD9D5", fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  carbonBig: { marginTop: 15, color: "#E2B958", fontSize: 40, fontWeight: "900", letterSpacing: -1 },
  carbonBigSub: { color: "#C1D4D6", fontSize: 12, fontWeight: "700" },
  carbonDivider: { marginVertical: 21, height: 1, backgroundColor: "rgba(255,255,255,0.13)" },
  carbonMetric: { paddingVertical: 9, flexDirection: "row", justifyContent: "space-between", gap: 10 },
  carbonMetricLabel: { color: "#BFD0D3", fontSize: 11 },
  carbonMetricValue: { color: "#fff", fontSize: 12, fontWeight: "900" },
  carbonDisclaimer: { marginTop: 18, color: "#8FA9AD", fontSize: 9, lineHeight: 15 },
  esgPanel: { flex: 1, padding: 25, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: "#DCE8E9" },
  esgRow: { minHeight: 45, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#EDF2F2", flexDirection: "row", alignItems: "center", gap: 9 },
  esgText: { flex: 1, color: "#405B61", fontSize: 12, fontWeight: "700" },
  pricingSection: { paddingVertical: 88, paddingHorizontal: 20, backgroundColor: "#fff" },
  pricingGrid: { flexDirection: "row", flexWrap: "wrap", gap: 18, justifyContent: "center", alignItems: "stretch" },
  priceCard: { padding: 24, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: "#DCE8E9" },
  priceFeatured: { backgroundColor: NAVY, borderColor: NAVY },
  priceTag: { color: TEAL, fontSize: 9, fontWeight: "900", letterSpacing: 1.3 },
  priceTagGreen: { color: "#198754", fontSize: 9, fontWeight: "900", letterSpacing: 1.3 },
  priceTagGold: { color: "#E2B958", fontSize: 9, fontWeight: "900", letterSpacing: 1.3 },
  priceName: { marginTop: 8, color: TEXT, fontSize: 21, fontWeight: "900" },
  priceNameLight: { marginTop: 8, color: "#fff", fontSize: 21, fontWeight: "900" },
  priceRow: { marginTop: 16, flexDirection: "row", alignItems: "flex-end" },
  priceAmountGreen: { color: "#198754", fontSize: 36, fontWeight: "900" },
  priceAmountGold: { color: "#E2B958", fontSize: 36, fontWeight: "900" },
  pricePeriod: { paddingBottom: 6, color: "#7B9095", fontSize: 10, fontWeight: "700" },
  pricePeriodLight: { paddingBottom: 6, color: "#ACC2C5", fontSize: 10, fontWeight: "700" },
  roadmapLabel: { marginTop: 16, color: TEAL, fontSize: 11, fontWeight: "900" },
  priceDescription: { marginTop: 13, minHeight: 58, color: MUTED, fontSize: 12, lineHeight: 19 },
  priceDescriptionLight: { marginTop: 13, minHeight: 58, color: "#B8CCCF", fontSize: 12, lineHeight: 19 },
  priceFeature: { marginTop: 9, flexDirection: "row", alignItems: "center", gap: 7 },
  priceFeatureText: { color: "#4B666C", fontSize: 11, fontWeight: "600" },
  priceFeatureTextLight: { color: "#D0DDDF", fontSize: 11, fontWeight: "600" },
  priceOutlineBtn: { marginTop: 23, minHeight: 46, borderRadius: 12, borderWidth: 1.5, borderColor: TEAL, alignItems: "center", justifyContent: "center" },
  priceOutlineText: { color: TEAL, fontSize: 12, fontWeight: "900" },
  priceGoldBtn: { marginTop: 23, minHeight: 46, borderRadius: 12, backgroundColor: "#D7AE50", alignItems: "center", justifyContent: "center" },
  priceGoldText: { color: NAVY, fontSize: 12, fontWeight: "900" },
  priceOutlineLightBtn: { marginTop: 10, minHeight: 46, borderRadius: 12, borderWidth: 1.5, borderColor: "#D7AE50", alignItems: "center", justifyContent: "center" },
  priceOutlineLightText: { color: "#E2B958", fontSize: 12, fontWeight: "900" },
  complianceSection: { paddingVertical: 82, paddingHorizontal: 20, backgroundColor: "#fff" },
  complianceGrid: { flexDirection: "row", flexWrap: "wrap", gap: 14, justifyContent: "center" },
  complianceItem: { minWidth: 160, flexGrow: 1, maxWidth: 190, padding: 18, borderRadius: 16, alignItems: "center", backgroundColor: ICE, borderWidth: 1, borderColor: "#DFEAEB" },
  complianceIcon: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#E5F4F3" },
  complianceTitle: { marginTop: 11, color: TEXT, fontSize: 12, fontWeight: "800", textAlign: "center" },
  ctaSection: { paddingVertical: 82, paddingHorizontal: 20, overflow: "hidden", alignItems: "center" },
  ctaGlow: { position: "absolute", width: 420, height: 420, borderRadius: 220, backgroundColor: "rgba(49,193,187,0.10)", right: -80, top: -150 },
  ctaContent: { maxWidth: 760, alignItems: "center", zIndex: 2 },
  ctaTitle: { marginTop: 21, color: "#fff", fontSize: 38, lineHeight: 45, fontWeight: "900", textAlign: "center", letterSpacing: -0.8 },
  ctaText: { marginTop: 13, marginBottom: 25, color: "#C3D5D8", fontSize: 15, lineHeight: 25, textAlign: "center" },
  ctaActions: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12 },
  ctaAccessBtn: { minHeight: 52, paddingHorizontal: 21, borderRadius: 13, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.65)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  ctaAccessText: { color: "#fff", fontSize: 14, fontWeight: "900" },
  footer: { paddingTop: 54, paddingHorizontal: 24, paddingBottom: 28, backgroundColor: "#061F26" },
  footerTop: { width: "100%", maxWidth: 1200, alignSelf: "center", flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 38 },
  footerBrandCol: { maxWidth: 430 },
  footerText: { marginTop: 17, color: "#8EA7AC", fontSize: 12, lineHeight: 20 },
  footerHeading: { color: "#E0B95B", fontSize: 11, fontWeight: "900", letterSpacing: 1.3, marginBottom: 12 },
  footerLink: { color: "#A8BFC3", fontSize: 12, marginBottom: 9 },
  footerBottom: { width: "100%", maxWidth: 1200, alignSelf: "center", marginTop: 40, paddingTop: 20, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.09)", flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: 10 },
  footerLegal: { color: "#718C91", fontSize: 10 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(2,24,29,0.70)", alignItems: "center", justifyContent: "center", padding: 20 },
  demoModal: { width: "100%", maxWidth: 520, borderRadius: 24, backgroundColor: "#fff", padding: 30, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 30, shadowOffset: { width: 0, height: 15 }, elevation: 16, overflow: "hidden" },
  demoModalCompact: { padding: 22, borderRadius: 20 },
  modalAccent: { position: "absolute", top: 0, left: 0, right: 0, height: 5, backgroundColor: TEAL },
  modalClose: { position: "absolute", top: 16, right: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: "#F1F5F5", alignItems: "center", justifyContent: "center", zIndex: 3 },
  modalIcon: { width: 54, height: 54, borderRadius: 16, backgroundColor: "#E8F5F4", alignItems: "center", justifyContent: "center", marginBottom: 19 },
  modalEyebrow: { color: TEAL, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  modalTitle: { marginTop: 8, paddingRight: 26, color: TEXT, fontSize: 27, lineHeight: 33, fontWeight: "900", letterSpacing: -0.5 },
  modalText: { marginTop: 12, color: MUTED, fontSize: 14, lineHeight: 23 },
  testingNotice: { marginTop: 18, padding: 13, borderRadius: 12, backgroundColor: "#EFF8F7", borderWidth: 1, borderColor: "#CDE6E3", flexDirection: "row", alignItems: "center", gap: 9 },
  testingNoticeText: { flex: 1, color: "#42656A", fontSize: 12, lineHeight: 18, fontWeight: "600" },
  inputLabel: { marginTop: 21, marginBottom: 7, color: TEXT, fontSize: 12, fontWeight: "800" },
  emailInputWrap: { minHeight: 52, paddingHorizontal: 14, borderRadius: 13, borderWidth: 1.5, borderColor: "#CFE0E2", backgroundColor: "#FBFDFD", flexDirection: "row", alignItems: "center", gap: 9 },
  emailInputError: { borderColor: "#D92D20", backgroundColor: "#FFF8F7" },
  emailInput: { flex: 1, color: TEXT, fontSize: 14, outlineStyle: Platform.OS === "web" ? "none" as any : undefined },
  formError: { marginTop: 7, color: "#B42318", fontSize: 11, fontWeight: "700" },
  submitDemoBtn: { marginTop: 15, minHeight: 52, borderRadius: 13, backgroundColor: TEAL, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  submitDisabled: { opacity: 0.65 },
  submitDemoText: { color: "#fff", fontSize: 14, fontWeight: "900" },
  privacyNote: { marginTop: 12, color: "#86999D", fontSize: 10, lineHeight: 16, textAlign: "center" },
  successWrap: { alignItems: "center", paddingTop: 12 },
  successIcon: { width: 62, height: 62, borderRadius: 31, backgroundColor: TEAL, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  modalDoneBtn: { marginTop: 23, minWidth: 150, minHeight: 48, borderRadius: 12, backgroundColor: NAVY, alignItems: "center", justifyContent: "center" },
  modalDoneText: { color: "#fff", fontWeight: "900" },
});
