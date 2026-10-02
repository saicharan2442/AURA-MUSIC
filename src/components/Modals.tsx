import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ListMusic, Music2, Plus } from 'lucide-react';
import { ModalShell } from './ui';
import { Artwork } from './Artwork';
import { useLibrary } from '../store/library';
import { useUI } from '../store/ui';
import type { Track } from '../types';

/* All app modals, driven by ui store state. */

export function Modals() {
  const modal = useUI((s) => s.modal);
  return (
    <AnimatePresence>
      {modal?.type === 'createPlaylist' && <CreateModal key="create" />}
      {modal?.type === 'renamePlaylist' && <RenameModal key="rename" id={modal.payload.id} name={modal.payload.name} />}
      {modal?.type === 'addToPlaylist' && <AddModal key="add" track={modal.payload.track} />}
      {modal?.type === 'confirmDeletePlaylist' && <DeleteModal key="del" id={modal.payload.id} name={modal.payload.name} />}
    </AnimatePresence>
  );
}

function CreateModal() {
  const closeModal = useUI((s) => s.closeModal);
  const createPlaylist = useLibrary((s) => s.createPlaylist);
  const go = useUI((s) => s.go);
  const toast = useUI((s) => s.toast);
  const [name, setName] = useState('');

  const submit = () => {
    const id = createPlaylist(name || 'My Playlist');
    closeModal();
    toast({ title: 'Playlist created', sub: name || 'My Playlist', kind: 'success' });
    go({ id: 'playlist', params: { id } });
  };

  return (
    <ModalShell title="Create playlist" sub="Playlists are stored locally on this device." onClose={closeModal}>
      <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <input autoFocus className="input" placeholder="My Playlist" value={name} maxLength={60}
          onChange={(e) => setName(e.target.value)} aria-label="Playlist name" />
        <div className="flex justify-end gap-2.5 mt-5">
          <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
          <button type="submit" className="btn btn-accent">Create</button>
        </div>
      </form>
    </ModalShell>
  );
}

function RenameModal({ id, name }: { id: string; name: string }) {
  const closeModal = useUI((s) => s.closeModal);
  const renamePlaylist = useLibrary((s) => s.renamePlaylist);
  const [value, setValue] = useState(name);
  const submit = () => { renamePlaylist(id, value); closeModal(); };
  return (
    <ModalShell title="Rename playlist" onClose={closeModal}>
      <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <input autoFocus className="input" value={value} maxLength={60}
          onChange={(e) => setValue(e.target.value)} aria-label="Playlist name" />
        <div className="flex justify-end gap-2.5 mt-5">
          <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
          <button type="submit" className="btn btn-accent">Save</button>
        </div>
      </form>
    </ModalShell>
  );
}

function AddModal({ track }: { track: Track }) {
  const closeModal = useUI((s) => s.closeModal);
  const playlists = useLibrary((s) => s.playlists);
  const addToPlaylist = useLibrary((s) => s.addToPlaylist);
  const createPlaylist = useLibrary((s) => s.createPlaylist);
  const toast = useUI((s) => s.toast);

  const add = (id: string, name: string) => {
    const ok = addToPlaylist(id, track);
    closeModal();
    toast({
      title: ok ? `Added to ${name}` : `Already in ${name}`,
      sub: track.title, art: track.artworkSmall || track.artwork,
      kind: ok ? 'success' : 'info',
    });
  };

  return (
    <ModalShell title="Add to playlist" sub={track.title} onClose={closeModal} width={420}>
      <div className="max-h-[320px] overflow-y-auto scroll-slim -mx-1 px-1 space-y-1">
        <button
          onClick={() => { const id = createPlaylist('My Playlist'); addToPlaylist(id, track); closeModal(); toast({ title: 'Playlist created', sub: track.title, kind: 'success' }); }}
          className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[color-mix(in_srgb,var(--text)_7%,transparent)] transition-colors text-left">
          <span className="w-10 h-10 rounded-lg flex items-center justify-center border border-dashed border-line text-soft">
            <Plus size={16} />
          </span>
          <span className="text-[13.5px] font-semibold text-main">New playlist</span>
        </button>
        {playlists.map((p) => (
          <button key={p.id} onClick={() => add(p.id, p.name)}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[color-mix(in_srgb,var(--text)_7%,transparent)] transition-colors text-left">
            {p.tracks[0] ? (
              <Artwork src={p.tracks[0].artworkSmall || p.tracks[0].artwork} seed={p.name} alt="" className="w-10 h-10 rounded-lg" />
            ) : (
              <span className="w-10 h-10 rounded-lg bg-elev border border-line flex items-center justify-center text-dim"><Music2 size={16} /></span>
            )}
            <span className="min-w-0">
              <span className="block text-[13.5px] font-semibold text-main truncate">{p.name}</span>
              <span className="block text-[11.5px] text-dim">{p.tracks.length} song{p.tracks.length === 1 ? '' : 's'}</span>
            </span>
          </button>
        ))}
        {!playlists.length && (
          <p className="text-dim text-[12.5px] text-center py-4 flex items-center justify-center gap-2">
            <ListMusic size={14} /> No playlists yet — create your first one above.
          </p>
        )}
      </div>
    </ModalShell>
  );
}

function DeleteModal({ id, name }: { id: string; name: string }) {
  const closeModal = useUI((s) => s.closeModal);
  const deletePlaylist = useLibrary((s) => s.deletePlaylist);
  const go = useUI((s) => s.go);
  const page = useUI((s) => s.page);
  const toast = useUI((s) => s.toast);
  const submit = () => {
    deletePlaylist(id);
    closeModal();
    toast({ title: 'Playlist deleted', sub: name });
    if (page.id === 'playlist' && page.params?.id === id) go({ id: 'playlists' });
  };
  return (
    <ModalShell title="Delete playlist" sub={`“${name}” will be removed from your library. This can't be undone.`} onClose={closeModal} width={400}>
      <div className="flex justify-end gap-2.5 mt-2">
        <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
        <button className="btn btn-danger" onClick={submit}>Delete</button>
      </div>
    </ModalShell>
  );
}
