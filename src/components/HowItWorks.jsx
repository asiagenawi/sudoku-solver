import './HowItWorks.css';

const steps = [
  {
    number: '1',
    title: 'Upload',
    description: 'Photo or image of a puzzle',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    )
  },
  {
    number: '2',
    title: 'Detect',
    description: 'OCR reads every cell',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    )
  },
  {
    number: '3',
    title: 'Solve',
    description: 'Solution in milliseconds',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    )
  }
];

const Arrow = () => (
  <div className="how-it-works-arrow" aria-hidden="true">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  </div>
);

export function HowItWorks() {
  return (
    <section className="how-it-works">
      <h2 className="how-it-works-title">How it works</h2>
      <div className="how-it-works-steps">
        {steps.map((step, i) => (
          <div key={step.title} className="how-it-works-step-wrapper">
            {i > 0 && <Arrow />}
            <div className="how-it-works-step">
              <div className="how-it-works-icon">
                <span className="how-it-works-number">{step.number}</span>
                {step.icon}
              </div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
