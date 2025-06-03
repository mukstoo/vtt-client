# VTT Client - Virtual Tabletop Frontend

A modern React-based frontend for the Virtual Tabletop (VTT) application, built with TypeScript, Vite, and Socket.IO.

## Features

- **Authentication**: User registration and login with JWT tokens
- **Room Management**: Create and join game rooms
- **Real-time Communication**: Socket.IO integration for live updates
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Dark theme with glassmorphism effects

## Tech Stack

- **React 19** with TypeScript
- **Vite** for fast development and building
- **React Router** for navigation
- **Socket.IO Client** for real-time communication
- **Axios** for HTTP API calls
- **React Konva** for map canvas (ready for implementation)
- **PeerJS** for voice chat (ready for implementation)
- **RPG Dice Roller** for dice mechanics (ready for implementation)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- VTT Server running on port 4000

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd vtt-client
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
# Create .env.local file
echo "VITE_SERVER_URL=http://localhost:4000" > .env.local
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   └── PrivateRoute.tsx # Route protection component
├── contexts/            # React Context providers
│   └── AuthContext.tsx  # Authentication state management
├── pages/               # Page components
│   ├── LoginPage.tsx    # User login
│   ├── RegisterPage.tsx # User registration
│   ├── RoomSelectionPage.tsx # Room list and creation
│   └── RoomPage.tsx     # Main VTT interface
├── services/            # API and external service integrations
│   ├── api.ts          # HTTP API client
│   └── socket.ts       # Socket.IO client
├── types/              # TypeScript type definitions
│   └── index.ts        # Shared interfaces and types
├── App.tsx             # Main application component
├── App.css             # Global styles
└── main.tsx            # Application entry point
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## API Integration

The client integrates with the VTT server through:

### HTTP Endpoints
- `POST /auth/register` - User registration
- `POST /auth/login` - User authentication
- `GET /rooms` - List user's rooms
- `POST /rooms` - Create new room
- `GET /rooms/:id` - Get room details

### Socket.IO Events
- `move_unit` - Unit movement on map
- `roll_dice` - Dice rolling
- `send_chat` - Chat messages
- `voice_join` - Voice chat coordination

## Environment Variables

- `VITE_SERVER_URL` - Backend server URL (default: http://localhost:4000)

## Development Status

### ✅ Completed Features
- User authentication (login/register)
- Room management (create/list/join)
- Responsive UI design
- Socket.IO integration setup
- Route protection
- Error handling

### 🚧 In Progress / Planned Features
- Map canvas with hex/square grids
- Unit movement and management
- Dice rolling interface
- Chat system
- Voice chat integration
- Character management
- File upload for maps

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting and tests
5. Submit a pull request

## License

This project is licensed under the MIT License.
