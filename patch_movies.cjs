const fs = require('fs');

let contextFile = '/app/applet/context/GameContext.tsx';
let contextContent = fs.readFileSync(contextFile, 'utf8');

const oldMovies = `['Dune: Part Three', 'Spider-Man 4', 'Knives Out 3', 'Avatar: Fire and Ash', 'Barbie 2', 'Oppenheimer: The Sequel', 'The Batman - Part II', 'Mission: Impossible 9', 'Gladiator III']`;
const newMovies = `['Dune: Part Three', 'Spider-Man 4', 'Knives Out 3', 'Avatar: Fire and Ash', 'Barbie 2', 'The Batman - Part II', 'Mission: Impossible 9', 'Gladiator III', 'Star Wars: New Jedi Order', 'Avengers: Secret Wars', 'Jurassic World: Rebirth', 'Fast X: Part 2', 'Deadpool 4', 'Top Gun 3', 'Wicked: Part Two', 'Black Panther 3', 'James Bond 26', 'The Hunger Games: Sunrise on the Reaping', 'The Odyssey']`;

const oldShows = `['The White Lotus', 'Stranger Things', 'House of the Dragon', 'Euphoria', 'The Last of Us', 'Severance', 'Succession Spin-off', 'The Bear']`;
const newShows = `['The White Lotus', 'Stranger Things', 'House of the Dragon', 'Euphoria', 'The Last of Us', 'Severance', 'Succession Spin-off', 'The Bear', 'Yellowjackets', 'Wednesday', 'Squid Game', 'The Boys', 'Bridgerton', 'Peacemaker', 'Fallout', 'Shogun', 'Black Mirror', 'The Mandalorian']`;

contextContent = contextContent.replace(oldMovies, newMovies);
contextContent = contextContent.replace(oldShows, newShows);

fs.writeFileSync(contextFile, contextContent);
console.log("Patched movies and shows");
