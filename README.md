# 🔐 SecureChat - End-to-End Encrypted Messaging

A modern, secure chat application with end-to-end encryption, file sharing, and message deletion capabilities. Built with Node.js, Socket.IO, and the Web Crypto API.

## ✨ Features

### 🔐 Security
- **AES-256-GCM Encryption**: Military-grade end-to-end encryption
- **PBKDF2 Key Derivation**: Secure password-based key generation (100,000 iterations)
- **Perfect Forward Secrecy**: Each session uses unique encryption keys
- **No Server Storage**: Messages are never stored in plaintext on the server

### 💬 Messaging
- **Real-time Communication**: Instant message delivery with Socket.IO
- **Message Deletion**: Delete messages for all participants
- **Typing Indicators**: See when others are typing
- **User Presence**: Online/offline status and user count

### 📁 File Sharing
- **Secure File Upload**: All files are encrypted before transmission
- **Multiple Formats**: Support for images, videos, audio, documents
- **Drag & Drop**: Easy file sharing interface
- **Image Preview**: Inline image display with modal view

### 🎨 User Experience
- **Responsive Design**: Works perfectly on desktop and mobile
- **Dark/Light Theme**: Automatic theme detection with manual toggle
- **PWA Support**: Install as a native app
- **Keyboard Shortcuts**: Power user features
- **Accessibility**: Full keyboard navigation and screen reader support

## 🚀 Quick Start

### Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Server**
   ```bash
   npm start
   ```

3. **Open Your Browser**
   Navigate to `http://localhost:3000`

### 🌐 Deploy to Vercel (Free)

1. **Create a GitHub Repository**
   - Create a new repository on GitHub
   - Upload all project files

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with your GitHub account
   - Click "New Project"
   - Import your repository

3. **Configure Deployment**
   - Framework Preset: "Other" (auto-detected)
   - Keep all default settings
   - Click "Deploy"

4. **Share Your App**
   - Get your live URL (e.g., `https://your-app.vercel.app`)
   - Share with friends and start chatting securely!

### Alternative Hosting Options

- **Render**: Free tier with WebSocket support
- **Railway**: Easy Node.js deployment
- **Heroku**: Free tier (with limitations)
- **DigitalOcean**: VPS hosting for advanced users

## 🔧 Technical Details

### Architecture
- **Frontend**: Vanilla JavaScript with Web Crypto API
- **Backend**: Node.js with Express and Socket.IO
- **Encryption**: AES-256-GCM with PBKDF2 key derivation
- **Real-time**: WebSocket connections for instant communication

### File Structure
```
secure-chat/
├── package.json          # Dependencies and scripts
├── vercel.json           # Vercel deployment config
├── .gitignore            # Git ignore rules
├── server.js             # Main server file
└── public/
    ├── index.html        # Room join page
    ├── chat.html         # Main chat interface
    ├── style.css         # Responsive styling
    └── client.js         # Client-side logic and crypto
```

### Security Implementation

**Encryption Process:**
1. User enters room password
2. PBKDF2 derives encryption key from password + salt
3. Each message is encrypted with AES-256-GCM
4. Only encrypted data is transmitted to server
5. Recipients decrypt messages with shared key

**Key Features:**
- Salt-based key derivation prevents rainbow table attacks
- Unique initialization vectors (IV) for each message
- No plaintext data ever touches the server
- Perfect forward secrecy with session-based keys

## 🎯 Usage Guide

### Creating a Chat Room
1. Enter a unique room name
2. Set a strong password (used for encryption)
3. Choose your nickname
4. Click "Enter Secure Chat"

### Sharing with Friends
1. Share your deployed URL
2. Give them the room name and password
3. They can join from any device with a web browser

### Advanced Features
- **Delete Messages**: Right-click your own messages to delete for everyone
- **File Sharing**: Click the 📎 button or drag files into the chat
- **Theme Toggle**: Click 🌙 to switch between light and dark modes
- **Keyboard Shortcuts**: Ctrl+D (theme), Ctrl+L (leave room)

## 🔒 Privacy & Security

### What's Encrypted
- ✅ All text messages
- ✅ All file uploads
- ✅ File metadata (names, types)

### What's Not Encrypted
- ❌ Room names (visible to server)
- ❌ User nicknames (visible to server)
- ❌ Connection metadata (IP addresses, timestamps)

### Best Practices
- Use strong, unique room passwords
- Don't reuse room names for sensitive conversations
- Consider using VPN for additional privacy
- Regularly update your browser for latest security features

## 🛠️ Customization

### Environment Variables
```bash
PORT=3000                 # Server port (default: 3000)
```

### Theming
Modify CSS variables in `public/style.css` to customize colors:
```css
:root {
  --accent: #007bff;      # Primary color
  --bg: #ffffff;          # Background color
  --fg: #212529;          # Text color
}
```

## 🚨 Limitations

### Free Hosting Limits
- **Vercel**: Great for small groups, may sleep after inactivity
- **Render**: Free tier has bandwidth limits
- **File Size**: 10MB per file (configurable in code)

### Browser Compatibility
- Requires modern browsers with Web Crypto API support
- Works on all major browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers fully supported

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the Repository**
2. **Create a Feature Branch**: `git checkout -b feature/amazing-feature`
3. **Commit Changes**: `git commit -m 'Add amazing feature'`
4. **Push to Branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Development Setup
```bash
git clone https://github.com/yourusername/secure-chat.git
cd secure-chat
npm install
npm start
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Socket.IO**: Real-time communication
- **Web Crypto API**: Browser-native encryption
- **Express.js**: Web server framework
- **Vercel**: Free hosting platform

## 🔮 Roadmap

### Upcoming Features
- [ ] Voice messages
- [ ] Video calling
- [ ] Message reactions
- [ ] Reply threads
- [ ] User mentions
- [ ] Message search
- [ ] Export chat history
- [ ] Multi-language support

### Security Enhancements
- [ ] Signal Protocol implementation
- [ ] Device verification
- [ ] Key rotation
- [ ] Audit logs

## 📞 Support

Having issues? Here are some common solutions:

### Connection Problems
- Check your internet connection
- Try refreshing the page
- Verify the room name and password

### Encryption Issues
- Ensure all users have the same password
- Use a modern browser with Web Crypto API support
- Clear browser cache and cookies

### File Upload Problems
- Check file size (must be under 10MB)
- Verify file format is supported
- Ensure stable internet connection

---

**Built with ❤️ for privacy and security**

*SecureChat - Where conversations stay private*