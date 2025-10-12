// import { TeamCard } from "@/components/TeamCard";
// import { theme } from "@/theme";
// import { FlatList, StyleSheet } from "react-native";
// import { StatLineButton } from "@/components/StatLineButton";
// import { useGameStore } from "@/store/gameStore";
// import { usePlayerStore } from "@/store/playerStore";
// import { useTeamStore } from "@/store/teamStore";

// export default function App() {
//   const initialStoreState = {
//     teams: {}, // Empty games object
//   };
//   const handlePress = () => {
//     useTeamStore.setState(initialStoreState);
//   };

//   return (
//     <FlatList
//       style={styles.container}
//       contentContainerStyle={styles.contentContainer}
//       data={[]}
//       renderItem={({ item }) => <TeamCard team={item}></TeamCard>}
//       ListEmptyComponent={
//         <StatLineButton
//           title="reset team store"
//           onPress={handlePress}
//         ></StatLineButton>
//       }
//     ></FlatList>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: theme.colorWhite,
//   },
//   contentContainer: {
//     padding: 12,
//     shadowColor: theme.colorBlack,
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,

//     elevation: 5,
//   },
// });
