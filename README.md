 Wallet & Remittance API

Mini-core API para gestión de wallets y envío de remesas internacionales.

## 🚀 Características

- ✅ **Gestión de Wallets Multi-moneda** (USD, CLP, EUR, MXN, COP)
- ✅ **Depósitos con Idempotencia**
- ✅ **Cotizaciones de Remesas** con expiración automática (5 minutos)
- ✅ **Envío de Remesas** con integración a proveedor externo
- ✅ **Manejo de Concurrencia** con Pessimistic Locking
- ✅ **Precisión Decimal** con Decimal.js
- ✅ **Transacciones ACID** con TypeORM
- ✅ **Auditoría Completa** de todas las operaciones
- ✅ **Documentación Swagger/OpenAPI**
- ✅ **Health Checks** para monitoreo

## 📋 Requisitos

- **Node.js**: >= 20.0.0
- **npm**: >= 10.0.0
- **PostgreSQL**: >= 14
- **Docker** (opcional, para desarrollo)

## 🛠️ Tecnologías

- **NestJS** 10.x - Framework backend
- **TypeORM** 0.3.x - ORM
- **PostgreSQL** - Base de datos
- **Decimal.js** - Precisión decimal
- **Swagger** - Documentación API
- **class-validator** - Validaciones
- **Docker** - Containerización

## 📦 Instalación

### 1. Clonar repositorio

```bash
git clone <repository-url>
cd wallet-remittance-api
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:

```env
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=wallet_remittance_db
DB_SYNCHRONIZE=false
DB_LOGGING=true

# Application Settings
QUOTE_VALIDITY_MINUTES=5
FEE_PERCENTAGE=2.5
```

### 4. Levantar base de datos (Docker)

```bash
docker-compose up -d
```

Esto levantará PostgreSQL en el puerto 5432 y ejecutará automáticamente el script `init.sql`.

### 5. Iniciar aplicación

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

## 📚 Documentación API

Una vez iniciada la aplicación, accede a:

- **Swagger UI**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health

## 🎯 Endpoints Principales

### Users

- `POST /api/users` - Crear usuario
- `GET /api/users` - Listar usuarios
- `GET /api/users/:id` - Obtener usuario
- `DELETE /api/users/:id` - Desactivar usuario

### Wallets

- `POST /api/wallets/deposit` - Depositar fondos ⭐
- `GET /api/wallets/user/:userId` - Wallets del usuario
- `GET /api/wallets/user/:userId/balance?currency=USD` - Balance por moneda

### Quotes

- `POST /api/quotes` - Crear cotización ⭐
- `GET /api/quotes/:id` - Obtener cotización
- `GET /api/quotes/user/:userId` - Cotizaciones del usuario
- `GET /api/quotes/user/:userId/active` - Cotizaciones activas

### Remittances

- `POST /api/remittances/send` - Enviar remesa ⭐⭐⭐
- `GET /api/remittances/:id` - Obtener remesa
- `GET /api/remittances/user/:userId` - Remesas del usuario
- `GET /api/remittances` - Todas las remesas (admin)

### Exchange Rates

- `GET /api/exchange-rates/active` - Tasas activas
- `GET /api/exchange-rates/rate?from=USD&to=CLP` - Tasa específica
- `GET /api/exchange-rates` - Todas las tasas

### Transactions

- `GET /api/transactions/wallet/:walletId` - Por wallet
- `GET /api/transactions/user/:userId` - Por usuario
- `GET /api/transactions/:id` - Por ID

## 🔄 Flujo Completo de Remesa

### 1. Crear Usuario

```bash
POST /api/users
{
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

### 2. Depositar Fondos

```bash
POST /api/wallets/deposit
Headers:
  X-Idempotency-Key: unique-key-123

Body:
{
  "userId": "user-uuid",
  "currency": "USD",
  "amount": "1000.00"
}
```

### 3. Crear Cotización

```bash
POST /api/quotes
{
  "userId": "user-uuid",
  "fromCurrency": "USD",
  "toCurrency": "CLP",
  "sendAmount": "100.00"
}

Response:
{
  "success": true,
  "data": {
    "id": "quote-uuid",
    "sendAmount": "100.0000",
    "feeAmount": "2.5000",
    "totalAmount": "102.5000",
    "receiveAmount": "92500.0000",
    "exchangeRate": "925.0000000000",
    "expiresAt": "2024-01-15T10:35:00Z"
  }
}
```

### 4. Enviar Remesa

```bash
POST /api/remittances/send
Headers:
  X-Idempotency-Key: unique-key-456

Body:
{
  "quoteId": "quote-uuid",
  "recipientEmail": "recipient@example.com",
  "recipientName": "Jane Doe",
  "recipientPhone": "+56912345678"
}

Response:
{
  "success": true,
  "data": {
    "id": "remittance-uuid",
    "status": "completed",
    "sendAmount": "100.0000",
    "receiveAmount": "92500.0000",
    "externalProviderId": "EXT-123456"
  }
}
```

## 🔐 Seguridad

### Idempotencia

Los endpoints críticos requieren el header `X-Idempotency-Key`:

- `POST /api/wallets/deposit`
- `POST /api/remittances/send`

La clave debe ser única (UUID recomendado) y se almacena por 24 horas.

### Concurrencia

- **Pessimistic Locking** en operaciones de wallet
- **Transacciones ACID** para garantizar consistencia
- **Hold/Release/Deduct** de balances

### Precisión Decimal

- Uso de `Decimal.js` para evitar errores de punto flotante
- Almacenamiento en PostgreSQL como `DECIMAL(20,4)`
- 4 decimales de precisión

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📊 Base de Datos

### Tablas Principales

- `users` - Usuarios del sistema
- `wallets` - Wallets multi-moneda
- `transactions` - Registro de transacciones
- `quotes` - Cotizaciones de remesas
- `remittances` - Remesas enviadas
- `exchange_rates` - Tasas de cambio
- `idempotency_keys` - Control de idempotencia
- `audit_logs` - Auditoría automática

### Datos de Prueba

El script `init.sql` incluye:

- 3 usuarios de prueba
- 5 wallets con balances
- Tasas de cambio activas (USD, CLP, EUR, MXN, COP)

**Usuario de prueba:**
- Email: `john.doe@example.com`
- ID: Ver en base de datos después de ejecutar init.sql

## 🏗️ Arquitectura

### Estructura de Carpetas

```
src/
├── main.ts
├── app.module.ts
├── config/
│   ├── database.config.ts
│   └── app.config.ts
├── common/
│   ├── enums/
│   ├── filters/
│   ├── interceptors/
│   ├── decorators/
│   └── dto/
└── modules/
    ├── health/
    ├── idempotency/
    ├── users/
    ├── wallets/
    ├── transactions/
    ├── exchange-rates/
    ├── quotes/
    └── remittances/
```

### Decisiones Arquitectónicas

**Monolito Modular**
- Simplicidad para MVP
- Fácil de desarrollar y desplegar
- Preparado para microservicios futuros

**PostgreSQL Único**
- Sin Redis para MVP
- Idempotencia en base de datos
- Menor complejidad operacional

**Decimal.js**
- Precisión en cálculos financieros
- Evita errores de punto flotante

**TypeORM**
- ORM maduro y estable
- Soporte completo de PostgreSQL
- Migraciones automáticas

## 🚀 Deployment

### Docker

```bash
# Build
docker build -t wallet-remittance-api .

# Run
docker run -p 3000:3000 --env-file .env wallet-remittance-api
```

### AWS (Recomendado)

- **ECS Fargate** - Aplicación
- **RDS PostgreSQL Multi-AZ** - Base de datos
- **Application Load Balancer** - Balanceo
- **CloudWatch** - Logs y métricas
- **Secrets Manager** - Variables sensibles

Ver documento de deployment para detalles.

## 📈 Monitoreo

### Health Checks

```bash
GET /health
GET /health/db
```

### Logs

- Logging estructurado con `LoggingInterceptor`
- Logs de todas las requests/responses
- Logs de errores con stack traces

### Métricas

- Tiempo de respuesta
- Tasa de errores
- Transacciones por segundo
- Balance total por moneda

## 🤝 Contribución

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📝 Licencia

MIT License - ver archivo LICENSE para detalles.

## 👥 Equipo

- Backend Team
- DevOps Team
- QA Team

## 📞 Soporte

Para soporte, contactar a: support@example.com

---

**Versión**: 1.0.0  
**Última actualización**: 2024-01-15
 
