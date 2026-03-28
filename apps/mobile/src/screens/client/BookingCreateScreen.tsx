import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform,
} from 'react-native';
import Animated, { FadeInRight, FadeOutLeft, FadeInDown, SlideInRight, SlideOutLeft,
  useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { GradientButton } from '../../components/ui/GradientButton';
import { AnimatedCounter } from '../../components/ui/AnimatedCounter';
import { StepProgress } from '../../components/ui/ProgressBar';
import { Input } from '../../components/Input';
import { COLORS, SPACING, RADIUS, SHADOWS, SERVICE_TYPES, GRADIENTS, ANIMATION } from '../../constants/theme';
import { ServiceType } from '../../constants/types';
import { useHaptic } from '../../hooks/useHaptic';
import api from '../../lib/api';
import Toast from 'react-native-toast-message';
import dayjs from 'dayjs';

type Props = NativeStackScreenProps<RootStackParamList, 'BookingCreate'>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ServiceCard({ st, selected, onPress }: { st: typeof SERVICE_TYPES[number]; selected: boolean; onPress: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.94, ANIMATION.springBouncy); }}
      onPressOut={() => { scale.value = withSpring(1, ANIMATION.springSmooth); }}
      style={[styles.serviceCard, selected && styles.serviceCardActive, animStyle]}
    >
      <View style={[styles.serviceIconWrap, selected && { backgroundColor: COLORS.gold + '20' }]}>
        <Ionicons name={st.icon as any} size={24} color={selected ? COLORS.gold : COLORS.textMuted} />
      </View>
      <Text style={[styles.serviceText, selected && styles.serviceTextActive]}>{st.label}</Text>
      {selected && <Ionicons name="checkmark-circle" size={18} color={COLORS.gold} style={{ position: 'absolute', top: 8, right: 8 }} />}
    </AnimatedPressable>
  );
}

export function BookingCreateScreen({ route, navigation }: Props) {
  const { escortId, escortName, hourlyRate } = route.params;
  const [step, setStep] = useState(1);
  const [serviceType, setServiceType] = useState<ServiceType>('DINNER');
  const [date, setDate] = useState('');
  const [startHour, setStartHour] = useState('');
  const [duration, setDuration] = useState('3');
  const [location, setLocation] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const { selection, success: hapticSuccess } = useHaptic();

  const estimatedTotal = hourlyRate * (parseInt(duration) || 0);

  const canNext = useCallback(() => {
    if (step === 1) return true;
    if (step === 2) return !!date && !!startHour && parseInt(duration) > 0;
    if (step === 3) return !!location.trim();
    return true;
  }, [step, date, startHour, duration, location]);

  const handleNext = () => {
    if (step < 4) { selection(); setStep(step + 1); }
  };
  const handleBack = () => {
    if (step > 1) { selection(); setStep(step - 1); }
  };

  const handleCreate = async () => {
    if (!date || !startHour || !location.trim()) {
      Toast.show({ type: 'error', text1: 'Lengkapi semua field yang diperlukan' });
      return;
    }
    const durationNum = parseInt(duration);
    if (!durationNum || durationNum < 1 || durationNum > 24) {
      Toast.show({ type: 'error', text1: 'Durasi harus antara 1-24 jam' });
      return;
    }

    const startTime = dayjs(`${date} ${startHour}`, 'YYYY-MM-DD HH:mm').toISOString();
    const endTime = dayjs(`${date} ${startHour}`, 'YYYY-MM-DD HH:mm').add(durationNum, 'hour').toISOString();

    setLoading(true);
    try {
      const { data } = await api.post('/bookings', {
        escortId, serviceType, startTime, endTime,
        location: location.trim(),
        specialRequests: specialRequests.trim() || undefined,
      });
      const booking = data.data;
      hapticSuccess();
      setSuccess(true);
      setTimeout(() => {
        navigation.replace('Payment', { bookingId: booking.id, amount: booking.totalAmount });
      }, 1500);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err?.response?.data?.message || 'Gagal membuat booking' });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={styles.successContainer}>
        <Animated.View entering={FadeInDown.springify()} style={styles.successContent}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={72} color={COLORS.gold} />
          </View>
          <Text style={styles.successTitle}>Booking Berhasil! 🎉</Text>
          <Text style={styles.successSub}>Mengarahkan ke pembayaran...</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Step Indicator */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.stepWrap}>
          <StepProgress total={4} current={step} />
          <View style={styles.stepLabels}>
            {['Layanan', 'Waktu', 'Lokasi', 'Review'].map((l, i) => (
              <Pressable key={l} onPress={() => i + 1 < step && setStep(i + 1)}>
                <Text style={[styles.stepLabel, step >= i + 1 && styles.stepActive]}>{l}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Escort Info Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.escortCard}>
          <View style={styles.escortIcon}>
            <Ionicons name="person" size={22} color={COLORS.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.escortName}>{escortName}</Text>
            <Text style={styles.escortRate}>Rp {hourlyRate.toLocaleString('id-ID')}/jam</Text>
          </View>
        </Animated.View>

        {/* Step 1: Service Type */}
        {step === 1 && (
          <Animated.View key="step1" entering={SlideInRight.duration(300)} exiting={SlideOutLeft.duration(200)}>
            <Text style={styles.label}>Pilih Tipe Layanan</Text>
            <View style={styles.serviceGrid}>
              {SERVICE_TYPES.map((st) => (
                <ServiceCard key={st.value} st={st} selected={serviceType === st.value}
                  onPress={() => { setServiceType(st.value as ServiceType); selection(); }} />
              ))}
            </View>
          </Animated.View>
        )}

        {/* Step 2: Date & Time */}
        {step === 2 && (
          <Animated.View key="step2" entering={SlideInRight.duration(300)} exiting={SlideOutLeft.duration(200)}>
            <Pressable onPress={() => setShowDatePicker(true)}>
              <View pointerEvents="none">
                <Input label="Tanggal" placeholder="Pilih tanggal" value={date ? dayjs(date).format('DD MMMM YYYY') : ''} icon="calendar-outline" editable={false} />
              </View>
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={new Date()}
                onChange={(event: DateTimePickerEvent, chosen?: Date) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (event.type === 'set' && chosen) {
                    setSelectedDate(chosen);
                    setDate(dayjs(chosen).format('YYYY-MM-DD'));
                  }
                }}
              />
            )}
            <Pressable onPress={() => setShowTimePicker(true)}>
              <View pointerEvents="none">
                <Input label="Jam Mulai" placeholder="Pilih jam" value={startHour ? startHour : ''} icon="time-outline" editable={false} />
              </View>
            </Pressable>
            {showTimePicker && (
              <DateTimePicker
                value={selectedTime}
                mode="time"
                is24Hour={true}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event: DateTimePickerEvent, chosen?: Date) => {
                  setShowTimePicker(Platform.OS === 'ios');
                  if (event.type === 'set' && chosen) {
                    setSelectedTime(chosen);
                    setStartHour(dayjs(chosen).format('HH:mm'));
                  }
                }}
              />
            )}
            <Input label="Durasi (jam)" placeholder="3" value={duration} onChangeText={setDuration} keyboardType="number-pad" icon="hourglass-outline" />
          </Animated.View>
        )}

        {/* Step 3: Location & Requests */}
        {step === 3 && (
          <Animated.View key="step3" entering={SlideInRight.duration(300)} exiting={SlideOutLeft.duration(200)}>
            <Input label="Lokasi" placeholder="Nama restoran, hotel, dll." value={location} onChangeText={setLocation} icon="location-outline" />
            <Input
              label="Permintaan Khusus (opsional)"
              placeholder="Alergi makanan, dress code, dll."
              value={specialRequests}
              onChangeText={setSpecialRequests}
              multiline
              style={{ minHeight: 80, textAlignVertical: 'top' }}
              icon="chatbox-outline"
            />
          </Animated.View>
        )}

        {/* Step 4: Review & Confirm */}
        {step === 4 && (
          <Animated.View key="step4" entering={SlideInRight.duration(300)} exiting={SlideOutLeft.duration(200)}>
            <LinearGradient colors={[COLORS.darkCard, COLORS.darkElevated]} style={styles.summary}>
              <Text style={styles.summaryTitle}>
                <Ionicons name="receipt-outline" size={14} color={COLORS.gold} /> Ringkasan Booking
              </Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Layanan</Text>
                <Text style={styles.summaryVal2}>{SERVICE_TYPES.find(s => s.value === serviceType)?.label}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tanggal</Text>
                <Text style={styles.summaryVal2}>{date} {startHour}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Durasi</Text>
                <Text style={styles.summaryVal2}>{duration} jam</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Lokasi</Text>
                <Text style={styles.summaryVal2} numberOfLines={1}>{location}</Text>
              </View>
              {specialRequests ? (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Catatan</Text>
                  <Text style={styles.summaryVal2} numberOfLines={2}>{specialRequests}</Text>
                </View>
              ) : null}
              <View style={[styles.summaryRow, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.gold + '20' }]}>
                <Text style={[styles.summaryLabel, { fontWeight: '700', color: COLORS.textPrimary }]}>Total Estimasi</Text>
                <AnimatedCounter value={estimatedTotal} prefix="Rp " formatter={(v) => Math.floor(v).toLocaleString('id-ID')} style={styles.summaryValGold} />
              </View>
            </LinearGradient>
          </Animated.View>
        )}
      </ScrollView>

      {/* Bottom Navigation Buttons */}
      <View style={styles.bottomBar}>
        {step > 1 && (
          <Pressable onPress={handleBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={COLORS.textSecondary} />
            <Text style={styles.backText}>Kembali</Text>
          </Pressable>
        )}
        <View style={{ flex: 1 }}>
          {step < 4 ? (
            <GradientButton title="Lanjut" onPress={handleNext} disabled={!canNext()} size="lg" />
          ) : (
            <GradientButton title="Buat Booking" onPress={handleCreate} loading={loading} size="lg" />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  scroll: { padding: SPACING.base, paddingBottom: 100 },
  stepWrap: { marginBottom: SPACING.lg },
  stepLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  stepLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600' },
  stepActive: { color: COLORS.gold },
  escortCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.darkCard,
    padding: SPACING.base,
    borderRadius: RADIUS.lg,
    gap: 12,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    ...SHADOWS.sm,
  },
  escortIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.gold + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  escortName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  escortRate: { fontSize: 14, color: COLORS.gold, fontWeight: '600', marginTop: 2 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 12, letterSpacing: 0.3 },
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: SPACING.lg },
  serviceCard: {
    width: '47%',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.darkCard,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  serviceCardActive: {
    borderColor: COLORS.gold,
    backgroundColor: COLORS.gold + '10',
    ...SHADOWS.gold,
  },
  serviceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.darkElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },
  serviceTextActive: { color: COLORS.gold, fontWeight: '700' },
  summary: {
    padding: SPACING.base,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.gold + '30',
  },
  summaryTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  summaryLabel: { fontSize: 14, color: COLORS.textSecondary },
  summaryVal2: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '600', maxWidth: '55%', textAlign: 'right' },
  summaryValGold: { fontSize: 20, fontWeight: '800', color: COLORS.gold },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.darkBorder,
    backgroundColor: COLORS.darkCard,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 4 },
  backText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
  successContainer: { flex: 1, backgroundColor: COLORS.dark, alignItems: 'center', justifyContent: 'center' },
  successContent: { alignItems: 'center', gap: 12 },
  successIcon: { marginBottom: 8 },
  successTitle: { fontSize: 24, fontWeight: '800', color: COLORS.gold },
  successSub: { fontSize: 14, color: COLORS.textSecondary },
});
