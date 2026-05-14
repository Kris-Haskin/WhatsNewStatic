# Instagram Graph API Setup Guide
### For WhatsNewStatic — TV Slideshow App

---

## Overview

This guide walks through connecting a client's Instagram Business account to the Meta Graph API so that posts can be fetched and displayed in the WhatsNewStatic slideshow app. You will end up with a long-lived access token and an Instagram User ID to put in the app's `.env` file.

**Time estimate:** 30–45 minutes if everything goes smoothly.

**What you need before starting:**
- Access to the client's Instagram account (logged in on a phone)
- Access to the client's Facebook account (logged in on a desktop browser)
- Access to the WhatsNewStatic project's `.env` file

---

## PART 1 — Instagram Account Setup

### Step 1: Upgrade Instagram to a Professional (Business) Account

The Instagram Graph API does not work with personal accounts. The account must be set to **Business** type.

1. Open the **Instagram app** on the client's phone
2. Go to **Profile** (bottom right)
3. Tap the **hamburger menu** (three lines, top right)
4. Tap **Settings**
5. Tap **Account**
6. Scroll down and tap **Switch to Professional Account**
7. Choose **Business** (not Creator)
8. Follow the prompts — category doesn't matter much, choose something generic like "App Page" or "Local Business"

### Step 2: Create a Facebook Page

The Instagram Graph API requires the Instagram account to be linked to a Facebook Page. If the client doesn't have one:

1. On desktop, go to [facebook.com](https://facebook.com) and log in
2. Click the **Pages** section in the left sidebar (or go to facebook.com/pages/create)
3. Click **Create New Page**
4. Give it a name — something like "[Client Name] Demo" or their actual business name
5. Fill in minimal info and click **Create**

> **Note:** Facebook will warn you that "page health needs work" — this is about filling in hours, phone numbers, etc. You can ignore this. It does not affect API access.

### Step 3: Link the Instagram Account to the Facebook Page

1. On the phone, go to Instagram **Settings ? Account ? Linked Accounts** (on newer versions: **Settings ? Business ? Connected Facebook Page**)
2. Select the Facebook Page you just created
3. Confirm the connection

---

## PART 2 — Meta Developer App Setup

All of this is done at [developers.facebook.com](https://developers.facebook.com) on desktop, logged in with the client's Facebook account.

### Step 4: Create the Meta Developer App

1. Click **My Apps** (top right)
2. Click **Create App**
3. When asked what your app will do, choose **"Other"** or **"None of these"**
4. Click **Next**
5. For app type, choose **Business**
6. Click **Next**
7. Fill in:
   - **App name:** Something like `[ClientName]WhatsNew`
   - **App contact email:** Your email or client's email
8. Click **Create App**

You will land on the app dashboard.

### Step 5: Add the Instagram Use Case

1. On the dashboard, click **"+ Add use cases"**
2. Scroll through the list and find **"Manage messaging & content on Instagram"**
3. Check the checkbox next to it
4. Click **Save**
5. You will be back on the Use Cases screen — click **Customize** next to the Instagram one
6. In the left sidebar, click **"API setup with Facebook login"**
7. Under **"Manage content on Instagram"**, click **"Add required content permissions"**
8. A green success message will briefly appear — that's all you need here

### Step 6: Add Yourself as a Tester

Because the app is in Development mode (not published), only testers can generate tokens.

1. In the left sidebar, click **App roles ? Roles**
2. Click the **Testers** tab
3. Click **Add People** (blue button, top right)
4. Search for and add the client's Facebook account (or your own if you're using your own account)
5. Click **Submit**

### Step 7: Accept the Tester Invitation on Instagram

1. Open the **Instagram app** on the phone
2. Go to **Profile ? Settings ? Account**
3. Look for **Tester Invites** or **Apps and Websites**
4. Accept the invitation from the app you just created

Back on the developer portal, the tester status should change from "Pending" to active.

---

## PART 3 — Generating the Access Token

### Step 8: Generate a Short-Lived Token

1. On the developer portal, go to **Tools ? Graph API Explorer** (top menu)
2. On the right side, make sure your app is selected in the **Meta App** dropdown
3. Click **"Add a Permission"** and add ALL of the following:
   - `instagram_basic`
   - `instagram_content_publishing`
   - `pages_show_list`
   - `pages_read_engagement`
   - `business_management`
4. Click **Generate Access Token**
5. Log in and approve all requested permissions when prompted
6. Copy the token that appears in the Access Token field — this is your **short-lived token** (expires in ~1 hour)

### Step 9: Exchange for a Long-Lived Token (60 days)

You need three things:
- **App ID** — found under App Settings ? Basic
- **App Secret** — found under App Settings ? Basic (click Show to reveal)
- **Short-lived token** — from Step 8

Open a new browser tab and paste this URL, substituting your values:

```
https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_SHORT_LIVED_TOKEN
```

Hit Enter. You should get a JSON response like this:

```json
{
  "access_token": "EAABsbCS...very long string...",
  "token_type": "bearer",
  "expires_in": 5183944
}
```

**Copy only the `access_token` value** (the long string, no quotes). This is your **long-lived token**, good for 60 days.

> **Troubleshooting:** If you get "Invalid OAuth access token - Cannot parse access token", the short-lived token likely expired (they only last 1 hour). Go back to the Graph API Explorer and generate a fresh one, then retry.

---

## PART 4 — Get the Instagram User ID

Open a new browser tab and paste this URL with your long-lived token:

```
https://graph.facebook.com/v18.0/me/accounts?fields=id,name,instagram_business_account&access_token=YOUR_LONG_LIVED_TOKEN
```

You should get back something like:

```json
{
  "data": [
    {
      "id": "1133583333164153",
      "name": "Client Page Name",
      "instagram_business_account": {
        "id": "17841454455327922"
      }
    }
  ]
}
```

The **`id` inside `instagram_business_account`** is your Instagram User ID. Save this.

> **Troubleshooting:** If `data` is empty, the token is missing `pages_show_list` or `pages_read_engagement`. Go back to Graph API Explorer, confirm those permissions are added, regenerate the token, and repeat the exchange step.

---

## PART 5 — Verify It Works

Paste this URL in a browser tab to confirm posts are accessible:

```
https://graph.facebook.com/v18.0/YOUR_INSTAGRAM_USER_ID/media?fields=id,caption,media_type,media_url,timestamp&access_token=YOUR_LONG_LIVED_TOKEN
```

You should see the client's recent posts in the JSON response.

---

## PART 6 — Update the App

### Update `.env`

Add or update these two lines in the project's `.env` file:

```
INSTAGRAM_ACCESS_TOKEN=your_long_lived_token_here
INSTAGRAM_USER_ID=your_instagram_user_id_here
```

Also update these in **Netlify's environment variables** (Netlify dashboard ? Site ? Environment variables) so the deployed version works too.

### `fetchInstagram.js`

The function is already written and in place. No code changes needed — just the `.env` values.

---

## PART 7 — Token Refresh (Important)

The long-lived token expires in **60 days**. Before it expires, refresh it by calling:

```
https://graph.facebook.com/v18.0/oauth/access_token?grant_type=ig_refresh_token&access_token=YOUR_CURRENT_LONG_LIVED_TOKEN
```

This returns a new token with a fresh 60-day window. Update the `.env` file and Netlify environment variable with the new token.

> **Best practice:** Set a calendar reminder for 50 days after setup to refresh the token before it expires.

---

## Quick Reference

| Item | Where to find it |
|------|-----------------|
| App ID | Meta Developer Portal ? App Settings ? Basic |
| App Secret | Meta Developer Portal ? App Settings ? Basic ? Show |
| Short-lived token | Graph API Explorer ? Generate Access Token |
| Long-lived token | Exchange URL (Step 9) |
| Instagram User ID | `/me/accounts` URL (Part 4) |
| Token expiry | 60 days from exchange date |

---

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "Cannot parse access token" | Token expired or malformed | Regenerate short-lived token in Graph API Explorer, redo exchange |
| `data: []` on `/me/accounts` | Missing page permissions | Add `pages_show_list`, `pages_read_engagement` in Explorer, regenerate |
| "nonexisting field instagram_business_account" | Token is a user token, not a page token | Use `/me/accounts` endpoint, not `/me` directly |
| Instagram slides missing from slideshow | `Array.isArray` check failing | Confirm `fetchInstagram` endpoint returns a JSON array, not an error object |
| "Session has expired" | Long-lived token expired | Redo Steps 8–9 to get a fresh token |
