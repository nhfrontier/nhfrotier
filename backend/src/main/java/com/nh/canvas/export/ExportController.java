package com.nh.canvas.export;

import com.nh.canvas.auth.AuthenticatedUser;
import com.nh.canvas.auth.CurrentUser;
import com.nh.canvas.export.ExportRepository.ExportRow;
import com.nh.canvas.export.ExportService.DownloadHandle;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class ExportController {

    private final ExportService service;

    public ExportController(ExportService service) {
        this.service = service;
    }

    public record ExportRequest(String format) {}

    /** 현재 지원 포맷은 ZIP(화면별 HTML 묶음) 하나다. */
    @PostMapping("/versions/{versionId}/exports")
    public ResponseEntity<ExportRow> request(@CurrentUser AuthenticatedUser user,
                                             @PathVariable UUID versionId,
                                             @RequestBody(required = false) ExportRequest request) {
        ExportRow export = service.request(user, versionId, request == null ? null : request.format());
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(export);
    }

    @GetMapping("/versions/{versionId}/exports")
    public List<ExportRow> list(@CurrentUser AuthenticatedUser user, @PathVariable UUID versionId) {
        return service.listByVersion(user, versionId);
    }

    @GetMapping("/exports/{exportId}")
    public ExportRow get(@CurrentUser AuthenticatedUser user, @PathVariable UUID exportId) {
        return service.get(user, exportId);
    }

    @GetMapping("/exports/{exportId}/download")
    public ResponseEntity<InputStreamResource> download(@CurrentUser AuthenticatedUser user,
                                                        @PathVariable UUID exportId) {
        DownloadHandle handle = service.download(user, exportId);
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(URLEncoder.encode(handle.meta().originalName(), StandardCharsets.UTF_8)
                        .replace("+", "%20"))
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_OCTET_STREAM_VALUE)
                .header("X-Content-Type-Options", "nosniff")
                .contentLength(handle.meta().byteSize())
                .body(new InputStreamResource(handle.content()));
    }
}
