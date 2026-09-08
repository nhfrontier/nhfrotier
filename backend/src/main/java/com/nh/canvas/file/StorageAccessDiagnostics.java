package com.nh.canvas.file;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

/**
 * 파일 저장소 접근 실패의 원인을 <b>메시지 안에서</b> 알 수 있게 만든다.
 *
 * <p>폐쇄망 반입 후 첫 기동이 죽는 가장 흔한 이유가 이것이다 — 컨테이너는 비루트(uid 10001)로
 * 도는데 바인드 마운트한 호스트 디렉터리가 root 소유라 쓰지 못한다. 기본 메시지("디렉터리를
 * 만들 수 없습니다")만 남으면 현장에서 원인을 찾는 데 시간이 걸리므로,
 * <b>어느 경로에 · 어떤 계정(uid)으로 접근하려다 · 실제 소유자는 누구인지</b>를 함께 적는다.
 *
 * <p>진단이 실패해도 원래 오류를 가리지 않는다. 알아내지 못한 항목은 "알 수 없음"으로 남긴다.
 */
final class StorageAccessDiagnostics {

    private StorageAccessDiagnostics() {}

    static String describe(Path root, String verb) {
        Long uid = currentUid();
        Long hostUid = uid == null ? null : hostUidOf(uid);
        Path existing = nearestExisting(root);
        Path chownTarget = existing == null ? root : existing;

        StringBuilder message = new StringBuilder()
                .append("파일 저장소 디렉터리를 ").append(verb).append(" 없습니다: ").append(root)
                .append("\n  실행 계정: ").append(System.getProperty("user.name", "알 수 없음"));
        if (uid != null) {
            message.append(" (uid ").append(uid);
            if (hostUid != null && !hostUid.equals(uid)) {
                // user namespace 가 걸려 있다. 호스트에서 보는 uid 는 다른 값이다
                message.append(", 호스트 uid ").append(hostUid);
            }
            message.append(')');
        }

        if (existing != null) {
            message.append("\n  존재하는 상위 경로: ").append(existing)
                    .append(" (소유 ").append(ownerOf(existing))
                    .append(", 쓰기 ").append(Files.isWritable(existing) ? "가능" : "불가").append(')');
        }

        message.append("\n  조치: ");
        if (hostUid != null) {
            // chown 은 호스트에서 실행하므로 호스트 기준 uid 를 준다
            message.append("호스트에서 `chown -R ").append(hostUid).append(":<gid> ").append(chownTarget)
                    .append("` 하거나, 소유권을 바꿀 수 없는 저장소라면 컨테이너 실행 uid 를 맞추십시오")
                    .append(" (docker-compose 의 `user:`).");
        } else {
            message.append(chownTarget)
                    .append(" 를 실행 계정이 쓸 수 있게 하십시오.");
            if (uid != null) {
                // uid 는 읽었지만 호스트 값으로 번역하지 못한 경우. 틀린 명령을 주느니 사실을 말한다
                message.append(" 이 프로세스는 uid ").append(uid)
                        .append(" 로 돌지만 user namespace 매핑을 해석하지 못해")
                        .append(" 호스트에서의 uid 를 알 수 없습니다 — `/proc/self/uid_map` 을 보고 번역하십시오.");
            } else {
                message.append(" 컨테이너로 띄운 경우라면 바인드 마운트한 호스트 디렉터리의 소유권을")
                        .append(" 컨테이너 실행 uid 에 맞춰야 합니다 (기본 이미지는 uid 10001).");
            }
        }
        return message.toString();
    }

    /**
     * 컨테이너 안 uid 를 <b>호스트에서 보이는 uid</b> 로 옮긴다.
     *
     * <p>{@code chown} 안내는 호스트에서 실행하는 명령이다. userns-remap·rootless 환경에서는
     * 컨테이너 안 10001 이 호스트에서 165545 처럼 다른 값이 되므로, 컨테이너 uid 를 그대로 적으면
     * <b>그럴듯하지만 틀린 안내</b>가 된다. uid 를 못 읽는 경우보다 이쪽이 더 위험하다 —
     * 읽히긴 하니 사용자가 의심하지 않는다.
     *
     * <p>{@code /proc/self/uid_map} 은 "안쪽시작 바깥쪽시작 개수" 줄들이다. 매핑되지 않는 uid 이거나
     * 파일을 읽지 못하면 null 을 돌려주고, 호출부는 chown 명령 대신 다른 문장으로 빠진다.
     */
    private static Long hostUidOf(long containerUid) {
        try {
            return mapUid(containerUid, Files.readAllLines(Path.of("/proc/self/uid_map")));
        } catch (Exception ex) {
            return null;
        }
    }

    /**
     * {@code /proc/self/uid_map} 해석. 파일 입출력과 떼어 두어 매핑 규칙만 따로 시험할 수 있게 한다 —
     * 이 계산이 틀리면 <b>그럴듯하지만 틀린 chown 명령</b>이 나가므로 눈으로 확인하는 것으로 부족하다.
     *
     * @param lines "안쪽시작 바깥쪽시작 개수" 줄들. 형식이 깨진 줄은 건너뛴다
     * @return 매핑되지 않는 uid 이면 null
     */
    static Long mapUid(long containerUid, List<String> lines) {
        for (String line : lines) {
            String[] parts = line.trim().split("\\s+");
            if (parts.length != 3) {
                continue;
            }
            try {
                long insideStart = Long.parseLong(parts[0]);
                long outsideStart = Long.parseLong(parts[1]);
                long count = Long.parseLong(parts[2]);
                if (containerUid >= insideStart && containerUid - insideStart < count) {
                    return outsideStart + (containerUid - insideStart);
                }
            } catch (NumberFormatException ex) {
                // 숫자가 아닌 줄은 우리가 아는 형식이 아니다. 추측하지 않고 넘어간다
            }
        }
        return null;
    }

    /**
     * 리눅스에서는 {@code /proc/self} 의 소유자가 곧 프로세스의 uid 다. 다른 OS 에는 이 경로가 없다.
     *
     * <p><b>심볼릭 링크를 따라가야 한다.</b> {@code /proc/self} 링크 자체는 root 소유이고,
     * 따라간 끝의 {@code /proc/<pid>} 가 프로세스 uid 를 갖는다. Java 는 기본이 follow 라
     * 이대로 맞다 — {@code NOFOLLOW_LINKS} 를 주면 항상 0 이 나온다.
     * (쉘의 {@code stat -c %u /proc/self} 도 따라가지 않아 0 이므로, 그것으로 재현하려 하면 어긋난다.)
     *
     * @return 알아내지 못하면 null. <b>"알 수 없음" 같은 문자열을 돌려주지 않는다</b> —
     *         그 값이 chown 명령에 그대로 들어가면 실행할 수 없는 안내가 된다
     */
    private static Long currentUid() {
        try {
            Object uid = Files.getAttribute(Path.of("/proc/self"), "unix:uid");
            return uid instanceof Number number ? number.longValue() : null;
        } catch (Exception ex) {
            return null;
        }
    }

    /** 만들려던 경로가 없으면 그 위로 올라가며 실제로 존재하는 첫 조상을 찾는다. */
    private static Path nearestExisting(Path path) {
        for (Path candidate = path; candidate != null; candidate = candidate.getParent()) {
            if (Files.exists(candidate)) {
                return candidate;
            }
        }
        return null;
    }

    private static String ownerOf(Path path) {
        try {
            return Files.getOwner(path).getName();
        } catch (Exception ex) {
            return "알 수 없음";
        }
    }
}
