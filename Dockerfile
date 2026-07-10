FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    fonts-noto-color-emoji \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --production

# Pre-download Remotion's own headless browser
RUN npx remotion browser ensure

COPY . .

ENTRYPOINT ["npx", "tsx", "src/cron.ts"]
