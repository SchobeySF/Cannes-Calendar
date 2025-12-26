# Deployment Guide

Since you are on a restricted corporate machine, you cannot run deployment commands locally.
We will set up **GitHub Actions** to build and deploy your site automatically whenever you push code to GitHub.

## Step 1: Push your code to GitHub

If you haven't already:
1.  Create a new repository at [github.com/new](https://github.com/new) named `cannes-calendar`.
2.  Push your code (if git is allowed):
    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/cannes-calendar.git
    git branch -M main
    git push -u origin main
    ```
    *(If git is also blocked, you can manually upload files on the GitHub website, but ensure the `.github/workflows` folder is included)*.

## Step 2: Get Firebase Service Account Key

1.  Go to the [Firebase Console Service Accounts](https://console.firebase.google.com/project/cannes-house/settings/serviceaccounts/adminsdk).
2.  Click **Generate new private key**.
3.  This will download a `.json` file containing your credentials. **Open this file and copy existing content**.

## Step 3: Add Secret to GitHub

1.  Go to your GitHub Repository page.
2.  Click **Settings** > **Secrets and variables** > **Actions**.
3.  Click **New repository secret**.
4.  **Name**: `FIREBASE_SERVICE_ACCOUNT_CANNES_HOUSE`
5.  **Secret**: Paste the entire content of the JSON file you downloaded.
6.  Click **Add secret**.

## Step 4: Trigger Deployment

1.  Make a small change to any file (e.g., add a space to `README.md`) and push it to GitHub.
2.  Go to the **Actions** tab in your GitHub repository.
3.  You should see a workflow running. Once it completes (green checkmark), your site is live!
