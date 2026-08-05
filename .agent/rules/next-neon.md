---
description: Constraints for Next.js and Neon development
globs: src/**/*.{ts,tsx}
---
# Next.js & Neon Development Rules
- **Server First**: Always use React Server Components (RSC) for data fetching.
- **Database**: Strictly use the '@neondatabase/serverless' driver. 
- **API**: Use the Gemini API via '@google/generative-ai'. Never suggest OpenAI.
- **Runtime**: Default to 'export const runtime = "edge"' for all API route handlers.
- **Styling**: Exclusively use Tailwind CSS utility classes. Avoid inline styles.
