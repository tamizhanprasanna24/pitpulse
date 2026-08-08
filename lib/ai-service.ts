import type { HealthRecord, Profile } from '@/types';

export interface AIResponse {
  text: string;
  severity?: 'low' | 'medium' | 'high';
  recommendations?: string[];
}

const symptomMap: Record<string, Omit<AIResponse, 'text'> & { response: string }> = {
  fever: {
    response: 'Based on your symptoms, you may have a common viral fever. Rest and stay hydrated. If fever persists beyond 3 days or exceeds 103F, consult a doctor immediately.',
    severity: 'medium',
    recommendations: ['Take Paracetamol 500mg every 6 hours as needed', 'Drink plenty of fluids', 'Get adequate rest', 'Monitor temperature every 4 hours'],
  },
  cough: {
    response: 'Your cough symptoms suggest a possible upper respiratory infection. Most coughs resolve within 1-2 weeks. If you experience chest pain or difficulty breathing, seek medical attention.',
    severity: 'low',
    recommendations: ['Stay hydrated', 'Use a humidifier', 'Try honey and warm water', 'Avoid cold beverages'],
  },
  headache: {
    response: 'Headaches can be caused by stress, dehydration, or eye strain. If headaches are severe, persistent, or accompanied by vision changes, consult a doctor.',
    severity: 'low',
    recommendations: ['Rest in a quiet, dark room', 'Stay hydrated', 'Try paracetamol if needed', 'Practice relaxation techniques'],
  },
  'stomach pain': {
    response: 'Stomach pain could indicate indigestion, gastritis, or food poisoning. If pain is severe, persistent, or accompanied by blood in stool, seek immediate medical care.',
    severity: 'medium',
    recommendations: ['Eat light, bland foods', 'Avoid spicy and oily food', 'Stay hydrated with ORS', 'Consider antacids for relief'],
  },
  'chest pain': {
    response: 'WARNING: Chest pain can be a sign of a serious cardiac event. If you experience severe chest pain, shortness of breath, or pain radiating to your arm or jaw, call emergency services immediately.',
    severity: 'high',
    recommendations: ['Call emergency services (108) immediately', 'Sit down and rest', 'Do not exert yourself', 'If prescribed, take aspirin'],
  },
  'shortness of breath': {
    response: 'Shortness of breath can indicate respiratory or cardiac issues. If severe or sudden, seek emergency medical care immediately.',
    severity: 'high',
    recommendations: ['Sit upright', 'Try pursed-lip breathing', 'Use prescribed inhaler if available', 'Call emergency services if severe'],
  },
  pregnancy: {
    response: 'During pregnancy, monitor your health regularly. Ensure proper nutrition, take folic acid supplements, and attend all prenatal checkups. Report any bleeding, severe pain, or reduced fetal movement to your doctor immediately.',
    severity: 'low',
    recommendations: ['Take prenatal vitamins daily', 'Eat a balanced diet rich in iron and calcium', 'Stay active with approved exercises', 'Attend all prenatal appointments'],
  },
  diabetes: {
    response: 'For diabetes management, monitor blood sugar regularly, maintain a low-sugar diet, and take prescribed medications. Target fasting sugar: 80-130 mg/dL, post-meal: <180 mg/dL.',
    severity: 'medium',
    recommendations: ['Check blood sugar daily', 'Follow a low-carb diet', 'Exercise 30 minutes daily', 'Take medications as prescribed'],
  },
  'high blood pressure': {
    response: 'High blood pressure (hypertension) requires regular monitoring. Reduce salt intake, exercise regularly, and take prescribed medications. Target: below 130/80 mmHg.',
    severity: 'medium',
    recommendations: ['Reduce sodium intake', 'Exercise regularly', 'Limit caffeine and alcohol', 'Take BP medications as prescribed'],
  },
};

export function getAIResponse(input: string): AIResponse {
  const lowerInput = input.toLowerCase().trim();
  for (const [key, value] of Object.entries(symptomMap)) {
    if (lowerInput.includes(key)) {
      return { text: value.response, severity: value.severity, recommendations: value.recommendations };
    }
  }
  if (lowerInput.includes('hello') || lowerInput.includes('hi') || lowerInput.includes('hey')) {
    return {
      text: 'Hello! I am your AI Health Assistant. I can help you with symptom checking, medicine recommendations, drug interactions, nutrition planning, and general health guidance. What would you like to know?',
    };
  }
  if (lowerInput.includes('medicine') || lowerInput.includes('medication')) {
    return {
      text: 'I can help you with medicine information. Please tell me the medicine name or describe your symptoms, and I will provide recommendations. Always consult a doctor before starting new medications.',
      recommendations: ['Always check for drug interactions', 'Follow prescribed dosage', 'Check expiry dates', 'Store medicines properly'],
    };
  }
  if (lowerInput.includes('nutrition') || lowerInput.includes('diet')) {
    return {
      text: 'A balanced diet includes fruits, vegetables, whole grains, lean proteins, and healthy fats. Aim for 2-3 liters of water daily. Limit processed foods, sugar, and excessive salt.',
      recommendations: ['Eat 5 servings of fruits and vegetables daily', 'Choose whole grains over refined', 'Include lean protein sources', 'Limit added sugars'],
    };
  }
  if (lowerInput.includes('exercise') || lowerInput.includes('workout')) {
    return {
      text: 'For general health, aim for 150 minutes of moderate exercise per week. This can include brisk walking, cycling, swimming, or yoga. Start gradually and increase intensity over time.',
      recommendations: ['Start with 20-30 minute walks daily', 'Add strength training 2x per week', 'Include stretching and flexibility work', 'Listen to your body and rest when needed'],
    };
  }
  return {
    text: 'I understand you are asking about a health concern. I can help with symptom checking, medicine information, nutrition, exercise, and general health guidance. Could you describe your symptoms or question in more detail? For emergencies, please use the SOS button or call 108.',
  };
}

export function getHealthInsights(records: HealthRecord[], profile: Profile | null): string[] {
  const insights: string[] = [];
  const latest: Record<string, HealthRecord> = {};
  records.forEach((r) => {
    if (!latest[r.type] || new Date(r.recorded_at) > new Date(latest[r.type].recorded_at)) {
      latest[r.type] = r;
    }
  });

  if (latest['blood_pressure']) {
    const sys = latest['blood_pressure'].value;
    const dia = latest['blood_pressure'].secondary_value ?? 80;
    if (sys >= 140 || dia >= 90) {
      insights.push('Your blood pressure is elevated. Consider reducing salt intake and consulting your doctor.');
    } else if (sys < 120 && dia < 80) {
      insights.push('Your blood pressure is in a healthy range. Keep up the good work!');
    }
  }

  if (latest['blood_sugar']) {
    if (latest['blood_sugar'].value >= 126) {
      insights.push('Your fasting blood sugar is high. Please consult your doctor about diabetes management.');
    } else if (latest['blood_sugar'].value < 100) {
      insights.push('Your blood sugar levels are normal. Maintain your current lifestyle.');
    }
  }

  if (latest['oxygen_saturation'] && latest['oxygen_saturation'].value < 95) {
    insights.push('Your oxygen saturation is below normal. If this persists, seek medical attention.');
  }

  if (latest['heart_rate']) {
    const hr = latest['heart_rate'].value;
    if (hr > 100) insights.push('Your heart rate is elevated. Rest and monitor. If persistent, consult a doctor.');
    else if (hr < 60) insights.push('Your resting heart rate is low. If you feel dizzy, seek medical advice.');
  }

  if (profile?.bmi) {
    if (profile.bmi < 18.5) insights.push('Your BMI indicates you are underweight. Consider a nutrient-rich diet.');
    else if (profile.bmi >= 25) insights.push('Your BMI indicates overweight. Regular exercise and diet adjustments recommended.');
  }

  if (profile?.is_pregnant && profile.pregnancy_week) {
    insights.push(`You are at ${profile.pregnancy_week} weeks of pregnancy. Ensure regular prenatal checkups and folic acid supplements.`);
  }

  if (insights.length === 0) {
    insights.push('Start logging your health metrics to receive personalized AI insights.');
  }

  return insights;
}

export function checkDrugInteraction(medicines: string[]): { hasInteraction: boolean; interactions: string[] } {
  const interactions: string[] = [];
  const knownInteractions: Record<string, string[]> = {
    'aspirin': ['ibuprofen', 'warfarin'],
    'metformin': ['alcohol'],
    'azithromycin': ['antacids'],
    'insulin': ['alcohol'],
    'amoxicillin': ['alcohol'],
  };

  for (let i = 0; i < medicines.length; i++) {
    for (let j = i + 1; j < medicines.length; j++) {
      const med1 = medicines[i].toLowerCase();
      const med2 = medicines[j].toLowerCase();
      if (knownInteractions[med1]?.includes(med2) || knownInteractions[med2]?.includes(med1)) {
        interactions.push(`Potential interaction between ${medicines[i]} and ${medicines[j]}`);
      }
    }
  }

  return { hasInteraction: interactions.length > 0, interactions };
}
