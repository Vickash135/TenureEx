import { colors } from "@/src/theme/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  TextInput as NativeTextInput,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

type CountryRow = {
  countryCode: string;
  callingCode: string;
};

// ISO 3166-1 alpha-2 countries/territories and their international calling codes.
// Kept locally so phone entry does not depend on a network request or backend change.
const COUNTRY_ROWS: CountryRow[] = [
  { countryCode: "AF", callingCode: "93" }, { countryCode: "AX", callingCode: "358" },
  { countryCode: "AQ", callingCode: "672" }, { countryCode: "AL", callingCode: "355" },
  { countryCode: "DZ", callingCode: "213" }, { countryCode: "AS", callingCode: "1" },
  { countryCode: "AD", callingCode: "376" }, { countryCode: "AO", callingCode: "244" },
  { countryCode: "AI", callingCode: "1" }, { countryCode: "AG", callingCode: "1" },
  { countryCode: "AR", callingCode: "54" }, { countryCode: "AM", callingCode: "374" },
  { countryCode: "AW", callingCode: "297" }, { countryCode: "AU", callingCode: "61" },
  { countryCode: "AT", callingCode: "43" }, { countryCode: "AZ", callingCode: "994" },
  { countryCode: "BS", callingCode: "1" }, { countryCode: "BH", callingCode: "973" },
  { countryCode: "BD", callingCode: "880" }, { countryCode: "BB", callingCode: "1" },
  { countryCode: "BY", callingCode: "375" }, { countryCode: "BE", callingCode: "32" },
  { countryCode: "BZ", callingCode: "501" }, { countryCode: "BJ", callingCode: "229" },
  { countryCode: "BM", callingCode: "1" }, { countryCode: "BT", callingCode: "975" },
  { countryCode: "BO", callingCode: "591" }, { countryCode: "BQ", callingCode: "599" },
  { countryCode: "BA", callingCode: "387" }, { countryCode: "BW", callingCode: "267" },
  { countryCode: "BR", callingCode: "55" }, { countryCode: "IO", callingCode: "246" },
  { countryCode: "BN", callingCode: "673" }, { countryCode: "BG", callingCode: "359" },
  { countryCode: "BF", callingCode: "226" }, { countryCode: "BI", callingCode: "257" },
  { countryCode: "CV", callingCode: "238" }, { countryCode: "KH", callingCode: "855" },
  { countryCode: "CM", callingCode: "237" }, { countryCode: "CA", callingCode: "1" },
  { countryCode: "KY", callingCode: "1" }, { countryCode: "CF", callingCode: "236" },
  { countryCode: "TD", callingCode: "235" }, { countryCode: "CL", callingCode: "56" },
  { countryCode: "CN", callingCode: "86" }, { countryCode: "CX", callingCode: "61" },
  { countryCode: "CC", callingCode: "61" }, { countryCode: "CO", callingCode: "57" },
  { countryCode: "KM", callingCode: "269" }, { countryCode: "CG", callingCode: "242" },
  { countryCode: "CD", callingCode: "243" }, { countryCode: "CK", callingCode: "682" },
  { countryCode: "CR", callingCode: "506" }, { countryCode: "CI", callingCode: "225" },
  { countryCode: "HR", callingCode: "385" }, { countryCode: "CU", callingCode: "53" },
  { countryCode: "CW", callingCode: "599" }, { countryCode: "CY", callingCode: "357" },
  { countryCode: "CZ", callingCode: "420" }, { countryCode: "DK", callingCode: "45" },
  { countryCode: "DJ", callingCode: "253" }, { countryCode: "DM", callingCode: "1" },
  { countryCode: "DO", callingCode: "1" }, { countryCode: "EC", callingCode: "593" },
  { countryCode: "EG", callingCode: "20" }, { countryCode: "SV", callingCode: "503" },
  { countryCode: "GQ", callingCode: "240" }, { countryCode: "ER", callingCode: "291" },
  { countryCode: "EE", callingCode: "372" }, { countryCode: "SZ", callingCode: "268" },
  { countryCode: "ET", callingCode: "251" }, { countryCode: "FK", callingCode: "500" },
  { countryCode: "FO", callingCode: "298" }, { countryCode: "FJ", callingCode: "679" },
  { countryCode: "FI", callingCode: "358" }, { countryCode: "FR", callingCode: "33" }, { countryCode: "TF", callingCode: "262" },
  { countryCode: "GF", callingCode: "594" }, { countryCode: "PF", callingCode: "689" },
  { countryCode: "GA", callingCode: "241" }, { countryCode: "GM", callingCode: "220" },
  { countryCode: "GE", callingCode: "995" }, { countryCode: "DE", callingCode: "49" },
  { countryCode: "GH", callingCode: "233" }, { countryCode: "GI", callingCode: "350" },
  { countryCode: "GR", callingCode: "30" }, { countryCode: "GL", callingCode: "299" },
  { countryCode: "GD", callingCode: "1" }, { countryCode: "GP", callingCode: "590" },
  { countryCode: "GU", callingCode: "1" }, { countryCode: "GT", callingCode: "502" },
  { countryCode: "GG", callingCode: "44" }, { countryCode: "GN", callingCode: "224" },
  { countryCode: "GW", callingCode: "245" }, { countryCode: "GY", callingCode: "592" },
  { countryCode: "HT", callingCode: "509" }, { countryCode: "HN", callingCode: "504" },
  { countryCode: "HK", callingCode: "852" }, { countryCode: "HU", callingCode: "36" },
  { countryCode: "IS", callingCode: "354" }, { countryCode: "IN", callingCode: "91" },
  { countryCode: "ID", callingCode: "62" }, { countryCode: "IR", callingCode: "98" },
  { countryCode: "IQ", callingCode: "964" }, { countryCode: "IE", callingCode: "353" },
  { countryCode: "IM", callingCode: "44" }, { countryCode: "IL", callingCode: "972" },
  { countryCode: "IT", callingCode: "39" }, { countryCode: "JM", callingCode: "1" },
  { countryCode: "JP", callingCode: "81" }, { countryCode: "JE", callingCode: "44" },
  { countryCode: "JO", callingCode: "962" }, { countryCode: "KZ", callingCode: "7" },
  { countryCode: "KE", callingCode: "254" }, { countryCode: "KI", callingCode: "686" },
  { countryCode: "KP", callingCode: "850" }, { countryCode: "KR", callingCode: "82" },
  { countryCode: "XK", callingCode: "383" }, { countryCode: "KW", callingCode: "965" },
  { countryCode: "KG", callingCode: "996" }, { countryCode: "LA", callingCode: "856" },
  { countryCode: "LV", callingCode: "371" }, { countryCode: "LB", callingCode: "961" },
  { countryCode: "LS", callingCode: "266" }, { countryCode: "LR", callingCode: "231" },
  { countryCode: "LY", callingCode: "218" }, { countryCode: "LI", callingCode: "423" },
  { countryCode: "LT", callingCode: "370" }, { countryCode: "LU", callingCode: "352" },
  { countryCode: "MO", callingCode: "853" }, { countryCode: "MG", callingCode: "261" },
  { countryCode: "MW", callingCode: "265" }, { countryCode: "MY", callingCode: "60" },
  { countryCode: "MV", callingCode: "960" }, { countryCode: "ML", callingCode: "223" },
  { countryCode: "MT", callingCode: "356" }, { countryCode: "MH", callingCode: "692" },
  { countryCode: "MQ", callingCode: "596" }, { countryCode: "MR", callingCode: "222" },
  { countryCode: "MU", callingCode: "230" }, { countryCode: "YT", callingCode: "262" },
  { countryCode: "MX", callingCode: "52" }, { countryCode: "FM", callingCode: "691" },
  { countryCode: "MD", callingCode: "373" }, { countryCode: "MC", callingCode: "377" },
  { countryCode: "MN", callingCode: "976" }, { countryCode: "ME", callingCode: "382" },
  { countryCode: "MS", callingCode: "1" }, { countryCode: "MA", callingCode: "212" },
  { countryCode: "MZ", callingCode: "258" }, { countryCode: "MM", callingCode: "95" },
  { countryCode: "NA", callingCode: "264" }, { countryCode: "NR", callingCode: "674" },
  { countryCode: "NP", callingCode: "977" }, { countryCode: "NL", callingCode: "31" },
  { countryCode: "NC", callingCode: "687" }, { countryCode: "NZ", callingCode: "64" },
  { countryCode: "NI", callingCode: "505" }, { countryCode: "NE", callingCode: "227" },
  { countryCode: "NG", callingCode: "234" }, { countryCode: "NU", callingCode: "683" },
  { countryCode: "NF", callingCode: "672" }, { countryCode: "MK", callingCode: "389" },
  { countryCode: "MP", callingCode: "1" }, { countryCode: "NO", callingCode: "47" },
  { countryCode: "OM", callingCode: "968" }, { countryCode: "PK", callingCode: "92" },
  { countryCode: "PW", callingCode: "680" }, { countryCode: "PS", callingCode: "970" },
  { countryCode: "PA", callingCode: "507" }, { countryCode: "PG", callingCode: "675" },
  { countryCode: "PY", callingCode: "595" }, { countryCode: "PE", callingCode: "51" },
  { countryCode: "PH", callingCode: "63" }, { countryCode: "PN", callingCode: "64" },
  { countryCode: "PL", callingCode: "48" },
  { countryCode: "PT", callingCode: "351" }, { countryCode: "PR", callingCode: "1" },
  { countryCode: "QA", callingCode: "974" }, { countryCode: "RE", callingCode: "262" },
  { countryCode: "RO", callingCode: "40" }, { countryCode: "RU", callingCode: "7" },
  { countryCode: "RW", callingCode: "250" }, { countryCode: "BL", callingCode: "590" },
  { countryCode: "SH", callingCode: "290" }, { countryCode: "KN", callingCode: "1" },
  { countryCode: "LC", callingCode: "1" }, { countryCode: "MF", callingCode: "590" },
  { countryCode: "PM", callingCode: "508" }, { countryCode: "VC", callingCode: "1" },
  { countryCode: "WS", callingCode: "685" }, { countryCode: "SM", callingCode: "378" },
  { countryCode: "ST", callingCode: "239" }, { countryCode: "SA", callingCode: "966" },
  { countryCode: "SN", callingCode: "221" }, { countryCode: "RS", callingCode: "381" },
  { countryCode: "SC", callingCode: "248" }, { countryCode: "SL", callingCode: "232" },
  { countryCode: "SG", callingCode: "65" }, { countryCode: "SX", callingCode: "1" },
  { countryCode: "SK", callingCode: "421" }, { countryCode: "SI", callingCode: "386" },
  { countryCode: "SB", callingCode: "677" }, { countryCode: "SO", callingCode: "252" },
  { countryCode: "ZA", callingCode: "27" }, { countryCode: "GS", callingCode: "500" },
  { countryCode: "SS", callingCode: "211" },
  { countryCode: "ES", callingCode: "34" }, { countryCode: "LK", callingCode: "94" },
  { countryCode: "SD", callingCode: "249" }, { countryCode: "SR", callingCode: "597" },
  { countryCode: "SJ", callingCode: "47" }, { countryCode: "SE", callingCode: "46" },
  { countryCode: "CH", callingCode: "41" }, { countryCode: "SY", callingCode: "963" },
  { countryCode: "TW", callingCode: "886" }, { countryCode: "TJ", callingCode: "992" },
  { countryCode: "TZ", callingCode: "255" }, { countryCode: "TH", callingCode: "66" },
  { countryCode: "TL", callingCode: "670" }, { countryCode: "TG", callingCode: "228" },
  { countryCode: "TK", callingCode: "690" }, { countryCode: "TO", callingCode: "676" },
  { countryCode: "TT", callingCode: "1" }, { countryCode: "TN", callingCode: "216" },
  { countryCode: "TR", callingCode: "90" }, { countryCode: "TM", callingCode: "993" },
  { countryCode: "TC", callingCode: "1" }, { countryCode: "TV", callingCode: "688" },
  { countryCode: "UG", callingCode: "256" }, { countryCode: "UA", callingCode: "380" },
  { countryCode: "AE", callingCode: "971" }, { countryCode: "GB", callingCode: "44" },
  { countryCode: "US", callingCode: "1" }, { countryCode: "UM", callingCode: "1" },
  { countryCode: "UY", callingCode: "598" },
  { countryCode: "UZ", callingCode: "998" }, { countryCode: "VU", callingCode: "678" },
  { countryCode: "VA", callingCode: "39" }, { countryCode: "VE", callingCode: "58" },
  { countryCode: "VN", callingCode: "84" }, { countryCode: "VG", callingCode: "1" },
  { countryCode: "VI", callingCode: "1" }, { countryCode: "WF", callingCode: "681" },
  { countryCode: "EH", callingCode: "212" }, { countryCode: "YE", callingCode: "967" },
  { countryCode: "ZM", callingCode: "260" }, { countryCode: "ZW", callingCode: "263" },
];

function flagFor(code: string) {
  if (code.length !== 2) return "🌐";
  return String.fromCodePoint(...code.toUpperCase().split("").map((char) => 127397 + char.charCodeAt(0)));
}

function countryName(code: string) {
  try {
    const DisplayNames = (Intl as any).DisplayNames;
    if (DisplayNames) {
      return new DisplayNames(["en"], { type: "region" }).of(code) || code;
    }
  } catch {
    // Fallback below.
  }
  return code;
}

const COUNTRIES = COUNTRY_ROWS.map((row) => ({
  ...row,
  name: countryName(row.countryCode),
  flag: flagFor(row.countryCode),
})).sort((a, b) => a.name.localeCompare(b.name));

const DEFAULT_COUNTRY = COUNTRIES.find((item) => item.countryCode === "GB") || COUNTRIES[0];

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function countryFromValue(value: string) {
  const digits = digitsOnly(value);
  if (!value.trim().startsWith("+") || !digits) return null;
  const matches = COUNTRIES.filter((item) => digits.startsWith(item.callingCode));
  return matches.sort((a, b) => b.callingCode.length - a.callingCode.length)[0] || null;
}

function localNumber(value: string, callingCode: string) {
  const raw = value.trim();
  const digits = digitsOnly(raw);
  if (!digits) return "";
  if (raw.startsWith("+") && digits.startsWith(callingCode)) {
    return digits.slice(callingCode.length);
  }
  return digits;
}

type Props = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: boolean | string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  required?: boolean;
};

export default function InternationalPhoneInput({
  label,
  value,
  onChangeText,
  error,
  disabled = false,
  style,
}: Props) {
  const initial = countryFromValue(value) || DEFAULT_COUNTRY;
  const [selectedCountry, setSelectedCountry] = useState(initial);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!value.trim().startsWith("+")) return;
    const digits = digitsOnly(value);
    if (digits.startsWith(selectedCountry.callingCode)) return;
    const detected = countryFromValue(value);
    if (detected) setSelectedCountry(detected);
  }, [value, selectedCountry.callingCode]);

  const local = localNumber(value, selectedCountry.callingCode);
  const hasError = Boolean(error);

  const filteredCountries = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return COUNTRIES;
    return COUNTRIES.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.countryCode.toLowerCase().includes(query) ||
        `+${item.callingCode}`.includes(query),
    );
  }, [search]);

  const emitLocal = (nextLocal: string) => {
    let normalized = digitsOnly(nextLocal).replace(/^0+/, "");
    if (!normalized) {
      onChangeText("");
      return;
    }
    onChangeText(`+${selectedCountry.callingCode}${normalized}`);
  };

  const chooseCountry = (country: (typeof COUNTRIES)[number]) => {
    setSelectedCountry(country);
    setPickerVisible(false);
    setSearch("");
    if (local) {
      onChangeText(`+${country.callingCode}${local.replace(/^0+/, "")}`);
    }
  };

  return (
    <View style={[styles.wrapper, style]}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.row, hasError && styles.rowError, disabled && styles.disabled]}>
        <Pressable
          disabled={disabled}
          onPress={() => setPickerVisible(true)}
          style={styles.countryButton}
          accessibilityRole="button"
          accessibilityLabel={`Select country. Current country ${selectedCountry.name}`}
        >
          <Text style={styles.flag}>{selectedCountry.flag}</Text>
          <Text style={styles.countryCode}>{selectedCountry.countryCode}</Text>
          <MaterialCommunityIcons name="chevron-down" size={18} color={colors.textSecondary} />
        </Pressable>
        <View style={styles.divider} />
        <Text style={styles.callingCode}>+{selectedCountry.callingCode}</Text>
        <NativeTextInput
          value={local}
          editable={!disabled}
          onChangeText={emitLocal}
          keyboardType="phone-pad"
          placeholder="Phone number"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
        />
      </View>
      {typeof error === "string" && error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal visible={pickerVisible} transparent animationType="fade" onRequestClose={() => setPickerVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setPickerVisible(false)}>
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select country</Text>
              <Pressable onPress={() => setPickerVisible(false)} style={styles.closeButton}>
                <MaterialCommunityIcons name="close" size={22} color={colors.textPrimary} />
              </Pressable>
            </View>
            <View style={styles.searchBox}>
              <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
              <NativeTextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search country or code"
                placeholderTextColor={colors.textSecondary}
                autoFocus
                style={styles.searchInput}
              />
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" style={styles.countryList}>
              {filteredCountries.map((country) => {
                const active = country.countryCode === selectedCountry.countryCode;
                return (
                  <Pressable key={country.countryCode} onPress={() => chooseCountry(country)} style={styles.countryRow}>
                    <Text style={styles.rowFlag}>{country.flag}</Text>
                    <View style={styles.rowNameWrap}>
                      <Text style={styles.rowName}>{country.name}</Text>
                      <Text style={styles.rowIso}>{country.countryCode}</Text>
                    </View>
                    <Text style={styles.rowDial}>+{country.callingCode}</Text>
                    {active ? <MaterialCommunityIcons name="check" size={20} color={colors.primary} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: "100%" },
  label: { fontSize: 13, fontWeight: "700", color: colors.textPrimary, marginBottom: 7 },
  row: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  rowError: { borderColor: colors.error },
  disabled: { opacity: 0.65 },
  countryButton: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, height: "100%", gap: 6 },
  flag: { fontSize: 20 },
  countryCode: { fontSize: 13, fontWeight: "700", color: colors.textPrimary },
  divider: { width: 1, alignSelf: "stretch", backgroundColor: colors.border },
  callingCode: { fontSize: 15, fontWeight: "700", color: colors.textPrimary, marginLeft: 12 },
  input: { flex: 1, minHeight: 54, paddingHorizontal: 10, fontSize: 15, color: colors.textPrimary, outlineStyle: "none" } as any,
  errorText: { color: colors.error, fontSize: 12, marginTop: 5 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.38)", alignItems: "center", justifyContent: "center", padding: 20 },
  modalCard: { width: "100%", maxWidth: 520, maxHeight: "82%", backgroundColor: colors.surface, borderRadius: 16, padding: 18 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: colors.textPrimary },
  closeButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  searchBox: { height: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 10, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, gap: 8, marginBottom: 8 },
  searchInput: { flex: 1, height: 46, color: colors.textPrimary, fontSize: 15, outlineStyle: "none" } as any,
  countryList: { flexGrow: 0 },
  countryRow: { minHeight: 54, flexDirection: "row", alignItems: "center", paddingHorizontal: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, gap: 10 },
  rowFlag: { fontSize: 23, width: 32 },
  rowNameWrap: { flex: 1 },
  rowName: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  rowIso: { marginTop: 2, fontSize: 11, color: colors.textSecondary },
  rowDial: { fontSize: 14, fontWeight: "700", color: colors.textSecondary },
});
