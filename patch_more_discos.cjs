const fs = require('fs');

const moreDiscos = {
  // 60s
  "The Beatles": { songs: ["Hey Jude", "Let It Be", "Yesterday", "Come Together", "Here Comes The Sun"], albums: ["Abbey Road", "Sgt. Pepper's Lonely Hearts Club Band", "The White Album"] },
  "The Beach Boys": { songs: ["Good Vibrations", "God Only Knows", "Wouldn't It Be Nice", "Surfin' U.S.A.", "California Girls"], albums: ["Pet Sounds", "Smile"] },
  "The Supremes": { start: 1959, end: 1977, genre: "R&B", songs: ["Stop! In the Name of Love", "You Can't Hurry Love", "Baby Love", "Where Did Our Love Go", "You Keep Me Hangin' On"], albums: ["Where Did Our Love Go", "More Hits by The Supremes"] },
  "Jimi Hendrix": { songs: ["Purple Haze", "All Along the Watchtower", "Voodoo Child (Slight Return)", "Hey Joe", "Little Wing"], albums: ["Are You Experienced", "Electric Ladyland"] },
  "Bob Dylan": { songs: ["Like a Rolling Stone", "Blowin' in the Wind", "Knockin' On Heaven's Door", "The Times They Are A-Changin'", "Tangled Up in Blue"], albums: ["Highway 61 Revisited", "Blood on the Tracks"] },
  
  // 70s
  "The Jackson 5": { songs: ["I Want You Back", "ABC", "I'll Be There", "Blame It on the Boogie", "Shake Your Body (Down to the Ground)"], albums: ["Diana Ross Presents The Jackson 5", "ABC"] },
  "Aerosmith": { songs: ["Dream On", "Sweet Emotion", "Walk This Way", "I Don't Want to Miss a Thing", "Crazy"], albums: ["Toys in the Attic", "Rocks"] },
  "The Clash": { songs: ["London Calling", "Should I Stay or Should I Go", "Rock the Casbah", "Train in Vain", "White Riot"], albums: ["London Calling", "Combat Rock"] },
  "Ramones": { songs: ["Blitzkrieg Bop", "I Wanna Be Sedated", "Sheena Is a Punk Rocker", "Beat on the Brat", "Rockaway Beach"], albums: ["Ramones", "Rocket to Russia"] },
  "Blondie": { songs: ["Heart of Glass", "Call Me", "One Way or Another", "Rapture", "The Tide Is High"], albums: ["Parallel Lines", "Autoamerican"] },
  
  // 80s
  "Duran Duran": { songs: ["Hungry Like the Wolf", "Rio", "Save a Prayer", "Girls on Film", "Ordinary World"], albums: ["Rio", "Duran Duran"] },
  "The Cure": { songs: ["Just Like Heaven", "Boys Don't Cry", "Lovesong", "Friday I'm In Love", "Pictures of You"], albums: ["Disintegration", "The Head on the Door"] },
  "Depeche Mode": { songs: ["Enjoy the Silence", "Personal Jesus", "Just Can't Get Enough", "Policy of Truth", "Never Let Me Down Again"], albums: ["Violator", "Music for the Masses"] },
  "The Smiths": { songs: ["There Is a Light That Never Goes Out", "This Charming Man", "How Soon Is Now?", "Heaven Knows I'm Miserable Now", "Bigmouth Strikes Again"], albums: ["The Queen Is Dead", "Meat Is Murder"] },
  "INXS": { songs: ["Need You Tonight", "Never Tear Us Apart", "New Sensation", "Devil Inside", "Suicide Blonde"], albums: ["Kick", "X"] },
  
  // 90s
  "TLC": { songs: ["No Scrubs", "Waterfalls", "Creep", "Unpretty", "Red Light Special"], albums: ["CrazySexyCool", "FanMail"] },
  "Spice Girls": { songs: ["Wannabe", "Stop", "Say You'll Be There", "2 Become 1", "Spice Up Your Life"], albums: ["Spice", "Spiceworld"] },
  "Backstreet Boys": { songs: ["I Want It That Way", "Everybody (Backstreet's Back)", "As Long as You Love Me", "Shape of My Heart", "Show Me the Meaning of Being Lonely"], albums: ["Millennium", "Backstreet's Back"] },
  "NSYNC": { songs: ["Bye Bye Bye", "Tearin' up My Heart", "It's Gonna Be Me", "This I Promise You", "Pop"], albums: ["No Strings Attached", "Celebrity"] },
  "The Notorious B.I.G.": { songs: ["Juicy", "Big Poppa", "Hypnotize", "Mo Money Mo Problems", "Sky's The Limit"], albums: ["Ready to Die", "Life After Death"] },
  
  // 00s
  "Black Eyed Peas": { songs: ["Where Is The Love?", "I Gotta Feeling", "Boom Boom Pow", "My Humps", "Pump It"], albums: ["The E.N.D.", "Monkey Business"] },
  "Nelly": { songs: ["Hot In Herre", "Dilemma", "Ride Wit Me", "Country Grammar (Hot Shit)", "Just A Dream"], albums: ["Country Grammar", "Nellyville"] }
};

let content = fs.readFileSync('realWorldDiscographies.ts', 'utf-8');

const patchCode = "\nObject.assign(REAL_WORLD_DISCOGRAPHIES, " + JSON.stringify(moreDiscos, null, 2) + ");\n";

if (!content.includes('The Beatles')) {
    content += patchCode;
    fs.writeFileSync('realWorldDiscographies.ts', content);
    console.log('Added more discographies');
} else {
    console.log('Already added discographies');
}

