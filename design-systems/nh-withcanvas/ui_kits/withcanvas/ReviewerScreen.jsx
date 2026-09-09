const { TopBar, Button, Badge, Field, Artboard, ArtboardStage, ModeToggle,
        Filmstrip, CommentCard, Icon, Card, Chip } = window.NHDesignSystem_dafb17;

const TAGS = ["구현 가능","상태 정의 필요","API 응답 확인","예외 처리 필요","기간 협의 필요"];

/**
 * 개발 담당자(IT)의 화면. 기획자 화면과 다른 점:
 * 판을 만들거나 반영을 결정하는 버튼이 없다. 짚고, 구현 관점을 태그와 함께 남긴다.
 */
function ReviewerScreen({go}){
  const [mode,setMode] = React.useState("pick");
  const [screen,setScreen] = React.useState(2);
  const [text,setText] = React.useState("");
  const [tag,setTag] = React.useState("상태 정의 필요");
  const [sent,setSent] = React.useState([]);
  const send = () => { if(text.trim()){ setSent([{body:text.trim(),tag},...sent]); setText(""); } };
  const seen = 3 + sent.length;

  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",background:"var(--surface-canvas)"}}>
      <TopBar title="비대면 계좌 신청 개선" status="의견 모으는 중" logoSrc="../../assets/nh-symbol-bank.jpg" user="이준호"
        note="9월 12일까지 · 개발 담당자로 보고 있습니다"
        right={<Button tone="primary" size="sm" onClick={()=>go("list")}>검토 마치기</Button>} />

      <div style={{background:"var(--info-bg)",borderBottom:"1px solid var(--info-border)",padding:"var(--sp-3) var(--sp-6)",display:"flex",alignItems:"center",gap:10}}>
        <Icon name="info" size={16} color="var(--nh-blue)" />
        <p style={{fontSize:"var(--fs-body-sm)",color:"var(--info-fg)"}}>
          김민준님이 물어본 것 — <b>구현할 수 있는지, 빠진 상태가 없는지.</b> 화면 8개를 넘겨보며 걸리는 곳을 눌러 한 줄 남겨주세요.
        </p>
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:10}}>
          <span style={{font:"var(--type-caption)",color:"var(--info-fg)"}}>{Math.min(seen,8)} / 8 확인</span>
          <div style={{width:110,height:5,borderRadius:99,background:"var(--white)"}}>
            <div style={{width:`${Math.min(seen,8)/8*100}%`,height:"100%",borderRadius:99,background:"var(--nh-blue)"}} />
          </div>
        </div>
      </div>

      <div style={{display:"flex",flex:1,minHeight:0}}>
        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
          <div style={{padding:"var(--sp-4) var(--sp-6)",background:"var(--surface-card)",borderBottom:"1px solid var(--border-hairline)",display:"flex",justifyContent:"center"}}>
            <ModeToggle value={mode} onChange={setMode} note="모드는 이 두 개뿐입니다"
              options={[{value:"view",label:"보기",icon:"eye"},{value:"pick",label:"짚기",icon:"hand"}]} />
          </div>
          <ArtboardStage>
            <Artboard kind="mobile" width={300} height={560} title="비대면 계좌 신청" picking={mode==="pick"}>
              <AccountMock />
            </Artboard>
          </ArtboardStage>
          <Filmstrip current={screen} onSelect={setScreen} items={[{},{},{},{},{},{},{},{}]}
            right={<>
              <Button size="sm" onClick={()=>setScreen(Math.max(0,screen-1))}>이전 화면</Button>
              <Button size="sm" onClick={()=>setScreen(Math.min(7,screen+1))}>다음 화면</Button>
            </>} />
        </div>

        <Panel title="남긴 의견" count={2+sent.length}>
          <div style={{background:"var(--ink-50)",borderRadius:"var(--r-sm)",padding:"var(--sp-4)"}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:"var(--sp-3)"}}>
              <Icon name="hand" size={14} color="var(--nh-blue)" />
              <span style={{font:"var(--type-caption)",color:"var(--text-muted)"}}>짚은 곳</span>
              <span style={{font:"var(--type-label)",color:"var(--text-title)"}}>약관 동의 영역</span>
            </div>

            <div style={{background:"var(--white)",border:"1px solid var(--border-hairline)",borderRadius:"var(--r-xs)",padding:"var(--sp-3)",marginBottom:"var(--sp-3)"}}>
              {[["요소","체크박스 3개 · 목록"],["연결 화면","없음 (다음 → 화면 4)"],["기획서 근거","화면정의서 3-2 약관동의"]].map(([k,v])=>
                <div key={k} style={{display:"flex",gap:8,marginTop:3}}>
                  <span style={{font:"var(--type-caption)",color:"var(--text-faint)",width:60,flexShrink:0}}>{k}</span>
                  <span style={{font:"var(--type-caption)",fontWeight:700,color:"var(--ink-700)"}}>{v}</span>
                </div>)}
            </div>

            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:"var(--sp-3)"}}>
              {TAGS.map(t=><Chip key={t} selected={tag===t} onClick={()=>setTag(t)} style={{minHeight:30,padding:"0 11px",fontSize:12}}>{t}</Chip>)}
            </div>

            <Field multiline rows={2} value={text} onChange={e=>setText(e.target.value)}
              placeholder="예: 필수·선택 구분이 필요한데 어느 항목이 필수인지 기획서에도 없습니다" />
            <div style={{display:"flex",alignItems:"center",gap:"var(--gap-inline)",marginTop:"var(--sp-3)"}}>
              <Button size="sm"><Icon name="mic" size={14} />말로 하기</Button>
              <Button tone="primary" size="sm" style={{marginLeft:"auto"}} onClick={send}>남기기</Button>
            </div>
            <p style={{font:"var(--type-caption)",color:"var(--text-faint)",marginTop:8}}>디자인 용어는 몰라도 됩니다. 반영 여부는 기획 담당자가 결정합니다</p>
          </div>

          {sent.map((s,i)=>
            <div key={i}>
              <CommentCard author="이준호" pin={3+i} where={s.tag} body={s.body} time="방금" />
            </div>)}

          <CommentCard author="이준호" pin={1} where="상태 정의 필요"
            body="약관 3개 중 어느 것이 필수인지 기획서에 없습니다. 필수 미동의 상태에서 다음을 누르면 어떻게 되는지도 정의가 필요합니다." time="12분 전" />
          <CommentCard author="박선영" pin={2} where="문구"
            body={'"발생할 수 있습니다"만 있고 얼마인지가 없어서 고객이 다시 물어볼 것 같습니다.'} time="28분 전" />

          <Card surface="ai" style={{padding:"var(--sp-4)"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <Badge tone="ai">AI</Badge>
              <span style={{font:"var(--type-label)",color:"var(--text-title)"}}>이렇게 정리해서 담을게요</span>
            </div>
            {[["대상","약관 동의 목록 3개 항목"],["유형","상태 정의 누락 — 필수·선택 구분 없음"],["개발 영향","미동의 시 분기 처리 1건 추가"],["제안","항목 앞에 [필수]·[선택] 표기 + 미동의 안내"]].map(([k,v])=>
              <div key={k} style={{display:"flex",gap:10,marginTop:5}}>
                <span style={{font:"var(--type-caption)",color:"var(--text-muted)",width:56,flexShrink:0}}>{k}</span>
                <span style={{fontSize:"var(--fs-body-sm)",fontWeight:700,color:"var(--text-title)"}}>{v}</span>
              </div>)}
            <p style={{font:"var(--type-caption)",color:"var(--text-faint)",marginTop:10}}>
              담기면 기획 담당자가 반영·보류·반려를 결정합니다. 검토자는 결정하지 않습니다.
            </p>
          </Card>
        </Panel>
      </div>
    </div>
  );
}
Object.assign(window, { ReviewerScreen });
