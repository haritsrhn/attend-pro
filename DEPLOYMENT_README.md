## Production Deployment Guide (Vercel + Supabase)

This guide explains how to take this local Next.js + Prisma attendance app and deploy it to production using GitHub, Supabase (Postgres), and Vercel.

---

### 1. Push the project to GitHub

1. **Create a new Git repository (if not already):**
   ```bash
   cd /path/to/attend_pro
   git init
   git add .
   git commit -m "Initial commit for AttendPro"
   ```

2. **Create a new empty repository on GitHub.**
   - Go to GitHub, click **New repository**.
   - Choose a name (e.g. `attend-pro`) and leave it empty (no README/License).

3. **Connect your local repo to GitHub:**
   ```bash
   git remote add origin git@github.com:<your-username>/<your-repo>.git
   git push -u origin main
   ```
   > If your default branch is `master`, replace `main` with `master`.

---

### 2. Create a Postgres database on Supabase

1. Go to [https://supabase.com](https://supabase.com) and create/sign in to your account.
2. Create a **new project**:
   - Choose a name and region.
   - Supabase will provision a Postgres database for you.
3. Once the project is ready, open **Project Settings → Database → Connection string**.
4. Copy the **`connection string`** for Node/Postgres, which will look like:
   ```text
   postgres://USER:PASSWORD@HOST:PORT/DATABASE
   ```

You will use this value for `DATABASE_URL` in your environment variables.

---

### 3. Configure environment variables

In Vercel you will configure the same variables defined in `.env.example`:

- `DATABASE_URL` – your Supabase Postgres connection string.
- `NEXTAUTH_URL` – the URL of your deployed app, e.g. `https://attendpro.vercel.app`.
- `NEXTAUTH_SECRET` – a long random string for NextAuth.
  - Generate one locally:
    ```bash
    openssl rand -hex 32
    ```

Locally, you can create a `.env` file by copying `.env.example`:

```bash
cp .env.example .env
# then open .env and fill in DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET
```

---

### 4. Connect the repo to Vercel

1. Go to [https://vercel.com](https://vercel.com) and sign in.
2. Click **New Project** and import the GitHub repository you created.
3. In the **Environment Variables** section for the project:
   - Add:
     - `DATABASE_URL` = your Supabase connection string.
     - `NEXTAUTH_URL` = `https://<your-vercel-project>.vercel.app`
     - `NEXTAUTH_SECRET` = the generated secret from above.
4. Leave other settings at defaults (framework: **Next.js**).
5. Click **Deploy**.

Because `package.json` has `"postinstall": "prisma generate"`, Vercel will automatically generate the Prisma Client during the build step.

---

### 5. Run a production build check locally (recommended)

Before pushing or deploying, run a production build in your local environment:

```bash
npm install
npm run build
```

Fix any TypeScript or runtime errors reported by the build. Once the build succeeds locally, your Vercel deployment is much more likely to succeed as well.

