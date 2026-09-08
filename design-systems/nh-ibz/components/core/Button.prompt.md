Brand action button — solid NH-blue `primary`, deep `navy` (login/secure flows), `outline`/`secondary`/`ghost` for lower emphasis, and `accent` (NH green).

```jsx
<Button variant="primary" size="lg">조회하기</Button>
<Button variant="navy" block>로그인</Button>
<Button variant="outline" iconRight={<span>↗</span>}>자세히</Button>
```

- Sizes: `sm` 36px · `md` 44px · `lg` 52px.
- Use `navy` for login and security-sensitive confirmations; `primary` for everyday actions; keep one primary per view.
- For inline "자세히보기 >" text links use `LinkButton` instead.
