package com.nh.canvas.file;

import java.util.HexFormat;
import java.util.List;
import java.util.Map;

/**
 * 확장자·MIME 위장 검사 (SECURITY_CHECKLIST 0절 · 5절).
 *
 * <p>클라이언트가 보낸 {@code Content-Type} 과 파일명은 <b>둘 다 사용자 입력</b>이다.
 * 실제 바이트의 시그니처와 맞는지 확인해, 확장자만 바꾼 실행 파일이 통과하는 경로를 막는다.
 *
 * <p>텍스트 계열에는 시그니처가 없다. 대신 저장 시 확장자를 서버가 다시 붙이고
 * 다운로드를 {@code Content-Disposition: attachment} 로 강제해 브라우저가 실행하지 않게 한다.
 */
final class FileTypeSniffer {

    private FileTypeSniffer() {}

    /** 시그니처가 있는 유형만 검사 대상이다. 없는 유형은 통과시키되 별도 방어를 건다. */
    private static final Map<String, List<byte[]>> SIGNATURES = Map.of(
            "application/pdf", List.of(bytes("25504446")),                       // %PDF
            "image/png", List.of(bytes("89504E470D0A1A0A")),
            "image/jpeg", List.of(bytes("FFD8FF")),
            "image/gif", List.of(bytes("474946383761"), bytes("474946383961")),  // GIF87a / GIF89a
            "image/webp", List.of(bytes("52494646")),                            // RIFF (뒤 8바이트에 WEBP)
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            List.of(bytes("504B0304"), bytes("504B0506"), bytes("504B0708")),    // OOXML = ZIP
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            List.of(bytes("504B0304"), bytes("504B0506"), bytes("504B0708")),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            List.of(bytes("504B0304"), bytes("504B0506"), bytes("504B0708")));

    static final int PEEK_BYTES = 16;

    static boolean matches(String contentType, byte[] head) {
        List<byte[]> expected = SIGNATURES.get(contentType);
        if (expected == null) {
            return true;
        }
        return expected.stream().anyMatch(signature -> startsWith(head, signature));
    }

    static boolean hasSignature(String contentType) {
        return SIGNATURES.containsKey(contentType);
    }

    private static boolean startsWith(byte[] head, byte[] signature) {
        if (head.length < signature.length) {
            return false;
        }
        for (int i = 0; i < signature.length; i++) {
            if (head[i] != signature[i]) {
                return false;
            }
        }
        return true;
    }

    private static byte[] bytes(String hex) {
        return HexFormat.of().parseHex(hex);
    }
}
