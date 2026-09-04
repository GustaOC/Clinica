'use client';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type SyntheticEvent,
} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  ChevronRight,
  CircleHelp,
  CloudUpload,
  FolderOpen,
  History,
  ImagePlus,
  Images,
  LoaderCircle,
  LockKeyhole,
  LogIn,
  LogOut,
  Package,
  Pause,
  Plus,
  RotateCcw,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  WandSparkles,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import {
  INTENSITIES,
  type Procedure,
  type Product,
  type SavedPhoto,
  type SavedSession,
  type WorkspaceStatus,
} from '@/lib/simulation/types';
import { ApiError, api, jsonRequest, preparePhoto } from './client';
import { Catalog } from './catalog';

type View = 'simulation' | 'history' | 'catalog' | 'settings';
type Photo = {
  id: string;
  label: string;
  original: string;
  file?: File;
  persisted: boolean;
  status: 'queued' | 'uploading' | SavedPhoto['status'];
  generated?: string;
  error?: string;
};
const ANGLES = [
  'Não definido',
  'Frontal',
  'Perfil esquerdo',
  'Perfil direito',
  '45° esquerdo',
  '45° direito',
  'Detalhe',
];
const statusLabels: Record<Photo['status'], string> = {
  queued: 'Pronta para envio',
  uploading: 'Enviando',
  uploaded: 'Na fila',
  processing: 'Gerando',
  completed: 'Concluída',
  failed: 'Revisar',
};
const imageUrl = (id: string, kind = 'original') =>
  `/api/simulations/photos/${id}/image?kind=${kind}`;
function savedPhoto(photo: SavedPhoto): Photo {
  return {
    id: photo.id,
    label: photo.label,
    status: photo.status,
    original: imageUrl(photo.id),
    generated: photo.generated_path
      ? imageUrl(photo.id, 'generated')
      : undefined,
    error: photo.error || undefined,
    persisted: true,
  };
}

export function SimulationWorkspace() {
  const [view, setView] = useState<View>('simulation');
  const [service, setService] = useState<WorkspaceStatus>({
    configured: false,
    gemini: false,
    member: null,
  });
  const [loading, setLoading] = useState(true),
    [loginOpen, setLoginOpen] = useState(false),
    [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState(''),
    [notice, setNotice] = useState('');
  const [procedures, setProcedures] = useState<Procedure[]>([]),
    [products, setProducts] = useState<Product[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]),
    [selectedId, setSelectedId] = useState('');
  const [procedureId, setProcedureId] = useState(''),
    [productId, setProductId] = useState(''),
    [regions, setRegions] = useState<string[]>([]);
  const [intensity, setIntensity] = useState('Discreta'),
    [answers, setAnswers] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(''),
    [notes, setNotes] = useState(''),
    [title, setTitle] = useState(''),
    [consent, setConsent] = useState(false);
  const [session, setSession] = useState<SavedSession | null>(null),
    [history, setHistory] = useState<SavedSession[]>([]),
    [historyBusy, setHistoryBusy] = useState(false);
  const [busy, setBusy] = useState(false),
    [pauseRequested, setPauseRequested] = useState(false),
    [drag, setDrag] = useState(false);
  const [comparison, setComparison] = useState(50),
    [preview, setPreview] = useState<'compare' | 'original'>('compare');
  const picker = useRef<HTMLInputElement>(null),
    urls = useRef(new Set<string>()),
    pause = useRef(false),
    running = useRef(false);
  const selected = photos.find((p) => p.id === selectedId) || photos[0];
  const procedure =
    session?.plan.procedure || procedures.find((p) => p.id === procedureId);
  const product =
    session?.plan.product || products.find((p) => p.id === productId);
  const availableProducts = products.filter(
    (p) => p.procedure_id === procedureId,
  );
  const complete = photos.filter((p) => p.status === 'completed').length;
  const canPlan = Boolean(
    procedure &&
    regions.length &&
    (!procedure.requires_product || productId) &&
    procedure.questions.every((q) => answers[q.id]),
  );
  const frozen = Boolean(session) || busy;

  const loadCatalog = useCallback(async () => {
    const result = await api<{ procedures: Procedure[]; products: Product[] }>(
      '/api/workspace/catalog',
    );
    setProcedures(result.procedures);
    setProducts(result.products);
  }, []);
  useEffect(() => {
    let live = true;
    api<WorkspaceStatus>('/api/workspace/session')
      .then(async (status) => {
        if (!live) return;
        setService(status);
        if (status.member) await loadCatalog();
        if (status.message) setNotice(status.message);
      })
      .catch((e) => {
        if (live) setNotice(e.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [loadCatalog]);
  useEffect(() => {
    const current = urls.current;
    return () => {
      pause.current = true;
      current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);
  useEffect(() => {
    if (!busy) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [busy]);

  async function login(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginBusy(true);
    setLoginError('');
    const form = new FormData(event.currentTarget);
    try {
      const status = await api<WorkspaceStatus>(
        '/api/workspace/session',
        jsonRequest({
          email: form.get('email'),
          password: form.get('password'),
        }),
      );
      setService(status);
      setLoginOpen(false);
      await loadCatalog();
      setNotice('');
    } catch (e) {
      setLoginError(
        e instanceof Error ? e.message : 'Não foi possível entrar.',
      );
    } finally {
      setLoginBusy(false);
    }
  }
  function clearLocal() {
    urls.current.forEach((url) => URL.revokeObjectURL(url));
    urls.current.clear();
    setPhotos([]);
    setSelectedId('');
    setSession(null);
    setProcedureId('');
    setProductId('');
    setRegions([]);
    setAnswers({});
    setIntensity('Discreta');
    setQuantity('');
    setNotes('');
    setTitle('');
    setConsent(false);
    setNotice('');
    setComparison(50);
  }
  async function logout() {
    try {
      await api('/api/workspace/session', { method: 'DELETE' });
      clearLocal();
      setService((s) => ({ ...s, member: null }));
      setProducts([]);
      setProcedures([]);
      setHistory([]);
    } catch (e) {
      setNotice((e as Error).message);
    }
  }
  function addFiles(files: FileList | File[]) {
    const accepted: Photo[] = [],
      errors: string[] = [];
    for (const file of Array.from(files)) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        errors.push(`${file.name}: use JPG, PNG ou WebP.`);
        continue;
      }
      if (file.size > 20 * 1024 * 1024) {
        errors.push(`${file.name}: o limite por arquivo é 20 MB.`);
        continue;
      }
      const original = URL.createObjectURL(file);
      urls.current.add(original);
      accepted.push({
        id: crypto.randomUUID(),
        label: `Foto ${photos.length + accepted.length + 1}`,
        file,
        original,
        persisted: false,
        status: 'queued',
      });
    }
    setPhotos((prev) => [...prev, ...accepted]);
    if (!selectedId && accepted[0]) setSelectedId(accepted[0].id);
    setNotice(errors.slice(0, 3).join(' '));
    setDrag(false);
  }
  function removePhoto(photo: Photo) {
    if (photo.persisted || busy) return;
    URL.revokeObjectURL(photo.original);
    urls.current.delete(photo.original);
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    if (selectedId === photo.id) setSelectedId('');
  }
  const updatePhoto = (id: string, changes: Partial<Photo>) =>
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...changes } : p)),
    );
  async function loadHistory() {
    setView('history');
    setHistoryBusy(true);
    setNotice('');
    try {
      const data = await api<{ sessions: SavedSession[] }>('/api/simulations');
      setHistory(data.sessions);
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setHistoryBusy(false);
    }
  }
  function openSession(item: SavedSession) {
    clearLocal();
    setSession(item);
    setTitle(item.title);
    setProcedureId(item.plan.procedure.id);
    setProductId(item.plan.product?.id || '');
    setRegions(item.plan.regions);
    setIntensity(item.plan.intensity);
    setAnswers(item.plan.answers);
    setQuantity(item.plan.quantity);
    setNotes(item.plan.notes);
    setConsent(true);
    setPhotos((item.aesthetic_photos || []).map(savedPhoto));
    setView('simulation');
  }
  async function generate(onlyId?: string) {
    if (running.current) return;
    if (!service.member) {
      setLoginOpen(true);
      return;
    }
    if (!service.gemini || !canPlan || !consent) {
      setNotice(
        'Complete o planejamento e confirme a autorização antes de gerar.',
      );
      return;
    }
    const queue = photos.filter(
      (p) => p.status !== 'completed' && (!onlyId || p.id === onlyId),
    );
    if (!queue.length) return;
    running.current = true;
    pause.current = false;
    setPauseRequested(false);
    setBusy(true);
    setNotice('');
    let current = session;
    try {
      if (!current) {
        const data = await api<{ session: SavedSession }>(
          '/api/simulations',
          jsonRequest({
            title,
            procedure_id: procedureId,
            product_id: productId || null,
            regions,
            intensity,
            answers,
            quantity,
            notes,
            consent,
          }),
        );
        current = data.session;
        setSession(current);
      }
      for (const photo of queue) {
        if (pause.current) break;
        try {
          if (!photo.persisted) {
            if (!photo.file)
              throw new Error('Selecione novamente a foto original.');
            updatePhoto(photo.id, { status: 'uploading', error: undefined });
            const prepared = await preparePhoto(photo.file),
              form = new FormData();
            form.set('sessionId', current.id);
            form.set('photoId', photo.id);
            form.set('label', photo.label);
            form.set('file', prepared, 'photo.jpg');
            const uploaded = await api<{ photo: SavedPhoto }>(
              '/api/simulations/photos',
              {
                method: 'POST',
                body: form,
              },
            );
            if (uploaded.photo.status === 'completed') {
              updatePhoto(photo.id, {
                persisted: true,
                status: 'completed',
                generated: imageUrl(photo.id, 'generated'),
                error: undefined,
              });
              continue;
            }
            updatePhoto(photo.id, {
              persisted: true,
              status: uploaded.photo.status,
            });
          } else {
            const latest = await api<{ photo: SavedPhoto }>(
              `/api/simulations/photos/${photo.id}`,
            );
            if (latest.photo.status === 'completed') {
              updatePhoto(photo.id, {
                status: 'completed',
                generated: imageUrl(photo.id, 'generated'),
                error: undefined,
              });
              continue;
            }
          }
          if (pause.current) break;
          updatePhoto(photo.id, { status: 'processing', error: undefined });
          const result = await api<{ photo: SavedPhoto }>(
            `/api/simulations/photos/${photo.id}/generate`,
            { method: 'POST' },
          );
          updatePhoto(photo.id, {
            status: result.photo.status,
            generated: imageUrl(photo.id, 'generated'),
            persisted: true,
            error: undefined,
          });
        } catch (e) {
          updatePhoto(photo.id, {
            status:
              e instanceof ApiError && e.status === 409
                ? 'processing'
                : 'failed',
            error:
              e instanceof Error
                ? e.message
                : 'Não foi possível gerar esta foto.',
          });
        }
      }
      if (pause.current)
        setNotice(
          'Fila pausada. As fotos já enviadas estão no histórico; as demais continuam somente neste navegador.',
        );
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      running.current = false;
      setBusy(false);
      setPauseRequested(false);
    }
  }
  function navigate(next: View) {
    if (next === 'history' && service.member) void loadHistory();
    else {
      setView(next);
      setNotice('');
    }
  }

  return (
    <div className="sim-app">
      <aside className="app-sidebar">
        <Link
          className="app-brand"
          href="/"
          aria-label="Lumina — sistema clínico"
        >
          <span>
            <Sparkles size={25} />
          </span>
          <div>
            lumina<small>CLINICAL WORKSPACE</small>
          </div>
        </Link>
        <p className="sidebar-label">ÁREA DE TRABALHO</p>
        <nav aria-label="Navegação do sistema">
          {(
            [
              { id: 'simulation', label: 'Simulações', icon: WandSparkles },
              { id: 'history', label: 'Histórico', icon: History },
              { id: 'catalog', label: 'Catálogo', icon: Package },
              { id: 'settings', label: 'Configuração', icon: Settings2 },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => navigate(id)}
              className={view === id ? 'active' : ''}
              aria-current={view === id ? 'page' : undefined}
            >
              <Icon size={19} />
              {label}
              {id === 'simulation' && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <LockKeyhole size={19} />
          <strong>Espaço da profissional</strong>
          <p>Fotografias e planejamentos acessíveis pela sua conta.</p>
        </div>
        <div className="sidebar-profile">
          <span className="profile-avatar">
            {service.member ? (
              service.member.email?.[0]?.toUpperCase()
            ) : (
              <LogIn size={18} />
            )}
          </span>
          <div>
            <strong>
              {service.member ? 'Minha conta' : 'Acesso profissional'}
            </strong>
            <small>
              {service.member?.email || 'Entre para salvar e simular'}
            </small>
          </div>
          <button
            className="icon-button"
            aria-label={service.member ? 'Sair da conta' : 'Entrar no sistema'}
            disabled={busy}
            onClick={() =>
              service.member ? void logout() : setLoginOpen(true)
            }
          >
            {service.member ? <LogOut size={17} /> : <ChevronRight size={18} />}
          </button>
        </div>
      </aside>
      <div className="app-body">
        <header className="workspace-topbar">
          <div>
            <span>Sistema clínico</span>
            <ChevronRight size={14} />
            <strong>
              {
                {
                  simulation: 'Simulações',
                  history: 'Histórico',
                  catalog: 'Catálogo',
                  settings: 'Configuração',
                }[view]
              }
            </strong>
          </div>
          <div className="topbar-right">
            <span
              className={`connection-badge ${service.member ? 'connected' : ''}`}
            >
              <i />
              {loading
                ? 'Conectando…'
                : service.member
                  ? 'Sessão conectada'
                  : 'Acesso restrito'}
            </span>
            <button
              className="icon-button"
              aria-label="Ajuda e configuração"
              onClick={() => setView('settings')}
            >
              <CircleHelp size={20} />
            </button>
            <button
              className="topbar-account"
              disabled={busy}
              onClick={() =>
                service.member ? void logout() : setLoginOpen(true)
              }
            >
              {service.member ? <LogOut size={17} /> : <LogIn size={17} />}
              {service.member ? 'Sair' : 'Entrar'}
            </button>
          </div>
        </header>
        <main id="conteudo" className="workspace-main">
          {notice && (
            <output className="workspace-notice">
              <CircleHelp size={18} />
              <p>{notice}</p>
              <button
                aria-label="Fechar aviso"
                className="icon-button"
                onClick={() => setNotice('')}
              >
                <X size={16} />
              </button>
            </output>
          )}
          {view === 'simulation' && (
            <>
              <div className="workspace-heading">
                <div>
                  <p className="app-eyebrow">ESTÚDIO DE SIMULAÇÃO</p>
                  <h1>Simulação de procedimentos</h1>
                  <p>
                    Um planejamento. Diferentes ângulos. Uma nova forma de
                    visualizar possibilidades.
                  </p>
                </div>
                <Button
                  className="app-button secondary"
                  variant="outline"
                  disabled={busy}
                  onClick={clearLocal}
                >
                  <Plus size={17} />
                  Nova simulação
                </Button>
              </div>
              <div className="workflow-steps" aria-label="Etapas da simulação">
                {['Fotografias', 'Planejamento', 'Simulação', 'Revisão'].map(
                  (label, i) => {
                    const step = complete
                      ? 3
                      : busy
                        ? 2
                        : photos.length
                          ? 1
                          : 0;
                    return (
                      <div
                        key={label}
                        className={
                          i === step ? 'current' : i < step ? 'done' : ''
                        }
                      >
                        <span>{i < step ? <Check size={15} /> : i + 1}</span>
                        <strong>{label}</strong>
                        {i < 3 && <div />}
                      </div>
                    );
                  },
                )}
              </div>
              <div className="simulation-layout">
                <div className="photo-column">
                  <section className="workspace-card photo-workspace">
                    <div className="card-heading">
                      <div>
                        <Images size={19} />
                        <h2>Fotografias da sessão</h2>
                        <span className="count-badge">{photos.length}</span>
                      </div>
                      <button
                        className="text-button"
                        disabled={busy}
                        onClick={() => picker.current?.click()}
                      >
                        <Plus size={16} />
                        Adicionar
                      </button>
                    </div>
                    <input
                      ref={picker}
                      className="sr-only"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      aria-label="Selecionar fotografias"
                      onChange={(event) => {
                        if (event.target.files) addFiles(event.target.files);
                        event.target.value = '';
                      }}
                    />
                    {!photos.length ? (
                      <div
                        className={`upload-area ${drag ? 'dragging' : ''}`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDrag(true);
                        }}
                        onDragLeave={() => setDrag(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          addFiles(e.dataTransfer.files);
                        }}
                      >
                        <span className="upload-symbol">
                          <ImagePlus size={36} strokeWidth={1.3} />
                          <i>
                            <Plus size={15} />
                          </i>
                        </span>
                        <h3>Comece com as fotografias</h3>
                        <p>
                          Arraste suas imagens para cá ou selecione os arquivos.
                          <br />
                          Adicione quantas fotos precisar, de diferentes
                          ângulos.
                        </p>
                        <Button
                          className="app-button"
                          onClick={() => picker.current?.click()}
                        >
                          <CloudUpload size={18} />
                          Selecionar fotografias
                        </Button>
                        <small>JPG, PNG ou WebP · até 20 MB por arquivo</small>
                      </div>
                    ) : (
                      <>
                        <div className="preview-toolbar">
                          <span>{selected?.label}</span>
                          <div className="preview-toggle">
                            <button
                              aria-pressed={preview === 'original'}
                              onClick={() => setPreview('original')}
                            >
                              Original
                            </button>
                            <button
                              disabled={!selected?.generated}
                              aria-pressed={preview === 'compare'}
                              onClick={() => setPreview('compare')}
                            >
                              Comparar
                            </button>
                          </div>
                        </div>
                        <div className="image-stage">
                          {selected && (
                            <>
                              <Image
                                unoptimized
                                src={selected.original}
                                alt={`Original — ${selected.label}`}
                                width={1200}
                                height={1200}
                                className="stage-photo"
                              />
                              {selected.generated && preview === 'compare' && (
                                <>
                                  <div
                                    className="generated-overlay"
                                    style={{
                                      clipPath: `inset(0 0 0 ${comparison}%)`,
                                    }}
                                  >
                                    <Image
                                      unoptimized
                                      src={selected.generated}
                                      alt={`Simulação IA — ${selected.label}`}
                                      width={1200}
                                      height={1200}
                                      className="stage-photo"
                                    />
                                  </div>
                                  <div
                                    className="compare-line"
                                    style={{ left: `${comparison}%` }}
                                  >
                                    <span>↔</span>
                                  </div>
                                  <span className="image-tag right">
                                    SIMULAÇÃO IA
                                  </span>
                                </>
                              )}
                              <span className="image-tag">ORIGINAL</span>
                              {['uploading', 'processing'].includes(
                                selected.status,
                              ) && (
                                <div className="generation-overlay">
                                  <LoaderCircle size={27} className="spin" />
                                  <strong>
                                    {selected.status === 'uploading'
                                      ? 'Preparando sua foto…'
                                      : 'Criando a simulação…'}
                                  </strong>
                                  <p>O resultado será salvo no histórico.</p>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        {selected?.generated && preview === 'compare' && (
                          <label className="comparison-range">
                            <span>Original</span>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={comparison}
                              onChange={(e) =>
                                setComparison(Number(e.target.value))
                              }
                              aria-label="Comparar original e simulação"
                            />
                            <span>Simulação</span>
                          </label>
                        )}
                        {selected?.error && (
                          <div className="photo-error" role="alert">
                            <p>{selected.error}</p>
                            <button
                              className="text-button"
                              disabled={busy}
                              onClick={() => void generate(selected.id)}
                            >
                              <RotateCcw size={15} />
                              Tentar esta foto novamente
                            </button>
                          </div>
                        )}
                        <div className="photo-grid">
                          {photos.map((photo, i) => (
                            <article
                              className={`photo-tile ${photo.id === selected?.id ? 'selected' : ''}`}
                              key={photo.id}
                            >
                              <button
                                className="thumbnail-button"
                                onClick={() => {
                                  setSelectedId(photo.id);
                                  setComparison(50);
                                }}
                                aria-label={`Visualizar ${photo.label}`}
                              >
                                <Image
                                  unoptimized
                                  src={photo.original}
                                  alt={photo.label}
                                  width={160}
                                  height={120}
                                />
                                <span>{String(i + 1).padStart(2, '0')}</span>
                              </button>
                              <div className="photo-tile-info">
                                <strong>{photo.label}</strong>
                                <small
                                  className={`photo-status ${photo.status}`}
                                >
                                  {['uploading', 'processing'].includes(
                                    photo.status,
                                  ) && (
                                    <LoaderCircle size={11} className="spin" />
                                  )}
                                  {statusLabels[photo.status]}
                                </small>
                              </div>
                              {!photo.persisted && (
                                <button
                                  className="remove-photo"
                                  aria-label={`Remover ${photo.label}`}
                                  disabled={busy}
                                  onClick={() => removePhoto(photo)}
                                >
                                  <X size={13} />
                                </button>
                              )}
                            </article>
                          ))}
                        </div>
                        {selected && !selected.persisted && (
                          <label className="angle-select">
                            Ângulo da foto selecionada
                            <select
                              disabled={busy}
                              value={
                                ANGLES.includes(selected.label)
                                  ? selected.label
                                  : 'Não definido'
                              }
                              onChange={(e) =>
                                updatePhoto(selected.id, {
                                  label:
                                    e.target.value === 'Não definido'
                                      ? `Foto ${photos.findIndex((p) => p.id === selected.id) + 1}`
                                      : e.target.value,
                                })
                              }
                            >
                              {ANGLES.map((a) => (
                                <option key={a}>{a}</option>
                              ))}
                            </select>
                          </label>
                        )}
                        {selected?.generated && (
                          <a
                            className="download-result"
                            href={`${imageUrl(selected.id, 'generated')}&download=1`}
                            download
                          >
                            <ArrowDownToLine size={16} />
                            Baixar simulação identificada
                          </a>
                        )}
                      </>
                    )}
                    <div className="photo-bottom-note">
                      <LockKeyhole size={14} />
                      <span>
                        {session
                          ? 'As fotos enviadas ficam no histórico privado da sua conta.'
                          : 'As fotos ficam neste navegador até você iniciar a simulação.'}
                      </span>
                    </div>
                  </section>
                  <div className="capture-tips">
                    <div>
                      <span>01</span>
                      <strong>Use a mesma luz</strong>
                      <p>Boa iluminação e sem filtros.</p>
                    </div>
                    <div>
                      <span>02</span>
                      <strong>Varie os ângulos</strong>
                      <p>Frente, perfis e detalhes.</p>
                    </div>
                    <div>
                      <span>03</span>
                      <strong>Revise cada resultado</strong>
                      <p>A simulação é uma aproximação visual.</p>
                    </div>
                  </div>
                  {photos.length > 0 && (
                    <div className="queue-summary">
                      <div>
                        <span className="queue-icon">
                          <Sparkles size={19} />
                        </span>
                        <div>
                          <strong>
                            {complete} de {photos.length} imagens concluídas
                          </strong>
                          <p>
                            {busy
                              ? 'Processando uma fotografia por vez.'
                              : complete
                                ? 'Resultados disponíveis para sua revisão.'
                                : 'Cada foto receberá o mesmo planejamento.'}
                          </p>
                        </div>
                      </div>
                      <progress
                        max={photos.length}
                        value={complete}
                        aria-label="Fotos concluídas"
                      />
                    </div>
                  )}
                </div>
                <aside className="workspace-card planning-card">
                  <div className="card-heading">
                    <div>
                      <SlidersHorizontal size={19} />
                      <h2>Seu planejamento</h2>
                    </div>
                    <span className="tiny-badge">GUIADO</span>
                  </div>
                  {!photos.length ? (
                    <div className="planning-intro">
                      <span className="planning-spark">
                        <WandSparkles size={25} strokeWidth={1.5} />
                      </span>
                      <h3>
                        Vamos construir
                        <br />a simulação juntas.
                      </h3>
                      <p>
                        Depois de adicionar as fotos, escolha as opções para
                        orientar cada resultado.
                      </p>
                      <ol>
                        {[
                          'Qual procedimento?',
                          'Qual produto?',
                          'Quais características?',
                        ].map((q, i) => (
                          <li key={q}>
                            <span>{i + 1}</span>
                            {q}
                          </li>
                        ))}
                      </ol>
                      <div className="planning-note">
                        Os produtos e procedimentos vêm do catálogo da clínica.
                      </div>
                    </div>
                  ) : (
                    <div className="planning-form app-form">
                      <label>
                        Identificação da sessão
                        <input
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          disabled={frozen}
                          maxLength={100}
                          placeholder="Código ou referência (opcional)"
                        />
                      </label>
                      <fieldset disabled={frozen}>
                        <legend>
                          <b>1</b>Qual procedimento?
                        </legend>
                        {procedures.length || procedure ? (
                          <div className="choice-pills">
                            {(session
                              ? [session.plan.procedure]
                              : procedures
                            ).map((p) => (
                              <label key={p.id} className="choice-pill">
                                <input
                                  type="radio"
                                  name="procedure"
                                  value={p.id}
                                  checked={procedureId === p.id}
                                  onChange={() => {
                                    setProcedureId(p.id);
                                    setProductId('');
                                    setRegions([]);
                                    setAnswers({});
                                  }}
                                />
                                <span>{p.name}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <div className="inline-empty">
                            <p>
                              {service.member
                                ? 'Nenhum procedimento cadastrado.'
                                : 'Entre para acessar o catálogo da clínica.'}
                            </p>
                            <button
                              className="text-button"
                              onClick={() =>
                                service.member
                                  ? setView('catalog')
                                  : setLoginOpen(true)
                              }
                            >
                              {service.member
                                ? 'Cadastrar procedimento'
                                : 'Entrar na conta'}
                              <ArrowRight size={14} />
                            </button>
                          </div>
                        )}
                      </fieldset>
                      {procedure && (
                        <>
                          <fieldset disabled={frozen}>
                            <legend>
                              <b>2</b>Qual produto será utilizado?
                            </legend>
                            <div className="choice-pills">
                              {(session && product
                                ? [product]
                                : availableProducts
                              ).map((p) => (
                                <label
                                  key={p.id}
                                  className="choice-pill product-choice"
                                >
                                  <input
                                    type="radio"
                                    name="product"
                                    checked={productId === p.id}
                                    onChange={() => setProductId(p.id)}
                                  />
                                  <span>
                                    <strong>{p.name}</strong>
                                    {p.brand && <small>{p.brand}</small>}
                                  </span>
                                </label>
                              ))}
                              {!procedure.requires_product && (
                                <label className="choice-pill">
                                  <input
                                    type="radio"
                                    name="product"
                                    checked={!productId}
                                    onChange={() => setProductId('')}
                                  />
                                  <span>Sem produto</span>
                                </label>
                              )}
                            </div>
                            {!availableProducts.length &&
                              !product &&
                              procedure.requires_product && (
                                <p className="app-hint">
                                  Cadastre um produto vinculado a este
                                  procedimento no catálogo.
                                </p>
                              )}
                          </fieldset>
                          <fieldset disabled={frozen}>
                            <legend>
                              <b>3</b>Onde vamos simular?
                            </legend>
                            <div className="choice-pills">
                              {procedure.regions.map((r) => (
                                <label className="choice-pill" key={r}>
                                  <input
                                    type="checkbox"
                                    checked={regions.includes(r)}
                                    onChange={() =>
                                      setRegions((prev) =>
                                        prev.includes(r)
                                          ? prev.filter((x) => x !== r)
                                          : [...prev, r],
                                      )
                                    }
                                  />
                                  <span>{r}</span>
                                </label>
                              ))}
                            </div>
                          </fieldset>
                          <fieldset disabled={frozen}>
                            <legend>
                              <b>4</b>Qual a intensidade visual?
                            </legend>
                            <div className="choice-pills">
                              {INTENSITIES.map((value) => (
                                <label key={value} className="choice-pill">
                                  <input
                                    type="radio"
                                    name="intensity"
                                    checked={intensity === value}
                                    onChange={() => setIntensity(value)}
                                  />
                                  <span>{value}</span>
                                </label>
                              ))}
                            </div>
                            <p className="app-hint">
                              Orienta a imagem; não representa dose ou resultado
                              clínico previsto.
                            </p>
                          </fieldset>
                          {procedure.questions.map((q, i) => (
                            <fieldset key={q.id} disabled={frozen}>
                              <legend>
                                <b>{i + 5}</b>
                                {q.label}
                              </legend>
                              <div className="choice-pills">
                                {q.options.map((o) => (
                                  <label className="choice-pill" key={o}>
                                    <input
                                      type="radio"
                                      name={q.id}
                                      checked={answers[q.id] === o}
                                      onChange={() =>
                                        setAnswers((prev) => ({
                                          ...prev,
                                          [q.id]: o,
                                        }))
                                      }
                                    />
                                    <span>{o}</span>
                                  </label>
                                ))}
                              </div>
                            </fieldset>
                          ))}
                          {product && (
                            <label>
                              Quantidade planejada{' '}
                              {product.unit && `(${product.unit})`}
                              <input
                                disabled={frozen}
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                maxLength={80}
                                placeholder="Opcional, definida pela profissional"
                              />
                            </label>
                          )}
                          <label>
                            Observações da profissional
                            <textarea
                              disabled={frozen}
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              rows={3}
                              maxLength={1500}
                              placeholder="Descreva o objetivo e o que deve ser preservado."
                            />
                          </label>
                        </>
                      )}
                      {session && (
                        <p className="app-hint">
                          Planejamento salvo. Para mudar as escolhas, inicie uma
                          nova simulação.
                        </p>
                      )}
                      <label className="check-line consent-line">
                        <input
                          type="checkbox"
                          checked={consent}
                          disabled={frozen}
                          onChange={(e) => setConsent(e.target.checked)}
                        />
                        <span>
                          Tenho autorização para enviar estas fotos ao serviço
                          de IA para simulação.
                        </span>
                      </label>
                      {!service.gemini && (
                        <p className="app-hint">
                          A geração será habilitada após a conexão do serviço de
                          imagens.
                        </p>
                      )}
                      {busy ? (
                        <Button
                          className="app-button secondary full"
                          disabled={pauseRequested}
                          onClick={() => {
                            pause.current = true;
                            setPauseRequested(true);
                          }}
                        >
                          <Pause size={16} />
                          {pauseRequested
                            ? 'Pausando após a foto atual…'
                            : 'Pausar após a foto atual'}
                        </Button>
                      ) : (
                        <Button
                          className="app-button full generate-button"
                          disabled={
                            !service.member ||
                            !service.gemini ||
                            !canPlan ||
                            !consent ||
                            complete === photos.length
                          }
                          onClick={() => void generate()}
                        >
                          <WandSparkles size={18} />
                          {session
                            ? 'Continuar simulações'
                            : 'Gerar simulações'}
                          <span>{photos.length - complete}</span>
                        </Button>
                      )}
                      <p className="generation-caption">
                        Simulação ilustrativa por IA.
                        <br />
                        Revise antes de apresentar à paciente.
                      </p>
                    </div>
                  )}
                </aside>
              </div>
            </>
          )}
          {view === 'catalog' && (
            <Catalog
              procedures={procedures}
              products={products}
              admin={service.member?.role === 'admin'}
              onSaved={loadCatalog}
            />
          )}
          {view === 'history' && (
            <section>
              <div className="workspace-heading">
                <div>
                  <p className="app-eyebrow">SEUS PLANEJAMENTOS</p>
                  <h1>Histórico de simulações</h1>
                  <p>
                    Reabra uma sessão para revisar resultados ou continuar as
                    fotos pendentes.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="app-button secondary"
                  disabled={!service.member || historyBusy}
                  onClick={() => void loadHistory()}
                >
                  <RotateCcw size={16} className={historyBusy ? 'spin' : ''} />
                  Atualizar
                </Button>
              </div>
              {historyBusy ? (
                <div className="empty-state">
                  <LoaderCircle className="spin" />
                </div>
              ) : !history.length ? (
                <div className="empty-state">
                  <History size={35} strokeWidth={1.3} />
                  <h2>
                    {service.member
                      ? 'Nenhuma simulação salva ainda'
                      : 'Entre para acessar o histórico'}
                  </h2>
                  <p>
                    As sessões pertencem à conta da profissional que as criou.
                  </p>
                </div>
              ) : (
                <div className="history-list">
                  {history.map((s) => (
                    <button
                      className="history-item"
                      key={s.id}
                      disabled={busy}
                      onClick={() => openSession(s)}
                    >
                      <span className="catalog-icon">
                        <FolderOpen size={22} />
                      </span>
                      <div>
                        <strong>{s.title}</strong>
                        <p>
                          {s.plan.procedure.name} ·{' '}
                          {s.plan.product?.name || 'Sem produto'}
                        </p>
                      </div>
                      <span className="history-count">
                        {s.aesthetic_photos?.filter(
                          (p) => p.status === 'completed',
                        ).length || 0}
                        /{s.aesthetic_photos?.length || 0} imagens
                      </span>
                      <span className="history-date">
                        {new Date(s.created_at).toLocaleDateString('pt-BR')}
                      </span>
                      <ChevronRight size={18} />
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}
          {view === 'settings' && (
            <SettingsView
              service={service}
              onLogin={() => setLoginOpen(true)}
            />
          )}
        </main>
        <footer className="workspace-footer">
          <span>Lumina · Sistema clínico</span>
          <span>Planejamento visual, com revisão profissional.</span>
        </footer>
      </div>
      <Dialog
        open={loginOpen}
        onOpenChange={(v) => !loginBusy && setLoginOpen(v)}
      >
        <DialogContent
          className="system-dialog login-dialog"
          showCloseButton={false}
        >
          <div className="dialog-top">
            <span className="catalog-icon">
              <LockKeyhole size={23} />
            </span>
            <DialogClose
              render={
                <Button
                  variant="ghost"
                  className="icon-button"
                  aria-label="Fechar acesso"
                  disabled={loginBusy}
                />
              }
            >
              <X size={19} />
            </DialogClose>
          </div>
          <DialogTitle>Acesso da profissional</DialogTitle>
          <DialogDescription>
            Use a conta habilitada pela administração da clínica.
          </DialogDescription>
          {!service.configured ? (
            <div className="inline-empty">
              <p>O acesso ainda não foi configurado.</p>
              <Button
                className="app-button secondary"
                onClick={() => {
                  setLoginOpen(false);
                  setView('settings');
                }}
              >
                Ver configuração
              </Button>
            </div>
          ) : (
            <form className="app-form" onSubmit={login}>
              <label>
                E-mail
                <input
                  type="email"
                  name="email"
                  autoComplete="username"
                  required
                  maxLength={254}
                />
              </label>
              <label>
                Senha
                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  required
                  maxLength={256}
                />
              </label>
              {loginError && (
                <p className="app-error" role="alert">
                  {loginError}
                </p>
              )}
              <Button
                type="submit"
                className="app-button full"
                disabled={loginBusy}
              >
                {loginBusy ? (
                  <LoaderCircle size={17} className="spin" />
                ) : (
                  <LogIn size={17} />
                )}
                Entrar no sistema
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SettingsView({
  service,
  onLogin,
}: {
  service: WorkspaceStatus;
  onLogin: () => void;
}) {
  return (
    <section>
      <div className="workspace-heading">
        <div>
          <p className="app-eyebrow">PREPARAÇÃO DO SISTEMA</p>
          <h1>Conexões e acesso</h1>
          <p>
            Configure os serviços para habilitar o catálogo, o histórico e a
            geração de imagens.
          </p>
        </div>
      </div>
      <div className="setup-grid">
        <article className="workspace-card setup-card">
          <span className="catalog-icon">
            <Package size={24} />
          </span>
          <span className={`setup-status ${service.configured ? 'ok' : ''}`}>
            {service.configured ? 'Variáveis configuradas' : 'A configurar'}
          </span>
          <h2>Supabase</h2>
          <p>
            Contas das profissionais, catálogo e armazenamento privado das fotos
            e simulações.
          </p>
          <ol>
            <li>Crie o projeto Supabase.</li>
            <li>Execute a migração de simulações incluída no projeto.</li>
            <li>
              Crie a conta da profissional e habilite-a em{' '}
              <code>aesthetic_members</code>.
            </li>
            <li>
              Na Vercel, configure <code>SUPABASE_URL</code> e{' '}
              <code>SUPABASE_PUBLISHABLE_KEY</code>.
            </li>
          </ol>
          <Button
            className="app-button secondary"
            disabled={!service.configured || Boolean(service.member)}
            onClick={onLogin}
          >
            <LogIn size={16} />
            {service.member ? 'Conta conectada' : 'Testar acesso'}
          </Button>
        </article>
        <article className="workspace-card setup-card">
          <span className="catalog-icon">
            <Sparkles size={24} />
          </span>
          <span className={`setup-status ${service.gemini ? 'ok' : ''}`}>
            {service.gemini ? 'Chave configurada' : 'A configurar'}
          </span>
          <h2>Gemini</h2>
          <p>
            Edita cada fotografia a partir do planejamento selecionado pela
            médica.
          </p>
          <ol>
            <li>Crie uma chave de API na sua conta Google AI Studio.</li>
            <li>Habilite o acesso ao modelo de geração de imagens.</li>
            <li>
              Na Vercel, configure <code>GEMINI_API_KEY</code>. O modelo fica em{' '}
              <code>GEMINI_IMAGE_MODEL</code>.
            </li>
            <li>Refaça o deploy após salvar as variáveis.</li>
          </ol>
          <p className="app-hint">
            A chave é usada somente pelo servidor. A geração utiliza a cota da
            sua conta.
          </p>
        </article>
      </div>
      <div className="setup-bottom">
        <CircleHelp size={20} />
        <p>
          Depois de conectar os serviços, entre como administradora e cadastre
          os procedimentos e produtos em <strong>Catálogo</strong>. As
          fotografias enviadas só são acessíveis pela conta responsável.
        </p>
      </div>
    </section>
  );
}
