"use client";

import SystemPulse from "@/components/dashboard/SystemPulse";
import SurveillanceFeed from "@/components/dashboard/SurveillanceFeed";
import ComplianceDossier from "@/components/dashboard/ComplianceDossier";
import TemporalSlider from "@/components/dashboard/TemporalSlider";
import { MissionProvider } from "@/context/MissionContext";
import useRealtimeAlerts from "@/hooks/useRealtimeAlerts";

function InternalLayout({ children }: { children: React.ReactNode }) {
    // Trigger Simulation
    useRealtimeAlerts();

    return (
        <div className="relative w-full h-full">
            {/* Top Bar */}
            <SystemPulse />

            {/* Left Sidebar */}
            <SurveillanceFeed />

            {/* Right Sidebar */}
            <ComplianceDossier />

            {/* Main Map Area */}
            <div className="absolute inset-0 z-0">
                {children}
            </div>

            {/* Bottom Controls */}
            <TemporalSlider />
        </div>
    );
}

export default function MissionControlLayout({ children }: { children: React.ReactNode }) {
    return (
        <MissionProvider>
            <InternalLayout>{children}</InternalLayout>
        </MissionProvider>
    );
}
