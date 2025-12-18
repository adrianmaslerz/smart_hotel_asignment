# Smart Hotel API

## Quick Start

### Prerequisites
- Node.js >= 20
- Docker & Docker Compose

### Installation

```bash
$ npm install
```

### Run Application

```bash
$ docker-compose up -d
```

Then open:
- **API**: http://localhost:3000
- **Swagger UI**: http://localhost:3000/api/docs

## Running Tests

```bash
$ npm run test          # Unit tests
$ npm run test:watch   # Watch mode
$ npm run test:cov     # Coverage report
$ npm run test:e2e     # E2E tests
```

## Development

```bash
$ npm run start:dev    # Development mode with hot reload
$ npm run build        # Build for production
$ npm run lint         # Linting
$ npm run format       # Format code
```

## Docker Commands

```bash
$ docker-compose down              # Stop services
$ docker-compose down -v           # Stop and remove data
$ docker-compose logs -f app       # View app logs
```

## Key Technologies

- NestJS, TypeScript, MongoDB, Redis, Bull, Swagger, Class Validator, XLSX, Socket.IO
