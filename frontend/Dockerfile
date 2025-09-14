FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./
COPY frontend/next.config.js ./
COPY frontend/postcss.config.js ./
COPY frontend/tailwind.config.js ./
COPY frontend/tsconfig.json ./
COPY frontend/next-env.d.ts ./

# Install dependencies
RUN npm install

# Copy source code
COPY frontend/app ./app
COPY frontend/components ./components
COPY frontend/hooks ./hooks
COPY frontend/lib ./lib
COPY frontend/public ./public
COPY frontend/store ./store
COPY frontend/types ./types
COPY frontend/utils ./utils

# Build the application
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]