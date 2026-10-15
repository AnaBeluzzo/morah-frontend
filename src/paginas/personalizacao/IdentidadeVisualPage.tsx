import { useState, type CSSProperties, type FormEvent } from 'react';
import { ErroApi } from '../../api/ApiClient';
import { Botao } from '../../componentes/Botao';
import { Campo } from '../../componentes/Campo';
import { ErroFormulario, EstadoConsulta } from '../../componentes/Estados';
import { Secao, Tela } from '../../componentes/Tela';
import { useToast } from '../../componentes/Toast';
import { useAlterarPersonalizacao, usePersonalizacao } from '../../hooks/personalizacaoHooks';
import type { Personalizacao } from '../../tipos/personalizacao';
import { camposAlterados } from '../../utils/alteracoes';
import { corDoTextoSobre, corValida } from '../../utils/cores';
import estilos from './IdentidadeVisualPage.module.css';

type CampoCor = 'corPrimaria' | 'corSecundaria' | 'corDestaque';

// cada cor do contrato e a variável CSS que ela controla no app
const CORES: { campo: CampoCor; variavel: string; rotulo: string; ajuda: string }[] = [
  { campo: 'corPrimaria', variavel: '--cor-primaria', rotulo: 'Cor primária', ajuda: 'Barra superior e botões principais.' },
  { campo: 'corSecundaria', variavel: '--cor-secundaria', rotulo: 'Cor secundária', ajuda: 'Fundo das telas.' },
  { campo: 'corDestaque', variavel: '--cor-destaque', rotulo: 'Cor de destaque', ajuda: 'Selos e itens em destaque.' },
];

interface Valores {
  nomeExibicao: string;
  logoUrl: string;
  corPrimaria: string;
  corSecundaria: string;
  corDestaque: string;
}

type Erros = Partial<Record<keyof Valores, string>>;

function urlValida(valor: string): boolean {
  try {
    const url = new URL(valor);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function validar(valores: Valores): Erros {
  const erros: Erros = {};
  const nome = valores.nomeExibicao.trim();
  if (!nome) {
    erros.nomeExibicao = 'Informe o nome de exibição.';
  } else if (nome.length > 60) {
    erros.nomeExibicao = 'Use no máximo 60 caracteres.';
  }
  if (valores.logoUrl.trim() && !urlValida(valores.logoUrl.trim())) {
    erros.logoUrl = 'Informe uma URL começando com http:// ou https://.';
  }
  for (const { campo } of CORES) {
    if (!corValida(valores[campo])) {
      erros[campo] = 'Use o formato #RRGGBB (ex.: #1F4E79).';
    }
  }
  return erros;
}

/** Variáveis CSS da prévia: mostra as cores escolhidas antes de salvar, sem mudar o app. */
function estiloPrevia(valores: Valores): CSSProperties {
  const variaveis: Record<string, string> = {};
  for (const { campo, variavel } of CORES) {
    if (corValida(valores[campo])) {
      variaveis[variavel] = valores[campo];
      variaveis[`${variavel}-texto`] = corDoTextoSobre(valores[campo]);
    }
  }
  return variaveis as CSSProperties;
}

function FormularioIdentidade({ original }: { original: Personalizacao }) {
  const alterar = useAlterarPersonalizacao();
  const { mostrarToast } = useToast();
  const [valores, setValores] = useState<Valores>({
    nomeExibicao: original.nomeExibicao,
    logoUrl: original.logoUrl ?? '',
    corPrimaria: original.corPrimaria,
    corSecundaria: original.corSecundaria,
    corDestaque: original.corDestaque,
  });
  const [erros, setErros] = useState<Erros>({});
  const erroServidor = alterar.error instanceof ErroApi ? alterar.error : null;

  function mudar(campo: keyof Valores, valor: string) {
    setValores((atuais) => ({ ...atuais, [campo]: valor }));
  }

  function erroDe(campo: keyof Valores): string | undefined {
    return erros[campo] ?? erroServidor?.erroDoCampo(campo);
  }

  function salvar(evento: FormEvent) {
    evento.preventDefault();
    const encontrados = validar(valores);
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) {
      return;
    }
    // só os campos alterados; logo vazia vira `null` explícito, que remove a logo
    const corpo = camposAlterados(
      { ...original, logoUrl: original.logoUrl ?? null },
      {
        ...original,
        nomeExibicao: valores.nomeExibicao.trim(),
        logoUrl: valores.logoUrl.trim() || null,
        corPrimaria: valores.corPrimaria,
        corSecundaria: valores.corSecundaria,
        corDestaque: valores.corDestaque,
      },
    );
    if (Object.keys(corpo).length === 0) {
      mostrarToast('Nada foi alterado.');
      return;
    }
    alterar.mutate(corpo, { onSuccess: () => mostrarToast('Identidade visual salva') });
  }

  const logoPrevia = urlValida(valores.logoUrl.trim()) ? valores.logoUrl.trim() : null;

  return (
    <form onSubmit={salvar} noValidate>
      <Campo
        id="nomeExibicao"
        rotulo="Nome de exibição"
        valor={valores.nomeExibicao}
        aoMudar={(valor) => mudar('nomeExibicao', valor)}
        erro={erroDe('nomeExibicao')}
        maxLength={60}
        ajuda="Até 60 caracteres. Aparece no topo do app."
        obrigatorio
      />
      <Campo
        id="logoUrl"
        rotulo="URL da logo"
        tipo="url"
        inputMode="url"
        valor={valores.logoUrl}
        aoMudar={(valor) => mudar('logoUrl', valor)}
        erro={erroDe('logoUrl')}
        placeholder="https://..."
        ajuda="Endereço de uma imagem já publicada (não há upload)."
      />
      {valores.logoUrl && (
        <Botao variante="secundario" onClick={() => mudar('logoUrl', '')}>
          Remover logo
        </Botao>
      )}

      {CORES.map(({ campo, rotulo, ajuda }) => (
        <div key={campo} className={estilos.cor}>
          <input
            type="color"
            aria-label={`Seletor da ${rotulo.toLowerCase()}`}
            value={corValida(valores[campo]) ? valores[campo] : '#000000'}
            onChange={(evento) => mudar(campo, evento.target.value.toUpperCase())}
          />
          <Campo
            id={campo}
            rotulo={rotulo}
            valor={valores[campo]}
            aoMudar={(valor) => mudar(campo, valor.toUpperCase())}
            erro={erroDe(campo)}
            ajuda={ajuda}
            maxLength={7}
            autoComplete="off"
          />
        </div>
      ))}

      <Secao titulo="Prévia">
        <div className={estilos.previa} style={estiloPrevia(valores)} aria-label="Prévia da identidade visual">
          <div className={estilos.previaTopo}>
            {logoPrevia && <img src={logoPrevia} alt="" className={estilos.previaLogo} />}
            <strong>{valores.nomeExibicao || 'Nome do condomínio'}</strong>
          </div>
          <div className={estilos.previaCorpo}>
            <span className={estilos.previaSelo}>Destaque</span>
            <span className={estilos.previaBotao}>Botão principal</span>
          </div>
        </div>
      </Secao>

      <ErroFormulario erro={erroServidor} />
      <Botao type="submit" carregando={alterar.isPending}>
        Salvar
      </Botao>
    </form>
  );
}

export function IdentidadeVisualPage() {
  const consulta = usePersonalizacao();
  return (
    <Tela titulo="Identidade visual" voltarPara="/condominio">
      {/* a chave remonta o formulário quando a personalização salva muda */}
      <EstadoConsulta consulta={consulta}>{(personalizacao) => <FormularioIdentidade key={personalizacao.atualizadoEm} original={personalizacao} />}</EstadoConsulta>
    </Tela>
  );
}
