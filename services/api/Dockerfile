FROM node:18-bullseye-slim

# Install build deps and libvips for sharp
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    pkg-config \
    libvips-dev \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Install dependencies first (cached layer)
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Copy source
COPY . .

# Generate Prisma client (if present)
RUN npx prisma generate || true

EXPOSE 4000

ENV NODE_ENV=development

CMD ["npm", "run", "dev"]
