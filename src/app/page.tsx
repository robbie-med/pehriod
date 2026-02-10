'use client';

import { useState, useEffect } from 'react';
import { languages, translations, Language } from '../data/translations';

// Basic icons using SVG
const Icons = {
  Clock: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Book: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  Pill: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
  Globe: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Alert: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
};

export default function Home() {
  const [lang, setLang] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState<'tracker' | 'education' | 'meds' | 'settings'>('tracker');
  const [symptoms, setSymptoms] = useState<number>(0); // 0-10 scale
  
  // Basic mock history state
  const [history, setHistory] = useState<any[]>([]);

  const t = translations[lang];
  const dir = languages[lang].dir;

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  return (
    <div className={`min-h-screen bg-gray-50 pb-20`}>
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">{t.title}</h1>
          <button onClick={() => setActiveTab('settings')} className="text-gray-500">
            <Icons.Globe />
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4">
        {activeTab === 'tracker' && (
          <div className="space-y-6">
            
            {/* Symptom Slider */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.pain_level}: {symptoms}</label>
              <input 
                type="range" 
                min="0" 
                max="10" 
                value={symptoms} 
                onChange={(e) => setSymptoms(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>🙂</span>
                <span>😐</span>
                <span>😫</span>
              </div>
            </div>

            {/* Timeline Placeholder */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold mb-4">{t.schedule}</h2>
              <div className="space-y-4">
                {/* Mock Item */}
                <div className="flex items-center gap-4">
                  <div className="w-16 font-mono text-sm text-gray-500">08:00</div>
                  <div className="flex-1 bg-pink-50 p-3 rounded-lg border border-pink-100 flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-pink-900">Pamprin Multi-Symptom</div>
                      <div className="text-xs text-pink-700">500mg Acetaminophen</div>
                    </div>
                    <button className="bg-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-sm active:scale-95 transition-transform">
                      {t.take}
                    </button>
                  </div>
                </div>

                 <div className="flex items-center gap-4">
                  <div className="w-16 font-mono text-sm text-gray-500">12:00</div>
                  <div className="flex-1 bg-orange-50 p-3 rounded-lg border border-orange-100 flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-orange-900">Ibuprofen</div>
                      <div className="text-xs text-orange-700">200mg</div>
                    </div>
                    <button className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-sm active:scale-95 transition-transform">
                      {t.take}
                    </button>
                  </div>
                </div>

              </div>
              
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-3 items-start">
                 <div className="text-yellow-600 mt-0.5"><Icons.Alert /></div>
                 <div className="text-sm text-yellow-800">
                   {t.note}
                 </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'education' && (
           <div className="bg-white p-6 rounded-2xl shadow-sm">
             <h2 className="text-2xl font-bold mb-4">Understanding Period Pain</h2>
             <p className="text-gray-600 mb-4">
               Dysmenorrhea (painful periods) is caused by prostaglandins, chemicals that trigger muscle contractions in your uterus...
               {/* Content will be expanded */}
             </p>
           </div>
        )}

        {activeTab === 'meds' && (
           <div className="space-y-4">
             <h2 className="text-xl font-bold mb-2">{t.meds}</h2>
             {/* Cards for meds */}
             <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-pink-500">
               <h3 className="font-bold text-lg">Pamprin Multi-Symptom</h3>
               <p className="text-sm text-gray-600 mt-1">Contains: Acetaminophen (Pain), Pamabrom (Diuretic), Pyrilamine Maleate (Antihistamine).</p>
             </div>
             <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-600">
               <h3 className="font-bold text-lg">Midol Complete</h3>
               <p className="text-sm text-gray-600 mt-1">Contains: Acetaminophen, Caffeine, Pyrilamine Maleate.</p>
             </div>
           </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h2 className="text-xl font-bold mb-4">{t.settings}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.keys(languages) as Language[]).map((l) => (
                <button 
                  key={l}
                  onClick={() => { setLang(l); setActiveTab('tracker'); }}
                  className={`p-3 rounded-lg text-left border ${lang === l ? 'border-pink-500 bg-pink-50 ring-1 ring-pink-500' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  {languages[l].name}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-around items-center text-xs font-medium text-gray-500">
        <button 
          onClick={() => setActiveTab('tracker')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'tracker' ? 'text-pink-600' : ''}`}
        >
          <Icons.Clock />
          <span>{t.tracker}</span>
        </button>
        <button 
          onClick={() => setActiveTab('education')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'education' ? 'text-pink-600' : ''}`}
        >
          <Icons.Book />
          <span>{t.education}</span>
        </button>
        <button 
          onClick={() => setActiveTab('meds')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'meds' ? 'text-pink-600' : ''}`}
        >
          <Icons.Pill />
          <span>{t.meds}</span>
        </button>
      </nav>
    </div>
  );
}
