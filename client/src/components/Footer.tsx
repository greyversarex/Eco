import { Mail, Phone, Globe } from 'lucide-react';

export function Footer() {
  return (
    <footer 
      className="border-t border-border/20 backdrop-blur-md mt-8"
      style={{
        background: 'linear-gradient(135deg, #4a9d4a 0%, #5cb85c 50%, #6fca6f 100%)'
      }}
    >
      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4 md:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm text-white">
          <a 
            href="https://www.tajnature.tj" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:bg-white/20 transition-colors px-3 py-1 rounded"
            data-testid="link-website"
          >
            <Globe className="h-4 w-4" />
            <span>www.tajnature.tj</span>
          </a>
          <a 
            href="mailto:info@tajnature.tj"
            className="flex items-center gap-2 hover:bg-white/20 transition-colors px-3 py-1 rounded"
            data-testid="link-email"
          >
            <Mail className="h-4 w-4" />
            <span>info@tajnature.tj</span>
          </a>
          <a 
            href="tel:+992905123456"
            className="flex items-center gap-2 hover:bg-white/20 transition-colors px-3 py-1 rounded"
            data-testid="link-phone"
          >
            <Phone className="h-4 w-4" />
            <span>(+992) 905 12 34 56</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
