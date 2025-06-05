FROM oven/bun:1

WORKDIR /app

COPY bun.lock package.json ./

RUN bun install --frozen-lockfile --production

COPY . .

RUN bunx prisma generate

RUN bun compile

EXPOSE 5000

CMD ["sh", "-c", "bun run db:deploy && bun run start"]
