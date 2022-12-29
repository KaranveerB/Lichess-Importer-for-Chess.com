// ==UserScript==
// @name         Lichess Importer for Chess.com
// @namespace    https://github.com/KaranveerB
// @homepage     https://github.com/KaranveerB/Lichess-Importer-for-Chess.com
// @version      1.0
// @encoding     utf-8
// @description  Adds button to import Chess.com game to Lichess
// @author       KaranveerB
// @match        https://www.chess.com/game/live/*
// @downloadURL  https://github.com/KaranveerB/Lichess-Importer-for-Chess.com/LichessImporterForChess-com.user.js
// @updateURL    https://github.com/KaranveerB/Lichess-Importer-for-Chess.com/LichessImporterForChess-com.user.js
// @grant        GM.xmlHttpRequest
// ==/UserScript==

"use strict";

const START_DELAY_MS = 3000; /// tweak if needed. TODO: Figure out better way than this

const $ = document.querySelector.bind(document)

if( document.readyState !== "loading" ) {
    init();
} else {
    document.addEventListener("DOMContentLoaded", function () {
        init();
    });
};

// from https://stackoverflow.com/a/64996707
function sleep(ms) {
  return new Promise(resolveFunc => setTimeout(resolveFunc, ms));
}

function log(msg) {
	console.log("LIC: " + msg)
}

async function init() {
	log("(Lichess Importer for Chess.com) loaded");
	log("waiting...")
	await sleep(START_DELAY_MS); // arbitrary sleep for tabs to load
    log("starting");
	if (!injectButton()) {
		log("terminating");
		throw new Error();
	}
    log("button injection complete");
};

function injectButton() {
	log("injecting button");
	let tabs_container = document.querySelector(".tabs-component");
	if (tabs_container === null) {
		log("failed to find div to inject in html");
		return false;
	}

	let new_tab =`\
		<div class="tabs-tab lichessImport" role="tab" tabindex="0" class="tabs-tab">\
			<span class="icon-font-chess chess-board-search tabs-icon"></span>\
			<span class="tabs-label">Import to<br>Lichess</span>\
		</div>`;
	tabs_container.insertAdjacentHTML('beforeend', new_tab);

	let injected_new_tab = document.querySelector('.lichessImport');
	injected_new_tab.onclick = importToLichess;
	return true;
}

function importToLichess() {
	let gamePGN = getGamePGN();
	callLichessImportAPI(gamePGN);
}

function getGamePGN() {
	log("getting game pgn");
	return $("chess-board").game.getPGN();
}

function callLichessImportAPI(gamePGN) {
	log("calling Lichess API")
	GM_xmlhttpRequest({
		method: "POST",
		url: "https://lichess.org/api/import",
		headers: {
			"User-Agent": "Lichess Importer for Chess.com at github.com/KaranveerB/Lichess-Importer-for-Chess.com",
			"Content-Type": "application/x-www-form-urlencoded"
		},
		data: "pgn=" + encodeURI(gamePGN),
		onload: function(response) {
			handleLichessImportAPIResponse(response);
		},
	});
}

function handleLichessImportAPIResponse(response) {
	if (response.status === 200) {
		openImportedGame(response);
	} else {
		failedToImportGame(response);
	}
}

function openImportedGame(response) {
	const importedGameURL = JSON.parse(response.response)["url"];
	log("imported game url: " + importedGameURL);
	log("opening imported game on lichess");
	window.open(importedGameURL);
}

function failedToImportGame(response) {
	log("failed to import game to lichess");
	log("terminating");
	throw new Error();
}