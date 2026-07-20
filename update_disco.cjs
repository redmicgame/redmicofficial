const fs = require('fs');

const moreDiscos = {
  // 70s
  "Aretha Franklin": { songs: ["Respect", "Chain of Fools", "Think", "I Say a Little Prayer", "Rock Steady"], albums: ["I Never Loved a Man the Way I Love You", "Lady Soul", "Aretha Now"] },
  "Diana Ross": { songs: ["Ain't No Mountain High Enough", "Upside Down", "I'm Coming Out", "Love Hangover", "Endless Love"], albums: ["Diana Ross", "Diana", "The Boss"] },
  "Bee Gees": { songs: ["Stayin' Alive", "How Deep Is Your Love", "Night Fever", "More Than a Woman", "Tragedy"], albums: ["Saturday Night Fever", "Spirits Having Flown"] },
  "The Rolling Stones": { songs: ["Paint It, Black", "Sympathy for the Devil", "Gimme Shelter", "(I Can't Get No) Satisfaction", "Start Me Up"], albums: ["Sticky Fingers", "Exile on Main St.", "Some Girls"] },
  "Eagles": { songs: ["Hotel California", "Take It Easy", "Desperado", "One of These Nights", "Life in the Fast Lane"], albums: ["Hotel California", "Desperado", "The Long Run"] },
  "Donna Summer": { songs: ["I Feel Love", "Hot Stuff", "Bad Girls", "Last Dance", "Love to Love You Baby"], albums: ["Bad Girls", "Love to Love You Baby", "Once Upon a Time"] },
  "David Bowie": { songs: ["Starman", "Space Oddity", "Heroes", "Let's Dance", "Life on Mars?"], albums: ["The Rise and Fall of Ziggy Stardust", "Heroes", "Let's Dance"] },
  "Elton John": { songs: ["Rocket Man", "Tiny Dancer", "Your Song", "Bennie and the Jets", "Goodbye Yellow Brick Road"], albums: ["Goodbye Yellow Brick Road", "Honky Château"] },
  "Stevie Wonder": { songs: ["Superstition", "Isn't She Lovely", "Sir Duke", "I Wish", "Higher Ground"], albums: ["Songs in the Key of Life", "Innervisions"] },
  "Fleetwood Mac": { songs: ["Dreams", "The Chain", "Go Your Own Way", "Rhiannon", "Landslide"], albums: ["Rumours", "Fleetwood Mac", "Tusk"] },
  "Queen": { songs: ["Bohemian Rhapsody", "Don't Stop Me Now", "Another One Bites the Dust", "Under Pressure", "We Will Rock You"], albums: ["A Night at the Opera", "News of the World"] },
  "ABBA": { songs: ["Dancing Queen", "Mamma Mia", "Gimme! Gimme! Gimme!", "Waterloo", "Take a Chance on Me"], albums: ["Arrival", "Voulez-Vous", "The Album"] },
  "Pink Floyd": { songs: ["Wish You Were Here", "Comfortably Numb", "Money", "Another Brick in the Wall, Pt. 2", "Time"], albums: ["The Dark Side of the Moon", "The Wall", "Wish You Were Here"] },
  "Led Zeppelin": { songs: ["Stairway to Heaven", "Immigrant Song", "Whole Lotta Love", "Kashmir", "Black Dog"], albums: ["Led Zeppelin IV", "Physical Graffiti"] },

  // 80s
  "Tina Turner": { songs: ["What's Love Got to Do with It", "The Best", "Proud Mary", "Private Dancer", "We Don't Need Another Hero"], albums: ["Private Dancer", "Break Every Rule"] },
  "Cyndi Lauper": { songs: ["Girls Just Want to Have Fun", "Time After Time", "True Colors", "All Through the Night", "She Bop"], albums: ["She's So Unusual", "True Colors"] },
  "Cher": { songs: ["Believe", "If I Could Turn Back Time", "Strong Enough", "Gypsys, Tramps & Thieves", "Half-Breed"], albums: ["Believe", "Heart of Stone"] },
  "Def Leppard": { songs: ["Pour Some Sugar on Me", "Photograph", "Love Bites", "Hysteria", "Animal"], albums: ["Hysteria", "Pyromania"] },
  "AC/DC": { songs: ["Back In Black", "Highway to Hell", "Thunderstruck", "You Shook Me All Night Long", "T.N.T."], albums: ["Back in Black", "Highway to Hell"] },
  "Bruce Springsteen": { songs: ["Born to Run", "Dancing in the Dark", "Born in the U.S.A.", "I'm on Fire", "Glory Days"], albums: ["Born in the U.S.A.", "Born to Run"] },
  "U2": { songs: ["With or Without You", "Beautiful Day", "I Still Haven't Found What I'm Looking For", "Sunday Bloody Sunday", "One"], albums: ["The Joshua Tree", "Achtung Baby"] },
  "George Michael": { songs: ["Careless Whisper", "Faith", "Freedom! '90", "Father Figure", "One More Try"], albums: ["Faith", "Listen Without Prejudice Vol. 1"] },
  "Phil Collins": { songs: ["In the Air Tonight", "Against All Odds", "Another Day in Paradise", "Sussudio", "You Can't Hurry Love"], albums: ["No Jacket Required", "Face Value"] },
  "Bon Jovi": { songs: ["Livin' On A Prayer", "You Give Love A Bad Name", "It's My Life", "Wanted Dead or Alive", "Always"], albums: ["Slippery When Wet", "Crush"] },
  "Guns N' Roses": { songs: ["Sweet Child O' Mine", "Welcome to the Jungle", "November Rain", "Paradise City", "Patience"], albums: ["Appetite for Destruction", "Use Your Illusion I"] },
  "Janet Jackson": { songs: ["Rhythm Nation", "That's the Way Love Goes", "Together Again", "Any Time, Any Place", "Nasty"], albums: ["Rhythm Nation 1814", "Control", "janet."] },

  // 90s
  "Shania Twain": { songs: ["Man! I Feel Like A Woman!", "You're Still The One", "That Don't Impress Me Much", "Any Man Of Mine", "From This Moment On"], albums: ["Come On Over", "The Woman in Me"] },
  "No Doubt": { songs: ["Don't Speak", "Just A Girl", "Spiderwebs", "It's My Life", "Hella Good"], albums: ["Tragic Kingdom", "Rock Steady"] },
  "Aaliyah": { songs: ["Are You That Somebody", "Try Again", "Rock the Boat", "One In A Million", "More Than A Woman"], albums: ["One in a Million", "Aaliyah"] },
  "Lauryn Hill": { songs: ["Doo Wop (That Thing)", "Ex-Factor", "Everything Is Everything", "To Zion", "Lost Ones"], albums: ["The Miseducation of Lauryn Hill"] },
  "Pearl Jam": { songs: ["Alive", "Even Flow", "Jeremy", "Black", "Yellow Ledbetter"], albums: ["Ten", "Vs."] },
  "Red Hot Chili Peppers": { songs: ["Californication", "Under the Bridge", "Can't Stop", "Snow (Hey Oh)", "Scar Tissue"], albums: ["Californication", "Blood Sugar Sex Magik"] },
  "Oasis": { songs: ["Wonderwall", "Don't Look Back In Anger", "Champagne Supernova", "Live Forever", "Stop Crying Your Heart Out"], albums: ["(What's the Story) Morning Glory?", "Definitely Maybe"] },
  "Radiohead": { songs: ["Creep", "Karma Police", "No Surprises", "Fake Plastic Trees", "Paranoid Android"], albums: ["OK Computer", "The Bends", "In Rainbows"] },
  "Snoop Dogg": { songs: ["Gin and Juice", "Drop It Like It's Hot", "Who Am I (What's My Name)?", "Beautiful", "Sensual Seduction"], albums: ["Doggystyle", "Tha Doggfather"] },
  "Jay-Z": { songs: ["Empire State of Mind", "Ni**as In Paris", "99 Problems", "Dirt Off Your Shoulder", "Hard Knock Life"], albums: ["The Blueprint", "The Black Album"] },
  "Destiny's Child": { songs: ["Say My Name", "Survivor", "Independent Women, Pt. 1", "Jumpin', Jumpin'", "Bootylicious"], albums: ["The Writing's on the Wall", "Survivor"] },

  // 00s
  "Eminem": { songs: ["Lose Yourself", "Without Me", "The Real Slim Shady", "Stan", "Not Afraid"], albums: ["The Marshall Mathers LP", "The Eminem Show"] },
  "Christina Aguilera": { songs: ["Genie In a Bottle", "Beautiful", "Fighter", "Dirrty", "Ain't No Other Man"], albums: ["Stripped", "Christina Aguilera"] },
  "Kelly Clarkson": { songs: ["Since U Been Gone", "Because of You", "Stronger (What Doesn't Kill You)", "Breakaway", "My Life Would Suck Without You"], albums: ["Breakaway", "Thankful"] },
  "Avril Lavigne": { songs: ["Complicated", "Sk8er Boi", "Girlfriend", "I'm with You", "My Happy Ending"], albums: ["Let Go", "Under My Skin"] },
  "P!nk": { songs: ["So What", "Just Give Me a Reason", "Get the Party Started", "Who Knew", "Raise Your Glass"], albums: ["M!ssundaztood", "Funhouse"] },
  "Justin Timberlake": { songs: ["Cry Me a River", "SexyBack", "Mirrors", "Rock Your Body", "Can't Stop the Feeling!"], albums: ["FutureSex/LoveSounds", "Justified"] },
  "Missy Elliott": { songs: ["Work It", "Get Ur Freak On", "Lose Control", "The Rain (Supa Dupa Fly)", "Gossip Folks"], albums: ["Under Construction", "Miss E... So Addictive"] },
  "Beyoncé": { songs: ["Crazy In Love", "Halo", "Single Ladies", "Irreplaceable", "Love On Top"], albums: ["Dangerously in Love", "B'Day", "I Am... Sasha Fierce"] },
  "Rihanna": { songs: ["Umbrella", "Diamonds", "We Found Love", "Don't Stop The Music", "Only Girl (In the World)"], albums: ["Good Girl Gone Bad", "Loud"] },
  "Coldplay": { songs: ["Yellow", "Viva La Vida", "The Scientist", "Fix You", "Clocks"], albums: ["A Rush of Blood to the Head", "Viva la Vida or Death and All His Friends"] },
  "Linkin Park": { songs: ["In the End", "Numb", "What I've Done", "Crawling", "Somewhere I Belong"], albums: ["Hybrid Theory", "Meteora"] },
  "Alicia Keys": { songs: ["Fallin'", "If I Ain't Got You", "No One", "Girl on Fire", "You Don't Know My Name"], albums: ["Songs in A Minor", "The Diary of Alicia Keys"] },
  "Usher": { songs: ["Yeah!", "Burn", "U Got It Bad", "My Boo", "Confessions Part II"], albums: ["Confessions", "8701"] },
  "OutKast": { songs: ["Hey Ya!", "Ms. Jackson", "Roses", "The Way You Move", "B.O.B."], albums: ["Speakerboxxx/The Love Below", "Stankonia"] },
  "50 Cent": { songs: ["In Da Club", "Candy Shop", "21 Questions", "P.I.M.P.", "Just a Lil Bit"], albums: ["Get Rich or Die Tryin'", "The Massacre"] },
  "Green Day": { songs: ["Boulevard of Broken Dreams", "Basket Case", "American Idiot", "Wake Me Up When September Ends", "Good Riddance"], albums: ["American Idiot", "Dookie"] },
  "Lady Gaga": { songs: ["Bad Romance", "Poker Face", "Just Dance", "Paparazzi", "Born This Way"], albums: ["The Fame Monster", "Born This Way"] },
  "Katy Perry": { songs: ["Firework", "Dark Horse", "Roar", "Teenage Dream", "California Gurls"], albums: ["Teenage Dream", "PRISM"] }
};

let content = fs.readFileSync('realWorldDiscographies.ts', 'utf-8');

const patchCode = "\nObject.assign(REAL_WORLD_DISCOGRAPHIES, " + JSON.stringify(moreDiscos, null, 2) + ");\n";

if (!content.includes('Aretha Franklin')) {
    content += patchCode;
    fs.writeFileSync('realWorldDiscographies.ts', content);
    console.log('Added more discographies');
} else {
    console.log('Already added discographies');
}
