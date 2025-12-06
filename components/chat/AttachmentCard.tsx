import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking, Alert, Clipboard, Platform, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Directory, File as FileSystemFile, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  FileText,
  ExternalLink,
  Image as ImageIcon,
  File as FileIcon,
  Link as LinkIcon,
  Copy,
  CheckCircle,
  Download,
} from 'lucide-react-native';
import type { Attachment } from '@/types/chat';
import Constants from 'expo-constants';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE || Constants.expoConfig?.extra?.apiBase;

type AttachmentCardProps = {
  attachment: Attachment;
};

type AttachmentState = 'idle' | 'opening' | 'downloading' | 'error';

export const AttachmentCard: React.FC<AttachmentCardProps> = ({ attachment }) => {
  const [state, setState] = useState<AttachmentState>('idle');
  const [justCopied, setJustCopied] = useState(false);

  // Convertir URLs relativas a absolutas
  const getFinalUrl = () => {
    let finalUrl = attachment.url;
    if (finalUrl.startsWith('/')) {
      finalUrl = `${API_BASE}${finalUrl}`;
    }
    return finalUrl;
  };

  // Obtener ícono según tipo
  const getIcon = () => {
    const iconProps = { size: 20, strokeWidth: 2 };

    switch (attachment.type) {
      case 'pdf':
        return <FileText {...iconProps} color="#DC2626" />; // Rojo para PDF
      case 'url':
        return <ExternalLink {...iconProps} color="#2563EB" />; // Azul para enlaces
      case 'image':
        return <ImageIcon {...iconProps} color="#059669" />; // Verde para imágenes
      default:
        return <FileIcon {...iconProps} color="#6B7280" />; // Gris para otros
    }
  };

  // Obtener texto del tipo
  const getTypeLabel = () => {
    switch (attachment.type) {
      case 'pdf':
        return 'PDF';
      case 'url':
        return 'Enlace';
      case 'image':
        return 'Imagen';
      default:
        return 'Archivo';
    }
  };

  // Descargar archivo
  const handleDownload = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const finalUrl = getFinalUrl();
    console.log('📥 Descargando:', finalUrl);

    setState('downloading');

    try {
      // Crear carpeta de descargas si no existe
      const downloadsDir = new Directory(Paths.document, 'downloads');
      await downloadsDir.create();

      console.log('📁 Carpeta de descargas:', downloadsDir.uri);

      // Descargar archivo
      const result = await FileSystemFile.downloadFileAsync(finalUrl, downloadsDir);

      console.log('✅ Archivo descargado:', result.uri);

      setState('idle');

      // Compartir/Abrir el archivo descargado
      const canShare = await Sharing.isAvailableAsync();

      if (canShare) {
        await Sharing.shareAsync(result.uri, {
          mimeType: attachment.type === 'pdf' ? 'application/pdf' : undefined,
          dialogTitle: attachment.title,
        });
      } else {
        Alert.alert(
          'Descarga completa',
          `El archivo se guardó correctamente`,
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('❌ Error al descargar:', error);
      setState('error');

      Alert.alert(
        'Error al descargar',
        `No se pudo descargar el archivo: ${error.message}`,
        [{ text: 'OK', onPress: () => setState('idle') }]
      );
    }
  };

  // Abrir en navegador
  const handleOpenInBrowser = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const finalUrl = getFinalUrl();
    console.log('📎 Abriendo en navegador:', finalUrl);

    setState('opening');

    try {
      const canOpen = await Linking.canOpenURL(finalUrl);

      if (!canOpen) {
        throw new Error('No se puede abrir este tipo de enlace');
      }

      await Linking.openURL(finalUrl);
      setState('idle');
    } catch (error: any) {
      console.error('❌ Error al abrir enlace:', error);
      setState('error');

      Alert.alert(
        'Error al abrir',
        `No se pudo abrir el enlace: ${error.message}`,
        [{ text: 'OK', onPress: () => setState('idle') }]
      );
    }
  };

  // Manejar tap según el tipo
  const handleTap = async () => {
    // PDF → Mostrar opciones
    if (attachment.type === 'pdf') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      Alert.alert(
        attachment.title,
        '¿Qué deseas hacer con este PDF?',
        [
          {
            text: 'Ver en navegador',
            onPress: handleOpenInBrowser,
          },
          {
            text: 'Descargar',
            onPress: handleDownload,
          },
          {
            text: 'Cancelar',
            style: 'cancel',
          },
        ]
      );
    } else {
      // URL/Otros → Abrir directamente
      await handleOpenInBrowser();
    }
  };

  // Copiar enlace al portapapeles
  const handleCopyLink = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const finalUrl = getFinalUrl();
    Clipboard.setString(finalUrl);

    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 2000);

    if (Platform.OS === 'ios') {
      Alert.alert('Copiado', 'Enlace copiado al portapapeles', [{ text: 'OK' }]);
    }
  };

  // Long press para mostrar opciones
  const handleLongPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const options: any[] = [
      {
        text: 'Abrir en navegador',
        onPress: handleOpenInBrowser,
      },
      {
        text: 'Copiar enlace',
        onPress: handleCopyLink,
      },
    ];

    // Agregar opción de descarga para PDFs
    if (attachment.type === 'pdf') {
      options.unshift({
        text: 'Descargar',
        onPress: handleDownload,
      });
    }

    options.push({
      text: 'Cancelar',
      style: 'cancel',
    });

    Alert.alert(attachment.title, `Opciones para este ${getTypeLabel().toLowerCase()}`, options);
  };

  const isLoading = state === 'opening' || state === 'downloading';
  const isError = state === 'error';

  return (
    <TouchableOpacity
      onPress={handleTap}
      onLongPress={handleLongPress}
      disabled={isLoading}
      className={`bg-gray-50 border rounded-2xl p-3 flex-row items-center ${
        isError ? 'border-red-300 bg-red-50' : 'border-gray-200'
      }`}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${getTypeLabel()}: ${attachment.title}. ${
        attachment.type === 'pdf' ? 'Toca para elegir ver o descargar' : 'Toca para abrir'
      }`}
      accessibilityHint={`Mantén presionado para más opciones.`}
      accessibilityState={{ disabled: isLoading }}
    >
      {/* Ícono del tipo de archivo */}
      <View className="mr-3">
        {getIcon()}
      </View>

      {/* Contenido */}
      <View className="flex-1">
        <View className="flex-row items-center mb-1">
          <Text
            className={`font-semibold flex-1 ${isError ? 'text-red-700' : 'text-gray-900'}`}
            style={{ fontSize: 14, lineHeight: 18 }}
            numberOfLines={1}
          >
            {attachment.title}
          </Text>

          {/* Badge del tipo */}
          <View className={`px-2 py-0.5 rounded-full ml-2 ${
            attachment.type === 'pdf' ? 'bg-red-100' : 'bg-blue-100'
          }`}>
            <Text
              className={`text-xs font-medium ${
                attachment.type === 'pdf' ? 'text-red-700' : 'text-blue-700'
              }`}
              style={{ fontSize: 10 }}
            >
              {getTypeLabel()}
            </Text>
          </View>
        </View>

        {attachment.description && (
          <Text
            className={`${isError ? 'text-red-600' : 'text-gray-500'}`}
            style={{ fontSize: 12, lineHeight: 16 }}
            numberOfLines={2}
          >
            {attachment.description}
          </Text>
        )}

        {/* Estados */}
        {state === 'opening' && (
          <Text className="text-blue-600 text-xs mt-1" style={{ fontSize: 11 }}>
            Abriendo...
          </Text>
        )}
        {state === 'downloading' && (
          <Text className="text-blue-600 text-xs mt-1" style={{ fontSize: 11 }}>
            Descargando...
          </Text>
        )}
        {isError && (
          <Text className="text-red-600 text-xs mt-1" style={{ fontSize: 11 }}>
            Error
          </Text>
        )}
        {justCopied && (
          <View className="flex-row items-center mt-1">
            <CheckCircle size={12} color="#059669" strokeWidth={2} />
            <Text className="text-green-600 text-xs ml-1" style={{ fontSize: 11 }}>
              Enlace copiado
            </Text>
          </View>
        )}
      </View>

      {/* Ícono de acción */}
      <View className="ml-2">
        {justCopied ? (
          <CheckCircle size={16} color="#059669" strokeWidth={2} />
        ) : isLoading ? (
          <ActivityIndicator size="small" color="#3B82F6" />
        ) : attachment.type === 'pdf' ? (
          <Download size={16} color="#DC2626" strokeWidth={2} />
        ) : (
          <ExternalLink size={16} color="#9CA3AF" strokeWidth={2} />
        )}
      </View>
    </TouchableOpacity>
  );
};
