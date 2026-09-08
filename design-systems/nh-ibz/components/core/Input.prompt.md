Labeled text input. 46px tall, border turns NH-blue with a focus ring.

```jsx
<Input label="아이디" placeholder="아이디를 입력하세요" />
<Input label="이체금액" suffix="원" type="number" />
<Input label="비밀번호" type="password" error="비밀번호를 확인하세요" />
```

- Use `suffix="원"` for currency entry; `prefix` for icons.
- Pair with `Button variant="navy"` in login forms.
