# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# === START: Perbaikan untuk OpenSSL dan Prisma ===
# Install OpenSSL di fase 'base' atau 'install'
# Ini memastikan libssl terinstal di awal dan tersedia untuk Prisma
FROM base AS install
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/* # Tambahkan baris ini
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production
# === END: Perbaikan untuk OpenSSL dan Prisma ===


# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# [optional] tests & build
ENV NODE_ENV=production
# Pastikan prisma generate berjalan setelah semua dependensi terinstal dan file disalin
# Juga pastikan ia tahu environment targetnya
RUN bunx prisma generate --data-proxy 
# Jika Anda tidak menggunakan Data Proxy, pastikan generate menghasilkan binary yang sesuai untuk Linux
# Alternatif: RUN BUN_ENV=production prisma generate (jika ada masalah dengan deteksi env)
RUN bun test
RUN bun run compile # Menggunakan script 'compile' Anda

# === START: Perbaikan untuk menyalin Query Engine ===
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
# Salin folder .prisma yang berisi query engine
COPY --from=prerelease /usr/src/app/node_modules/.prisma node_modules/.prisma/
# Copying dist directory instead of specific files
COPY --from=prerelease /usr/src/app/dist dist/
COPY --from=prerelease /usr/src/app/package.json .
COPY --from=prerelease /usr/src/app/prisma prisma/
# === END: Perbaikan untuk menyalin Query Engine ===

# run the app
USER bun
ENTRYPOINT [ "bun", "run", "start" ]