[![Backend](https://github.com/AIO-LLC/beach-garden-planning/actions/workflows/backend.yml/badge.svg)](https://github.com/AIO-LLC/beach-garden-planning/actions/workflows/backend.yml)

# Beach Garden Planning

Book beach tennis courts at the Beach Garden.

## Getting Started

1. Install **pre-commit** by following the instructions [here](https://pre-commit.com/#installation):
2. Install the pre-commit hook:

   ```bash
   pre-commit install --hook-type commit-msg
   ```
3. [Download the US East (N. Virginia) certificate bundle for Amazon RDS](https://truststore.pki.rds.amazonaws.com/us-east-1/us-east-1-bundle.pem)

4. Create a `certs` folder in the `backend` directory and put the freshly downloaded certificate bundle in the `certs` folder.
