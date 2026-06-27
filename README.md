# Smart Reader Frontend

This is the React (Vite) frontend for the Smart Reader application, designed to be deployed on Vercel.

## Requirements
- Node.js v18+

## Environment Variables
Create a `.env` file in the root directory and add the following variable:
```
VITE_API_URL=https://YOUR_BACKEND.hf.space/api/v1
```
*(If developing locally, point this to your local backend, e.g., `http://localhost:8080/api/v1`)*

## Local Development
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```

## Vercel Deployment
This repository is configured for easy deployment on Vercel.
- Connect your GitHub repository to Vercel.
- Set the `VITE_API_URL` environment variable in the Vercel project settings.
- Deploy!
