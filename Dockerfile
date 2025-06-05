FROM oven/bun:1

WORKDIR /app

COPY bun.lock package.json ./

RUN bun install --frozen-lockfile --production

RUN ls -la /app

COPY . .

RUN ls -la /app/src/utils

RUN bunx prisma generate

RUN bun run compile --verbose

EXPOSE 5000

CMD ["sh", "-c", "bun run db:deploy && bun run start"]
