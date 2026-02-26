import { Link } from 'react-router-dom';
import Button from '../atoms/Button';
import Icon from '../atoms/Icon';

export default function CTASection({ role }) {
  return (
    <section id="get-started" className="relative z-10 w-full border-b border-slate-200 bg-slate-50 py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="mb-4 font-serif text-3xl font-medium tracking-tight text-text md:text-4xl">Ready to modernise your chambers library?</h2>
        <p className="mx-auto mb-10 max-w-xl text-base text-text-secondary">
          Join Australian legal professionals who've replaced spreadsheets and guesswork with a system built for how they actually work.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link to={`/signup?role=${role}`}>
            <Button variant="primary" size="md">Get Started</Button>
          </Link>
          {role === 'clerk' ? (
            <Button size="md" variant="secondary">
              <span className="inline-flex items-center gap-2">
                <Icon name="solar:calendar-linear" size={18} />
                <span>Book a Walkthrough</span>
              </span>
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
