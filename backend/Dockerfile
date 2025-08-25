FROM postgres:16-bookworm

# Install pg_cron extension
RUN apt-get update && \
    apt-get install -y postgresql-16-cron && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy initialization SQL script
COPY db/init.sql /docker-entrypoint-initdb.d/02-init.sql

# Create a script to configure PostgreSQL with pg_cron during initialization
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
echo "Configuring PostgreSQL for pg_cron..."\n\
\n\
# Update postgresql.conf with pg_cron settings\n\
cat >> "$PGDATA/postgresql.conf" <<EOF\n\
\n\
# pg_cron configuration\n\
shared_preload_libraries = '\''pg_cron'\''\n\
cron.database_name = '\''${POSTGRES_DB:-postgres}'\''\n\
EOF\n\
\n\
# Restart PostgreSQL to load pg_cron\n\
pg_ctl -D "$PGDATA" -m fast -w restart\n\
\n\
echo "Creating pg_cron extension in database: ${POSTGRES_DB:-postgres}"\n\
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "${POSTGRES_DB:-postgres}" <<-EOSQL\n\
    CREATE EXTENSION IF NOT EXISTS pg_cron;\n\
    GRANT USAGE ON SCHEMA cron TO PUBLIC;\n\
EOSQL\n\
\n\
echo "pg_cron setup completed successfully"\n\
' > /docker-entrypoint-initdb.d/01-setup-pg-cron.sh && \
    chmod +x /docker-entrypoint-initdb.d/01-setup-pg-cron.sh

# Expose PostgreSQL port
EXPOSE 5432

# Set default environment variables (for testing only, they will be overridden in production)
ENV POSTGRES_DB=postgres
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres
