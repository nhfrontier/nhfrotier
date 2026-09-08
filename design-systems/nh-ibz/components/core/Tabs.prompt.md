Tab bar for switching panels. `underline` for page/section level, `pill` for compact in-card toggles.

```jsx
<Tabs items={[{label:"전체",value:"all"},{label:"입금",value:"in"},{label:"출금",value:"out"}]} />
<Tabs variant="pill" items={[{label:"일별",value:"d"},{label:"월별",value:"m"}]} />
```

- Controlled via `value`+`onChange`, or leave uncontrolled (defaults to first item).
