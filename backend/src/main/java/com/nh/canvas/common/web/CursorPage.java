package com.nh.canvas.common.web;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.function.Function;

/**
 * 목록 응답의 공통 형태. {@code nextCursor} 가 null 이면 마지막 페이지다.
 */
public record CursorPage<T>(List<T> items, String nextCursor, boolean hasMore) {

    /**
     * limit + 1 건을 조회해 넘긴다. 초과분이 있으면 다음 페이지가 있다는 뜻이며,
     * 그 한 건은 잘라내고 마지막으로 남은 행에서 커서를 만든다.
     */
    public static <T> CursorPage<T> of(List<T> fetched, int limit,
                                       Function<T, Instant> createdAt, Function<T, UUID> id) {
        boolean hasMore = fetched.size() > limit;
        List<T> items = hasMore ? fetched.subList(0, limit) : fetched;
        String nextCursor = null;
        if (hasMore && !items.isEmpty()) {
            T last = items.get(items.size() - 1);
            nextCursor = Cursors.encode(createdAt.apply(last), id.apply(last));
        }
        return new CursorPage<>(List.copyOf(items), nextCursor, hasMore);
    }
}
