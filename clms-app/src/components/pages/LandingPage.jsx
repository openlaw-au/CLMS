import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { featureSets, logoCloud, trustCards } from '../../mocks/landingContent';
import CTASection from '../organisms/CTASection';
import FeatureGrid from '../organisms/FeatureGrid';
import FooterSection from '../organisms/FooterSection';
import HeroSection from '../organisms/HeroSection';
import LogoCloudSection from '../organisms/LogoCloudSection';
import Navbar from '../organisms/Navbar';
import TrustSection from '../organisms/TrustSection';

export default function LandingPage() {
  const { role, setRole } = useAppContext();
  const heroToggleRef = useRef(null);
  const swapTimerRef = useRef(null);
  const [showNavRoleToggle, setShowNavRoleToggle] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [featureRole, setFeatureRole] = useState(role);
  const [featureSwapping, setFeatureSwapping] = useState(false);

  const primaryFeatures = featureSets[featureRole];
  const secondaryFeatures = useMemo(() => {
    return featureRole === 'barrister' ? featureSets.clerk : featureSets.barrister;
  }, [featureRole]);

  useEffect(() => {
    const observed = heroToggleRef.current;

    if (!observed) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setShowNavRoleToggle(!entry.isIntersecting);
        });
      },
      { threshold: 0 },
    );

    observer.observe(observed);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const sections = ['features', 'why-clms']
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (!sections.length) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3 },
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      observer.disconnect();
    };
  }, []);

  const navigateSection = (sectionId) => {
    const target = document.getElementById(sectionId);
    const nav = document.querySelector('header nav');

    if (!target || !nav) {
      return;
    }

    const navHeight = nav.getBoundingClientRect().height;
    const top = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  const handleRoleChange = (nextRole) => {
    if (nextRole === role) {
      return;
    }

    setRole(nextRole);
    setFeatureSwapping(true);

    if (swapTimerRef.current) {
      clearTimeout(swapTimerRef.current);
    }

    swapTimerRef.current = setTimeout(() => {
      setFeatureRole(nextRole);
      setFeatureSwapping(false);
      swapTimerRef.current = null;
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (swapTimerRef.current) {
        clearTimeout(swapTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar
        role={role}
        onRoleChange={handleRoleChange}
        showNavRoleToggle={showNavRoleToggle}
        activeSection={activeSection}
        onNavigateSection={navigateSection}
      />
      <main>
        <HeroSection role={role} onRoleChange={handleRoleChange} heroToggleRef={heroToggleRef} />
        <LogoCloudSection logos={logoCloud} />
        <FeatureGrid primary={primaryFeatures} secondary={secondaryFeatures} swapping={featureSwapping} />
        <TrustSection cards={trustCards} />
        <CTASection role={role} />
      </main>
      <FooterSection />
    </div>
  );
}
