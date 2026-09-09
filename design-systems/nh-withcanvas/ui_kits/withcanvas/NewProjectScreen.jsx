const { TopBar, Button, Card, Field, Chip, Badge, Avatar, Icon } = window.NHDesignSystem_dafb17;

const GROUPS = [
  {group:"화면 만들기",items:[
    {label:"앱 화면",icon:"smartphone",hint:"올원뱅크 같은 모바일"},
    {label:"웹 화면",icon:"monitor",hint:"기업뱅킹 같은 PC"},
    {label:"업무화면",icon:"layout-dashboard",hint:"행내 단말 화면"}
  ]},
  {group:"자료 만들기",items:[
    {label:"카드·홍보물",icon:"credit-card",hint:"실물 시안, 포스터"},
    {label:"보고서",icon:"file-text",hint:"문서, 발표자료"}
  ]},
  {group:"함께 보기",items:[
    {label:"기존 화면 검토",icon:"hand",hint:"이미 있는 화면에 의견 받기"},
    {label:"문구만 검토",icon:"message-square",hint:"안내 문구·약관 표현"}
  ]}
];

const MEMBERS = [
  {name:"김민준",role:"기획 담당자",note:"화면을 만들고 반영을 결정합니다"},
  {name:"이준호",role:"개발 담당자",note:"구현할 수 있는지 짚어줍니다"},
  {name:"박선영",role:"현업 담당자",note:"고객이 이해하는지 짚어줍니다"},
  {name:"최지우",role:"준법 담당자",note:"넘겨받은 지적만 봅니다"}
];

const EXAMPLES = [
  "비대면 계좌 신청 화면을 더 쉽게 고치고 싶어요",
  "청년 우대 체크카드 홍보물 시안이 필요합니다",
  "약관 동의 화면 문구를 검토받고 싶어요"
];

/** 새 프로젝트 — 무엇부터 눌러야 할지 고민하지 않게, 한 줄 적거나 타일 하나 고르는 것으로 시작한다. */
function NewProjectScreen({go}){
  const [phase,setPhase] = React.useState("start");
  const [text,setText] = React.useState("");
  const [kind,setKind] = React.useState(null);
  const [picked,setPicked] = React.useState(["김민준","이준호","박선영"]);
  const [due,setDue] = React.useState("9월 12일");
  const toggle = n => setPicked(picked.includes(n) ? picked.filter(x=>x!==n) : [...picked,n]);
  const begin = k => { if(k) setKind(k); setPhase("detail"); };
  const ready = text.trim() || kind;

  if(phase==="start") return (
    <div style={{minHeight:"100%",background:"var(--surface-canvas)",display:"flex",flexDirection:"column"}}>
      <TopBar title="위드캔버스" logoSrc="../../assets/nh-symbol-bank.jpg" user="김민준"
        note="언제든 그만두고 나중에 이어서 할 수 있습니다"
        right={<Button size="sm" onClick={()=>go("list")}>내가 맡은 일</Button>} />

      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"var(--sp-12) var(--pad-page)"}}>
        <p style={{font:"var(--type-label)",color:"var(--nh-blue)",marginBottom:"var(--sp-3)"}}>새 프로젝트</p>
        <h1 style={{fontSize:"var(--fs-display)",lineHeight:"var(--lh-display)",textAlign:"center",marginBottom:"var(--sp-3)"}}>
          무엇을 함께 만들까요
        </h1>
        <p style={{color:"var(--text-muted)",textAlign:"center",maxWidth:600,marginBottom:"var(--sp-8)"}}>
          한 줄로 적어도 되고, 아래에서 하나 고르셔도 됩니다. 무엇을 적을지 모르겠으면 예시를 눌러보세요.
        </p>

        <div style={{width:"100%",maxWidth:760,background:"var(--surface-card)",border:"1px solid var(--border-default)",borderRadius:"var(--r-xl)",boxShadow:"var(--sh-card)",padding:"var(--sp-5)"}}>
          <textarea value={text} onChange={e=>setText(e.target.value)} rows={2}
            placeholder="하고 싶은 일을 그대로 적어주세요. 업무에서 쓰는 말이면 됩니다"
            style={{width:"100%",border:"none",outline:"none",resize:"none",font:"var(--type-body)",fontSize:"17px",lineHeight:1.6,color:"var(--text-body)",background:"transparent"}} />
          <div style={{display:"flex",alignItems:"center",gap:"var(--gap-inline)",marginTop:"var(--sp-4)"}}>
            <Button size="sm" onClick={()=>go("files")}><Icon name="paperclip" size={15} />자료 붙이기</Button>
            <Button size="sm"><Icon name="mic" size={15} />말로 하기</Button>
            <Button tone="primary" size="md" disabled={!ready} style={{marginLeft:"auto"}} onClick={()=>begin(null)}>
              시작하기<Icon name="arrow-right" size={15} />
            </Button>
          </div>
        </div>

        <div style={{display:"flex",gap:"var(--gap-inline)",flexWrap:"wrap",justifyContent:"center",marginTop:"var(--sp-4)",maxWidth:760}}>
          {EXAMPLES.map(e=>
            <button key={e} type="button" onClick={()=>setText(e)} style={{
              padding:"7px 13px",borderRadius:"var(--r-pill)",cursor:"pointer",
              background:"transparent",border:"1px solid var(--border-default)",
              font:"var(--type-caption)",color:"var(--text-body)",transition:"var(--transition-control)"
            }}>{e}</button>)}
        </div>
      </div>

      <div style={{background:"var(--surface-card)",borderTop:"1px solid var(--border-hairline)",padding:"var(--sp-6) var(--pad-page)"}}>
        <div style={{maxWidth:"var(--content-max)",margin:"0 auto",display:"flex",gap:"var(--sp-8)",flexWrap:"wrap",justifyContent:"center"}}>
          {GROUPS.map(g=>
            <div key={g.group} style={{display:"flex",flexDirection:"column",gap:"var(--sp-3)"}}>
              <p style={{font:"var(--type-caption)",color:"var(--text-muted)",textAlign:"center"}}>{g.group}</p>
              <div style={{display:"flex",gap:"var(--sp-2)"}}>
                {g.items.map(it=>
                  <button key={it.label} type="button" title={it.hint} onClick={()=>begin(it.label)} style={{
                    width:112,padding:"var(--sp-4) var(--sp-2)",cursor:"pointer",textAlign:"center",
                    background:"transparent",border:"1px solid transparent",borderRadius:"var(--r-card)",
                    transition:"var(--transition-control)"
                  }}>
                    <span style={{display:"flex",justifyContent:"center",color:"var(--nh-blue)",marginBottom:8}}>
                      <Icon name={it.icon} size={22} />
                    </span>
                    <span style={{display:"block",font:"var(--type-label)",color:"var(--text-title)"}}>{it.label}</span>
                    <span style={{display:"block",font:"var(--type-caption)",color:"var(--text-muted)",marginTop:3}}>{it.hint}</span>
                  </button>)}
              </div>
            </div>)}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100%",background:"var(--surface-canvas)",display:"flex",flexDirection:"column"}}>
      <TopBar title="새 프로젝트" crumb="함께 볼 사람과 기한" logoSrc="../../assets/nh-symbol-bank.jpg" user="김민준"
        note="여기까지 저장됩니다"
        right={<Button size="sm" onClick={()=>setPhase("start")}>이전</Button>} />

      <div style={{flex:1,maxWidth:820,width:"100%",margin:"0 auto",padding:"var(--sp-12) var(--pad-page)",display:"flex",flexDirection:"column",gap:"var(--sp-4)"}}>
        <Card surface="ai" style={{display:"flex",gap:"var(--sp-4)",alignItems:"flex-start"}}>
          <Badge tone="ai">AI</Badge>
          <div>
            <p style={{font:"var(--type-caption)",color:"var(--text-muted)",marginBottom:4}}>이렇게 알아들었습니다</p>
            <p style={{font:"var(--type-body)",fontWeight:700,color:"var(--text-title)"}}>
              {kind ? `${kind} 작업입니다.` : "화면 작업입니다."} {text.trim() ? `"${text.trim()}"` : "자세한 내용은 다음 단계에서 물어봅니다."}
            </p>
          </div>
        </Card>

        <Card>
          <Field label="이 일을 뭐라고 부를까요"
            defaultValue={kind ? `${kind} 개선` : "비대면 계좌 신청 개선"}
            assist="나중에 검색할 때 쓰는 이름입니다. 사내에서 부르는 말 그대로 적으세요" />
        </Card>

        <Card>
          <p style={{font:"var(--type-label)",color:"var(--text-title)",marginBottom:4}}>누가 함께 봅니까</p>
          <p style={{font:"var(--type-caption)",color:"var(--text-faint)",marginBottom:"var(--sp-4)"}}>
            역할이 화면을 나눕니다. 개발 담당자에게는 결정 버튼이 보이지 않고, 준법 담당자에게는 넘겨받은 지적만 보입니다.
          </p>
          <div style={{display:"flex",flexDirection:"column",gap:"var(--sp-2)"}}>
            {MEMBERS.map((m,i)=>{
              const on = picked.includes(m.name);
              return (
                <button key={m.name} type="button" onClick={()=>toggle(m.name)} style={{
                  display:"flex",alignItems:"center",gap:"var(--sp-3)",padding:"var(--sp-3) var(--sp-4)",cursor:"pointer",
                  textAlign:"left",borderRadius:"var(--r-control)",transition:"var(--transition-control)",
                  background:on?"var(--blue-50)":"var(--white)",
                  border:on?"var(--bw-emphasis) solid var(--nh-blue)":"1px solid var(--border-default)"
                }}>
                  <Avatar name={m.name} index={i} />
                  <span style={{font:"var(--type-label)",color:"var(--text-title)",width:70}}>{m.name}</span>
                  <Badge tone={on?"info":"neutral"}>{m.role}</Badge>
                  <span style={{font:"var(--type-caption)",color:"var(--text-faint)"}}>{m.note}</span>
                  {on ? <Icon name="check" size={16} color="var(--nh-blue)" style={{marginLeft:"auto"}} /> : null}
                </button>
              );
            })}
          </div>
        </Card>

        <Card>
          <p style={{font:"var(--type-label)",color:"var(--text-title)",marginBottom:"var(--sp-3)"}}>언제까지 의견을 받을까요</p>
          <div style={{display:"flex",gap:"var(--gap-inline)",flexWrap:"wrap"}}>
            {["9월 12일","9월 19일","9월 26일","정하지 않음"].map(d=>
              <Chip key={d} selected={due===d} onClick={()=>setDue(d)}>{d}</Chip>)}
          </div>
        </Card>
      </div>

      <div style={{background:"var(--surface-card)",borderTop:"1px solid var(--border-hairline)",padding:"var(--sp-5) var(--pad-page)",display:"flex",alignItems:"center",gap:"var(--sp-4)"}}>
        <p style={{font:"var(--type-caption)",color:"var(--text-muted)",maxWidth:560}}>
          함께 보는 사람 {picked.length}명 · {due}까지. 다음 단계에서 참고자료를 올리면 AI가 그것부터 읽습니다.
        </p>
        <Button tone="primary" size="lg" style={{marginLeft:"auto"}} onClick={()=>go("files")}>만들고 자료 올리기</Button>
      </div>
    </div>
  );
}
Object.assign(window, { NewProjectScreen });
