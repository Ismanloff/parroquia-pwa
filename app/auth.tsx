import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import React, { useState } from 'react';
import { supabase, missingSupabaseConfigMessage } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { isSupabaseConfigured, error } = useAuth();

  if (!isSupabaseConfigured || !supabase) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100 p-6">
        <Text className="text-2xl font-bold text-center mb-4 text-gray-800">
          Configuración requerida
        </Text>
        <Text className="text-lg text-center text-gray-600">
          {error ?? missingSupabaseConfigMessage}
        </Text>
      </View>
    );
  }

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Campos requeridos', 'Por favor ingresa tu correo y contraseña.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert('Error', error.message ?? 'Ha ocurrido un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Campos requeridos', 'Por favor ingresa tu correo y contraseña.');
      return;
    }
    setLoading(true);
    try {
      const { error, data } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      if (data.session) {
        router.replace('/(tabs)/home');
      } else {
        Alert.alert('Registro iniciado', 'Revisa tu correo para confirmar la cuenta.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message ?? 'Ha ocurrido un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  // Test login for development - enters app directly without authentication
  const handleTestLogin = () => {
    router.replace('/(tabs)/home');
  };

  return (
    <View className="flex-1 justify-center items-center bg-gray-100 p-4">
      <View className="w-full max-w-sm">
        <Text className="text-3xl font-bold text-center mb-6 text-gray-800">Parroquias</Text>
        
        <TextInput
          className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 mb-4 text-lg"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 mb-6 text-lg"
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          className="bg-blue-600 rounded-lg py-3 mb-3"
          onPress={handleLogin}
          disabled={loading}
        >
          <Text className="text-white text-center text-lg font-semibold">Iniciar Sesión</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className="bg-green-600 rounded-lg py-3 mb-6"
          onPress={handleSignUp}
          disabled={loading}
        >
          <Text className="text-white text-center text-lg font-semibold">Registrarse</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="border border-gray-400 rounded-lg py-3"
          onPress={handleTestLogin}
          disabled={loading}
        >
          <Text className="text-gray-600 text-center text-lg font-semibold">Test Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AuthScreen;
