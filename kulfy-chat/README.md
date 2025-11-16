# 💬 Kulfy Chat - AI Chat Interface

This is the Kulfy AI Chat interface, built with [assistant-ui](https://github.com/assistant-ui/assistant-ui) - an actively maintained open-source TypeScript/React library for building production-grade AI chat experiences.

## 📊 Project Stats

- **Library**: [assistant-ui](https://github.com/assistant-ui/assistant-ui) v0.11.28
- **GitHub Stars**: 7.3k+
- **Commits**: 2,242+
- **License**: MIT
- **Status**: Actively Maintained

## ✨ Features

- ✅ **ChatGPT-like UX** - Production-grade AI chat experience
- ✅ **Streaming Support** - Real-time message streaming with auto-scroll
- ✅ **Thread Management** - Organize conversations into threads
- ✅ **Markdown Rendering** - Rich text and code highlighting with syntax highlighting
- ✅ **Composable Components** - Fully customizable UI primitives (Radix-style)
- ✅ **Multiple AI Models** - Supports OpenAI, Anthropic, Mistral, and more
- ✅ **Accessibility** - Built-in keyboard shortcuts and a11y support
- ✅ **Dark Mode** - Full dark mode support with Tailwind CSS

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- OpenAI API key (or other supported AI provider)

### Installation

1. **Install dependencies:**

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

2. **Configure environment variables:**

Create a `.env.local` file in the `kulfy-chat/` directory. You can copy from the example file:

```bash
# Copy the example file
cp env.example .env.local

# Edit with your OpenAI API key
nano .env.local
# or
code .env.local
```

**Required Environment Variables:**

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key (required) | `sk-...` |

**Optional Environment Variables:**

| Variable | Description | Default | Options |
|----------|-------------|---------|---------|
| `OPENAI_MODEL` | OpenAI model to use | `gpt-4o-mini` | `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `gpt-3.5-turbo` |
| `NEXT_PUBLIC_ASSISTANT_BASE_URL` | Assistant Cloud URL for chat persistence | - | Get from [cloud.assistant-ui.com](https://cloud.assistant-ui.com) |

**Example `.env.local` file:**

```bash
# Required
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: Choose your model
# gpt-4o-mini: Cost-effective, good quality (default)
# gpt-4o: Best quality, higher cost
# gpt-4-turbo: Balanced quality and cost
# gpt-3.5-turbo: Fastest, lower cost
OPENAI_MODEL=gpt-4o-mini

# Optional: Chat Persistence (Assistant Cloud)
# Enable chat history by signing up at: https://cloud.assistant-ui.com
# NEXT_PUBLIC_ASSISTANT_BASE_URL=https://your-instance.assistant-ui.com
```

3. **Start the development server:**

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. **Open your browser:**

Navigate to [http://localhost:3000](http://localhost:3000) to see the chat interface.

## 📁 Project Structure

```
kulfy-chat/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # Chat API endpoint (Vercel AI SDK)
│   ├── assistant.tsx             # Main assistant component
│   ├── page.tsx                  # Chat page
│   ├── layout.tsx                # Root layout with sidebar
│   └── globals.css                # Global styles
├── components/
│   ├── assistant-ui/             # Custom assistant-ui components
│   │   ├── attachment.tsx        # File attachment component
│   │   ├── markdown-text.tsx     # Markdown renderer
│   │   ├── thread-list.tsx       # Thread list sidebar
│   │   ├── thread.tsx             # Individual thread component
│   │   └── tool-fallback.tsx     # Tool call fallback UI
│   └── ui/                       # shadcn/ui style components
│       ├── avatar.tsx
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── sidebar.tsx
│       └── ...
├── hooks/
│   └── use-mobile.ts             # Mobile detection hook
├── lib/
│   └── utils.ts                  # Utility functions (cn, etc.)
├── components.json                # shadcn/ui config
├── package.json                  # Dependencies
└── tsconfig.json                 # TypeScript config
```

## 🛠️ Tech Stack

- **UI Library**: [@assistant-ui/react](https://github.com/assistant-ui/assistant-ui) v0.11.28
- **AI SDK**: [Vercel AI SDK](https://sdk.vercel.ai/) with OpenAI adapter
- **Framework**: Next.js 15.5.4 (App Router)
- **React**: React 19.2.0
- **Styling**: Tailwind CSS v4
- **Components**: Radix UI primitives
- **Markdown**: React Markdown with [react-shiki](https://github.com/shikijs/react-shiki) for syntax highlighting
- **State Management**: Zustand
- **Animations**: Framer Motion

## 📚 Documentation

- **assistant-ui Official Docs**: https://www.assistant-ui.com
- **GitHub Repository**: https://github.com/assistant-ui/assistant-ui
- **Community Discord**: https://discord.gg/assistant-ui
- **Vercel AI SDK Docs**: https://sdk.vercel.ai/docs

## 🔧 Customization

The chat interface is built with composable primitives, allowing you to customize every aspect:

- **Styling**: Modify Tailwind classes in component files
- **Components**: Customize components in `components/assistant-ui/`
- **API**: Modify `app/api/chat/route.ts` to change AI model or add custom logic
- **Layout**: Update `app/layout.tsx` and `app/page.tsx` for layout changes

## 🚢 Deployment

This project can be deployed to Vercel, Netlify, or any platform that supports Next.js:

```bash
# Build for production
npm run build

# Start production server
npm start
```

For Vercel deployment, see the main [Kulfy README](../README.md#deployment).

## 📝 License

MIT License - See [assistant-ui LICENSE](https://github.com/assistant-ui/assistant-ui/blob/main/LICENSE)

## 🙏 Credits

Built with [assistant-ui](https://github.com/assistant-ui/assistant-ui) by the assistant-ui team.
