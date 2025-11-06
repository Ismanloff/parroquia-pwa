/**
 * Artillery Load Test Helper Functions
 *
 * Provides utilities for load testing:
 * - Random data generation
 * - Authentication
 * - Request preprocessing
 * - Response validation
 */

const crypto = require('crypto');

/**
 * Generate random test data
 */
function generateRandomEmail(context, events, done) {
  context.vars.randomEmail = `test-${crypto.randomBytes(8).toString('hex')}@resply.test`;
  return done();
}

function generateRandomWorkspaceId(context, events, done) {
  // Use real workspace IDs from database
  const workspaceIds = [
    '26ca2ee9-4e53-4a3d-acc3-9359cda25cb4', // ismael workspace
    'fdceff54-e723-4c3f-856c-ebac6995bf4c', // test workspace
  ];
  context.vars.workspaceId = workspaceIds[Math.floor(Math.random() * workspaceIds.length)];
  return done();
}

function generateRandomMessage(context, events, done) {
  const messages = [
    '¿Cuáles son los horarios de atención?',
    '¿Dónde están ubicados?',
    '¿Cuánto cuesta el servicio?',
    'Necesito ayuda con mi cuenta',
    '¿Tienen soporte técnico?',
    '¿Cómo puedo cancelar mi suscripción?',
    '¿Ofrecen descuentos para empresas?',
    '¿Cuál es el proceso de onboarding?',
  ];
  context.vars.randomMessage = messages[Math.floor(Math.random() * messages.length)];
  return done();
}

function generateRandomDocumentName(context, events, done) {
  context.vars.documentName = `test-document-${crypto.randomBytes(4).toString('hex')}.pdf`;
  return done();
}

/**
 * Authentication helpers
 */
function setAuthToken(context, events, done) {
  // In a real scenario, you'd get this from login response
  // For testing, use a test token from environment
  context.vars.authToken = process.env.TEST_AUTH_TOKEN || 'test-token';
  return done();
}

function extractAuthToken(requestParams, response, context, ee, next) {
  if (response.body) {
    try {
      const body = JSON.parse(response.body);
      if (body.session && body.session.access_token) {
        context.vars.authToken = body.session.access_token;
      }
    } catch (e) {
      console.error('Failed to parse auth response:', e);
    }
  }
  return next();
}

/**
 * Response validation
 */
function validateHealthResponse(requestParams, response, context, ee, next) {
  if (response.statusCode === 200) {
    try {
      const body = JSON.parse(response.body);

      // Track metrics
      if (body.services && body.services.database) {
        ee.emit('customStat', {
          stat: 'db_latency',
          value: body.services.database.latency_ms
        });
      }

      if (body.services && body.services.api) {
        ee.emit('customStat', {
          stat: 'api_latency',
          value: body.services.api.latency_ms
        });
      }

      // Check if healthy
      if (body.status !== 'healthy') {
        ee.emit('error', `System not healthy: ${body.status}`);
      }
    } catch (e) {
      console.error('Failed to validate health response:', e);
    }
  }
  return next();
}

function validateChatResponse(requestParams, response, context, ee, next) {
  if (response.statusCode === 200) {
    try {
      const body = JSON.parse(response.body);

      // Track token usage
      if (body.usage) {
        ee.emit('customStat', {
          stat: 'tokens_used',
          value: body.usage.total_tokens
        });
      }

      // Track response time
      if (body.response_time_ms) {
        ee.emit('customStat', {
          stat: 'ai_response_time',
          value: body.response_time_ms
        });
      }

      // Validate response structure
      if (!body.message) {
        ee.emit('error', 'Chat response missing message');
      }
    } catch (e) {
      console.error('Failed to validate chat response:', e);
    }
  }
  return next();
}

/**
 * Logging helpers
 */
function logResponse(requestParams, response, context, ee, next) {
  console.log(`Response status: ${response.statusCode}, body length: ${response.body ? response.body.length : 0}`);
  return next();
}

function logError(requestParams, response, context, ee, next) {
  if (response.statusCode >= 400) {
    console.error(`Error ${response.statusCode}: ${response.body}`);
  }
  return next();
}

/**
 * Think time helpers (simulate user behavior)
 */
function shortThink(context, events, done) {
  setTimeout(done, Math.random() * 1000 + 500); // 0.5-1.5s
}

function mediumThink(context, events, done) {
  setTimeout(done, Math.random() * 3000 + 2000); // 2-5s
}

function longThink(context, events, done) {
  setTimeout(done, Math.random() * 5000 + 5000); // 5-10s
}

/**
 * Export all functions
 */
module.exports = {
  generateRandomEmail,
  generateRandomWorkspaceId,
  generateRandomMessage,
  generateRandomDocumentName,
  setAuthToken,
  extractAuthToken,
  validateHealthResponse,
  validateChatResponse,
  logResponse,
  logError,
  shortThink,
  mediumThink,
  longThink,
};
