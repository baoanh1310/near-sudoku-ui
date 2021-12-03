import React from 'react';
import ReactDOM from 'react-dom';
import * as nearAPI from 'near-api-js';
import App from './App';
import getConfig from './config.js';
import { viewMethodOnContract, mungeBlockchainSudoku } from './utils';

import './index.css'

async function initSudoku() {
  const nearConfig = getConfig(process.env.NEAR_ENV || 'testnet');

  // create a keyStore for signing transactions using the user's key
  // which is located in the browser local storage after user logs in
  const keyStore = new nearAPI.keyStores.BrowserLocalStorageKeyStore();

  // Initializing connection to the NEAR testnet
  const near = await nearAPI.connect({ keyStore, ...nearConfig });

  // Initialize wallet connection
  const walletConnection = new nearAPI.WalletConnection(near);

  // Load in user's account data
  let currentUser;
  if (walletConnection.getAccountId()) {
    currentUser = walletConnection.getAccountId();
  }

  const chainData = await viewMethodOnContract(nearConfig, 'get_unsolved_puzzles', '{}');

  let data;
  let solutionHash;

  // There may not be any sudoku puzzles to solve, check this.
  if (chainData.puzzles.length) {
    solutionHash = chainData.puzzles[0]['solution_hash'];
    data = mungeBlockchainSudoku(chainData.puzzles);
  } else {
    console.log("Sorry, there's no sudoku puzzle to play right now, friend.");
  }
  return { data, solutionHash, nearConfig, walletConnection, currentUser };
}

initSudoku()
  .then(({ data, solutionHash, nearConfig, walletConnection, currentUser }) => {
    ReactDOM.render(
      <App
        data={data}
        hash={solutionHash}
        nearConfig={nearConfig}
        walletConnection={walletConnection}
        currentUser={currentUser}
      />,
      document.getElementById('root'));
  });

