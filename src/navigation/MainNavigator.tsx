import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardScreen } from '@components/DashboardScreen';
import { CorridorsList } from '@components/CorridorsList';
import { AnchorsList } from '@components/AnchorsList';
import { SettingsScreen } from '@screens/main/SettingsScreen';
import { CorridorDetail } from '@components/CorridorDetail';
import { AnchorDetail } from '@components/AnchorDetail';
import { PreflightCheck } from '@components/PreflightCheck';

export type CorridorsStackParamList = {
  CorridorsList: undefined;
  CorridorDetail: {
    corridorId: string;
  };
};

export type AnchorsStackParamList = {
  AnchorsList: undefined;
  AnchorDetail: {
    anchorId: string;
  };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Corridors: undefined;
  Check: undefined;
  Anchors: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const CorridorsStack = createNativeStackNavigator<CorridorsStackParamList>();
const AnchorsStack = createNativeStackNavigator<AnchorsStackParamList>();

function CorridorsNavigator() {
  return (
    <CorridorsStack.Navigator>
      <CorridorsStack.Screen
        name="CorridorsList"
        component={CorridorsList}
        options={{ title: 'Corridors', headerShown: false }}
      />
      <CorridorsStack.Screen
        name="CorridorDetail"
        component={CorridorDetail}
        options={{ title: 'Corridor Detail' }}
      />
    </CorridorsStack.Navigator>
  );
}

function AnchorsNavigator() {
  return (
    <AnchorsStack.Navigator>
      <AnchorsStack.Screen
        name="AnchorsList"
        component={AnchorsList}
        options={{ title: 'Anchors', headerShown: false }}
      />
      <AnchorsStack.Screen
        name="AnchorDetail"
        component={AnchorDetail}
        options={{ title: 'Anchor Detail' }}
      />
    </AnchorsStack.Navigator>
  );
}

export function MainNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: true }}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen
        name="Corridors"
        component={CorridorsNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Check"
        component={PreflightCheck}
        options={{ title: 'Check a payment', tabBarLabel: 'Check' }}
      />
      <Tab.Screen name="Anchors" component={AnchorsNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
