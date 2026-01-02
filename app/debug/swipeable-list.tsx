import React, { useLayoutEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import SwipeableDraggableList from '@/components/debug/SwipeableDraggableList';
import { theme } from '@/theme';

export default function SwipeableListDebugScreen() {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Swipeable Drag List Demo',
      headerStyle: {
        backgroundColor: theme.colorOrangePeel,
      },
      headerTintColor: theme.colorWhite,
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    });
  }, [navigation]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.content}>
        <SwipeableDraggableList />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colorWhite,
  },
});
