const express = require('express');
const pdfRoutes = require('./routes/pdfRoutes');

const app = express();

// Parse JSON bodies — we're receiving { html: "..." } from WordPress
// limit is 10mb because ticket HTML with embedded images can be large
app.json = express.json({ limit: '10mb' });
app.use(express.json({ limit: '10mb' }));

// Health check — Railway uses this to know the service is alive
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'nokere-pdf-service' });
});

// PDF routes
app.use('/api', pdfRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`PDF service running on port ${PORT}`);
});
