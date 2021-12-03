import React, { useCallback, useEffect, useState } from 'react';
import sha256 from 'js-sha256';
import { DEFAULT_FUNCTION_CALL_GAS } from "near-api-js/src/constants.ts";
import SimpleDark from './loader';

import Grid from "./grid.js";
import Solver from "./solver.js";

const App = ({ data, hash, nearConfig, walletConnection, currentUser }) => {

    const [solutionFound, setSolutionFound] = useState("Not correct yet");
    const [showLoader, setShowLoader] = useState(false);
    const [solutionHash, setSolutionHash] = useState(hash);
    const [transactionHash, setTransactionHash] = useState(false);

    const [puzzle, setPuzzle] = useState(new Grid(data));
    const [isSolved, setIsSolved] = useState((new Grid(data)).isSolved());
    const [gridData, setGridData] = useState((new Grid(data)).toFlatString());
    console.log("Is solved: ", isSolved);

    async function onCellValueEdited (row, col, value) {
        const newGrid = new Grid(puzzle.toFlatString());
        newGrid.rows[row][col].value = value;
        setPuzzle(newGrid);
        setIsSolved(newGrid.isSolved());
        setGridData(newGrid.toFlatString());
        await checkSolution(gridData);
    }

    const checkSolution = async (gridData) => {
        let answerHash = sha256.sha256(gridData);
        // (It was given to us when we first fetched the puzzle in index.js)
        if (answerHash === solutionHash) {
            console.log("You're correct!");
            setSolutionFound("Correct!");
    
            // Clean up and get ready for next puzzle
            localStorage.removeItem('guesses');
            setSolutionHash(null);
            // Show full-screen loader as we process transaction
            setShowLoader(true);
            // Send the 1 NEAR prize to the logged-in winner
            let functionCallResult = await walletConnection.account().functionCall({
                contractId: nearConfig.contractName,
                methodName: 'submit_solution',
                args: {solution: gridData, memo: "Here we go!"},
                gas: DEFAULT_FUNCTION_CALL_GAS, // optional param, by the way
                attachedDeposit: 0,
                walletMeta: '', // optional param, by the way
                walletCallbackUrl: '' // optional param, by the way
            });
            if (functionCallResult && functionCallResult.transaction && functionCallResult.transaction.hash) {
                console.log('Transaction hash for explorer', functionCallResult.transaction.hash)
                setTransactionHash(functionCallResult.transaction.hash);
            }
            setShowLoader(false);
        } else {
            console.log("That's not the correct solution. :/");
            setSolutionFound("Not correct yet");
        }
    }

    // useEffect(() => {
    //     checkSolution(gridData);
    // }, []);

    const signIn = () => {
        walletConnection.requestSignIn(
          nearConfig.contractName,
          '', // title. Optional, by the way
          '', // successUrl. Optional, by the way
          '', // failureUrl. Optional, by the way
        );
    };
    
    const signOut = () => {
        walletConnection.signOut();
        window.location.replace(window.location.origin + window.location.pathname);
    };

    if (showLoader) {
        return (
            <div className="wrapper">
                <header className="site-header">
                </header>
                <main className="main-area">
                    <SimpleDark />
                </main>
            </div>
        )
    } else if (solutionHash) {
        // A solution hash was found, meaning there's a crossword puzzle to solve
        return (
            <div id="page">
                <div id="crossword-wrapper">
                <div id="login">
                    { currentUser
                    ? <button onClick={signOut}>Log out</button>
                    : <button onClick={signIn}>Log in</button>
                    }
                </div>
                    <h3>Status: { solutionFound }</h3>
                    
                    <div className="game">
                        <h1>NEAR Sudoku</h1>
                        <SudokuBoard
                            puzzleGrid={puzzle}
                            onCellValueChange={onCellValueEdited}
                        />

                    </div>
                </div>
            </div>
        );
    } else {
        // No solution hash was found, let the user know
        const explorerUrl = `https://explorer.testnet.near.org/transactions/${transactionHash}`;
        return (
            <div id="page">
                <h1>NEAR Sudoku</h1>
                <div id="sudoku-wrapper" className="no-puzzles">
                    { transactionHash && <a href={explorerUrl} target="_blank">See transaction on NEAR Explorer</a>}
                    <h2>No puzzles to solve :)</h2>
                    <p>Sorry, no puzzles to solve.</p>
                    </div>
            </div>
        );
    }

}

const Square = ({value, row, col, onCellValueChange}) => (
    <input
        type="text"
        value={value === 0 ? "" : value}
        maxLength="1"
        onChange={(evt) => {
            const cellValue = evt.target.value;
            if (parseInt(cellValue, 10) || cellValue === "") {
                onCellValueChange(row, col, cellValue);
            }
        }}
    />
);

const SudokuBoard = ({ puzzleGrid, onCellValueChange }) => (
    <table className="sudoku">
        <tbody>
        { puzzleGrid.rows.map((row, idx) => (
            <tr key={idx}>
                { row.map(cell => (
                    <td key={cell.col}>
                        <Square
                            value={cell.value}
                            row={cell.row}
                            col={cell.col}
                            onCellValueChange={onCellValueChange}
                        />
                    </td>
                )) }
            </tr>
        )) }
        </tbody>
    </table>
);

const Sudoku = ({ puzzleString }) => {
    const [puzzle, setPuzzle] = useState(new Grid(puzzleString));
    const [isSolved, setIsSolved] = useState((new Grid(puzzleString)).isSolved());
    const [gridData, setGridData] = useState((new Grid(puzzleString)).toFlatString());
    console.log("Is solved: ", isSolved);
    console.log("Grid data: ", gridData);

    function onCellValueEdited (row, col, value) {
        const newGrid = new Grid(puzzle.toFlatString());
        newGrid.rows[row][col].value = value;
        setPuzzle(newGrid);
        setIsSolved(newGrid.isSolved());
    }

    return (
        <div className="game">
            <h1>NEAR Sudoku</h1>
            <SudokuBoard
                puzzleGrid={puzzle}
                onCellValueChange={onCellValueEdited}
            />

        </div>
    );
}

export default App;
