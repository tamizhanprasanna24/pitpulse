'use client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import * as React from 'react';
import { DashboardShell } from '@/components/dashboard/shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck, HeartHandshake, Baby, Pill, Syringe, Sparkles,
  Search, CheckCircle2, FileText, ExternalLink, ArrowRight, Building2,
} from 'lucide-react';
import { toast } from 'sonner';

interface Scheme {
  id: string;
  name: string;
  category: string;
  coverage: string;
  description: string;
  eligibility: string;
  benefits: string[];
  documents: string[];
  status: 'Active' | 'Enrolled' | 'Eligible';
}

const SCHEMES: Scheme[] = [
  {
    id: 'sch-1',
    name: 'Ayushman Bharat PM-JAY',
    category: 'Health Insurance',
    coverage: '₹5,00,000 / family / year',
    description: 'World largest health assurance scheme providing free secondary & tertiary hospitalization care.',
    eligibility: 'SECC 2011 low-income rural households & Ayushman card holders.',
    benefits: [
      'Cashless treatment in empanelled public & private hospitals',
      'Covers 1,949 medical procedures including surgeries & ICU care',
      'No cap on family size or age of family members',
    ],
    documents: ['Aadhaar Card', 'Ration Card', 'Mobile Number'],
    status: 'Active',
  },
  {
    id: 'sch-2',
    name: 'Pradhan Mantri Surakshit Matritva Abhiyan (PMSMA)',
    category: 'Maternal Health',
    coverage: 'Free ANC & Specialist Care',
    description: 'Guarantees free, quality antenatal check-ups for pregnant women on the 9th of every month.',
    eligibility: 'All pregnant women in their 2nd and 3rd trimesters.',
    benefits: [
      'Free blood, urine, ultrasound & blood pressure screening',
      'Specialist OB-GYN consultations at PHCs & Community Health Centers',
      'Identification and tracking of High-Risk Pregnancies (HRP)',
    ],
    documents: ['Mother & Child Protection (MCP) Card', 'Aadhaar Card'],
    status: 'Eligible',
  },
  {
    id: 'sch-3',
    name: 'Janani Suraksha Yojana (JSY)',
    category: 'Maternal & Newborn Care',
    coverage: '₹1,400 Direct Cash Transfer',
    description: 'Safe motherhood intervention under NRHM promoting institutional delivery among rural pregnant women.',
    eligibility: 'Pregnant women residing in rural areas giving birth at government health facilities.',
    benefits: [
      'Direct bank cash transfer of ₹1,400 for rural mothers',
      'Free transport by 108 ambulance from home to hospital',
      'Post-natal care assistance by assigned ASHA worker',
    ],
    documents: ['Bank Passbook', 'MCP Card', 'Delivery Certificate'],
    status: 'Active',
  },
  {
    id: 'sch-4',
    name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyanjana (PMBJP)',
    category: 'Affordable Medicines',
    coverage: 'Up to 90% Discount on Medicines',
    description: 'Provides high-quality generic medicines at affordable prices through Kendra outlets.',
    eligibility: 'Open to all citizens across India.',
    benefits: [
      '1,800+ top generic medicines and 290 surgical devices',
      'Price savings ranging from 50% to 90% compared to branded drugs',
      'Strict WHO-GMP quality tested pharmaceuticals',
    ],
    documents: ['Valid Doctor Prescription'],
    status: 'Active',
  },
  {
    id: 'sch-5',
    name: 'Mission Indradhanush (Universal Immunization)',
    category: 'Child Immunization',
    coverage: '100% Free Complete Vaccination',
    description: 'Immunization drive ensuring full vaccine coverage for children under 2 years and pregnant women.',
    eligibility: 'All infants, children under 5 years, and pregnant mothers.',
    benefits: [
      'Protects against 12 life-threatening vaccine-preventable diseases',
      'Free BCG, OPV, Pentavalent, Rotavirus, Measles-Rubella & DPT vaccines',
      'Doorstep mobile vaccination camps by ASHA workers in remote villages',
    ],
    documents: ['Child Vaccination Card / MCP Booklet'],
    status: 'Active',
  },
  {
    id: 'sch-6',
    name: 'POSHAN Abhiyaan (National Nutrition Mission)',
    category: 'Child & Maternal Nutrition',
    coverage: 'Free Take-Home Rations & Micro-nutrients',
    description: 'Flagship program to improve nutritional outcomes for children, pregnant women, and lactating mothers.',
    eligibility: 'Children 0-6 years, adolescent girls, pregnant & lactating women at Anganwadi centers.',
    benefits: [
      'Monthly supplementary nutrition & fortified take-home ration (THR)',
      'Growth monitoring & Iron-Folic Acid (IFA) tablet distribution',
      'Counseling on infant feeding practices and sanitation',
    ],
    documents: ['Anganwadi Registration ID / Aadhaar Card'],
    status: 'Eligible',
  },
];

export default function GovernmentSchemesPage() {
  const [search, setSearch] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('all');

  const categories = React.useMemo(() => {
    const set = new Set(SCHEMES.map((s) => s.category));
    return ['all', ...Array.from(set)];
  }, []);

  const filteredSchemes = React.useMemo(() => {
    return SCHEMES.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase()) ||
        s.eligibility.toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCategory === 'all' || s.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [search, selectedCategory]);

  return (
    <DashboardShell
      title="Government Healthcare Schemes"
      description="Explore flagship national health schemes, eligibility criteria, coverage benefits, and application guidance"
    >
      <div className="space-y-6">
        {/* Top Banner Card */}
        <Card className="glass border-primary/20 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-primary/15 via-sky-500/10 to-transparent p-6 sm:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold">
                  <ShieldCheck className="h-4 w-4" /> Official Rural Healthcare Schemes
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  Government Health Welfare & Schemes
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Empowering rural citizens with free medical care, financial assistance for childbirth, high-discount generic medicines, and universal child immunization.
                </p>
              </div>

              <div className="glass rounded-xl p-4 border-primary/30 flex items-center gap-4 shrink-0 bg-background/80 shadow-md">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                  ₹5L
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Max Family Coverage</p>
                  <p className="text-sm font-bold text-foreground">PM-JAY Health Shield</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Search & Filter Bar */}
        <Card className="glass p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search scheme name, eligibility, or coverage..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="capitalize shrink-0 text-xs"
                >
                  {cat === 'all' ? 'All Schemes' : cat}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Scheme Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSchemes.map((scheme) => (
            <Card key={scheme.id} className="glass hover:shadow-xl transition-all border-border/60 flex flex-col justify-between">
              <div>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold">
                      {scheme.category}
                    </Badge>
                    <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30 text-xs">
                      {scheme.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-bold mt-2 text-foreground">{scheme.name}</CardTitle>
                  <CardDescription className="text-xs font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1.5 mt-0.5">
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> Financial Coverage: {scheme.coverage}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 text-xs">
                  <p className="text-muted-foreground leading-relaxed">{scheme.description}</p>

                  <div className="p-3 rounded-lg bg-muted/40 border border-border/40 space-y-1">
                    <span className="font-semibold text-foreground block">Who is Eligible?</span>
                    <p className="text-muted-foreground">{scheme.eligibility}</p>
                  </div>

                  <div className="space-y-1.5">
                    <span className="font-semibold text-foreground block">Key Scheme Benefits:</span>
                    <ul className="space-y-1">
                      {scheme.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <span className="font-semibold text-foreground block">Required Documents:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {scheme.documents.map((doc, idx) => (
                        <Badge key={idx} variant="outline" className="text-[10px] bg-background">
                          <FileText className="mr-1 h-3 w-3 inline text-primary" /> {doc}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </div>

              <div className="p-4 pt-0">
                <Button
                  onClick={() => toast.success(`Application assistance request initiated for ${scheme.name}. Your assigned ASHA worker will guide your document submission.`)}
                  className="w-full bg-gradient-to-r from-primary to-sky-600 text-white shadow-md text-xs font-semibold"
                >
                  Apply & Get Assistance via ASHA <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
