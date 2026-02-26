import { useNavigate } from 'react-router-dom';
import Button from '../atoms/Button';
import Icon from '../atoms/Icon';
import PersonaToggle from '../atoms/PersonaToggle';
import HeroMockup from '../molecules/HeroMockup';
import { heroContent, reviewCards } from '../../mocks/landingContent';

export default function HeroSection({ role, onRoleChange, heroToggleRef }) {
  const navigate = useNavigate();
  const barrister = heroContent.barrister;
  const clerk = heroContent.clerk;

  return (
    <section className="relative w-full">
      <div className="bg-hero-gradient absolute inset-0 z-0 pointer-events-none">
        <div className="bg-hero-gradient-extra" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-col items-center px-4 py-20 md:px-6 md:py-32">
        <div className="animate-slide-up relative z-10 flex w-full flex-col items-center gap-12 lg:flex-row lg:gap-20" style={{ animationDelay: '0.1s' }}>
          <div className="w-full lg:w-1/2">
            <div className="mb-10 flex items-center gap-3" ref={heroToggleRef}>
              <span className="font-serif text-base font-medium text-text">I am a</span>
              <PersonaToggle value={role} onChange={onRoleChange} />
            </div>

            <div id="tab-barristers" className={`tab-content ${role === 'barrister' ? 'active' : ''}`}>
              <h1 className="mb-8 font-serif text-5xl font-medium leading-none tracking-tight text-text md:text-7xl">
                {barrister.titleLines[0]}
                <br />
                <span className="text-brand">{barrister.titleLines[1]}</span>
              </h1>
              <p className="mb-12 max-w-xl text-lg leading-relaxed text-slate-600">
                <span className="font-semibold">The Chambers Library Management System</span> {barrister.summary}
              </p>
              <div className="flex flex-col items-start gap-4 sm:flex-row">
                <Button size="lg" variant="primary" onClick={() => navigate('/signup?role=barrister')}>
                  {barrister.cta}
                </Button>
                <Button size="lg" variant="secondary">
                  <span className="inline-flex items-center gap-2">
                    <Icon name={barrister.secondaryIcon} size={18} />
                    <span>{barrister.secondaryCta}</span>
                  </span>
                </Button>
              </div>
            </div>

            <div id="tab-clerks" className={`tab-content ${role === 'clerk' ? 'active' : ''}`}>
              <h1 className="mb-8 font-serif text-5xl font-medium leading-none tracking-tight text-text md:text-7xl">
                {clerk.titleLines[0]}
                <br />
                <span className="text-brand">{clerk.titleLines[1]}</span>
              </h1>
              <p className="mb-12 max-w-xl text-lg leading-relaxed text-slate-600">
                <span className="font-semibold">The Chambers Library Management System</span> {clerk.summary}
              </p>
              <div className="flex flex-col items-start gap-4 sm:flex-row">
                <Button size="lg" variant="primary" onClick={() => navigate('/signup?role=clerk')}>
                  {clerk.cta}
                </Button>
                <Button size="lg" variant="secondary">
                  <span className="inline-flex items-center gap-2">
                    <Icon name={clerk.secondaryIcon} size={18} />
                    <span>{clerk.secondaryCta}</span>
                  </span>
                </Button>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/2">
            <HeroMockup role={role} reviews={reviewCards[role]} />
          </div>
        </div>
      </div>
    </section>
  );
}
