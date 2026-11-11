import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ArrowRight } from 'lucide-react';
import { StageWord } from './types';
import { SerbizioHomeScene } from './components/SerbizioHomeScene';
import { ConfettiOverlay2D } from './components/ConfettiBurst';
import { joinWaitlist, PRIVACY_URL } from './waitlist';

const WORDS: StageWord[] = ['door', 'home', 'street', 'barangay', 'neighborhood'];

export const App: React.FC = () => {
  const [wordIndex, setWordIndex] = useState<number>(0);
  const [pulseTick, setPulseTick] = useState<number>(1);
  const [celebrationTick, setCelebrationTick] = useState<number>(0);
  const [email, setEmail] = useState<string>('');
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Hidden from people; only bots fill it in. The backend ignores those sign-ups.
  const [honeypot, setHoneypot] = useState<string>('');

  // Refs for GSAP animations
  const pageRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const eyebrowLineRef = useRef<HTMLSpanElement>(null);
  const wordItemRef = useRef<HTMLSpanElement>(null);
  const formRowRef = useRef<HTMLFormElement>(null);
  const notifyBtnRef = useRef<HTMLButtonElement>(null);

  const currentWord = WORDS[wordIndex];

  // GSAP Entrance Timeline when showing the exterior hero copy
  useEffect(() => {
    if (submittedEmail) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        eyebrowLineRef.current,
        { scaleX: 0, transformOrigin: 'left center' },
        { scaleX: 1, duration: 0.5 }
      )
        .fromTo(
          '.hero-line-reveal',
          { y: 24, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.55,
            stagger: 0.08,
            clearProps: 'transform,opacity',
          },
          '-=0.35'
        )
        .fromTo(
          formRowRef.current,
          { y: 16, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            clearProps: 'transform,opacity',
          },
          '-=0.35'
        );
    }, pageRef);

    return () => ctx.revert();
  }, [submittedEmail]);

  // Automatic word ticker: door -> home -> street -> barangay -> neighborhood
  useEffect(() => {
    if (submittedEmail) return;
    const interval = window.setInterval(() => {
      setWordIndex((prev) => (prev + 1) % WORDS.length);
      setPulseTick((t) => t + 1);
    }, 2800);
    return () => window.clearInterval(interval);
  }, [submittedEmail]);

  // GSAP crisp word flip when wordIndex changes
  useEffect(() => {
    if (!wordItemRef.current) return;
    gsap.fromTo(
      wordItemRef.current,
      { yPercent: 75, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        duration: 0.52,
        ease: 'back.out(1.8)',
      }
    );
  }, [wordIndex]);

  // Interactive Pointer Spotlight on the White Background
  const handlePointerMovePage = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pageRef.current) return;
    const rect = pageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    pageRef.current.style.setProperty('--mx', `${x.toFixed(1)}%`);
    pageRef.current.style.setProperty('--my', `${y.toFixed(1)}%`);
  };

  // Magnetic hover for primary CTA button
  const handleBtnMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!notifyBtnRef.current) return;
    const rect = notifyBtnRef.current.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.18;
    const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.24;
    gsap.to(notifyBtnRef.current, {
      x: dx,
      y: dy,
      duration: 0.25,
      ease: 'power2.out',
    });
  };

  const handleBtnLeave = () => {
    if (!notifyBtnRef.current) return;
    gsap.to(notifyBtnRef.current, {
      x: 0,
      y: 0,
      duration: 0.45,
      ease: 'elastic.out(1, 0.4)',
    });
  };

  const handleAdvanceWord = () => {
    setWordIndex((prev) => (prev + 1) % WORDS.length);
    setPulseTick((t) => t + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim();
    if (!clean || isSaving) return;

    setIsSaving(true);
    setErrorMessage(null);
    const result = await joinWaitlist(clean, honeypot);
    setIsSaving(false);
    if (!result.ok) {
      setErrorMessage(result.message);
      return;
    }

    // Only celebrate once the email is actually saved.
    setWordIndex(0); // Focus on 'door' as we fly to the front door
    setSubmittedEmail(clean);
    setPulseTick((t) => t + 1);
    setCelebrationTick((c) => c + 1);
  };

  return (
    <div
      ref={pageRef}
      className={`serbizio-page ${submittedEmail ? 'is-inside-house' : ''}`}
      onMouseMove={handlePointerMovePage}
    >
      {/* Festive 2D Confetti Overlay on Email Submit */}
      <ConfettiOverlay2D triggerTick={celebrationTick} />

      {/* White Architectural Background Layers */}
      <div className="white-architectural-backdrop" aria-hidden="true">
        <div className="organic-mint-ribbon ribbon-top-right" />
        <div className="organic-mint-ribbon ribbon-bottom-left" />
        <div className="pointer-emerald-spotlight" />
        <div className="architectural-dot-grid" />
      </div>

      {/* Seamless Interactive 3D R3F Scene (strictly behind UI copy via z-index: 1) */}
      <div className="seamless-3d-canvas-layer">
        <SerbizioHomeScene
          currentWord={currentWord}
          pulseTick={pulseTick}
          isSubmitted={Boolean(submittedEmail)}
          submittedEmail={submittedEmail}
          celebrationTick={celebrationTick}
          onAdvanceWord={handleAdvanceWord}
          onReplayConfetti={() => {
            setCelebrationTick((c) => c + 1);
            setPulseTick((t) => t + 1);
          }}
          onStepOutside={() => setSubmittedEmail(null)}
        />
      </div>

      {/* Top Navigation Bar */}
      <header ref={navRef} className="top-nav">
        <a href="#top" className="brand-logo-wrap" aria-label="Serbizio Home">
          <img
            src="/serbizio-logo.png"
            alt="Serbizio"
            className="brand-logo-img"
          />
        </a>

        <div className="launching-soon-badge">
          <span className="pulse-square" />
          <span>LAUNCHING SOON</span>
        </div>
      </header>

      {/* Minimalist Hero Content */}
      <main className="hero-main-grid">
        {!submittedEmail && (
          <section className="hero-copy-col">
            <div className="eyebrow-row hero-line-reveal">
              <span className="coming-soon-text">COMING SOON</span>
              <span ref={eyebrowLineRef} className="coming-soon-line" />
            </div>

            <h1 className="hero-headline">
              <span className="hero-line-reveal block-line ink-line">
                Home should feel
              </span>
              <span className="hero-line-reveal block-line emerald-line">
                like home again.
              </span>
            </h1>

            <p className="hero-subheadline hero-line-reveal">
              <span>Something new is on its way to your</span>
              <button
                type="button"
                onClick={handleAdvanceWord}
                className="word-roller-window"
                title="Click to cycle: door, home, street, barangay, neighborhood"
              >
                <span ref={wordItemRef} className="word-roller-item">
                  {currentWord}.
                </span>
              </button>
            </p>

            <form
              ref={formRowRef}
              onSubmit={handleSubmit}
              className="clean-waitlist-block"
            >
              <div className="notify-form-row">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Your email"
                  aria-label="Your email"
                  aria-invalid={errorMessage ? true : undefined}
                  aria-describedby={errorMessage ? 'waitlist-error' : 'waitlist-promise'}
                  autoComplete="email"
                  maxLength={254}
                  className="email-input-field"
                  required
                />
                <button
                  ref={notifyBtnRef}
                  type="submit"
                  onMouseMove={handleBtnMove}
                  onMouseLeave={handleBtnLeave}
                  className="notify-submit-btn"
                  disabled={isSaving}
                  aria-busy={isSaving}
                >
                  <span>{isSaving ? 'Saving…' : 'Notify me'}</span>
                  <ArrowRight size={18} />
                </button>
              </div>

              <div className="form-honeypot" aria-hidden="true">
                <label>
                  Website
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </label>
              </div>

              {errorMessage && (
                <p id="waitlist-error" className="form-error-text" role="alert">
                  {errorMessage}
                </p>
              )}

              <p id="waitlist-promise" className="footnote-promise">
                One email on launch day. Nothing else.{' '}
                <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer">
                  Privacy policy
                </a>
              </p>
            </form>
          </section>
        )}
      </main>

      {/* Bottom Footer Bar */}
      <footer className="bottom-footer">
        <span>© 2026 Serbizio</span>
        <span>Made for homes in the Philippines</span>
      </footer>
    </div>
  );
};

export default App;
