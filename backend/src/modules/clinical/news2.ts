export interface VitalInput {
  heartRate?: number;
  spo2Percent?: number;
  systolicBp?: number;
  diastolicBp?: number;
  respiratoryRate?: number;
  temperatureC?: number;
}

export interface NEWS2Result {
  totalScore: number;
  acuityLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  isCriticalAlert: boolean;
  scoreBreakdown: Record<string, number>;
  redFlags: string[];
}

export function calculateNEWS2(vitals: VitalInput): NEWS2Result {
  const breakdown: Record<string, number> = {};
  const redFlags: string[] = [];

  // 1. Respiration Rate (bpm)
  if (vitals.respiratoryRate !== undefined) {
    const rr = vitals.respiratoryRate;
    if (rr <= 8) {
      breakdown.respiratoryRate = 3;
      redFlags.push('Severe Bradypnea (RR <= 8)');
    } else if (rr >= 9 && rr <= 11) {
      breakdown.respiratoryRate = 1;
    } else if (rr >= 12 && rr <= 20) {
      breakdown.respiratoryRate = 0;
    } else if (rr >= 21 && rr <= 24) {
      breakdown.respiratoryRate = 2;
    } else {
      breakdown.respiratoryRate = 3;
      redFlags.push('Severe Tachypnea (RR >= 25)');
    }
  }

  // 2. Oxygen Saturation (SpO2 %)
  if (vitals.spo2Percent !== undefined) {
    const spo2 = vitals.spo2Percent;
    if (spo2 <= 91) {
      breakdown.spo2Percent = 3;
      redFlags.push('Severe Hypoxia (SpO2 <= 91%)');
    } else if (spo2 >= 92 && spo2 <= 93) {
      breakdown.spo2Percent = 2;
    } else if (spo2 >= 94 && spo2 <= 95) {
      breakdown.spo2Percent = 1;
    } else {
      breakdown.spo2Percent = 0;
    }
  }

  // 3. Systolic Blood Pressure (mmHg)
  if (vitals.systolicBp !== undefined) {
    const sbp = vitals.systolicBp;
    if (sbp <= 90) {
      breakdown.systolicBp = 3;
      redFlags.push('Severe Hypotension (SBP <= 90)');
    } else if (sbp >= 91 && sbp <= 100) {
      breakdown.systolicBp = 2;
    } else if (sbp >= 101 && sbp <= 110) {
      breakdown.systolicBp = 1;
    } else if (sbp >= 111 && sbp <= 219) {
      breakdown.systolicBp = 0;
    } else {
      breakdown.systolicBp = 3;
      redFlags.push('Severe Hypertension (SBP >= 220)');
    }
  }

  // 4. Heart Rate (bpm)
  if (vitals.heartRate !== undefined) {
    const hr = vitals.heartRate;
    if (hr <= 40) {
      breakdown.heartRate = 3;
      redFlags.push('Severe Bradycardia (HR <= 40)');
    } else if (hr >= 41 && hr <= 50) {
      breakdown.heartRate = 1;
    } else if (hr >= 51 && hr <= 90) {
      breakdown.heartRate = 0;
    } else if (hr >= 91 && hr <= 110) {
      breakdown.heartRate = 1;
    } else if (hr >= 111 && hr <= 130) {
      breakdown.heartRate = 2;
    } else {
      breakdown.heartRate = 3;
      redFlags.push('Severe Tachycardia (HR >= 131)');
    }
  }

  // 5. Temperature (°C)
  if (vitals.temperatureC !== undefined) {
    const temp = vitals.temperatureC;
    if (temp <= 35.0) {
      breakdown.temperatureC = 3;
      redFlags.push('Hypothermia (Temp <= 35.0°C)');
    } else if (temp >= 35.1 && temp <= 36.0) {
      breakdown.temperatureC = 1;
    } else if (temp >= 36.1 && temp <= 38.0) {
      breakdown.temperatureC = 0;
    } else if (temp >= 38.1 && temp <= 39.0) {
      breakdown.temperatureC = 1;
    } else {
      breakdown.temperatureC = 2;
    }
  }

  const totalScore = Object.values(breakdown).reduce((acc, curr) => acc + curr, 0);

  let acuityLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (totalScore >= 7 || redFlags.length > 0) {
    acuityLevel = 'HIGH';
  } else if (totalScore >= 5 || Object.values(breakdown).some((s) => s === 3)) {
    acuityLevel = 'MEDIUM';
  }

  const isCriticalAlert = totalScore >= 7 || redFlags.length > 0;

  return {
    totalScore,
    acuityLevel,
    isCriticalAlert,
    scoreBreakdown: breakdown,
    redFlags,
  };
}
