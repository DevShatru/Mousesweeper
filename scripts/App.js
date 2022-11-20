//Copyright (C) Shatrujit Aditya Kumar 2022, All Rights Reserved
'use strict';

//Import necessary constants and GameBoard class from GameBoard.js
import GameBoard, { EASY_DIFFICULTY, MEDIUM_DIFFICULTY, HARD_DIFFICULTY, CUSTOM_DIFFICULTY , GAME_BOARD, CUSTOM_HEIGHT, CUSTOM_WIDTH, CUSTOM_CATS, RESET_BUTTON } from './GameBoard.js';
      
//Storing header button ids for easy recall
const CONTROLS_BUTTON = "#controls-button",
      DIFFICULTY_BUTTON = "#difficulty-button",
      PLAY_BUTTON = "#play-button";

//Storing section ids for easy recall
const CONTROLS_SCREEN = "#controls-screen",
      DIFFICULTY_SCREEN = "#difficulty-screen",
      PLAY_SCREEN = "#play-screen";

//Storing difficult button ids for easy recall
const EASY_BUTTON = "#easy-button",
      MEDIUM_BUTTON = "#medium-button",
      HARD_BUTTON = "#hard-button",
      CUSTOM_BUTTON = "#custom-button";

//Storing class used to identify custom difficulty params (Height, Width, Cats input boxes)
const CUSTOM_VALUES_CLASS = ".custom-difficulty-value";

export default class App {

    constructor() {

        //Init our GameBoard class and use it to set up the game area
        this.board = new GameBoard();
        this.minefield = this.board.initCatField();
        this.game_board = document.querySelector(GAME_BOARD);
        this.game_board.innerHTML = this.board.createTableMarkup();

        //Current Screen defaults to Controls on launch
        this.currentScreen = CONTROLS_SCREEN;
        //Volume value defaults to 20 on launch
        this.volumeControl = 20;

        //Set up event handlers
        this.initAppEventHandlers();
    }

    //Resets the game to starting state
    resetGame() {

        //Calls GameBoard's method to reset it's values and clear the timer
        this.board.clearTimerAndResetGameState();

        //Generates a fresh table and overwrite the old one
        this.game_board.innerHTML = this.board.createTableMarkup();
    }

    //Used when difficulty is selected/changed, generates a fresh table and updates the high score value (Storing separate
    //high scores for each difficulty)
    generateTableAndUpdateHiScore() {

        this.game_board.innerHTML = this.board.createTableMarkup();
        this.board.updateHiScore();

        //Switch to the Play screen after selecting a difficulty
        this.switchScreens(PLAY_SCREEN);
    }

    //Used to switch between and show/hide sections
    switchScreens(screen) {

        //Hide current screen
        document.querySelector(this.currentScreen)
            .classList.add("hide");

        //Show target screen
        document.querySelector(screen)
            .classList.remove("hide");

        //Set current screen to target screen
        this.currentScreen = screen;
    }

    //Set up event handlers for the header, difficulty, and reset buttons
    initAppEventHandlers() {

        //Handler to move to Play section
        document.querySelector(PLAY_BUTTON)
            .addEventListener("click", event => {

                this.switchScreens(PLAY_SCREEN)
            });

        //Handler to move to Difficulty section
        document.querySelector(DIFFICULTY_BUTTON)
            .addEventListener("click", event => {
                
                this.switchScreens(DIFFICULTY_SCREEN)
            });

        //Handler to move to Controls section
        document.querySelector(CONTROLS_BUTTON)
            .addEventListener("click", event => {

                this.switchScreens(CONTROLS_SCREEN)
            });

        //Handler to set difficulty to Easy
        document.querySelector(EASY_BUTTON)
            .addEventListener("click", event => {

                if(this.board.difficulty != EASY_DIFFICULTY) {
                    this.board.difficulty = EASY_DIFFICULTY;
                }
                this.generateTableAndUpdateHiScore();

                this.resetGame();
            });

        //Handler to set difficulty to Medium
        document.querySelector(MEDIUM_BUTTON)
            .addEventListener("click", event => {

                if(this.board.difficulty != MEDIUM_DIFFICULTY) {
                    this.board.difficulty = MEDIUM_DIFFICULTY;
                }
                this.generateTableAndUpdateHiScore();
                
                this.resetGame();
            });

        //Handler to set difficulty to Hard
        document.querySelector(HARD_BUTTON)
            .addEventListener("click", event => {

                if(this.board.difficulty != HARD_DIFFICULTY) {
                    this.board.difficulty = HARD_DIFFICULTY;
                }
                this.generateTableAndUpdateHiScore();

                this.resetGame();
            });

        //Handler to set difficulty to Custom
        document.querySelector(CUSTOM_BUTTON)
            .addEventListener("click", event => {

                if(this.board.difficulty != CUSTOM_DIFFICULTY) {
                    this.board.difficulty = CUSTOM_DIFFICULTY;
                }
                this.generateTableAndUpdateHiScore();

                this.resetGame();
            });
        
        
        //Gets all the input elements related to custom difficulty
        let customValuesList = document.querySelectorAll(CUSTOM_VALUES_CLASS)

        //Add an event handler to each custom input box to check when any of them are updated
        for(let i = 0; i < customValuesList.length; i++) {

            customValuesList[i].addEventListener("input", event => {

                //Gets the values for all three inputs
                let customHeight = document.querySelector(CUSTOM_HEIGHT).value;
                let customWidth = document.querySelector(CUSTOM_WIDTH).value;
                let customCats = document.querySelector(CUSTOM_CATS).value;
                let customButton = document.querySelector(CUSTOM_BUTTON);
                
                //Checks that they all have values
                let allFieldsFilled = customHeight && customWidth && customCats;

                //Checks they are non-zero, positive values
                let allFieldsPositive = customHeight > 0 && customWidth > 0 && customCats > 0;

                //Checks that there's no 'e' since type="number" lets you input 'e' for exponentials
                let noFieldsExponential = customHeight.indexOf('e') == -1 && customWidth.indexOf('e') == -1 && 
                customCats.indexOf('e') == -1;

                //If all three conditions are satisfied, enable the Custom difficulty button
                if(allFieldsFilled && allFieldsPositive && noFieldsExponential) {

                    customButton.disabled = false;

                } else {
                    
                    customButton.disabled = true;
                    
                }
            });
            
            //Handler for the reset button on the Play screen
            document.querySelector(RESET_BUTTON)
                .addEventListener("click", event => {

                    this.resetGame();
                });
        }
    }
}