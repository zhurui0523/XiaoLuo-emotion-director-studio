import React, { useEffect } from 'react';
import { MinimalMatrixStudio } from './components/MinimalMatrixStudio';
import { SkillSandboxModal } from './components/SkillSandboxModal';
import { useEmotionStore } from './store/useEmotionStore';

export default function App() {
  const { generatePrompts } = useEmotionStore();

  useEffect(() => {
    // Generate initial prompts on load
    generatePrompts();
  }, [generatePrompts]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white antialiased">
      {/* Main Studio Workspace */}
      <main className="flex-1 p-3 md:p-5 max-w-[900px] mx-auto w-full space-y-4">
        <MinimalMatrixStudio />
      </main>

      {/* Modal for Skill Specification Export */}
      <SkillSandboxModal />
    </div>
  );
}


