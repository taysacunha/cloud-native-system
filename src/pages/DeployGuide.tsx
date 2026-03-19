import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, Terminal, AlertTriangle, Info, Server, HardDrive, Cpu, MemoryStick, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const CodeBlock = ({ children }: { children: string }) => (
  <pre className="bg-muted/70 border rounded-md p-4 text-sm overflow-x-auto my-3 font-mono whitespace-pre-wrap">
    {children}
  </pre>
);

const Step = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => (
  <div className="mb-10">
    <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold">{n}</span>
      {title}
    </h3>
    <div className="pl-9 space-y-2 text-sm text-foreground/90 leading-relaxed">{children}</div>
  </div>
);

const WarningBox = ({ children }: { children: React.ReactNode }) => (
  <Card className="my-4 border-destructive/30 bg-destructive/5">
    <CardContent className="py-3 flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
      <div className="text-sm">{children}</div>
    </CardContent>
  </Card>
);

const InfoBox = ({ children }: { children: React.ReactNode }) => (
  <Card className="my-4 border-primary/20 bg-primary/5">
    <CardContent className="py-3 flex items-start gap-3">
      <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
      <div className="text-sm">{children}</div>
    </CardContent>
  </Card>
);

const SpecRow = ({ label, min, rec }: { label: string; min: string; rec: string }) => (
  <tr className="border-b border-border">
    <td className="py-2 px-3 font-medium">{label}</td>
    <td className="py-2 px-3">{min}</td>
    <td className="py-2 px-3 text-primary font-medium">{rec}</td>
  </tr>
);

const DeployGuide = () => {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/auth">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Guia de Deploy Self-Hosted</h1>
          <p className="text-muted-foreground text-sm">VM Linux (Ubuntu LTS) no Windows Server 2022 · Supabase Self-Hosted · Docker · Nginx</p>
        </div>
      </div>

      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardContent className="py-4 flex items-start gap-3">
          <Terminal className="h-5 w-5 text-primary mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Stack utilizada:</p>
            <p className="text-muted-foreground">Windows Server 2022 (Hyper-V) → VM Ubuntu 24.04 LTS · Docker Engine · Supabase Self-Hosted · Nginx · Let's Encrypt (Certbot)</p>
          </div>
        </CardContent>
      </Card>

      {/* ============ STEP 1 — Especificações da VM ============ */}
      <Step n={1} title="Especificações da VM Linux">
        <p>A VM será criada via <strong>Hyper-V</strong> no Windows Server 2022. Abaixo as especificações mínimas e recomendadas:</p>

        <Card className="my-4">
          <CardContent className="py-0 px-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="py-2 px-3 text-left font-semibold">Recurso</th>
                  <th className="py-2 px-3 text-left font-semibold">Mínimo</th>
                  <th className="py-2 px-3 text-left font-semibold">Recomendado</th>
                </tr>
              </thead>
              <tbody>
                <SpecRow label="S.O. da VM" min="Ubuntu 22.04 LTS" rec="Ubuntu 24.04 LTS" />
                <SpecRow label="vCPU" min="4 vCPUs" rec="6 vCPUs" />
                <SpecRow label="RAM" min="8 GB" rec="16 GB" />
                <SpecRow label="Disco" min="80 GB SSD" rec="120 GB+ SSD" />
                <SpecRow label="Rede" min="Bridge (IP fixo na rede)" rec="Bridge com IP estático" />
              </tbody>
            </table>
          </CardContent>
        </Card>

        <InfoBox>
          <p><strong>Por que esses valores?</strong> O Supabase self-hosted roda ~15 containers Docker (PostgreSQL, GoTrue, PostgREST, Realtime, Storage, Studio, Edge Functions, etc.). Sozinho consome ~4-6 GB de RAM. Com Nginx + frontend, o total fica entre 6-10 GB em uso normal.</p>
        </InfoBox>

        <p><strong>Portas que devem estar abertas:</strong></p>
        <Card className="my-3">
          <CardContent className="py-0 px-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="py-2 px-3 text-left font-semibold">Porta</th>
                  <th className="py-2 px-3 text-left font-semibold">Protocolo</th>
                  <th className="py-2 px-3 text-left font-semibold">Uso</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="py-2 px-3 font-mono">22</td>
                  <td className="py-2 px-3">TCP</td>
                  <td className="py-2 px-3">SSH — acesso remoto para gerenciamento</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 px-3 font-mono">80</td>
                  <td className="py-2 px-3">TCP</td>
                  <td className="py-2 px-3">HTTP — redirecionamento para HTTPS + desafio ACME (Let's Encrypt)</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 px-3 font-mono">443</td>
                  <td className="py-2 px-3">TCP</td>
                  <td className="py-2 px-3">HTTPS — frontend + API Supabase (proxy reverso via Nginx)</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        <WarningBox>
          <p>Configure as portas <strong>no Hyper-V</strong> (switch virtual), no <strong>Firewall do Windows Server</strong> (regras de entrada) e no <strong>firewall da VM</strong> (ufw). As três camadas precisam permitir o tráfego.</p>
        </WarningBox>

        <p><strong>1.1 — Criar a VM no Hyper-V:</strong></p>
        <CodeBlock>{`# No Windows Server 2022, abra o Hyper-V Manager:
# 1. Ação → Novo → Máquina Virtual
# 2. Nome: SIG-Execut-VM
# 3. Geração: 2 (UEFI)
# 4. Memória: 16384 MB (ou 8192 mín.), desabilitar memória dinâmica
# 5. Rede: selecione o Virtual Switch externo (bridge para rede física)
# 6. Disco: Criar disco virtual VHDX de 120 GB
# 7. ISO: Selecionar ubuntu-24.04-live-server-amd64.iso
# 8. Concluir e iniciar

# Após instalar o Ubuntu, configure IP estático:
sudo nano /etc/netplan/00-installer-config.yaml`}</CodeBlock>
        <CodeBlock>{`# Exemplo de configuração de IP estático:
network:
  version: 2
  ethernets:
    eth0:
      dhcp4: false
      addresses:
        - 192.168.1.100/24
      routes:
        - to: default
          via: 192.168.1.1
      nameservers:
        addresses: [8.8.8.8, 8.8.4.4]`}</CodeBlock>
        <CodeBlock>{`sudo netplan apply`}</CodeBlock>

        <p><strong>1.2 — Configurar firewall na VM:</strong></p>
        <CodeBlock>{`sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
sudo ufw status`}</CodeBlock>
      </Step>

      {/* ============ STEP 2 — Instalar Docker Engine ============ */}
      <Step n={2} title="Instalar Docker Engine + Ferramentas">
        <p><strong>2.1 — Docker Engine (direto no Ubuntu):</strong></p>
        <CodeBlock>{`# Atualizar pacotes:
sudo apt-get update && sudo apt-get upgrade -y

# Instalar dependências:
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# Adicionar repositório oficial do Docker:
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \\
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) \\
  signed-by=/etc/apt/keyrings/docker.gpg] \\
  https://download.docker.com/linux/ubuntu \\
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \\
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io \\
  docker-buildx-plugin docker-compose-plugin

# Habilitar Docker sem sudo:
sudo usermod -aG docker $USER
# Faça logout e login novamente

# Verificar instalação:
docker --version
docker compose version`}</CodeBlock>

        <InfoBox>
          <p>O Docker Engine no Ubuntu inicia automaticamente via systemd. Não é necessário configurar auto-start manualmente como seria no WSL2.</p>
        </InfoBox>

        <p><strong>2.2 — Git, Node.js e Supabase CLI:</strong></p>
        <CodeBlock>{`# Git:
sudo apt-get install -y git

# Node.js via nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install --lts
node --version && npm --version

# Supabase CLI:
npm install -g supabase
supabase --version

# PostgreSQL Client (para backups):
sudo apt-get install -y postgresql-client`}</CodeBlock>
      </Step>

      {/* ============ STEP 3 ============ */}
      <Step n={3} title="Supabase Self-Hosted via Docker Compose">
        <p><strong>3.1 — Clonar o repositório oficial:</strong></p>
        <CodeBlock>{`cd ~
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker`}</CodeBlock>

        <p><strong>3.2 — Configurar variáveis de ambiente:</strong></p>
        <CodeBlock>{`cp .env.example .env
nano .env`}</CodeBlock>
        <p>Altere as seguintes variáveis obrigatórias:</p>
        <CodeBlock>{`# === SEGURANÇA (OBRIGATÓRIO ALTERAR) ===
POSTGRES_PASSWORD=SuaSenhaForteAqui123!
JWT_SECRET=SuaChaveJWTSuperSecreta_minimo32caracteres
ANON_KEY=gere_em_https://supabase.com/docs/guides/self-hosting#api-keys
SERVICE_ROLE_KEY=gere_no_mesmo_link_acima
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=SuaSenhaDoDashboard

# === URLs ===
SITE_URL=https://seudominio.com.br
API_EXTERNAL_URL=https://seudominio.com.br
SUPABASE_PUBLIC_URL=https://seudominio.com.br

# === SMTP (para convites e recuperação de senha) ===
SMTP_ADMIN_EMAIL=noreply@seudominio.com.br
SMTP_HOST=smtp.seuprovedordeemail.com
SMTP_PORT=587
SMTP_USER=seu_usuario_smtp
SMTP_PASS=sua_senha_smtp
SMTP_SENDER_NAME=SIG Execut
MAILER_URLPATHS_INVITE=/auth/v1/verify
MAILER_URLPATHS_CONFIRMATION=/auth/v1/verify
MAILER_URLPATHS_RECOVERY=/auth/v1/verify`}</CodeBlock>

        <WarningBox>
          <p><strong>SMTP é obrigatório</strong> para o sistema funcionar! Sem ele, convites de usuários, confirmação de e-mail e recuperação de senha não funcionam. Provedores gratuitos: <strong>Brevo</strong> (300 e-mails/dia grátis), <strong>Resend</strong> (100 e-mails/dia grátis).</p>
        </WarningBox>

        <p><strong>3.3 — Gerar JWT Keys:</strong></p>
        <p>Acesse o gerador oficial: <code>https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys</code></p>
        <p>Informe o <code>JWT_SECRET</code> definido acima e copie as chaves <code>anon</code> e <code>service_role</code> geradas.</p>

        <p><strong>3.4 — Subir os containers:</strong></p>
        <CodeBlock>{`docker compose up -d

# Verifique se todos estão rodando (~15 containers):
docker compose ps

# Acesse o Studio em: http://IP-DA-VM:8000
# Login com DASHBOARD_USERNAME e DASHBOARD_PASSWORD`}</CodeBlock>
      </Step>

      {/* ============ STEP 4 ============ */}
      <Step n={4} title="Migração do Banco de Dados (Schema Public)">
        <p><strong>4.1 — Exportar dados do Supabase Cloud:</strong></p>
        <p>No dashboard do Supabase Cloud, vá em <strong>Settings → Database → Connection String → URI</strong>.</p>
        <CodeBlock>{`# Exportar schema public + dados:
pg_dump "postgresql://postgres.[ref]:[password]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres" \\
  --clean --if-exists --no-owner --no-privileges \\
  --schema=public \\
  -f backup_public.sql`}</CodeBlock>

        <p><strong>4.2 — Importar no Supabase Self-Hosted:</strong></p>
        <CodeBlock>{`psql "postgresql://postgres:SuaSenhaForteAqui123!@localhost:5432/postgres" \\
  -f backup_public.sql`}</CodeBlock>

        <p><strong>4.3 — Verificar:</strong></p>
        <p>Acesse o Supabase Studio local (<code>http://IP-DA-VM:8000</code>) e confira as tabelas e dados.</p>
      </Step>

      {/* ============ STEP 5 ============ */}
      <Step n={5} title="Migração de Usuários (Schema Auth)">
        <WarningBox>
          <p>O <code>pg_dump --schema=public</code> <strong>NÃO exporta os usuários</strong>. Sem este passo, ninguém conseguirá fazer login no sistema self-hosted.</p>
        </WarningBox>

        <p><strong>5.1 — Exportar tabelas de autenticação:</strong></p>
        <CodeBlock>{`pg_dump "postgresql://postgres.[ref]:[password]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres" \\
  --data-only --no-owner --no-privileges \\
  --table=auth.users \\
  --table=auth.identities \\
  -f backup_auth.sql`}</CodeBlock>

        <p><strong>5.2 — Importar no Self-Hosted:</strong></p>
        <CodeBlock>{`psql "postgresql://postgres:SuaSenhaForteAqui123!@localhost:5432/postgres" \\
  -f backup_auth.sql`}</CodeBlock>

        <InfoBox>
          <p>As tabelas <code>user_roles</code>, <code>user_profiles</code> e <code>system_access</code> já são exportadas no Step 4 (schema public). Elas referenciam <code>auth.users(id)</code>, então importe os usuários <strong>antes</strong> dos dados do schema public, ou desabilite temporariamente as foreign keys.</p>
        </InfoBox>

        <p><strong>Ordem correta de importação:</strong></p>
        <CodeBlock>{`# 1. Primeiro: usuários (auth)
psql "postgresql://postgres:SENHA@localhost:5432/postgres" -f backup_auth.sql

# 2. Depois: dados do sistema (public)
psql "postgresql://postgres:SENHA@localhost:5432/postgres" -f backup_public.sql`}</CodeBlock>
      </Step>

      {/* ============ STEP 6 ============ */}
      <Step n={6} title="Deploy das Edge Functions">
        <p>O sistema possui 5 Edge Functions que precisam ser deployadas:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><code>invite-user</code> — Convite de usuários por e-mail</li>
          <li><code>list-users</code> — Listagem de usuários (admin)</li>
          <li><code>manage-user</code> — Gerenciamento de usuários (ativar/desativar)</li>
          <li><code>deactivate-expired-notice</code> — Desativação automática de avisos prévios</li>
          <li><code>log-dev-work</code> — Registro automatizado de horas de desenvolvimento</li>
        </ul>

        <p><strong>6.1 — Clonar o repositório do projeto:</strong></p>
        <CodeBlock>{`cd ~
git clone https://github.com/seu-usuario/sig-execut.git
cd sig-execut`}</CodeBlock>

        <p><strong>6.2 — Fazer deploy das funções:</strong></p>
        <CodeBlock>{`# Conectar ao Supabase Self-Hosted:
supabase link --project-ref msbhhsrtfqfqcsofnsuy

# Deploy de todas as funções:
supabase functions deploy invite-user --no-verify-jwt
supabase functions deploy list-users --no-verify-jwt
supabase functions deploy manage-user --no-verify-jwt
supabase functions deploy deactivate-expired-notice --no-verify-jwt
supabase functions deploy log-dev-work --no-verify-jwt`}</CodeBlock>

        <InfoBox>
          <p>No Supabase Self-Hosted, as Edge Functions rodam no container <code>supabase-edge-functions</code> via Deno. Verifique no <code>docker compose ps</code> se o container está rodando.</p>
        </InfoBox>

        <p><strong>6.3 — Alternativa: montar diretamente via volume Docker:</strong></p>
        <CodeBlock>{`cp -r ~/sig-execut/supabase/functions/* ~/supabase/docker/volumes/functions/

cd ~/supabase/docker
docker compose restart functions`}</CodeBlock>
      </Step>

      {/* ============ STEP 7 ============ */}
      <Step n={7} title="Build do Frontend (SIG Execut)">
        <p><strong>7.1 — Configurar variáveis de ambiente:</strong></p>
        <CodeBlock>{`cd ~/sig-execut

cat > .env << 'EOF'
VITE_SUPABASE_URL=https://seudominio.com.br
VITE_SUPABASE_PUBLISHABLE_KEY=sua_anon_key_gerada_no_step3
EOF`}</CodeBlock>

        <WarningBox>
          <p>O <code>VITE_SUPABASE_URL</code> deve ser a URL pública onde o Supabase API será acessível. O Nginx fará proxy das rotas <code>/rest/</code>, <code>/auth/</code>, <code>/realtime/</code>, <code>/storage/</code>.</p>
        </WarningBox>

        <p><strong>7.2 — Build de produção:</strong></p>
        <CodeBlock>{`npm install
npm run build
# A pasta dist/ será gerada com os arquivos estáticos`}</CodeBlock>
      </Step>

      {/* ============ STEP 8 ============ */}
      <Step n={8} title="Nginx como Reverse Proxy + HTTPS">
        <p><strong>8.1 — Estrutura de arquivos:</strong></p>
        <CodeBlock>{`~/sig-deploy/
├── dist/                  ← Build do frontend (copiar de sig-execut/dist/)
├── nginx/
│   └── default.conf       ← Configuração do Nginx
├── certbot/
│   ├── conf/              ← Certificados SSL
│   └── www/               ← Desafio ACME
└── docker-compose.yml     ← Nginx container`}</CodeBlock>

        <p><strong>8.2 — Configuração do Nginx (<code>nginx/default.conf</code>):</strong></p>
        <CodeBlock>{`# Redirecionar HTTP para HTTPS
server {
    listen 80;
    server_name seudominio.com.br;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name seudominio.com.br;

    ssl_certificate /etc/letsencrypt/live/seudominio.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seudominio.com.br/privkey.pem;

    # Headers de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    client_max_body_size 50M;

    # ====== Frontend (SPA React) ======
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;

        location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # ====== Supabase REST API ======
    location /rest/ {
        proxy_pass http://localhost:8000/rest/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ====== Supabase Auth ======
    location /auth/ {
        proxy_pass http://localhost:8000/auth/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ====== Supabase Realtime (WebSocket) ======
    location /realtime/ {
        proxy_pass http://localhost:8000/realtime/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400s;
    }

    # ====== Supabase Storage ======
    location /storage/ {
        proxy_pass http://localhost:8000/storage/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ====== Supabase Edge Functions ======
    location /functions/ {
        proxy_pass http://localhost:8000/functions/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`}</CodeBlock>

        <InfoBox>
          <p>Na VM Linux, o Nginx acessa os containers Supabase via <code>localhost</code> (não <code>host.docker.internal</code>). Se o Nginx também rodar em Docker, use <code>--network host</code> ou crie uma rede Docker compartilhada.</p>
        </InfoBox>

        <p><strong>8.3 — Docker Compose para o Nginx:</strong></p>
        <CodeBlock>{`# ~/sig-deploy/docker-compose.yml
version: "3.8"
services:
  nginx:
    image: nginx:alpine
    network_mode: host
    volumes:
      - ./dist:/usr/share/nginx/html:ro
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro
    restart: always`}</CodeBlock>

        <InfoBox>
          <p>Usando <code>network_mode: host</code> o container Nginx compartilha a rede da VM, acessando os containers Supabase via <code>localhost:8000</code> diretamente. Não é necessário mapear portas 80/443 separadamente.</p>
        </InfoBox>
      </Step>

      {/* ============ STEP 9 ============ */}
      <Step n={9} title="HTTPS com Let's Encrypt (Certbot)">
        <p><strong>Pré-requisitos:</strong></p>
        <ul className="list-disc pl-5 space-y-1">
          <li>DNS A record do domínio apontando para o IP público do servidor</li>
          <li>Portas 80 e 443 abertas (VM + Windows Server + roteador)</li>
        </ul>

        <p><strong>9.1 — Gerar certificado:</strong></p>
        <CodeBlock>{`# Suba o Nginx apenas com HTTP primeiro (comente o bloco 443):
cd ~/sig-deploy
docker compose up -d

# Gerar certificado:
docker run --rm --network host \\
  -v ~/sig-deploy/certbot/conf:/etc/letsencrypt \\
  -v ~/sig-deploy/certbot/www:/var/www/certbot \\
  certbot/certbot certonly --webroot \\
  -w /var/www/certbot \\
  -d seudominio.com.br \\
  --email seu@email.com \\
  --agree-tos --no-eff-email

# Descomente o bloco 443 e reinicie:
docker compose restart`}</CodeBlock>

        <p><strong>9.2 — Renovação automática (cron):</strong></p>
        <CodeBlock>{`# ~/sig-deploy/renew-cert.sh
#!/bin/bash
docker run --rm --network host \\
  -v ~/sig-deploy/certbot/conf:/etc/letsencrypt \\
  -v ~/sig-deploy/certbot/www:/var/www/certbot \\
  certbot/certbot renew --quiet

cd ~/sig-deploy && docker compose exec nginx nginx -s reload`}</CodeBlock>
        <CodeBlock>{`chmod +x ~/sig-deploy/renew-cert.sh

# Agendar no crontab para rodar a cada 60 dias:
crontab -e
# Adicione:
0 3 */60 * * /root/sig-deploy/renew-cert.sh >> /var/log/certbot-renew.log 2>&1`}</CodeBlock>
      </Step>

      {/* ============ STEP 10 ============ */}
      <Step n={10} title="Acesso Interno (Intranet) — Sem domínio">
        <p>Se o sistema será acessado apenas pela rede interna:</p>
        <CodeBlock>{`# No default.conf do Nginx, use:
server_name _;  # Aceita qualquer hostname

# Não precisa de HTTPS para intranet (use apenas o bloco :80)

# Acesse pelo IP da VM:
# http://192.168.1.100

# Para resolver por nome nos computadores da rede:
# Edite C:\\Windows\\System32\\drivers\\etc\\hosts em cada máquina:
192.168.1.100  sig-execut.local`}</CodeBlock>
      </Step>

      {/* ============ STEP 11 — Backup ============ */}
      <Step n={11} title="Backup Automatizado">
        <InfoBox>
          <p><strong>Estratégia de backup:</strong> Backup diário automático via <code>pg_dump</code> comprimido, com retenção de 30 dias. Recomenda-se copiar os backups para um destino externo (NAS, storage em nuvem ou outro disco) para proteção contra falha do disco da VM.</p>
        </InfoBox>

        <p><strong>11.1 — Script de backup:</strong></p>
        <CodeBlock>{`# ~/sig-deploy/backup.sh
#!/bin/bash
BACKUP_DIR=~/backups
DATE=$(date +%Y-%m-%d_%H%M)
mkdir -p $BACKUP_DIR

# Backup do schema public
pg_dump "postgresql://postgres:SuaSenhaForteAqui123!@localhost:5432/postgres" \\
  --no-owner --no-privileges --schema=public \\
  -f "$BACKUP_DIR/public_$DATE.sql"

# Backup dos usuários (auth)
pg_dump "postgresql://postgres:SuaSenhaForteAqui123!@localhost:5432/postgres" \\
  --data-only --no-owner --no-privileges \\
  --table=auth.users --table=auth.identities \\
  -f "$BACKUP_DIR/auth_$DATE.sql"

# Comprimir
tar -czf "$BACKUP_DIR/backup_$DATE.tar.gz" \\
  "$BACKUP_DIR/public_$DATE.sql" \\
  "$BACKUP_DIR/auth_$DATE.sql"

# Limpar arquivos soltos
rm "$BACKUP_DIR/public_$DATE.sql" "$BACKUP_DIR/auth_$DATE.sql"

# Manter apenas últimos 30 backups
ls -t $BACKUP_DIR/backup_*.tar.gz | tail -n +31 | xargs -r rm

echo "$(date): Backup completo - backup_$DATE.tar.gz" >> /var/log/backup.log`}</CodeBlock>
        <CodeBlock>{`chmod +x ~/sig-deploy/backup.sh

# Agendar backup diário às 2h da manhã:
crontab -e
# Adicione:
0 2 * * * /root/sig-deploy/backup.sh >> /var/log/backup.log 2>&1`}</CodeBlock>

        <p><strong>11.2 — Cópia externa (recomendado):</strong></p>
        <CodeBlock>{`# Opção A: Copiar para pasta compartilhada do Windows Server (SMB)
# Monte o compartilhamento:
sudo apt-get install -y cifs-utils
sudo mkdir -p /mnt/backup-share
sudo mount -t cifs //WINDOWS-SERVER/Backups /mnt/backup-share \\
  -o username=backup_user,password=senha,uid=1000

# Adicione ao script de backup:
cp "$BACKUP_DIR/backup_$DATE.tar.gz" /mnt/backup-share/

# Opção B: rsync para outro servidor
rsync -az ~/backups/ usuario@servidor-externo:/backups/sig-execut/`}</CodeBlock>
      </Step>

      {/* ============ STEP 12 ============ */}
      <Step n={12} title="Atualizações e Manutenção">
        <p><strong>Atualizar o frontend:</strong></p>
        <CodeBlock>{`cd ~/sig-execut
git pull
npm install
npm run build
cp -r dist/* ~/sig-deploy/dist/
cd ~/sig-deploy && docker compose restart`}</CodeBlock>

        <p><strong>Atualizar o Supabase:</strong></p>
        <CodeBlock>{`cd ~/supabase/docker
git pull
docker compose pull
docker compose up -d`}</CodeBlock>

        <p><strong>Monitorar containers:</strong></p>
        <CodeBlock>{`# Ver status de todos:
docker compose ps

# Logs em tempo real:
docker compose logs -f

# Logs de um serviço específico:
docker compose logs -f rest       # API REST
docker compose logs -f auth       # Autenticação
docker compose logs -f functions  # Edge Functions

# Uso de recursos da VM:
htop
df -h   # Espaço em disco
free -h # Memória`}</CodeBlock>
      </Step>

      {/* ============ CHECKLIST ============ */}
      <Step n={13} title="Checklist Final">
        <div className="space-y-2">
          {[
            "VM Ubuntu LTS criada no Hyper-V com IP estático",
            "vCPU, RAM e disco dentro dos requisitos (mín. 4 vCPU, 8 GB, 80 GB SSD)",
            "Portas 22, 80 e 443 abertas (VM + Windows Server + roteador)",
            "Docker Engine instalado e funcionando na VM",
            "Supabase Self-Hosted rodando (docker compose ps — ~15 containers)",
            "JWT_SECRET, ANON_KEY e SERVICE_ROLE_KEY configurados no .env",
            "SMTP configurado (testar enviando convite de usuário)",
            "Banco de dados público migrado e verificado no Studio",
            "Usuários (auth.users) migrados — testar login com conta existente",
            "Edge Functions deployadas (testar invite-user, list-users, log-dev-work)",
            "Frontend buildado com VITE_SUPABASE_URL correto",
            "Nginx servindo frontend + proxy para Supabase API",
            "HTTPS configurado (se acesso externo) com Let's Encrypt",
            "DNS A record apontando para o IP público do servidor",
            "Backup diário automatizado via cron e testado",
            "Cópia externa dos backups configurada (NAS/SMB/rsync)",
            "Renovação automática do certificado SSL agendada",
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </Step>

      <Card className="mt-4 mb-8 border-destructive/30 bg-destructive/5">
        <CardContent className="py-4 text-sm">
          <p className="font-semibold text-destructive mb-2">⚠️ Troubleshooting Comum</p>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li><strong>Login não funciona após migração:</strong> Verifique se importou <code>auth.users</code> e <code>auth.identities</code>. O <code>JWT_SECRET</code> do self-hosted é diferente do Cloud, então tokens antigos são inválidos — usuários precisam fazer login novamente.</li>
            <li><strong>E-mail de convite não chega:</strong> Confira as variáveis SMTP no <code>.env</code> do Supabase. Teste com <code>docker compose logs auth</code> para ver erros de envio.</li>
            <li><strong>Edge Functions retornam 500:</strong> Verifique <code>docker compose logs functions</code>. Confirme que o container <code>supabase-edge-functions</code> está rodando.</li>
            <li><strong>WebSocket (realtime) não conecta:</strong> Verifique se o Nginx tem <code>proxy_http_version 1.1</code> e headers <code>Upgrade/Connection</code> na rota <code>/realtime/</code>.</li>
            <li><strong>CORS errors no frontend:</strong> Confirme que <code>VITE_SUPABASE_URL</code> corresponde exatamente à URL configurada no Nginx e no <code>API_EXTERNAL_URL</code> do Supabase.</li>
            <li><strong>VM não acessível pela rede:</strong> Verifique o Virtual Switch do Hyper-V (deve ser External/Bridge), o IP estático da VM, e as regras de firewall nas três camadas (VM, Windows Server, roteador).</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeployGuide;
