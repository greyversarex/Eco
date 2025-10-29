import { Phone } from 'lucide-react';

export function Footer() {
  return (
    <footer 
      className="border-t border-border/20 backdrop-blur-md"
      style={{
        background: 'linear-gradient(135deg, #4a9d4a 0%, #5cb85c 50%, #6fca6f 100%)',
        marginTop: '2rem'
      }}
    >
      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4 md:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center gap-2 text-sm text-white">
          <div className="font-semibold text-base">Раёсати рақамикунонӣ ва инноватсия</div>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <a 
              href="tel:+992372233505"
              className="flex items-center gap-2 hover:bg-white/20 transition-colors px-3 py-1 rounded"
              data-testid="link-phone-1"
            >
              <Phone className="h-4 w-4" />
              <span>(+992) (37) 223 35 05</span>
            </a>
            <a 
              href="tel:+992372233510"
              className="flex items-center gap-2 hover:bg-white/20 transition-colors px-3 py-1 rounded"
              data-testid="link-phone-2"
            >
              <Phone className="h-4 w-4" />
              <span>(+992) (37) 223 35 10</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
