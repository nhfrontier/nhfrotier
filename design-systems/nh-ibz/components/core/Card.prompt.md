The base container for every NH기업뱅킹 surface: white, 1px light border, 10px radius, soft shadow.

```jsx
<Card arrow interactive accent="green">
  <h3>NH BOX</h3>
  <p>잔여 포인트 12,400 P</p>
</Card>
```

- `arrow` + `interactive` together signal "click to navigate" (the ↗ pattern).
- `accent="blue|green|navy"` adds a 3px top bar to categorize cards (e.g. green for NH BOX).
- Default padding is `--space-6` (24px); reduce for dense list cards.
