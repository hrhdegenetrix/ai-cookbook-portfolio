# 🚀 Quick Setup Guide

Follow these steps to get your AI Recipe Generator up and running!

## 1. Install Dependencies

```bash
npm run install-all
```

This will install all dependencies for both frontend and backend.

## 2. Set Up Environment Variables

Create a `.env` file in the `backend/` directory with the following content:

```
OPENAI_API_KEY=your_actual_openai_api_key_here
PORT=5000
```

### Getting Your OpenAI API Key:
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key and paste it in your `.env` file

## 3. Start the Development Servers

```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend development server on `http://localhost:3000`

## 4. Open Your Browser

Navigate to `http://localhost:3000` and start generating recipes!

## 🔧 Troubleshooting

### Common Issues:

**Port already in use:**
- Change the PORT in `backend/.env` to a different number (e.g., 5001)

**OpenAI API errors:**
- Make sure your API key is correct
- Check that you have credits available in your OpenAI account

**Dependencies not installing:**
- Make sure you have Node.js v14 or higher installed
- Try deleting `node_modules` folders and running `npm run install-all` again

## 📱 Testing the App

1. Enter some ingredients (e.g., "chicken", "rice", "vegetables")
2. Set the number of servings
3. Click "Generate Recipe"
4. Try exporting the recipe as a PDF!

Need help? Check the main README.md for more detailed information. 