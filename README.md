DSP Wallet
==========

DSP Wallet is a web-based wallet designed for the Norwegian Central Bank's CBDC (Central Bank Digital Currency) sandbox project. It is an open-source project that allows developers to test and experiment with different use cases of CBDCs.

The wallet is built for an Ethereum/Besu blockchain and is written in TypeScript with a user interface built with the Next.js framework.

## Disclaimer
This a sandbox project and not intended for production; use at your own risk.

Features
--------

-   Send and receive NOK
-   View transaction history
-   View account balance
-   Verifiable credentials for wallet authentication
-   Contact registry for sending NOK to phone numbers
-   Anonymous transactions
-   Policy-based rules for transactions (e.g. max amount)
-   User-friendly interface
-   Open-source
-   Built for Ethereum/Besu blockchain
-   Written in TypeScript
-   Built with Next.js

Getting Started
---------------

This frontend relies on interactions with the blockchain via CBDC smart contracts. To run this locally, access the repository at [cbdc-sandbox-contracts](https://github.com/norges-bank/cbdc-sandbox-contracts) and follow the provided instructions. By doing so, you'll have all the necessary components running on your local machine.

To get started with the frontend, follow these steps:

1.  Clone the repository to your local machine
2.  Install dependencies by running `npm install`
3.  Copy `.env.example` to `.env.development`
4.  Set your environment variables in the `.env.development` file
5.  Start the development server by running `npm run dev`
6.  Visit `http://localhost:3000` in your browser to use the wallet

Contributing
------------

If you would like to contribute to the project, please follow these steps:

1.  Fork the repository
2.  Create a new branch for your feature or bug fix
3.  Make your changes and commit them to your branch
4.  Create a pull request and describe your changes

License
-------

This project is licensed under the Apache-2.0 license - see the LICENSE.md file for details.

# Enviroment variables

## Test env
Github repository secrets. They are used during CI. Can be set in Github dashboard -> Settings 

## Production env
Render enviroment varibles defined on service. Set in Render Dashboard -> [Service] -> Settings

