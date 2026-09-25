import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import apiRouter from './routes/api.js';

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(morgan('dev'));

// Root endpoint
app.get('/', (req, res) => {
  res.redirect('/api');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'Intelligent College Timetable Engine', timestamp: new Date() });
});

// Main API routes
app.use('/api', apiRouter);

// Global 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.url}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

export default app;
