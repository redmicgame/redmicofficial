export interface BillboardHot100Formula {
    decade: string;
    eraTitle: string;
    yearsSpan: string;
    radio: number;     // 0.0 - 1.0 (Percentage weight)
    streaming: number; // 0.0 - 1.0 (Percentage weight)
    digital: number;   // 0.0 - 1.0 (Percentage weight)
    physical: number;  // 0.0 - 1.0 (Percentage weight)
    description: string;
}

export const getBillboardFormula = (year: number): BillboardHot100Formula => {
    if (year < 2000) {
        // 1990s: The Radio & Physical Era (1990 - 1999)
        // Radio Airplay: 70%, Physical Sales: 30%, Digital Sales: 0%, Streaming Activity: 0%
        return {
            decade: '1990s',
            eraTitle: 'The Radio & Physical Era',
            yearsSpan: '1990 – 1999',
            radio: 0.70,
            streaming: 0.00,
            digital: 0.00,
            physical: 0.30,
            description: 'Songs are ranked based on radio airplay (70%) and physical single sales (30%). No digital, no streaming.'
        };
    } else if (year < 2010) {
        // 2000s: The Digital Transition Era (2000 - 2009)
        // Radio Airplay: 55%, Digital Sales: 30%, Physical Sales: 15%, Streaming Activity: 0%
        return {
            decade: '2000s',
            eraTitle: 'The Digital Transition Era',
            yearsSpan: '2000 – 2009',
            radio: 0.55,
            streaming: 0.00,
            digital: 0.30,
            physical: 0.15,
            description: 'Radio leads (55%), digital downloads are a major factor (30%), and physical sales decline (15%). No streaming.'
        };
    } else if (year < 2020) {
        // 2010s: The Streaming Revolution (2010 - 2019)
        // Streaming Activity: 40%, Radio Airplay: 40%, Digital Sales: 10%, Physical Sales: 10%
        return {
            decade: '2010s',
            eraTitle: 'The Streaming Revolution',
            yearsSpan: '2010 – 2019',
            radio: 0.40,
            streaming: 0.40,
            digital: 0.10,
            physical: 0.10,
            description: 'Streaming (40%) and radio (40%) are the two biggest drivers. Digital downloads (10%) and physical singles (10%) have smaller weight.'
        };
    } else {
        // 2020s: The All-Access Era (2020 - Present)
        // Streaming Activity: ~78%, Radio Airplay: ~20%, Sales: ~2% (Digital 1%, Physical 1%)
        return {
            decade: '2020s',
            eraTitle: 'The All-Access Era',
            yearsSpan: '2020 – Present',
            radio: 0.20,
            streaming: 0.78,
            digital: 0.01,
            physical: 0.01,
            description: 'Streaming dominates the chart (~78%). Radio accounts for ~20%, and sales make up the remaining ~2% (~1% digital, ~1% physical).'
        };
    }
};

export const getEraConfiguration = (year: number) => {
    const billboardFormula = getBillboardFormula(year);
    return {
        // Formats
        physicalSalesActive: year < 2018, // After 2018 physical sales don't die completely but become niche/vinyl
        digitalSalesActive: year >= 2003, // iTunes era begins around 2003
        streamingActive: year >= 2010,   // Billboard added streaming in 2010
        
        // Billboard Hot 100 Formula
        billboardFormula,

        // Platforms
        printMediaActive: year < 2015,
        myspaceAvailable: year >= 2003 && year < 2012,
        xAvailable: year >= 2008,        // Twitter founded in 2006, mainstream ~2008
        instagramAvailable: year >= 2012,// Instagram mainstream ~2012
        tiktokAvailable: year >= 2018,   // Musical.ly merged to TikTok
        youtubeAvailable: year >= 2005,  // YouTube founded in 2005
        onlyfansAvailable: year >= 2016,

        // UI Era
        uiMode: getUIMode(year),
        
        // Market Multipliers
        // How much of the total reach converts to each type depends on the year
        marketShare: {
            physical: getPhysicalShare(year),
            digital: getDigitalShare(year),
            streaming: getStreamingShare(year),
            radio: getRadioShare(year)
        }
    };
};

const getUIMode = (year: number) => {
    if (year < 2004) return 'webPortal';
    if (year < 2010) return 'flipPhone';
    return 'smartphone';
};

const getPhysicalShare = (year: number) => {
    if (year < 2000) return 0.9;
    if (year < 2003) return 0.8;
    if (year < 2010) return 0.6;
    if (year < 2014) return 0.3;
    if (year < 2020) return 0.1;
    return 0.05; // Vinyl resurgence
};

const getDigitalShare = (year: number) => {
    if (year < 2003) return 0.0;
    if (year < 2010) return 0.3;
    if (year < 2014) return 0.5;
    if (year < 2020) return 0.2;
    return 0.05;
};

const getStreamingShare = (year: number) => {
    if (year < 2008) return 0.0;
    if (year < 2014) return 0.1; // early Spotify
    if (year < 2020) return 0.6;
    return 0.85;
};

const getRadioShare = (year: number) => {
    if (year < 2000) return 1.0;
    if (year < 2010) return 0.8;
    if (year < 2020) return 0.5;
    return 0.3;
};
