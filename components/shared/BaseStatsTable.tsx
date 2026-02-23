import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { theme } from "@/theme";
import { scale, moderateScale } from "@/utils/responsive";

export type BaseTableRow = {
  key: string;
  leftColumnContent: React.ReactNode;
  statValues: string[];
  statStyle?: "total" | "team";
};

export type BaseTableHeader = {
  label: string;
  onPress?: () => void;
  isActive?: boolean;
};

type BaseStatsTableProps = {
  stickyColumnHeader: string;
  headers: BaseTableHeader[];
  rows: BaseTableRow[];
  stickyColumnWidth?: number;
  scrollable?: boolean;
  containerBorder?: boolean;
};

export function BaseStatsTable({
  stickyColumnHeader,
  headers,
  rows,
  stickyColumnWidth = scale(130),
  scrollable = true,
  containerBorder = true,
}: BaseStatsTableProps) {
  const statsContent = (
    <View>
      {/* Stats Header Row */}
      <View style={styles.statsHeaderRow}>
        {headers.map((header, index) =>
          header.onPress ? (
            <TouchableOpacity key={index} onPress={header.onPress} activeOpacity={0.7}>
              <Text
                style={[styles.statHeaderCell, header.isActive && styles.statHeaderCellActive]}
                allowFontScaling={true}
                maxFontSizeMultiplier={1.5}
              >
                {header.label}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text
              key={index}
              style={styles.statHeaderCell}
              allowFontScaling={true}
              maxFontSizeMultiplier={1.5}
            >
              {header.label}
            </Text>
          ),
        )}
      </View>

      {/* Data Rows */}
      {rows.map(row => (
        <View key={row.key} style={styles.statsDataRow}>
          {row.statValues.map((stat, index) => (
            <Text
              key={index}
              style={[
                styles.statCell,
                row.statStyle === "total" && styles.totalText,
                row.statStyle === "team" && styles.teamText,
              ]}
              allowFontScaling={true}
              maxFontSizeMultiplier={1.5}
            >
              {stat}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, containerBorder && styles.containerBorder]}>
      {/* Sticky Left Column */}
      <View style={styles.stickyColumn}>
        {/* Header */}
        <View style={[styles.stickyHeader, { width: stickyColumnWidth }]}>
          <Text style={styles.stickyHeaderText} allowFontScaling={true} maxFontSizeMultiplier={1.5}>
            {stickyColumnHeader}
          </Text>
        </View>

        {/* Left Column Rows */}
        {rows.map(row => (
          <View key={row.key} style={[styles.leftCell, { width: stickyColumnWidth }]}>
            {row.leftColumnContent}
          </View>
        ))}
      </View>

      {/* Stats Section */}
      {scrollable ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
          {statsContent}
        </ScrollView>
      ) : (
        <View style={styles.scrollView}>{statsContent}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    overflow: "hidden",
  },
  containerBorder: {
    borderWidth: 1,
    borderColor: theme.colorLightGrey,
    borderRadius: scale(12),
  },
  stickyColumn: {
    backgroundColor: theme.colorWhite,
  },
  stickyHeader: {
    paddingVertical: scale(8),
    paddingHorizontal: scale(8),
    backgroundColor: theme.colorLightGrey,
    borderBottomWidth: 2,
    borderBottomColor: theme.colorOnyx,
    height: scale(36),
    justifyContent: "center",
  },
  stickyHeaderText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
    textTransform: "uppercase",
    color: theme.colorOnyx,
    textAlign: "center",
  },
  leftCell: {
    borderRightWidth: 1,
    borderRightColor: theme.colorLightGrey,
    borderTopWidth: 1,
    borderTopColor: theme.colorLightGrey,
    backgroundColor: theme.colorWhite,
    justifyContent: "center",
    paddingVertical: scale(8),
    paddingHorizontal: scale(8),
    minHeight: scale(50),
  },
  scrollView: {
    flex: 1,
  },
  statsHeaderRow: {
    flexDirection: "row",
    paddingVertical: scale(8),
    backgroundColor: theme.colorLightGrey,
    borderBottomWidth: 2,
    borderBottomColor: theme.colorOnyx,
    height: scale(36),
    alignItems: "center",
  },
  statsDataRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: scale(8),
    borderTopWidth: 1,
    borderTopColor: theme.colorLightGrey,
    minHeight: scale(50),
  },
  statHeaderCell: {
    width: scale(45),
    textAlign: "center",
    fontSize: moderateScale(10),
    fontWeight: "700",
    textTransform: "uppercase",
    color: theme.colorOnyx,
    padding: scale(2),
  },
  statHeaderCellActive: {
    color: theme.colorOrangePeel,
    fontWeight: "900",
  },
  statCell: {
    width: scale(45),
    textAlign: "center",
    fontSize: moderateScale(13),
    fontWeight: "500",
    color: theme.colorOnyx,
    padding: scale(2),
  },
  totalText: {
    fontWeight: "700",
  },
  teamText: {
    color: theme.colorGrey,
  },
});
