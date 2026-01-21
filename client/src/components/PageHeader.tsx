import { ReactNode } from 'react';

interface PageHeaderProps {
  variant?: 'department' | 'admin';
  children: ReactNode;
  className?: string;
}

export function PageHeader({ variant = 'department', children, className = '' }: PageHeaderProps) {
  const baseClasses = "sticky top-0 z-50 border-b backdrop-blur-md relative";
  
  const variantClasses = {
    department: "border-border/20",
    admin: "border-border/20"
  };
  
  const variantStyles = {
    department: {
      background: 'linear-gradient(135deg, #4a9d4a 0%, #5cb85c 50%, #6fca6f 100%)'
    },
    admin: {
      background: 'linear-gradient(135deg, #4a9d4a 0%, #5cb85c 50%, #6fca6f 100%)'
    }
  };

  return (
    <header 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={variantStyles[variant]}
    >
      {children}
    </header>
  );
}

interface PageHeaderContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageHeaderContainer({ children, className = '' }: PageHeaderContainerProps) {
  return (
    <div className={`mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 ${className}`}>
      <div className="flex h-14 sm:h-16 items-center justify-between gap-2">
        {children}
      </div>
    </div>
  );
}

interface PageHeaderLeftProps {
  children: ReactNode;
  className?: string;
}

export function PageHeaderLeft({ children, className = '' }: PageHeaderLeftProps) {
  return (
    <div className={`flex items-center gap-2 sm:gap-4 min-w-0 flex-1 ${className}`}>
      {children}
    </div>
  );
}

interface PageHeaderRightProps {
  children: ReactNode;
  className?: string;
}

export function PageHeaderRight({ children, className = '' }: PageHeaderRightProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {children}
    </div>
  );
}
