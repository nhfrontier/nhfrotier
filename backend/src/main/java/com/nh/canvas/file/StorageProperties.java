package com.nh.canvas.file;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.Set;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "canvas.storage")
public class StorageProperties {

    /** local | (추후) nfs · s3. 종류가 미결이라 인터페이스 뒤에 둔다 (ARCHITECTURE 7절) */
    private String type = "local";
    private String localRoot = "./var/storage";
    private long maxBytes = 52_428_800L;
    private String allowedContentTypes = "";

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getLocalRoot() {
        return localRoot;
    }

    public void setLocalRoot(String localRoot) {
        this.localRoot = localRoot;
    }

    public long getMaxBytes() {
        return maxBytes;
    }

    public void setMaxBytes(long maxBytes) {
        this.maxBytes = maxBytes;
    }

    public String getAllowedContentTypes() {
        return allowedContentTypes;
    }

    public void setAllowedContentTypes(String allowedContentTypes) {
        this.allowedContentTypes = allowedContentTypes;
    }

    public Set<String> allowedContentTypeSet() {
        return Arrays.stream(allowedContentTypes.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));
    }
}
