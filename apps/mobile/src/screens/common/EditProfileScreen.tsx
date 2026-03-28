import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { COLORS } from '../../constants/theme';
import { useAuthStore } from '../../stores/auth';
import api from '../../lib/api';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

export function EditProfileScreen({ navigation }: Props) {
  const { user, fetchProfile } = useAuthStore();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'Nama depan dan belakang harus diisi');
      return;
    }
    setLoading(true);
    try {
      await api.patch('/users/profile', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
      });
      await fetchProfile();
      Alert.alert('Berhasil', 'Profil berhasil diperbarui', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Gagal menyimpan profil');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    const formData = new FormData();
    formData.append('file', {
      uri: asset.uri,
      type: 'image/jpeg',
      name: 'profile.jpg',
    } as any);

    try {
      await api.post('/users/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchProfile();
      Alert.alert('Berhasil', 'Foto profil diperbarui');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Gagal upload foto');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Button title="Ganti Foto Profil" onPress={handleUploadPhoto} variant="outline" style={{ marginBottom: 24 }} />

      <Input label="Nama Depan" value={firstName} onChangeText={setFirstName} />
      <Input label="Nama Belakang" value={lastName} onChangeText={setLastName} />
      <Input label="No. Telepon" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

      <Button title="Simpan" onPress={handleSave} loading={loading} size="lg" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  scroll: { padding: 20, paddingBottom: 40 },
});
