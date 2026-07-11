import fs from 'fs';
let code = fs.readFileSync('types.ts', 'utf8');
code = code.replace(
  'fallonPerformanceRequestedForSongId?: string;',
  'fallonPerformanceRequestedForSongId?: string;\n  magazineInterviewRequestedForSongId?: string;\n  newspaperInterviewRequestedForSongId?: string;\n  tvInterviewRequestedForSongId?: string;'
);
code = code.replace(
  'activeFallonOffer: {',
  'activeInterviewOffer?: {\n    releaseId: string;\n    interviewType: "magazine" | "newspaper" | "tv";\n    outletName: string;\n    emailId: string;\n  } | null;\n  activeFallonOffer: {'
);
code = code.replace(
  '"createFallonInterview"',
  '"createFallonInterview"\n  | "createMagazineInterview"\n  | "createTvInterview"'
);
fs.writeFileSync('types.ts', code);
