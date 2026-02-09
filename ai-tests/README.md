# AI Test Suite for MockMate

This folder contains a comprehensive AI-powered test suite using **DeepSeek-R1 8B** (for reasoning & debugging) and **Llama 3.1 8B** (for quick text generation) via Ollama.

## Model Strategy

| Model | Use Case |
|-------|----------|
| **DeepSeek-R1 8B** (Primary) | Debugging, root cause analysis, security audit, code explanation |
| **Llama 3.1 8B** (Fallback) | Test data generation, simple text, user simulation |

DeepSeek-R1 excels at **explaining WHY code is breaking** - a superpower for learning and debugging.

## Prerequisites

1. **Install Ollama** (local LLM runner):
   ```bash
   # Windows (via winget)
   winget install Ollama.Ollama
   
   # Or download from: https://ollama.ai/download
   ```

2. **Pull both models**:
   ```bash
   ollama pull deepseek-r1:8b    # Primary - reasoning
   ollama pull llama3.1:8b       # Fallback - quick generation
   ```

3. **Start Ollama server**:
   ```bash
   ollama serve
   ```

4. **Install dependencies**:
   ```bash
   cd ai-tests
   npm install
   ```


## Running Tests

### Run All Tests
```bash
npm test
```

### Run Individual Test Suites

| Command | Description |
|---------|-------------|
| `npm run test:auth` | Authentication flow tests |
| `npm run test:interview` | Interview simulation tests |
| `npm run test:billing` | Billing/subscription tests |
| `npm run test:api` | API endpoint tests |
| `npm run test:performance` | Performance & load tests |
| `npm run test:accessibility` | WCAG accessibility tests |
| `npm run test:security` | Security vulnerability tests |
| `npm run test:components` | UI component tests |
| `npm run test:visual` | Visual regression tests |
| `npm run test:e2e` | End-to-end flow tests |
| `npm run test:integration` | Integration tests |
| `npm run test:exploratory` | AI-driven exploratory tests |

### Run By Category

| Command | Suites Included |
|---------|-----------------|
| `npm run test:category:core` | Auth, Interview, Billing, API |
| `npm run test:category:quality` | Performance, Accessibility, Security |
| `npm run test:category:ui` | Components, Visual |
| `npm run test:category:flows` | E2E, Integration |
| `npm run test:category:ai` | Exploratory |

## Test Structure

```
ai-tests/
├── config/
│   └── ollama.config.js     # Ollama/Llama configuration
├── tests/
│   ├── auth.test.js         # 🔐 Auth flow tests
│   ├── interview.test.js    # 🎤 Interview simulation
│   ├── billing.test.js      # 💳 Billing/subscription
│   ├── api.test.js          # 🌐 API endpoints
│   ├── performance.test.js  # ⚡ Performance metrics
│   ├── accessibility.test.js # ♿ WCAG compliance
│   ├── security.test.js     # 🔒 Security checks
│   ├── components.test.js   # 🧩 UI components
│   ├── visual.test.js       # 🎨 Visual regression
│   ├── e2e.test.js          # 🔄 End-to-end flows
│   ├── integration.test.js  # 🔗 Integration tests
│   └── exploratory.test.js  # 🤖 AI exploratory
├── utils/
│   ├── llm.js               # LLM interaction utilities
│   ├── browser.js           # Puppeteer browser utilities
│   └── assertions.js        # AI-powered assertions
├── reports/                 # Generated test reports
└── snapshots/               # Visual test snapshots
```

## Test Types Explained

### Core Tests
- **Auth Tests**: Login, signup, OAuth, protected routes
- **Interview Tests**: AI interview simulation, question flow
- **Billing Tests**: Pricing, subscriptions, payment integration
- **API Tests**: Endpoint health, response validation

### Quality Tests
- **Performance**: Load times, FCP, bundle size, memory usage
- **Accessibility**: WCAG compliance, ARIA, keyboard nav, contrast
- **Security**: XSS, CSRF, SQL injection, headers, rate limiting

### UI Tests
- **Components**: Buttons, cards, modals, forms, navigation
- **Visual**: Responsive design, dark mode, fonts, animations

### Flow Tests
- **E2E**: Complete user journeys from start to finish
- **Integration**: Frontend-backend, auth, database, payments

### AI Tests
- **Exploratory**: AI-driven intelligent exploration with edge case detection

## How It Works

The AI test suite uses Llama 3.1 8B to:
1. **Generate realistic test data** (user inputs, interview responses)
2. **Analyze UI/UX** for visual consistency and accessibility
3. **Validate conversational flows** in the interview simulator
4. **Review API responses** for correctness and edge cases
5. **Perform exploratory testing** by understanding context
6. **Suggest next test actions** based on current application state

## Environment Variables

Create a `.env` file in this folder:
```env
# Ollama Configuration
OLLAMA_HOST=http://localhost:11434

# Application URL
BASE_URL=http://localhost:3000

# Test User Credentials (create a test user)
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword123

# Supabase (optional)
# SUPABASE_URL=your_supabase_url
# SUPABASE_ANON_KEY=your_anon_key
```

## Test Reports

Reports are automatically saved to `/reports/` as JSON files with:
- Timestamp
- Duration
- Pass/fail counts per suite
- Detailed test results

## Tips

- Run `ollama serve` in a separate terminal before testing
- Use `test:category:core` for quick smoke tests
- Use `test:exploratory` for AI-powered edge case discovery
- Visual tests create snapshots in `/snapshots/`
