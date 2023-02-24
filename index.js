// store pokemon data in an object:
let pokemonData = {};

// local storage key
const localStorageKey = "pokedex";

// root element
const mainElement = document.getElementById("main");

// navbar events:
const buttonHome = document.getElementById("button-home");
buttonHome.addEventListener("click", () => renderData(getData()));

const buttonNext = document.getElementById("button-next");
buttonNext.addEventListener("click", () => renderData(getData(pokemonData.next)));

const buttonPrev = document.getElementById("button-prev");
buttonPrev.addEventListener("click", () => renderData(getData(pokemonData.previous)));

// search event:
const searchPokemonText = document.getElementById("search-text");
const searchButton = document.getElementById("search-button");

let searchData = [];

// the search event handler function is async because we need the data immediately
searchButton.addEventListener("click", async () => {
	if (!searchData.length)
		searchData = await getApi(
			"https://pokeapi.co/api/v2/pokemon/?offset=0&limit=" + pokemonData.count
		);
	// search through allPokemonData for given text
	const searchResults = {
		results: searchData.results.filter((pokemon) => pokemon.name.includes(searchPokemonText.value)),
	};
	// if search had any results render them
	if (searchResults.results[0]) renderData(searchResults);
	else if (searchPokemonText.value == "") renderData(getData());
	else render("No result found.");

	console.log("VAL: " + searchPokemonText.value);
});

// search partial text:
// #1 store await getApi("https://pokeapi.co/api/v2/pokemon/?offset=0&limit=" + pokemonData.count) in a var.
// #2 check if #1 has data, if yes do a search in the data, else run #1

searchPokemonText.addEventListener("keyup", function (event) {
	if (event.keyCode === 13) {
		searchButton.click();
	}
});

searchPokemonText.addEventListener("input", async (event) => {
	console.log("test" + event.data);

	if (!searchData.length)
		searchData = await getApi(
			"https://pokeapi.co/api/v2/pokemon/?offset=0&limit=" + pokemonData.count
		);

	// search through allPokemonData for given text
	const searchResults = {
		results: searchData.results.filter((pokemon) => pokemon.name.includes(event.target.value)),
	};
	// if search had any results render them

	//console.log(searchResults)
	if (searchResults.results[0]) renderData(searchResults);
	else if (event.target.value == "") renderData(getData());
	else render("No result found.");
});

// render functions:

// replace html content in the mainElement with given parameter
function render(string) {
	mainElement.innerHTML = string;
}

// view a small pokemon card
function viewCardSmall(pokemon, dataDetails) {
	return `
  <div class="card" id="${pokemon.url}">
      <h3>${pokemon.name}</h3>
      <img src="${dataDetails.sprites.front_default}" alt=" "/>
  </div>`;
}

// view a detailed pokemon card:
function viewCardBig({ id, name, sprites, height, weight, base_experience, types, stats }) {
	const pokemonTypes = types.map(({ type }) => `<h3>${type.name}</h3>`).join("");

	const pokemonStats = stats
		.map(
			({ stat, base_stat, effort }) =>
				`<h3>${stat.name}</h3><h3>${base_stat}</h3><h3>${effort}</h3><hr>`
		)
		.join("");

	return `
  <div class="card-big">
        <h2>${id}. ${name}</h2>
        <img src="${sprites.front_default}" alt="">

        <div class="card-stats">
            <div class="info">
                <h3 class="height">${height / 10}m</h3>
                <h3 class="weight">${weight / 10}kg</h3>
                <h3 class="xp">${base_experience}xp</h3>
            </div>
            <div class="types">
                ${pokemonTypes}
            </div>

            <div class="stats">
                ${pokemonStats}
            </div>
        </div>
    </div>`;
}

// localStorage functions:

// read pokemonData from localStorage, takes url as parameter:
function getLocalStorageItem(url) {
	if (!localStorage.getItem(localStorageKey)) return; // if localstorage is empty just return nothing
	// return items stored as object: {url: data, url: data, ...}
	return JSON.parse(localStorage.getItem(localStorageKey))[url];
}
// write pokemon data to localStorage, takes url and data as parameters:
function setLocalStorage(url, data) {
	// get all data we currently have in localstorage as an object
	let currentData = JSON.parse(localStorage.getItem(localStorageKey));
	// create a temporary object to store new data we want to append
	let newData = { [url]: data };
	// append to localStorage
	localStorage.setItem(localStorageKey, JSON.stringify({ ...currentData, ...newData }));
}

// Async fetch data from given url parameter, update and return a promise with the data.
async function getData(url = "https://pokeapi.co/api/v2/pokemon/") {
	// check if we have data in localStorage (and update if needed):
	pokemonData = getLocalStorageItem(url);
	if (!pokemonData) {
		const apiData = await getApi(url);
		setLocalStorage(url, apiData);
		pokemonData = apiData;
	}

	if (pokemonData.previous == null)
		pokemonData.previous = `https://pokeapi.co/api/v2/pokemon/?offset=${
			pokemonData.count - 20
		}&limit=20`;
	if (pokemonData.next == null) pokemonData.next = "https://pokeapi.co/api/v2/pokemon/";

	return pokemonData;
}

// render data, and add click events to pokemon cards.
async function renderData(data) {
	if (!data) return;

	let processedData = await data;

	let pokemonHtml = "";
	// the getApi call should be in a different function:
	for (const pokemon of processedData.results) {
		let pokemonDetails = await getApi(pokemon.url);
		pokemonHtml += viewCardSmall(pokemon, pokemonDetails);
	}

	render(pokemonHtml);

	// add events to pokemon cards
	const pokemonCardElements = document.querySelectorAll(".card");
	pokemonCardElements.forEach((card) => {
		card.addEventListener("click", async (event) => {
			// Set pokemonDetailsUrl to value of event.target.id, or if it has no value, set it to event.target.parentElement.id
			let pokemonDetailsUrl = event.target.id || event.target.parentElement.id;

			// check if we have data in localStorage (and update if needed):
			let pokemonDetails = getLocalStorageItem(pokemonDetailsUrl);
			if (!pokemonDetails) {
				pokemonDetails = await getApi(pokemonDetailsUrl);
				setLocalStorage(pokemonDetailsUrl, pokemonDetails);
			}
			render(viewCardBig(pokemonDetails));
		});
	});
}

// on page load run renderData:
renderData(getData());

// Async fetch data and return promise
async function getApi(url) {
	const request = await fetch(url);
	const data = await request.json();

	return data;
}
