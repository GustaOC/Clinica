'use client';
import { useState, type SyntheticEvent } from 'react';
import {
  Plus,
  Package,
  SlidersHorizontal,
  X,
  LoaderCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { REGIONS, type Procedure, type Product } from '@/lib/simulation/types';
import { api, jsonRequest } from './client';

export function Catalog({
  procedures,
  products,
  admin,
  onSaved,
}: {
  procedures: Procedure[];
  products: Product[];
  admin: boolean;
  onSaved: () => Promise<void>;
}) {
  const [tab, setTab] = useState<'procedure' | 'product'>('procedure');
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const [regions, setRegions] = useState<string[]>([]),
    [questions, setQuestions] = useState<{ label: string; options: string }[]>(
      [],
    );
  async function save(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      await api(
        '/api/workspace/catalog',
        jsonRequest({
          kind: tab,
          name: form.get('name'),
          description: form.get('description') || '',
          procedure_id: form.get('procedure_id'),
          brand: form.get('brand') || '',
          unit: form.get('unit') || '',
          requires_product: form.get('requires_product') === 'on',
          regions,
          questions: questions.map((q) => ({
            label: q.label,
            options: q.options
              .split(';')
              .map((s) => s.trim())
              .filter(Boolean),
          })),
        }),
      );
      await onSaved();
      setOpen(false);
      setRegions([]);
      setQuestions([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao cadastrar.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="workspace-section">
      <div className="workspace-heading">
        <div>
          <p className="app-eyebrow">CATÁLOGO CLÍNICO</p>
          <h1>Procedimentos e produtos</h1>
          <p>
            As opções cadastradas aqui aparecem no planejamento das simulações.
          </p>
        </div>
        <Button
          className="app-button"
          disabled={!admin}
          onClick={() => {
            setError('');
            setOpen(true);
          }}
        >
          <Plus size={17} />
          Cadastrar {tab === 'procedure' ? 'procedimento' : 'produto'}
        </Button>
      </div>
      <div className="app-tabs" role="tablist" aria-label="Tipo de catálogo">
        <button
          role="tab"
          aria-selected={tab === 'procedure'}
          onClick={() => setTab('procedure')}
        >
          Procedimentos <span>{procedures.length}</span>
        </button>
        <button
          role="tab"
          aria-selected={tab === 'product'}
          onClick={() => setTab('product')}
        >
          Produtos <span>{products.length}</span>
        </button>
      </div>
      {!admin && (
        <p className="app-hint">
          O cadastro é feito por uma conta administradora.
        </p>
      )}
      <div className="catalog-grid">
        {tab === 'procedure'
          ? procedures.map((p) => (
              <article className="catalog-card" key={p.id}>
                <span className="catalog-icon">
                  <SlidersHorizontal size={21} />
                </span>
                <h2>{p.name}</h2>
                <p>{p.description || 'Sem descrição adicional.'}</p>
                <div className="tag-list">
                  {p.regions.map((r) => (
                    <span key={r}>{r}</span>
                  ))}
                </div>
                <small>
                  {p.questions.length} perguntas adicionais ·{' '}
                  {p.requires_product
                    ? 'Produto obrigatório'
                    : 'Produto opcional'}
                </small>
              </article>
            ))
          : products.map((p) => (
              <article className="catalog-card" key={p.id}>
                <span className="catalog-icon">
                  <Package size={21} />
                </span>
                <h2>{p.name}</h2>
                <p>{p.brand || 'Marca não informada'}</p>
                <div className="tag-list">
                  <span>
                    {procedures.find((d) => d.id === p.procedure_id)?.name ||
                      'Procedimento cadastrado'}
                  </span>
                  {p.unit && <span>{p.unit}</span>}
                </div>
              </article>
            ))}
      </div>
      {!(tab === 'procedure' ? procedures.length : products.length) && (
        <div className="empty-state">
          <Package size={34} strokeWidth={1.2} />
          <h2>Seu catálogo começa aqui</h2>
          <p>
            Cadastre os{' '}
            {tab === 'procedure'
              ? 'procedimentos realizados'
              : 'produtos utilizados'}{' '}
            pela clínica. Nenhum item demonstrativo é incluído.
          </p>
        </div>
      )}
      <Dialog open={open} onOpenChange={(v) => !busy && setOpen(v)}>
        <DialogContent className="system-dialog" showCloseButton={false}>
          <div className="dialog-top">
            <DialogTitle>
              Novo {tab === 'procedure' ? 'procedimento' : 'produto'}
            </DialogTitle>
            <DialogClose
              render={
                <Button
                  variant="ghost"
                  className="icon-button"
                  aria-label="Fechar cadastro"
                  disabled={busy}
                />
              }
            >
              <X size={20} />
            </DialogClose>
          </div>
          <DialogDescription>
            Preencha os dados reais que serão usados pela médica.
          </DialogDescription>
          <form onSubmit={save} className="app-form">
            <label>
              Nome
              <input name="name" required maxLength={120} />
            </label>
            {tab === 'procedure' ? (
              <>
                <label>
                  Descrição
                  <textarea name="description" maxLength={500} rows={2} />
                </label>
                <fieldset>
                  <legend>Regiões de atuação</legend>
                  <div className="choice-pills">
                    {REGIONS.map((r) => (
                      <label key={r} className="choice-pill">
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
                <label className="check-line">
                  <input
                    type="checkbox"
                    name="requires_product"
                    defaultChecked
                  />
                  Exigir a seleção de um produto
                </label>
                <div className="questions-editor">
                  <h3>Perguntas do procedimento</h3>
                  <p className="app-hint">
                    Inclua as características que a médica deve escolher para a
                    simulação.
                  </p>
                  {questions.map((q, i) => (
                    <div className="question-editor" key={i}>
                      <label>
                        Pergunta {i + 1}
                        <input
                          value={q.label}
                          required
                          maxLength={150}
                          onChange={(e) =>
                            setQuestions((prev) =>
                              prev.map((v, n) =>
                                n === i ? { ...v, label: e.target.value } : v,
                              ),
                            )
                          }
                        />
                      </label>
                      <label>
                        Opções, separadas por ponto e vírgula
                        <input
                          value={q.options}
                          required
                          onChange={(e) =>
                            setQuestions((prev) =>
                              prev.map((v, n) =>
                                n === i ? { ...v, options: e.target.value } : v,
                              ),
                            )
                          }
                        />
                      </label>
                      <button
                        type="button"
                        className="text-button"
                        onClick={() =>
                          setQuestions((prev) => prev.filter((_, n) => n !== i))
                        }
                      >
                        Remover pergunta
                      </button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="app-button secondary"
                    disabled={questions.length >= 8}
                    onClick={() =>
                      setQuestions((prev) => [
                        ...prev,
                        { label: '', options: '' },
                      ])
                    }
                  >
                    <Plus size={15} />
                    Adicionar pergunta
                  </Button>
                </div>
              </>
            ) : (
              <>
                <label>
                  Procedimento
                  <select name="procedure_id" required defaultValue="">
                    <option value="" disabled>
                      Selecione no catálogo
                    </option>
                    {procedures.map((p) => (
                      <option value={p.id} key={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Marca / fabricante
                  <input name="brand" maxLength={120} />
                </label>
                <label>
                  Unidade de medida
                  <input
                    name="unit"
                    maxLength={30}
                    placeholder="Unidade indicada pelo fabricante"
                  />
                </label>
              </>
            )}
            {error && (
              <p role="alert" className="app-error">
                {error}
              </p>
            )}
            <Button className="app-button full" type="submit" disabled={busy}>
              {busy ? (
                <LoaderCircle className="spin" size={17} />
              ) : (
                <Plus size={17} />
              )}
              Salvar no catálogo
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
