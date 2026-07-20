const fs = require('fs');

const moreImages = {
  'Charlie Puth': 'https://cdn-images.dzcdn.net/images/artist/9f38f83196c81faeab5a59f518e9cff2/250x250-000000-80-0-0.jpg',
  'Katy Perry': 'https://cdn-images.dzcdn.net/images/artist/01a4bcbc8c3e8705f4305ec7cb6d31bb/250x250-000000-80-0-0.jpg',
  'Troye Sivan': 'https://cdn-images.dzcdn.net/images/artist/d17b20de840938ff56a237f374edfc45/250x250-000000-80-0-0.jpg',
  'ZAYN': 'https://cdn-images.dzcdn.net/images/artist/bcbebd7480a0fb9c656641e7d23d8c19/250x250-000000-80-0-0.jpg',
  'Conan Gray': 'https://cdn-images.dzcdn.net/images/artist/cc5056e180d70ce379b1df092ff991d3/250x250-000000-80-0-0.jpg',
  'Kesha': 'https://cdn-images.dzcdn.net/images/artist/11cc7c5a08bd2f7fa7fb2930eb5a6e25/250x250-000000-80-0-0.jpg',
  'Playboi Carti': 'https://cdn-images.dzcdn.net/images/artist/c17b8f0417934c9f131a4fa62baac816/250x250-000000-80-0-0.jpg',
  'Lil Uzi Vert': 'https://cdn-images.dzcdn.net/images/artist/c60010cc39f3ebc6731932ea48cf9f0e/250x250-000000-80-0-0.jpg',
  'Young Thug': 'https://cdn-images.dzcdn.net/images/artist/19eb2e0cfcd08534125b29b63486b72d/250x250-000000-80-0-0.jpg',
  'A$AP Rocky': 'https://cdn-images.dzcdn.net/images/artist/733979fdb23145d2e0523ed60912fbbd/250x250-000000-80-0-0.jpg',
  'Lil Yachty': 'https://cdn-images.dzcdn.net/images/artist/4ab0eb922c2a2dcff6d8cfd3d3a033ec/250x250-000000-80-0-0.jpg',
  'Pop Smoke': 'https://cdn-images.dzcdn.net/images/artist/230cc9eebfc8fc72e4ebef9eb98b4b74/250x250-000000-80-0-0.jpg', // placeholder
  'Juice WRLD': 'https://cdn-images.dzcdn.net/images/artist/683fb08d01d166ec7cda3a81763138b7/250x250-000000-80-0-0.jpg',
  'Gunna': 'https://cdn-images.dzcdn.net/images/artist/6c03e4c7c36800897fd468633286db24/250x250-000000-80-0-0.jpg',
  'Lil Baby': 'https://cdn-images.dzcdn.net/images/artist/845115c5bd4a22c5e53be126742512f4/250x250-000000-80-0-0.jpg'
};

let content = fs.readFileSync('constants.ts', 'utf-8');

const patchCode = `
Object.entries(${JSON.stringify(moreImages)}).forEach(([name, image]) => {
  if (image) {
    NPC_ARTIST_IMAGES[name] = image;
  }
});
`;

if (!content.includes('moreImages patch')) {
    content += "\n// moreImages patch\n" + patchCode;
    fs.writeFileSync('constants.ts', content);
    console.log('patched more images');
}
