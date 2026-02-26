export default function LogoCloudSection({ logos }) {
  return (
    <section className="relative z-10 w-full border-t border-slate-200 bg-white py-10">
      <div className="mx-auto max-w-7xl px-6">
        <p className="mb-6 text-center text-xs font-medium uppercase tracking-widest text-text-muted">Integrated with</p>
        <div className="flex flex-wrap items-center justify-center gap-12 md:gap-20">
          {logos.map((logo) => (
            <img key={logo.alt} src={logo.src} alt={logo.alt} style={{ height: `${logo.height}px` }} />
          ))}
        </div>
      </div>
    </section>
  );
}
