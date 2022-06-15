# Install dependencies only when needed
FROM node AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
#RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
COPY ./prisma prisma
RUN npm ci

# Rebuild the source code only when needed
FROM node AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY ./prisma prisma
COPY . .

# If using npm comment out above and use below instead
RUN npx prisma generate
RUN npm run build

# Production image, copy all the files and run next
FROM node AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 discordjs

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma prisma
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

USER discordjs

CMD ["npm", "start"]
