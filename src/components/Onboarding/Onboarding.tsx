import React from 'react';
import { SubmitHandler } from 'react-hook-form';
import { motion } from 'framer-motion';
import Floating, { FloatingElement } from "@/components/ui/parallax-floating";
import { OnboardingForm, OnboardingFormData } from './OnboardingForm';

// Image data for the floating background
const exampleImages = [
  {
    url: "https://images.unsplash.com/photo-1727341554370-80e0fe9ad082?q=80&w=2276&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    author: "Branislav Rodman",
    title: "A Black and White Photo of a Woman Brushing Her Teeth",
  },
  {
    url: "https://images.unsplash.com/photo-1640680608781-2e4199dd1579?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    link: "https://unsplash.com/photos/a-painting-of-a-palm-leaf-on-a-multicolored-background-AaNPwrSNOFE",
    title: "Neon Palm",
    author: "Tim Mossholder",
  },
  {
    url: "https://images.unsplash.com/photo-1726083085160-feeb4e1e5b00?q=80&w=3024&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    link: "https://unsplash.com/photos/a-blurry-photo-of-a-crowd-of-people-UgbxzloNGsc",
    author: "ANDRII SOLOK",
    title: "A blurry photo of a crowd of people",
  },
  {
    url: "https://images.unsplash.com/photo-1562016600-ece13e8ba570?q=80&w=2838&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    link: "https://unsplash.com/photos/rippling-crystal-blue-water-9-OCsKoyQlk",
    author: "Wesley Tingey",
    title: "Rippling Crystal Blue Water",
  },
  {
    url: "https://images.unsplash.com/photo-1624344965199-ed40391d20f2?q=80&w=2960&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    link: "https://unsplash.com/de/fotos/mann-im-schwarzen-hemd-unter-blauem-himmel-m8RDNiuEXro",
    author: "Serhii Tyaglovsky",
    title: "Mann im schwarzen Hemd unter blauem Himmel",
  },
  {
    url: "https://images.unsplash.com/photo-1689553079282-45df1b35741b?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    link: "https://unsplash.com/photos/a-woman-with-a-flower-crown-on-her-head-0S3muIttbsY",
    author: "Vladimir Yelizarov",
    title: "A women with a flower crown on her head",
  },
];

// Re-export form data type if needed by parent page
export type { OnboardingFormData };

// Define the component props (same as OnboardingForm)
interface OnboardingProps {
  onSubmit: SubmitHandler<OnboardingFormData>;
  isLoading: boolean;
  error?: string | null;
  initialGameId?: string; // Add prop for pre-filled game ID
}

// This component now acts as the container for the background and the form
const Onboarding: React.FC<OnboardingProps> = ({ onSubmit, isLoading, error, initialGameId }) => { // Destructure new prop
  return (
    // Container for centering and background effect
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-background">
      {/* Floating Background Elements */}
      <Floating sensitivity={0.5} className="absolute inset-0">
        {/* Example placement - adjust positions and depths as needed */}
        <FloatingElement depth={0.5} className="absolute top-[20%] left-[15%]">
          <motion.img
            src={exampleImages[0].url} alt={exampleImages[0].title}
            className="w-28 h-20 object-cover shadow-creative shadow-foreground rounded-lg -rotate-3 opacity-70"
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 0.7, scale: 1 }} transition={{ delay: 0.1 }}
          />
        </FloatingElement>
        <FloatingElement depth={1} className="absolute top-[15%] left-[40%]">
          <motion.img
            src={exampleImages[1].url} alt={exampleImages[1].title}
            className="w-40 h-28 object-cover shadow-creative shadow-foreground rounded-lg -rotate-12 opacity-70"
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 0.7, scale: 1 }} transition={{ delay: 0.3 }}
          />
        </FloatingElement>
        <FloatingElement depth={1.5} className="absolute top-[25%] right-[20%]">
          <motion.img
            src={exampleImages[3].url} alt={exampleImages[3].title}
            className="w-32 h-24 object-cover shadow-creative shadow-foreground rounded-lg rotate-6 opacity-70"
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 0.7, scale: 1 }} transition={{ delay: 0.5 }}
          />
        </FloatingElement>
        <FloatingElement depth={0.8} className="absolute bottom-[20%] left-[25%]">
          <motion.img
            src={exampleImages[2].url} alt={exampleImages[2].title}
            className="w-36 h-36 object-cover shadow-creative shadow-foreground rounded-lg -rotate-6 opacity-70"
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 0.7, scale: 1 }} transition={{ delay: 0.7 }}
          />
        </FloatingElement>
        <FloatingElement depth={1.2} className="absolute bottom-[25%] right-[25%]">
          <motion.img
            src={exampleImages[4].url} alt={exampleImages[4].title}
            className="w-44 h-44 object-cover shadow-creative shadow-foreground rounded-lg rotate-12 opacity-70"
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 0.7, scale: 1 }} transition={{ delay: 0.9 }}
          />
        </FloatingElement>
        <FloatingElement depth={0.3} className="absolute bottom-[15%] left-[45%]">
          <motion.img
            src={exampleImages[5].url} alt={exampleImages[5].title}
            className="w-24 h-24 object-cover shadow-creative shadow-foreground rounded-lg rotate-3 opacity-70"
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 0.7, scale: 1 }} transition={{ delay: 1.1 }}
          />
        </FloatingElement>
      </Floating>

      {/* Form positioned to the right with margin */}
      <div className="relative w-full max-w-md mx-8 md:mr-16 md:ml-auto">
        <OnboardingForm onSubmit={onSubmit} isLoading={isLoading} error={error} initialGameId={initialGameId} /> {/* Pass prop down */}
      </div>
    </div>
  );
};

export default Onboarding;