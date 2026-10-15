import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { ErroApi } from '../../api/ApiClient';
import { Botao } from '../../componentes/Botao';
import { Campo } from '../../componentes/Campo';
import { ErroFormulario } from '../../componentes/Estados';
import { useEntrar } from '../../hooks/autenticacaoHooks';
import estilos from './LoginPage.module.css';

const PADRAO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Só no `npm run dev`: atalho para a demonstração (nunca aparece no build de produção).
const USUARIOS_DEMONSTRACAO = [
  { rotulo: 'Helena Prado (síndica)', email: 'helena.prado@demo.com.br' },
  { rotulo: 'Rafael Nunes (proprietário)', email: 'rafael.nunes@demo.com.br' },
  { rotulo: 'Camila Duarte (moradora)', email: 'camila.duarte@demo.com.br' },
  { rotulo: 'Portaria Central', email: 'portaria@demo.com.br' },
];

interface ErrosLogin {
  email?: string;
  senha?: string;
}

function validar(email: string, senha: string): ErrosLogin {
  const erros: ErrosLogin = {};
  if (!email.trim()) {
    erros.email = 'Informe o e-mail.';
  } else if (!PADRAO_EMAIL.test(email.trim())) {
    erros.email = 'Informe um e-mail válido.';
  }
  if (!senha) {
    erros.senha = 'Informe a senha.';
  }
  return erros;
}

export function LoginPage() {
  const navigate = useNavigate();
  const login = useEntrar();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erros, setErros] = useState<ErrosLogin>({});

  const erroServidor = login.error instanceof ErroApi ? login.error : null;

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    const encontrados = validar(email, senha);
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) {
      return;
    }
    login.mutate({ email: email.trim(), senha }, { onSuccess: () => navigate('/', { replace: true }) });
  }

  return (
    <main className={estilos.pagina}>
      <header className={estilos.placa}>
        <img src="/favicon.svg" alt="" width={44} height={44} />
        <h1>Morah</h1>
        <p>Avisos, cobranças, visitas e encomendas do seu condomínio.</p>
      </header>

      <form className={estilos.cartao} onSubmit={enviar} noValidate>
        <h2>Entrar</h2>
        <Campo
          id="email"
          rotulo="E-mail"
          tipo="email"
          inputMode="email"
          autoComplete="username"
          valor={email}
          aoMudar={setEmail}
          erro={erros.email ?? erroServidor?.erroDoCampo('email')}
          obrigatorio
        />
        <div className={estilos.senha}>
          <Campo
            id="senha"
            rotulo="Senha"
            tipo={mostrarSenha ? 'text' : 'password'}
            autoComplete="current-password"
            valor={senha}
            aoMudar={setSenha}
            erro={erros.senha ?? erroServidor?.erroDoCampo('senha')}
            obrigatorio
          />
          <button type="button" className={estilos.mostrar} aria-pressed={mostrarSenha} onClick={() => setMostrarSenha(!mostrarSenha)}>
            {mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
          </button>
        </div>
        {/* 401: o servidor já devolve a mensagem amigável "E-mail ou senha inválidos" */}
        {erroServidor && erroServidor.erros.length === 0 && <ErroFormulario erro={erroServidor} />}
        <Botao type="submit" carregando={login.isPending}>
          Entrar
        </Botao>
      </form>

      {import.meta.env.DEV && (
        <details className={estilos.demonstracao}>
          <summary>Usuários de demonstração</summary>
          <p>Todos com a senha demo123.</p>
          {USUARIOS_DEMONSTRACAO.map((usuario) => (
            <Botao
              key={usuario.email}
              variante="secundario"
              onClick={() => {
                setEmail(usuario.email);
                setSenha('demo123');
              }}
            >
              {usuario.rotulo}
            </Botao>
          ))}
        </details>
      )}
    </main>
  );
}
