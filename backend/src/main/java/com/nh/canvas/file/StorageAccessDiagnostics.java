package com.nh.canvas.file;

import java.nio.file.Files;
import java.nio.file.Path;

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
        String uid = currentUid();
        Path existing = nearestExisting(root);
        Path chownTarget = existing == null ? root : existing;

        StringBuilder message = new StringBuilder()
                .append("파일 저장소 디렉터리를 ").append(verb).append(" 없습니다: ").append(root)
                .append("\n  실행 계정: ").append(System.getProperty("user.name", "알 수 없음"));
        if (uid != null) {
            message.append(" (uid ").append(uid).append(')');
        }

        if (existing != null) {
            message.append("\n  존재하는 상위 경로: ").append(existing)
                    .append(" (소유 ").append(ownerOf(existing))
                    .append(", 쓰기 ").append(Files.isWritable(existing) ? "가능" : "불가").append(')');
        }

        message.append("\n  조치: ");
        if (uid != null) {
            // uid 를 알 때만 그대로 붙여 넣을 수 있는 명령을 준다
            message.append("호스트에서 `chown -R ").append(uid).append(":<gid> ").append(chownTarget)
                    .append("` 하거나, 소유권을 바꿀 수 없는 저장소라면 컨테이너 실행 uid 를 맞추십시오")
                    .append(" (docker-compose 의 `user:`).");
        } else {
            message.append(chownTarget)
                    .append(" 를 실행 계정이 쓸 수 있게 하십시오.")
                    .append(" 컨테이너로 띄운 경우라면 바인드 마운트한 호스트 디렉터리의 소유권을")
                    .append(" 컨테이너 실행 uid 에 맞춰야 합니다 (기본 이미지는 uid 10001).");
        }
        return message.toString();
    }

    /**
     * 리눅스에서는 {@code /proc/self} 의 소유자가 곧 프로세스의 uid 다.
     * 다른 OS 에는 이 경로가 없다.
     *
     * @return 알아내지 못하면 null. <b>"알 수 없음" 같은 문자열을 돌려주지 않는다</b> —
     *         그 값이 chown 명령에 그대로 들어가면 실행할 수 없는 안내가 된다
     */
    private static String currentUid() {
        try {
            return String.valueOf(Files.getAttribute(Path.of("/proc/self"), "unix:uid"));
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
