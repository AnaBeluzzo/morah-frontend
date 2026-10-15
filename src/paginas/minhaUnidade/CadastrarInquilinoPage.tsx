import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { ErroApi } from '../../api/ApiClient';
import { Botao } from '../../componentes/Botao';
import { Campo } from '../../componentes/Campo';
import { ErroFormulario } from '../../componentes/Estados';
import { Tela } from '../../componentes/Tela';
import { useToast } from '../../componentes/Toast';
import { useCriarInquilino } from '../../hooks/minhaUnidadeHooks';
import type { InquilinoCreateRequest } from '../../tipos/minhaUnidade';

const PADRAO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Valores = Record<keyof InquilinoCreateRequest, string>;
type Erros = Partial<Valores>;

function validar(valores: Valores): Erros {
  const erros: Erros = {};
  if (!valores.nome.trim()) erros.nome = 'Informe o nome.';
  if (!valores.cpf.trim()) erros.cpf = 'Informe o CPF.';
  if (valores.email.trim() && !PADRAO_EMAIL.test(valores.email.trim())) erros.email = 'Informe um e-mail válido.';
  if (!valores.contratoInicio) erros.contratoInicio = 'Informe o início do contrato.';
  if (valores.contratoFim && valores.contratoInicio && valores.contratoFim < valores.contratoInicio) erros.contratoFim = 'O fim não pode ser antes do início.';
  return erros;
}

/** Proprietário cadastra o inquilino; o convite de acesso é enviado por e-mail (simulado pelo servidor). */
export function CadastrarInquilinoPage() {
  const navigate = useNavigate();
  const { mostrarToast } = useToast();
  const criar = useCriarInquilino();
  const [valores, setValores] = useState<Valores>({ nome: '', cpf: '', email: '', telefone: '', contratoInicio: '', contratoFim: '' });
  const [erros, setErros] = useState<Erros>({});
  const erroServidor = criar.error instanceof ErroApi ? criar.error : null;

  function mudar(campo: keyof Valores, valor: string) {
    setValores((atuais) => ({ ...atuais, [campo]: valor }));
  }

  function erroDe(campo: keyof Valores) {
    return erros[campo] ?? erroServidor?.erroDoCampo(campo);
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    const encontrados = validar(valores);
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) {
      return;
    }
    criar.mutate(
      {
        nome: valores.nome.trim(),
        cpf: valores.cpf.trim(),
        email: valores.email.trim() || undefined,
        telefone: valores.telefone.trim() || undefined,
        contratoInicio: valores.contratoInicio,
        contratoFim: valores.contratoFim || undefined,
      },
      {
        onSuccess: () => {
          mostrarToast('Inquilino cadastrado e convite enviado');
          navigate('/unidade/inquilinos', { replace: true });
        },
      },
    );
  }

  return (
    <Tela titulo="Cadastrar inquilino" voltarPara="/unidade/inquilinos">
      <form onSubmit={enviar} noValidate>
        <Campo id="nome" rotulo="Nome" autoComplete="name" valor={valores.nome} aoMudar={(v) => mudar('nome', v)} erro={erroDe('nome')} obrigatorio />
        <Campo id="cpf" rotulo="CPF" inputMode="numeric" valor={valores.cpf} aoMudar={(v) => mudar('cpf', v)} erro={erroDe('cpf')} obrigatorio />
        <Campo id="email" rotulo="E-mail" tipo="email" inputMode="email" valor={valores.email} aoMudar={(v) => mudar('email', v)} erro={erroDe('email')} ajuda="Recebe o convite de acesso ao app." />
        <Campo id="telefone" rotulo="Telefone" tipo="tel" inputMode="tel" valor={valores.telefone} aoMudar={(v) => mudar('telefone', v)} erro={erroDe('telefone')} />
        <Campo id="contratoInicio" rotulo="Início do contrato" tipo="date" valor={valores.contratoInicio} aoMudar={(v) => mudar('contratoInicio', v)} erro={erroDe('contratoInicio')} obrigatorio />
        <Campo id="contratoFim" rotulo="Fim do contrato" tipo="date" valor={valores.contratoFim} aoMudar={(v) => mudar('contratoFim', v)} erro={erroDe('contratoFim')} ajuda="Opcional." />
        <ErroFormulario erro={erroServidor && erroServidor.erros.length === 0 ? erroServidor : null} />
        <Botao type="submit" carregando={criar.isPending}>
          Cadastrar
        </Botao>
      </form>
    </Tela>
  );
}
