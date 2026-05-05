import swaggerJsdoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJsdoc({
    definition: {
        openapi: '3.0.3',
        info: {
            title: 'BildyApp API',
            version: '1.0.0',
            description: 'API REST para gestión de albaranes entre clientes y proveedores'
        },
        servers: [{ url: 'http://localhost:3000', description: 'Desarrollo' }],
        components: {
            securitySchemes: {
                bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
            },
            schemas: {
                Client: {
                    type: 'object',
                    required: ['name', 'cif'],
                    properties: {
                        name: { type: 'string', example: 'García Construcciones SA' },
                        cif: { type: 'string', example: 'B12345678' },
                        email: { type: 'string', format: 'email', example: 'garcia@test.com' },
                        phone: { type: 'string', example: '612345678' },
                        address: {
                            type: 'object',
                            properties: {
                                street: { type: 'string' },
                                number: { type: 'string' },
                                postal: { type: 'string' },
                                city: { type: 'string' },
                                province: { type: 'string' }
                            }
                        }
                    }
                },
                Project: {
                    type: 'object',
                    required: ['name', 'projectCode', 'clientId'],
                    properties: {
                        clientId: { type: 'string', example: '64abc123...' },
                        name: { type: 'string', example: 'Reforma Local Centro' },
                        projectCode: { type: 'string', example: 'PRJ-001' },
                        email: { type: 'string', format: 'email' },
                        notes: { type: 'string' },
                        active: { type: 'boolean', default: true }
                    }
                },
                DeliveryNote: {
                    type: 'object',
                    required: ['projectId', 'clientId', 'format', 'workDate'],
                    properties: {
                        projectId: { type: 'string' },
                        clientId: { type: 'string' },
                        format: { type: 'string', enum: ['material', 'hours'] },
                        description: { type: 'string' },
                        workDate: { type: 'string', format: 'date-time' },
                        hours: { type: 'number', example: 8 },
                        material: { type: 'string', example: 'Cemento Portland' },
                        quantity: { type: 'number', example: 50 },
                        unit: { type: 'string', example: 'kg' }
                    }
                }
            }
        }
    },
    apis: ['./src/routes/*.js']
});
