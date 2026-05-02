FROM node:20-slim

WORKDIR /app

# Copy package files first for layer caching
COPY package.json package-lock.json ./

# Install all deps (including devDeps for ts-node + drizzle-kit)
RUN npm install

# Copy source
COPY . .

# Run migrations then start
CMD ["sh", "-c", "npx drizzle-kit migrate && npm start"]
