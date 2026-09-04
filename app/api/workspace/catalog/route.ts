import {
  authenticated,
  failure,
  jsonBody,
  response,
  sameOrigin,
} from '@/lib/simulation/server';
import {
  record,
  SimulationError,
  textField,
  uuid,
  type Question,
} from '@/lib/simulation/types';

export async function GET() {
  try {
    const { db } = await authenticated();
    const [procedures, products] = await Promise.all([
      db
        .from('aesthetic_procedures')
        .select('*')
        .eq('active', true)
        .order('name'),
      db
        .from('aesthetic_products')
        .select('*')
        .eq('active', true)
        .order('name'),
    ]);
    if (procedures.error || products.error)
      throw new SimulationError(
        'Não foi possível carregar o catálogo. Verifique a instalação do módulo.',
        503,
      );
    return response({ procedures: procedures.data, products: products.data });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { db, member } = await authenticated();
    if (member.role !== 'admin')
      throw new SimulationError(
        'Somente administradores podem cadastrar itens.',
        403,
      );
    const b = record(await jsonBody(request));
    if (b.kind === 'procedure') {
      if (
        !Array.isArray(b.regions) ||
        !b.regions.length ||
        b.regions.length > 20
      )
        throw new SimulationError('Informe as regiões de atuação.');
      const regions = b.regions.map((r) => textField(r, 'Região', 60));
      if (!Array.isArray(b.questions) || b.questions.length > 8)
        throw new SimulationError('Use até 8 perguntas adicionais.');
      const questions: Question[] = b.questions.map((item, i) => {
        const q = record(item);
        if (
          !Array.isArray(q.options) ||
          q.options.length < 2 ||
          q.options.length > 8
        )
          throw new SimulationError('Cada pergunta precisa de 2 a 8 opções.');
        const options = [
          ...new Set(q.options.map((o) => textField(o, 'Opção', 80))),
        ];
        if (options.length < 2)
          throw new SimulationError(
            'Cada pergunta precisa de pelo menos 2 opções diferentes.',
          );
        return {
          id: `question-${i + 1}`,
          label: textField(q.label, 'Pergunta', 150),
          options,
        };
      });
      const { error } = await db.from('aesthetic_procedures').insert({
        name: textField(b.name, 'Nome', 120),
        description: textField(b.description ?? '', 'Descrição', 500, false),
        regions,
        questions,
        requires_product: b.requires_product !== false,
      });
      if (error)
        throw new SimulationError(
          'Não foi possível cadastrar o procedimento. Confira se o nome já existe.',
          409,
        );
    } else if (b.kind === 'product') {
      const procedure_id = uuid(b.procedure_id);
      const { data: procedure } = await db
        .from('aesthetic_procedures')
        .select('id')
        .eq('id', procedure_id)
        .eq('active', true)
        .maybeSingle();
      if (!procedure)
        throw new SimulationError('Selecione um procedimento cadastrado.');
      const { error } = await db.from('aesthetic_products').insert({
        procedure_id,
        name: textField(b.name, 'Nome', 120),
        brand: textField(b.brand ?? '', 'Marca', 120, false),
        unit: textField(b.unit ?? '', 'Unidade', 30, false),
      });
      if (error)
        throw new SimulationError(
          'Não foi possível cadastrar o produto. Confira se ele já existe.',
          409,
        );
    } else throw new SimulationError('Tipo de cadastro inválido.');
    return response({ ok: true }, 201);
  } catch (error) {
    return failure(error);
  }
}
