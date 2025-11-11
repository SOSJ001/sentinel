# Sentinel - Real-Time Solana Wallet Monitoring Tool

A professional-grade blockchain forensics platform for real-time monitoring, transaction tracing, and evidence collection on the Solana blockchain.

## Features

- 🚨 **Real-Time Monitoring**: Track suspicious transactions as they happen
- 🔍 **Transaction Tracing**: Follow funds through complex, multi-hop networks
- 🎯 **Pattern Detection**: Automatically identify money laundering patterns
- 📊 **Evidence Collection**: Maintain forensically sound chain of custody
- ⚡ **Instant Alerts**: Receive notifications within seconds of suspicious activity
- 🔐 **Cryptographic Integrity**: SHA-256 hashing for evidence verification

## Quick Start

### Prerequisites

- Node.js v18 or higher
- Solana CLI tools (for local testing)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone [repository-url]
cd sentinel

# Install dependencies
npm install

# Configure test wallets (see LAB_DOCUMENTATION.md)
# Edit src/test/config/attack-wallets.ts and src/test/config/private-keys.ts

# Start local Solana validator (Terminal 1)
solana-test-validator --log

# Start development server (Terminal 2)
npm run dev
```

Open `http://localhost:5173` in your browser.

## Testing

### Run Attack Simulations

```bash
# Test connection
npm run test:connection

# Run comprehensive multi-stage attack
npm run attack:comprehensive

# Or test individual patterns
npm run attack:high-value
npm run attack:rapid
npm run attack:fan-out
npm run attack:circular
```

### Run Unit Tests

```bash
npm run test:run          # All tests
npm run test:ui           # Visual test runner
npm run test:coverage     # Coverage report
```

## Documentation

- **[LAB_DOCUMENTATION.md](./LAB_DOCUMENTATION.md)** - Complete setup and validation guide
- **[TESTING.md](./TESTING.md)** - Unit testing documentation

## Project Structure

```
sentinel/
├── src/
│   ├── lib/
│   │   ├── components/     # UI components
│   │   ├── services/       # Core business logic
│   │   └── types/          # TypeScript definitions
│   ├── routes/             # SvelteKit pages
│   └── test/               # Test infrastructure
│       ├── config/         # Test wallet configuration
│       └── scripts/        # Attack simulation scripts
├── package.json
├── TESTING.md
└── LAB_DOCUMENTATION.md
```

## Architecture

Built with:

- **SvelteKit** for the UI framework
- **Solana Web3.js** for blockchain interaction
- **TypeScript** for type safety
- **Vitest** for testing
- **TailwindCSS** for styling

## License

[Your License Here]

## Contributing

[Contributing Guidelines]

## Support

For questions or issues, please refer to the documentation or open an issue.
