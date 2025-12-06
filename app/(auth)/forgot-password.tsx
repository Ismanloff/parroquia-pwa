import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, CheckCircle, ChevronLeft, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword } = useAuth();
  const router = useRouter();

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa tu correo electrónico.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email.trim().toLowerCase());
      setEmailSent(true);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'No se pudo enviar el correo de recuperación.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <View className="flex-1">
        {/* Gradient Background */}
        <LinearGradient
          colors={['#84fab0', '#8fd3f4', '#a6c1ee']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute inset-0"
        />

        <SafeAreaView className="flex-1" edges={['top']}>
          <View className="flex-1 justify-center items-center px-8">
            {/* Success Icon grande - Liquid Glass effect */}
            <View
              className="rounded-full items-center justify-center mb-12"
              style={{
                width: 140,
                height: 140,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                shadowColor: '#10B981',
                shadowOffset: { width: 0, height: 16 },
                shadowOpacity: 0.4,
                shadowRadius: 32,
                elevation: 20,
              }}
            >
              <CheckCircle size={72} color="#10B981" strokeWidth={2.5} />
            </View>

            {/* Success Message - Apple typography */}
            <Text
              className="font-bold text-white text-center mb-6"
              style={{
                fontSize: 42,
                letterSpacing: -1,
                textShadowColor: 'rgba(0, 0, 0, 0.1)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 8,
              }}
            >
              Email Enviado
            </Text>
            <Text
              className="text-white/95 text-center mb-12 px-4"
              style={{
                fontSize: 19,
                lineHeight: 28,
                letterSpacing: 0.3,
              }}
            >
              Hemos enviado un enlace de recuperación a{' '}
              <Text className="font-bold">{email}</Text>
            </Text>

            {/* Instructions Card - Liquid Glass */}
            <View
              className="rounded-[32px] p-10 mb-12 w-full"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.15,
                shadowRadius: 32,
                elevation: 16,
              }}
            >
              <Text
                className="font-bold text-gray-800 mb-8"
                style={{ fontSize: 20, letterSpacing: 0.3 }}
              >
                Sigue estos pasos:
              </Text>
              <View className="mb-6 flex-row items-start">
                <Text style={{ fontSize: 36, marginRight: 16 }}>📧</Text>
                <View className="flex-1">
                  <Text
                    className="text-gray-700 font-medium"
                    style={{ fontSize: 17, lineHeight: 24, letterSpacing: 0.2 }}
                  >
                    Revisa tu bandeja de entrada
                  </Text>
                </View>
              </View>
              <View className="mb-6 flex-row items-start">
                <Text style={{ fontSize: 36, marginRight: 16 }}>🔗</Text>
                <View className="flex-1">
                  <Text
                    className="text-gray-700 font-medium"
                    style={{ fontSize: 17, lineHeight: 24, letterSpacing: 0.2 }}
                  >
                    Haz clic en el enlace del correo
                  </Text>
                </View>
              </View>
              <View className="flex-row items-start">
                <Text style={{ fontSize: 36, marginRight: 16 }}>🔐</Text>
                <View className="flex-1">
                  <Text
                    className="text-gray-700 font-medium"
                    style={{ fontSize: 17, lineHeight: 24, letterSpacing: 0.2 }}
                  >
                    Crea una nueva contraseña
                  </Text>
                </View>
              </View>
            </View>

            {/* Back to Login Button - Liquid Glass style */}
            <TouchableOpacity
              onPress={() => router.replace('/(auth)/login')}
              activeOpacity={0.8}
              className="w-full mb-6"
              style={{ minHeight: 58 }}
            >
              <LinearGradient
                colors={['#84fab0', '#8fd3f4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="rounded-[22px] flex-row items-center justify-center"
                style={{
                  paddingVertical: 20,
                  shadowColor: '#84fab0',
                  shadowOffset: { width: 0, height: 12 },
                  shadowOpacity: 0.5,
                  shadowRadius: 20,
                  elevation: 16,
                }}
              >
                <Text
                  className="text-white text-center font-bold mr-3"
                  style={{
                    fontSize: 18,
                    letterSpacing: 0.5,
                    fontWeight: '700',
                  }}
                >
                  Volver al Inicio
                </Text>
                <ArrowRight size={24} color="white" strokeWidth={3} />
              </LinearGradient>
            </TouchableOpacity>

            {/* Resend Email Link - Touch target compliant */}
            <TouchableOpacity
              onPress={() => setEmailSent(false)}
              className="rounded-[20px]"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                paddingHorizontal: 24,
                paddingVertical: 16,
                minHeight: 56,
                justifyContent: 'center',
              }}
            >
              <Text
                className="text-white font-bold"
                style={{ fontSize: 16, letterSpacing: 0.3 }}
              >
                ¿No recibiste el correo? Reenviar
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Gradient Background */}
      <LinearGradient
        colors={['#ffecd2', '#fcb69f', '#ff9a9e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />

      <SafeAreaView className="flex-1" edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View className="px-8 pt-8 pb-10">
              {/* Back Button - Touch target compliant */}
              <TouchableOpacity
                onPress={() => router.back()}
                className="rounded-[18px] items-center justify-center mb-10"
                style={{
                  width: 52,
                  height: 52,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  minWidth: 44,
                  minHeight: 44,
                }}
              >
                <ChevronLeft size={28} color="white" strokeWidth={3} />
              </TouchableOpacity>

              {/* Glass Icon Container - Liquid Glass effect */}
              <View
                className="w-24 h-24 rounded-[28px] items-center justify-center mb-8"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.15,
                  shadowRadius: 24,
                  elevation: 8,
                }}
              >
                <Text className="text-6xl">🔐</Text>
              </View>

              <Text
                className="font-bold text-white mb-4"
                style={{
                  fontSize: 52,
                  letterSpacing: -1.5,
                  textShadowColor: 'rgba(0, 0, 0, 0.1)',
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 8,
                }}
              >
                Recuperar
              </Text>
              <Text
                className="font-bold text-white mb-6"
                style={{
                  fontSize: 52,
                  letterSpacing: -1.5,
                  textShadowColor: 'rgba(0, 0, 0, 0.1)',
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 8,
                }}
              >
                Contraseña
              </Text>
              <Text
                className="text-white/90"
                style={{
                  fontSize: 19,
                  lineHeight: 28,
                  letterSpacing: 0.2,
                }}
              >
                Te enviaremos un enlace para restablecer tu contraseña
              </Text>
            </View>

            {/* Card de formulario flotante - Liquid Glass */}
            <View
              className="flex-1 rounded-t-[40px] px-8 pt-12"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.1,
                shadowRadius: 24,
                elevation: 12,
              }}
            >
              {/* Email Input grande - Apple HIG compliant */}
              <View className="mb-10">
                <Text
                  className="text-sm font-bold text-gray-700 mb-3 ml-1"
                  style={{ letterSpacing: 0.8 }}
                >
                  CORREO ELECTRÓNICO
                </Text>
                <View className="relative">
                  <View className="absolute left-5 top-1/2 -mt-3 z-10">
                    <Mail size={24} color="#ff9a9e" strokeWidth={2.5} />
                  </View>
                  <TextInput
                    className="w-full rounded-[22px] pl-16 pr-6 text-lg text-gray-900 font-medium"
                    placeholder="tu@email.com"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!loading}
                    style={{
                      backgroundColor: '#F9FAFB',
                      borderWidth: 2,
                      borderColor: '#E5E7EB',
                      paddingVertical: 20,
                      fontSize: 17,
                      minHeight: 58,
                    }}
                  />
                </View>
              </View>

              {/* Info Message - Liquid Glass card */}
              <View
                className="rounded-[26px] p-7 mb-12"
                style={{
                  backgroundColor: '#FFF7ED',
                  borderWidth: 1,
                  borderColor: '#FFEDD5',
                }}
              >
                <Text
                  className="text-gray-700"
                  style={{
                    fontSize: 16,
                    lineHeight: 24,
                    letterSpacing: 0.2,
                  }}
                >
                  💡 Ingresa el correo electrónico asociado a tu cuenta y te enviaremos
                  un enlace para restablecer tu contraseña.
                </Text>
              </View>

              {/* Send Email Button - Liquid Glass style con gradiente */}
              <TouchableOpacity
                onPress={handleResetPassword}
                disabled={loading || !email.trim()}
                activeOpacity={0.8}
                className="mb-12"
                style={{ minHeight: 58 }}
              >
                <LinearGradient
                  colors={
                    loading || !email.trim()
                      ? ['#D1D5DB', '#D1D5DB']
                      : ['#ffecd2', '#fcb69f']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="rounded-[22px] flex-row items-center justify-center"
                  style={{
                    paddingVertical: 20,
                    shadowColor: '#ff9a9e',
                    shadowOffset: { width: 0, height: 12 },
                    shadowOpacity: 0.5,
                    shadowRadius: 20,
                    elevation: 16,
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Text
                        className="text-white text-center font-bold mr-3"
                        style={{
                          fontSize: 18,
                          letterSpacing: 0.5,
                          fontWeight: '700',
                        }}
                      >
                        Enviar Enlace
                      </Text>
                      <ArrowRight size={24} color="white" strokeWidth={3} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
