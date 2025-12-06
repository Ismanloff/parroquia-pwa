export default function Home() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '20px'
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
        🙏 Backend de Parroquias
      </h1>
      <p style={{ color: '#666', textAlign: 'center', maxWidth: '600px' }}>
        Este es el backend para la aplicación de Parroquias.
        <br />
        Proporciona endpoints para el chat con IA usando OpenAI ChatKit.
      </p>
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#f0f0f0',
        borderRadius: '8px',
        maxWidth: '600px'
      }}>
        <p style={{ margin: 0, fontSize: '0.9rem' }}>
          <strong>Endpoints disponibles:</strong>
        </p>
        <ul style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
          <li>POST /api/chatkit/session - Crear sesión de ChatKit</li>
        </ul>
      </div>
    </div>
  );
}
