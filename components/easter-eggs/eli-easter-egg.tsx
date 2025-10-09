"use client";
import { useState, useEffect } from "react";

export function EliEasterEgg() {
    const [, setKeys] = useState<string[]>([]);
    const [showUnicorn, setShowUnicorn] = useState(false);

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            setKeys((prev) => {
                const newKeys = [...prev, e.key.toLowerCase()].slice(-3);

                if (newKeys.join("") === "eli") {
                    // Show only one unicorn
                    setShowUnicorn(true);

                    // Remove unicorn after animation completes
                    setTimeout(() => {
                        setShowUnicorn(false);
                    }, 4000);

                    return [];
                }

                return newKeys;
            });
        };

        window.addEventListener("keydown", handleKeyPress);
        return () => window.removeEventListener("keydown", handleKeyPress);
    }, []);

    return (
        <>
            <style>{`
                @keyframes flyDiagonal {
                    0% {
                        transform: translate(0, 0) rotate(90deg);
                    }
                    100% {
                        transform: translate(100vw, 100vh) rotate(-45deg);
                    }
                }
            `}</style>
            <div className="fixed inset-0 pointer-events-none z-50">
                {showUnicorn && (
                    <div
                        className="absolute animate-fly"
                        style={{
                            left: "0",
                            top: "0",
                            animation: "flyDiagonal 3s linear forwards",
                        }}
                    >
                        {/* eslint-disable @next/next/no-img-element */}
                        <img src="/eli.jpeg" alt="Eli" className="h-48 w-48" />
                    </div>
                )}
            </div>
        </>
    );
}
