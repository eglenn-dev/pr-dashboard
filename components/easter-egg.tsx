"use client";
import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "./ui/dialog";

export function EasterEgg() {
    const [keySequence, setKeySequence] = useState("");
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

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    return (
        <>
            <Dialog open={keySequence === targetSequence}>
                <DialogContent className="flex flex-col items-center gap-4">
                    <DialogTitle className="text-2xl font-bold">
                        Chad Mode Activated
                    </DialogTitle>
                    <DialogDescription>
                        You have successfully typed {"'"}chad{"'"}
                    </DialogDescription>
                    {/* eslint-disable @next/next/no-img-element */}
                    <img src="https://github.com/CBell045.png" alt="Chad" />
                </DialogContent>
            </Dialog>
        </>
    );
}
