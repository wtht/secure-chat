// ---------- dependencies ----------
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app   = express();
const httpS = http.createServer(app);
const io    = new Server(httpS, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// ---------- static files ----------
app.use(express.static('public'));

// ---------- socket layer ----------
io.on('connection', socket => {
  console.log('User connected:', socket.id);

  socket.on('join', ({ room, username }) => {
    socket.join(room);
    socket.room = room;
    socket.username = username;
    console.log(`${username} joined room: ${room}`);
    io.to(room).emit('system', `${username} joined the chat`);

    // Send current user count
    const roomSize = io.sockets.adapter.rooms.get(room)?.size || 0;
    io.to(room).emit('userCount', roomSize);
  });

  socket.on('message', data => {
    console.log(`Message in room ${data.room} from ${data.from}`);
    io.to(data.room).emit('message', data);
  });

  socket.on('delete', data => {
    console.log(`Delete message ${data.id} in room ${data.room}`);
    io.to(data.room).emit('delete', data);
  });

  socket.on('typing', data => {
    console.log(`${data.from} is typing in ${data.room}`);
    socket.to(data.room).emit('typing', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (socket.room && socket.username) {
      io.to(socket.room).emit('system', `${socket.username} left the chat`);

      // Send updated user count
      const roomSize = io.sockets.adapter.rooms.get(socket.room)?.size || 0;
      io.to(socket.room).emit('userCount', roomSize);
    }
  });
});

// ---------- health check endpoint ----------
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ---------- start ----------
const PORT = process.env.PORT || 3000;
httpS.listen(PORT, () => {
  console.log(`🔐 SecureChat server running on port ${PORT}`);
  console.log(`📱 Access at: http://localhost:${PORT}`);
});