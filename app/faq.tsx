import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { theme } from "@/theme";
import { AppText } from "@/components/shared/AppText";
import AntDesign from "@expo/vector-icons/AntDesign";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSection {
  title: string;
  items: FAQItem[];
}

const FAQ_DATA: FAQSection[] = [
  {
    title: "Getting Started",
    items: [
      {
        question: "How do I create a team?",
        answer:
          "Tap the + button in the top right corner of the home screen. Enter your team name, choose a logo (or upload a custom image), and tap Create.",
      },
      {
        question: "How do I add players to my team?",
        answer:
          "Open your team, then tap the Players tab. Tap the + button to add a new player. Enter their name and jersey number, then tap Save.",
      },
    ],
  },
  {
    title: "Tracking Games",
    items: [
      {
        question: "How do I start a new game?",
        answer:
          "Open your team and go to the Games tab. Tap New Game, enter the opponent name (and optionally add their logo), and select the period format (halves or quarters). Tap Start Game, then select 1-5 players to be active for tracking.",
      },
      {
        question: "How do I record stats during a game?",
        answer:
          "During a game, tap any player to open their stat buttons. Tap the stat you want to record (points, rebounds, assists, etc.). The stat is immediately saved and appears in the play-by-play.",
      },
      {
        question: "How do I track opponent stats?",
        answer:
          'Tap the "Opponent" button (black background) in the players section during a game. Then tap the stat you want to record. Opponent stats are tracked separately and appear in the box score.',
      },
      {
        question: "How do I end a game?",
        answer:
          'Tap "Done" in the top right corner of the game screen. Games also automatically complete when you navigate away or the app goes to the background.',
      },
    ],
  },
  {
    title: "Sets and Plays",
    items: [
      {
        question: "What are sets?",
        answer:
          'Sets are play calls that coaches use during games (like "Motion", "Horns", or "Pick and Roll"). When you select a set before recording stats, StatLine tracks how effective that play was. Each time possession changes, the set\'s "run count" increases, allowing you to see points, assists, and other stats per play call.',
      },
      {
        question: "How do I create a set?",
        answer:
          'Open your team and go to the Sets tab. Tap the + button and give your set a name (e.g., "Motion Offense", "1-4 High"). Tap Save to create the set.',
      },
      {
        question: "How do I use sets during a game?",
        answer:
          "During a live game, tap a set from the collapsible Sets section before recording stats. The set stays active for the entire possession. When possession changes (turnover, opponent scores, etc.), the set automatically resets and its run count increases.",
      },
      {
        question: "When do set stats reset?",
        answer:
          'Sets reset automatically when possession changes—after turnovers, when the opponent scores, or when they gain the ball. Each reset counts as one "run." This lets you measure stats per possession for each play call.',
      },
    ],
  },
  {
    title: "Substitutions",
    items: [
      {
        question: "How do I substitute players during a game?",
        answer:
          'Tap the "Sub Players" button at the bottom of the game screen. Select players to bring in from the bench and players to take out. Tap Confirm to update the active lineup.',
      },
      {
        question: "Is there a limit to how many players can be active?",
        answer:
          "You can have 1-5 active players at any time. This flexibility allows you to track games with fewer players on the court if needed.",
      },
    ],
  },
  {
    title: "Periods and Timing",
    items: [
      {
        question: "What's the difference between halves and quarters?",
        answer:
          "Halves divide the game into 2 periods (common in college and high school basketball). Quarters divide the game into 4 periods (common in NBA and youth leagues). Choose the format that matches your league.",
      },
      {
        question: "Can I add extra periods for overtime?",
        answer:
          "Yes! Navigate to the last period and tap the Next arrow to create an overtime period. You can add as many as needed.",
      },
      {
        question: "Can I delete a period?",
        answer:
          "Yes, swipe left on any period divider in the play-by-play view to delete it. The first period cannot be deleted. Deleting a period also removes all plays recorded in that period.",
      },
    ],
  },
  {
    title: "Box Score and Sharing",
    items: [
      {
        question: "How do I view the box score?",
        answer:
          "During or after a game, tap the Box Score button to see complete statistics for all players. The box score shows points, rebounds, assists, and other stats.",
      },
      {
        question: "Can I share game stats?",
        answer:
          "Yes! From the box score view, tap the Share button to generate an image of the stats. You can save it to your photos or share directly to social media and messaging apps.",
      },
      {
        question: "How do I see player averages?",
        answer:
          "Open your team and look at the main team page. Player averages across all games are displayed in a sortable table showing per-game stats like points, rebounds, and assists.",
      },
      {
        question: "Can I edit stats after a game?",
        answer:
          'Yes! Tap Edit in the top right corner of the completed game, then tap "Continue Game." This reopens the game for editing. You can delete plays by swiping left, reorder plays by dragging, and add new stats. Tap Done when finished.',
      },
    ],
  },
  {
    title: "Play-by-Play",
    items: [
      {
        question: "How do I undo a stat?",
        answer:
          "In the play-by-play section at the bottom of the game screen, find the play you want to remove and swipe left to reveal the delete option. Tap delete to remove that stat.",
      },
      {
        question: "Can I reorder plays?",
        answer:
          "Yes! Long-press any play to drag it. You can reorder plays within a period or drag them across period dividers to move between quarters/halves.",
      },
      {
        question: "What does the expand button do?",
        answer:
          "The expand button (top right of play-by-play) makes the play-by-play section fill most of the screen, hiding the player and set buttons temporarily. This gives you more room to review the game history. Tap again to collapse.",
      },
    ],
  },
  {
    title: "Your Data",
    items: [
      {
        question: "Where is my data stored?",
        answer:
          "All your data is stored locally on your device. StatLine does not upload or sync your data to any external servers. Your teams, players, and game stats are completely private.",
      },
      {
        question: "What happens if I delete the app?",
        answer:
          "Deleting the app will remove all your data, including teams, players, and game history. There is no backup or recovery option, so be careful when uninstalling.",
      },
    ],
  },
];

interface CollapsibleSectionProps {
  section: FAQSection;
}

function CollapsibleSection({ section }: CollapsibleSectionProps) {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

  const toggleQuestion = (index: number) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <View style={styles.section}>
      <AppText variant="title2" style={styles.sectionTitle}>
        {section.title}
      </AppText>
      {section.items.map((item, index) => {
        const isExpanded = expandedQuestions.has(index);
        return (
          <View key={index} style={styles.questionContainer}>
            <Pressable
              style={({ pressed }) => [styles.questionRow, pressed && styles.questionRowPressed]}
              onPress={() => toggleQuestion(index)}
            >
              <AppText variant="body" style={styles.questionText}>
                {item.question}
              </AppText>
              <AntDesign
                name={isExpanded ? "up" : "down"}
                size={16}
                color={theme.colorGrey}
                style={styles.chevron}
              />
            </Pressable>
            {isExpanded && (
              <View style={styles.answerContainer}>
                <AppText variant="body" color={theme.colorGrey}>
                  {item.answer}
                </AppText>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

export default function FAQ() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AppText variant="body" style={styles.intro}>
        Find answers to common questions about using StatLine to track your basketball games.
      </AppText>

      {FAQ_DATA.map((section, index) => (
        <CollapsibleSection key={index} section={section} />
      ))}

      <View style={styles.footer}>
        <AppText variant="caption" color={theme.colorGrey}>
          Still have questions? Reach us through the App Store.
        </AppText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colorWhite,
  },
  content: {
    padding: 24,
  },
  intro: {
    marginBottom: 24,
    color: theme.colorOnyx,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    color: theme.colorOnyx,
  },
  questionContainer: {
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: theme.colorLightGrey,
    overflow: "hidden",
  },
  questionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: theme.colorWhite,
    borderWidth: 1,
    borderColor: theme.colorLightGrey,
    borderRadius: 8,
  },
  questionRowPressed: {
    backgroundColor: theme.colorLightGrey,
  },
  questionText: {
    flex: 1,
    color: theme.colorOnyx,
    paddingRight: 8,
  },
  chevron: {
    marginLeft: 8,
  },
  answerContainer: {
    padding: 16,
    paddingTop: 12,
    backgroundColor: theme.colorLightGrey,
  },
  footer: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 48,
  },
});
