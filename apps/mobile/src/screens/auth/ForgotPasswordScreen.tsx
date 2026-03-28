import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { COLORS } from '../../constants/theme';
import api from '../../lib/api';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Masukkan email Anda');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSent(true);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Gagal mengirim email reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Lupa Password</Text>

        {sent ? (
          <>
            <Text style={styles.successText}>
              Link reset password telah dikirim ke {email}. Silahkan cek inbox email Anda.
            </Text>
            <Button title="Kembali ke Login" onPress={() => navigation.goBack()} variant="outline" />
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>
              Masukkan email yang terdaftar, kami akan mengirimkan link reset password.
            </Text>
            <Input
              label="Email"
              placeholder="email@contoh.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Button title="Kirim Reset Link" onPress={handleSubmit} loading={loading} />
            <Button
              title="Kembali"
              onPress={() => navigation.goBack()}
              variant="outline"
              style={{ marginTop: 12 }}
            />
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 24, lineHeight: 20 },
  successText: { fontSize: 15, color: COLORS.success, marginBottom: 24, lineHeight: 22 },
});
