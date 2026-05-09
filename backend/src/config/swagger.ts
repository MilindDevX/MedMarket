import swaggerJsdoc  from 'swagger-jsdoc';
import swaggerUi     from 'swagger-ui-express';
import type { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title:       'MedMarket India API',
      version:     '1.0.0',
      description: 'REST API for the MedMarket multi-sided pharmacy marketplace. All protected routes require a Bearer JWT issued by `/api/v1/auth/login`.',
      contact: { name: 'MedMarket Engineering' },
    },
    servers: [
      { url: '/api/v1', description: 'API routes (auth, orders, pharmacy, admin…)' },
      { url: '/',       description: 'Root routes (health probe)' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type:         'http',
          scheme:       'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        SuccessEnvelope: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string'  },
            data:    { type: 'object'  },
          },
        },
        ErrorEnvelope: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string'  },
            errors:  { type: 'array', items: { type: 'string' } },
          },
        },
        LoginBody: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email:    { type: 'string', format: 'email', example: 'priya.sharma@gmail.com' },
            password: { type: 'string', minLength: 6,   example: 'Consumer@1234'           },
          },
        },
        RegisterBody: {
          type: 'object',
          required: ['name', 'email', 'password', 'role'],
          properties: {
            name:     { type: 'string', example: 'Priya Sharma'             },
            email:    { type: 'string', format: 'email'                     },
            password: { type: 'string', minLength: 8                        },
            role:     { type: 'string', enum: ['consumer', 'pharmacy_owner'] },
          },
        },
        OrderStatusPatch: {
          type: 'object',
          required: ['status'],
          properties: {
            status: {
              type: 'string',
              enum: ['accepted', 'rejected', 'packing', 'dispatched', 'delivered'],
            },
            rejection_reason: { type: 'string' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth',         description: 'Register, login, token refresh, logout, Google OAuth' },
      { name: 'Consumer',     description: 'Store discovery, medicine browse, addresses'           },
      { name: 'Orders',       description: 'Place, track, cancel, fulfil orders'                   },
      { name: 'Pharmacy',     description: 'Store registration, inventory, analytics'              },
      { name: 'Admin',        description: 'Platform management, applications, medicine catalogue' },
      { name: 'Medicines',    description: 'Public medicine catalogue'                             },
      { name: 'Notifications',description: 'In-app notification feed'                             },
      { name: 'Health',       description: 'Liveness probe'                                       },
    ],
    paths: {
      // ── Health (at root level, not /api/v1) ───────────────────────────────
      '/health': {
        get: {
          tags:        ['Health'],
          summary:     'Liveness probe',
          security:    [],
          responses:   {
            200: {
              description: 'Service is up',
              content: { 'application/json': { schema: {
                type: 'object',
                properties: {
                  status:    { type: 'string', example: 'ok'          },
                  timestamp: { type: 'string', format: 'date-time'    },
                  service:   { type: 'string', example: 'MedMarket API' },
                  version:   { type: 'string', example: '1.0.0'       },
                },
              }}},
            },
          },
        },
      },

      // ── Auth ──────────────────────────────────────────────────────────────
      '/auth/register': {
        post: {
          tags: ['Auth'], summary: 'Create account', security: [],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterBody' } } } },
          responses: {
            201: { description: 'Account created', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } } } },
            400: { description: 'Validation error',content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope'   } } } },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Auth'], summary: 'Login — returns access + refresh tokens', security: [],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginBody' } } } },
          responses: {
            200: { description: 'Tokens issued' },
            401: { description: 'Bad credentials' },
          },
        },
      },
      '/auth/google': {
        post: {
          tags: ['Auth'], summary: 'Google OAuth sign-in / sign-up', security: [],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { credential: { type: 'string', description: 'Google ID token from the browser' } } } } } },
          responses: { 200: { description: 'Tokens + isNew flag' } },
        },
      },
      '/auth/refresh': {
        post: {
          tags: ['Auth'], summary: 'Rotate refresh token, issue new access token', security: [],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { refreshToken: { type: 'string' } } } } } },
          responses: { 200: { description: 'New access token' }, 401: { description: 'Token invalid or expired' } },
        },
      },
      '/auth/logout': {
        post: {
          tags: ['Auth'], summary: 'Revoke refresh token',
          responses: { 200: { description: 'Logged out' } },
        },
      },

      // ── Consumer — stores ─────────────────────────────────────────────────
      '/stores': {
        get: {
          tags: ['Consumer'], summary: 'List approved stores (optionally filtered by city)', security: [],
          parameters: [{ name: 'city', in: 'query', schema: { type: 'string' }, example: 'Delhi' }],
          responses: { 200: { description: 'Array of stores' } },
        },
      },
      '/stores/{id}': {
        get: {
          tags: ['Consumer'], summary: 'Store profile with live inventory', security: [],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Store + inventory' }, 404: { description: 'Not found' } },
        },
      },

      // ── Medicines ─────────────────────────────────────────────────────────
      '/medicines': {
        get: {
          tags: ['Medicines'], summary: 'Browse OTC medicine master catalogue', security: [],
          parameters: [
            { name: 'q',        in: 'query', schema: { type: 'string' } },
            { name: 'category', in: 'query', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Paginated medicine list' } },
        },
      },
      '/medicines/{id}': {
        get: {
          tags: ['Medicines'], summary: 'Medicine detail', security: [],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Medicine record' }, 404: { description: 'Not found' } },
        },
      },

      // ── Orders ────────────────────────────────────────────────────────────
      '/orders': {
        post: {
          tags: ['Orders'], summary: 'Place an order (transactional stock deduction)',
          requestBody: { required: true, content: { 'application/json': { schema: {
            type: 'object',
            properties: {
              store_id:   { type: 'string' },
              address_id: { type: 'string' },
              items: { type: 'array', items: { type: 'object', properties: {
                inventory_id: { type: 'string' },
                quantity:     { type: 'integer' },
              }}},
            },
          }}}},
          responses: {
            201: { description: 'Order placed, stock deducted' },
            400: { description: 'COD limit exceeded or stock unavailable' },
          },
        },
      },
      '/orders/my': {
        get: {
          tags: ['Orders'], summary: 'List authenticated consumer\'s orders',
          parameters: [{ name: 'status', in: 'query', schema: { type: 'string' } }],
          responses: { 200: { description: 'Order list' } },
        },
      },
      '/orders/my/{id}/cancel': {
        post: {
          tags: ['Orders'], summary: 'Cancel a confirmed order (stock restored)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Cancelled' }, 400: { description: 'Cannot cancel at current status' } },
        },
      },
      '/orders/pharmacy': {
        get: {
          tags: ['Orders'], summary: 'Incoming orders for authenticated pharmacy',
          responses: { 200: { description: 'Order queue' } },
        },
      },
      '/orders/pharmacy/{id}/status': {
        patch: {
          tags: ['Orders'], summary: 'Advance order status (accept / pack / dispatch / deliver / reject)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/OrderStatusPatch' } } } },
          responses: { 200: { description: 'Status updated' }, 400: { description: 'Invalid transition' } },
        },
      },

      // ── Pharmacy ──────────────────────────────────────────────────────────
      '/pharmacy/register': {
        post: {
          tags: ['Pharmacy'], summary: 'Submit pharmacy registration (creates pending application)',
          responses: { 201: { description: 'Application submitted' } },
        },
      },
      '/pharmacy/profile': {
        get:   { tags: ['Pharmacy'], summary: 'Get store profile', responses: { 200: { description: 'Profile' } } },
        put:   { tags: ['Pharmacy'], summary: 'Update store profile', responses: { 200: { description: 'Updated' } } },
      },
      '/pharmacy/inventory': {
        get:  { tags: ['Pharmacy'], summary: 'List inventory items', responses: { 200: { description: 'Inventory' } } },
        post: { tags: ['Pharmacy'], summary: 'Add inventory item (OTC only, price ≤ MRP enforced)', responses: { 201: { description: 'Created' }, 400: { description: 'Schedule H/H1/X or price violation' } } },
      },
      '/pharmacy/inventory/{id}': {
        put:    { tags: ['Pharmacy'], summary: 'Update inventory item', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Updated' } } },
        delete: { tags: ['Pharmacy'], summary: 'Remove inventory item', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Removed' } } },
      },
      '/pharmacy/inventory/expiry-alerts': {
        get: { tags: ['Pharmacy'], summary: 'Items expiring within 60 days', responses: { 200: { description: 'Expiry alert list' } } },
      },

      // ── Admin ─────────────────────────────────────────────────────────────
      '/admin/dashboard': {
        get: { tags: ['Admin'], summary: 'Platform KPI summary', responses: { 200: { description: 'KPIs' } } },
      },
      '/admin/applications': {
        get: { tags: ['Admin'], summary: 'All pharmacy applications', responses: { 200: { description: 'Application list' } } },
      },
      '/admin/applications/{id}/approve': {
        patch: { tags: ['Admin'], summary: 'Approve pharmacy application', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Approved' } } },
      },
      '/admin/applications/{id}/reject': {
        patch: { tags: ['Admin'], summary: 'Reject pharmacy application', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Rejected' } } },
      },
      '/admin/applications/{id}/suspend': {
        patch: { tags: ['Admin'], summary: 'Suspend active pharmacy', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Suspended' } } },
      },
      '/admin/medicines': {
        get:  { tags: ['Admin'], summary: 'List master medicine catalogue', responses: { 200: { description: 'Medicines' } } },
        post: { tags: ['Admin'], summary: 'Add medicine to master catalogue', responses: { 201: { description: 'Created' } } },
      },
      '/admin/medicines/{id}': {
        patch:  { tags: ['Admin'], summary: 'Update medicine', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Updated' } } },
        delete: { tags: ['Admin'], summary: 'Deactivate medicine', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Deactivated' } } },
      },
      '/admin/medicines/{id}/blacklist-batch': {
        post: { tags: ['Admin'], summary: 'Blacklist a batch number platform-wide (CDSCO recall)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Batch blacklisted, stock hidden' } } },
      },
      '/admin/analytics/pharmacy/{id}': {
        get: { tags: ['Admin'], summary: 'Per-pharmacy analytics (GMV, orders, fulfillment)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Pharmacy analytics' } } },
      },
      '/admin/settings': {
        get:   { tags: ['Admin'], summary: 'Get platform settings (GST %, COD limit)', responses: { 200: { description: 'Settings' } } },
        patch: { tags: ['Admin'], summary: 'Update platform settings', responses: { 200: { description: 'Updated' } } },
      },

      // ── Consumer — complaints / notifications ─────────────────────────────
      '/consumer/complaints': {
        get:  { tags: ['Consumer'], summary: 'Read-only complaint history for authenticated consumer', responses: { 200: { description: 'Complaints' } } },
        post: { tags: ['Consumer'], summary: 'File a complaint (order or pharmacy)', responses: { 201: { description: 'Filed' } } },
      },
      '/notifications': {
        get:  { tags: ['Notifications'], summary: 'Unread notification feed', responses: { 200: { description: 'Notifications' } } },
      },
      '/notifications/{id}/read': {
        patch: { tags: ['Notifications'], summary: 'Mark notification as read', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Marked read' } } },
      },
    },
  },
  apis: [], // all paths defined inline above
};

export const swaggerSpec = swaggerJsdoc(options);

export function mountSwagger(app: Express): void {
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'MedMarket API Docs',
      swaggerOptions: { persistAuthorization: true },
    }),
  );
  // Also expose the raw JSON spec
  app.get('/api/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}
