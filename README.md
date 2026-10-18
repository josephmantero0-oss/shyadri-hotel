# Hotel site: Vercel + Supabase

Guest page (greeting, WiFi, menu, rules, review link), full-page food ordering and toiletries/message requests that send by WhatsApp or SMS, an AI chat helper, and a password-protected Admin panel. Content is stored in your Supabase project, so edits in Admin are live for every guest.

```
public/                 the website (static files, served by Vercel)
  index.html  app.js  styles.css  config.js
supabase/
  schema.sql            database tables + security rules + your current content
  functions/ai-chat/    the AI assistant (Supabase Edge Function)
vercel.json             tells Vercel to serve /public
```

## 1. Supabase (about 10 minutes)

1. **Database:** open your project, go to SQL Editor, New query, paste all of `supabase/schema.sql`, click Run. (Run it once. It also loads the menu, rules, WiFi and order numbers from your current site.)
2. **Admin user:** Authentication > Users > Add user > Create new user. Enter your email and a strong password (tick auto-confirm if offered).
3. **Make that user an admin:** SQL Editor, run (use your email):
   ```sql
   insert into public.admins (user_id) select id from auth.users where email = 'YOUR_ADMIN_EMAIL';
   ```
4. **Turn off public sign-ups** in the Authentication settings, so only the user you created can log in.
5. **Anon key:** Project Settings > API > copy the `anon` `public` key and paste it into `public/config.js` (replace `PASTE_YOUR_ANON_PUBLIC_KEY_HERE`). The Supabase URL is already filled in.

## 2. AI assistant (Edge Function)

You need an Anthropic API key (console.anthropic.com). With the Supabase CLI:

```bash
npm i -g supabase            # or prefix the commands below with: npx
supabase login
supabase link --project-ref uvjqhfvxghtrvogdmzxz
supabase secrets set ANTHROPIC_API_KEY=your_key_here
supabase functions deploy ai-chat
```

No CLI? Dashboard > Edge Functions > Create a function named `ai-chat`, paste `supabase/functions/ai-chat/index.ts`, deploy, then add the secret `ANTHROPIC_API_KEY` under Edge Functions > Secrets.

The helper reads the live menu, rules, WiFi and notices from the database on every question, so it updates when you edit in Admin. Optional secret `AI_MODEL` changes the model (default `claude-haiku-5-5`; if you ever see model errors, set it to a model name your Anthropic account lists). Each guest message is billed to your Anthropic account.

## 3. Vercel

1. Push this folder to a GitHub repository (the `public/config.js` anon key is meant to be public).
2. Vercel > Add New > Project > import the repository. Framework preset: **Other**. Leave Build Command empty. Deploy. (`vercel.json` already points Vercel at `public`.)
   - Or from this folder: `npx vercel --prod`.
3. Copy your live URL, then in Supabase go to Authentication > URL Configuration: set **Site URL** to it and add it under **Redirect URLs**. This makes "Forgot password" emails return to your site.

## 4. Check it works

- Open the URL on a phone: greeting, WiFi, menu load.
- Tap **Admin**, sign in, change something, press **Save changes**, reload the page as a guest.
- **Admin > Ordering:** confirm the kitchen and front-desk WhatsApp numbers and that **Accept orders** is ticked.
- Place a test food order and a test toiletries request.
- Open the chat button and ask "What is the WiFi password?"
- Sign out, tap **Forgot password?**, check the email arrives.

## 5. NFC cards

Write your live Vercel URL (or your own domain added in Vercel > Settings > Domains) to each card.

## Notes

- Orders are sent from the guest's own WhatsApp/SMS app; they are not stored in the database and there is no staff dashboard.
- Supabase's built-in email sender is rate-limited. For frequent reset emails, add your own SMTP under Authentication settings.
- Password rules: at least 8 characters. Changing the password in Admin asks for the current one.
- Local preview: `npx serve public` (after filling `config.js`).
