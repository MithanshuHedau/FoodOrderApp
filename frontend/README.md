# FoodOrder Frontend

A modern, responsive React frontend for the FoodOrder food delivery platform.

## Features

- 🍕 **Restaurant Browsing**: Browse and search restaurants
- 🍽️ **Menu Management**: View restaurant menus with category filtering
- 🛒 **Shopping Cart**: Add items, manage quantities, and checkout
- 👤 **User Authentication**: Sign up, login, and profile management
- 📱 **Responsive Design**: Mobile-first design that works on all devices
- 🔐 **Protected Routes**: Secure user and admin areas
- 🎨 **Modern UI**: Clean, intuitive interface with smooth animations

## Tech Stack

- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **CSS3** - Custom CSS with CSS variables and modern features
- **React Icons** - Beautiful icon library

## Project Structure

```
src/
├── api/           # API configuration and endpoints
├── components/    # Reusable UI components
├── context/       # React context providers
├── pages/         # Page components
│   ├── admin/     # Admin panel pages
│   └── ...        # User pages
├── styles/        # CSS stylesheets
└── main.jsx       # App entry point
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## API Configuration

The frontend is configured to connect to a backend API running on `http://localhost:5000`. Update the `API_BASE_URL` in `src/api/api.js` if your backend runs on a different port or host.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Key Components

### Authentication

- **Login/Signup**: User authentication with form validation
- **Protected Routes**: Secure access to user-specific features
- **Admin Routes**: Role-based access control for administrators

### Restaurant Management

- **Restaurant List**: Browse all available restaurants
- **Restaurant Detail**: View restaurant information and menu
- **Menu Items**: Browse menu with category filtering

### Shopping Experience

- **Cart Management**: Add, remove, and update cart items
- **Order Processing**: Place orders and track status
- **User Profile**: Manage account information

## Styling

The project uses a custom CSS architecture with:

- **CSS Variables**: Consistent theming and easy customization
- **Responsive Grid**: Mobile-first responsive design
- **Modern Animations**: Smooth transitions and hover effects
- **Component-based CSS**: Organized styles for each component

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.
