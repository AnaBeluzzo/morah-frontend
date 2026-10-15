import type { ReactNode } from 'react';
import { Route, Routes } from 'react-router';
import { EstadoVazio } from '../componentes/Estados';
import { LayoutApp } from '../componentes/LayoutApp';
import { Tela } from '../componentes/Tela';
import { useContextoAtivo } from '../contexto/SessaoContext';
import { useTema } from '../contexto/TemaContext';
import { AvisoPage } from '../paginas/avisos/AvisoPage';
import { EditarAvisoPage } from '../paginas/avisos/EditarAvisoPage';
import { MuralPage } from '../paginas/avisos/MuralPage';
import { NovoAvisoPage } from '../paginas/avisos/NovoAvisoPage';
import { CobrancasPage } from '../paginas/financeiro/CobrancasPage';
import { DetalheCobrancaPage } from '../paginas/financeiro/DetalheCobrancaPage';
import { DocumentosPage } from '../paginas/financeiro/DocumentosPage';
import { InadimplenciaPage } from '../paginas/financeiro/InadimplenciaPage';
import { NovoDocumentoPage } from '../paginas/financeiro/NovoDocumentoPage';
import { PixPage } from '../paginas/financeiro/PixPage';
import { TaxasPage } from '../paginas/financeiro/TaxasPage';
import { InicioPage } from '../paginas/inicio/InicioPage';
import { LoginPage } from '../paginas/login/LoginPage';
import { PerfilPage } from '../paginas/login/PerfilPage';
import { TrocarPerfilPage } from '../paginas/login/TrocarPerfilPage';
import { MaisPage } from '../paginas/mais/MaisPage';
import { CadastrarInquilinoPage } from '../paginas/minhaUnidade/CadastrarInquilinoPage';
import { InquilinosPage } from '../paginas/minhaUnidade/InquilinosPage';
import { MinhaUnidadePage } from '../paginas/minhaUnidade/MinhaUnidadePage';
import { SolicitarVinculoPage } from '../paginas/minhaUnidade/SolicitarVinculoPage';
import { UnidadesPage } from '../paginas/minhaUnidade/UnidadesPage';
import { NotificacoesPage } from '../paginas/notificacoes/NotificacoesPage';
import { CondominioPage } from '../paginas/personalizacao/CondominioPage';
import { AcessosPage } from '../paginas/portaria/AcessosPage';
import { AutorizacaoPage } from '../paginas/portaria/AutorizacaoPage';
import { AutorizacoesPage } from '../paginas/portaria/AutorizacoesPage';
import { RegistrarVisitantePage } from '../paginas/portaria/RegistrarVisitantePage';
import { AreasComunsPage } from '../paginas/reservas/AreasComunsPage';
import { DetalheReservaPage } from '../paginas/reservas/DetalheReservaPage';
import { NovaReservaPage } from '../paginas/reservas/NovaReservaPage';
import { ReservasPage } from '../paginas/reservas/ReservasPage';
import { VistoriaPage } from '../paginas/reservas/VistoriaPage';
import { IdentidadeVisualPage } from '../paginas/personalizacao/IdentidadeVisualPage';
import { ModulosPage } from '../paginas/personalizacao/ModulosPage';
import type { Perfil } from '../tipos/login';
import type { ModuloCodigo } from '../tipos/personalizacao';
import { ABAS_POR_PERFIL, itensVisiveis } from './navegacao';
import { RotaProtegida, RotaPublica } from './RotaProtegida';

// perfis de cada tela, iguais aos `security` do contrato (proprietário entra onde o morador entra)
const MORADOR_E_SINDICO: Perfil[] = ['morador', 'sindico'];
const SINDICO: Perfil[] = ['sindico'];
const MORADOR: Perfil[] = ['morador'];
const PROPRIETARIO: Perfil[] = ['proprietario'];
const PORTARIA: Perfil[] = ['portaria'];
const PORTARIA_E_MORADOR: Perfil[] = ['portaria', 'morador'];
const PORTARIA_E_SINDICO: Perfil[] = ['portaria', 'sindico'];

interface TelaProtegida {
  caminho: string;
  pagina: ReactNode;
  /** Sem a lista: qualquer perfil logado. */
  perfis?: Perfil[];
  /** Módulo ativável: desligado pelo síndico, a tela mostra "Módulo indisponível". */
  modulo?: ModuloCodigo;
}

/** Tabela das telas: caminho, componente, quem pode abrir e de qual módulo é. */
const TELAS_PROTEGIDAS: TelaProtegida[] = [
  // Avisos
  { caminho: 'avisos', pagina: <MuralPage />, modulo: 'avisos' },
  { caminho: 'avisos/novo', pagina: <NovoAvisoPage />, perfis: SINDICO, modulo: 'avisos' },
  { caminho: 'avisos/:avisoId', pagina: <AvisoPage />, modulo: 'avisos' },
  { caminho: 'avisos/:avisoId/editar', pagina: <EditarAvisoPage />, perfis: SINDICO, modulo: 'avisos' },
  // Financeiro
  { caminho: 'financeiro', pagina: <CobrancasPage />, perfis: MORADOR_E_SINDICO, modulo: 'financeiro' },
  { caminho: 'financeiro/cobrancas/:cobrancaId', pagina: <DetalheCobrancaPage />, perfis: MORADOR_E_SINDICO, modulo: 'financeiro' },
  { caminho: 'financeiro/cobrancas/:cobrancaId/pix', pagina: <PixPage />, perfis: MORADOR, modulo: 'financeiro' },
  { caminho: 'financeiro/documentos', pagina: <DocumentosPage />, perfis: MORADOR_E_SINDICO, modulo: 'financeiro' },
  { caminho: 'financeiro/documentos/novo', pagina: <NovoDocumentoPage />, perfis: SINDICO, modulo: 'financeiro' },
  { caminho: 'financeiro/taxas', pagina: <TaxasPage />, perfis: SINDICO, modulo: 'financeiro' },
  { caminho: 'financeiro/inadimplencia', pagina: <InadimplenciaPage />, perfis: SINDICO, modulo: 'financeiro' },
  // Minha Unidade
  { caminho: 'unidade', pagina: <MinhaUnidadePage />, perfis: MORADOR, modulo: 'minha_unidade' },
  { caminho: 'unidade/solicitar-vinculo', pagina: <SolicitarVinculoPage />, perfis: MORADOR, modulo: 'minha_unidade' },
  { caminho: 'unidade/inquilinos', pagina: <InquilinosPage />, perfis: PROPRIETARIO, modulo: 'minha_unidade' },
  { caminho: 'unidade/inquilinos/novo', pagina: <CadastrarInquilinoPage />, perfis: PROPRIETARIO, modulo: 'minha_unidade' },
  { caminho: 'unidades', pagina: <UnidadesPage />, perfis: SINDICO, modulo: 'minha_unidade' },
  // Portaria
  { caminho: 'visitantes', pagina: <AutorizacoesPage />, perfis: PORTARIA_E_MORADOR, modulo: 'portaria' },
  { caminho: 'visitantes/novo', pagina: <RegistrarVisitantePage />, perfis: PORTARIA, modulo: 'portaria' },
  { caminho: 'visitantes/:autorizacaoId', pagina: <AutorizacaoPage />, perfis: PORTARIA_E_MORADOR, modulo: 'portaria' },
  { caminho: 'acessos', pagina: <AcessosPage />, perfis: PORTARIA_E_SINDICO, modulo: 'portaria' },
  // Reservas (qualquer perfil vê as áreas e as reservas que lhe cabem)
  { caminho: 'reservas', pagina: <ReservasPage />, modulo: 'reservas' },
  { caminho: 'reservas/areas', pagina: <AreasComunsPage />, modulo: 'reservas' },
  { caminho: 'reservas/areas/:areaComumId/reservar', pagina: <NovaReservaPage />, perfis: MORADOR, modulo: 'reservas' },
  { caminho: 'reservas/:reservaId', pagina: <DetalheReservaPage />, modulo: 'reservas' },
  { caminho: 'reservas/:reservaId/vistoria', pagina: <VistoriaPage />, perfis: PORTARIA, modulo: 'reservas' },
  // Personalização (nunca desativada)
  { caminho: 'condominio', pagina: <CondominioPage />, perfis: SINDICO },
  { caminho: 'condominio/identidade', pagina: <IdentidadeVisualPage />, perfis: SINDICO },
  { caminho: 'condominio/modulos', pagina: <ModulosPage />, perfis: SINDICO },
];

/** Layout das telas logadas, com as abas do perfil ativo (só as de módulos ativos). */
function LayoutLogado() {
  const contexto = useContextoAtivo();
  const { moduloAtivo } = useTema();
  return <LayoutApp abas={itensVisiveis(ABAS_POR_PERFIL[contexto.perfil], moduloAtivo)} />;
}

function PaginaNaoEncontrada() {
  return (
    <Tela titulo="Página não encontrada" voltarPara="/">
      <EstadoVazio mensagem="Esta página não existe." />
    </Tela>
  );
}

export function Rotas() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <RotaPublica>
            <LoginPage />
          </RotaPublica>
        }
      />
      <Route
        element={
          <RotaProtegida>
            <LayoutLogado />
          </RotaProtegida>
        }
      >
        <Route index element={<InicioPage />} />
        <Route path="mais" element={<MaisPage />} />
        <Route path="perfil" element={<PerfilPage />} />
        <Route path="perfil/trocar" element={<TrocarPerfilPage />} />
        <Route path="notificacoes" element={<NotificacoesPage />} />
        {TELAS_PROTEGIDAS.map((tela) => (
          <Route
            key={tela.caminho}
            path={tela.caminho}
            element={
              <RotaProtegida perfis={tela.perfis} modulo={tela.modulo}>
                {tela.pagina}
              </RotaProtegida>
            }
          />
        ))}
        <Route path="*" element={<PaginaNaoEncontrada />} />
      </Route>
    </Routes>
  );
}
