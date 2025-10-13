import { Pressable } from "react-native";
import AntDesign from "@expo/vector-icons/AntDesign";
import { theme } from "@/theme";
import { router } from "expo-router";
import { useTeamStore } from "@/store/teamStore";

interface BackToTeamButtonProps {
  hitSlop?: number;
}

export function BackToTeamButton({ hitSlop = 20 }: BackToTeamButtonProps) {
  const currentTeamId = useTeamStore(state => state.currentTeamId);

  const handlePress = () => {
    // Navigate back to the team page
    if (currentTeamId) {
      router.navigate(`/${currentTeamId}`);
    } else {
      // Fallback to home page if no team is selected
      router.navigate("/");
    }
  };

  return (
    <Pressable hitSlop={hitSlop} onPress={handlePress}>
      <AntDesign name="left" size={24} color={theme.colorOrangePeel} />
    </Pressable>
  );
}
