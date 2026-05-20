const check = async () => {
    const res = await fetch('https://api.deezer.com/search/artist?q=taylor%20swift');
    const data = await res.json();
    console.log(data.data[0].picture_xl);
}
check();
