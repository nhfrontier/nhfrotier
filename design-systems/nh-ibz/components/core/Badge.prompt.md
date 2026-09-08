Small status / category chip. Defaults to a pale `soft` fill; set `soft={false}` for solid emphasis.

```jsx
<Badge tone="primary">신규</Badge>
<Badge tone="positive">입금</Badge>
<Badge tone="negative" soft={false}>지연</Badge>
```

- `positive` = 입금/증가, `negative` = 출금/경고, used in transaction rows.
- Keep labels 1–3 characters where possible (금융권 convention).
