// Import dependencies
import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import http from 'http';
import { initSocket, generalErrorHandler, notifyer } from './functions/socketInit'; // Import the socket module


// Initialize express and server
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with the server
initSocket(server);

// Database connection function
const dbURI: string = process.env.dbURL || '';
const dbConnect = async (): Promise<void> => {
  try {
    await mongoose.connect(dbURI);
    console.log('Connected to database successfully');
    notifyer('Connected to database successfully');
  } catch (err) {
    console.error(`Error connecting to DB: ${err}`);
    dbConnect(); // Retry connection
    generalErrorHandler('Error connecting to database - Please check your internet connection');
  }
};
dbConnect();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/public', express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req: Request, res: Response) => {
  res.send('POS SERVER IS UP AND RUNNING');
});


// Start server
const port: number = parseInt(process.env.PORT || '3000', 10);
server.listen(port, () => console.log(`POS server running on port ${port}`));
