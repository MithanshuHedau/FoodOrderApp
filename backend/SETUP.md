# Backend Setup Guide

## 🚀 Quick Setup

### 1. Create Environment File

Create a `.env` file in the backend directory with the following content:

```env
# Server Configuration
PORT=3000

# MongoDB Connection
MONGO_URL=mongodb://localhost:27017/foodorder

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production

# Cloudinary Configuration (for image uploads)
cloud_name=your_cloudinary_cloud_name
api_key=your_cloudinary_api_key
api_secret=your_cloudinary_api_secret
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start MongoDB

Make sure MongoDB is running on your system.

### 4. Start the Server

```bash
npm run dev
```

## 🔧 Environment Variables Explained

- **PORT**: Server port (default: 3000)
- **MONGO_URL**: MongoDB connection string
- **JWT_SECRET**: Secret key for JWT tokens
- **cloud_name, api_key, api_secret**: Cloudinary credentials for image uploads

## 🧪 Testing the API

1. **Test Backend Connection**: `GET http://localhost:3000/test`
2. **Test Public Restaurants**: `GET http://localhost:3000/public/restaurants`
3. **Test Auth Route**: `GET http://localhost:3000/auth/`

## 🐛 Troubleshooting

### Common Issues:

1. **MongoDB Connection Error**: Make sure MongoDB is running
2. **JWT Error**: Check if JWT_SECRET is set in .env
3. **CORS Error**: Frontend should be on port 5173
4. **Port Already in Use**: Change PORT in .env file

### Check Logs:

- Backend console shows connection status
- Frontend browser console shows API errors
- Use `/test-api` route in frontend for debugging
