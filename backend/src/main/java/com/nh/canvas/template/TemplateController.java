package com.nh.canvas.template;

import com.nh.canvas.auth.AuthenticatedUser;
import com.nh.canvas.auth.CurrentUser;
import com.nh.canvas.template.TemplateService.TemplateDetail;
import com.nh.canvas.template.TemplateService.TemplateRow;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class TemplateController {

    private final TemplateService service;

    public TemplateController(TemplateService service) {
        this.service = service;
    }

    /** {@code ?type=BRAND_ASSET} 가 곧 디자인 시스템 목록이다 (05_API_DB_SPEC 9-1절). */
    @GetMapping("/templates")
    public List<TemplateRow> list(@CurrentUser AuthenticatedUser user,
                                  @RequestParam(required = false) String type) {
        return service.list(user, type);
    }

    @GetMapping("/templates/{templateId}")
    public TemplateDetail get(@CurrentUser AuthenticatedUser user, @PathVariable UUID templateId) {
        return service.get(user, templateId);
    }
}
