import { Pressable } from "react-native";
import AntDesign from "@expo/vector-icons/AntDesign";
import { theme } from "@/theme";
import { Link } from "expo-router";

interface HeaderIconButtonProps {
  href: string;
  iconName: React.ComponentProps<typeof AntDesign>["name"];
  hitSlop?: number;
}

export function HeaderIconButton({ href, iconName, hitSlop = 20 }: HeaderIconButtonProps) {
  return (
    <Link href={href} asChild>
      <Pressable hitSlop={hitSlop}>
        <AntDesign name={iconName} size={24} color={theme.colorOrangePeel} />
      </Pressable>
    </Link>
  );
}
