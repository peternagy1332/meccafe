type Profile = {
  id: string;
  my_interests: string[];
  my_gender: string;
  my_age_range: string;
  pref_interests: string[];
  pref_gender: string | null;
  pref_age_range: string | null;
};

function satisfiesGenderPreference(
  candidate: Profile,
  seeker: Profile
): boolean {
  if (seeker.pref_gender === null) return true;
  return candidate.my_gender === seeker.pref_gender;
}

function satisfiesAgePreference(candidate: Profile, seeker: Profile): boolean {
  if (seeker.pref_age_range === null) return true;
  return candidate.my_age_range === seeker.pref_age_range;
}

function countOverlappingInterests(
  candidateInterests: string[],
  seekerPreferences: string[]
): number {
  return candidateInterests.filter((interest) =>
    seekerPreferences.includes(interest)
  ).length;
}

export function calculateMatchScore(
  candidate: Profile,
  seeker: Profile
): number {
  let score = 0;

  if (satisfiesGenderPreference(candidate, seeker)) {
    score += 10;
  }

  if (satisfiesAgePreference(candidate, seeker)) {
    score += 10;
  }

  score += countOverlappingInterests(
    candidate.my_interests,
    seeker.pref_interests
  );

  return score;
}

export function isMutualMatch(profileA: Profile, profileB: Profile): boolean {
  const aSatisfiesB =
    satisfiesGenderPreference(profileA, profileB) &&
    satisfiesAgePreference(profileA, profileB);

  const bSatisfiesA =
    satisfiesGenderPreference(profileB, profileA) &&
    satisfiesAgePreference(profileB, profileA);

  return aSatisfiesB && bSatisfiesA;
}

export function findBestMatch(
  seeker: Profile,
  candidates: Profile[]
): Profile | null {
  let bestMatch: Profile | null = null;
  let bestScore = -1;

  for (const candidate of candidates) {
    if (candidate.id === seeker.id) continue;

    if (!isMutualMatch(seeker, candidate)) continue;

    const scoreFromSeeker = calculateMatchScore(candidate, seeker);
    const scoreFromCandidate = calculateMatchScore(seeker, candidate);
    const combinedScore = scoreFromSeeker + scoreFromCandidate;

    if (combinedScore > bestScore) {
      bestScore = combinedScore;
      bestMatch = candidate;
    }
  }

  return bestMatch;
}
