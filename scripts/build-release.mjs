#!/usr/bin/env node
/**
 * 폐쇄망 반입용 릴리스 번들을 만든다.
 *
 * 폐쇄망에는 npm·Maven registry 도 Docker Hub 도 없다. 그래서 이미지를 파일로 말아서
 * 반입하고 `docker load` 로 되살린다. 이 스크립트가 그 번들을 만든다.
 *
 *   node scripts/build-release.mjs [버전]
 *
 * 산출물: dist/nh-canvas-<버전>/
 *   images.tar        backend + postgres 이미지 (베이스 레이어 포함)
 *   docker-compose.yml
 *   .env.example
 *   dependencies.txt  의존성·라이선스 목록 (반입 심사 자료)
 *   checksums.txt     SHA-256
 *   INSTALL.md        폐쇄망 설치 절차
 *
 * 반드시 linux/amd64 로 빌드한다. ARM 맥에서 만든 이미지는 반입 후
 * `exec format error` 로 죽는다 — 가장 흔한 사고라 옵션을 하드코딩했다.
 */
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const REPO = process.cwd();
const VERSION = process.argv[2] ?? "0.1.0";
const PLATFORM = "linux/amd64";

/** compose 와 같은 값을 써야 한다. 바꾸려면 docker-compose.yml 도 함께 고칠 것. */
const BACKEND_IMAGE = `nh-canvas-backend:${VERSION}`;
const POSTGRES_IMAGE =
  "postgres:16@sha256:f1c3376c26f2609ab9f29f71f824103fe2fcd8ee0346485cb6122a4f93df6f94";

/**
 * Windows 에서 mvn 은 mvn.cmd 다. Node 20+ 는 보안 수정(CVE-2024-27980) 이후
 * .cmd 를 execFileSync 로 바로 못 띄우므로 셸을 거친다.
 */
const MVN_CMD = process.platform === "win32" ? "mvn.cmd" : "mvn";

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { cwd: REPO, stdio: "pipe", maxBuffer: 256 << 20, ...opts })
    .toString("utf8")
    .trim();
}

function step(label, fn) {
  process.stdout.write(`  ${label} ... `);
  try {
    const result = fn();
    console.log("완료");
    return result;
  } catch (error) {
    console.log("실패");
    const detail = error.stderr?.toString("utf8") || error.message;
    console.error(`\n${detail}\n`);
    process.exit(1);
  }
}

function gitSha() {
  try {
    return run("git", ["rev-parse", "--short", "HEAD"]);
  } catch {
    return "unknown";
  }
}

function isDirty() {
  try {
    return run("git", ["status", "--porcelain"]).length > 0;
  } catch {
    return false;
  }
}

function sha256(file) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(file));
  return hash.digest("hex");
}

function mb(file) {
  return Math.round(fs.statSync(file).size / 1024 / 1024);
}

const sha = gitSha();
const buildTime = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
const outDir = path.join(REPO, "dist", `nh-canvas-${VERSION}`);

console.log(`\nNH위드캔버스 반입 번들 v${VERSION}  (${sha}, ${PLATFORM})\n`);

if (isDirty()) {
  // 막으려는 사고: 커밋되지 않은 코드로 이미지를 구우면 이미지 라벨의 커밋 해시가 거짓말이 된다.
  console.log("  ⚠ 작업 트리에 커밋되지 않은 변경이 있습니다.");
  console.log(`    이미지에는 ${sha} 가 박히지만 실제 내용은 그것과 다릅니다.\n`);
}

step("출력 디렉터리 준비", () => {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
});

step(`backend 이미지 빌드 (${BACKEND_IMAGE})`, () =>
  run("docker", [
    "build",
    "--platform", PLATFORM,
    "--build-arg", `GIT_SHA=${sha}`,
    "--build-arg", `BUILD_TIME=${buildTime}`,
    "-t", BACKEND_IMAGE,
    "./backend",
  ])
);

const POSTGRES_TAG = "postgres:16";
step("postgres 이미지 확보", () => {
  run("docker", ["pull", "--platform", PLATFORM, POSTGRES_IMAGE]);
  // 다이제스트로만 저장하면 폐쇄망에서 load 후 `postgres:<none>` 으로 복원된다.
  // 실행은 되지만 운영자 눈에 dangling 으로 보여 prune 으로 지워질 수 있다. 태그를 붙여 담는다.
  run("docker", ["tag", POSTGRES_IMAGE, POSTGRES_TAG]);
});

// docker save 는 베이스 이미지 레이어까지 담는다. 그래서 폐쇄망에 temurin·postgres 가
// 없어도 load 만으로 실행된다.
const imagesTar = path.join(outDir, "images.tar");
step("이미지를 tar 로 저장", () =>
  run("docker", ["save", "-o", imagesTar, BACKEND_IMAGE, POSTGRES_TAG])
);

step("아키텍처 검증", () => {
  const arch = run("docker", ["image", "inspect", BACKEND_IMAGE, "--format", "{{.Os}}/{{.Architecture}}"]);
  if (arch !== "linux/amd64") throw new Error(`이미지 아키텍처가 ${arch} 입니다. linux/amd64 여야 합니다.`);
  return arch;
});

step("설정 파일 복사", () => {
  for (const name of ["docker-compose.yml", ".env.example"]) {
    fs.copyFileSync(path.join(REPO, name), path.join(outDir, name));
  }
});

step("의존성 목록 생성 (반입 심사 자료)", () => {
  // -q 를 주면 목록까지 함께 잠긴다. outputFile 로 직접 받아야 한다.
  // 인자를 배열로 넘기면서 shell 을 켜면 Node 가 DEP0190 을 경고하므로 한 문자열로 합친다.
  const target = path.join(outDir, "dependencies.txt");
  execFileSync(
    `${MVN_CMD} -B dependency:list -DincludeScope=runtime -DoutputFile="${target}" -DappendOutput=false`,
    { cwd: path.join(REPO, "backend"), shell: true, stdio: "pipe", maxBuffer: 64 << 20 }
  );
  // 빈 목록이 심사 자료로 나가는 사고를 막는다.
  const written = fs.readFileSync(target, "utf8");
  const count = written.split("\n").filter((l) => l.includes(":jar:")).length;
  if (count < 5) throw new Error(`의존성 목록이 비어 있습니다 (${count}건).`);
});

step("INSTALL.md 생성", () => {
  fs.writeFileSync(path.join(outDir, "INSTALL.md"), installDoc(), "utf8");
});

step("체크섬 생성", () => {
  const lines = fs
    .readdirSync(outDir)
    .filter((n) => n !== "checksums.txt")
    .sort()
    .map((n) => `${sha256(path.join(outDir, n))}  ${n}`);
  fs.writeFileSync(path.join(outDir, "checksums.txt"), `${lines.join("\n")}\n`, "utf8");
});

console.log(`\n번들: ${path.relative(REPO, outDir)}`);
for (const name of fs.readdirSync(outDir).sort()) {
  const size = mb(path.join(outDir, name));
  console.log(`  ${name}${size >= 1 ? `  (${size} MB)` : ""}`);
}
console.log("\n반입 전 확인: 이 번들을 깨끗한 환경에서 docker load 로 되살려 기동해 볼 것.\n");

function installDoc() {
  return `# NH위드캔버스 설치 (폐쇄망)

- 버전: ${VERSION}
- 커밋: ${sha}
- 빌드: ${buildTime}
- 플랫폼: ${PLATFORM}

이 번들의 이미지는 **실행 전용**이다. 빌더 스테이지가 포함되어 있지 않으므로
폐쇄망에서 재빌드할 수 없다. 코드가 바뀌면 개발망에서 번들을 다시 만들어 반입한다.

## 1. 무결성 확인

\`\`\`bash
sha256sum -c checksums.txt
\`\`\`

## 2. 이미지 적재

\`\`\`bash
docker load -i images.tar
docker images | grep -E 'nh-canvas-backend|postgres'
\`\`\`

베이스 이미지(temurin, postgres) 레이어가 tar 에 포함되어 있어 별도 pull 이 필요 없다.

## 3. 사내 Registry 에 등록 (Registry 를 쓰는 경우)

\`\`\`bash
docker tag nh-canvas-backend:${VERSION} <사내registry>/nh-canvas-backend:${VERSION}
docker push <사내registry>/nh-canvas-backend:${VERSION}
\`\`\`

Registry 를 쓰면 \`docker-compose.yml\` 의 \`image:\` 도 그 주소로 바꾼다.

## 4. 설정

\`\`\`bash
cp .env.example .env
\`\`\`

\`.env\` 를 열어 최소한 \`DB_PASSWORD\` 를 채운다.
\`.env\` 는 **절대 저장소나 공유 폴더에 올리지 않는다.**

| 키 | 비고 |
|---|---|
| \`DB_PASSWORD\` | 필수 |
| \`AUTH_PROVIDER\` | 사내 SSO 구현 전까지 \`dev\`. **운영 전환 시 \`sso\` 로 바꿔야 한다** |
| \`LLM_ENABLED\` | 승인 LLM endpoint 확정 전까지 \`false\` |
| \`HOST_PORT\` | Reverse Proxy 가 붙는 포트 |

## 5. 기동

\`\`\`bash
docker compose up -d
docker compose ps
\`\`\`

DB 스키마는 백엔드 기동 시 Flyway 가 적용한다. 초기화 SQL 을 따로 돌리지 않는다.
DBA 사전 검토가 필요하면 \`backend/src/main/resources/db/migration/\` 의 SQL 을 제출한다.

## 6. 확인

\`\`\`bash
curl -fsS http://localhost:\${HOST_PORT:-8080}/actuator/health
\`\`\`

\`{"status":"UP"}\` 이면 정상이다. 첫 기동은 Flyway 때문에 수십 초 걸릴 수 있다.

## 7. 데이터 위치

| 볼륨 | 내용 | 백업 대상 |
|---|---|---|
| \`db-data\` | PostgreSQL | 예 |
| \`file-storage\` | 업로드 원본·생성 산출물 | 예 |

두 볼륨은 함께 백업·복구해야 한다. 따로 복구하면 DB 메타데이터와 실제 파일이 어긋난다.

### 파일 저장소를 NFS 등 바인드 마운트로 바꿀 때 (주의)

\`docker-compose.yml\` 은 기본값으로 **이름 있는 볼륨**(\`file-storage\`)을 쓴다. 이 경우 Docker 가
이미지의 소유권(uid 10001)을 그대로 가져가므로 별도 조치가 필요 없다.

호스트 경로나 NFS 를 바인드 마운트로 바꾸면 **호스트 쪽 소유권이 그대로 적용된다.**
컨테이너는 uid 10001(canvas)로 돌고, 앱은 기동 시 이 디렉터리를 만들려 시도하며
**실패하면 기동 자체가 중단된다.** 반입 후 첫 기동이 원인 불명으로 죽는 전형적인 경우다.

\`\`\`bash
# 바인드 마운트를 쓸 경우, 호스트에서 미리
sudo mkdir -p /srv/nh-canvas/storage
sudo chown -R 10001:10001 /srv/nh-canvas/storage
\`\`\`

\`\`\`yaml
# docker-compose.yml
    volumes:
      - /srv/nh-canvas/storage:/var/storage
\`\`\`

소유권을 바꿀 수 없는 NFS 라면 compose 에서 실행 uid 를 맞춘다.

\`\`\`yaml
    user: "<NFS가 허용하는 uid>:<gid>"
\`\`\`

## 알려진 제약

- \`AUTH_PROVIDER=dev\` 는 요청 헤더의 사용자 식별자를 그대로 믿는다. **운영 사용 불가.**
- 인스턴스를 여러 개 띄우려면 \`file-storage\` 가 공유 마운트(NFS 등)여야 한다. 위 소유권 주의를 함께 볼 것.
- 이미지는 실행 전용이다. 폐쇄망에서 재빌드할 수 없다.
`;
}
