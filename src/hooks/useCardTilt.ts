import { useRef, useState, useCallback } from 'react';

interface Glare {
    x: number;
    y: number;
    opacity: number;
}

export function useCardTilt(disableTilt: boolean) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [rotation, setRotation] = useState({ x: 0, y: 0 });
    const [glare, setGlare] = useState<Glare>({ x: 50, y: 50, opacity: 0 });
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (disableTilt || !cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -12;
        const rotateY = ((x - centerX) / centerX) * 12;

        setRotation({ x: rotateX, y: rotateY });
        setGlare({
            x: (x / rect.width) * 100,
            y: (y / rect.height) * 100,
            opacity: 1
        });
    }, [disableTilt]);

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false);
        if (disableTilt) return;
        setRotation({ x: 0, y: 0 });
        setGlare(prev => ({ ...prev, opacity: 0 }));
    }, [disableTilt]);

    const tiltStyle = {
        transform: disableTilt
            ? 'none'
            : `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(${isHovered ? 1.05 : 1}, ${isHovered ? 1.05 : 1}, 1)`,
        transformStyle: 'preserve-3d' as const,
        boxShadow: isHovered
            ? '0 20px 40px -5px rgba(0,0,0,0.4), 0 10px 20px -5px rgba(0,0,0,0.2)'
            : 'none'
    };

    return {
        cardRef,
        rotation,
        glare,
        isHovered,
        setIsHovered,
        handleMouseMove,
        handleMouseLeave,
        tiltStyle,
    };
}
