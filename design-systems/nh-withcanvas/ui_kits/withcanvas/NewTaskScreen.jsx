const { TopBar, Button, Card, Chip, ChoiceCard, Badge, Icon } = window.NHDesignSystem_dafb17;

const KINDS = [["앱 화면","올원뱅크 같은 모바일","smartphone"],["웹 화면","기업뱅킹 같은 PC","monitor"],["카드·홍보물","실물 시안, 포스터","credit-card"],["보고서","문서, 발표자료","file-text"]];
const WHO = ["40~60대 개인 고객","20~30대 개인 고객","법인·기업 담당자","영업점 직원","경영진 보고"];
const FEEL = ["쉽고 친절하게","믿음직하게","군더더기 없이","활기차게","차분하게"];

/** 새 작업 = 세 가지만 묻는다. 빈 프롬프트 칸을 주지 않는다. */
function NewTaskScreen({go}){
  const [kind,setKind] = React.useState("앱 화면");
  const [who,setWho] = React.useState("40~60대 개인 고객");
  const [feel,setFeel] = React.useState("쉽고 친절하게");
  const step = (n,label,extra) => (
    <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:"var(--sp-4)"}}>
      <span style={{font:"var(--type-caption)",fontWeight:800,color:"var(--nh-blue)"}}>{n}</span>
      <span style={{font:"var(--type-card-title)",color:"var(--text-title)"}}>{label}</span>
      {extra ? <span style={{font:"var(--type-caption)",color:"var(--text-faint)"}}>{extra}</span> : null}
    </div>
  );
  return (
    <div style={{minHeight:"100%",background:"var(--surface-canvas)",display:"flex",flexDirection:"column"}}>
      <TopBar title="새 작업" logoSrc="../../assets/nh-symbol-bank.jpg" user="김민준"
        note="언제든 그만두고 나중에 이어서 할 수 있습니다"
        right={<Button size="sm" onClick={()=>go("list")}>나중에</Button>} />

      <div style={{flex:1,maxWidth:820,width:"100%",margin:"0 auto",padding:"var(--sp-12) var(--pad-page)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
          <h1>세 가지만 물어볼게요</h1>
          <Badge tone="ok">약 40초</Badge>
        </div>
        <p style={{color:"var(--text-muted)",marginBottom:"var(--sp-8)"}}>
          무엇을 쓸지 몰라 빈 칸을 마주하지 않도록, 고르기만 하면 되게 했습니다. 프롬프트를 쓰지 않아도 됩니다.
        </p>

        <div style={{display:"flex",flexDirection:"column",gap:"var(--sp-4)"}}>
          <Card>
            {step("01","무엇을 만드시나요?")}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"var(--sp-3)"}}>
              {KINDS.map(([l,h,ic])=>
                <ChoiceCard key={l} label={l} hint={h} icon={<Icon name={ic} size={18} />} selected={kind===l} onClick={()=>setKind(l)} />)}
            </div>
          </Card>

          <Card>
            {step("02","누가 보게 되나요?")}
            <div style={{display:"flex",gap:"var(--gap-inline)",flexWrap:"wrap"}}>
              {WHO.map(t=><Chip key={t} selected={who===t} onClick={()=>setWho(t)}>{t}</Chip>)}
            </div>
          </Card>

          <Card>
            {step("03","어떤 느낌이면 좋을까요?","디자인 용어는 쓰지 않습니다")}
            <div style={{display:"flex",gap:"var(--gap-inline)",flexWrap:"wrap"}}>
              {FEEL.map(t=><Chip key={t} selected={feel===t} onClick={()=>setFeel(t)}>{t}</Chip>)}
            </div>
          </Card>
        </div>
      </div>

      <div style={{background:"var(--surface-card)",borderTop:"1px solid var(--border-hairline)",padding:"var(--sp-5) var(--pad-page)",display:"flex",alignItems:"center",gap:"var(--sp-4)"}}>
        <div style={{maxWidth:640}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
            <Badge tone="ai">AI</Badge>
            <span style={{font:"var(--type-caption)",color:"var(--text-muted)"}}>이렇게 알아들었습니다</span>
          </div>
          <p style={{font:"var(--type-body)",fontWeight:700,color:"var(--text-title)"}}>
            {who}이 보는 {kind}을, {feel.replace("하게","한")} 말투로 만듭니다.
          </p>
          <p style={{font:"var(--type-caption)",color:"var(--text-faint)",marginTop:4}}>
            참고자료·브랜드 자산은 알아서 고릅니다. <a href="#" onClick={e=>e.preventDefault()}>직접 고르기</a>
          </p>
        </div>
        <Button tone="primary" size="lg" style={{marginLeft:"auto"}} onClick={()=>go("workspace")}>화면 만들기</Button>
      </div>
    </div>
  );
}
Object.assign(window, { NewTaskScreen });
