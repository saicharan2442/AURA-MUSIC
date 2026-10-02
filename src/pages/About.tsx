import { motion } from 'framer-motion';
import { Globe, Heart, Scale, Shield, Sparkles } from 'lucide-react';
import { Logo } from '../components/Logo';
import { getAttributions } from '../services/providers';

const STACK = [
  ['React 19', 'UI framework'],
  ['TypeScript', 'Strict typing'],
  ['Tailwind CSS 4', 'Design system'],
  ['Zustand', 'State & persistence'],
  ['Framer Motion', 'Animation'],
  ['Lucide', 'Iconography'],
  ['Tauri', 'Windows packaging (build target)'],
];

const LIBS = ['react', 'react-dom', 'vite', 'tailwindcss', 'zustand', 'framer-motion', 'lucide-react'];

export default function About() {
  return (
    <div className="max-w-[880px] mx-auto px-5 md:px-9 pt-10 pb-16">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center">
        <div className="flex justify-center"><Logo size={72} glow /></div>
        <h1 className="display text-main font-bold text-[32px] tracking-tight mt-6">Aura Music</h1>
        <p className="text-dim text-[12.5px] mt-1.5 tracking-wide">Version 1.0.0 · Windows desktop · Open source</p>
        <p className="text-soft text-[14px] mt-4 max-w-[460px] mx-auto leading-relaxed">
          A lightweight, premium music streaming client — built to be fast, beautiful and entirely yours. No accounts, no trackers, no bloat.
        </p>
      </motion.div>

      <div className="space-y-5 mt-12">
        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="card p-6">
          <h2 className="display text-main font-semibold text-[16px] flex items-center gap-2.5">
            <Sparkles size={15} className="text-acc" /> Built with
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 mt-4">
            {STACK.map(([name, role]) => (
              <div key={name} className="rounded-xl bg-card border border-line px-3.5 py-2.5">
                <p className="text-[13px] font-semibold text-main">{name}</p>
                <p className="text-[11px] text-dim">{role}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="card p-6">
          <h2 className="display text-main font-semibold text-[16px] flex items-center gap-2.5">
            <Globe size={15} className="text-acc" /> Music providers
          </h2>
          <p className="text-soft text-[13px] mt-3 leading-relaxed">
            Aura uses a modular provider layer with automatic failover — if one source is unreachable, playback moves
            to the next without interrupting you.
          </p>
          <div className="space-y-2.5 mt-4">
            {getAttributions().map((p) => (
              <div key={p.name} className="rounded-xl bg-card border border-line px-4 py-3">
                <p className="text-[13px] font-semibold text-main">{p.name}</p>
                <p className="text-[12px] text-dim leading-relaxed mt-0.5">{p.text}</p>
              </div>
            ))}
          </div>
          <p className="text-dim text-[12.5px] mt-4 leading-relaxed">
            iTunes content is the provider's official, freely-served 30-second preview streams; Audius content is
            published openly by independent artists on the Open Audio Protocol with full-length streams. No
            authentication is bypassed, no DRM is touched, and no copyrighted audio is downloaded or cached.
          </p>
          <p className="text-dim text-[12.5px] mt-2.5 leading-relaxed">
            <span className="text-soft font-semibold">About YouTube:</span> YouTube's official interfaces do not
            permit keyless search or streaming, and workarounds would bypass their access controls — so Aura does
            not integrate YouTube without credentials. Audius is the closest fully-permitted no-login alternative.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-5">
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="card p-6">
            <h2 className="display text-main font-semibold text-[16px] flex items-center gap-2.5">
              <Shield size={15} className="text-acc" /> Privacy
            </h2>
            <p className="text-dim text-[12.5px] mt-3 leading-relaxed">
              Everything — favorites, playlists, history, settings — lives in local storage on this device. Usage metadata is cached
              briefly in memory to keep the app fast. Nothing is uploaded anywhere.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="card p-6">
            <h2 className="display text-main font-semibold text-[16px] flex items-center gap-2.5">
              <Scale size={15} className="text-acc" /> Licensing
            </h2>
            <p className="text-dim text-[12.5px] mt-3 leading-relaxed">
              Aura is open source under the MIT License. Artwork, metadata and audio previews belong to their respective rights
              holders and are served through permitted provider interfaces.
            </p>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="card p-6">
          <h2 className="display text-main font-semibold text-[16px] flex items-center gap-2.5">
            <Heart size={15} className="text-acc" /> Third-party libraries
          </h2>
          <p className="text-dim text-[12px] mt-3 leading-relaxed">
            {LIBS.join(' · ')} — all MIT licensed. Icons by Lucide Contributors.
            Charts and search courtesy of Apple's public iTunes &amp; Apple Music interfaces.
          </p>
        </motion.div>

        <p className="text-center text-[11.5px] text-dim pt-3">
          Aura Music is a placeholder brand — an original design, not affiliated with Apple, Spotify or any streaming service.
        </p>
      </div>
    </div>
  );
}
