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
import { Link, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, ChevronLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    if (!email.trim() || !password || !fullName.trim()) {
      Alert.alert('Campos requeridos', 'Por favor completa los campos obligatorios.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Contraseña débil', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await signUp(email.trim().toLowerCase(), password, fullName.trim(), phone.trim());
      Alert.alert(
        'Registro exitoso',
        'Tu cuenta ha sido creada. Ya puedes iniciar sesión.',
        [
          {
            text: 'Iniciar Sesión',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Error al registrarse',
        error.message || 'No se pudo crear la cuenta. Intenta de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1">
      {/* Gradient Background */}
      <LinearGradient
        colors={['#a8edea', '#fed6e3', '#f093fb']}
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
                <Text className="text-6xl">✨</Text>
              </View>

              <Text
                className="text-6xl font-bold text-white mb-4"
                style={{
                  letterSpacing: -1.5,
                  textShadowColor: 'rgba(0, 0, 0, 0.1)',
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 8,
                }}
              >
                Crear Cuenta
              </Text>
              <Text
                className="text-xl text-white/90"
                style={{ letterSpacing: 0.2 }}
              >
                Únete a nuestra comunidad
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
              {/* Full Name Input - Apple HIG compliant */}
              <View className="mb-6">
                <Text
                  className="text-sm font-bold text-gray-700 mb-3 ml-1"
                  style={{ letterSpacing: 0.8 }}
                >
                  NOMBRE COMPLETO *
                </Text>
                <View className="relative">
                  <View className="absolute left-5 top-1/2 -mt-3 z-10">
                    <User size={24} color="#f093fb" strokeWidth={2.5} />
                  </View>
                  <TextInput
                    className="w-full rounded-[22px] pl-16 pr-6 text-lg text-gray-900 font-medium"
                    placeholder="Juan Pérez"
                    placeholderTextColor="#9CA3AF"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
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

              {/* Email Input - Apple HIG compliant */}
              <View className="mb-6">
                <Text
                  className="text-sm font-bold text-gray-700 mb-3 ml-1"
                  style={{ letterSpacing: 0.8 }}
                >
                  CORREO ELECTRÓNICO *
                </Text>
                <View className="relative">
                  <View className="absolute left-5 top-1/2 -mt-3 z-10">
                    <Mail size={24} color="#f093fb" strokeWidth={2.5} />
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

              {/* Phone Input - Apple HIG compliant */}
              <View className="mb-6">
                <Text
                  className="text-sm font-bold text-gray-700 mb-3 ml-1"
                  style={{ letterSpacing: 0.8 }}
                >
                  TELÉFONO (opcional)
                </Text>
                <View className="relative">
                  <View className="absolute left-5 top-1/2 -mt-3 z-10">
                    <Phone size={24} color="#f093fb" strokeWidth={2.5} />
                  </View>
                  <TextInput
                    className="w-full rounded-[22px] pl-16 pr-6 text-lg text-gray-900 font-medium"
                    placeholder="+34 666 777 888"
                    placeholderTextColor="#9CA3AF"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
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

              {/* Password Input - Apple HIG compliant */}
              <View className="mb-6">
                <Text
                  className="text-sm font-bold text-gray-700 mb-3 ml-1"
                  style={{ letterSpacing: 0.8 }}
                >
                  CONTRASEÑA *
                </Text>
                <View className="relative">
                  <View className="absolute left-5 top-1/2 -mt-3 z-10">
                    <Lock size={24} color="#f093fb" strokeWidth={2.5} />
                  </View>
                  <TextInput
                    className="w-full rounded-[22px] pl-16 pr-20 text-lg text-gray-900 font-medium"
                    placeholder="Mínimo 6 caracteres"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
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
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -mt-3"
                    disabled={loading}
                    style={{ minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' }}
                  >
                    {showPassword ? (
                      <EyeOff size={24} color="#9CA3AF" strokeWidth={2.5} />
                    ) : (
                      <Eye size={24} color="#9CA3AF" strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password Input - Apple HIG compliant */}
              <View className="mb-10">
                <Text
                  className="text-sm font-bold text-gray-700 mb-3 ml-1"
                  style={{ letterSpacing: 0.8 }}
                >
                  CONFIRMAR CONTRASEÑA *
                </Text>
                <View className="relative">
                  <View className="absolute left-5 top-1/2 -mt-3 z-10">
                    <Lock size={24} color="#f093fb" strokeWidth={2.5} />
                  </View>
                  <TextInput
                    className="w-full rounded-[22px] pl-16 pr-20 text-lg text-gray-900 font-medium"
                    placeholder="Repite la contraseña"
                    placeholderTextColor="#9CA3AF"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
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
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-5 top-1/2 -mt-3"
                    disabled={loading}
                    style={{ minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' }}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={24} color="#9CA3AF" strokeWidth={2.5} />
                    ) : (
                      <Eye size={24} color="#9CA3AF" strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Register Button - Liquid Glass style con gradiente */}
              <TouchableOpacity
                onPress={handleRegister}
                disabled={loading || !email.trim() || !password || !fullName.trim()}
                activeOpacity={0.8}
                className="mb-8"
                style={{ minHeight: 58 }}
              >
                <LinearGradient
                  colors={
                    loading || !email.trim() || !password || !fullName.trim()
                      ? ['#D1D5DB', '#D1D5DB']
                      : ['#a8edea', '#fed6e3']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="rounded-[22px] flex-row items-center justify-center"
                  style={{
                    paddingVertical: 20,
                    shadowColor: '#f093fb',
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
                        Crear Cuenta
                      </Text>
                      <ArrowRight size={24} color="white" strokeWidth={3} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Terms Text - Apple typography */}
              <Text
                className="text-center text-gray-500 px-4 mb-10"
                style={{ fontSize: 14, lineHeight: 20, letterSpacing: 0.1 }}
              >
                Al registrarte, aceptas nuestros{' '}
                <Text className="font-bold text-purple-600">Términos de Servicio</Text>
                {' '}y{' '}
                <Text className="font-bold text-purple-600">Política de Privacidad</Text>
              </Text>

              {/* Login Link - Touch target compliant */}
              <View className="items-center pb-12">
                <Text
                  className="text-gray-600 mb-5"
                  style={{ fontSize: 17, letterSpacing: 0.2 }}
                >
                  ¿Ya tienes cuenta?
                </Text>
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity
                    disabled={loading}
                    className="rounded-[20px]"
                    style={{
                      backgroundColor: '#F9FAFB',
                      paddingHorizontal: 32,
                      paddingVertical: 16,
                      borderWidth: 2,
                      borderColor: '#E9D5FF',
                      minHeight: 56,
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      className="font-bold text-purple-600"
                      style={{ fontSize: 17, letterSpacing: 0.3 }}
                    >
                      Iniciar Sesión
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
