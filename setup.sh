# /bin/bash

# Install dependencies
npm install

# Deploy contracts on ganache
npx hardhat run --network localhost scripts/deploy.js

cp .env.template .env