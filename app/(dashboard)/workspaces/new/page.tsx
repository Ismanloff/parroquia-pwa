'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function NewWorkspacePage() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!supabase) throw new Error('Supabase not initialized');

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const finalSlug = slug || name.toLowerCase().replace(/\s+/g, '-');

      console.log('Creating workspace via API:', {
        name,
        slug: finalSlug,
      });

      // Call API endpoint with service role (bypasses RLS)
      const response = await fetch('/api/workspaces/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name,
          slug: finalSlug,
          pinecone_namespace: `ws_${crypto.randomUUID().split('-')[0]}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear workspace');
      }

      console.log('Workspace created successfully:', data.workspace);

      // Store workspace ID in localStorage
      localStorage.setItem('resply-active-workspace', data.workspace.id);

      router.push(`/dashboard?workspace=${data.workspace.id}`);
    } catch (error: any) {
      console.error('Error creating workspace:', error);
      alert(`Error al crear workspace: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Crear Nuevo Workspace</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Nombre del Workspace</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Mi Empresa"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Slug (URL)</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="mi-empresa"
          />
          <p className="text-sm text-gray-600 mt-1">
            Si dejas en blanco, se generará automáticamente
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Creando...' : 'Crear Workspace'}
        </button>
      </form>
    </div>
  );
}
