import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Yorumi API is running', version: '1.0.0' });
});

// API routes would go here
// app.use('/api', routes);

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  const publicPath = path.join(__dirname, '../../public');
  app.use(express.static(publicPath));

  // SPA fallback: route all non-API requests to index.html
  app.get('*', (req: Request, res: Response) => {
    // Don't serve index.html for API routes
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(publicPath, 'index.html'), (err) => {
        if (err) {
          res.status(404).json({ error: 'Page not found' });
        }
      });
    } else {
      res.status(404).json({ error: 'API endpoint not found' });
    }
  });
}

export default app;
