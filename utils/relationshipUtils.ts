import { Relationship, RelationshipPeriod, Kid } from '../types';

export function formatDurationFromWeeks(totalWeeks: number): string {
  const weeks = Math.max(0, Math.round(totalWeeks));
  if (weeks <= 0) return '0 weeks';
  if (weeks < 4) {
    return `${weeks} week${weeks === 1 ? '' : 's'}`;
  } else if (weeks < 52) {
    const months = Math.floor(weeks / 4);
    const remWeeks = weeks % 4;
    if (remWeeks > 0) {
      return `${months} mo${months === 1 ? '' : 's'} ${remWeeks} wk${remWeeks === 1 ? '' : 's'}`;
    }
    return `${months} month${months === 1 ? '' : 's'}`;
  } else {
    const years = Math.floor(weeks / 52);
    const remMonths = Math.floor((weeks % 52) / 4);
    if (remMonths > 0) {
      return `${years} yr${years === 1 ? '' : 's'}, ${remMonths} mo${remMonths === 1 ? '' : 's'}`;
    }
    return `${years} year${years === 1 ? '' : 's'}`;
  }
}

export function formatMarriageDuration(
  startYear: number,
  startWeek: number | undefined,
  currentYear: number,
  currentWeek: number
): string {
  const sWeek = startWeek || 1;
  const totalWeeks = Math.max(1, (currentYear * 52 + currentWeek) - (startYear * 52 + sWeek));
  return formatDurationFromWeeks(totalWeeks);
}

export interface DetailedRelationshipStats {
  totalTogetherWeeks: number;
  totalTogetherFormatted: string;
  totalMarriedWeeks: number;
  totalMarriedFormatted: string;
  totalEngagedWeeks: number;
  totalEngagedFormatted: string;
  timesTogether: number;
  sharedKids: Kid[];
  allPeriods: Array<{
    periodNumber: number;
    startDateFormatted: string;
    endDateFormatted: string;
    durationFormatted: string;
    durationWeeks: number;
    finalStatus: string;
    marriedWeeks?: number;
    marriedFormatted?: string;
    engagedWeeks?: number;
    engagedFormatted?: string;
    splitReason?: string;
  }>;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function formatDateFromYearWeek(year: number, week?: number): string {
  const w = Math.max(1, Math.min(52, week || 1));
  const monthIdx = Math.min(11, Math.floor((w - 1) / 4.333));
  return `${MONTH_NAMES[monthIdx]} ${year} (Wk ${w})`;
}

export function calculateRelationshipDurations(
  rel: Relationship,
  currentYear: number,
  currentWeek: number,
  allKids: Kid[] = []
): DetailedRelationshipStats {
  const sharedKids = allKids.filter(k => k.parentName === rel.partnerName);

  let totalTogetherWeeks = 0;
  let totalMarriedWeeks = 0;
  let totalEngagedWeeks = 0;

  const periodsList: DetailedRelationshipStats['allPeriods'] = [];

  // Historical completed periods
  const historicalPeriods: RelationshipPeriod[] = rel.periods && rel.periods.length > 0
    ? [...rel.periods]
    : [];

  // If rel has no recorded periods in rel.periods yet, but it has endYear (it was an ex from older save)
  if (historicalPeriods.length === 0 && rel.endYear !== null) {
    historicalPeriods.push({
      id: 'initial_period_' + rel.id,
      startDate: { year: rel.startYear, week: rel.startWeek || 1 },
      endDate: { year: rel.endYear, week: rel.endWeek || 52 },
      finalStatus: rel.status,
      engagedStartYear: rel.engagedStartYear,
      engagedStartWeek: rel.engagedStartWeek,
      marriedStartYear: rel.marriedStartYear,
      marriedStartWeek: rel.marriedStartWeek,
      splitReason: rel.divorceCase?.isFinalized ? 'Divorced in court' : 'Broke up',
    });
  }

  historicalPeriods.forEach((p, idx) => {
    const sWeeks = p.startDate.year * 52 + (p.startDate.week || 1);
    const endY = p.endDate?.year ?? (p.startDate.year + 1);
    const endW = p.endDate?.week ?? 1;
    const eWeeks = endY * 52 + endW;
    const durWeeks = Math.max(1, eWeeks - sWeeks);

    totalTogetherWeeks += durWeeks;

    // Engaged duration in this period
    let pEngagedWeeks = 0;
    if (p.engagedStartYear) {
      const engS = p.engagedStartYear * 52 + (p.engagedStartWeek || 1);
      const engE = p.marriedStartYear ? (p.marriedStartYear * 52 + (p.marriedStartWeek || 1)) : eWeeks;
      pEngagedWeeks = Math.max(0, engE - engS);
      totalEngagedWeeks += pEngagedWeeks;
    }

    // Married duration in this period
    let pMarriedWeeks = 0;
    if (p.marriedStartYear) {
      const marS = p.marriedStartYear * 52 + (p.marriedStartWeek || 1);
      pMarriedWeeks = Math.max(0, eWeeks - marS);
      totalMarriedWeeks += pMarriedWeeks;
    }

    periodsList.push({
      periodNumber: idx + 1,
      startDateFormatted: formatDateFromYearWeek(p.startDate.year, p.startDate.week),
      endDateFormatted: p.endDate ? formatDateFromYearWeek(p.endDate.year, p.endDate.week) : 'Ended',
      durationFormatted: formatDurationFromWeeks(durWeeks),
      durationWeeks: durWeeks,
      finalStatus: p.finalStatus,
      marriedWeeks: pMarriedWeeks > 0 ? pMarriedWeeks : undefined,
      marriedFormatted: pMarriedWeeks > 0 ? formatDurationFromWeeks(pMarriedWeeks) : undefined,
      engagedWeeks: pEngagedWeeks > 0 ? pEngagedWeeks : undefined,
      engagedFormatted: pEngagedWeeks > 0 ? formatDurationFromWeeks(pEngagedWeeks) : undefined,
      splitReason: p.splitReason || (p.finalStatus === 'married' ? 'Divorced' : 'Split up'),
    });
  });

  // If currently active (endYear is null)
  if (rel.endYear === null) {
    const curStartWeeks = rel.startYear * 52 + (rel.startWeek || 1);
    const nowWeeks = currentYear * 52 + currentWeek;
    const activeWeeks = Math.max(1, nowWeeks - curStartWeeks);

    totalTogetherWeeks += activeWeeks;

    let activeEngagedWeeks = 0;
    if (rel.engagedStartYear) {
      const engS = rel.engagedStartYear * 52 + (rel.engagedStartWeek || 1);
      const engE = rel.marriedStartYear ? (rel.marriedStartYear * 52 + (rel.marriedStartWeek || 1)) : nowWeeks;
      activeEngagedWeeks = Math.max(0, engE - engS);
      totalEngagedWeeks += activeEngagedWeeks;
    }

    let activeMarriedWeeks = 0;
    if (rel.marriedStartYear) {
      const marS = rel.marriedStartYear * 52 + (rel.marriedStartWeek || 1);
      activeMarriedWeeks = Math.max(0, nowWeeks - marS);
      totalMarriedWeeks += activeMarriedWeeks;
    }

    periodsList.push({
      periodNumber: historicalPeriods.length + 1,
      startDateFormatted: formatDateFromYearWeek(rel.startYear, rel.startWeek),
      endDateFormatted: 'Present (Current)',
      durationFormatted: formatDurationFromWeeks(activeWeeks),
      durationWeeks: activeWeeks,
      finalStatus: rel.status,
      marriedWeeks: activeMarriedWeeks > 0 ? activeMarriedWeeks : undefined,
      marriedFormatted: activeMarriedWeeks > 0 ? formatDurationFromWeeks(activeMarriedWeeks) : undefined,
      engagedWeeks: activeEngagedWeeks > 0 ? activeEngagedWeeks : undefined,
      engagedFormatted: activeEngagedWeeks > 0 ? formatDurationFromWeeks(activeEngagedWeeks) : undefined,
      splitReason: 'Active Relationship',
    });
  }

  const timesTogether = Math.max(1, rel.timesDated || periodsList.length);

  return {
    totalTogetherWeeks,
    totalTogetherFormatted: formatDurationFromWeeks(totalTogetherWeeks),
    totalMarriedWeeks,
    totalMarriedFormatted: formatDurationFromWeeks(totalMarriedWeeks),
    totalEngagedWeeks,
    totalEngagedFormatted: formatDurationFromWeeks(totalEngagedWeeks),
    timesTogether,
    sharedKids,
    allPeriods: periodsList,
  };
}
