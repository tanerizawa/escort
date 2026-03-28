import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { COLORS } from '../../constants/theme';
import api from '../../lib/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Review'>;

export function ReviewScreen({ route, navigation }: Props) {
  const { bookingId, revieweeName } = route.params;
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [attitude, setAttitude] = useState(5);
  const [punctuality, setPunctuality] = useState(5);
  const [professionalism, setProfessionalism] = useState(5);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post('/reviews', {
        bookingId,
        rating,
        comment: comment.trim() || undefined,
        attitudeScore: attitude,
        punctualityScore: punctuality,
        professionalismScore: professionalism,
      });
      Alert.alert('Berhasil', 'Review berhasil dikirim!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Gagal mengirim review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>Review untuk {revieweeName}</Text>

      <Text style={styles.label}>Rating Keseluruhan</Text>
      <StarRow value={rating} onChange={setRating} />

      <Text style={styles.label}>Sikap</Text>
      <StarRow value={attitude} onChange={setAttitude} />

      <Text style={styles.label}>Ketepatan Waktu</Text>
      <StarRow value={punctuality} onChange={setPunctuality} />

      <Text style={styles.label}>Profesionalisme</Text>
      <StarRow value={professionalism} onChange={setProfessionalism} />

      <Input
        label="Komentar (opsional)"
        placeholder="Bagikan pengalaman Anda..."
        value={comment}
        onChangeText={setComment}
        multiline
        style={{ minHeight: 80, textAlignVertical: 'top' }}
      />

      <Button title="Kirim Review" onPress={handleSubmit} loading={loading} size="lg" />
    </View>
  );
}

function StarRow({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={starStyles.row}>
      {[1, 2, 3, 4, 5].map((s) => (
        <TouchableOpacity key={s} onPress={() => onChange(s)}>
          <Ionicons
            name={s <= value ? 'star' : 'star-outline'}
            size={32}
            color={COLORS.gold}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const starStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, marginBottom: 16 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark, padding: 20 },
  subtitle: { fontSize: 16, color: COLORS.textSecondary, marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary, marginBottom: 6 },
});
