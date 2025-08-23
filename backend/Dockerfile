FROM postgres:16-bookworm

# Install pg_cron extension
RUN apt-get update && \
    apt-get install -y postgresql-16-cron && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Configure pg_cron in postgresql.conf
RUN echo "shared_preload_libraries = 'pg_cron'" >> /usr/share/postgresql/postgresql.conf.sample
RUN echo '#!/bin/bash\necho "cron.database_name = '\''$POSTGRES_DB'\''" >> /usr/share/postgresql/postgresql.conf.sample' > /docker-entrypoint-initdb.d/00_configure_pg_cron.sh
RUN chmod +x /docker-entrypoint-initdb.d/00_configure_pg_cron.sh

# Create initialization script for pg_cron extension
RUN echo '#!/bin/bash\nset -e\npsql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL\n    CREATE EXTENSION IF NOT EXISTS pg_cron;\nEOSQL' > /docker-entrypoint-initdb.d/10_pg_cron.sh
RUN chmod +x /docker-entrypoint-initdb.d/10_pg_cron.sh
