import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { COLORS } from '../../constants/theme';

let MapView: any = null;
let Marker: any = null;
try {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
} catch { /* maps not available */ }

type Props = NativeStackScreenProps<RootStackParamList, 'Map'>;

export function MapScreen({ route }: Props) {
  const { lat, lng } = route.params;
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        }
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  const targetLat = lat || userLocation?.latitude || -6.2088;
  const targetLng = lng || userLocation?.longitude || 106.8456;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  if (!MapView || mapError) {
    return (
      <View style={styles.center}>
        <Text style={{ color: COLORS.textPrimary, fontSize: 16 }}>Peta tidak tersedia</Text>
        <Text style={{ color: COLORS.textSecondary, marginTop: 8 }}>
          Lokasi: {targetLat.toFixed(4)}, {targetLng.toFixed(4)}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: targetLat,
          longitude: targetLng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation
        onMapReady={() => {}}
        onError={() => setMapError(true)}
      >
        {lat && lng && (
          <Marker
            coordinate={{ latitude: lat, longitude: lng }}
            title="Lokasi Booking"
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  center: { flex: 1, backgroundColor: COLORS.dark, justifyContent: 'center', alignItems: 'center' },
  map: { width: Dimensions.get('window').width, height: Dimensions.get('window').height },
});
