'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, HelpCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  // General
  {
    category: 'General',
    question: '¿Qué es Resply?',
    answer: 'Resply es una plataforma SaaS que te permite crear chatbots inteligentes alimentados por tu propia base de conocimientos. Sube tus documentos (PDFs, Word, TXT) y el chatbot responderá preguntas basándose en ese contenido.',
  },
  {
    category: 'General',
    question: '¿Cómo funciona Resply?',
    answer: 'Resply utiliza tecnología RAG (Retrieval-Augmented Generation) combinada con modelos de IA avanzados. Cuando subes documentos, los procesamos, los dividimos en fragmentos y los almacenamos en una base de datos vectorial. Cuando alguien hace una pregunta, buscamos los fragmentos más relevantes y generamos una respuesta precisa.',
  },
  {
    category: 'General',
    question: '¿Necesito conocimientos técnicos para usar Resply?',
    answer: 'No, Resply está diseñado para ser intuitivo y fácil de usar. Solo necesitas saber subir archivos y copiar/pegar un código en tu sitio web para instalar el widget. No se requiere programación.',
  },

  // Planes y Precios
  {
    category: 'Planes y Precios',
    question: '¿Cuánto cuesta Resply?',
    answer: 'Ofrecemos diferentes planes según tus necesidades: Plan Starter (€29/mes), Plan Professional (€79/mes) y Plan Enterprise (contacto). Todos los planes incluyen 14 días de prueba gratuita sin tarjeta de crédito.',
  },
  {
    category: 'Planes y Precios',
    question: '¿Puedo cambiar de plan en cualquier momento?',
    answer: 'Sí, puedes actualizar o degradar tu plan en cualquier momento desde tu dashboard. Los cambios se aplican inmediatamente y ajustamos la facturación de forma prorrateada.',
  },
  {
    category: 'Planes y Precios',
    question: '¿Ofrecen reembolsos?',
    answer: 'Sí, ofrecemos una garantía de reembolso de 14 días. Si no estás satisfecho con Resply, te devolvemos el dinero sin preguntas.',
  },

  // Límites y Capacidad
  {
    category: 'Límites',
    question: '¿Cuántos documentos puedo subir?',
    answer: 'Depende de tu plan: Starter (hasta 50 documentos), Professional (hasta 500 documentos), Enterprise (ilimitado). Cada documento puede tener hasta 10 MB.',
  },
  {
    category: 'Límites',
    question: '¿Cuántas conversaciones puedo tener al mes?',
    answer: 'Starter: 1,000 conversaciones/mes, Professional: 10,000 conversaciones/mes, Enterprise: ilimitadas. Una conversación cuenta desde que un usuario abre el chat hasta que lo cierra.',
  },
  {
    category: 'Límites',
    question: '¿Qué formatos de archivo soportan?',
    answer: 'Actualmente soportamos: TXT, DOCX, DOC. Estamos trabajando en añadir soporte para PDF, PPTX, XLSX y más formatos próximamente.',
  },

  // Integración
  {
    category: 'Integración',
    question: '¿Cómo instalo el widget en mi sitio web?',
    answer: 'Desde tu dashboard, ve a "Widget" y copia el código JavaScript que te proporcionamos. Pégalo antes de la etiqueta </body> de tu sitio web. El widget aparecerá automáticamente en la esquina inferior derecha.',
  },
  {
    category: 'Integración',
    question: '¿Puedo personalizar el diseño del widget?',
    answer: 'Sí, puedes personalizar colores, posición, texto de bienvenida, avatar y más desde la configuración del widget en tu dashboard. Los cambios se aplican instantáneamente.',
  },
  {
    category: 'Integración',
    question: '¿Funciona con WordPress, Shopify, Wix, etc.?',
    answer: 'Sí, el widget de Resply funciona con cualquier sitio web que permita añadir código JavaScript personalizado. Esto incluye WordPress, Shopify, Wix, Squarespace, Webflow y más.',
  },

  // Seguridad
  {
    category: 'Seguridad',
    question: '¿Mis datos están seguros?',
    answer: 'Sí. Todos los datos están cifrados en tránsito (TLS) y en reposo (AES-256). Cumplimos con GDPR y no compartimos tus datos con terceros. Puedes eliminar tus datos en cualquier momento.',
  },
  {
    category: 'Seguridad',
    question: '¿Dónde se almacenan mis documentos?',
    answer: 'Los documentos se almacenan en servidores de Supabase (infraestructura AWS) en la región UE (Frankfurt). Los vectores se almacenan en Pinecone con redundancia.',
  },
  {
    category: 'Seguridad',
    question: '¿Puedo exportar o eliminar mis datos?',
    answer: 'Sí, puedes exportar todos tus datos (documentos, conversaciones, configuración) en formato JSON desde tu dashboard. También puedes eliminar tu cuenta y todos los datos asociados en cualquier momento.',
  },

  // Soporte
  {
    category: 'Soporte',
    question: '¿Ofrecen soporte técnico?',
    answer: 'Sí. Plan Starter incluye soporte por email (respuesta en 24h). Plan Professional incluye soporte prioritario (respuesta en 4h) y chat en vivo. Plan Enterprise incluye un gerente de cuenta dedicado.',
  },
  {
    category: 'Soporte',
    question: '¿Tienen documentación o tutoriales?',
    answer: 'Sí, tenemos un centro de ayuda completo con guías paso a paso, tutoriales en video y documentación de la API. También publicamos casos de uso y mejores prácticas en nuestro blog.',
  },
];

function FAQAccordionItem({ faq, isOpen, onToggle }: {
  faq: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 last:border-0">
      <button
        onClick={onToggle}
        className="w-full text-left px-6 py-4 flex items-start justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <span className="font-medium text-gray-900 dark:text-white flex-1">
          {faq.question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-6 pb-4 text-gray-600 dark:text-gray-400">
          {faq.answer}
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  const categories = ['Todos', ...Array.from(new Set(faqs.map(faq => faq.category)))];
  const filteredFAQs = selectedCategory === 'Todos'
    ? faqs
    : faqs.filter(faq => faq.category === selectedCategory);

  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <HelpCircle className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Preguntas Frecuentes
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Encuentra respuestas a las dudas más comunes sobre Resply
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => {
                setSelectedCategory(category);
                setOpenIndex(null);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {filteredFAQs.map((faq, index) => (
            <FAQAccordionItem
              key={index}
              faq={faq}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>

        {/* Still have questions? */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            ¿Aún tienes dudas?
          </p>
          <Link
            href="/help/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
            <span>Contacta con nuestro equipo</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
