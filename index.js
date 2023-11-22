const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { MongoClient } = require('mongodb');
const path = require('path');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve static files (HTML, CSS, client-side scripts) from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html for the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

io.on('connection', (socket) => {
    console.log('A user connected');
  
    // Handle chat events
    socket.on('chat message', async (msg) => {
      io.emit('chat message', msg); // Broadcast the message to all connected clients
  
      // Save message to MongoDB
      try {
        const client = new MongoClient('mongodb://localhost:27017', { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        const database = client.db('chatbot-app');
        const messagesCollection = database.collection('messages');
        await messagesCollection.insertOne({ content: msg });
        client.close();
      } catch (error) {
        console.error('MongoDB error:', error.message);
      }
  
      // Integrate with OpenAI API
      try {
        const response = await axios.post(
          'https://api.openai.com/v1/engines/davinci-codex/completions',
          {
            prompt: msg,
            max_tokens: 50,
          },
          {
            headers: {
              Authorization: `Bearer YOUR_OPENAI_API_KEY`,
              'Content-Type': 'application/json',
            },
          }
        );
        const aiResponse = response.data.choices[0].text.trim();
        io.emit('chat message', aiResponse);
      } catch (error) {
        console.error('OpenAI API error:', error.message);
      }
    });
  
    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  }); 
  




//server.listen(PORT, () => {
  //console.log(`Server is running on port ${PORT}`);
//});
