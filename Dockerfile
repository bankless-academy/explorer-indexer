FROM node:18

# Set PNPM environment variables
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Set database connection environment variables
# ENV ENVIO_POSTGRES_PASSWORD="testing"
# ENV ENVIO_PG_DATABASE="envio-dev"
# ENV ENVIO_PG_USER="postgres"

# Install PNPM manually (instead of using Corepack)
RUN npm install -g pnpm

# Set working directory
WORKDIR /app
# WORKDIR /usr/src/app

# Copy all project files
COPY . .

# Install dependencies using PNPM with caching
RUN --mount=type=cache,id=pnpm,target=$PNPM_HOME/store pnpm install --no-frozen-lockfile --unsafe-perm --force

# Run code generation step for Envio
RUN pnpm envio codegen
# RUN pnpm build

# Expose application port
EXPOSE 8080

# Run database migrations and start the indexer
CMD ["sh", "-c", "pnpm envio local db-migrate setup && pnpm envio start"]
# CMD pnpm envio start
# CMD ["npm", "start"]
