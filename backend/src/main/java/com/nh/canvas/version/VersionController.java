package com.nh.canvas.version;

import com.nh.canvas.auth.AuthenticatedUser;
import com.nh.canvas.auth.CurrentUser;
import com.nh.canvas.common.web.CursorPage;
import com.nh.canvas.version.VersionRepository.VersionRow;
import com.nh.canvas.version.VersionService.CompareResult;
import com.nh.canvas.version.VersionService.VersionDetail;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class VersionController {

    private final VersionService service;

    public VersionController(VersionService service) {
        this.service = service;
    }

    @GetMapping("/projects/{projectId}/versions")
    public CursorPage<VersionRow> list(@CurrentUser AuthenticatedUser user, @PathVariable UUID projectId,
                                       @RequestParam(required = false) Integer cursor,
                                       @RequestParam(required = false) Integer limit) {
        return service.list(user, projectId, cursor, limit);
    }

    @GetMapping("/versions/{versionId}")
    public VersionDetail get(@CurrentUser AuthenticatedUser user, @PathVariable UUID versionId) {
        return service.get(user, versionId);
    }

    @GetMapping("/versions/{versionId}/compare")
    public CompareResult compare(@CurrentUser AuthenticatedUser user, @PathVariable UUID versionId,
                                 @RequestParam UUID baseVersionId) {
        return service.compare(user, versionId, baseVersionId);
    }
}
