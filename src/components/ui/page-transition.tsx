import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
    children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
    return (
        <div className="animate-fade-in">
            {children}
        </div>
    );
}
