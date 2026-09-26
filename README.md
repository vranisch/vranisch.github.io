# Vranis Christos website

Static website with owner-created username/password accounts (and existing email accounts) powered by Supabase Auth.

## Enable accounts

1. Create a Supabase project and enable the Email provider under Authentication.
2. Under Authentication → Sign In / Providers, turn OFF **Allow new users to sign up** and save. This server setting is required: removing the sign-up form alone does not block API registration. Keep the Email provider enabled. Set a minimum password length of at least 8.
3. In Authentication → URL Configuration, set the Site URL to `https://vranisch.github.io/account.html` and add `https://vranisch.github.io/account.html` to allowed redirect URLs. For local testing, also add `http://localhost:8000/account.html`.
4. Fill in `url` and `publishableKey` in `assets/auth-config.js` using the project URL and public publishable (or legacy anon) key. Never put secret/service_role keys in this repository.
5. Configure SMTP in Supabase for production confirmation and recovery emails.
6. Publish the files to GitHub Pages.

Accounts remain visibly unavailable until credentials are configured. Users are managed in Supabase → Authentication → Users; no custom database table is required.

## Create a username account

1. Choose 3–32 lowercase ASCII letters, digits or underscores, e.g. `testuser`.
2. In Supabase → Authentication → Users → Add user → Create new user, enter `testuser@users.vranisch.github.io`, choose a strong password and enable **Auto Confirm User**.
3. Give the user their username (`testuser`) and initial password privately. On the site they enter only the username and password. They can change the password after signing in.

The email-shaped identifier is internal, not a mailbox. Do not send invitations or recovery emails to it. Forgotten passwords for these accounts require an administrator reset through Supabase's server-side Admin API or management tools. Never expose an admin key in the site. Existing real-email accounts can still sign in and recover passwords using email; their email local part is not automatically a username. Usernames are case-insensitive. Public signup must remain disabled.

## Local preview

Run `python3 -m http.server 8000` and visit `http://localhost:8000`.

## Verify with a configured project

- Check `/auth/v1/settings` returns `disable_signup: true` before publishing.
- Create a username account as above and verify sign-in, case-insensitive username handling, and password changes.
- For a real-email account, in Authentication → Users → Add user → Send invitation, invite an email you control. Follow the invite link, set a password on the account page, sign out, and sign in again.
- Review any users created before public signup was disabled; disabling signup does not remove existing accounts.
- Refresh and navigate between pages; the header should say “My account”.
- Sign out and verify the guest form returns; check incorrect credentials show an error.
- Request a password reset and follow the email link. Set a new password and verify it works.
- Check keyboard navigation and the account link on a narrow screen.

This is a public static site: signing in does not make existing HTML private. Future private data needs server-side authorization / Supabase Row Level Security.

`assets/supabase.js` vendors @supabase/supabase-js 2.57.4 (MIT), from https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/dist/umd/supabase.js.
Auth API documentation: https://supabase.com/docs/reference/javascript/auth-onauthstatechange
