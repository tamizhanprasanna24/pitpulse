export function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function calculateBMI(heightCm: number, weightKg: number): number {
  if (!heightCm || !weightKg) return 0;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export function getBMICategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-warning' };
  if (bmi < 25) return { label: 'Normal', color: 'text-success' };
  if (bmi < 30) return { label: 'Overweight', color: 'text-warning' };
  return { label: 'Obese', color: 'text-destructive' };
}

export function getHealthScore(records: { type: string; value: number; secondary_value: number | null }[]): number {
  let score = 70;
  const latest: Record<string, { value: number; secondary: number | null }> = {};
  records.forEach((r) => {
    latest[r.type] = { value: r.value, secondary: r.secondary_value };
  });

  if (latest['blood_pressure']) {
    const sys = latest['blood_pressure'].value;
    const dia = latest['blood_pressure'].secondary ?? 80;
    if (sys < 120 && dia < 80) score += 10;
    else if (sys < 140 && dia < 90) score += 3;
    else score -= 8;
  }
  if (latest['blood_sugar']) {
    const bs = latest['blood_sugar'].value;
    if (bs < 100) score += 8;
    else if (bs < 126) score += 2;
    else score -= 6;
  }
  if (latest['heart_rate']) {
    const hr = latest['heart_rate'].value;
    if (hr >= 60 && hr <= 100) score += 5;
    else score -= 4;
  }
  if (latest['oxygen_saturation']) {
    if (latest['oxygen_saturation'].value >= 95) score += 7;
    else score -= 10;
  }
  if (latest['bmi']) {
    if (latest['bmi'].value >= 18.5 && latest['bmi'].value < 25) score += 5;
    else score -= 3;
  }

  return Math.max(0, Math.min(100, score));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(dateStr);
}

export function haversineDistance(
  lat1: number, lon1: number, lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function getPregnancyWeekInfo(week: number): { trimester: number; weeksLeft: number; daysLeft: number } {
  const trimester = week <= 12 ? 1 : week <= 26 ? 2 : 3;
  const totalWeeks = 40;
  const weeksLeft = Math.max(0, totalWeeks - week);
  const daysLeft = weeksLeft * 7;
  return { trimester, weeksLeft, daysLeft };
}
