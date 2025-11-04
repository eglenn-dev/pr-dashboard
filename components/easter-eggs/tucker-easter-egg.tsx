"use client";
import { useState, useEffect } from "react";

export function TuckerEasterEgg() {
    const [, setKeys] = useState<string[]>([]);

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            setKeys((prev) => {
                const newKeys = [...prev, e.key.toLowerCase()].slice(-6);

                if (newKeys.join("") === "tucker") {
                    const music = new Audio("/tucker.m4a");
                    music.play();
                    return [];
                }

                return newKeys;
            });
        };

        window.addEventListener("keydown", handleKeyPress);
        return () => window.removeEventListener("keydown", handleKeyPress);
    }, []);

    return <div></div>;
}
