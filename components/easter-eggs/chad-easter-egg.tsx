"use client";
import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "../ui/dialog";

export function ChadEasterEgg() {
    const [keySequence, setKeySequence] = useState("");
    const [chadMode, setChadMode] = useState(false);
    const targetSequence = "chad";

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            setKeySequence((prevSequence) => {
                const newSequence = prevSequence + event.key;
                if (newSequence.length > targetSequence.length) {
                    return newSequence.slice(
                        newSequence.length - targetSequence.length
                    );
                }
                return newSequence;
            });
        };

        if (keySequence === targetSequence) setChadMode(true);

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [keySequence]);

    return (
        <>
            <Dialog open={chadMode} onOpenChange={setChadMode}>
                <DialogContent className="flex flex-col items-center gap-4">
                    <DialogTitle className="text-2xl font-bold">
                        Chad Mode Activated
                    </DialogTitle>
                    <DialogDescription>
                        You have successfully typed {"'"}chad{"'"}
                    </DialogDescription>
                    {/* eslint-disable @next/next/no-img-element */}
                    <img src="/chad.jpeg" alt="Chad" />
                </DialogContent>
            </Dialog>
        </>
    );
}
