import type { HealthRecord, Profile } from '@/types';

export interface AIResponse {
  text: string;
  severity?: 'low' | 'medium' | 'high';
  category?: 'symptom' | 'medicine' | 'nutrition' | 'exercise' | 'pregnancy' | 'emergency' | 'general';
  recommendations?: string[];
  precautions?: string[];
  suggestedActions?: string[];
}

const ADVANCED_KNOWLEDGE_BASE: Array<{
  keywords: string[];
  category: 'symptom' | 'medicine' | 'nutrition' | 'exercise' | 'pregnancy' | 'emergency' | 'general';
  severity: 'low' | 'medium' | 'high';
  title: string;
  response: string;
  recommendations: string[];
  precautions: string[];
}> = [
  {
    keywords: ['chest pain', 'heart attack', 'cardiac', 'pain in chest', 'tightness in chest', 'left arm pain'],
    category: 'emergency',
    severity: 'high',
    title: '🚨 CRITICAL MEDICAL ADVISORY: CHEST PAIN',
    response: 'Chest pain or severe tightness can indicate a acute cardiac event (heart attack) or pulmonary emergency. Immediate emergency medical evaluation is required.',
    recommendations: [
      'Call Emergency Services (108 / 112) or dispatch Emergency SOS immediately',
      'Sit down comfortably in a semi-upright position and remain calm',
      'Loosen any tight clothing around the neck and chest',
      'If recommended by a doctor and available, chew a 325mg Aspirin tablet',
      'Do not attempt to drive yourself to the hospital'
    ],
    precautions: ['Do not ignore chest pain', 'Avoid physical exertion', 'Do not take heavy meals or caffeine']
  },
  {
    keywords: ['shortness of breath', 'breathing problem', 'cannot breathe', 'gasping', 'suffocation', 'wheezing severe'],
    category: 'emergency',
    severity: 'high',
    title: '🚨 CRITICAL ADVISORY: RESPIRATORY DISTRESS',
    response: 'Sudden or severe difficulty in breathing is a medical emergency requiring urgent clinical intervention.',
    recommendations: [
      'Sit upright leaning slightly forward to ease breathing',
      'Use a prescribed rescue inhaler (e.g. Salbutamol 2 puffs) if you have asthma/COPD',
      'Ensure room is well-ventilated with open windows or fresh air',
      'Call emergency SOS (108) or reach the nearest hospital ER immediately'
    ],
    precautions: ['Do not lie flat on your back', 'Avoid smoke, dust, or cold air exposures']
  },
  {
    keywords: ['fever', 'high temperature', 'chills', 'pyrexia', 'body temperature', 'hot body', 'viral fever', 'flu'],
    category: 'symptom',
    severity: 'medium',
    title: '🌡️ FEVER & INFECTION GUIDANCE',
    response: 'Fever is the body’s natural immune response to fighting viral or bacterial infections. Temperature above 100.4°F (38°C) warrants careful monitoring.',
    recommendations: [
      'Take Paracetamol 500mg - 650mg every 6 hours as needed for temperature > 100°F (Max 3000mg/day)',
      'Apply cold water sponges on forehead, neck, and armpits to lower body temperature',
      'Drink 2.5 to 3 Liters of fluids daily (coconut water, ORS, warm soups, herbal tea)',
      'Ensure complete physical rest in a cool, well-ventilated room',
      'Consult a physician if fever lasts more than 3 days or exceeds 103°F'
    ],
    precautions: ['Avoid heavy blankets that trap heat', 'Do not take antibiotics without a doctor’s prescription', 'Check for warning signs like stiff neck or rash']
  },
  {
    keywords: ['dengue', 'malaria', 'typhoid', 'mosquito fever', 'platelet', 'chills rigor'],
    category: 'symptom',
    severity: 'medium',
    title: '🦟 VECTOR-BORNE & TROPICAL FEVER ADVISORY',
    response: 'Symptoms like high fever with severe joint/eyeball pain (Dengue), shaking chills (Malaria), or persistent step-ladder fever (Typhoid) require laboratory confirmation.',
    recommendations: [
      'Get a Complete Blood Count (CBC), Dengue NS1 Antigen, or Peripheral Blood Smear for Malaria',
      'Maintain continuous hydration with ORS and fresh fluids',
      'Take Paracetamol ONLY for fever and body pain',
      'Monitor platelet count if Dengue is suspected'
    ],
    precautions: ['STRICTLY AVOID Painkillers like Aspirin, Ibuprofen, or Naproxen as they increase bleeding risk in Dengue', 'Use mosquito nets & repellents']
  },
  {
    keywords: ['headache', 'migraine', 'head throbbing', 'head pain', 'temple pain'],
    category: 'symptom',
    severity: 'low',
    title: '🧠 HEADACHE & MIGRAINE MANAGEMENT',
    response: 'Headaches are commonly caused by stress, dehydration, eye strain, lack of sleep, or migraine triggers.',
    recommendations: [
      'Rest in a quiet, dark, and cool room with eyes closed',
      'Drink 500ml to 1 Liter of fresh water or electrolyte solution',
      'Apply a cold compress on forehead or ice pack on back of the neck for 15 mins',
      'Consider OTC Paracetamol 500mg or Naproxen if symptoms interfere with activities'
    ],
    precautions: ['Limit screen time on phones and laptops', 'Avoid loud noise and bright fluorescent lights', 'Seek emergency care if headache is sudden & explosive ("thunderclap")']
  },
  {
    keywords: ['cough', 'cold', 'sore throat', 'runny nose', 'phlegm', 'congestion', 'sneezing', 'throat pain', 'tonsil'],
    category: 'symptom',
    severity: 'low',
    title: '🤧 COLD, COUGH & THROAT CARE',
    response: 'Upper respiratory tract infections (common cold/flu) typically resolve naturally in 7-10 days with supportive home care.',
    recommendations: [
      'Gargle with warm salt water 3-4 times daily to soothe throat inflammation',
      'Inhale warm steam for 5-10 minutes twice daily to relieve sinus and bronchial congestion',
      'Drink warm water infused with honey, ginger, and turmeric',
      'Use saline nasal drops for nasal blockage'
    ],
    precautions: ['Do not take antibiotics for viral colds', 'Avoid chilled ice water, ice creams, and smoking']
  },
  {
    keywords: ['stomach pain', 'abdominal pain', 'gastritis', 'acidity', 'gas', 'indigestion', 'heartburn', 'stomach ache', 'bloating', 'gerd'],
    category: 'symptom',
    severity: 'low',
    title: '🪨 GASTROINTESTINAL & ACIDITY GUIDANCE',
    response: 'Stomach discomfort is frequently caused by hyperacidity, gastritis, irregular meal timings, spicy food, or mild indigestion.',
    recommendations: [
      'Take an antacid syrup or PPI (e.g. Pantoprazole 40mg 30 mins before breakfast if prescribed)',
      'Sip cold milk, chamomile tea, or coconut water to neutralize stomach acid',
      'Eat small, bland meals (khichdi, curd rice, toast) and avoid lying down for 2 hours post meals',
      'Walk gently for 10-15 minutes after eating'
    ],
    precautions: ['Avoid raw spicy foods, fried snacks, coffee, carbonated drinks, and alcohol', 'Seek emergency care if pain radiates to back or involves vomiting blood']
  },
  {
    keywords: ['vomiting', 'nausea', 'diarrhea', 'loose motion', 'food poisoning', 'dysentery', 'stomach infection'],
    category: 'symptom',
    severity: 'medium',
    title: '💧 DEHYDRATION & REHYDRATION PROTOCOL (ORS)',
    response: 'Vomiting and loose motions lead to rapid loss of body water and vital electrolytes (sodium & potassium). Preventing dehydration is the #1 priority.',
    recommendations: [
      'Drink 1 sachet of WHO-formula Oral Rehydration Salts (ORS) dissolved in 1 Liter of clean water throughout the day',
      'Consume light fluids: rice kanji, lemon salt water, barley water, and curd (probiotic)',
      'Take Zinc supplements (20mg daily for 14 days) to aid intestinal recovery',
      'Use Probiotics (e.g. Sporlac / Econorm) to restore healthy gut flora'
    ],
    precautions: ['Do not stop fluids', 'Avoid sugary fruit juices or sodas which worsen diarrhea', 'See a doctor if blood appears in stool or high fever develops']
  },
  {
    keywords: ['blood pressure', 'hypertension', 'high bp', 'bp reading', 'systolic', 'diastolic', '120/80', '140/90'],
    category: 'symptom',
    severity: 'medium',
    title: '🫀 BLOOD PRESSURE MANAGEMENT & TARGETS',
    response: 'Normal Blood Pressure is around 120/80 mmHg. Persistent readings above 130/80 mmHg indicate hypertension requiring lifestyle and medical control.',
    recommendations: [
      'Restrict daily salt intake to under 3.75 grams (1 teaspoon max)',
      'Engage in 30 minutes of moderate aerobic exercise (brisk walking) 5 days a week',
      'Maintain regular medication compliance without skipping doses',
      'Record BP readings twice daily (morning & evening) in your PitPulse Health Tracker'
    ],
    precautions: ['Avoid pickles, papads, canned foods, and processed snacks high in sodium', 'Limit caffeine & manage emotional stress']
  },
  {
    keywords: ['diabetes', 'sugar level', 'blood sugar', 'fasting sugar', 'post prandial', 'hba1c', 'high sugar', 'glucose'],
    category: 'symptom',
    severity: 'medium',
    title: '🩸 DIABETES & BLOOD GLUCOSE CONTROL',
    response: 'Target blood glucose levels: Fasting 80-130 mg/dL, Post-meal (2 hrs) < 180 mg/dL, HbA1c < 7.0%. Proper glycemic control prevents long-term organ complications.',
    recommendations: [
      'Follow a Low-Glycemic Index diet: brown rice, millets, oats, green leafy vegetables, and pulses',
      'Walk for 15-20 minutes after major meals to reduce post-prandial sugar spikes',
      'Take prescribed oral hypoglycemics (Metformin, etc.) or Insulin doses on exact schedules',
      'Check feet daily for minor cuts, numbness, or blisters'
    ],
    precautions: ['Avoid refined white sugar, sweets, bakery products, and fruit juices', 'Keep glucose tablets or candy handy for hypoglycemia symptoms (< 70 mg/dL)']
  },
  {
    keywords: ['pregnancy', 'pregnant', 'trimester', 'baby growth', 'morning sickness', 'folic acid', 'fetal', 'ultrasound', 'maternal'],
    category: 'pregnancy',
    severity: 'low',
    title: '🤰 PREGNANCY CARE & MATERNAL HEALTH GUIDANCE',
    response: 'Pregnancy requires balanced nutrition, regular prenatal visits, essential micronutrient supplementation, and routine ultrasound scans.',
    recommendations: [
      'Take daily Folic Acid (5mg) & Iron + Calcium supplements as prescribed by your Obstetrician',
      'Eat small, frequent protein-rich meals to manage morning sickness and nausea',
      'Drink at least 3 Liters of clean water daily',
      'Attend all scheduled ANC checkups (TT injections, blood tests, USG scans)'
    ],
    precautions: ['NEVER take any self-medication during pregnancy', 'Avoid heavy lifting, intense physical strain, and raw unpasteurized foods', 'Report any vaginal bleeding, severe abdominal cramps, or reduced baby movements immediately']
  },
  {
    keywords: ['paracetamol', 'crocin', 'dolo', 'calpol', 'fever tablet', 'painkiller dosage'],
    category: 'medicine',
    severity: 'low',
    title: '💊 PARACETAMOL / ACETAMINOPHEN USAGE',
    response: 'Paracetamol (500mg / 650mg) is a safe antipyretic and analgesic used for mild to moderate fever and body pain.',
    recommendations: [
      'Standard Adult Dosage: 500mg to 650mg every 6 hours as needed',
      'Maximum daily limit: 3000mg (3 grams) per 24 hours to protect liver health',
      'Safe for use during pregnancy when taken under recommended dosage'
    ],
    precautions: ['Do not combine multiple cold/flu syrups that already contain paracetamol', 'Avoid alcohol while taking paracetamol to prevent liver toxicity']
  },
  {
    keywords: ['antibiotics', 'amoxicillin', 'azithromycin', 'cefixime', 'infection medicine'],
    category: 'medicine',
    severity: 'medium',
    title: '💊 ANTIBIOTIC COMPLIANCE & SAFETY',
    response: 'Antibiotics kill specific bacterial infections. They DO NOT work against viral infections like common cold, flu, or viral fevers.',
    recommendations: [
      'Complete the full course (3, 5, or 7 days) exactly as prescribed by your doctor',
      'Take doses at equal time intervals for maximum therapeutic concentration in blood',
      'Take probiotics alongside antibiotics to maintain healthy intestinal flora'
    ],
    precautions: ['NEVER stop antibiotics early even if you feel completely better', 'Never take leftover antibiotics or share with others to prevent Antibiotic Resistance']
  },
  {
    keywords: ['diet', 'nutrition', 'weight loss', 'weight gain', 'healthy food', 'calories', 'protein', 'meal plan', 'vitamins'],
    category: 'nutrition',
    severity: 'low',
    title: '🥗 NUTRITION & BALANCED LIFESTYLE GUIDE',
    response: 'Optimal health requires a colorful, nutrient-dense diet rich in complex carbohydrates, lean protein, healthy fats, dietary fiber, and essential minerals.',
    recommendations: [
      'Fill half your plate with colorful vegetables & salads, one-quarter with protein (pulses/eggs/chicken), and one-quarter with whole grains',
      'Hydrate with 2.5 - 3 Liters of water daily',
      'Include nuts (almonds, walnuts) and seeds (flax, chia) for essential Omega-3 fatty acids',
      'Limit sodium (salt) to under 5g/day and added sugar to under 25g/day'
    ],
    precautions: ['Avoid fad diets or extreme caloric restriction', 'Minimize ultra-processed foods, deep-fried snacks, and trans fats']
  },
  {
    keywords: ['exercise', 'workout', 'walking', 'gym', 'yoga', 'cardio', 'fitness', 'daily steps', 'physical activity'],
    category: 'exercise',
    severity: 'low',
    title: '🏃 PHYSICAL FITNESS & EXERCISE RECOMMENDATIONS',
    response: 'Regular physical activity strengthens cardiovascular health, lowers blood pressure, regulates blood sugar, improves mood, and boosts immune function.',
    recommendations: [
      'Aim for 150 minutes of moderate aerobic exercise (brisk walking, swimming, cycling) per week',
      'Aim for 8,000 to 10,000 steps daily',
      'Include 2 sessions of strength/resistance training per week for muscle mass and bone density',
      'Do 10 minutes of daily stretching or Yoga to maintain flexibility and posture'
    ],
    precautions: ['Always warm up for 5 minutes before exercise and cool down afterwards', 'Stay hydrated during workouts', 'Stop immediately if you feel dizzy, chest tightness, or joint pain']
  },
  {
    keywords: ['sleep', 'insomnia', 'cannot sleep', 'sleeping problem', 'tiredness', 'fatigue', 'stress', 'anxiety', 'mental health'],
    category: 'general',
    severity: 'low',
    title: '🌙 SLEEP HYGIENE & STRESS MANAGEMENT',
    response: 'Quality restorative sleep (7-8 hours per night) and mental stress management are fundamental pillars of immune, hormonal, and cognitive health.',
    recommendations: [
      'Maintain a consistent sleep schedule (go to bed and wake up at the same time daily)',
      'Keep your bedroom dark, quiet, and cool (around 20-22°C)',
      'Practice 10 minutes of deep breathing exercises or mindfulness meditation before bed',
      'Expose yourself to natural sunlight for 15 minutes every morning to regulate circadian rhythm'
    ],
    precautions: ['Turn off all screens (smartphones, TVs, laptops) 1 hour before sleeping', 'Avoid caffeine, heavy meals, and vigorous exercise 4 hours before bedtime']
  }
];

export function getAIResponse(input: string, profile?: Profile | null): AIResponse {
  const lowerInput = input.toLowerCase().trim();

  // 1. Direct Emergency Keyword Intercept
  const emergencyKeywords = ['sos', 'emergency', 'unconscious', 'stroke', 'bleeding heavily', 'poison', 'snake bite', 'choking'];
  if (emergencyKeywords.some(k => lowerInput.includes(k))) {
    return {
      text: '🚨 EMERGENCY ALERT DETECTED: If you or someone around you is in immediate medical danger, please use the red **EMERGENCY SOS** button on your dashboard or call **108 / 112** for an ambulance right now.',
      severity: 'high',
      category: 'emergency',
      recommendations: [
        'Press the red Emergency SOS button on your PitPulse dashboard',
        'Call 108 Emergency Ambulance immediately',
        'Stay calm and remain in a safe location with someone nearby'
      ],
      precautions: ['Do not delay emergency response', 'Keep phone lines clear for emergency team calls']
    };
  }

  // 2. Search Advanced Medical Knowledge Base
  for (const entry of ADVANCED_KNOWLEDGE_BASE) {
    if (entry.keywords.some(k => lowerInput.includes(k))) {
      let personalizedText = `### ${entry.title}\n\n${entry.response}`;

      // Personalize if patient profile contains relevant clinical metadata
      if (profile) {
        if (profile.allergies && profile.allergies.toLowerCase() !== 'none') {
          personalizedText += `\n\n⚠️ **Patient Allergy Warning:** Note that your profile records allergies to: *${profile.allergies}*. Verify all recommended medications before consumption.`;
        }
        if (profile.is_pregnant && entry.category !== 'pregnancy') {
          personalizedText += `\n\n🤰 **Pregnancy Advisory:** As you are currently registered in your pregnancy period, please confirm any medication or intervention with your Obstetrician before use.`;
        }
        if (profile.chronic_diseases && profile.chronic_diseases.toLowerCase() !== 'none') {
          personalizedText += `\n\n🏥 **Chronic Health Context:** Keep your recorded condition (*${profile.chronic_diseases}*) in mind while following these guidelines.`;
        }
      }

      return {
        text: personalizedText,
        severity: entry.severity,
        category: entry.category,
        recommendations: entry.recommendations,
        precautions: entry.precautions,
      };
    }
  }

  // 3. Greeting / Friendly Intercepts
  if (lowerInput.includes('hello') || lowerInput.includes('hi') || lowerInput.includes('hey') || lowerInput === 'help') {
    const name = profile?.full_name ? `, ${profile.full_name}` : '';
    return {
      text: `Hello${name}! 👋 I am your **PitPulse AI Health Assistant**. I am available 24/7 to provide clear clinical guidance on symptoms, medications, lab reports, nutrition, exercise, and maternal care. How can I assist you with your health today?`,
      category: 'general',
      severity: 'low',
      recommendations: [
        'Ask about any symptoms (e.g., "I have a fever and headache")',
        'Inquire about blood pressure, sugar, or lab test readings',
        'Request personalized nutrition & diet plans',
        'Check medicine dosages and drug safety tips'
      ]
    };
  }

  // 4. Intelligent Dynamic Clinical Generator for ANY User Question
  // Formulate a structured, highly clear, professional response for unmapped health queries
  const topicTitle = input.length > 30 ? input.substring(0, 30) + '...' : input;
  const userGreeting = profile?.full_name ? `for **${profile.full_name}**` : '';

  let generatedResponse = `### 🩺 Clinical Guidance: ${topicTitle}\n\nThank you for asking your query ${userGreeting}. Here is clear, expert health guidance regarding your question:\n\n` +
    `1. **Medical Overview:** For queries concerning "${input}", it is important to monitor how symptoms evolve over 24-48 hours. Proper rest, hydration, and tracking vital signs are foundational steps.\n\n` +
    `2. **Key Recommendations:**\n` +
    `   • **Hydration & Rest:** Ensure 2.5-3 Liters of fluid intake and 7-8 hours of sound sleep.\n` +
    `   • **Observation:** Log any changes in temperature, pain level, or blood pressure in your PitPulse Health Tracker.\n` +
    `   • **Medication Safety:** Never take unprescribed antibiotics or heavy painkillers without clinical consultation.\n\n` +
    `3. **When to Seek Immediate Care:** If you experience high fever (>102°F), breathing difficulty, severe abdominal pain, chest discomfort, or extreme dizziness, please consult a physician or visit the nearest clinic immediately.`;

  if (profile?.allergies && profile.allergies.toLowerCase() !== 'none') {
    generatedResponse += `\n\n⚠️ *Reminder: Always inform your treating doctor about your recorded allergies (${profile.allergies}).*`;
  }

  return {
    text: generatedResponse,
    severity: 'low',
    category: 'general',
    recommendations: [
      'Log daily health metrics in your PitPulse Dashboard',
      'Stay well-hydrated with clean water and fresh fluids',
      'Consult a certified healthcare professional for definitive diagnosis',
      'Use the Emergency SOS button if symptoms escalate rapidly'
    ],
    precautions: [
      'Avoid self-medication with unverified drugs',
      'Keep emergency medical contacts saved'
    ]
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
