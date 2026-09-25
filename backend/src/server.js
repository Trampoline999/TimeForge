import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`🚀 Intelligent College Timetable Engine running at http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`📡 API Endpoints base: http://localhost:${PORT}/api`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n⚠️ Port ${PORT} is already in use by another process.`);
    console.error(`👉 Run the following command in terminal to free the port:`);
    console.error(`   kill -9 $(lsof -t -i:${PORT})\n`);
    process.exit(1);
  } else {
    throw err;
  }
});
