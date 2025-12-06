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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Campos requeridos', 'Por favor ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert(
        'Error al iniciar sesión',
        error.message || 'Verifica tus credenciales e intenta de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView className="flex-1" edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header minimalista y profesional */}
            <View className="pt-12 pb-8 items-center">
              {/* Icono de la iglesia - Simple y elegante */}
              <View
                className="w-20 h-20 rounded-full items-center justify-center mb-6"
                style={{
                  backgroundColor: '#FFFFFF',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.08,
                  shadowRadius: 12,
                  elevation: 6,
                }}
              >
                <Text style={{ fontSize: 40 }}>⛪</Text>
              </View>

              <Text
                className="text-3xl font-bold text-gray-900 mb-2"
                style={{
                  letterSpacing: -0.5,
                  textAlign: 'center',
                }}
              >
                Bienvenido
              </Text>
              <Text
                className="text-base text-gray-500"
                style={{ letterSpacing: 0.2, textAlign: 'center' }}
              >
                Inicia sesión en tu cuenta
              </Text>
            </View>

            {/* Formulario - Diseño limpio iOS style */}
            <View className="flex-1">
              {/* Email Input - iOS style limpio */}
              <View className="mb-4">
                <Text
                  className="text-sm font-semibold text-gray-600 mb-2"
                  style={{ letterSpacing: 0.3 }}
                >
                  CORREO ELECTRÓNICO
                </Text>
                <View className="relative">
                  <View className="absolute left-4 top-1/2 -mt-3 z-10">
                    <Mail size={20} color="#3B82F6" strokeWidth={2.5} />
                  </View>
                  <TextInput
                    className="w-full rounded-2xl pl-14 pr-4 text-base text-gray-900"
                    placeholder="tu@email.com"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!loading}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1.5,
                      borderColor: '#E5E7EB',
                      paddingVertical: 16,
                      fontSize: 16,
                      minHeight: 54,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  />
                </View>
              </View>

              {/* Password Input - iOS style limpio */}
              <View className="mb-4">
                <Text
                  className="text-sm font-semibold text-gray-600 mb-2"
                  style={{ letterSpacing: 0.3 }}
                >
                  CONTRASEÑA
                </Text>
                <View className="relative">
                  <View className="absolute left-4 top-1/2 -mt-3 z-10">
                    <Lock size={20} color="#3B82F6" strokeWidth={2.5} />
                  </View>
                  <TextInput
                    className="w-full rounded-2xl pl-14 pr-14 text-base text-gray-900"
                    placeholder="••••••••"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    editable={!loading}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1.5,
                      borderColor: '#E5E7EB',
                      paddingVertical: 16,
                      fontSize: 16,
                      minHeight: 54,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -mt-3"
                    disabled={loading}
                    style={{ minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' }}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="#9CA3AF" strokeWidth={2.5} />
                    ) : (
                      <Eye size={20} color="#9CA3AF" strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot Password Link - Minimalista */}
              <View className="items-end mb-6">
                <Link href="/(auth)/forgot-password" asChild>
                  <TouchableOpacity
                    disabled={loading}
                    style={{ minHeight: 44, justifyContent: 'center' }}
                  >
                    <Text
                      className="text-sm font-semibold text-blue-600"
                      style={{ fontSize: 14, letterSpacing: 0.2 }}
                    >
                      ¿Olvidaste tu contraseña?
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>

              {/* Login Button - Diseño moderno y limpio */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading || !email.trim() || !password}
                activeOpacity={0.7}
                style={{
                  backgroundColor: loading || !email.trim() || !password ? '#D1D5DB' : '#3B82F6',
                  borderRadius: 16,
                  paddingVertical: 18,
                  minHeight: 56,
                  shadowColor: '#3B82F6',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: loading || !email.trim() || !password ? 0 : 0.3,
                  shadowRadius: 8,
                  elevation: loading || !email.trim() || !password ? 0 : 4,
                }}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontSize: 17,
                      letterSpacing: 0.3,
                      fontWeight: '600',
                      textAlign: 'center',
                    }}
                  >
                    Iniciar Sesión
                  </Text>
                )}
              </TouchableOpacity>

              {/* Divider - Minimalista */}
              <View className="flex-row items-center my-8">
                <View className="flex-1 h-px bg-gray-200" />
                <Text
                  className="mx-4 text-gray-400 font-medium"
                  style={{ fontSize: 13, letterSpacing: 0.3 }}
                >
                  o continúa con
                </Text>
                <View className="flex-1 h-px bg-gray-200" />
              </View>

              {/* Sign Up Link - Diseño limpio */}
              <View className="items-center mb-8">
                <Link href="/(auth)/register" asChild>
                  <TouchableOpacity
                    disabled={loading}
                    style={{
                      backgroundColor: '#FFFFFF',
                      paddingHorizontal: 24,
                      paddingVertical: 16,
                      borderWidth: 1.5,
                      borderColor: '#E5E7EB',
                      minHeight: 54,
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderRadius: 16,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    <Text
                      style={{
                        color: '#3B82F6',
                        fontSize: 16,
                        letterSpacing: 0.3,
                        fontWeight: '600',
                      }}
                    >
                      Crear Cuenta Nueva
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
