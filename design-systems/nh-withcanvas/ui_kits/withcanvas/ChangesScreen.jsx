const { TopBar, Button, Artboard, ArtboardStage, DiffSlider, ChangeItem, Card } = window.NHDesignSystem_dafb17;

/** 무엇이 바뀌었나 — Version 비교를 "판"과 "바뀜"이라는 말로 바꿔 보여준다. */
function ChangesScreen({go}){
  const [v,setV] = React.useState(52);
  const board = (fixed) => (
    <Artboard kind="mobile" width={300} height={560} title="비대면 계좌 신청">
      <AccountMock fixed={fixed} pins={false} />
    </Artboard>
  );
  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",background:"var(--surface-canvas)"}}>
      <TopBar title="고객 포털 리뉴얼" crumb="무엇이 바뀌었나" logoSrc="../../assets/nh-symbol-bank.jpg" user="김민준"
        note="Version · History · Export 라는 말을 쓰지 않습니다"
        right={<><Button size="sm" onClick={()=>go("workspace")}>기록</Button><Button size="sm">내려받기</Button></>} />

      <div style={{display:"flex",flex:1,minHeight:0}}>
        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
          <div style={{padding:"var(--sp-4) var(--sp-6)",background:"var(--surface-card)",borderBottom:"1px solid var(--border-hairline)",display:"flex",alignItems:"center",gap:"var(--sp-4)",justifyContent:"center"}}>
            <span style={{font:"var(--type-label)",color:"var(--text-faint)"}}>3번째 판</span>
            <span style={{color:"var(--ink-300)"}}>→</span>
            <span style={{font:"var(--type-label)",color:"var(--nh-blue)"}}>4번째 판 (지금)</span>
          </div>
          <ArtboardStage>
            <DiffSlider value={v} onChange={setV} before={board(false)} after={board(true)} />
          </ArtboardStage>
          <div style={{background:"var(--surface-card)",borderTop:"1px solid var(--border-hairline)",padding:"var(--sp-4) var(--sp-6)",display:"flex",alignItems:"center",gap:"var(--sp-3)"}}>
            <span style={{font:"var(--type-caption)",color:"var(--text-faint)"}}>판 고르기</span>
            {[["1번째 판","9/2 첫 초안"],["2번째 판","9/4 문구 수정"],["3번째 판","9/6 비교 대상"],["4번째 판","9/8 지금 보는 것"]].map(([t,s],i)=>
              <button key={t} type="button" style={{
                textAlign:"left",padding:"8px 12px",borderRadius:"var(--r-control)",cursor:"pointer",
                background:"var(--white)",border:i===3?"var(--bw-emphasis) solid var(--nh-blue)":"1px solid var(--border-default)"
              }}>
                <div style={{font:"var(--type-label)",color:i===3?"var(--nh-blue)":"var(--text-title)"}}>{t}</div>
                <div style={{font:"var(--type-caption)",color:"var(--text-faint)"}}>{s}</div>
              </button>)}
          </div>
        </div>

        <Panel title="이번에 바뀐 것 3가지">
          <p style={{font:"var(--type-caption)",color:"var(--text-muted)"}}>무엇이 · 누구 의견으로 · 어떤 결정으로 바뀌었는지 한 줄로 붙여둡니다.</p>
          <ChangeItem index={1} what="약관에 필수·선택 표시가 붙었습니다" who="박선영" />
          <ChangeItem index={2} what="수수료 안내에 숫자를 넣었습니다" who="금융소비자보호" byAI />
          <ChangeItem index={3} what={'버튼 문구를 "신청하기"로 바꿨습니다'} who="이준호" />
          <Card surface="quiet">
            <p style={{font:"var(--type-label)",color:"var(--text-title)",marginBottom:4}}>반영하지 않은 의견 2건</p>
            <p style={{font:"var(--type-caption)",color:"var(--text-muted)"}}>보류한 이유가 같이 남아 있어, 다음에 왜 안 했는지 다시 묻지 않게 됩니다.</p>
          </Card>
        </Panel>
      </div>
    </div>
  );
}
Object.assign(window, { ChangesScreen });
