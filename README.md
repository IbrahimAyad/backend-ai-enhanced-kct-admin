README.md (for the new repository)
markdown# KCT Menswear - AI-Enhanced Backend Admin

## Overview
AI-enhanced e-commerce platform for KCT Menswear with specialized coding agents for development.

## Project Structure
├── src/                    # Frontend source code
├── supabase/              # Backend functions and migrations
├── code-agents/           # AI coding agent prompts
├── docs/                  # Project documentation
└── tests/                 # Test suites

## Coding Agents
This project uses specialized AI coding agents:
- **Master Orchestrator**: Coordinates between agents
- **Database & Infrastructure**: Database and backend operations
- **Business Operations**: Orders, payments, inventory
- **Customer Experience**: Frontend and UI/UX
- **Analytics & Intelligence**: Reporting and insights
- **Security & Quality**: Authentication and testing
- **Integration & Automation**: External services

## Quick Start
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start development server
npm run dev

# Run tests
npm test
Deployment

Staging: Push to develop branch
Production: Push to main branch

Contributing

Create feature branch from develop
Use appropriate coding agent for changes
Submit PR with tests
Await code review