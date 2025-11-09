# 🚀 Kulfy Deployment Guide for Vercel

## Quick Deploy Steps

### 1. Pre-Deployment Checklist

- [ ] Local build succeeds: `npm run build`
- [ ] All environment variables documented
- [ ] Code pushed to GitHub
- [ ] MongoDB Atlas network access configured
- [ ] Pinata credentials ready

### 2. Environment Variables for Vercel

Copy these to Vercel Dashboard → Project Settings → Environment Variables:

```
MONGODB_URI=mongodb+srv://girishkolluri_db_user:QlEuajJi4ZadokyH@kulfycluster.et4uacl.mongodb.net/kulfy?retryWrites=true&w=majority&appName=kulfycluster

PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJhNDRhZDJjZi1jZjVmLTQ0MDYtOGQzMC0xNzAzMWM3ZGRiOWIiLCJlbWFpbCI6ImdpcmlzaC5rb2xsdXJpQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiJjYjM2NGNiZjUxM2Q0ZmVkNGVjMiIsInNjb3BlZEtleVNlY3JldCI6ImU3ZWZiMmQ0MTI3OGMwNTZlNjYyNTk4NDE5YzllYWM4YTQyN2ZjYTJlMGE1Nzc1NzRlYTVmYjhkODMyZGU4OGQiLCJleHAiOjE3OTQxNzg4MTB9.q6cIpKeMhnpUNibF-uODIzI0nhrkNz4BvNk68d6pLvI

PINATA_GATEWAY=white-immense-bedbug-311.mypinata.cloud

PINATA_GATEWAY_KEY=Y7nATUn2NRrhdim6WrN_UxgJT2DOQw6lGPlMjgpCwQy_wK5nUtd0tppLgfYBvHvL

NEXT_PUBLIC_PINATA_GATEWAY=white-immense-bedbug-311.mypinata.cloud

NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**Note**: Update `NEXT_PUBLIC_APP_URL` after first deployment!

### 3. MongoDB Atlas Configuration

1. Go to MongoDB Atlas → Network Access
2. Add IP: `0.0.0.0/0` (Allow from anywhere)
3. Confirm and save

### 4. Deploy Steps

#### Via Vercel Dashboard:
1. Go to [vercel.com](https://vercel.com)
2. New Project → Import from GitHub
3. Select `kulfy-ai` repository
4. Add all environment variables from Step 2
5. Click Deploy
6. Wait for build to complete

#### Via CLI:
```bash
npm i -g vercel
vercel login
vercel --prod
```

### 5. Post-Deployment

1. Copy deployment URL (e.g., `https://kulfy-ai.vercel.app`)
2. Update `NEXT_PUBLIC_APP_URL` in Vercel settings
3. Trigger redeploy (Vercel Dashboard → Deployments → Redeploy)

### 6. Test Production

Visit these URLs (replace with your domain):

- **Upload**: https://kulfy-ai.vercel.app/upload
- **Admin**: https://kulfy-ai.vercel.app/admin
- **Feed**: https://kulfy-ai.vercel.app/feed

Test workflow:
1. Upload an image
2. Go to admin and approve it
3. Check it appears in feed

### 7. Troubleshooting

#### Build Fails
- Check Vercel logs for errors
- Ensure all dependencies are in `package.json`
- Test local build: `npm run build`

#### MongoDB Connection Error
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas allows `0.0.0.0/0`
- Verify database user permissions

#### Images Don't Load (429 errors)
- Ensure `NEXT_PUBLIC_PINATA_GATEWAY` is set
- Use dedicated gateway, not public gateway
- Check Pinata dashboard for usage limits

#### Environment Variables Not Working
- Make sure client-side vars have `NEXT_PUBLIC_` prefix
- Redeploy after changing env vars
- Clear browser cache

## Production Optimization Tips

### Performance
- Images are optimized with Next.js Image component
- API routes use Node.js runtime for better MongoDB performance
- SWC minification enabled

### Security
- Environment variables are server-side only (except `NEXT_PUBLIC_*`)
- MongoDB connection pooling configured
- Input validation with Zod

### Monitoring
- Check Vercel Analytics for performance metrics
- Monitor MongoDB Atlas metrics
- Review Pinata usage dashboard

## Continuous Deployment

Every push to `main` branch automatically deploys to production!

```bash
git add .
git commit -m "Update feature"
git push origin main
# Vercel automatically deploys! 🎉
```

## Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXT_PUBLIC_APP_URL` to your custom domain
5. Redeploy

---

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review MongoDB Atlas logs
3. Check Pinata dashboard
4. Refer to main [README.md](./README.md) troubleshooting section

Happy deploying! 🚀

