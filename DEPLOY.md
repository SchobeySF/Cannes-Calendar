# Deployment Guide

Since you are experiencing issues running `npm` locally, the best way to view and share your website is to deploy it to a cloud provider like **Vercel** or **Netlify**. These services will build your project in their cloud environment, bypassing your local restrictions.

## Option 1: Deploy via GitHub (Recommended)

1.  **Create a Repository on GitHub**
    *   Go to [github.com/new](https://github.com/new).
    *   Name it `cannes-calendar`.
    *   Create the repository.

2.  **Push your code**
    *   Run the commands shown by GitHub in your terminal (inside this folder):
    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/cannes-calendar.git
    git branch -M main
    git push -u origin main
    ```

3.  **Connect to Vercel**
    *   Go to [vercel.com](https://vercel.com) and Sign Up/Login.
    *   Click "Add New..." -> "Project".
    *   Select your `cannes-calendar` repository.
    *   Click **Deploy**.
    *   Vercel will detect it's a Vite app and handle everything automatically.

## Option 2: Drag & Drop (Netlify)

If you don't want to use git:

1.  Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2.  Drag this entire project folder (`Cannes Calendar Website`) onto the page.
3.  *Note: This might fail if Netlify expects a pre-built `dist` folder. Since we can't build locally, Option 1 is much safer.*

## Option 3: CodeSandbox / StackBlitz

You can also upload this project to an online IDE to run it immediately in the browser:

1.  Go to [codesandbox.io](https://codesandbox.io) or [stackblitz.com](https://stackblitz.com).
2.  Import from GitHub (after following Step 1 & 2 above).
3.  You will see the app running instantly.
