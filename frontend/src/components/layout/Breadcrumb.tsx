import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Capitalize path segments for readable links
  const formatLabel = (segment: string) => {
    return segment
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <nav className="flex items-center space-x-1.5 font-display text-sm font-medium text-muted-foreground select-none">
      <Link
        to="/dashboard"
        className="flex items-center gap-1 hover:text-foreground transition-colors py-1 px-1.5 rounded-lg hover:bg-accent/40"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>
      
      {pathnames.map((value, index) => {
        // Skip rendering "dashboard" twice if it's the first segment
        if (value === 'dashboard' && index === 0) return null;
        
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;

        return (
          <React.Fragment key={to}>
            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground/50" />
            {isLast ? (
              <span className="text-foreground font-semibold px-1 py-0.5 truncate max-w-[120px] sm:max-w-xs">
                {formatLabel(value)}
              </span>
            ) : (
              <Link
                to={to}
                className="hover:text-foreground transition-colors py-1 px-1.5 rounded-lg hover:bg-accent/40 truncate max-w-[100px]"
              >
                {formatLabel(value)}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
