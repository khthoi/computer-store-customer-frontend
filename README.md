# computer-store-frontend

## Overview
Customer-facing storefront for an online computer & hardware retail platform.
Single-vendor B2C model. Tech: Next.js 16 App Router, TypeScript, TailwindCSS.

## Shared UI
This repo uses @computer-store/ui (shared package with computer-store-admin).
DO NOT recreate components that exist in the shared package.
Run: node_modules/@computer-store/ui/src/components/ to see what is available.

## Quick Start
git clone <repo-url> && cd computer-store-frontend
cp .env.example .env.local && npm install && npm run dev
# → http://localhost:3000

## Environment Variables
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret

## AI Development — READ FIRST
If you are an AI assistant, follow this order:
1. .ai/CODING_RULES.md          ← mandatory rules
2. .ai/SYSTEM_ARCHITECTURE.md   ← architecture + shared UI strategy
3. .ai/DESIGN_SYSTEM.md         ← design tokens
4. .ai/ICON_SYSTEM.md            ← icon rules
5. .ai/COMPONENT_GUIDELINES.md  ← when to use shared vs local
6. .ai/FEATURE_SPEC.md          ← feature you are building
7. .ai/API_CONTRACT.md          ← endpoint + types
8. .ai/AI_DEVELOPMENT_GUIDE.md  ← step-by-step workflow
