// src/app/page.tsx

'use client';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles, Target, TrendingUp, Award, Star, Users, BookOpen, Heart } from 'lucide-react';
import Image from 'next/image';
import { ActionButton, ModernButton } from '@/components/ui/ModernButton';
import { ModernCard, CardHeader, CardContent } from '@/components/ui/ModernCard';
import { useEffect, useState } from 'react';

// Données pour les sections
const features = [
  {
    icon: Target,
    title: "Personnalisation",
    description: "Découvre ton profil unique et tes objectifs personnalisés pour un parcours sur mesure.",
    gradient: "from-pink-500 to-rose-500"
  },
  {
    icon: BookOpen,
    title: "Programme Structuré",
    description: "Un parcours progressif et scientifiquement conçu pour ancrer des habitudes durables.",
    gradient: "from-purple-500 to-indigo-500"
  },
  {
    icon: Star,
    title: "Renaissance",
    description: "Transformation profonde de ton mindset pour atteindre tes objectifs les plus ambitieux.",
    gradient: "from-indigo-500 to-blue-500"
  },
  {
    icon: Award,
    title: "Évolution Continue",
    description: "Maîtrise et rayonnement grâce à un développement personnel constant.",
    gradient: "from-yellow-500 to-orange-500"
  }
];

const testimonials = [
  {
    name: "Sarah M.",
    role: "Entrepreneure",
    content: "Apprend+ a complètement transformé ma façon d'aborder mes objectifs. Je me sens plus confiante et déterminée que jamais.",
    avatar: "👩‍💼",
    rating: 5
  },
  {
    name: "Emma L.",
    role: "Étudiante",
    content: "Le programme m'a aidée à développer une discipline que je n'avais jamais eue. Mes résultats académiques ont explosé !",
    avatar: "👩‍🎓",
    rating: 5
  },
  {
    name: "Julie K.",
    role: "Manager",
    content: "Une approche révolutionnaire du développement personnel. Les résultats sont concrets et durables.",
    avatar: "👩‍💻",
    rating: 5
  }
];

const stats = [
  { number: "10k+", label: "Femmes transformées", icon: Users },
  { number: "95%", label: "Taux de satisfaction", icon: Heart },
  { number: "4.9/5", label: "Note moyenne", icon: Star },
  { number: "6 mois", label: "Durée moyenne", icon: TrendingUp }
];

export default function HomePage() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleCommencer = () => {
    router.push('/auth');
  };

  const handleEnSavoirPlus = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Fond décoratif */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-secondary-50/30 to-accent-50/50" />
        <div className="absolute top-0 left-0 w-72 h-72 bg-primary-200/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary-200/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        
        <div className="relative container-app py-20 lg:py-32">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Contenu textuel */}
              <div className={`space-y-8 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
                <div className="space-y-6">
                  <div className="inline-flex items-center space-x-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium">
                    <Sparkles className="w-4 h-4" />
                    <span>Nouveau programme révolutionnaire</span>
                  </div>
                  
                  <h1 className="heading-1 text-gradient-primary">
                    APPREND<span className="text-4xl lg:text-5xl">+</span>
                  </h1>
                  
                  <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 leading-tight">
                    L'excellence mentale ancrée de manière{' '}
                    <span className="text-gradient-secondary">durable</span>
                  </h2>
                  
                  <p className="text-body text-xl">
                    Transforme ta vie avec notre programme scientifiquement conçu. 
                    Développe ta confiance, ta discipline et ton potentiel pour devenir 
                    la femme qui atteint ses objectifs les plus ambitieux.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <ActionButton
                    onClick={handleCommencer}
                    size="xl"
                    className="animate-scale-in"
                    style={{ animationDelay: '0.2s' }}
                  >
                    Commencer ma transformation
                  </ActionButton>
                  
                  <ModernButton
                    variant="ghost"
                    size="xl"
                    onClick={handleEnSavoirPlus}
                    className="animate-scale-in"
                    style={{ animationDelay: '0.4s' }}
                  >
                    En savoir plus
                  </ModernButton>
                </div>

                {/* Statistiques rapides */}
                <div className={`grid grid-cols-2 lg:grid-cols-4 gap-6 pt-8 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.6s' }}>
                  {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <div key={index} className="text-center space-y-2">
                        <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-2">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{stat.number}</div>
                        <div className="text-sm text-gray-600">{stat.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Image */}
              <div className={`relative ${isVisible ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
                <div className="relative w-full max-w-lg mx-auto">
                  {/* Cercle décoratif */}
                  <div className="absolute inset-0 bg-gradient-primary rounded-full opacity-10 animate-pulse-slow" />
                  <div className="absolute inset-4 bg-gradient-secondary rounded-full opacity-5 animate-pulse-slow" style={{ animationDelay: '1s' }} />
                  
                  {/* Image principale */}
                  <div className="relative z-10 p-8">
                    <Image
                      src="/images/Logo_Apprend.png"
                      alt="Apprend+ - Femme déterminée avec livre et ampoule d'idée symbolisant l'apprentissage et l'innovation"
                      width={400}
                      height={400}
                      className="w-full h-auto object-contain hover-lift"
                      priority
                      quality={90}
                    />
                  </div>
                  
                  {/* Éléments flottants décoratifs */}
                  <div className="absolute top-10 right-0 w-20 h-20 bg-yellow-200 rounded-full opacity-20 animate-bounce-subtle" />
                  <div className="absolute bottom-10 left-0 w-16 h-16 bg-pink-200 rounded-full opacity-20 animate-bounce-subtle" style={{ animationDelay: '2s' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Fonctionnalités */}
      <section id="features" className="section-spacing bg-white">
        <div className="container-app">
          <div className="text-center mb-16">
            <h2 className="heading-2 text-gradient-primary mb-4">
              Un parcours complet pour ta transformation
            </h2>
            <p className="text-body max-w-3xl mx-auto">
              Notre programme te guide à travers 4 étapes essentielles pour ancrer 
              durablement l'excellence mentale dans ta vie quotidienne.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <ModernCard
                  key={index}
                  variant="elevated"
                  hover
                  className={`text-center animate-fade-in-up`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-medium`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </ModernCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section Témoignages */}
      <section className="section-spacing bg-gradient-to-r from-primary-50 to-secondary-50">
        <div className="container-app">
          <div className="text-center mb-16">
            <h2 className="heading-2 text-gradient-primary mb-4">
              Elles ont transformé leur vie
            </h2>
            <p className="text-body max-w-3xl mx-auto">
              Découvre les témoignages inspirants de femmes qui ont choisi 
              l'excellence mentale avec Apprend+.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <ModernCard
                key={index}
                variant="glass"
                hover
                className={`animate-fade-in-up`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white text-xl">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  
                  <p className="text-gray-700 italic leading-relaxed">
                    "{testimonial.content}"
                  </p>
                </div>
              </ModernCard>
            ))}
          </div>
        </div>
      </section>

      {/* Section CTA */}
      <section className="section-spacing bg-gradient-primary text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        
        <div className="relative container-app text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
              Prête à devenir la femme qui atteint ses objectifs ?
            </h2>
            
            <p className="text-xl text-white/90 leading-relaxed">
              Rejoins des milliers de femmes qui ont choisi l'excellence mentale. 
              Commence ta transformation dès aujourd'hui.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <ModernButton
                variant="secondary"
                size="xl"
                onClick={handleCommencer}
                className="shadow-large hover:shadow-xl"
                leftIcon={<Sparkles className="w-5 h-5" />}
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                Commencer maintenant
              </ModernButton>
              
              <p className="text-white/80 text-sm">
                ✨ Essai gratuit • 🚀 Résultats garantis • 💪 Support 24/7
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container-app">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                <span className="font-bold text-lg">A+</span>
              </div>
              <h3 className="text-2xl font-bold">Apprend+</h3>
            </div>
            
            <p className="text-gray-400 max-w-2xl mx-auto">
              L'excellence mentale ancrée de manière durable. 
              Transforme ta vie avec notre programme scientifiquement conçu.
            </p>
            
            <div className="flex justify-center space-x-8 text-sm text-gray-500 mt-8">
              <button className="hover:text-white transition-colors">Aide</button>
              <button className="hover:text-white transition-colors">Confidentialité</button>
              <button className="hover:text-white transition-colors">Conditions</button>
              <button className="hover:text-white transition-colors">Contact</button>
            </div>
            
            <div className="border-t border-gray-800 pt-6 mt-8 text-sm text-gray-500">
              © 2024 Apprend+. Tous droits réservés.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}