package com.nh.canvas.file;

import com.nh.canvas.auth.AuthenticatedUser;
import com.nh.canvas.auth.CurrentUser;
import com.nh.canvas.common.web.CursorPage;
import com.nh.canvas.file.FileRepository.FileRow;
import com.nh.canvas.file.FileService.DownloadHandle;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1")
public class FileController {

    private final FileService service;

    public FileController(FileService service) {
        this.service = service;
    }

    @GetMapping("/projects/{projectId}/files")
    public CursorPage<FileRow> list(@CurrentUser AuthenticatedUser user, @PathVariable UUID projectId,
                                    @RequestParam(required = false) String kind,
                                    @RequestParam(required = false) String cursor,
                                    @RequestParam(required = false) Integer limit) {
        return service.list(user, projectId, kind, cursor, limit);
    }

    @PostMapping("/projects/{projectId}/files")
    @ResponseStatus(HttpStatus.CREATED)
    public FileRow upload(@CurrentUser AuthenticatedUser user, @PathVariable UUID projectId,
                          @RequestParam("file") MultipartFile file) {
        return service.upload(user, projectId, file);
    }

    @GetMapping("/projects/{projectId}/files/{fileId}/content")
    public ResponseEntity<InputStreamResource> download(@CurrentUser AuthenticatedUser user,
                                                        @PathVariable UUID projectId,
                                                        @PathVariable UUID fileId) {
        return stream(service.download(user, fileId));
    }

    @GetMapping("/versions/{versionId}/files/{fileId}/content")
    public ResponseEntity<InputStreamResource> downloadVersionFile(@CurrentUser AuthenticatedUser user,
                                                                   @PathVariable UUID versionId,
                                                                   @PathVariable UUID fileId) {
        return stream(service.downloadVersionFile(user, versionId, fileId));
    }

    @DeleteMapping("/projects/{projectId}/files/{fileId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@CurrentUser AuthenticatedUser user, @PathVariable UUID projectId,
                       @PathVariable UUID fileId) {
        service.delete(user, projectId, fileId);
    }

    /**
     * 항상 {@code attachment} 로 내린다. inline 으로 주면 업로드된 HTML·SVG 가 우리 오리진에서
     * 실행되어 저장형 XSS 가 된다.
     */
    private ResponseEntity<InputStreamResource> stream(DownloadHandle handle) {
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
