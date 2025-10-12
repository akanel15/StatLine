import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
  Pressable,
  SectionList,
  ActivityIndicator,
} from "react-native";
import { theme } from "@/theme";
import { StatLineButton } from "@/components/StatLineButton";
import {
  runFullValidation,
  fixAllAutoFixableIssues,
  type GlobalValidationReport,
  type ValidationIssue,
  type IssueLevel,
} from "@/utils/debug/validator";

type SectionData = {
  title: string;
  data: ValidationIssue[];
  healthScore?: number;
  totalEntities?: number;
};

export default function ValidationScreen() {
  const [validationReport, setValidationReport] =
    useState<GlobalValidationReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"validation" | "inspector">(
    "validation",
  );

  useEffect(() => {
    runValidation();
  }, []);

  const runValidation = async () => {
    setLoading(true);
    try {
      // Add small delay to show loading state
      await new Promise((resolve) => setTimeout(resolve, 500));
      const report = runFullValidation();
      setValidationReport(report);
    } catch (error) {
      console.error("Error running validation:", error);
      Alert.alert("Error", `Failed to run validation: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFixAllIssues = () => {
    if (!validationReport) return;

    const fixableIssues = [
      ...validationReport.storeReports.flatMap((r) =>
        r.issues.filter((i) => i.fixable),
      ),
      ...validationReport.globalIssues.filter((i) => i.fixable),
    ];

    if (fixableIssues.length === 0) {
      Alert.alert("Info", "No auto-fixable issues found!");
      return;
    }

    Alert.alert(
      "Fix All Issues",
      `This will automatically fix ${fixableIssues.length} issues. This action cannot be undone. Are you sure?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Fix All",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const fixedCount = fixAllAutoFixableIssues();
              await runValidation(); // Re-run validation
              Alert.alert(
                "Success",
                `Fixed ${fixedCount} issues automatically!`,
              );
            } catch (error) {
              console.error("Error fixing issues:", error);
              Alert.alert("Error", `Failed to fix issues: ${error}`);
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleFixSingleIssue = (issue: ValidationIssue) => {
    if (!issue.fixable || !issue.fixAction) return;

    Alert.alert(
      "Fix Issue",
      `Fix "${issue.title}"?\n\n${issue.description}\n\nThis action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Fix",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              issue.fixAction!();
              await runValidation(); // Re-run validation
              Alert.alert("Success", "Issue fixed!");
            } catch (error) {
              console.error("Error fixing issue:", error);
              Alert.alert("Error", `Failed to fix issue: ${error}`);
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const getHealthScoreColor = (score: number): string => {
    if (score >= 80) return theme.colorSuccess;
    if (score >= 60) return theme.colorWarning;
    return theme.colorRedCrayola;
  };

  const getIssueIcon = (level: IssueLevel): string => {
    switch (level) {
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      case "info":
        return "ℹ️";
      default:
        return "•";
    }
  };

  const getIssueColor = (level: IssueLevel): string => {
    switch (level) {
      case "error":
        return theme.colorRedCrayola;
      case "warning":
        return theme.colorWarning;
      case "info":
        return theme.colorBlue;
      default:
        return theme.colorGrey;
    }
  };

  const renderHealthBanner = () => {
    if (!validationReport) return null;

    const { overallHealthScore, totalIssues } = validationReport;
    const healthColor = getHealthScoreColor(overallHealthScore);

    return (
      <View style={[styles.healthBanner, { borderLeftColor: healthColor }]}>
        <View style={styles.healthHeader}>
          <Text style={[styles.healthScore, { color: healthColor }]}>
            {overallHealthScore.toFixed(0)}%
          </Text>
          <View style={styles.healthInfo}>
            <Text style={styles.healthTitle}>Overall Health Score</Text>
            <Text style={styles.healthSubtitle}>
              {totalIssues === 0
                ? "Perfect! No issues found"
                : `${totalIssues} issues found`}
            </Text>
          </View>
        </View>

        {totalIssues > 0 && (
          <StatLineButton
            title="Fix All"
            color={theme.colorOrangePeel}
            onPress={handleFixAllIssues}
            style={styles.fixAllButton}
            disabled={loading}
          />
        )}
      </View>
    );
  };

  const renderTabHeader = () => (
    <View style={styles.tabContainer}>
      <Pressable
        style={[styles.tab, selectedTab === "validation" && styles.activeTab]}
        onPress={() => setSelectedTab("validation")}
      >
        <Text
          style={[
            styles.tabText,
            selectedTab === "validation" && styles.activeTabText,
          ]}
        >
          Validation
        </Text>
      </Pressable>

      <Pressable
        style={[styles.tab, selectedTab === "inspector" && styles.activeTab]}
        onPress={() => setSelectedTab("inspector")}
      >
        <Text
          style={[
            styles.tabText,
            selectedTab === "inspector" && styles.activeTabText,
          ]}
        >
          Store Inspector
        </Text>
      </Pressable>
    </View>
  );

  const renderValidationContent = () => {
    if (!validationReport) return null;

    const sections: SectionData[] = [
      // Global issues section
      ...(validationReport.globalIssues.length > 0
        ? [
            {
              title: "🌐 Global Issues",
              data: validationReport.globalIssues,
            },
          ]
        : []),

      // Store-specific sections
      ...validationReport.storeReports.map((report) => ({
        title: `${getStoreIcon(report.storeType)} ${getStoreDisplayName(report.storeType)} (${report.issues.length} issues)`,
        data: report.issues,
        healthScore: report.healthScore,
        totalEntities: report.totalEntities,
      })),
    ];

    return (
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderIssueItem(item)}
        renderSectionHeader={({ section }) => renderSectionHeader(section)}
        style={styles.sectionList}
        contentContainerStyle={styles.sectionListContent}
      />
    );
  };

  const renderInspectorContent = () => {
    if (!validationReport) return null;

    return (
      <ScrollView style={styles.inspectorContainer}>
        <Text style={styles.sectionTitle}>🔍 Store Inspector</Text>
        <Text style={styles.sectionSubtitle}>
          Browse and inspect your store data
        </Text>

        {validationReport.storeReports.map((report) => (
          <View key={report.storeType} style={styles.storeCard}>
            <View style={styles.storeHeader}>
              <Text style={styles.storeTitle}>
                {getStoreIcon(report.storeType)}{" "}
                {getStoreDisplayName(report.storeType)}
              </Text>
              <Text style={styles.storeCount}>
                {report.totalEntities} items
              </Text>
            </View>

            <View style={styles.storeHealth}>
              <Text style={styles.storeHealthLabel}>Health Score:</Text>
              <Text
                style={[
                  styles.storeHealthScore,
                  { color: getHealthScoreColor(report.healthScore) },
                ]}
              >
                {report.healthScore.toFixed(0)}%
              </Text>
            </View>

            <Text style={styles.storeDescription}>
              {getStoreDescription(report.storeType)}
            </Text>

            <StatLineButton
              title={`Inspect ${getStoreDisplayName(report.storeType)}`}
              color={getStoreColor(report.storeType)}
              onPress={() =>
                Alert.alert(
                  "Coming Soon",
                  "Detailed store inspection will be available soon!",
                )
              }
              style={styles.inspectButton}
            />
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderSectionHeader = (section: SectionData) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
      {section.healthScore !== undefined && (
        <Text
          style={[
            styles.sectionHealthScore,
            { color: getHealthScoreColor(section.healthScore) },
          ]}
        >
          {section.healthScore.toFixed(0)}%
        </Text>
      )}
    </View>
  );

  const renderIssueItem = (issue: ValidationIssue) => (
    <View
      style={[
        styles.issueCard,
        { borderLeftColor: getIssueColor(issue.level) },
      ]}
    >
      <View style={styles.issueHeader}>
        <Text style={styles.issueIcon}>{getIssueIcon(issue.level)}</Text>
        <View style={styles.issueInfo}>
          <Text style={styles.issueTitle}>{issue.title}</Text>
          {issue.entityName && (
            <Text style={styles.issueEntity}>{issue.entityName}</Text>
          )}
        </View>
        {issue.fixable && (
          <Pressable
            style={styles.fixButton}
            onPress={() => handleFixSingleIssue(issue)}
          >
            <Text style={styles.fixButtonText}>Fix</Text>
          </Pressable>
        )}
      </View>
      <Text style={styles.issueDescription}>{issue.description}</Text>
    </View>
  );

  const getStoreIcon = (storeType: string): string => {
    switch (storeType) {
      case "teams":
        return "🏀";
      case "players":
        return "👤";
      case "games":
        return "🎮";
      case "sets":
        return "👥";
      default:
        return "📦";
    }
  };

  const getStoreDisplayName = (storeType: string): string => {
    switch (storeType) {
      case "teams":
        return "Teams";
      case "players":
        return "Players";
      case "games":
        return "Games";
      case "sets":
        return "Sets";
      default:
        return storeType;
    }
  };

  const getStoreColor = (storeType: string): string => {
    switch (storeType) {
      case "teams":
        return theme.colorBlue;
      case "players":
        return theme.colorGreen;
      case "games":
        return theme.colorOrangePeel;
      case "sets":
        return theme.colorPurple;
      default:
        return theme.colorGrey;
    }
  };

  const getStoreDescription = (storeType: string): string => {
    switch (storeType) {
      case "teams":
        return "Team data including names, stats, and game records";
      case "players":
        return "Player profiles with stats, jersey numbers, and team assignments";
      case "games":
        return "Game records with scores, periods, and player participation";
      case "sets":
        return "Player lineups and their performance statistics";
      default:
        return "Store data";
    }
  };

  if (loading && !validationReport) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colorBlue} />
          <Text style={styles.loadingText}>Running data validation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHealthBanner()}
      {renderTabHeader()}

      {loading && validationReport && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={theme.colorBlue} />
          <Text style={styles.loadingOverlayText}>Updating...</Text>
        </View>
      )}

      {selectedTab === "validation"
        ? renderValidationContent()
        : renderInspectorContent()}

      <View style={styles.footer}>
        <StatLineButton
          title="Re-run Validation"
          color={theme.colorBlue}
          onPress={runValidation}
          style={styles.refreshButton}
          disabled={loading}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colorWhite,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colorGrey,
  },
  healthBanner: {
    backgroundColor: theme.colorWhite,
    borderLeftWidth: 4,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    shadowColor: theme.colorBlack,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  healthHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  healthScore: {
    fontSize: 32,
    fontWeight: "bold",
    marginRight: 16,
  },
  healthInfo: {
    flex: 1,
  },
  healthTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colorOnyx,
    marginBottom: 4,
  },
  healthSubtitle: {
    fontSize: 14,
    color: theme.colorGrey,
  },
  fixAllButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 24,
  },
  tabContainer: {
    flexDirection: "row",
    margin: 16,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: theme.colorLightGrey,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: theme.colorWhite,
    shadowColor: theme.colorBlack,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colorGrey,
  },
  activeTabText: {
    color: theme.colorOnyx,
  },
  sectionList: {
    flex: 1,
  },
  sectionListContent: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colorLightGrey,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 6,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colorOnyx,
  },
  sectionHealthScore: {
    fontSize: 14,
    fontWeight: "600",
  },
  issueCard: {
    backgroundColor: theme.colorWhite,
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: theme.colorBlack,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  issueHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  issueIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  issueInfo: {
    flex: 1,
  },
  issueTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colorOnyx,
    marginBottom: 2,
  },
  issueEntity: {
    fontSize: 14,
    color: theme.colorBlue,
    fontWeight: "500",
  },
  issueDescription: {
    fontSize: 14,
    color: theme.colorGrey,
    lineHeight: 20,
  },
  fixButton: {
    backgroundColor: theme.colorOrangePeel,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  fixButtonText: {
    color: theme.colorWhite,
    fontSize: 14,
    fontWeight: "600",
  },
  inspectorContainer: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colorOnyx,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.colorGrey,
    marginBottom: 20,
  },
  storeCard: {
    backgroundColor: theme.colorWhite,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: theme.colorBlack,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  storeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  storeTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colorOnyx,
  },
  storeCount: {
    fontSize: 14,
    color: theme.colorGrey,
    fontWeight: "500",
  },
  storeHealth: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  storeHealthLabel: {
    fontSize: 14,
    color: theme.colorGrey,
    marginRight: 8,
  },
  storeHealthScore: {
    fontSize: 14,
    fontWeight: "600",
  },
  storeDescription: {
    fontSize: 14,
    color: theme.colorGrey,
    marginBottom: 12,
    lineHeight: 20,
  },
  inspectButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colorLightGrey,
  },
  refreshButton: {
    width: "100%",
  },
  loadingOverlay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colorLightGrey,
    paddingVertical: 8,
    marginHorizontal: 16,
    borderRadius: 6,
    marginBottom: 8,
  },
  loadingOverlayText: {
    marginLeft: 8,
    fontSize: 14,
    color: theme.colorGrey,
  },
});
