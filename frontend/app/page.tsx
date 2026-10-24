"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "./components/layout/AppShell";
import CaseWizard from "./components/cases/CaseWizard";
import CaseWorkspace from "./components/cases/CaseWorkspace";
import LandingPage from "./components/landing/LandingPage";

function HomeContent() {
  const searchParams = useSearchParams();
  const [activeCase, setActiveCase] = useState<{caseId: string, seedAddress: string, firNumber?: string, ioDesignation?: string} | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [showLanding, setShowLanding] = useState<boolean>(true);
  const [wizardSeedAddress, setWizardSeedAddress] = useState<string>('');
  const [wizardAuthority, setWizardAuthority] = useState<{
    statuteRef?: string;
    firNumber?: string;
    policeStation?: string;
    ioDesignation?: string;
  }>({
    statuteRef: 'Sec 94 BNSS',
    firNumber: '',
    policeStation: '',
    ioDesignation: ''
  });

  useEffect(() => {
    const caseId = searchParams?.get('caseId');
    const seedAddress = searchParams?.get('seedAddress') || '';
    
    if (caseId) {
      setActiveCase({ caseId, seedAddress });
      setWizardSeedAddress(seedAddress);
    }
  }, [searchParams]);

  const handleStepChange = (step: number) => {
    if (step <= 3) {
      setActiveCase(null);
      setCurrentStep(step);
    } else {
      setCurrentStep(4);
    }
  };

  const handleBackToSeed = () => {
    setActiveCase(null);
    setCurrentStep(3);
  };

  if (showLanding) {
    return <LandingPage onLaunch={() => setShowLanding(false)} />;
  }

  return (
    <AppShell 
      currentStep={currentStep} 
      onStepChange={handleStepChange}
      activeCase={activeCase}
    >
      {!activeCase ? (
        <CaseWizard 
          currentStep={currentStep as 1 | 2 | 3}
          initialSeedAddress={wizardSeedAddress}
          initialAuthority={wizardAuthority}
          onStepChange={(step) => setCurrentStep(step)}
          onComplete={async (caseId, seedAddress, firNumber, ioDesignation) => {
            setWizardSeedAddress(seedAddress);
            setWizardAuthority(prev => ({
              ...prev,
              firNumber,
              ioDesignation
            }));
            try {
              const res = await fetch('http://localhost:8000/api/v1/cases/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  case_id: caseId,
                  authority: wizardAuthority.statuteRef || 'Sec 94 BNSS',
                  seed_address: seedAddress,
                  fir_number: firNumber,
                  io_designation: ioDesignation
                })
              });
              if (!res.ok) console.error("Failed to create case");
            } catch (err) {
              console.error("API error", err);
            }
            setActiveCase({ caseId, seedAddress, firNumber, ioDesignation });
            setCurrentStep(4);
          }} 
        />
      ) : (
        <CaseWorkspace 
          caseId={activeCase.caseId} 
          seedAddress={activeCase.seedAddress}
          onBackToSeed={handleBackToSeed}
        />
      )}
    </AppShell>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
