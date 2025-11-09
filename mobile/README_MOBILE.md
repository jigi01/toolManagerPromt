# ToolManager Mobile App

React Native mobile application for ToolManager built with Expo.

## Features

### Authentication
- Login with email and password
- Company registration
- JWT token-based authentication with AsyncStorage
- Automatic session management

### Dashboard
- User profile and role information
- Statistics overview (for bosses)
- My assigned tools list
- Quick action shortcuts

### Tools Management
- View all tools with search and filter by category
- Add new tools with image upload
- Edit tool details
- Delete tools
- Transfer tools to other users
- Check in tools to warehouses
- View tool history
- Generate and view QR codes
- Grid card layout

### Users Management
- View all users in company
- Send invitations with role assignment
- Manage pending invitations
- Delete users (with permissions)

### Warehouses Management
- View all warehouses
- Add new warehouses
- Edit warehouse details
- Delete warehouses

### Roles Management (Boss only)
- Create custom roles
- Edit roles and permissions
- Delete roles
- Granular permission system (16 different permissions)

### Settings
- View profile information
- Change password
- Logout

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **State Management**: Zustand
- **API Client**: Axios
- **Storage**: AsyncStorage
- **Image Picker**: expo-image-picker
- **QR Codes**: react-native-qrcode-svg
- **Icons**: @expo/vector-icons (Ionicons)

## Project Structure

```
mobile/
├── app/                      # Expo Router screens
│   ├── (auth)/              # Authentication screens
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/              # Main tab navigation
│   │   ├── index.tsx        # Dashboard
│   │   ├── tools.tsx        # Tools list
│   │   ├── users.tsx        # Users management
│   │   ├── warehouses.tsx   # Warehouses management
│   │   └── settings.tsx     # Settings
│   ├── tool/
│   │   └── [id].tsx         # Tool details
│   ├── roles.tsx            # Roles management
│   └── _layout.tsx          # Root layout
├── components/              # Reusable components
│   └── ToolCard.tsx
├── services/                # API services
│   └── api.ts
├── store/                   # Zustand stores
│   └── authStore.ts
├── types/                   # TypeScript types
│   └── index.ts
├── constants/               # Constants and configs
│   └── permissions.ts
├── utils/                   # Helper functions
│   └── format.ts
└── app.json                 # Expo configuration

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- Expo Go app on your mobile device (for testing)
- iOS Simulator or Android Emulator (optional)

### Installation

1. Install dependencies:
```bash
cd mobile
pnpm install
```

2. Configure API endpoint:
   - Update `API_URL` in `services/api.ts` to point to your backend server
   - For development with physical device, use your computer's local IP address
   - Example: `http://192.168.1.100:5000/api`

3. Start the development server:
```bash
pnpm start
```

4. Scan the QR code with Expo Go app (iOS/Android)

### Development Commands

```bash
# Start development server
pnpm start

# Start with Android
pnpm android

# Start with iOS
pnpm ios

# Start web version
pnpm web

# Lint code
pnpm lint
```

## API Configuration

The app communicates with the backend API. Update the `API_URL` in `services/api.ts`:

```typescript
const API_URL = 'http://YOUR_BACKEND_URL:5000/api';
```

### Authentication Flow

1. User logs in or registers
2. Backend returns JWT token
3. Token is stored in AsyncStorage
4. Token is sent in Authorization header for all API requests
5. Automatic logout on 401 responses

## Permissions

The app implements a granular permission system:

- **Tools**: CREATE, READ, UPDATE, DELETE, TRANSFER
- **Users**: CREATE, READ, UPDATE, DELETE
- **Warehouses**: CREATE, READ, UPDATE, DELETE
- **Invitations**: CREATE, READ, DELETE

Permissions are checked at both the UI level (hiding buttons) and enforced by the backend.

## Features by Role

### Boss
- Full access to all features
- Dashboard with statistics
- Manage roles and permissions
- Invite users
- Full CRUD on all resources

### Employee (with permissions)
- View assigned tools
- Transfer tools (if permitted)
- Check in tools (if permitted)
- Limited access based on role permissions

## Building for Production

### Android

```bash
# Build APK
eas build --platform android --profile preview

# Build AAB for Play Store
eas build --platform android --profile production
```

### iOS

```bash
# Build for simulator
eas build --platform ios --profile preview

# Build for App Store
eas build --platform ios --profile production
```

## Troubleshooting

### Network Connection Issues

If you can't connect to the backend:
1. Make sure backend is running
2. Check if `API_URL` is correct
3. For physical device, use computer's local IP (not localhost)
4. Ensure device and computer are on same network
5. Check firewall settings

### Token Issues

If authentication is not working:
1. Clear AsyncStorage: `await AsyncStorage.clear()`
2. Check token format in backend
3. Verify backend is sending token in response

### Image Upload Issues

1. Check permissions in app.json
2. Grant camera/photo permissions on device
3. Ensure backend accepts multipart/form-data
4. Check file size limits

## Known Limitations

- Images are uploaded as base64 (consider using presigned URLs for production)
- QR code scanning not implemented (only generation)
- Offline mode not supported
- Push notifications not implemented

## Future Enhancements

- QR code scanning
- Offline support with local database
- Push notifications for tool transfers
- Dark mode
- Biometric authentication
- Tool barcode scanning
- Export reports
- Real-time updates with WebSockets

## Contributing

Follow the same patterns and conventions used in the web frontend:
- Use TypeScript for type safety
- Follow existing component structure
- Implement proper error handling
- Test on both iOS and Android

## License

Same as main ToolManager project
