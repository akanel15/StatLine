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
          "Open your team and go to the Games tab. Tap New Game, enter the opponent name (and optionally add their logo), and select the period format. Tap Start Game, then select your active players.",
      },
      {
        question: "How do I record stats?",
        answer:
          'Tap the player you want to record a stat for - this will show the stat options available. Select the stat and it will appear in the play-by-play. To record an opponent stat, tap the "Opponent" button first. To record a team stat (not credited to any individual), press and hold any player on your team and then tap a stat. Once complete, you will see your stat appear in the play-by-play section.',
      },
      {
        question: "How do I start the next half or quarter?",
        answer:
          "Use the arrows in the period navigation header to move between periods. If you're viewing an earlier period, tapping next takes you to the following one. If you're in the latest period (the furthest the game has progressed), tapping next creates a new period. This also works for overtime - tap next after the final regular period to create OT1, OT2, etc.",
      },
      {
        question: "How do I end a game?",
        answer: 'Tap "Done" in the top right corner of the game screen.',
      },
      {
        question: "When does a game count for a player?",
        answer:
          "A player is only counted as having played in a game if they appear in the active players list at any point. Players who are never checked in via the substitution screen won't have that game added to their stats.",
      },
      {
        question: "What if I make a mistake recording stats?",
        answer:
          "You can always fix mistakes. Press and hold any play or period divider to drag and reorder it. Swipe left on a play to delete it. Swipe left on a period divider to delete that period (plays merge into the previous period). The first period cannot be deleted.",
      },
      {
        question: "What does the expand button do?",
        answer:
          "The expand button (top right of play-by-play) makes the play-by-play section fill most of the screen, hiding the player and set buttons temporarily. This gives you more room to review the game history. Tap again to collapse.",
      },
    ],
  },
  {
    title: "Sets and Plays",
    items: [
      {
        question: "What are sets?",
        answer:
          'Sets are play calls that are run during a game. In StatLine, sets can be used to track their effectiveness - helping answer questions like "how effective is my baseline out-of-bounds play?" by measuring stats like points, shooting percentage and assists per possession.',
      },
      {
        question: "How do I use sets during a game?",
        answer:
          "First create sets in your team's Sets tab. During a live game, tap a set from the Sets section before recording stats. The set stays active for the possession. When possession changes, the set resets and its run count increases.",
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
    ],
  },
  {
    title: "Box Score and Sharing",
    items: [
      {
        question: "How do I view the box score?",
        answer:
          "During or after a game, tap the Box Score button to see complete statistics for all players including points, rebounds, assists, and more.",
      },
      {
        question: "Can I share game stats?",
        answer:
          "Yes! Once a game is complete, open the box score and tap the Share button to generate an image. You can save it to your photos or share directly to social media and messaging apps. (Sharing is only available for completed games, not games in progress.)",
      },
      {
        question: "Can I edit stats after a game?",
        answer:
          'Yes! Tap Edit in the top right corner of a completed game, then tap "Continue Game." You can delete plays, reorder them, and add new stats. Tap Done when finished.',
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
