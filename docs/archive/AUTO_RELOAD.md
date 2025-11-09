# 🔄 Auto-Reload Configuration

Your Kulfy app now has **automatic server restart** when environment files change!

## ✅ What's Configured

- **Nodemon** installed for watching file changes
- **Auto-restart** when `.env.local` or `.env` files change
- **Next.js Fast Refresh** still works for code changes

## 🚀 How to Use

### Option 1: Auto-Reload Mode (Recommended)

Use this when you're frequently changing environment variables:

```bash
npm run dev:watch
```

This will:
- ✅ Start the Next.js dev server
- ✅ Watch for changes in `.env.local` and `.env`
- ✅ Automatically restart when env files change
- ✅ Keep Next.js Fast Refresh for code changes

### Option 2: Normal Mode

Use this for regular development:

```bash
npm run dev
```

This is the standard Next.js dev server (requires manual restart for `.env` changes).

## 📋 What Auto-Restarts

With `npm run dev:watch`:

| File Type | Auto-Restart? |
|-----------|---------------|
| `.env.local` | ✅ Yes |
| `.env` | ✅ Yes |
| `.ts`, `.tsx` files | 🔥 Hot Reload (Fast Refresh) |
| `page.tsx`, `layout.tsx` | 🔥 Hot Reload |
| `route.ts` (API routes) | 🔥 Hot Reload |
| `lib/*`, `models/*` | 🔥 Hot Reload |

## 🎯 Use Cases

### When to use `npm run dev:watch`:
- ✅ Testing different Pinata credentials
- ✅ Switching between MongoDB databases
- ✅ Changing environment configuration
- ✅ Debugging environment variable issues

### When to use `npm run dev`:
- ✅ Normal development (code changes only)
- ✅ When you don't need to change env variables
- ✅ Slightly faster startup (no nodemon overhead)

## 🔧 Configuration

The `nodemon.json` file controls what gets watched:

```json
{
  "watch": [".env.local", ".env"],
  "exec": "next dev",
  "ext": "local,env"
}
```

You can customize this to watch other files if needed.

## 💡 Tips

1. **First Time Setup**: Use `npm run dev:watch` until everything works
2. **Production**: Always use `npm run build` and `npm start` (no nodemon)
3. **Fast Refresh**: Code changes still hot reload instantly
4. **Environment Changes**: Server restarts automatically (takes ~3-5 seconds)

## 🐛 Troubleshooting

### Server keeps restarting
- Check if you have file watchers running that modify `.env.local`
- Check for IDE auto-save features that might trigger restarts

### Changes not detected
```bash
# Stop the server (Ctrl+C)
# Clear nodemon cache
npx nodemon --clear-cache

# Restart
npm run dev:watch
```

### Want to watch more files?

Edit `nodemon.json`:
```json
{
  "watch": [".env.local", ".env", "other-config.json"],
  "exec": "next dev"
}
```

## 📝 Commands Summary

```bash
# Regular dev server (manual restart for env changes)
npm run dev

# Auto-reload dev server (restarts on env changes)
npm run dev:watch

# Production build
npm run build

# Production server
npm start

# Linting
npm run lint
```

## 🎉 Example Workflow

```bash
# 1. Start with auto-reload
npm run dev:watch

# 2. Update .env.local with new Pinata JWT
# → Server restarts automatically ✅

# 3. Edit code in app/upload/page.tsx
# → Hot reloads instantly 🔥

# 4. Update MongoDB URI in .env.local
# → Server restarts automatically ✅

# 5. Everything just works! 🍦
```

---

**Recommended**: Use `npm run dev:watch` while setting up and testing! 🚀

