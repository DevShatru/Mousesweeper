//Copyright (C) Shatrujit Aditya Kumar 2022, All Rights Reserved
'use strict';

//Import our music player class
import MusicPlayer from './MusicPlayer.js';

//Stores heights, width, number of cats(mines) for each difficulty for easy recall
const EASY_HEIGHT = 9,
      EASY_WIDTH = 9,
      EASY_CATS = 10;

const MEDIUM_HEIGHT = 16,
      MEDIUM_WIDTH = 16,
      MEDIUM_CATS = 40;

const HARD_HEIGHT = 16,
      HARD_WIDTH = 30,
      HARD_CATS = 99;

//Stores max dimensions for Custom boards
const MAX_CUSTOM_DIMENSIONS = 50,
      //Count of cells in a 3x3 box, just to avoid that 'magic number'
      CELL_AND_NEIGHBOURS_COUNT = 9,
      //Reference for whether a cell stores a mine or not in our 2D array of integers
      CAT = 255,
      NOT_CAT = 254;

//Store IDs for custom difficulty inputs
export const CUSTOM_HEIGHT = "#custom-height",
      CUSTOM_WIDTH = "#custom-width",
      CUSTOM_CATS = "#custom-cats";

//Store IDs for our game board and reset button
export const GAME_BOARD = "#game-board",
             RESET_BUTTON = "#reset-button";

//Store ID for our number of cats remaining display in the footer
const CAT_DISPLAY_NUMBER = "#cat-number";

//References for each difficulty value
export const EASY_DIFFICULTY = "EASY",
      MEDIUM_DIFFICULTY = "MEDIUM",
      HARD_DIFFICULTY = "HARD",
      CUSTOM_DIFFICULTY = "CUSTOM";

//Store ID for footer elements time and high score
const TIME_ELEMENT = "#time",
      HI_SCORE_ELEMENT = "#hi-score";

//Store classes to add/remove from tiles depending on state
const MARKED_CLASS = "mark", //Flag
      INCORRECT_MARK_CLASS = "bad-mark", //Incorrect flag, gets applied after a loss
      OPEN_CLASS = "open-tile", //A tile that's been clicked
      VALUE_ONE_CLASS = "number-1", //Color CSS for number 1
      VALUE_TWO_CLASS = "number-2", //Color CSS for number 2
      VALUE_THREE_CLASS = "number-3", //Color CSS for number 3
      VALUE_FOUR_CLASS = "number-4", //Color CSS for number 4
      VALUE_FIVE_CLASS = "number-5", //Color CSS for number 5
      VALUE_SIX_CLASS = "number-6", //Color CSS for number 6
      VALUE_SEVEN_CLASS = "number-7", //Color CSS for number 7
      VALUE_EIGHT_CLASS = "number-8", //Color CSS for number 8
      MINE_CLASS = "cat", //Tile containing a cat(mine)
      CLICKED_MINE_CLASS = "cat-clicked"; //Tile with a cat that's been clicked

//Text to write to the reset button on win/loss/reset
const RESET_BUTTON_TEXT = "Reset Game",
      VICTORY_TEXT = "A MICE VICTORY!",
      LOSS_TEXT = "YOU GOT ATE :(";

//GameBoard handles all game related tasks
export default class GameBoard {

    //declare our sets of variables
    constructor() {

        this.maxCats = undefined; //Max number of cats for that difficulty
        this.activeCats = undefined; //Max cats - number of flags
        this.numberOfRows = undefined; //Rows in the board
        this.numberOfColumns = undefined; //Columns in the board
        this.gameStarted = false; //Whether the game has started
        this.gameOver = false; //Whether the game is over
        this.time = 0; //Time in seconds since game start
        this.timerInterval = undefined; //Interval to update time
        this.difficulty = EASY_DIFFICULTY //current difficulty
        
        //Hi score object keeps track of each difficulty's high score
        this.hiScoreObject = {}
        this.hiScoreObject[EASY_DIFFICULTY] = "-";
        this.hiScoreObject[MEDIUM_DIFFICULTY] = "-";
        this.hiScoreObject[HARD_DIFFICULTY] = "-";
        this.hiScoreObject[CUSTOM_DIFFICULTY] = "-";

        //Set up handlers for board events
        this.initBoardEventHandlers();

        //Number of tiles marked as dangerous (flags)
        this.markedTiles = 0;

        //Init music player
        this.musicPlayer = new MusicPlayer();
    }

    //Inits the board array and adds rows/columns
    initCatField() {

        this.catField = [];

        for(let i = 0; i < this.numberOfRows; i++) {

            this.catField[i] = [];
            let row = this.catField[i];

            for(let j = 0; j < this.numberOfColumns; j++) {

                row[j] = 0;
            }
        }
    }

    //Runs through the board array and placed mines (params used to ensure the game always starts on an empty tile if possible)
    initCats(rowValues, columnValues) {

        let catsToPlace = this.maxCats;

        while(catsToPlace > 0) {

            let rowIndex = this.getRandom(this.numberOfRows);

            let columnIndex = this.getRandom(this.numberOfColumns);

            this.setNextTile(CAT, rowIndex, columnIndex, rowValues, columnValues);
            catsToPlace--;
        }
    }

    //Generate minefield starting with safespots, useful if mines outnumber safespots
    initSafeSpotsAndCats(rowValues, columnValues) {

        let safeSpotsToPlace = this.numberOfColumns * this.numberOfRows - this.maxCats;
        
        if(safeSpotsToPlace > 0) {

            safeSpotsToPlace = this.initStartingSpots(safeSpotsToPlace, rowValues, columnValues);
        }

        while(safeSpotsToPlace > 0) {

            let rowIndex = this.getRandom(this.numberOfRows);
            let columnIndex = this.getRandom(this.numberOfColumns);

            this.setNextTile(NOT_CAT, rowIndex, columnIndex);
            safeSpotsToPlace--;
        }
        this.populateCats();
    }

    //If the selected tile is already filled, iterate through the minefield to find the first empty tile to fill. Makes randomizing mines go a bit faster
    setNextTile(valueToSet, rowIndex, columnIndex, rowsToIgnore = [], columnsToIgnore = []) {
        
        let tileFilled = this.catField[rowIndex][columnIndex] == CAT || this.catField[rowIndex][columnIndex] == NOT_CAT;
        let tileIgnored = rowsToIgnore.indexOf(rowIndex) != -1 && columnsToIgnore.indexOf(columnIndex) != -1;

        if(!tileFilled && !tileIgnored) {

            this.catField[rowIndex][columnIndex] = valueToSet;
            return;
        } else {

            if(columnIndex < this.numberOfColumns - 1) {

                this.setNextTile(valueToSet, rowIndex, columnIndex + 1, rowsToIgnore, columnsToIgnore);
                return;
            }
            else if(rowIndex < this.numberOfRows - 1) {

                this.setNextTile(valueToSet, rowIndex + 1, 0, rowsToIgnore, columnsToIgnore);
                return;
            }
            else {

                this.setNextTile(valueToSet, 0, 0, rowsToIgnore, columnsToIgnore);
                return;
            }
        }

    }

    //Ensures starting spot is always safe, and tries to keep the surrounding tiles safe if possible
    initStartingSpots(safeSpots, rowValues, columnValues) {

        if(safeSpots > rowValues.length * columnValues.length) {

            for(let i = 0; i < rowValues.length; i++, safeSpots > 0) {

                let rowIndex = rowValues[i];

                if(this.catField[rowIndex]) {

                    for(let j = 0; j < columnValues.length; j++) {

                        let columnIndex = columnValues[j];

                        if(this.catField[rowIndex][columnIndex] != NOT_CAT) {

                            this.catField[rowIndex][columnIndex] = NOT_CAT;
                            safeSpots--;
                        }
                    }
                }

            }
        } else {

            let centerRow = this.getMiddleOfArray(rowValues);
            let centerColumn = this.getMiddleOfArray(columnValues)

            if(this.catField[centerRow, centerColumn] != NOT_CAT) {

                this.catField[centerRow][centerColumn] = NOT_CAT;
                safeSpots--;
            }
        }

        return safeSpots;
    }

    //Sets all spots that aren't safe to mines, useful when generating starting with safespots
    populateCats() {

        for(let i = 0; i < this.numberOfRows; i++) {

            for(let j = 0; j < this.numberOfColumns; j++) {

                if(this.catField[i][j] != NOT_CAT) {

                    this.catField[i][j] = CAT;
                }
            }
        }
    }

    //Returns the middle value of an array
    getMiddleOfArray(array) {

        let middleIndex = Math.floor(array.length/2);

        return array[middleIndex];
    }
    
    //RNG between 0 and max
    getRandom(max) {

        return Math.round(Math.random() * (max - 1));
    }
    
    //Precalculate the value of each cell on the first click
    populateBoardValues() {

        for(let row = 0; row < this.numberOfRows; row++) {

            for(let column = 0; column < this.numberOfColumns; column++) {

                if(this.catField[row][column] === 0 || this.catField[row][column] === NOT_CAT) {

                    this.catField[row][column] = this.countNeighbouringCats(row, column);
                }
            }
        }
    }

    //Takes row and column index and gets the number of cats in the neighbouring cells
    countNeighbouringCats(row, column) {

        let count = 0;
        let rowValues = this.getAdjacentValues(row);
        let columnValues = this.getAdjacentValues(column);

        for(let i = 0; i < rowValues.length; i++) {

            if(this.catField[rowValues[i]]) {

                for(let j = 0; j < columnValues.length; j++) {

                    if(this.catField[rowValues[i]][columnValues[j]] == CAT) {

                        count++;
                    }
                }
            }
        }
        return count;
    }

    //Established number of rows, columns, cats(mines) based difficulty/custom params and calls drawGameBoard to get HTML
    createTableMarkup () {

        let numberOfRows, numberOfColumns, numberOfCats;

        switch(this.difficulty) {

            case EASY_DIFFICULTY:

                numberOfRows = EASY_HEIGHT;
                numberOfColumns = EASY_WIDTH;
                numberOfCats = EASY_CATS;
                break;

            case MEDIUM_DIFFICULTY:

                numberOfRows = MEDIUM_HEIGHT;
                numberOfColumns = MEDIUM_WIDTH;
                numberOfCats = MEDIUM_CATS;
                break;

            case HARD_DIFFICULTY:

                numberOfRows = HARD_HEIGHT;
                numberOfColumns = HARD_WIDTH;
                numberOfCats = HARD_CATS;
                break;

            case CUSTOM_DIFFICULTY:

                return this.setCustomDifficultParams();
                break;
        }

        return this.drawGameBoard(numberOfRows, numberOfColumns, numberOfCats);
    }

    //Generates game board HTML based on number of rows, columns, and cats
    drawGameBoard(numberOfRows, numberOfColumns, numberOfCats) {

        let boardHTML = "";
        this.maxCats = parseInt(numberOfCats);
        this.activeCats = this.maxCats;
        this.numberOfRows = parseInt(numberOfRows);
        this.numberOfColumns = parseInt(numberOfColumns);

        this.updateActiveCats();

        for(let i = 0; i < numberOfRows; i++) {

            boardHTML += '<tr>';

            for(let j = 0; j < numberOfColumns; j++) {

                boardHTML += `<td data-row="${i}" data-column="${j}"></td>`;
            }

            boardHTML += '</tr>';
        }
        return boardHTML;
    }

    //Decrements active cats and updates the number in the footer
    decrementActiveCats() {

        this.activeCats--;
        this.updateActiveCats();
    }

    //Increments active cats and updates the number in the footer
    incrementActiveCats(markedTiles) {

        if(markedTiles < this.maxCats)
            this.activeCats++;
        
        if(this.activeCats > this.maxCats)
            this.activeCats = this.maxCats;

        this.updateActiveCats();
    }

    //Updates the number of active cats in the footer
    updateActiveCats() {

        let catNumber = document.querySelector(CAT_DISPLAY_NUMBER);
        catNumber.innerHTML = this.activeCats;
    }

    //Called when difficulty changes, changes current high score to the value for that difficulty
    updateHiScore() {

        let hiScoreElem = document.querySelector(HI_SCORE_ELEMENT);
        hiScoreElem.innerHTML = this.hiScoreObject[this.difficulty];
    }

    //Validates the inputs for Custom difficulty and calls drawGameBoard to get HTML
    setCustomDifficultParams() {

        let rowsElement = document.querySelector(CUSTOM_HEIGHT);
        let numberOfRows = rowsElement.value;

        let columnsElement = document.querySelector(CUSTOM_WIDTH)
        let numberOfColumns = columnsElement.value;

        let catsElement = document.querySelector(CUSTOM_CATS)
        let numberOfCats = catsElement.value;

        //Can't be higher than the predefined max dimension
        if(numberOfRows > MAX_CUSTOM_DIMENSIONS) {

            numberOfRows = MAX_CUSTOM_DIMENSIONS;
        }

        //Has to be an integer so rounding off floats
        if(!this.isInt(numberOfRows)) {

            numberOfRows = Math.round(numberOfRows)
        }

        rowsElement.value = numberOfRows;

        //Can't be higher than the predefined max dimension
        if(numberOfColumns > MAX_CUSTOM_DIMENSIONS) {

            numberOfColumns = MAX_CUSTOM_DIMENSIONS
        }

        //Has to be an integer so rounding off floats
        if(!this.isInt(numberOfColumns)) {

            numberOfColumns = Math.round(numberOfColumns)
        }

        columnsElement.value = numberOfColumns;

        //Ensures that there's at least one empty spot on the board
        if(numberOfCats >= numberOfRows * numberOfColumns) {

            numberOfCats = numberOfRows * numberOfColumns - 1;
            catsElement.value = numberOfCats;
        }

        if(!this.isInt(numberOfCats)) {

            numberOfCats = Math.round(numberOfCats)
        }

        catsElement.value = numberOfCats;

        return this.drawGameBoard(numberOfRows, numberOfColumns, numberOfCats);
    }

    //Check if a number is an int so we can round it off if not
    isInt(number) {

        return number % 1 == 0;
    }

    //Set up click, double click, and right click handlers for the board
    initBoardEventHandlers() {

        //On click flip the tile
        document.querySelector(GAME_BOARD)
            .addEventListener("click", event => {

                if(!this.isGameOver) {

                    event.preventDefault();
                    let clickedElement = event.target
                    let row = parseInt(clickedElement.getAttribute("data-row"));
                    let column = parseInt(clickedElement.getAttribute("data-column"));
                    
                    //Make sure row and column exist (In case the click is between cells)
                    if(!isNaN(row) && !isNaN(column )) {
                        if(!this.gameStarted) {

                            this.startGame(row, column);
                        }

                        this.clickTile(clickedElement);
                        this.checkForGameOver();
                    }
                }
            });

        //On double click flip all surrounding tiles if the selected one if open and fully marked
        document.querySelector(GAME_BOARD)
            .addEventListener("dblclick", event => {

                if(!this.isGameOver) {

                    event.preventDefault();
                    let clickedElement = event.target
                    let row = parseInt(clickedElement.getAttribute("data-row"));
                    let column = parseInt(clickedElement.getAttribute("data-column"));
    
                    //Make sure row and column exist (In case the click is between cells)
                    if(!isNaN(row) && !isNaN(column )) {

                        if(!this.gameStarted) {

                            this.startGame(row, column);
                        }

                        this.handleDoubleClick(clickedElement);
                        this.checkForGameOver();
                    }
                }
            });

        //Right click, set a mark(flag)
        document.querySelector(GAME_BOARD)
            .addEventListener("contextmenu", event => {

                if(!this.isGameOver) {

                    event.preventDefault();
                    let clickedElement = event.target
                    let row = parseInt(clickedElement.getAttribute("data-row"));
                    let column = parseInt(clickedElement.getAttribute("data-column"));

                    //Make sure row and column exist (In case the click is between cells)
                    if(!isNaN(row) && !isNaN(column )) {

                        this.toggleMarkClassAndChangeCatCount(clickedElement);
                    }
                }
            });
    }

    //Check if the game ends by user win, called after a click event
    checkForGameOver() {

        let gameOverCheck = true;

        for(let i = 0; i < this.numberOfRows; i++) {

            for(let j = 0; j < this.numberOfColumns; j++) {

                let tileElem = this.getTileFromRowAndColumn(i, j);
                
                if (this.catField[i][j] !== CAT && !tileElem.classList.contains(OPEN_CLASS)) {

                    gameOverCheck = false;
                }
            }
        }

        if(gameOverCheck) {
            this.markAllCats();
            this.triggerGameOver(true);
        }
    }

    //Check if the game ends by user win, called after a click event
    markAllCats() {

        for(let i = 0; i < this.numberOfRows; i++) {

            for(let j = 0; j < this.numberOfColumns; j++) {

                let tileElem = this.getTileFromRowAndColumn(i, j);
                
                if (this.catField[i][j] === CAT && !tileElem.classList.contains(MARKED_CLASS)) {

                    tileElem.classList.add(MARKED_CLASS);
                }
            }
        }
    }

    //Handles double click action, checks if enough neighbours are marked and then opens the rest
    handleDoubleClick(element) {

        if(element.classList.contains(OPEN_CLASS)) {

            let row = element.getAttribute("data-row");
            let column = element.getAttribute("data-column");
            let value = parseInt(this.catField[row][column]);

            if(this.countMarkedNeighbours(row, column) == value) {

                this.clickNeighbours(row, column);
            }
        }
        else {

            this.clickTile(element)
        }
    }

    //Gets a count of neighbours that have been marked
    countMarkedNeighbours(row, column) {

        let rowValues = this.getAdjacentValues(row);
        let columnValues = this.getAdjacentValues(column);

        let count = 0;

        for(let i = 0; i < rowValues.length; i++) {

            if(this.catField[rowValues[i]] != undefined) {

                for(let j = 0; j < columnValues.length; j++) {

                    if(this.catField[rowValues[i]][columnValues[j]] != undefined) {

                        let neighbouringElem = this.getTileFromRowAndColumn(rowValues[i], columnValues[j]);

                        if(neighbouringElem.classList.contains(MARKED_CLASS)) {

                            count++;
                        }
                    }
                }
            }
        }

        return count;
    }

    //Handles tile click action, sets appropriate class and innerHTML based on precalculated array
    clickTile(element) {

        if(!element.classList.contains(OPEN_CLASS) && !element.classList.contains(MARKED_CLASS)) {

            element.classList.add(OPEN_CLASS)

            let row = element.getAttribute("data-row");
            let column = element.getAttribute("data-column");
            let value = parseInt(this.catField[row][column]);

            if(value >= 1 && value <= 8) {

                element.innerHTML = value;
            }

            switch (value) {

                case 0:

                   this.clickNeighbours(row, column);
                   
                   if(!this.isGameOver) {

                       this.musicPlayer.playClearMusic();
                   }
                   break;

                case 1:

                    element.classList.add(VALUE_ONE_CLASS);
                    break;

                case 2:

                    element.classList.add(VALUE_TWO_CLASS);
                    break;

                case 3:

                    element.classList.add(VALUE_THREE_CLASS);
                    break;

                case 4:

                    element.classList.add(VALUE_FOUR_CLASS);
                    break;

                case 5:

                    element.classList.add(VALUE_FIVE_CLASS);
                    break;

                case 6:

                    element.classList.add(VALUE_SIX_CLASS);
                    break;

                case 7:

                    element.classList.add(VALUE_SEVEN_CLASS);
                    break;

                case 8:

                    element.classList.add(VALUE_EIGHT_CLASS);
                    break;

                case CAT:

                    element.classList.add(MINE_CLASS);
                    element.classList.add(CLICKED_MINE_CLASS);
                    this.triggerGameOver(false);
                    break;
                    
                default:
                    break;
            }
        }
    }

    //Stop timer, and play corresponding music for win/loss. Updates high score on a win, and shows mine/incorrect flags on loss
    triggerGameOver(playerWon) {

        this.isGameOver = true;
        this.stopTimer();

        if(playerWon) {

            document.querySelector(RESET_BUTTON).innerHTML = VICTORY_TEXT;
            this.checkAndSetHiScore();
            this.musicPlayer.playWinMusic();
            this.musicPlayer.stopBackgroundMusic();

        } else {

            document.querySelector(RESET_BUTTON).innerHTML = LOSS_TEXT;
            this.displayAllMines();
            this.displayIncorrectMarks();
            this.musicPlayer.playLossMusic();
            this.musicPlayer.stopBackgroundMusic();
        }
    }

    //Checks if new score is faster than old high score and updates
    checkAndSetHiScore() {

        let hiScoreElem = document.querySelector(HI_SCORE_ELEMENT);

        if(hiScoreElem.innerHTML == "-") {

            this.setHiScore(hiScoreElem);
        }
        else {

            let hiScoreVal = parseInt(hiScoreElem.innerHTML.slice(0, -1));

            if(hiScoreVal > this.time) {

                this.setHiScore(hiScoreElem);
            }
        }
    }

    //Updates the hiScoreObject with the new highscore
    setHiScore(elem) {

        elem.innerHTML = this.time + "s";
        this.hiScoreObject[this.difficulty] = elem.innerHTML;
    }

    //Show any unflagged mines when the player loses
    displayAllMines() {

        for(let i = 0; i < this.numberOfRows; i++) {

            for(let j = 0; j < this.numberOfColumns; j++) {

                if (this.catField[i][j] === CAT) {

                    let tileElem = this.getTileFromRowAndColumn(i, j);

                    if(!tileElem.classList.contains(OPEN_CLASS) && !tileElem.classList.contains(MARKED_CLASS)) {

                        tileElem.classList.add(MINE_CLASS);
                    }
                }
            }
        }
    }

    //Show any incorrect flags when the player loses
    displayIncorrectMarks() {

        for(let i = 0; i < this.numberOfRows; i++) {

            for(let j = 0; j < this.numberOfColumns; j++) {

                if (this.catField[i][j] !== CAT) {

                    let tileElem = this.getTileFromRowAndColumn(i, j);

                    if(tileElem.classList.contains(MARKED_CLASS)) {

                        tileElem.classList.add(INCORRECT_MARK_CLASS);
                    }
                }
            }
        }
    }

    //Iterate over every neighbouring tile and simulate click action for each
    clickNeighbours(row, column) {

        let rowValues = this.getAdjacentValues(row);
        let columnValues = this.getAdjacentValues(column);

        for(let i = 0; i < rowValues.length; i++) {

            if(this.catField[rowValues[i]] != undefined) {

                for(let j = 0; j < columnValues.length; j++) {

                    if(this.catField[rowValues[i]][columnValues[j]] != undefined) {

                        let neighbouringElem = this.getTileFromRowAndColumn(rowValues[i], columnValues[j]);
                        this.clickTile(neighbouringElem);
                    }
                }
            }
        }
    }

    //Get DOM element for a tile from row and column
    getTileFromRowAndColumn(row, column) {

        return document.querySelector(`[data-row="${row}"][data-column="${column}"]`)
    }

    //Returns a index 3 array used to check neighbouring values for a given row/column
    getAdjacentValues(value) {

        value = parseInt(value);
        return [value - 1, value, value + 1];
    }

    //Toggles flags on tiles and updatess active cats number
    toggleMarkClassAndChangeCatCount(clickedElement) {
        
        if(!clickedElement.classList.contains(OPEN_CLASS)) {
            if(clickedElement.classList.contains(MARKED_CLASS)) {
    
                this.markedTiles--;
                this.incrementActiveCats(this.markedTiles);
            } else {
    
                this.markedTiles++;
                this.decrementActiveCats();
                this.musicPlayer.playMarkMusic();
            }
            clickedElement.classList.toggle(MARKED_CLASS);
        }
    }

    //Performs set up tasks, like starting timer, generating mines, and playing music on game start
    startGame(row, column) {

        this.gameStarted = true;
        let timeElement = document.querySelector(TIME_ELEMENT);

        this.timerInterval = setInterval(() => {

            this.time++;
            timeElement.innerHTML = this.time + 's';
        }, 1000)

        this.generateCatFieldAroundStartingPoint(row, column)
        this.musicPlayer.loopBackgroundMusic();
    }

    //Takes starting tile click and sets up mines avoiding that tile, and trying to avoid neighbouring tiles
    generateCatFieldAroundStartingPoint(row, column) {

        let numberOfNotCats = this.numberOfRows * this.numberOfColumns - this.maxCats;

        if(this.maxCats >= numberOfNotCats) {
            if(this.maxCats > this.numberOfRows * this.numberOfColumns - CELL_AND_NEIGHBOURS_COUNT) {
    
                this.generateSafeSpotsIncludingCells([row], [column]);
            }
            else {
    
                this.generateSafeSpotsIncludingCells(this.getAdjacentValues(row), this.getAdjacentValues(column));
            }
        } else {
            if(this.maxCats > this.numberOfRows * this.numberOfColumns - CELL_AND_NEIGHBOURS_COUNT) {

                this.generateCatFieldExcludingCells([row], [column]);
            }
            else {

                this.generateCatFieldExcludingCells(this.getAdjacentValues(row), this.getAdjacentValues(column));
            }
        }
    }

    //Generates safe spots, trying to include tiles with row/column indices in the param arrays
    //Useful when there's lots of mines so generation is faster
    generateSafeSpotsIncludingCells(rowValues, columnValues) {
        
        this.initCatField();
        this.initSafeSpotsAndCats(rowValues, columnValues);
        this.populateBoardValues();
    }

    //Generates mines avoiding tiles with row/column indices in the param arrays
    generateCatFieldExcludingCells(rowValues, columnValues) {

        this.initCatField();
        this.initCats(rowValues, columnValues);
        this.populateBoardValues();
    }

    //Resets the game, called by App when the reset button gets clicked
    clearTimerAndResetGameState() {

        this.musicPlayer.loopBackgroundMusic();
        this.stopTimer();
        let timeElement = document.querySelector(TIME_ELEMENT);
        this.time = 0;
        timeElement.innerHTML = this.time + 's';

        document.querySelector(RESET_BUTTON).innerHTML = RESET_BUTTON_TEXT;
        this.gameStarted = false;
        this.isGameOver = false;
    }

    //Stops the timer from updating
    stopTimer() {
        
        clearInterval(this.timerInterval)
    }
}