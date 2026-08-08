'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Activity, Brain, Pill, MapPin, Siren, BarChart3, Stethoscope,
  Truck, Shield, Heart, Baby, Clock, Star, ChevronDown,
  CheckCircle2, ArrowRight, Smartphone, Bell, Users, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

const features = [
  { icon: Brain, title: 'AI Symptom Checker', desc: 'Describe your symptoms and get instant AI-powered health analysis with recommendations.' },
  { icon: Pill, title: 'Medicine Delivery', desc: 'Order medicines from nearby pharmacies with live delivery tracking, just like food delivery.' },
  { icon: MapPin, title: 'Nearby Care Finder', desc: 'Find hospitals, pharmacies, labs, blood banks, and ambulance services near you with live status.' },
  { icon: Siren, title: 'Emergency SOS', desc: 'One-click SOS shares your live location and medical history with doctors, family, and emergency services.' },
  { icon: BarChart3, title: 'Health Analytics', desc: 'Track vitals, visualize trends, and get AI insights about your health over time.' },
  { icon: Heart, title: 'Chronic Disease Care', desc: 'Manage diabetes, hypertension, cardiac conditions with personalized tracking and reminders.' },
  { icon: Baby, title: 'Maternal & Child Care', desc: 'Specialized pregnancy tracking, baby development, vaccination schedules, and maternal health reports.' },
  { icon: Shield, title: 'Secure Records', desc: 'Your medical records are encrypted and protected with role-based access control.' },
];

const aiFeatures = [
  { icon: Brain, title: 'AI Symptom Checker', desc: 'Instant symptom analysis' },
  { icon: Stethoscope, title: 'AI Health Assistant', desc: '24/7 health guidance chatbot' },
  { icon: Pill, title: 'AI Medicine Recommendations', desc: 'Smart medicine suggestions' },
  { icon: Activity, title: 'AI Drug Interaction Checker', desc: 'Check medicine safety' },
  { icon: Zap, title: 'AI Disease Risk Prediction', desc: 'Predict health risks early' },
  { icon: Heart, title: 'AI Nutrition Planner', desc: 'Personalized diet plans' },
  { icon: Users, title: 'AI Exercise Planner', desc: 'Custom workout routines' },
  { icon: Bell, title: 'AI Health Insights', desc: 'Proactive health alerts' },
];

const portals = [
  { icon: Heart, title: 'Patient Portal', desc: 'Health dashboard, vitals tracking, medicine orders, prescriptions, AI assistant, and emergency SOS.', color: 'from-primary to-blue-500' },
  { icon: Stethoscope, title: 'Doctor / Admin Portal', desc: 'Patient management, appointments, analytics, user management, and platform-wide oversight.', color: 'from-accent to-emerald-500' },
  { icon: Users, title: 'ASHA Worker Portal', desc: 'Village dashboard, home visits, health surveys, vaccination tracking, and offline sync.', color: 'from-warning to-orange-500' },
  { icon: Truck, title: 'Pharmacy & Delivery Portal', desc: 'Inventory management, order acceptance, delivery assignment, and live tracking.', color: 'from-chart-4 to-pink-500' },
];

const testimonials = [
  { name: 'Priya Sharma', role: 'Expecting Mother', text: 'This platform helped me track my pregnancy week by week. The AI assistant answered my questions instantly, and medicine delivery was a lifesaver during my third trimester.', rating: 5 },
  { name: 'Dr. Rajesh Kumar', role: 'Cardiologist', text: 'As a doctor, I can see all my patients health trends in one place. The analytics dashboard helps me make better clinical decisions faster.', rating: 5 },
  { name: 'Lakshmi Devi', role: 'ASHA Worker', text: 'The village dashboard and offline sync feature changed how I work. I can track vaccinations and home visits even in areas with poor connectivity.', rating: 5 },
  { name: 'Ahmed Khan', role: 'Diabetes Patient', text: 'Managing my diabetes became so much easier. Blood sugar tracking, medicine reminders, and the AI nutrition planner all in one app.', rating: 5 },
  { name: 'Sunita Reddy', role: 'Pharmacy Owner', text: 'Orders come in real-time, I can assign delivery partners instantly. The inventory alerts ensure I never run out of essential medicines.', rating: 4 },
  { name: 'Vikram Singh', role: 'Delivery Partner', text: 'The navigation and OTP verification make deliveries smooth. I can track my earnings and manage my availability with one tap.', rating: 5 },
];

const faqs = [
  { q: 'Who is this platform for?', a: 'Our platform is designed for everyone, regardless of age or gender. We support Male, Female, and Others gender identities. Specialized maternal and child care features appear only for users who indicate they are pregnant.' },
  { q: 'How does the medicine delivery work?', a: 'Search for medicines, browse nearby pharmacies, compare prices, add to cart, and place your order. Track delivery in real-time with live GPS, ETA, and OTP verification, just like food delivery apps.' },
  { q: 'What happens when I press the SOS button?', a: 'The SOS feature shares your live GPS location, notifies your doctor, ASHA worker, and family, finds the nearest hospital and ambulance, displays the fastest route, and shares your medical history and emergency contacts.' },
  { q: 'Is my medical data secure?', a: 'Yes. All medical records are encrypted and protected with role-based access control. Only you and authorized healthcare providers can access your data. We follow industry-standard security practices.' },
  { q: 'Can ASHA workers use this platform offline?', a: 'Yes. The ASHA Worker Portal supports offline sync, allowing health workers to record home visits, surveys, and vaccination data even without internet connectivity. Data syncs automatically when connection is restored.' },
  { q: 'What AI features are included?', a: 'Our platform includes AI Symptom Checker, AI Health Assistant chatbot, AI Medicine Recommendations, Drug Interaction Checker, Disease Risk Prediction, Nutrition Planner, Exercise Planner, and Health Insights.' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <StatsBar />
        <FeaturesSection />
        <AISection />
        <MedicineDeliverySection />
        <NearbyCareSection />
        <EmergencySection />
        <PortalsSection />
        <TestimonialsSection />
        <FAQSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 hero-gradient">
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-6 animate-fade-in">
            <span className="mr-2 flex h-2 w-2 rounded-full bg-success animate-pulse" />
            Trusted by 50,000+ users across India
          </Badge>
          <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Smart Rural Healthcare
            <br /><span className="gradient-text">Management System</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground md:text-xl">
            Connecting Patients, Doctors, ASHA Workers, Pharmacies, and Delivery Partners through intelligent healthcare, emergency response, and real-time medicine delivery.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/auth/register">
              <Button size="lg" className="w-full bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl sm:w-auto">
                Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> No credit card required</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> HIPAA-compliant</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> 24/7 AI support</span>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-5xl">
          <div className="glass rounded-2xl p-6 shadow-2xl">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { icon: Heart, label: 'Health Score', value: '92', unit: '/100', color: 'text-success' },
                { icon: Activity, label: 'Heart Rate', value: '72', unit: 'bpm', color: 'text-primary' },
                { icon: Pill, label: 'Medicines', value: '3', unit: 'active', color: 'text-accent' },
                { icon: Truck, label: 'Delivery ETA', value: '15', unit: 'min', color: 'text-warning' },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col items-center rounded-xl bg-card/50 p-4 text-center">
                  <stat.icon className={`mb-2 h-8 w-8 ${stat.color}`} />
                  <span className="text-2xl font-bold">{stat.value}<span className="text-sm font-normal text-muted-foreground"> {stat.unit}</span></span>
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsBar() {
  return (
    <section className="border-y border-border bg-card/30 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {[
            { value: '50K+', label: 'Active Users' },
            { value: '1,200+', label: 'Partner Pharmacies' },
            { value: '500+', label: 'Connected Hospitals' },
            { value: '99.9%', label: 'Uptime' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold gradient-text">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4">Features</Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Everything you need for better health</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From AI-powered diagnostics to real-time medicine delivery, our platform brings the entire healthcare ecosystem to your fingertips.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title} className="group relative overflow-hidden border-border/50 transition-all hover:shadow-lg hover:border-primary/30">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 transition-transform group-hover:scale-150" />
              <CardHeader className="relative">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-accent/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function AISection() {
  return (
    <section id="ai-healthcare" className="py-20 bg-card/30">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4">
            <Brain className="mr-1.5 h-3.5 w-3.5" /> AI Healthcare
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">AI that understands your health</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Eleven AI-powered features working together to keep you healthy, informed, and safe.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {aiFeatures.map((ai) => (
            <div key={ai.title} className="group glass rounded-xl p-5 transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                <ai.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-sm font-semibold">{ai.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{ai.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MedicineDeliverySection() {
  return (
    <section id="medicine-delivery" className="py-20">
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Badge variant="secondary" className="mb-4">
              <Truck className="mr-1.5 h-3.5 w-3.5" /> Medicine Delivery
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Medicine delivery as fast as your food
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Search medicines across nearby pharmacies, compare prices, check stock, upload prescriptions, and get medicines delivered to your door with live GPS tracking.
            </p>
            <div className="mt-8 space-y-4">
              {[
                { icon: Pill, title: 'Search & Compare', desc: 'Find medicines across multiple pharmacies with real-time stock and price comparison.' },
                { icon: Truck, title: 'Live Tracking', desc: 'Track your delivery in real-time with GPS, ETA, delivery partner details, and OTP verification.' },
                { icon: Clock, title: 'Emergency Delivery', desc: 'Need medicine urgently? Our emergency delivery prioritizes your order for fastest dispatch.' },
                { icon: Bell, title: 'Smart Reminders', desc: 'Never miss a dose with intelligent medicine reminders and auto-reorder suggestions.' },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="glass rounded-2xl p-6 shadow-xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-card/50 p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order #PP-2847</p>
                  <p className="font-semibold">3 items - Rs. 450</p>
                </div>
                <Badge className="bg-success/10 text-success">Delivered</Badge>
              </div>
              {[
                { label: 'Order Placed', time: '2:30 PM', done: true },
                { label: 'Pharmacy Accepted', time: '2:32 PM', done: true },
                { label: 'Picked Up', time: '2:45 PM', done: true },
                { label: 'Out for Delivery', time: '2:50 PM', done: true },
                { label: 'Delivered', time: '3:05 PM', done: true },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${step.done ? 'bg-success text-white' : 'bg-muted'}`}>
                    {step.done && <CheckCircle2 className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{step.label}</p>
                    <p className="text-xs text-muted-foreground">{step.time}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-3 rounded-xl bg-primary/5 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white text-sm font-bold">RK</div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Ravi Kumar - Delivery Partner</p>
                  <p className="text-xs text-muted-foreground">Arriving in 15 min</p>
                </div>
                <Button size="sm" variant="outline">Track</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function NearbyCareSection() {
  return (
    <section id="nearby-care" className="py-20 bg-card/30">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4">
            <MapPin className="mr-1.5 h-3.5 w-3.5" /> Nearby Care
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Find healthcare near you, instantly</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Live GPS-powered discovery of hospitals, pharmacies, labs, blood banks, and ambulance services with real-time availability.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {[
            { icon: Stethoscope, label: 'Hospitals', count: '500+', detail: 'with bed availability' },
            { icon: Pill, label: 'Pharmacies', count: '1,200+', detail: '24x7 & delivery' },
            { icon: Activity, label: 'Diagnostic Labs', count: '300+', detail: 'with home collection' },
            { icon: Heart, label: 'Blood Banks', count: '150+', detail: 'live stock info' },
            { icon: Siren, label: 'Ambulance Stations', count: '200+', detail: 'with ETA' },
            { icon: Baby, label: 'Vaccination Centers', count: '400+', detail: 'walk-in & booked' },
            { icon: Users, label: 'Primary Health Centers', count: '250+', detail: 'government network' },
            { icon: MapPin, label: '24x7 Pharmacies', count: '800+', detail: 'open now' },
          ].map((item) => (
            <div key={item.label} className="glass group rounded-xl p-5 transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                <item.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold">{item.label}</h3>
              <p className="text-2xl font-bold gradient-text">{item.count}</p>
              <p className="text-xs text-muted-foreground">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function EmergencySection() {
  return (
    <section id="emergency" className="py-20">
      <div className="container mx-auto px-4">
        <div className="glass relative overflow-hidden rounded-3xl p-8 md:p-12">
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-destructive/10 blur-3xl" />
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div className="relative">
              <Badge variant="secondary" className="mb-4 bg-destructive/10 text-destructive">
                <Siren className="mr-1.5 h-3.5 w-3.5" /> Emergency SOS
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">One tap. Instant help.</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Press the SOS button and our platform instantly shares your live GPS, medical history, and emergency contacts with your doctor, ASHA worker, family, and the nearest hospital and ambulance.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  'Shares live GPS location with emergency contacts',
                  'Notifies doctor, ASHA worker, and family simultaneously',
                  'Finds nearest hospital and ambulance with fastest route',
                  'Shares medical history and allergies with responders',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative flex justify-center">
              <button className="group relative flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-destructive to-red-600 shadow-2xl transition-transform hover:scale-105">
                <span className="absolute inset-0 animate-pulse-ring rounded-full bg-destructive/40" />
                <span className="absolute inset-0 animate-pulse-ring rounded-full bg-destructive/30" style={{ animationDelay: '0.5s' }} />
                <span className="relative flex flex-col items-center">
                  <Siren className="h-12 w-12 text-white" />
                  <span className="mt-1 text-xl font-bold text-white">SOS</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PortalsSection() {
  return (
    <section className="py-20 bg-card/30">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4">
            <Users className="mr-1.5 h-3.5 w-3.5" /> Role-Based Portals
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">One platform, four powerful portals</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Sign in once and get redirected to your role-specific dashboard.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {portals.map((portal) => (
            <Card key={portal.title} className="group overflow-hidden transition-all hover:shadow-xl">
              <div className={`h-2 bg-gradient-to-r ${portal.color}`} />
              <CardHeader>
                <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${portal.color}`}>
                  <portal.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle>{portal.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{portal.desc}</p>
                <Link href="/auth/login" className="mt-4 inline-block">
                  <Button variant="ghost" size="sm" className="group/btn">
                    Explore Portal <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4">Testimonials</Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Loved by patients and providers alike</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.name} className="transition-all hover:shadow-lg">
              <CardContent className="pt-6">
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < t.rating ? 'fill-warning text-warning' : 'fill-muted text-muted'}`} />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">"{t.text}"</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white text-sm font-bold">
                    {t.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  return (
    <section id="faq" className="py-20 bg-card/30">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4">FAQ</Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Frequently asked questions</h2>
        </div>
        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="glass rounded-xl px-6">
                <AccordionTrigger className="text-left text-base font-semibold hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section id="contact" className="py-20">
      <div className="container mx-auto px-4">
        <div className="glass mx-auto max-w-4xl rounded-3xl p-8 md:p-12 text-center">
          <Smartphone className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Ready to take control of your health?</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Join thousands of users who trust our platform for their healthcare needs. Get started in less than 2 minutes.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/auth/register">
              <Button size="lg" className="w-full bg-gradient-to-r from-primary to-accent text-white sm:w-auto">
                Create Free Account <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
