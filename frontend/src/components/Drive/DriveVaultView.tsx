import { useState } from 'react';
import { Shield, Star, Upload, FileText, Image, Film, Archive, Folder, Search, Grid, List, MoreHorizontal, Pin } from 'lucide-react';
import { AXEL_PAGE_SHELL } from '../../constants/axelSurfaces';

/* ── Tipos ── */
interface VaultFile {
  id: number;
  nome: string;
  tipo: 'pdf' | 'img' | 'video' | 'zip' | 'doc';
  tamanho: string;
  modificado: string;
  pinned?: boolean;
}

const FILE_ICONS: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  pdf: { icon: FileText, color: 'text-red-400', bg: 'bg-red-500/10' },
  img: { icon: Image, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  video: { icon: Film, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  zip: { icon: Archive, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  doc: { icon: FileText, color: 'text-ia', bg: 'bg-ia/10' },
};

const VAULT_FILES: VaultFile[] = []

export function DriveVaultView() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [dragging, setDragging] = useState(false);

  const pinnedFiles = VAULT_FILES.filter((f) => f.pinned);
  const filteredFiles = VAULT_FILES.filter((f) =>
    f.nome.toLowerCase().includes(search.toLowerCase())
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    // Mock - in real app would upload the files
  };

  return (
    <div className={`${AXEL_PAGE_SHELL} px-3 sm:px-4 lg:px-6 xl:px-8 space-y-8 pb-16`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Vault / Drive</h1>
          <p className="text-sm text-zinc-500 mt-1">Documentos seguros & acesso rápido</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Buscar arquivos…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-zinc-900/50 border border-zinc-800/60 rounded-2xl pl-11 pr-4 py-3 text-[13px] text-white placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-ia/20 focus:border-zinc-700/60 transition-all"
        />
      </div>

      {/* ── Acesso Rápido ── */}
      {!search && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Pin className="w-4 h-4 text-ia" />
            <h2 className="text-[14px] font-semibold text-white">Acesso Rápido</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {pinnedFiles.map((file) => {
              const fi = FILE_ICONS[file.tipo];
              const FIcon = fi.icon;
              return (
                <div
                  key={file.id}
                  className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-sm p-4 hover:border-zinc-700/60 hover:bg-zinc-800/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${fi.bg} flex items-center justify-center shrink-0`}>
                      <FIcon className={`w-5 h-5 ${fi.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-white truncate">{file.nome}</p>
                      <p className="text-[11px] text-zinc-500">{file.tamanho} · {file.modificado}</p>
                    </div>
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Dropzone ── */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`rounded-2xl border-2 border-dashed p-10 flex flex-col items-center justify-center transition-all ${
          dragging
            ? 'border-ia/50 bg-ia/5'
            : 'border-zinc-800/40 hover:border-zinc-700/40'
        }`}
      >
        <Upload className={`w-8 h-8 mb-3 transition-colors ${dragging ? 'text-ia' : 'text-zinc-600'}`} />
        <p className={`text-[13px] font-semibold transition-colors ${dragging ? 'text-ia' : 'text-zinc-500'}`}>
          Arraste arquivos aqui
        </p>
        <p className="text-[11px] text-zinc-600 mt-1">ou clique para selecionar</p>
      </div>

      {/* ── Todos os Arquivos ── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-zinc-400" />
          <h2 className="text-[14px] font-semibold text-white">
            {search ? `Resultados para "${search}"` : 'Todos os Arquivos'}
          </h2>
          <span className="text-[11px] text-zinc-500 ml-auto">{filteredFiles.length} itens</span>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredFiles.map((file) => {
              const fi = FILE_ICONS[file.tipo];
              const FIcon = fi.icon;
              return (
                <div
                  key={file.id}
                  className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-sm p-4 hover:border-zinc-700/60 hover:bg-zinc-800/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl ${fi.bg} flex items-center justify-center shrink-0`}>
                      <FIcon className={`w-5 h-5 ${fi.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-white truncate">{file.nome}</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">{file.tamanho} · {file.modificado}</p>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1">
                      <MoreHorizontal className="w-4 h-4 text-zinc-500" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-sm overflow-hidden divide-y divide-zinc-800/30">
            {filteredFiles.map((file) => {
              const fi = FILE_ICONS[file.tipo];
              const FIcon = fi.icon;
              return (
                <div
                  key={file.id}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-zinc-800/20 transition-colors cursor-pointer group"
                >
                  <div className={`w-8 h-8 rounded-lg ${fi.bg} flex items-center justify-center shrink-0`}>
                    <FIcon className={`w-4 h-4 ${fi.color}`} />
                  </div>
                  <p className="flex-1 text-[13px] font-medium text-white truncate">{file.nome}</p>
                  <span className="text-[11px] text-zinc-500 hidden sm:block">{file.tamanho}</span>
                  <span className="text-[11px] text-zinc-500 hidden sm:block w-16 text-right">{file.modificado}</span>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1">
                    <MoreHorizontal className="w-4 h-4 text-zinc-500" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Vault Badge */}
      <div className="flex items-center justify-center gap-2 py-4">
        <Shield className="w-4 h-4 text-ia/40" />
        <span className="text-[11px] text-zinc-600">Criptografia ponta-a-ponta · Vault seguro</span>
      </div>
    </div>
  );
}
