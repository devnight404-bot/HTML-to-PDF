FROM node:20-slim

# Install Chrome dependencies — on a real Linux server (Docker), this just works!
# This is everything we struggled to install on Combell, done in one command here.
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libxkbcommon0 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use the system-installed Chromium instead of downloading its own
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copy package files first (Docker caches this layer — npm install only re-runs if these change)
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy the rest of the app
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
