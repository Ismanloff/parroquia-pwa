'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function WorkspaceSettingsPage() {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [chatbotName, setChatbotName] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [language, setLanguage] = useState('es');
  const [tone, setTone] = useState('friendly');

  useEffect(() => {
    fetchWorkspaceData();
  }, [workspaceId]);

  const fetchWorkspaceData = async () => {
    if (!supabase || !workspaceId) return;

    try {
      // Fetch workspace
      const { data: wsData, error: wsError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single();

      if (wsError) throw wsError;
      setName(wsData.name);
      setSlug(wsData.slug);

      // Fetch settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('workspace_settings')
        .select('*')
        .eq('workspace_id', workspaceId)
        .single();

      if (settingsError) throw settingsError;
      setChatbotName(settingsData.chatbot_name || '');
      setWelcomeMessage(settingsData.welcome_message || '');
      setLanguage(settingsData.language || 'es');
      setTone(settingsData.tone || 'friendly');
    } catch (error) {
      console.error('Error fetching workspace:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveWorkspace = async () => {
    if (!supabase || !workspaceId) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('workspaces')
        .update({ name, slug })
        .eq('id', workspaceId);

      if (error) throw error;
      alert('Workspace actualizado exitosamente');
    } catch (error) {
      console.error('Error updating workspace:', error);
      alert('Error al actualizar workspace');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!supabase || !workspaceId) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('workspace_settings')
        .update({
          chatbot_name: chatbotName,
          welcome_message: welcomeMessage,
          language,
          tone,
        })
        .eq('workspace_id', workspaceId);

      if (error) throw error;
      alert('Configuración actualizada exitosamente');
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Error al actualizar configuración');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-6">Cargando...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Configuración del Workspace</h1>

      {/* Sección: Workspace General */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold mb-4">Información General</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nombre del Workspace</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Slug (URL)</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              URL: resply.com/w/{slug}
            </p>
          </div>

          <button
            onClick={handleSaveWorkspace}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? 'Guardando...' : 'Guardar Workspace'}
          </button>
        </div>
      </div>

      {/* Sección: Chatbot Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold mb-4">Configuración del Chatbot</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nombre del Chatbot</label>
            <input
              type="text"
              value={chatbotName}
              onChange={(e) => setChatbotName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              placeholder="Asistente"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Mensaje de Bienvenida</label>
            <textarea
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              placeholder="¡Hola! ¿En qué puedo ayudarte?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Idioma</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
                <option value="pt">Português</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tono</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="friendly">Amigable</option>
                <option value="professional">Profesional</option>
                <option value="casual">Casual</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </div>

      {/* Sección: Zona Peligrosa */}
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-6">
        <h2 className="text-xl font-semibold text-red-800 dark:text-red-400 mb-4">Zona Peligrosa</h2>

        <div className="space-y-4">
          <p className="text-sm text-red-700 dark:text-red-300">
            Eliminar este workspace borrará permanentemente todos los datos asociados:
            conversaciones, documentos, configuraciones, etc.
          </p>

          <button
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            onClick={() => alert('TODO: Implementar eliminación de workspace')}
          >
            Eliminar Workspace
          </button>
        </div>
      </div>
    </div>
  );
}
