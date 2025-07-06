import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import router from './routes/router';
import socketHandler from './sockets/socketHandler';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import http from 'http';

// Load environment variables
dotenv.config();

const app: Application = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// CORS configuration
const corsOptions: cors.CorsOptions = {
    origin: '*',
    credentials: true,
    optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Routes
app.use('/', router);


// Server setup
const port = process.env.PORT || 3000;
const server = http.createServer(app);

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// Socket.IO setup
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

socketHandler(io);
console.log('Socket connected');