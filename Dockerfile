FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    fonts-noto-color-emoji \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 libgbm1 \
    libasound2 libpango-1.0-0 libcairo2 libxshmfence1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --production

# Pre-download Remotion's own headless browser
RUN npx remotion browser ensure

COPY . .

ENTRYPOINT ["npx", "tsx", "src/cron.ts"]
