/**
 * Resply Chat Widget
 * Standalone embeddable chat widget for websites
 */
(function() {
  'use strict';

  class ResplyWidget {
    constructor(config) {
      this.config = {
        workspaceId: config.workspaceId,
        apiUrl: config.apiUrl || 'https://resply.vercel.app',
      };
      this.settings = {
        primary_color: '#667eea',
        bot_name: 'Asistente IA',
        bot_avatar: 'R',
        welcome_message: '¡Hola! 👋 Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?',
        position: 'bottom-right',
        auto_open: false,
        auto_open_delay: 3,
        show_branding: true,
      };
      this.isOpen = false;
      this.conversationId = null;
      this.messages = [];
      this.init();
    }

    async init() {
      // Fetch settings from API
      await this.fetchSettings();
      this.createWidget();
      this.injectStyles();
      this.setupEventListeners();

      // Auto-open if enabled
      if (this.settings.auto_open) {
        setTimeout(() => {
          this.toggleWidget();
        }, this.settings.auto_open_delay * 1000);
      }
    }

    async fetchSettings() {
      try {
        const response = await fetch(`${this.config.apiUrl}/api/widget/settings?workspaceId=${this.config.workspaceId}`);
        const data = await response.json();

        if (data.success && data.settings) {
          this.settings = {
            primary_color: data.settings.primary_color,
            bot_name: data.settings.bot_name,
            bot_avatar: data.settings.bot_avatar,
            welcome_message: data.settings.welcome_message,
            position: data.settings.position,
            auto_open: data.settings.auto_open,
            auto_open_delay: data.settings.auto_open_delay,
            show_branding: data.settings.show_branding,
          };
        }
      } catch (error) {
        console.error('Error fetching widget settings:', error);
        // Use default settings on error
      }
    }

    createWidget() {
      const container = document.createElement('div');
      container.id = 'resply-widget';
      container.innerHTML = `
        <!-- Chat Button -->
        <button id="resply-widget-button" class="resply-widget-button" aria-label="Open chat">
          <span class="resply-widget-button-avatar">${this.settings.bot_avatar}</span>
        </button>

        <!-- Chat Window -->
        <div id="resply-widget-window" class="resply-widget-window" style="display: none;">
          <!-- Header -->
          <div class="resply-widget-header">
            <div class="resply-widget-header-content">
              <div class="resply-widget-avatar">${this.settings.bot_avatar}</div>
              <div>
                <div class="resply-widget-title">${this.settings.bot_name}</div>
                <div class="resply-widget-status">En línea</div>
              </div>
            </div>
            <button id="resply-widget-close" class="resply-widget-close" aria-label="Close chat">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- Messages -->
          <div id="resply-widget-messages" class="resply-widget-messages">
            <div class="resply-widget-message resply-widget-message-assistant">
              <div class="resply-widget-message-content">
                ${this.settings.welcome_message}
              </div>
            </div>
          </div>

          <!-- Input -->
          <div class="resply-widget-input-container">
            <textarea
              id="resply-widget-textarea"
              class="resply-widget-textarea"
              placeholder="Escribe tu mensaje..."
              rows="1"
            ></textarea>
            <button id="resply-widget-send" class="resply-widget-send" aria-label="Send message">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>

          ${this.settings.show_branding ? `
          <!-- Branding -->
          <div class="resply-widget-branding">
            Powered by <strong>Resply</strong>
          </div>
          ` : ''}
        </div>
      `;
      document.body.appendChild(container);
    }

    injectStyles() {
      const style = document.createElement('style');
      style.textContent = `
        #resply-widget {
          position: fixed;
          ${this.settings.position === 'bottom-right' ? 'right: 20px;' : 'left: 20px;'}
          bottom: 20px;
          z-index: 999999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }

        .resply-widget-button {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: ${this.settings.primary_color};
          color: white;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .resply-widget-button-avatar {
          font-size: 24px;
        }

        .resply-widget-button:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        }

        .resply-widget-window {
          position: absolute;
          ${this.settings.position === 'bottom-right' ? 'right: 0;' : 'left: 0;'}
          bottom: 80px;
          width: 380px;
          max-width: calc(100vw - 40px);
          height: 600px;
          max-height: calc(100vh - 120px);
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .resply-widget-header {
          background: ${this.settings.primary_color};
          color: white;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .resply-widget-header-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .resply-widget-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 18px;
        }

        .resply-widget-title {
          font-weight: 600;
          font-size: 16px;
        }

        .resply-widget-status {
          font-size: 12px;
          opacity: 0.9;
        }

        .resply-widget-close {
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .resply-widget-close:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .resply-widget-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: #f9fafb;
        }

        .resply-widget-message {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .resply-widget-message-content {
          padding: 10px 14px;
          border-radius: 12px;
          max-width: 80%;
          word-wrap: break-word;
          line-height: 1.5;
          font-size: 14px;
        }

        .resply-widget-message-user .resply-widget-message-content {
          background: ${this.settings.primary_color};
          color: white;
          margin-left: auto;
          border-bottom-right-radius: 4px;
        }

        .resply-widget-message-assistant .resply-widget-message-content {
          background: white;
          color: #1f2937;
          border: 1px solid #e5e7eb;
          border-bottom-left-radius: 4px;
        }

        .resply-widget-input-container {
          padding: 16px;
          background: white;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 8px;
          align-items: flex-end;
        }

        .resply-widget-textarea {
          flex: 1;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
          resize: none;
          max-height: 120px;
          line-height: 1.5;
        }

        .resply-widget-textarea:focus {
          outline: none;
          border-color: ${this.settings.primary_color};
        }

        .resply-widget-send {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: ${this.settings.primary_color};
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.2s;
          flex-shrink: 0;
        }

        .resply-widget-branding {
          padding: 8px;
          text-align: center;
          font-size: 11px;
          color: #6b7280;
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
        }

        .resply-widget-branding strong {
          color: ${this.settings.primary_color};
        }

        .resply-widget-send:hover {
          opacity: 0.9;
        }

        .resply-widget-send:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .resply-widget-typing {
          padding: 10px 14px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          border-bottom-left-radius: 4px;
          max-width: 80px;
          display: flex;
          gap: 4px;
        }

        .resply-widget-typing-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #9ca3af;
          animation: resply-typing 1.4s infinite;
        }

        .resply-widget-typing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .resply-widget-typing-dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes resply-typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.7;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }

        @media (max-width: 480px) {
          .resply-widget-window {
            width: calc(100vw - 40px);
            height: calc(100vh - 140px);
          }
        }
      `;
      document.head.appendChild(style);
    }

    setupEventListeners() {
      const button = document.getElementById('resply-widget-button');
      const closeBtn = document.getElementById('resply-widget-close');
      const sendBtn = document.getElementById('resply-widget-send');
      const textarea = document.getElementById('resply-widget-textarea');

      button.addEventListener('click', () => this.toggleWidget());
      closeBtn.addEventListener('click', () => this.closeWidget());
      sendBtn.addEventListener('click', () => this.sendMessage());

      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });

      textarea.addEventListener('input', () => {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
      });
    }

    toggleWidget() {
      this.isOpen = !this.isOpen;
      const window = document.getElementById('resply-widget-window');
      const button = document.getElementById('resply-widget-button');

      if (this.isOpen) {
        window.style.display = 'flex';
        button.style.display = 'none';
        setTimeout(() => {
          document.getElementById('resply-widget-textarea').focus();
        }, 100);
      } else {
        window.style.display = 'none';
        button.style.display = 'flex';
      }
    }

    closeWidget() {
      this.isOpen = false;
      document.getElementById('resply-widget-window').style.display = 'none';
      document.getElementById('resply-widget-button').style.display = 'flex';
    }

    addMessage(role, content) {
      const messagesContainer = document.getElementById('resply-widget-messages');
      const messageDiv = document.createElement('div');
      messageDiv.className = `resply-widget-message resply-widget-message-${role}`;

      const contentDiv = document.createElement('div');
      contentDiv.className = 'resply-widget-message-content';
      contentDiv.textContent = content;

      messageDiv.appendChild(contentDiv);
      messagesContainer.appendChild(messageDiv);

      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showTyping() {
      const messagesContainer = document.getElementById('resply-widget-messages');
      const typingDiv = document.createElement('div');
      typingDiv.id = 'resply-widget-typing-indicator';
      typingDiv.className = 'resply-widget-message resply-widget-message-assistant';
      typingDiv.innerHTML = `
        <div class="resply-widget-typing">
          <div class="resply-widget-typing-dot"></div>
          <div class="resply-widget-typing-dot"></div>
          <div class="resply-widget-typing-dot"></div>
        </div>
      `;
      messagesContainer.appendChild(typingDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTyping() {
      const typingIndicator = document.getElementById('resply-widget-typing-indicator');
      if (typingIndicator) {
        typingIndicator.remove();
      }
    }

    async sendMessage() {
      const textarea = document.getElementById('resply-widget-textarea');
      const message = textarea.value.trim();

      if (!message) return;

      this.addMessage('user', message);
      textarea.value = '';
      textarea.style.height = 'auto';

      const sendBtn = document.getElementById('resply-widget-send');
      sendBtn.disabled = true;

      this.showTyping();

      try {
        const response = await fetch(`${this.config.apiUrl}/api/chat/widget`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: message,
            workspaceId: this.config.workspaceId,
            conversationId: this.conversationId,
            stream: false,
          }),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('text/event-stream')) {
          // STREAMING RESPONSE
          this.hideTyping();

          // Create assistant message container
          const messagesContainer = document.getElementById('resply-widget-messages');
          const messageDiv = document.createElement('div');
          messageDiv.className = 'resply-widget-message resply-widget-message-assistant';

          const contentDiv = document.createElement('div');
          contentDiv.className = 'resply-widget-message-content';
          contentDiv.textContent = '';

          messageDiv.appendChild(contentDiv);
          messagesContainer.appendChild(messageDiv);

          // Read stream
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const {done, value} = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, {stream: true});
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.slice(6);
                if (dataStr === '[DONE]') continue;

                try {
                  const data = JSON.parse(dataStr);

                  if (data.type === 'metadata') {
                    this.conversationId = data.conversationId;
                  } else if (data.type === 'content') {
                    contentDiv.textContent += data.content;
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                  } else if (data.type === 'done') {
                    // Stream complete
                  } else if (data.type === 'error') {
                    console.error('Stream error:', data.error);
                    contentDiv.textContent = 'Lo siento, hubo un error.';
                  }
                } catch (e) {
                  console.error('Error parsing SSE data:', e);
                }
              }
            }
          }

        } else {
          // FALLBACK: NON-STREAMING RESPONSE
          const data = await response.json();
          this.hideTyping();

          if (data.success) {
            this.conversationId = data.conversationId;
            this.addMessage('assistant', data.response);
          } else {
            this.addMessage('assistant', 'Lo siento, hubo un error. Por favor intenta de nuevo.');
          }
        }
      } catch (error) {
        console.error('Error sending message:', error);
        this.hideTyping();
        this.addMessage('assistant', 'Lo siento, no pude conectarme con el servidor.');
      } finally {
        sendBtn.disabled = false;
      }
    }
  }

  window.ResplyWidget = {
    init: function(config) {
      if (!config.workspaceId) {
        console.error('ResplyWidget: workspaceId is required');
        return;
      }
      new ResplyWidget(config);
    }
  };
})();
