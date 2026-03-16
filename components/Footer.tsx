export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink py-10 px-6 md:px-10 lg:px-16">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-vanguard font-bold text-white/80 text-sm tracking-wider">
            CV
          </span>
          <span className="text-white/10 text-xs">·</span>
          <span className="text-white/30 text-xs font-sans">
            Clay VanderKolk
          </span>
        </div>

        <div className="flex items-center gap-6">
          <a
            href="mailto:clayvanderkolk@gmail.com"
            className="text-xs font-sans text-white/30 hover:text-accent transition-colors"
          >
            Email
          </a>
          <a
            href="https://github.com/claytonvk"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-sans text-white/30 hover:text-accent transition-colors"
          >
            GitHub
          </a>
          <a
            href="/ClayVanderKolkResume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-sans text-white/30 hover:text-accent transition-colors"
          >
            Resume
          </a>
        </div>

        <p className="text-xs font-sans text-white/20">
          © {year} Clay VanderKolk
        </p>
      </div>
    </footer>
  );
}
