const fs = require('fs');
let content = fs.readFileSync('constants.ts', 'utf-8');

const newEras = {
  // 70s
  "David Bowie": { start: 1969, end: 2016, genre: "Rock", image: "https://e-cdns-images.dzcdn.net/images/artist/f1d7e2f5b4ed697ccabcf9163e8a4a58/250x250-000000-80-0-0.jpg" },
  "Elton John": { start: 1969, end: 2050, genre: "Pop", image: "https://e-cdns-images.dzcdn.net/images/artist/a824706db6ed2a4176461b2fc8ad0dfc/250x250-000000-80-0-0.jpg" },
  "Stevie Wonder": { start: 1962, end: 2050, genre: "R&B", image: "https://e-cdns-images.dzcdn.net/images/artist/b28096f9bf11b66ebbb1296c6b412140/250x250-000000-80-0-0.jpg" },
  "Fleetwood Mac": { start: 1968, end: 2050, genre: "Rock", image: "https://e-cdns-images.dzcdn.net/images/artist/f9630c33ad78a834c9c22eb430dcb989/250x250-000000-80-0-0.jpg" },
  "Queen": { start: 1973, end: 2050, genre: "Rock", image: "https://e-cdns-images.dzcdn.net/images/artist/23c14d485ee414cae818bbd0a79040db/250x250-000000-80-0-0.jpg" },
  "ABBA": { start: 1972, end: 1982, genre: "Pop", image: "https://e-cdns-images.dzcdn.net/images/artist/d5ebf9fc325143a1a9e33d262df5846c/250x250-000000-80-0-0.jpg" },
  "Pink Floyd": { start: 1967, end: 2014, genre: "Rock", image: "https://e-cdns-images.dzcdn.net/images/artist/8cc53ff33be927164ccb6ce2ec9e4ba6/250x250-000000-80-0-0.jpg" },
  "Led Zeppelin": { start: 1969, end: 1980, genre: "Rock", image: "https://e-cdns-images.dzcdn.net/images/artist/43e74ff1f3bf78b4d08e56314ff9478e/250x250-000000-80-0-0.jpg" },
  
  // 80s
  "Bruce Springsteen": { start: 1973, end: 2050, genre: "Rock", image: "https://e-cdns-images.dzcdn.net/images/artist/335805560940dcf16d470d04c4f9eb66/250x250-000000-80-0-0.jpg" },
  "U2": { start: 1980, end: 2050, genre: "Rock", image: "https://e-cdns-images.dzcdn.net/images/artist/6b68596fde6be6ecab39cb32eefdd920/250x250-000000-80-0-0.jpg" },
  "George Michael": { start: 1982, end: 2016, genre: "Pop", image: "https://e-cdns-images.dzcdn.net/images/artist/a1be2e68449c25f4ab36181b5fbce306/250x250-000000-80-0-0.jpg" },
  "Phil Collins": { start: 1981, end: 2050, genre: "Pop", image: "https://e-cdns-images.dzcdn.net/images/artist/b06385d5ad198308cf2b170e7e1694c9/250x250-000000-80-0-0.jpg" },
  "Bon Jovi": { start: 1984, end: 2050, genre: "Rock", image: "https://e-cdns-images.dzcdn.net/images/artist/b2fa8bc635583b27b3e839e9fc1f912a/250x250-000000-80-0-0.jpg" },
  "Guns N' Roses": { start: 1987, end: 2050, genre: "Rock", image: "https://e-cdns-images.dzcdn.net/images/artist/7733cc50d87edfa15739c9df382fb2e4/250x250-000000-80-0-0.jpg" },
  "Janet Jackson": { start: 1982, end: 2050, genre: "R&B", image: "https://e-cdns-images.dzcdn.net/images/artist/f1cc5bcba18a10b42f6c8d4512c1404c/250x250-000000-80-0-0.jpg" },
  
  // 90s
  "Mariah Carey": { start: 1990, end: 2050, genre: "R&B", image: "https://e-cdns-images.dzcdn.net/images/artist/f56641e7d23d8c1995a329d675bb2f69/250x250-000000-80-0-0.jpg" },
  "Celine Dion": { start: 1990, end: 2050, genre: "Pop", image: "https://e-cdns-images.dzcdn.net/images/artist/7e4a77b311319dbf678cded0c67e1a38/250x250-000000-80-0-0.jpg" },
  "Spice Girls": { start: 1996, end: 2000, genre: "Pop", image: "https://e-cdns-images.dzcdn.net/images/artist/b7a2d6742512f45037d453715c0a373b/250x250-000000-80-0-0.jpg" },
  "TLC": { start: 1992, end: 2050, genre: "R&B", image: "https://e-cdns-images.dzcdn.net/images/artist/81005a39626c8cd1cf9c9f28ecb3a2a6/250x250-000000-80-0-0.jpg" },
  "Oasis": { start: 1994, end: 2009, genre: "Rock", image: "https://e-cdns-images.dzcdn.net/images/artist/735dbd26a2675713dfce0cfcd31a7836/250x250-000000-80-0-0.jpg" },
  "Radiohead": { start: 1992, end: 2050, genre: "Rock", image: "https://e-cdns-images.dzcdn.net/images/artist/7c7a522dd4bb134958ce74e6f49dd9e8/250x250-000000-80-0-0.jpg" },
  "Snoop Dogg": { start: 1992, end: 2050, genre: "Hip Hop", image: "https://e-cdns-images.dzcdn.net/images/artist/bdab4cc8dbad3a9dae88ff39ccb36ce9/250x250-000000-80-0-0.jpg" },
  "Jay-Z": { start: 1996, end: 2050, genre: "Hip Hop", image: "https://e-cdns-images.dzcdn.net/images/artist/ecb18f081c7f9df8813a7c64a39b3cc1/250x250-000000-80-0-0.jpg" },
  "Destiny's Child": { start: 1997, end: 2006, genre: "R&B", image: "https://e-cdns-images.dzcdn.net/images/artist/88b5668eeb1161d2d3e4e7303e3a479d/250x250-000000-80-0-0.jpg" },
  
  // 00s
  "Beyoncé": { start: 2003, end: 2050, genre: "R&B", image: "https://e-cdns-images.dzcdn.net/images/artist/b6f5cf1de36f875323a7891bc86ff542/250x250-000000-80-0-0.jpg" },
  "Rihanna": { start: 2005, end: 2050, genre: "Pop", image: "https://e-cdns-images.dzcdn.net/images/artist/33e382b68378619bcbb8f9ce136d8be6/250x250-000000-80-0-0.jpg" },
  "Coldplay": { start: 2000, end: 2050, genre: "Rock", image: "https://e-cdns-images.dzcdn.net/images/artist/8d7fc4917462762a74c4dbb242e881dc/250x250-000000-80-0-0.jpg" },
  "Linkin Park": { start: 2000, end: 2050, genre: "Rock", image: "https://e-cdns-images.dzcdn.net/images/artist/3cc3f8da08e9d8f3ea7f9e8557997672/250x250-000000-80-0-0.jpg" },
  "Alicia Keys": { start: 2001, end: 2050, genre: "R&B", image: "https://e-cdns-images.dzcdn.net/images/artist/a232f01fbd8f168fbcfffc07153a5518/250x250-000000-80-0-0.jpg" },
  "Usher": { start: 1994, end: 2050, genre: "R&B", image: "https://e-cdns-images.dzcdn.net/images/artist/1e7cc4d8123df16d5570bbcc671755fb/250x250-000000-80-0-0.jpg" },
  "OutKast": { start: 1994, end: 2014, genre: "Hip Hop", image: "https://e-cdns-images.dzcdn.net/images/artist/b7ee0420b72a6b2259eb5607dbfa33f9/250x250-000000-80-0-0.jpg" },
  "50 Cent": { start: 2003, end: 2050, genre: "Hip Hop", image: "https://e-cdns-images.dzcdn.net/images/artist/e7a22f9c3230a1334c9c7fecfa1cded3/250x250-000000-80-0-0.jpg" },
  "Green Day": { start: 1994, end: 2050, genre: "Rock", image: "https://e-cdns-images.dzcdn.net/images/artist/bd3bba65b6f00dbba3b1d167ef088fa6/250x250-000000-80-0-0.jpg" },
  "Lady Gaga": { start: 2008, end: 2050, genre: "Pop", image: "https://e-cdns-images.dzcdn.net/images/artist/d1ff8217bbba9c6f272a843916960cc2/250x250-000000-80-0-0.jpg" },
  "Katy Perry": { start: 2008, end: 2050, genre: "Pop", image: "https://e-cdns-images.dzcdn.net/images/artist/01a4bcbc8c3e8705f4305ec7cb6d31bb/250x250-000000-80-0-0.jpg" },
  
  // Future updates for 2025+
  "Huda Mustafa": { start: 2025, end: 2050, genre: "Pop", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60" },
  "TRIM": { start: 2025, end: 2050, genre: "Hip Hop", image: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60" },
  "Sunshine Benzi": { start: 2025, end: 2050, genre: "R&B", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60" },
  "Stunna Sandy": { start: 2025, end: 2050, genre: "Hip Hop", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60" },
  
  // Adding the missing images for artists previously added
  "Charlie Puth": { start: 2015, end: 2050, genre: "Pop", image: "https://e-cdns-images.dzcdn.net/images/artist/9f38f83196c81faeab5a59f518e9cff2/250x250-000000-80-0-0.jpg" },
  "Troye Sivan": { start: 2014, end: 2050, genre: "Pop", image: "https://e-cdns-images.dzcdn.net/images/artist/d17b20de840938ff56a237f374edfc45/250x250-000000-80-0-0.jpg" },
  "ZAYN": { start: 2016, end: 2050, genre: "Pop", image: "https://e-cdns-images.dzcdn.net/images/artist/bcbebd7480a0fb9c656641e7d23d8c19/250x250-000000-80-0-0.jpg" },
  "Conan Gray": { start: 2018, end: 2050, genre: "Pop", image: "https://e-cdns-images.dzcdn.net/images/artist/cc5056e180d70ce379b1df092ff991d3/250x250-000000-80-0-0.jpg" },
  "Kesha": { start: 2009, end: 2050, genre: "Pop", image: "https://e-cdns-images.dzcdn.net/images/artist/11cc7c5a08bd2f7fa7fb2930eb5a6e25/250x250-000000-80-0-0.jpg" },
  "Playboi Carti": { start: 2017, end: 2050, genre: "Hip Hop", image: "https://e-cdns-images.dzcdn.net/images/artist/c17b8f0417934c9f131a4fa62baac816/250x250-000000-80-0-0.jpg" },
  "Lil Uzi Vert": { start: 2015, end: 2050, genre: "Hip Hop", image: "https://e-cdns-images.dzcdn.net/images/artist/c60010cc39f3ebc6731932ea48cf9f0e/250x250-000000-80-0-0.jpg" },
  "Young Thug": { start: 2014, end: 2050, genre: "Hip Hop", image: "https://e-cdns-images.dzcdn.net/images/artist/19eb2e0cfcd08534125b29b63486b72d/250x250-000000-80-0-0.jpg" },
  "A$AP Rocky": { start: 2011, end: 2050, genre: "Hip Hop", image: "https://e-cdns-images.dzcdn.net/images/artist/733979fdb23145d2e0523ed60912fbbd/250x250-000000-80-0-0.jpg" },
  "Lil Yachty": { start: 2016, end: 2050, genre: "Hip Hop", image: "https://e-cdns-images.dzcdn.net/images/artist/4ab0eb922c2a2dcff6d8cfd3d3a033ec/250x250-000000-80-0-0.jpg" },
  "Pop Smoke": { start: 2019, end: 2020, genre: "Hip Hop", image: "https://e-cdns-images.dzcdn.net/images/artist/230cc9eebfc8fc72e4ebef9eb98b4b74/250x250-000000-80-0-0.jpg" },
  "Juice WRLD": { start: 2018, end: 2019, genre: "Hip Hop", image: "https://e-cdns-images.dzcdn.net/images/artist/683fb08d01d166ec7cda3a81763138b7/250x250-000000-80-0-0.jpg" },
  "Gunna": { start: 2018, end: 2050, genre: "Hip Hop", image: "https://e-cdns-images.dzcdn.net/images/artist/6c03e4c7c36800897fd468633286db24/250x250-000000-80-0-0.jpg" },
  "Lil Baby": { start: 2017, end: 2050, genre: "Hip Hop", image: "https://e-cdns-images.dzcdn.net/images/artist/845115c5bd4a22c5e53be126742512f4/250x250-000000-80-0-0.jpg" }
};

if (!content.includes('// Eras new additions')) {
    content += "\n// Eras new additions\n";
    content += "Object.assign(NPC_ERAS, " + JSON.stringify(newEras, null, 2) + ");\n";
    
    // In order for NPC_ARTIST_NAMES to not get double-added if we re-run,
    // the previous block I added `Object.entries(NPC_ERAS).forEach(...)` is fine because it checks if it exists.
    
    fs.writeFileSync('constants.ts', content);
    console.log('Added eras to constants');
} else {
    console.log('Already added');
}
