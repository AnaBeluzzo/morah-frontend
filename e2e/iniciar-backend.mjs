// Sobe o backend real para os testes de ponta a ponta: porta 8081 e banco próprio
// (target/e2e.db), apagado a cada execução para os testes começarem do seed.
import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

const naWindows = process.platform === 'win32';
const pastaBackend = resolve(process.env.MORAH_BACKEND_DIR ?? '../morah-backend');

rmSync(resolve(pastaBackend, 'target/e2e.db'), { force: true });

const env = {
  ...process.env,
  SERVER_PORT: '8081',
  SPRING_DATASOURCE_URL: 'jdbc:sqlite:target/e2e.db?date_class=TEXT&date_string_format=yyyy-MM-dd HH:mm:ss.SSS',
};
if (naWindows) {
  // evita o erro "Unable to establish loopback connection" do Tomcat no Windows
  env.JAVA_TOOL_OPTIONS = '-Djdk.net.unixdomain.tmpdir=C:/Users/Public';
}

const backend = spawn('mvn', ['-q', 'spring-boot:run'], { cwd: pastaBackend, env, stdio: 'inherit', shell: naWindows });
backend.on('exit', (codigo) => process.exit(codigo ?? 0));
